import { useEffect, useState } from "react";
import {
    createDatabaseBackup,
    getDatabaseBackups,
    restoreDatabaseBackup
} from "../api/databaseApi";

import BackupHeader from "../components/databaseBackup/BackupHeader";
import BackupList from "../components/databaseBackup/BackupList";
import RestoreConfirmModal from "../components/databaseBackup/RestoreConfirmModal";

const DatabaseBackup = () => {
    const [backups, setBackups] = useState([]);

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

    const loadBackups = async () => {
        try {
            setLoading(true);
            setMessage({
                type: "",
                text: ""
            });

            const result = await getDatabaseBackups();

            setBackups(result.backups || []);
        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Failed to load database backups."
            });
        } finally {
            setLoading(false);
        }
    };

    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {
        loadBackups();
    }, []);

    // ======================================================
    // CREATE BACKUP
    // ======================================================

    const handleCreateBackup = async () => {
        try {
            setCreating(true);

            setMessage({
                type: "",
                text: ""
            });

            const result = await createDatabaseBackup();

            setMessage({
                type: "success",
                text:
                    result.message ||
                    "Database backup created successfully."
            });

            await loadBackups();
        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
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

            const result = await restoreDatabaseBackup(
                selectedBackup.filename
            );

            setMessage({
                type: "success",
                text:
                    result.message ||
                    "Database restored successfully."
            });

            setSelectedBackup(null);

            await loadBackups();
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
        <div className="min-h-screen bg-gray-50 p-6">

            <div className="mx-auto max-w-7xl">

                {/* HEADER */}
                <BackupHeader
                    onCreateBackup={handleCreateBackup}
                    creating={creating}
                />

                {/* MESSAGE */}
                {message.text && (
                    <div
                        className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
                            message.type === "success"
                                ? "border-green-200 bg-green-50 text-green-700"
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