import axios from "axios";

axios.defaults.withCredentials = true;

// ======================================================
// API ENDPOINTS
// ======================================================

const AUDIT_LOGS_GET = import.meta.env.VITE_AUDIT_LOGS_GET;
const AUDIT_LOGS_GET_BY_ID = import.meta.env.VITE_AUDIT_LOGS_GET_BY_ID;


// ======================================================
// GET ALL AUDIT LOGS
// GET /api/audit-logs/getAuditLogs
// Supports search, filters, and pagination
// ======================================================

export const getAuditLogs = async (params = {}) => {
    try {
        const response = await axios.get(
            AUDIT_LOGS_GET,
            { params }
        );

        return response.data;
    } catch (error) {
        console.error(
            "Get audit logs error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ======================================================
// GET AUDIT LOG BY ID
// GET /api/audit-logs/getAuditLogs/:id
// ======================================================

export const getAuditLogById = async (id) => {
    try {
        const url = AUDIT_LOGS_GET_BY_ID.replace(
            ":id",
            encodeURIComponent(id)
        );

        const response = await axios.get(url);

        return response.data;
    } catch (error) {
        console.error(
            "Get audit log by ID error:",
            error.response?.data || error.message
        );

        throw error;
    }
};