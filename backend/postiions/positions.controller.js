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
            100
        );

        const offset = (parsedPage - 1) * parsedLimit;

        const conditions = [];
        const params = [];

        if (position_title) {
            params.push(`%${position_title}%`);
            conditions.push(
                `position_title ILIKE $${params.length}`
            );
        }

        if (salary_grade) {
            params.push(salary_grade);
            conditions.push(
                `salary_grade::text = $${params.length}`
            );
        }

        if (category) {
            const categoryAliases = {
                'Teaching Positions': [
                    'Teaching Positions',
                    'Teaching'
                ],
                'School Administration Positions': [
                    'School Administration Positions',
                    'School Administration'
                ],
                'Related Teaching Positions': [
                    'Related Teaching Positions',
                    'Related Teaching'
                ],
                'Non-Teaching Positions': [
                    'Non-Teaching Positions',
                    'Non-Teaching'
                ]
            };

            if (!categoryAliases[category]) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category',
                    allowedCategories: Object.keys(categoryAliases)
                });
            }

            params.push(categoryAliases[category]);

            conditions.push(
                `category = ANY($${params.length}::text[])`
            );
        }

        if (status) {
            params.push(status);
            conditions.push(
                `status ILIKE $${params.length}`
            );
        }

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

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const dataQuery = `
            SELECT
                position_id,
                position_title,
                salary_grade,
                category,
                status
            FROM positions
            ${whereClause}
            ORDER BY position_id DESC
            LIMIT $${params.length + 1}
            OFFSET $${params.length + 2}
        `;

        const countQuery = `
            SELECT COUNT(*) AS count
            FROM positions
            ${whereClause}
        `;

        const [positionsResult, countResult] = await Promise.all([
            pool.query(dataQuery, [
                ...params,
                parsedLimit,
                offset
            ]),
            pool.query(countQuery, params)
        ]);

        const totalItems = parseInt(
            countResult.rows[0].count,
            10
        );

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
        console.error('Error fetching positions:', error);

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
            category
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

        const duplicate = await pool.query(
            duplicateQuery,
            [title, category]
        );

        if (duplicate.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'This position already exists in the selected category.'
            });
        }

        const insertQuery = `
            INSERT INTO positions (
                position_title,
                salary_grade,
                category,
                status
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                position_id,
                position_title,
                salary_grade,
                category,
                status
        `;

        const result = await pool.query(insertQuery, [
            title,
            parsedSalaryGrade,
            category,
            'Active'
        ]);

        return res.status(201).json({
            success: true,
            message: 'Position created successfully.',
            data: result.rows[0]
        });
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
            category
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
                SELECT position_id, status
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

            const result = await client.query(
                `
                UPDATE positions
                SET
                    position_title = $1,
                    salary_grade = $2,
                    category = $3
                WHERE position_id = $4
                RETURNING
                    position_id,
                    position_title,
                    salary_grade,
                    category,
                    status
                `,
                [
                    title,
                    parsedSalaryGrade,
                    category,
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