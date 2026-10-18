const LEGACY_DATABASE_RESTORE_DESCRIPTION =
    /^POST (\/api\/database\/restore(?:\/upload)?) returned HTTP \d+\.$/;

export const formatAuditDescription = (log) => {
    const description = log?.description || "No description";

    if (log?.module !== "DATABASE") {
        return description;
    }

    const requestPath =
        log.metadata?.path ||
        description.match(LEGACY_DATABASE_RESTORE_DESCRIPTION)?.[1];

    if (
        requestPath !== "/api/database/restore" &&
        requestPath !== "/api/database/restore/upload"
    ) {
        return description;
    }

    const backupSource =
        requestPath === "/api/database/restore/upload"
            ? "an uploaded"
            : "a server";

    return log.status === "FAILED"
        ? `Failed to restore the database from ${backupSource} backup.`
        : `Restored the database from ${backupSource} backup.`;
};
