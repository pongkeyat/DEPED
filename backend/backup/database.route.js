
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";

import {
    createDatabaseBackupController,
    getDatabaseBackupsController,
    downloadDatabaseBackupController,
    restoreDatabaseBackupController,
    restoreUploadedBackupController,
} from "./database.controller.js";
import { protect } from "../users/users.middleware.js";

const router = express.Router();

// ======================================================
// TEMPORARY UPLOAD DIRECTORY
// ======================================================

const uploadDirectory = path.join(
    os.tmpdir(),
    "deped-database-backup-uploads"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

// ======================================================
// MULTER CONFIGURATION
// ======================================================

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (_req, _file, callback) => {
        const uniqueName =
            `upload-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}.dump`;

        callback(null, uniqueName);
    },
});

const upload = multer({
    storage,

    limits: {
        fileSize: 1024 * 1024 * 1024,
        files: 1,
    },

    fileFilter: (_req, file, callback) => {
        if (
            path.extname(file.originalname).toLowerCase() !== ".dump"
        ) {
            return callback(null, false);
        }

        callback(null, true);
    },
});

const requireAdmin = (req, res, next) => {
    if (String(req.user?.role || "").trim().toLowerCase() !== "admin") {
        return res.status(403).json({
            message: "Administrator access is required for database operations.",
        });
    }

    next();
};

// ======================================================
// DATABASE BACKUP ROUTES
// ======================================================

router.use(protect, requireAdmin);

// POST /api/database/backup
router.post("/backup", createDatabaseBackupController);

// GET /api/database/backups
router.get("/backups", getDatabaseBackupsController);

// GET /api/database/backups/:filename/download
router.get(
    "/backups/:filename/download",
    downloadDatabaseBackupController
);

// POST /api/database/restore
router.post("/restore", restoreDatabaseBackupController);

// POST /api/database/restore/upload
router.post(
    "/restore/upload",
    upload.single("backupFile"),
    restoreUploadedBackupController
);

export default router;
