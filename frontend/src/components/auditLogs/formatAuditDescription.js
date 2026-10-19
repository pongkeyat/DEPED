const LEGACY_API_DESCRIPTION =
    /^(GET|POST|PUT|PATCH|DELETE)\s+(\/api\/[^\s]+).*?returned\s+HTTP\s+(\d{3})\.?$/i;

export const formatAuditDescription = (log) => {
    const description = log?.description || "No description";

    const requestPath =
        log?.metadata?.path ||
        description.match(LEGACY_API_DESCRIPTION)?.[2];

    if (!requestPath) {
        return description;
    }

    const legacyMatch = description.match(LEGACY_API_DESCRIPTION);
    const method = String(
        log.metadata?.method || legacyMatch?.[1] || ""
    ).toUpperCase();
    const statusCode = Number(
        log.metadata?.status_code || legacyMatch?.[3] || 0
    );
    const modulePath = requestPath
        .replace(/^\/api\/?/, "")
        .split("/")[0]
        .toLowerCase();

    if (
        modulePath === "database" &&
        (requestPath === "/api/database/restore" ||
            requestPath === "/api/database/restore/upload")
    ) {
        const backupSource =
            requestPath === "/api/database/restore/upload"
                ? "an uploaded"
                : "a server";

        return log.status === "FAILED" || statusCode >= 400
            ? `Failed to restore the database from ${backupSource} backup.`
            : `Restored the database from ${backupSource} backup.`;
    }

    if (modulePath === "database" && requestPath === "/api/database/backup") {
        return log.status === "FAILED" || statusCode >= 400
            ? "Failed to create a database backup."
            : "Created a database backup.";
    }

    const subjects = {
        applications: "application",
        vacancies: "vacancy",
        positions: "position",
        "initial-evaluation": "initial screening",
        "interview-sessions": "interview session",
        assessment: "assessment",
        ranking: "applicant ranking",
        database: "database operation",
        reports: "report",
    };
    const subject = subjects[modulePath] || "system record";
    const actions = {
        applications: method === "POST" ? ["submitted", "submit"] : ["updated", "update"],
        vacancies: method === "POST" ? ["created", "create"] : ["updated", "update"],
        positions: method === "POST" ? ["created", "create"] : ["updated", "update"],
        "initial-evaluation": ["completed", "complete"],
        "interview-sessions": method === "POST" ? ["created", "create"] : ["updated", "update"],
        assessment: method === "POST" ? ["submitted", "submit"] : ["updated", "update"],
        ranking: ["updated", "update"],
        database: method === "POST" ? ["processed", "process"] : ["updated", "update"],
        reports: ["generated", "generate"],
    };
    const [pastTense, infinitive] = actions[modulePath] || ["processed", "process"];
    const failed = log.status === "FAILED" || statusCode >= 400;

    return failed
        ? `Failed to ${infinitive} ${subject}${statusCode >= 400 ? ` (HTTP ${statusCode})` : ""}.`
        : `${pastTense.charAt(0).toUpperCase()}${pastTense.slice(1)} ${subject} successfully.`;
};
