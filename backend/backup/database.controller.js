
import fs from "fs/promises";
import path from "path";
import {
    createDatabaseBackup,
    getDatabaseBackups,
    getDatabaseBackupPath,
    restoreDatabaseBackup,
} from "./database.service.js";

// ======================================================
// CREATE BACKUP
// ======================================================

export const createDatabaseBackupController = async (req, res) => {
    try {
        const backup = await createDatabaseBackup();

        return res.status(201).json({
            message: "Database backup created successfully.",
            backup,
        });
    } catch (error) {
        console.error("Create backup error:", error);

        return res.status(500).json({
            message: error.message || "Failed to create database backup.",
        });
    }
};

// ======================================================
// GET BACKUPS
// ======================================================

export const getDatabaseBackupsController = async (req, res) => {
    try {
        const backups = await getDatabaseBackups();

        return res.status(200).json({ backups });
    } catch (error) {
        console.error("Get backups error:", error);

        return res.status(500).json({
            message: error.message || "Failed to retrieve database backups.",
        });
    }
};

// ======================================================
// DOWNLOAD EXISTING BACKUP
// ======================================================

export const downloadDatabaseBackupController = async (req, res, next) => {
    try {
        const { filename } = req.params;
        const backupPath = await getDatabaseBackupPath(filename);

        return res.download(backupPath, filename, (error) => {
            if (!error) return;

            console.error("Download backup error:", error);

            if (res.headersSent) {
                return next(error);
            }

            return res.status(500).json({
                message: "Failed to download database backup.",
            });
        });
    } catch (error) {
        console.error("Download backup error:", error);

        const status = error.message === "Backup file not found."
            ? 404
            : 400;

        return res.status(status).json({
            message: error.message || "Failed to download database backup.",
        });
    }
};

// ======================================================
// RESTORE EXISTING BACKUP
// ======================================================

export const restoreDatabaseBackupController = async (req, res) => {
    try {
        const { filename } = req.body;

        const result = await restoreDatabaseBackup(filename);

        return res.status(200).json({
            message: "Database restored successfully.",
            ...result,
        });
    } catch (error) {
        console.error("Restore backup error:", error);

        return res.status(500).json({
            message: error.message || "Failed to restore database backup.",
        });
    }
};

// ======================================================
// RESTORE UPLOADED FILE
// ======================================================

export const restoreUploadedBackupController = async (req, res) => {
    let copiedBackupPath = null;
    let responseStatus = 500;

    try {
        if (!req.file) {
            responseStatus = 400;

            return res.status(400).json({
                message: "Please select a PostgreSQL .dump file.",
            });
        }

        const originalName = req.file.originalname || "";

        if (path.extname(originalName).toLowerCase() !== ".dump") {
            responseStatus = 400;

            return res.status(400).json({
                message: "Only .dump files are supported.",
            });
        }

        // Copy to the managed backup directory.
        const backupDirectory = path.resolve("backups");

        await fs.mkdir(backupDirectory, { recursive: true });

        const uploadedFilename =
            `external-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}.dump`;

        copiedBackupPath = path.join(
            backupDirectory,
            uploadedFilename
        );

        await fs.copyFile(req.file.path, copiedBackupPath);

        // Existing service creates the safety backup before restoring.
        const result = await restoreDatabaseBackup(uploadedFilename);

        responseStatus = 200;

        return res.status(200).json({
            message: "Uploaded database backup restored successfully.",
            filename: originalName,
            ...result,
        });
    } catch (error) {
        console.error("Uploaded backup restore error:", error);

        return res.status(responseStatus).json({
            message: error.message || "Failed to restore uploaded backup.",
        });
    } finally {
        if (req.file?.path) {
            await fs.unlink(req.file.path).catch(() => {});
        }

        if (copiedBackupPath) {
            await fs.unlink(copiedBackupPath).catch(() => {});
        }
    }
};
