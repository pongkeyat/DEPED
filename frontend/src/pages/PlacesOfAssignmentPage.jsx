import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import {
  archiveAssignmentMasterRecord,
  createAssignmentMasterRecord,
  getAssignmentMasterRecords,
  restoreAssignmentMasterRecord,
  updateAssignmentMasterRecord,
} from "../api/AssignmentApi";

export default function PlacesOfAssignmentPage() {
  const type = "places";
  const title = "Places of Assignment";
  const description = "Manage the places of assignment available when posting vacancies.";
  const idField = "place_id";
  const nameField = "place_name";
  const inputLabel = "Place of Assignment";
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAssignmentMasterRecords(type, true);
      setRecords(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Unable to load ${title.toLowerCase()}. Check the API server.`,
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [type, title]);

  useEffect(() => {
    let isCurrent = true;

    getAssignmentMasterRecords(type, true)
      .then((result) => {
        if (!isCurrent) return;
        setRecords(Array.isArray(result) ? result : []);
        setError("");
      })
      .catch((err) => {
        if (!isCurrent) return;
        setError(
          err.response?.data?.message ||
            `Unable to load ${title.toLowerCase()}. Check the API server.`,
        );
        setRecords([]);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [type, title]);

  const resetForm = () => {
    setName("");
    setEditingRecord(null);
    setFormOpen(false);
  };

  const handleAdd = () => {
    setName("");
    setEditingRecord(null);
    setError("");
    setNotice("");
    setConfirmation(null);
    setFormOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setName(record[nameField] || "");
    setError("");
    setNotice("");
    setConfirmation(null);
    setFormOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleanName = name.trim();

    if (!cleanName) {
      setError(`${inputLabel} is required.`);
      return;
    }

    setError("");
    setNotice("");
    setConfirmation({
      action: editingRecord ? "edit" : "create",
      name: cleanName,
      record: editingRecord,
    });
  };

  const handleConfirm = async () => {
    if (!confirmation || saving) return;

    const { action, name: confirmedName, record } = confirmation;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (action === "create") {
        await createAssignmentMasterRecord(type, confirmedName);
        setNotice(`${inputLabel} added successfully.`);
        resetForm();
      } else if (action === "edit") {
        await updateAssignmentMasterRecord(type, record[idField], confirmedName);
        setNotice(`${inputLabel} updated successfully.`);
        resetForm();
      } else if (action === "archive") {
        await archiveAssignmentMasterRecord(type, record[idField]);
        setRecords((currentRecords) =>
          currentRecords.map((currentRecord) =>
            currentRecord[idField] === record[idField]
              ? { ...currentRecord, is_archived: true, status: "Archived" }
              : currentRecord,
          ),
        );
        setNotice(`${inputLabel} archived successfully.`);
        if (editingRecord?.[idField] === record[idField]) resetForm();
      } else {
        await restoreAssignmentMasterRecord(type, record[idField]);
        setRecords((currentRecords) =>
          currentRecords.map((currentRecord) =>
            currentRecord[idField] === record[idField]
              ? { ...currentRecord, is_archived: false, status: "Active" }
              : currentRecord,
          ),
        );
        setNotice(`${inputLabel} restored successfully.`);
      }

      setConfirmation(null);
      if (action === "create" || action === "edit") await loadRecords();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Unable to ${action} ${inputLabel.toLowerCase()}.`,
      );
      setConfirmation(null);
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = records.filter(
    (record) =>
      String(record[nameField] || "").toLowerCase().includes(search.toLowerCase()),
  );
  const action = confirmation?.action;
  const confirmationTitle = {
    create: `Add ${inputLabel}`,
    edit: `Confirm ${inputLabel} Update`,
    archive: `Archive ${inputLabel}`,
    restore: `Restore ${inputLabel}`,
  }[action];
  const confirmationMessage = {
    create: `Are you sure you want to add this ${inputLabel.toLowerCase()}?`,
    edit: `Are you sure you want to update this ${inputLabel.toLowerCase()}?`,
    archive: `Are you sure you want to archive this ${inputLabel.toLowerCase()}? It will no longer appear in vacancy forms.`,
    restore: `Are you sure you want to restore this ${inputLabel.toLowerCase()}? It will become available in vacancy forms again.`,
  }[action];
  const confirmButtonLabel = {
    create: "Confirm Add",
    edit: "Confirm Update",
    archive: "Confirm Archive",
    restore: "Confirm Restore",
  }[action];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add {inputLabel}
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {notice}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  #
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Name
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    Loading records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => {
                  const isArchived = Boolean(record.is_archived);

                  return (
                    <tr key={record[idField]} className="transition hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{record[nameField]}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            isArchived
                              ? "bg-gray-100 text-gray-600"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isArchived ? "Archived" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {isArchived ? (
                            <button
                              type="button"
                              onClick={() => setConfirmation({ action: "restore", record })}
                              disabled={saving}
                              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                              title={`Restore ${inputLabel}`}
                            >
                              <RotateCcw size={17} />
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEdit(record)}
                                className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                title={`Edit ${inputLabel}`}
                                aria-label={`Edit ${record[nameField]}`}
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmation({ action: "archive", record })}
                                disabled={saving}
                                className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
                                title={`Archive ${inputLabel}`}
                                aria-label={`Archive ${record[nameField]}`}
                              >
                                <Archive size={17} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assignment-form-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 id="assignment-form-title" className="text-lg font-semibold text-gray-900">
                  {editingRecord ? `Edit ${inputLabel}` : `Add ${inputLabel}`}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {editingRecord
                    ? `Update the ${inputLabel.toLowerCase()} details below.`
                    : `Enter the details for the new ${inputLabel.toLowerCase()}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && resetForm()}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {error && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div>
                <label
                  htmlFor="assignment-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  {inputLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  id="assignment-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={200}
                  placeholder={`Enter ${inputLabel.toLowerCase()} name`}
                  required
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => !saving && resetForm()}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingRecord ? "Save Changes" : `Add ${inputLabel}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="assignment-confirmation-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                action === "archive"
                  ? "bg-amber-100 text-amber-700"
                  : action === "restore"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
              }`}
            >
              {action === "archive" ? (
                <Archive size={22} />
              ) : action === "restore" ? (
                <RotateCcw size={22} />
              ) : action === "create" ? (
                <Plus size={22} />
              ) : (
                <AlertTriangle size={22} />
              )}
            </div>
            <h2 id="assignment-confirmation-title" className="text-lg font-semibold text-gray-900">
              {confirmationTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{confirmationMessage}</p>
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">
                {confirmation.name || confirmation.record?.[nameField]}
              </p>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              {action === "archive"
                ? "This record will remain in the system and can be restored later."
                : action === "restore"
                  ? "This record will be available for selection again."
                  : "Please verify the name before confirming."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => !saving && setConfirmation(null)}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                  action === "archive"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : action === "restore"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {saving
                  ? action === "archive"
                    ? "Archiving..."
                    : action === "restore"
                      ? "Restoring..."
                      : action === "edit"
                        ? "Updating..."
                        : "Adding..."
                  : confirmButtonLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
