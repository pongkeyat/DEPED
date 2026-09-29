import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execFileAsync = promisify(execFile);

// ======================================================
// PostgreSQL executables
// ======================================================

const PG_BIN = "C:\\Program Files\\PostgreSQL\\18\\bin";

const PG_DUMP = path.join(PG_BIN, "pg_dump.exe");
const PG_RESTORE = path.join(PG_BIN, "pg_restore.exe");

// ======================================================
// Database configuration
// ======================================================

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || "5432";
const DB_NAME = process.env.DB_NAME || "deped";
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASSWORD = process.env.DB_PASSWORD;

// ======================================================
// Backup directory
// ======================================================

const BACKUP_DIR = path.resolve("backups");

// ======================================================
// Create timestamp
// ======================================================

const createTimestamp = () => {
    const now = new Date();

    return now
        .toISOString()
        .replace("T", "_")
        .replace(/:/g, "-")
        .replace(/\..+/, "");
};

// ======================================================
// CREATE BACKUP
// ======================================================

export const createDatabaseBackup = async ({
    prefix = "deped_backup"
} = {}) => {

    await fs.mkdir(BACKUP_DIR, {
        recursive: true
    });

    const timestamp = createTimestamp();

    const filename = `${prefix}_${timestamp}.dump`;

    const backupPath = path.join(
        BACKUP_DIR,
        filename
    );

    const args = [
        "-h",
        DB_HOST,

        "-p",
        DB_PORT,

        "-U",
        DB_USER,

        "-F",
        "c",

        "-b",

        "-v",

        "-f",
        backupPath,

        DB_NAME
    ];

    try {

        await execFileAsync(
            PG_DUMP,
            args,
            {
                env: {
                    ...process.env,
                    PGPASSWORD: DB_PASSWORD
                },

                maxBuffer: 1024 * 1024 * 20
            }
        );

        const stats = await fs.stat(
            backupPath
        );

        return {
            filename,
            path: backupPath,
            size: stats.size,
            created_at: new Date()
        };

    } catch (error) {

        // Remove incomplete backup
        try {
            await fs.unlink(backupPath);
        } catch {
            // File may not exist
        }

        throw error;
    }
};

// ======================================================
// GET BACKUP LIST
// ======================================================

export const getDatabaseBackups = async () => {

    await fs.mkdir(BACKUP_DIR, {
        recursive: true
    });

    const files = await fs.readdir(
        BACKUP_DIR
    );

    const backups = [];

    for (const filename of files) {

        if (!filename.endsWith(".dump")) {
            continue;
        }

        const filePath = path.join(
            BACKUP_DIR,
            filename
        );

        const stats = await fs.stat(
            filePath
        );

        backups.push({
            filename,
            size: stats.size,
            created_at: stats.birthtime
        });
    }

    backups.sort(
        (a, b) =>
            new Date(b.created_at) -
            new Date(a.created_at)
    );

    return backups;
};

// ======================================================
// RESTORE BACKUP
// ======================================================

export const restoreDatabaseBackup = async (
    filename
) => {

    if (!filename) {
        throw new Error(
            "Backup filename is required."
        );
    }

    // Prevent path traversal
    const safeFilename =
        path.basename(filename);

    if (safeFilename !== filename) {
        throw new Error(
            "Invalid backup filename."
        );
    }

    // Only allow .dump files
    if (!safeFilename.endsWith(".dump")) {
        throw new Error(
            "Only .dump backup files are allowed."
        );
    }

    const backupPath = path.join(
        BACKUP_DIR,
        safeFilename
    );

    // Verify backup exists
    try {

        await fs.access(
            backupPath
        );

    } catch {

        throw new Error(
            "Backup file not found."
        );
    }

    // ==================================================
    // STEP 1
    // Automatically backup CURRENT database
    // ==================================================

    const preRestoreBackup =
        await createDatabaseBackup({
            prefix: "deped_pre_restore"
        });

    // ==================================================
    // STEP 2
    // Restore selected backup
    // ==================================================

    const args = [
        "-h",
        DB_HOST,

        "-p",
        DB_PORT,

        "-U",
        DB_USER,

        "-d",
        DB_NAME,

        "--clean",

        "--if-exists",

        "--exit-on-error",

        backupPath
    ];

    try {

        await execFileAsync(
            PG_RESTORE,
            args,
            {
                env: {
                    ...process.env,
                    PGPASSWORD: DB_PASSWORD
                },

                maxBuffer: 1024 * 1024 * 20
            }
        );

        return {
            restored_backup: safeFilename,

            pre_restore_backup:
                preRestoreBackup.filename,

            restored_at: new Date()
        };

    } catch (error) {

        throw new Error(
            `Restore failed. Your previous database was backed up as "${preRestoreBackup.filename}". ${error.message}`
        );
    }
};