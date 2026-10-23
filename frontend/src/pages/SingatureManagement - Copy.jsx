import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, RefreshCw, Save, Users, UserRound, Crown } from "lucide-react";
import { getAllUsers } from "../api/AuthApi";

const STORAGE_KEY = "deped_hrmpsb_signature_settings_v1";
const POSITION_MEMBER = "HRMPSB Member";
const POSITION_CHAIR = "HRMPSB Chairperson";

const getUserList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.users)) return response.users;
  if (Array.isArray(response?.data?.users)) return response.data.users;
  return [];
};

const getUserId = (user) => user?.id ?? user?.user_id ?? user?.users_id;
const isArchived = (user) =>
  user?.is_archived === true ||
  user?.is_archived === 1 ||
  String(user?.is_archived).toLowerCase() === "true";
const getFullName = (user) =>
  [user?.first_name, user?.middle_name, user?.last_name, user?.suffix]
    .filter(Boolean)
    .join(" ") || user?.full_name || user?.name || "Unnamed user";

const readSettings = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export default function SignatureManagement({ onMembersChanged }) {
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(() => readSettings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAllUsers();
      setUsers(getUserList(response));
    } catch (err) {
      console.error("Failed to load HRMPSB users:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const hrmpsbUsers = useMemo(() => {
    const active = users.filter(
      (user) => String(user?.role || "").trim().toLowerCase() === "hrmpsb" && !isArchived(user)
    );
    return [...active].sort((a, b) => {
      const aId = String(getUserId(a) ?? "");
      const bId = String(getUserId(b) ?? "");
      const aOrder = Number(settings[aId]?.order ?? 9999);
      const bOrder = Number(settings[bId]?.order ?? 9999);
      return aOrder - bOrder || getFullName(a).localeCompare(getFullName(b));
    });
  }, [users, settings]);

  const members = useMemo(
    () => hrmpsbUsers.map((user, index) => {
      const id = String(getUserId(user) ?? "");
      const saved = settings[id] || {};
      return {
        id: getUserId(user),
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        full_name: getFullName(user),
        email: user.email || "",
        position: saved.position || POSITION_MEMBER,
        order: index + 1,
      };
    }),
    [hrmpsbUsers, settings]
  );

  const updateMember = (id, changes) => {
    setSettings((previous) => ({
      ...previous,
      [String(id)]: { ...(previous[String(id)] || {}), ...changes },
    }));
    setNotice("");
  };

  const moveMember = (index, direction) => {
    const next = [...members];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setSettings((previous) => {
      const updated = { ...previous };
      next.forEach((member, order) => {
        const id = String(member.id);
        updated[id] = { ...(updated[id] || {}), order: order + 1 };
      });
      return updated;
    });
    setNotice("");
  };

  const handleSave = () => {
    try {
      setSaving(true);
      const normalized = { ...settings };
      members.forEach((member, index) => {
        const id = String(member.id);
        normalized[id] = {
          ...(normalized[id] || {}),
          position: normalized[id]?.position || POSITION_MEMBER,
          order: index + 1,
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      setSettings(normalized);
      setNotice("HRMPSB member positions and print order saved on this browser.");
      onMembersChanged?.(members.map((member, index) => ({
        ...member,
        position: normalized[String(member.id)]?.position || POSITION_MEMBER,
        order: index + 1,
      })));
    } catch (err) {
      console.error("Unable to save signature settings:", err);
      setError("Could not save settings in this browser.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      "Reset all HRMPSB positions and ordering to the defaults?"
    );
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    setSettings({});
    setNotice("Positions and order reset to defaults.");
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Signature Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the names, roles, and printed order of HRMPSB members for CAR forms.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={fetchUsers} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button type="button" onClick={handleSave} disabled={loading || saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            <Save size={16} /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Users size={22} /></div>
          <div><p className="text-sm text-gray-500">Active HRMPSB Members</p><p className="text-2xl font-bold text-gray-900">{members.length}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Crown size={22} /></div>
          <div><p className="text-sm text-gray-500">Assigned Chairperson</p><p className="text-base font-semibold text-gray-900">{members.find((member) => member.position === POSITION_CHAIR)?.full_name || "Not assigned"}</p></div>
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">HRMPSB Members</h2>
          <p className="mt-1 text-sm text-gray-500">Only active accounts with role <code>hrmpsb</code> are listed. Use the arrows to set the print order.</p>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading HRMPSB members...</div>
        ) : members.length === 0 ? (
          <div className="px-6 py-12 text-center"><UserRound className="mx-auto mb-3 text-gray-400" size={30} /><p className="font-medium text-gray-800">No active HRMPSB members found</p><p className="mt-1 text-sm text-gray-500">Check that user accounts have the role <code>hrmpsb</code>.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Member</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">CAR Position</th><th className="px-5 py-3 text-right">Reorder</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((member, index) => (
                  <tr key={member.id ?? member.email ?? member.full_name} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm font-semibold text-gray-600">{index + 1}</td>
                    <td className="px-5 py-4"><div className="font-medium text-gray-900">{member.full_name}</div><div className="mt-1 text-xs text-gray-500">User ID: {member.id ?? "N/A"}</div></td>
                    <td className="px-5 py-4 text-sm text-gray-600">{member.email || "—"}</td>
                    <td className="px-5 py-4"><select value={member.position} onChange={(event) => updateMember(member.id, { position: event.target.value })} className="w-full min-w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"><option value={POSITION_MEMBER}>{POSITION_MEMBER}</option><option value={POSITION_CHAIR}>{POSITION_CHAIR}</option></select></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-1"><button type="button" onClick={() => moveMember(index, -1)} disabled={index === 0} aria-label={`Move ${member.full_name} up`} title="Move up" className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp size={16} /></button><button type="button" onClick={() => moveMember(index, 1)} disabled={index === members.length - 1} aria-label={`Move ${member.full_name} down`} title="Move down" className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown size={16} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col justify-between gap-3 border-t border-gray-200 bg-gray-50 px-5 py-3 sm:flex-row sm:items-center"><p className="text-xs text-gray-500">Settings are stored in this browser only; no signatures are collected or uploaded.</p><button type="button" onClick={handleReset} className="inline-flex items-center justify-center gap-2 self-start text-sm font-medium text-red-600 hover:text-red-800 sm:self-auto"><RefreshCw size={14} /> Reset settings</button></div>
      </div>
    </div>
  );
}
