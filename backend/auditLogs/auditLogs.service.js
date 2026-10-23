import pool from "../config/auditdb.js";
import usersPool from "../config/db.js";

const addUserDisplayFields = async (logs) => {
    const userIds = [
        ...new Set(
            logs
                .map((log) => log.user_id)
                .filter((userId) => userId !== null && userId !== undefined)
                .map(String)
        )
    ];

    if (userIds.length === 0) {
        return logs.map((log) => ({
            ...log,
            display_username: log.username,
            display_user_role: log.user_role
        }));
    }

    const usersResult = await usersPool.query(
        `SELECT id::text AS id, first_name, last_name, role
         FROM users
         WHERE id::text = ANY($1::text[])`,
        [userIds]
    );
    const usersById = new Map(
        usersResult.rows.map((user) => [user.id, user])
    );

    return logs.map((log) => {
        const user = usersById.get(String(log.user_id));
        const fullName = user
            ? [user.first_name, user.last_name].filter(Boolean).join(" ").trim()
            : "";

        return {
            ...log,
            display_username: fullName || log.username,
            display_user_role: user?.role ?? log.user_role
        };
    });
};

// ======================================================
// CREATE AUDIT LOG
// ======================================================

export const createAuditLog = async ({
    user_id = null,
    username = "SYSTEM",
    user_role = null,
    action,
    module,
    description = null,
    entity_type = null,
    entity_id = null,
    ip_address = null,
    user_agent = null,
    metadata = {},
    status = "SUCCESS"
}) => {
    const query = `
        INSERT INTO audit_logs (
            user_id,
            username,
            user_role,
            action,
            module,
            description,
            entity_type,
            entity_id,
            ip_address,
            user_agent,
            metadata,
            status
        )
        VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11::jsonb, $12
        )
        RETURNING *;
    `;

    const values = [
        user_id,
        username,
        user_role,
        action,
        module,
        description,
        entity_type,
        entity_id,
        ip_address,
        user_agent,
        JSON.stringify(metadata || {}),
        status
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};


// ======================================================
// GET AUDIT LOGS
// ======================================================

export const getAuditLogs = async ({
    search = "",
    action = "",
    module = "",
    user_role = "",
    status = "",
    date_from = "",
    date_to = "",
    page = 1,
    limit = 20
}) => {
    const normalizedSearch = String(search ?? "").trim();
    const parsedPage = Math.max(
        parseInt(page, 10) || 1,
        1
    );

    const parsedLimit = Math.min(
        Math.max(parseInt(limit, 10) || 20, 1),
        100
    );

    const offset = (parsedPage - 1) * parsedLimit;

    const conditions = [];
    const values = [];

    const addCondition = (condition, value) => {
        values.push(value);

        conditions.push(
            condition.replace("?", `$${values.length}`)
        );
    };

    if (normalizedSearch) {
        values.push(`%${normalizedSearch}%`);

        const param = `$${values.length}`;

        conditions.push(`
            (
                COALESCE(username, '') ILIKE ${param}
                OR COALESCE(user_id::text, '') ILIKE ${param}
                OR COALESCE(user_role, '') ILIKE ${param}
                OR COALESCE(description, '') ILIKE ${param}
                OR COALESCE(action, '') ILIKE ${param}
                OR COALESCE(module, '') ILIKE ${param}
                OR COALESCE(entity_type, '') ILIKE ${param}
                OR COALESCE(entity_id::text, '') ILIKE ${param}
                OR COALESCE(ip_address, '') ILIKE ${param}
                OR COALESCE(user_agent, '') ILIKE ${param}
                OR COALESCE(metadata::text, '') ILIKE ${param}
            )
        `);
    }

    if (action) {
        addCondition(
            `LOWER(
                CASE
                    WHEN module = 'DATABASE'
                     AND (
                        metadata->>'path' IN (
                            '/api/database/restore',
                            '/api/database/restore/upload'
                        )
                        OR description LIKE 'POST /api/database/restore returned HTTP %'
                        OR description LIKE 'POST /api/database/restore/upload returned HTTP %'
                    )
                    THEN 'RESTORE'
                    ELSE action
                END
            ) = LOWER(?)`,
            action
        );
    }

    if (module) {
        addCondition("LOWER(module) = LOWER(?)", module);
    }

    if (user_role) {
        addCondition("LOWER(user_role) = LOWER(?)", user_role);
    }

    if (status) {
        addCondition("LOWER(status) = LOWER(?)", status);
    }

    if (date_from) {
        addCondition(
            "audit_logs.created_at >= ?::date",
            date_from
        );
    }

    if (date_to) {
        addCondition(
            "audit_logs.created_at < (?::date + INTERVAL '1 day')",
            date_to
        );
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    // --------------------------------------------------
    // TOTAL RECORDS
    // --------------------------------------------------

    const countQuery = `
        SELECT COUNT(*)::int AS total
        FROM audit_logs
        ${whereClause};
    `;

    const countResult = await pool.query(
        countQuery,
        values
    );

    const total = countResult.rows[0].total;

    // --------------------------------------------------
    // PAGINATED RESULTS
    // --------------------------------------------------

    const dataValues = [
        ...values,
        parsedLimit,
        offset
    ];

    const dataQuery = `
        SELECT
            audit_logs.*,
            CASE
                WHEN audit_logs.module = 'DATABASE'
                 AND (
                    audit_logs.metadata->>'path' IN (
                        '/api/database/restore',
                        '/api/database/restore/upload'
                    )
                    OR audit_logs.description LIKE 'POST /api/database/restore returned HTTP %'
                    OR audit_logs.description LIKE 'POST /api/database/restore/upload returned HTTP %'
                 )
                 THEN 'RESTORE'
                 ELSE audit_logs.action
            END AS display_action
        FROM audit_logs
        ${whereClause}
        ORDER BY audit_logs.created_at DESC, audit_logs.audit_log_id DESC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2};
    `;

    const result = await pool.query(
        dataQuery,
        dataValues
    );
    const logs = await addUserDisplayFields(result.rows);

    return {
        logs,
        pagination: {
            page: parsedPage,
            limit: parsedLimit,
            total,
            totalPages: Math.ceil(total / parsedLimit)
        }
    };
};


// ======================================================
// GET AUDIT LOG BY ID
// ======================================================

export const getAuditLogById = async (
    audit_log_id
) => {
    const query = `
        SELECT
            audit_logs.*,
            CASE
                WHEN audit_logs.module = 'DATABASE'
                 AND (
                    audit_logs.metadata->>'path' IN (
                        '/api/database/restore',
                        '/api/database/restore/upload'
                    )
                    OR audit_logs.description LIKE 'POST /api/database/restore returned HTTP %'
                    OR audit_logs.description LIKE 'POST /api/database/restore/upload returned HTTP %'
                 )
                 THEN 'RESTORE'
                 ELSE audit_logs.action
            END AS display_action
        FROM audit_logs
        WHERE audit_logs.audit_log_id = $1;
    `;

    const result = await pool.query(
        query,
        [audit_log_id]
    );

    const [log] = await addUserDisplayFields(result.rows);
    return log || null;
};