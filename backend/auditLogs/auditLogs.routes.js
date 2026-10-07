import express from "express";

import {
    fetchAuditLogs,
    fetchAuditLogById
} from "./auditLogs.controller.js";
import { protect } from "../users/users.middleware.js";

const router = express.Router();

router.get("/getAuditLogs", protect, fetchAuditLogs);

router.get("/getAuditLogs/:id", protect, fetchAuditLogById);

export default router;