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
            const user = req.user;
            const statusCode = res.statusCode;
            const isSuccessful = statusCode < 400;
            const description = isDatabaseRestore
                ? isSuccessful
                    ? `Restored the database from ${subresource === "upload" ? "an uploaded" : "a server"} backup.`
                    : `Failed to restore the database from ${subresource === "upload" ? "an uploaded" : "a server"} backup (HTTP ${statusCode}).`
                : modulePath === "database" && method === "POST" && resource === "backup"
                    ? isSuccessful
                        ? "Created a database backup."
                        : `Failed to create a database backup (HTTP ${statusCode}).`
                    : `${method} ${path} returned HTTP ${statusCode}.`;

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
                    status_code: statusCode
                },
                status: isSuccessful ? "SUCCESS" : "FAILED"
            });
        } catch (error) {
            console.error("Failed to record API audit activity:", error);
        }
    });

    next();
};
