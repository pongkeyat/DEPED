import { useRef, useState } from "react";
import {
  createDatabaseBackup,
  downloadDatabaseBackup,
  restoreUploadedDatabaseBackup,
} from "../api/databaseApi";

import BackupHeader from "../components/databaseBackup/BackupHeader";
import RestoreConfirmModal from "../components/databaseBackup/RestoreConfirmModal";

const DatabaseBackup = () => {
  const restoreFileInput = useRef(null);

  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // Create a database backup and save it to the user's device.
  const handleCreateBackup = async () => {
    let createdFilename = "";

    try {
      setCreating(true);
      setMessage({ type: "", text: "" });

      const result = await createDatabaseBackup();
      createdFilename = result.backup?.filename;

      if (!createdFilename) {
        throw new Error(
          "The backup was created, but the server did not return its filename.",
        );
      }

      let saveFileHandle = null;
      if (typeof window.showSaveFilePicker === "function") {
        saveFileHandle = await window.showSaveFilePicker({
          suggestedName: createdFilename,
          types: [
            {
              description: "PostgreSQL database backup",
              accept: { "application/octet-stream": [".dump"] },
            },
          ],
        });
      }

      const backupBlob = await downloadDatabaseBackup(createdFilename);

      if (saveFileHandle) {
        const writable = await saveFileHandle.createWritable();
        await writable.write(backupBlob);
        await writable.close();
      } else {
        const objectUrl = URL.createObjectURL(backupBlob);
        const downloadLink = document.createElement("a");
        downloadLink.href = objectUrl;
        downloadLink.download = createdFilename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }

      setMessage({
        type: "success",
        text: "Database backup created and saved to your device.",
      });
    } catch (error) {
      if (error.name === "AbortError") {
        setMessage({
          type: "warning",
          text: createdFilename
            ? `Backup ${createdFilename} was created on the server but was not saved to your device.`
            : "",
        });
        return;
      }

      setMessage({
        type: createdFilename ? "warning" : "error",
        text: createdFilename
          ? `Backup ${createdFilename} was created on the server, but could not be saved to your device. ${error.response?.data?.message || error.message}`
          : error.response?.data?.message ||
            error.message ||
            "Failed to create database backup.",
      });
    } finally {
      setCreating(false);
    }
  };

  // Open the operating system's file picker.
  const handleBrowseRestore = () => {
    setMessage({ type: "", text: "" });
    restoreFileInput.current?.click();
  };

  const handleRestoreFileSelected = (event) => {
    const file = event.target.files?.[0];
    // Reset input so the same file can be selected again if needed.
    event.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".dump")) {
      setMessage({
        type: "error",
        text: "Please select a PostgreSQL .dump backup file.",
      });
      return;
    }

    setMessage({ type: "", text: "" });
    setSelectedBackup({
      source: "upload",
      filename: file.name,
      size: file.size,
      file,
    });
  };

  // Restore only after the user confirms the selected file.
  const handleConfirmRestore = async () => {
    if (!selectedBackup?.file) return;

    try {
      setRestoring(true);
      setMessage({ type: "", text: "" });

      const result = await restoreUploadedDatabaseBackup(selectedBackup.file);
      setSelectedBackup(null);
      setMessage({
        type: "success",
        text: result.message || "Database restored successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to restore database backup.",
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <BackupHeader
          onCreateBackup={handleCreateBackup}
          onBrowseRestore={handleBrowseRestore}
          creating={creating}
          restoring={restoring}
        />

        <input
          ref={restoreFileInput}
          type="file"
          accept=".dump,application/octet-stream"
          className="hidden"
          onChange={handleRestoreFileSelected}
        />

        {message.text && (
          <div
            role="alert"
            className={`rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : message.type === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Restore database from file
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Choose a PostgreSQL <code>.dump</code> backup from your computer.
            The available-backups list has been removed. You will be asked to
            confirm before the selected file is uploaded and restored.
          </p>
        </div>

        <button
          type="button"
          onClick={handleBrowseRestore}
          disabled={restoring || creating}
          className="shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {restoring ? "Restoring..." : "Choose backup file"}
        </button>
      </div>
    </div>
      </div>

      {selectedBackup && (
        <RestoreConfirmModal
          backup={selectedBackup}
          restoring={restoring}
          onCancel={() => setSelectedBackup(null)}
          onConfirm={handleConfirmRestore}
        />
      )}
    </div>
  );
};

export default DatabaseBackup;
