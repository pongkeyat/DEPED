import express from "express";

import {
    fetchAuditLogs,
    fetchAuditLogById
} from "./auditLogs.controller.js";

const router = express.Router();

router.get("/getAuditLogs", fetchAuditLogs);

router.get("/getAuditLogs/:id", fetchAuditLogById);

export default router;