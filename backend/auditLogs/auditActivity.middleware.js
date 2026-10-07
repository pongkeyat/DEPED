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
    const action = actionByMethod[method];
    const path = req.originalUrl.split("?")[0];
    const apiPath = path.replace(/^\/api\/?/, "");
    const modulePath = apiPath.split("/")[0];

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

            await createAuditLog({
                user_id: user?.id ?? null,
                username: user?.email || "PUBLIC",
                user_role: user?.role || null,
                action,
                module: moduleByPath[modulePath] || "API",
                description: `${method} ${path} returned HTTP ${statusCode}.`,
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
                status: statusCode >= 400 ? "FAILED" : "SUCCESS"
            });
        } catch (error) {
            console.error("Failed to record API audit activity:", error);
        }
    });

    next();
};
