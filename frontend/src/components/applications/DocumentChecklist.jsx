import React, { useEffect, useState } from "react";

const EXT_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
};

const guessType = (nameOrUrl = "") => {
  const clean = String(nameOrUrl).split("?")[0].split("#")[0];
  const ext = clean.includes(".") ? clean.split(".").pop().toLowerCase() : "";
  return EXT_TYPES[ext] || "";
};

/**
 * In-app preview for images and PDFs. Never opens a new browser tab.
 *
 *   <DocumentPreviewModal file={fileOrNull} onClose={() => ...} />
 *
 * `file` can be:
 *   - a File object (just uploaded in the browser)
 *   - { url, name?, type? } for a file already stored on the server
 *   - an ARRAY of either: shows previous / next buttons
 */
export default function DocumentPreviewModal({ file, onClose }) {
  const list = Array.isArray(file) ? file : file ? [file] : [];

  const [index, setIndex] = useState(0);
  const [src, setSrc] = useState(null);
  const [mime, setMime] = useState("");
  const [loading, setLoading] = useState(false);

  // Start at the first file whenever a new file / list is opened
  useEffect(() => {
    setIndex(0);
  }, [file]);

  const safeIndex = Math.min(index, Math.max(list.length - 1, 0));
  const current = list[safeIndex] ?? null;

  const isLocalFile = typeof File !== "undefined" && current instanceof File;
  const url = !isLocalFile ? current?.url : null;

  const title =
    current?.name ||
    (url ? decodeURIComponent(String(url).split("?")[0].split("/").pop()) : "");

  // ---- Load the current file into a displayable source ----
  useEffect(() => {
    if (!current) {
      setSrc(null);
      setMime("");
      return;
    }

    let cancelled = false;
    let objectUrl = null;

    if (isLocalFile) {
      objectUrl = URL.createObjectURL(current);
      setSrc(objectUrl);
      setMime(current.type || guessType(current.name));
      return () => URL.revokeObjectURL(objectUrl);
    }

    if (url) {
      setLoading(true);
      setSrc(null);

      // Download as a blob first (avoids servers blocking PDFs inside a frame)
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load file");
          return res.blob();
        })
        .then((blob) => {
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
          setMime(blob.type || current.type || guessType(url));
        })
        .catch(() => {
          // Fallback: use the address directly
          if (cancelled) return;
          setSrc(url);
          setMime(current.type || guessType(url));
        })
        .finally(() => !cancelled && setLoading(false));
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [current, isLocalFile, url]);

  // ---- Keyboard: Esc closes, arrows switch files ----
  useEffect(() => {
    if (list.length === 0) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, list.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [list.length, onClose]);

  if (!current) return null;

  const isImage = mime.startsWith("image/");
  const isPdf = mime === "application/pdf";
  const hasMany = list.length > 1;

  const navButton =
    "rounded-lg px-3 py-1 text-sm hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 bg-[#1E3E74] px-5 py-3 text-white">
          <span className="truncate font-semibold">{title}</span>

          <div className="flex shrink-0 items-center gap-1">
            {hasMany && (
              <>
                <button
                  type="button"
                  className={navButton}
                  disabled={safeIndex === 0}
                  onClick={() => setIndex(safeIndex - 1)}
                  aria-label="Previous file"
                >
                  ◀
                </button>

                <span className="text-sm tabular-nums">
                  {safeIndex + 1} / {list.length}
                </span>

                <button
                  type="button"
                  className={navButton}
                  disabled={safeIndex === list.length - 1}
                  onClick={() => setIndex(safeIndex + 1)}
                  aria-label="Next file"
                >
                  ▶
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded-lg px-3 py-1 text-sm hover:bg-white/20"
            >
              Close ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          {loading && (
            <p className="py-16 text-center text-slate-500">Loading preview...</p>
          )}

          {!loading && src && isImage && (
            <img
              src={src}
              alt={title}
              className="mx-auto max-h-[75vh] rounded-lg object-contain"
            />
          )}

          {!loading && src && isPdf && (
            <iframe
              src={src}
              title={title}
              className="h-[75vh] w-full rounded-lg bg-white"
            />
          )}

          {!loading && (!src || (!isImage && !isPdf)) && (
            <p className="py-16 text-center text-slate-600">
              Preview is not available for this file type.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}