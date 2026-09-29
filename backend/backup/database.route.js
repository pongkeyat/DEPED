import express from "express";

import {
    backupDatabase,
    getBackups,
    restoreBackup
} from "../backup/database.controller.js";

const router = express.Router();

router.post(
    "/backup",
    backupDatabase
);

router.get(
    "/backups",
    getBackups
);

router.post(
    "/restore",
    restoreBackup
);

export default router;