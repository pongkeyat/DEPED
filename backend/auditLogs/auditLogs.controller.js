import {
    getAuditLogs,
    getAuditLogById
} from "./auditLogs.service.js";

// ======================================================
// GET ALL AUDIT LOGS
// ======================================================

export const fetchAuditLogs = async (req, res) => {
    try {
        const result = await getAuditLogs(req.query);

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error(
            "Fetch audit logs error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve audit logs."
        });
    }
};


// ======================================================
// GET AUDIT LOG BY ID
// ======================================================

export const fetchAuditLogById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const log = await getAuditLogById(id);

        if (!log) {
            return res.status(404).json({
                success: false,
                message: "Audit log not found."
            });
        }

        return res.status(200).json({
            success: true,
            log
        });

    } catch (error) {
        console.error(
            "Fetch audit log error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve audit log."
        });
    }
};