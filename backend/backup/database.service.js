
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execFileAsync = promisify(execFile);

// ======================================================
// POSTGRESQL EXECUTABLES
// ======================================================

const PG_BIN = String.raw`C:\Program Files\PostgreSQL\18\bin`;

const PG_DUMP = path.join(PG_BIN, "pg_dump.exe");
const PG_RESTORE = path.join(PG_BIN, "pg_restore.exe");

// ======================================================
// DATABASE CONFIGURATION
// ======================================================

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || "5432";
const DB_NAME = process.env.DB_NAME || "deped";
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASSWORD = process.env.DB_PASSWORD;

// ======================================================
// BACKUP DIRECTORY
// ======================================================

const BACKUP_DIR = path.resolve("backups");

// ======================================================
// SHARED POSTGRES ENVIRONMENT
// ======================================================

const getPostgresEnv = () => ({
    ...process.env,
    PGPASSWORD: DB_PASSWORD || "",
});

// ======================================================
// CREATE TIMESTAMP
// ======================================================

const createTimestamp = () => {
    return new Date()
        .toISOString()
        .replace("T", "_")
        .replace(/:/g, "-")
        .replace(/\.\d{3}Z$/, "");
};

// ======================================================
// VALIDATE BACKUP FILENAME
// ======================================================

const validateBackupFilename = (filename) => {
    if (!filename || typeof filename !== "string") {
        throw new Error("Backup filename is required.");
    }

    if (path.basename(filename) !== filename) {
        throw new Error("Invalid backup filename.");
    }

    if (!filename.toLowerCase().endsWith(".dump")) {
        throw new Error("Only .dump backup files are allowed.");
    }

    return filename;
};

// ======================================================
// CREATE DATABASE BACKUP
// ======================================================

export const createDatabaseBackup = async ({
    prefix = "deped_backup",
} = {}) => {
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const filename = `${prefix}_${createTimestamp()}.dump`;
    const backupPath = path.join(BACKUP_DIR, filename);

    const args = [
        "-h", DB_HOST,
        "-p", DB_PORT,
        "-U", DB_USER,
        "-F", "c",
        "-b",
        "-v",
        "-f", backupPath,
        DB_NAME,
    ];

    try {
        await execFileAsync(PG_DUMP, args, {
            env: getPostgresEnv(),
            maxBuffer: 1024 * 1024 * 20,
        });

        const stats = await fs.stat(backupPath);

        return {
            filename,
            path: backupPath,
            size: stats.size,
            created_at: stats.birthtime,
        };
    } catch (error) {
        await fs.unlink(backupPath).catch(() => {});
        throw new Error(`Database backup failed: ${error.message}`);
    }
};

// ======================================================
// GET DATABASE BACKUPS
// ======================================================

export const getDatabaseBackups = async () => {
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const files = await fs.readdir(BACKUP_DIR, {
        withFileTypes: true,
    });

    const backups = [];

    for (const entry of files) {
        if (
            !entry.isFile() ||
            !entry.name.toLowerCase().endsWith(".dump")
        ) {
            continue;
        }

        const filePath = path.join(BACKUP_DIR, entry.name);
        const stats = await fs.stat(filePath);

        backups.push({
            filename: entry.name,
            size: stats.size,
            created_at: stats.birthtime,
        });
    }

    backups.sort(
        (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
    );

    return backups;
};

export const getDatabaseBackupPath = async (filename) => {
    const safeFilename = validateBackupFilename(filename);
    const backupPath = path.join(BACKUP_DIR, safeFilename);

    let stats;

    try {
        stats = await fs.stat(backupPath);
    } catch (error) {
        if (error.code === "ENOENT") {
            throw new Error("Backup file not found.");
        }

        throw error;
    }

    if (!stats.isFile()) {
        throw new Error("The selected backup is not a file.");
    }

    return backupPath;
};

// ======================================================
// RESTORE DATABASE BACKUP
// ======================================================

export const restoreDatabaseBackup = async (filename) => {
    const safeFilename = validateBackupFilename(filename);

    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const backupPath = path.join(BACKUP_DIR, safeFilename);

    let stats;

    try {
        stats = await fs.stat(backupPath);
    } catch {
        throw new Error("Backup file not found.");
    }

    if (!stats.isFile()) {
        throw new Error("The selected backup is not a file.");
    }

    // STEP 1: Create a safety backup of the current database.
    const preRestoreBackup = await createDatabaseBackup({
        prefix: "deped_pre_restore",
    });

    // STEP 2: Restore the selected custom-format backup.
    const args = [
        "-h", DB_HOST,
        "-p", DB_PORT,
        "-U", DB_USER,
        "-d", DB_NAME,
        "--clean",
        "--if-exists",
        "--exit-on-error",
        backupPath,
    ];

    try {
        await execFileAsync(PG_RESTORE, args, {
            env: getPostgresEnv(),
            maxBuffer: 1024 * 1024 * 20,
        });

        return {
            restored_backup: safeFilename,
            pre_restore_backup: preRestoreBackup.filename,
            restored_at: new Date(),
        };
    } catch (error) {
        throw new Error(
            `Restore failed. A safety backup was created as "${preRestoreBackup.filename}". ${error.message}`
        );
    }
};
