import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================
// Draft storage in IndexedDB.
// IndexedDB (unlike localStorage) can store File objects, so uploaded
// documents survive a refresh / leaving the page too.
// ============================================================

const DB_NAME = "application-drafts";
const STORE = "drafts";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // drafts expire after 7 days

const openDb = () =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const run = async (mode, fn) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(req.result);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
};

const idbGet = (key) => run("readonly", (s) => s.get(key));
const idbSet = (key, value) => run("readwrite", (s) => s.put(value, key));
const idbDelete = (key) => run("readwrite", (s) => s.delete(key));

// Merge a saved draft over fresh defaults so fields added to the form
// after the draft was saved don't end up undefined.
export const mergeDraft = (base, saved) => {
  const out = { ...base };
  Object.keys(base).forEach((k) => {
    const b = base[k];
    const s = saved?.[k];
    if (s === undefined) return;

    const bothPlainObjects =
      b && typeof b === "object" && !Array.isArray(b) &&
      s && typeof s === "object" && !Array.isArray(s) &&
      !(s instanceof File);

    out[k] = bothPlainObjects ? { ...b, ...s } : s;
  });
  return out;
};

/**
 * Autosaves { formData, step } and restores it on the next visit.
 *
 *   const { ready, restored, clearDraft } = useFormDraft({
 *     key, formData, step, onRestore: (savedFormData, savedStep) => {...},
 *   });
 *
 * - Nothing is saved until the user actually changes something.
 * - Call clearDraft() right before you reset the form after a successful submit.
 */
export default function useFormDraft({
  key,
  formData,
  step,
  onRestore,
  delay = 400,
}) {
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);

  const timer = useRef(null);
  const pending = useRef(false);
  const skipNext = useRef(false);
  const baseline = useRef(undefined);
  const latest = useRef({ formData, step });
  const keyRef = useRef(key);
  const onRestoreRef = useRef(onRestore);

  latest.current = { formData, step };
  keyRef.current = key;
  onRestoreRef.current = onRestore;

  // ---- Load draft on mount (or when the key changes) ----
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setRestored(false);
    baseline.current = undefined;

    (async () => {
      try {
        const draft = await idbGet(key);
        if (cancelled) return;

        if (draft && Date.now() - draft.savedAt < MAX_AGE_MS) {
          onRestoreRef.current(draft.formData, draft.step);
          setRestored(true);
        } else if (draft) {
          idbDelete(key).catch(() => {});
        }
      } catch {
        // IndexedDB blocked (e.g. private mode): the form just works without drafts
      }
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [key]);

  // ---- Debounced autosave ----
  useEffect(() => {
    if (!ready) return;

    // First run after load = baseline (initial or just-restored). Don't save it.
    if (baseline.current === undefined) {
      baseline.current = { formData, step };
      return;
    }

    // Right after clearDraft() + reset: don't re-create an empty draft.
    if (skipNext.current) {
      skipNext.current = false;
      baseline.current = { formData, step };
      return;
    }

    if (
      formData === baseline.current.formData &&
      step === baseline.current.step
    ) {
      return;
    }

    pending.current = true;
    timer.current = setTimeout(() => {
      pending.current = false;
      idbSet(key, { formData, step, savedAt: Date.now() }).catch(() => {});
    }, delay);

    return () => clearTimeout(timer.current);
  }, [ready, key, formData, step, delay]);

  // ---- Flush a pending save when leaving the page ----
  useEffect(
    () => () => {
      if (pending.current) {
        pending.current = false;
        idbSet(keyRef.current, {
          ...latest.current,
          savedAt: Date.now(),
        }).catch(() => {});
      }
    },
    []
  );

  // ---- Delete the draft (after submit, or when the user discards it) ----
  const clearDraft = useCallback(async () => {
    clearTimeout(timer.current);
    pending.current = false;
    skipNext.current = true;
    setRestored(false);
    try {
      await idbDelete(keyRef.current);
    } catch {
      /* ignore */
    }
  }, []);

  return { ready, restored, clearDraft };
}