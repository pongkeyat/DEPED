
import axios from "axios";

const BACKUP_POST = import.meta.env.VITE_BACKUP_POST;
const BACKUP_GET = import.meta.env.VITE_BACKUP_GET;
const RESTORE_POST = import.meta.env.VITE_RESTORE_POST;

// Create a new database backup
export const createDatabaseBackup = async () => {
    const response = await axios.post(BACKUP_POST, {}, {
        withCredentials: true
    });
    return response.data;
};

// Retrieve all existing backups
export const getDatabaseBackups = async () => {
    const response = await axios.get(BACKUP_GET, {
        withCredentials: true
    });
    return response.data;
};

// Download a backup stored on the server
export const downloadDatabaseBackup = async (filename) => {
    const response = await axios.get(
        `${BACKUP_GET}/${encodeURIComponent(filename)}/download`,
        {
            responseType: "blob",
            withCredentials: true
        }
    );

    return response.data;
};

// Restore a backup already saved on the server
export const restoreDatabaseBackup = async (filename) => {
    const response = await axios.post(RESTORE_POST, {
        filename,
    }, {
        withCredentials: true
    });

    return response.data;
};

// Upload and restore a .dump file selected from File Explorer
export const restoreUploadedDatabaseBackup = async (file) => {
    const formData = new FormData();

    formData.append("backupFile", file);

    const response = await axios.post(
        `${RESTORE_POST}/upload`,
        formData,
        { withCredentials: true }
    );

    return response.data;
};
