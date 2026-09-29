import {
    createDatabaseBackup,
    getDatabaseBackups,
    restoreDatabaseBackup
} from "../backup/database.service.js";

// ======================================================
// CREATE BACKUP
// ======================================================

export const backupDatabase = async (req, res) => {

    try {

        const backup =
            await createDatabaseBackup();

        res.status(201).json({

            success: true,

            message:
                "Database backup created successfully.",

            backup
        });

    } catch (error) {

        console.error(
            "Database backup error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to create database backup.",

            error: error.message
        });
    }
};

// ======================================================
// GET BACKUPS
// ======================================================

export const getBackups = async (req, res) => {

    try {

        const backups =
            await getDatabaseBackups();

        res.status(200).json({

            success: true,

            backups
        });

    } catch (error) {

        console.error(
            "Get backups error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to retrieve database backups.",

            error: error.message
        });
    }
};

// ======================================================
// RESTORE BACKUP
// ======================================================

export const restoreBackup = async (req, res) => {
    try {
        const { filename } = req.body || {};

        if (!filename) {
            return res.status(400).json({
                success: false,
                message: "Backup filename is required."
            });
        }

        const result = await restoreDatabaseBackup(filename);

        return res.status(200).json({
            success: true,
            message: "Database restored successfully.",
            restore: result
        });

    } catch (error) {
        console.error("Database restore error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};