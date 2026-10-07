import pool from '../config/db.js';

// ======================================================
// 1. GET ALL POSITIONS
// ======================================================
export const getAllPositions = async (req, res) => {
    try {
        const {
            search = '',
            status = '',
            position_title = '',
            salary_grade = '',
            category = '',
            page = 1,
            limit = 20
        } = req.query;

        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.min(
            Math.max(parseInt(limit, 10) || 20, 1),
            1000
        );

        const offset = (parsedPage - 1) * parsedLimit;

        const conditions = [];
        const params = [];

        // ======================================================
        // POSITION TITLE FILTER
        // ======================================================

        if (position_title) {
            params.push(`%${position_title}%`);

            conditions.push(
                `position_title ILIKE $${params.length}`
            );
        }

        // ======================================================
        // SALARY GRADE FILTER
        // ======================================================

        if (salary_grade) {
            params.push(salary_grade);

            conditions.push(
                `salary_grade::text = $${params.length}`
            );
        }

        // ======================================================
        // CATEGORY FILTER
        // ======================================================

        if (category) {
            const categoryAliases = {
                'teaching positions': [
                    'teaching positions',
                    'teaching'
                ],

                'school administration positions': [
                    'school administration positions',
                    'school administration'
                ],

                'related teaching positions': [
                    'related teaching positions',
                    'related teaching'
                ],

                'non-teaching positions': [
                    'non-teaching positions',
                    'non-teaching',
                    'non teaching positions',
                    'non teaching'
                ]
            };
            const normalizedCategory = String(category)
                .trim()
                .toLowerCase()
                .replace(/\s+/g, ' ');

            if (!categoryAliases[normalizedCategory]) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category',
                    allowedCategories:
                        Object.keys(categoryAliases).map(
                            (value) =>
                                value.replace(/\b\w/g, (letter) =>
                                    letter.toUpperCase()
                                )
                        )
                });
            }

            params.push(categoryAliases[normalizedCategory]);

            conditions.push(
                `LOWER(TRIM(category)) = ANY($${params.length}::text[])`
            );
        }

        // ======================================================
        // STATUS FILTER
        // ======================================================

        if (status) {
            params.push(status);

            conditions.push(
                `status ILIKE $${params.length}`
            );
        }

        // ======================================================
        // SEARCH
        // ======================================================

        if (search) {
            params.push(`%${search}%`);

            const searchParam = `$${params.length}`;

            conditions.push(`
                (
                    position_title ILIKE ${searchParam}
                    OR status ILIKE ${searchParam}
                    OR category ILIKE ${searchParam}
                    OR salary_grade::text ILIKE ${searchParam}
                )
            `);
        }

        // ======================================================
        // WHERE CLAUSE
        // ======================================================

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        // ======================================================
        // GET POSITIONS
        // ======================================================

        const dataQuery = `
            SELECT
                position_id,
                position_title,
                salary_grade,
                category,

                -- QUALIFICATIONS
                education,
                training,
                experience,
                eligibility,

                status

            FROM positions

            ${whereClause}

            ORDER BY position_id DESC

            LIMIT $${params.length + 1}
            OFFSET $${params.length + 2}
        `;

        // ======================================================
        // COUNT
        // ======================================================

        const countQuery = `
            SELECT COUNT(*) AS count

            FROM positions

            ${whereClause}
        `;

        // ======================================================
        // EXECUTE QUERIES
        // ======================================================

        const [positionsResult, countResult] =
            await Promise.all([
                pool.query(dataQuery, [
                    ...params,
                    parsedLimit,
                    offset
                ]),

                pool.query(
                    countQuery,
                    params
                )
            ]);

        // ======================================================
        // TOTAL ITEMS
        // ======================================================

        const totalItems = parseInt(
            countResult.rows[0].count,
            10
        );

        // ======================================================
        // RESPONSE
        // ======================================================

        return res.status(200).json({
            success: true,

            pagination: {
                totalItems,

                totalPages: Math.ceil(
                    totalItems / parsedLimit
                ),

                currentPage: parsedPage,

                limit: parsedLimit
            },

            data: positionsResult.rows
        });

    } catch (error) {

        console.error(
            'Error fetching positions:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// ======================================================
// 2. POST POSITION
// ======================================================
export const createPosition = async (req, res) => {
    try {
        const {
            position_title,
            salary_grade,
            category,
            education,
            training,
            experience,
            eligibility
        } = req.body;

        if (
            !position_title ||
            salary_grade === undefined ||
            salary_grade === null ||
            !category
        ) {
            return res.status(400).json({
                success: false,
                message: 'Position title, salary grade, and category are required.'
            });
        }

        const allowedCategories = [
            'Teaching Positions',
            'School Administration Positions',
            'Related Teaching Positions',
            'Non-Teaching Positions'
        ];

        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid position category.',
                allowedCategories
            });
        }

        const parsedSalaryGrade = Number(salary_grade);

        if (
            !Number.isFinite(parsedSalaryGrade) ||
            parsedSalaryGrade < 1
        ) {
            return res.status(400).json({
                success: false,
                message: 'Salary grade must be a valid positive number.'
            });
        }

        const title = position_title.trim();

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Position title cannot be empty.'
            });
        }

        // Prevent duplicate position titles in the same category
        const duplicateQuery = `
            SELECT position_id
            FROM positions
            WHERE LOWER(TRIM(position_title)) = LOWER(TRIM($1))
              AND category = $2
            LIMIT 1
        `;

        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            await client.query(
                "SELECT pg_advisory_xact_lock(hashtext('positions'), hashtext('position_id'))"
            );

            const duplicate = await client.query(
                duplicateQuery,
                [title, category]
            );

            if (duplicate.rows.length > 0) {
                await client.query('ROLLBACK');

                return res.status(409).json({
                    success: false,
                    message: 'This position already exists in the selected category.'
                });
            }

            const nextIdResult = await client.query(`
                SELECT COALESCE(
                    MAX(SUBSTRING(position_id FROM 5)::BIGINT),
                    0
                ) + 1 AS next_id
                FROM positions
                WHERE position_id ~ '^POS-[0-9]+$'
            `);
            const positionId =
                `POS-${String(nextIdResult.rows[0].next_id).padStart(4, '0')}`;

            const insertQuery = `
                INSERT INTO positions (
                    position_id,
                    position_title,
                    salary_grade,
                    category,
                    education,
                    training,
                    experience,
                    eligibility,
                    status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING
                    position_id,
                    position_title,
                    salary_grade,
                    category,
                    education,
                    training,
                    experience,
                    eligibility,
                    status
            `;

            const result = await client.query(insertQuery, [
                positionId,
                title,
                parsedSalaryGrade,
                category,
                education ?? null,
                training ?? null,
                experience ?? null,
                eligibility ?? null,
                'Active'
            ]);

            await client.query('COMMIT');

            return res.status(201).json({
                success: true,
                message: 'Position created successfully.',
                data: result.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating position:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to create position.'
        });
    }
};


// ======================================================
// 3. UPDATE POSITION
// ======================================================
export const updatePosition = async (req, res) => {
    try {
        const { position_id } = req.params;

        const {
            position_title,
            salary_grade,
            category,
            education,
            training,
            experience,
            eligibility
        } = req.body;

        if (
            !position_title ||
            salary_grade === undefined ||
            salary_grade === null ||
            !category
        ) {
            return res.status(400).json({
                success: false,
                message: 'Position title, salary grade, and category are required.'
            });
        }

        const parsedSalaryGrade = Number(salary_grade);

        if (
            !Number.isFinite(parsedSalaryGrade) ||
            parsedSalaryGrade < 1
        ) {
            return res.status(400).json({
                success: false,
                message: 'Salary grade must be a valid positive number.'
            });
        }

        const allowedCategories = [
            'Teaching Positions',
            'School Administration Positions',
            'Related Teaching Positions',
            'Non-Teaching Positions'
        ];

        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid position category.',
                allowedCategories
            });
        }

        const title = position_title.trim();

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Position title cannot be empty.'
            });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const existing = await client.query(
                `
                SELECT position_id, position_title, category, status
                FROM positions
                WHERE position_id = $1
                FOR UPDATE
                `,
                [position_id]
            );

            if (existing.rows.length === 0) {
                await client.query('ROLLBACK');

                return res.status(404).json({
                    success: false,
                    message: 'Position not found.'
                });
            }

            if (
                existing.rows[0].status?.toLowerCase() ===
                'archived'
            ) {
                await client.query('ROLLBACK');

                return res.status(400).json({
                    success: false,
                    message: 'Archived positions cannot be edited.'
                });
            }

            const currentPosition = existing.rows[0];
            const titleChanged =
                String(currentPosition.position_title ?? "")
                    .trim()
                    .toLowerCase() !== title.toLowerCase();
            const categoryChanged =
                currentPosition.category !== category;

            if (titleChanged || categoryChanged) {
                const duplicate = await client.query(
                    `
                    SELECT position_id
                    FROM positions
                    WHERE LOWER(TRIM(position_title)) = LOWER(TRIM($1))
                      AND category = $2
                      AND position_id <> $3
                    LIMIT 1
                    `,
                    [title, category, position_id]
                );

                if (duplicate.rows.length > 0) {
                    await client.query('ROLLBACK');

                    return res.status(409).json({
                        success: false,
                        message: 'Another position with this title and category already exists.'
                    });
                }
            }

            const result = await client.query(
                `
                UPDATE positions
                SET
                    position_title = $1,
                    salary_grade = $2,
                    category = $3,
                    education = COALESCE($4, education),
                    training = COALESCE($5, training),
                    experience = COALESCE($6, experience),
                    eligibility = COALESCE($7, eligibility)
                WHERE position_id = $8
                RETURNING
                    position_id,
                    position_title,
                    salary_grade,
                    category,
                    education,
                    training,
                    experience,
                    eligibility,
                    status
                `,
                [
                    title,
                    parsedSalaryGrade,
                    category,
                    education ?? null,
                    training ?? null,
                    experience ?? null,
                    eligibility ?? null,
                    position_id
                ]
            );

            await client.query('COMMIT');

            return res.status(200).json({
                success: true,
                message: 'Position updated successfully.',
                data: result.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating position:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update position.'
        });
    }
};


// ======================================================
// 4. ARCHIVE POSITION
// ======================================================
export const archivePosition = async (req, res) => {
    try {
        const { position_id } = req.params;

        const result = await pool.query(
            `
            UPDATE positions
            SET status = 'Archived'
            WHERE position_id = $1
              AND status IS DISTINCT FROM 'Archived'
            RETURNING
                position_id,
                position_title,
                salary_grade,
                category,
                status
            `,
            [position_id]
        );

        if (result.rowCount === 0) {
            const existing = await pool.query(
                `
                SELECT position_id, status
                FROM positions
                WHERE position_id = $1
                `,
                [position_id]
            );

            if (existing.rowCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Position not found.'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'This position is already archived.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Position archived successfully.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error archiving position:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to archive position.'
        });
    }
};