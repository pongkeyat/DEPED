
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
// CREATE BACKUP TIMESTAMP
// ======================================================

const createTimestamp = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${day}-${month}-${year}-${hours}-${minutes}-${seconds}`;
};

const reserveBackupPath = async (timestamp, prefix) => {
    const date = timestamp.slice(0, 10);
    const backupFiles = await fs.readdir(BACKUP_DIR);
    const highestSequence = backupFiles.reduce((highest, filename) => {
        if (!filename.startsWith(`${date}-`) || !filename.toLowerCase().endsWith(".dump")) {
            return highest;
        }

        const prefixMarker = `-${prefix}-`;
        const markerIndex = filename.lastIndexOf(prefixMarker);
        const timestampPart = filename.slice(0, markerIndex);
        const sequence = filename.slice(
            markerIndex + prefixMarker.length,
            -".dump".length
        );

        return markerIndex > 0 &&
            /^\d{2}-\d{2}-\d{4}-\d{2}-\d{2}-\d{2}$/.test(timestampPart) &&
            /^\d+$/.test(sequence)
            ? Math.max(highest, Number(sequence))
            : highest;
    }, 0);

    let sequence = highestSequence + 1;

    while (true) {
        const filename = `${timestamp}-${prefix}-${sequence}.dump`;
        const backupPath = path.join(BACKUP_DIR, filename);

        try {
            const reservation = await fs.open(backupPath, "wx");
            await reservation.close();
            return { filename, backupPath };
        } catch (error) {
            if (error.code !== "EEXIST") {
                throw error;
            }

            sequence += 1;
        }
    }
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
    prefix = "backup",
} = {}) => {
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const { filename, backupPath } = await reserveBackupPath(
        createTimestamp(),
        prefix
    );

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
        prefix: "pre-restore-backup",
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