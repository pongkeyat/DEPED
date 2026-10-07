import pool from "../config/db.js";

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
        addCondition("LOWER(action) = LOWER(?)", action);
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
            "created_at >= ?::date",
            date_from
        );
    }

    if (date_to) {
        addCondition(
            "created_at < (?::date + INTERVAL '1 day')",
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
        SELECT *
        FROM audit_logs
        ${whereClause}
        ORDER BY created_at DESC, audit_log_id DESC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2};
    `;

    const result = await pool.query(
        dataQuery,
        dataValues
    );

    return {
        logs: result.rows,
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
        SELECT *
        FROM audit_logs
        WHERE audit_log_id = $1;
    `;

    const result = await pool.query(
        query,
        [audit_log_id]
    );

    return result.rows[0] || null;
};