import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { createAuditLog } from "./auditLogs.service.js";

const moduleByPath = {
    applications: "APPLICATION",
    vacancies: "VACANCY",
    positions: "POSITION",
    "initial-evaluation": "SCREENING",
    "interview-sessions": "INTERVIEW",
    assessment: "ASSESSMENT",
    ranking: "RANKING",
    database: "DATABASE",
    reports: "REPORT"
};

const actionByMethod = {
    POST: "CREATE",
    PUT: "UPDATE",
    PATCH: "UPDATE",
    DELETE: "DELETE"
};

const getRequestToken = (req) => {
    const authorization = req.headers.authorization;

    if (authorization?.startsWith("Bearer ")) {
        return authorization.slice(7);
    }

    return req.cookies?.token || null;
};

const resolveAuditUser = async (req) => {
    if (req.user) {
        return req.user;
    }

    const token = getRequestToken(req);

    if (!token) {
        return null;
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {
            return null;
        }

        throw error;
    }

    const query = decoded.id
        ? {
            text: "SELECT id, first_name, last_name, email, role FROM users WHERE id = $1",
            value: decoded.id
        }
        : decoded.email
            ? {
                text: "SELECT id, first_name, last_name, email, role FROM users WHERE email = $1",
                value: decoded.email
            }
            : null;

    if (!query) {
        return null;
    }

    try {
        const result = await pool.query(query.text, [query.value]);
        return result.rows[0] || null;
    } catch (error) {
        if (error.code !== "42P01") {
            throw error;
        }

        return {
            id: decoded.id ?? null,
            first_name: decoded.first_name ?? null,
            last_name: decoded.last_name ?? null,
            email: decoded.email ?? null,
            role: decoded.role ?? null
        };
    }
};

const describeActivity = (modulePath, method, statusCode) => {
    const subjects = {
        applications: "application",
        vacancies: "vacancy",
        positions: "position",
        "initial-evaluation": "initial screening",
        "interview-sessions": "interview session",
        assessment: "assessment",
        ranking: "applicant ranking",
        database: "database operation",
        reports: "report"
    };
    const subject = subjects[modulePath] || "system record";
    const failed = statusCode >= 400;
    const actions = {
        applications: method === "POST" ? ["submitted", "submit"] : ["updated", "update"],
        vacancies: method === "POST" ? ["created", "create"] : ["updated", "update"],
        positions: method === "POST" ? ["created", "create"] : ["updated", "update"],
        "initial-evaluation": ["completed", "complete"],
        "interview-sessions": method === "POST" ? ["created", "create"] : ["updated", "update"],
        assessment: method === "POST" ? ["submitted", "submit"] : ["updated", "update"],
        ranking: ["updated", "update"],
        database: method === "POST" ? ["processed", "process"] : ["updated", "update"],
        reports: ["generated", "generate"]
    };
    const [pastTense, infinitive] = actions[modulePath] || ["processed", "process"];

    return failed
        ? `Failed to ${infinitive} ${subject} (HTTP ${statusCode}).`
        : `${pastTense.charAt(0).toUpperCase()}${pastTense.slice(1)} ${subject} successfully.`;
};

export const describeVacancyStatusActivity = (req, statusCode) => {
    const requestedStatus = String(req.body?.status || "")
        .trim()
        .toLowerCase();
    const failed = statusCode >= 400;
    const actions = {
        closed: ["close", "close"],
        terminated: ["terminate", "terminate"],
        assessment: ["move", "move"]
    };
    const [verb, action] = actions[requestedStatus] || [];

    if (!verb) {
        return describeActivity("vacancies", req.method.toUpperCase(), statusCode);
    }

    if (failed) {
        return `Failed to ${action} vacancy (HTTP ${statusCode}).`;
    }

    if (requestedStatus === "assessment") {
        return "Moved vacancy to Assessment successfully.";
    }

    if (requestedStatus === "terminated") {
        const filename = String(req.file?.originalname || "")
            .replace(/[\\/]/g, "")
            .replace(/[\r\n]/g, "");
        return filename
            ? `Terminated vacancy with memo file "${filename}".`
            : "Terminated vacancy successfully.";
    }

    return "Closed vacancy successfully.";
};

export const auditActivity = (req, res, next) => {
    const method = req.method.toUpperCase();
    const path = req.originalUrl.split("?")[0];
    const apiPath = path.replace(/^\/api\/?/, "");
    const [modulePath, resource, subresource] = apiPath.split("/");
    const isDatabaseRestore =
        modulePath === "database" &&
        method === "POST" &&
        resource === "restore";
    const action = isDatabaseRestore
        ? "RESTORE"
        : modulePath === "database" && method === "POST" && resource === "backup"
            ? "BACKUP"
            : actionByMethod[method];

    if (
        !action ||
        modulePath === "audit-logs" ||
        modulePath === "usersAuth"
    ) {
        next();
        return;
    }

    res.on("finish", async () => {
        try {
            const user = await resolveAuditUser(req);
            const statusCode = res.statusCode;
            const isSuccessful = statusCode < 400;
            const isVacancyStatusChange =
                modulePath === "vacancies" && subresource === "status";
            const description = isDatabaseRestore
                ? isSuccessful
                    ? `Restored the database from ${subresource === "upload" ? "an uploaded" : "a server"} backup.`
                    : `Failed to restore the database from ${subresource === "upload" ? "an uploaded" : "a server"} backup (HTTP ${statusCode}).`
                : modulePath === "database" && method === "POST" && resource === "backup"
                    ? isSuccessful
                        ? "Created a database backup."
                        : `Failed to create a database backup (HTTP ${statusCode}).`
                    : isVacancyStatusChange
                        ? describeVacancyStatusActivity(req, statusCode)
                        : describeActivity(modulePath, method, statusCode);

            await createAuditLog({
                user_id: user?.id ?? null,
                username: user
                    ? [user.first_name, user.last_name].filter(Boolean).join(" ") ||
                        user.email
                    : "PUBLIC",
                user_role: user?.role || null,
                action,
                module: moduleByPath[modulePath] || "API",
                description,
                entity_type: moduleByPath[modulePath] || "api",
                entity_id:
                    req.params?.id ||
                    req.params?.vacancy_id ||
                    req.params?.position_id ||
                    null,
                ip_address:
                    req.ip ||
                    req.headers["x-forwarded-for"]
                        ?.split(",")[0]
                        ?.trim() ||
                    null,
                user_agent: req.get("user-agent") || null,
                metadata: {
                    method,
                    path,
                    status_code: statusCode,
                    ...(isVacancyStatusChange && req.body?.status
                        ? { requested_status: req.body.status }
                        : {})
                },
                status: isSuccessful ? "SUCCESS" : "FAILED"
            });
        } catch (error) {
            console.error("Failed to record API audit activity:", error);
        }
    });

    next();
};
