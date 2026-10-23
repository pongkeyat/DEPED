import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export const MEMO_STORAGE_ROOT = path.resolve(
    currentDirectory,
    "..",
    "private_uploads"
);
export const MEMO_UPLOAD_DIRECTORY = path.join(
    MEMO_STORAGE_ROOT,
    "vacancy-memos"
);
export const MAX_MEMO_FILE_SIZE = 10 * 1024 * 1024;

const allowedMimeTypes = {
    ".pdf": "application/pdf",
    ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        fs.mkdir(MEMO_UPLOAD_DIRECTORY, { recursive: true }, (error) => {
            callback(error, MEMO_UPLOAD_DIRECTORY);
        });
    },
    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `${randomUUID()}${extension}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_MEMO_FILE_SIZE,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const expectedMimeType = allowedMimeTypes[extension];

        if (
            !expectedMimeType ||
            (file.mimetype !== expectedMimeType &&
                file.mimetype !== "application/octet-stream")
        ) {
            const error = new Error("Upload a PDF or DOCX memo file.");
            error.code = "INVALID_MEMO_FILE_TYPE";
            callback(error);
            return;
        }

        callback(null, true);
    }
});

export const uploadMemoFile = (req, res, next) => {
    upload.single("memo_file")(req, res, (error) => {
        if (!error) {
            next();
            return;
        }

        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                error: "Memo files must be 10 MB or smaller."
            });
        }

        if (
            error.code === "INVALID_MEMO_FILE_TYPE" ||
            error.code === "LIMIT_UNEXPECTED_FILE"
        ) {
            return res.status(400).json({
                success: false,
                error:
                    error.code === "LIMIT_UNEXPECTED_FILE"
                        ? "Upload the memo using the 'memo_file' field."
                        : error.message
            });
        }

        console.error("Memo upload failed:", error);
        return res.status(500).json({
            success: false,
            error: "Unable to process the memo upload."
        });
    });
};

export const getMemoFileReference = (file) =>
    path.posix.join("vacancy-memos", path.basename(file.filename));

export const isValidMemoFile = async (file) => {
    const contents = await fs.promises.readFile(file.path);
    const extension = path.extname(file.originalname).toLowerCase();

    if (extension === ".pdf") {
        return contents
            .subarray(0, 5)
            .equals(Buffer.from("%PDF-", "ascii"));
    }

    const hasZipSignature =
        contents[0] === 0x50 &&
        contents[1] === 0x4b &&
        contents[2] === 0x03 &&
        contents[3] === 0x04;

    return (
        extension === ".docx" &&
        hasZipSignature &&
        contents.includes(Buffer.from("[Content_Types].xml")) &&
        contents.includes(Buffer.from("word/document.xml"))
    );
};

export const resolveMemoFilePath = (reference) => {
    if (typeof reference !== "string" || !reference.trim()) {
        return null;
    }

    const resolvedPath = path.resolve(MEMO_STORAGE_ROOT, reference);
    const relativePath = path.relative(MEMO_STORAGE_ROOT, resolvedPath);

    if (
        !relativePath ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        return null;
    }

    return resolvedPath;
};

export const removeMemoUpload = async (file) => {
    if (!file?.path) return;

    try {
        await fs.promises.unlink(file.path);
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
};
