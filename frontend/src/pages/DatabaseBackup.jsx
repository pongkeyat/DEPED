import { useEffect, useRef, useState } from "react";
import {
    createDatabaseBackup,
    downloadDatabaseBackup,
    getDatabaseBackups,
    restoreDatabaseBackup,
    restoreUploadedDatabaseBackup,
} from "../api/databaseApi";

import BackupHeader from "../components/databaseBackup/BackupHeader";
import BackupList from "../components/databaseBackup/BackupList";
import RestoreConfirmModal from "../components/databaseBackup/RestoreConfirmModal";

const DatabaseBackup = () => {
    const [backups, setBackups] = useState([]);
    const restoreFileInput = useRef(null);

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState(false);

    const [selectedBackup, setSelectedBackup] = useState(null);

    const [message, setMessage] = useState({
        type: "",
        text: ""
    });

    // ======================================================
    // LOAD BACKUPS
    // ======================================================

    const loadBackups = async ({ clearMessage = true } = {}) => {
        try {
            setLoading(true);
            if (clearMessage) {
                setMessage({
                    type: "",
                    text: ""
                });
            }

            const result = await getDatabaseBackups();

            setBackups(result.backups || []);
            return true;
        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Failed to load database backups."
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {
        let isCurrent = true;

        getDatabaseBackups()
            .then((result) => {
                if (isCurrent) {
                    setBackups(result.backups || []);
                }
            })
            .catch((error) => {
                if (isCurrent) {
                    setMessage({
                        type: "error",
                        text:
                            error.response?.data?.message ||
                            "Failed to load database backups."
                    });
                }
            })
            .finally(() => {
                if (isCurrent) {
                    setLoading(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    // ======================================================
    // CREATE BACKUP
    // ======================================================

    const handleCreateBackup = async () => {
        let createdFilename = "";

        try {
            setCreating(true);
            setMessage({
                type: "",
                text: ""
            });

            let saveFileHandle = null;
            if (typeof window.showSaveFilePicker === "function") {
                saveFileHandle = await window.showSaveFilePicker({
                    suggestedName: "deped_database_backup.dump",
                    types: [
                        {
                            description: "PostgreSQL database backup",
                            accept: {
                                "application/octet-stream": [".dump"],
                            },
                        },
                    ],
                });
            }

            const result = await createDatabaseBackup();
            createdFilename = result.backup?.filename;
            if (!createdFilename) {
                throw new Error(
                    "The backup was created, but the server did not return its filename."
                );
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

            const refreshed = await loadBackups({ clearMessage: false });
            if (refreshed) {
                setMessage({
                    type: "success",
                    text: `${result.message || "Database backup created successfully."} The backup was saved to your selected location.`
                });
            }
        } catch (error) {
            if (error.name === "AbortError") return;

            setMessage({
                type: createdFilename ? "warning" : "error",
                text: createdFilename
                    ? `Backup ${createdFilename} was created on the server, but could not be saved to your device. ${error.response?.data?.message || error.message}`
                    : error.response?.data?.message ||
                        error.message ||
                        "Failed to create database backup."
            });
        } finally {
            setCreating(false);
        }
    };

    // ======================================================
    // OPEN RESTORE CONFIRMATION
    // ======================================================

    const handleRestoreClick = (backup) => {
        setSelectedBackup(backup);

        setMessage({
            type: "",
            text: ""
        });
    };

    // ======================================================
    // RESTORE BACKUP
    // ======================================================

    const handleConfirmRestore = async () => {
        if (!selectedBackup) return;

        try {
            setRestoring(true);

            setMessage({
                type: "",
                text: ""
            });

            const result = selectedBackup.source === "upload"
                ? await restoreUploadedDatabaseBackup(selectedBackup.file)
                : await restoreDatabaseBackup(selectedBackup.filename);

            setSelectedBackup(null);
            const refreshed = await loadBackups({ clearMessage: false });
            setMessage({
                type: refreshed ? "success" : "warning",
                text: refreshed
                    ? result.message || "Database restored successfully."
                    : `${result.message || "Database restored successfully."} The backup list could not be refreshed.`
            });
        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Failed to restore database backup."
            });
        } finally {
            setRestoring(false);
        }
    };

    // ======================================================
    // RESTORE FROM FILE EXPLORER
    // ======================================================

    const handleRestoreFileSelected = (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".dump")) {
            setMessage({
                type: "error",
                text: "Select a PostgreSQL .dump backup file."
            });
            return;
        }

        setMessage({
            type: "",
            text: ""
        });
        setSelectedBackup({
            source: "upload",
            filename: file.name,
            size: file.size,
            file
        });
    };

    const handleDownloadBackup = async (backup) => {
        try {
            const saveFileHandle =
                typeof window.showSaveFilePicker === "function"
                    ? await window.showSaveFilePicker({
                        suggestedName: backup.filename,
                        types: [
                            {
                                description: "PostgreSQL database backup",
                                accept: {
                                    "application/octet-stream": [".dump"],
                                },
                            },
                        ],
                    })
                    : null;

            const backupBlob = await downloadDatabaseBackup(backup.filename);
            if (saveFileHandle) {
                const writable = await saveFileHandle.createWritable();
                await writable.write(backupBlob);
                await writable.close();
            } else {
                const objectUrl = URL.createObjectURL(backupBlob);
                const downloadLink = document.createElement("a");
                downloadLink.href = objectUrl;
                downloadLink.download = backup.filename;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                downloadLink.remove();
                window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            }
        } catch (error) {
            if (error.name === "AbortError") return;

            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to download database backup."
            });
        }
    };

    // ======================================================
    // FORMAT FILE SIZE
    // ======================================================

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return "0 Bytes";

        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB"
        ];

        const index = Math.floor(
            Math.log(bytes) / Math.log(1024)
        );

        return `${(
            bytes / Math.pow(1024, index)
        ).toFixed(2)} ${units[index]}`;
    };

    // ======================================================
    // FORMAT DATE
    // ======================================================

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleString();
    };

    return (
        <div className="min-h-screen p-6">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* HEADER */}
                <BackupHeader
                    onCreateBackup={handleCreateBackup}
                    onBrowseRestore={() => restoreFileInput.current?.click()}
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

                {/* MESSAGE */}
                {message.text && (
                    <div
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

                {/* BACKUP LIST */}
                <BackupList
                    backups={backups}
                    loading={loading}
                    onRestore={handleRestoreClick}
                    onDownload={handleDownloadBackup}
                    formatFileSize={formatFileSize}
                    formatDate={formatDate}
                />

            </div>

            {/* RESTORE MODAL */}
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