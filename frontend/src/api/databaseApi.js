import axios from "axios";

axios.defaults.withCredentials = true;

// ======================================================
// API ENDPOINTS
// ======================================================

const BACKUP_POST = import.meta.env.VITE_BACKUP_POST;
const BACKUP_GET = import.meta.env.VITE_BACKUP_GET;
const RESTORE_POST = import.meta.env.VITE_RESTORE_POST;


// ======================================================
// CREATE DATABASE BACKUP
// POST /api/database/backup
// ======================================================

export const createDatabaseBackup = async () => {
    try {
        const response = await axios.post(BACKUP_POST);

        return response.data;
    } catch (error) {
        console.error(
            "Create database backup error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ======================================================
// GET ALL DATABASE BACKUPS
// GET /api/database/backups
// ======================================================

export const getDatabaseBackups = async () => {
    try {
        const response = await axios.get(BACKUP_GET);

        return response.data;
    } catch (error) {
        console.error(
            "Get database backups error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ======================================================
// RESTORE DATABASE BACKUP
// POST /api/database/restore
// ======================================================

export const restoreDatabaseBackup = async (filename) => {
    try {
        const response = await axios.post(RESTORE_POST, {
            filename
        });

        return response.data;
    } catch (error) {
        console.error(
            "Restore database backup error:",
            error.response?.data || error.message
        );

        throw error;
    }
};