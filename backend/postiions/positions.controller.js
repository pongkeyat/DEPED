import pool from '../config/db.js';

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

        const parsedPage = parseInt(page, 10) || 1;
        const parsedLimit = parseInt(limit, 10) || 20;
        const offset = (parsedPage - 1) * parsedLimit;

        // Build dynamic WHERE clause and parameters
        const conditions = [];
        const params = [];


        // Position title filter
        if (position_title) {
            params.push(`%${position_title}%`);
            conditions.push(`position_title ILIKE $${params.length}`);
        }

        // Salary grade filter
        if (salary_grade) {
            params.push(salary_grade);
            conditions.push(`salary_grade = $${params.length}`);
        }

        // Category filter
        if (category) {
            const allowedCategories = [
                'Teaching Positions',
                'School Administration Positions',
                'Related Teaching Positions',
                'Non-Teaching Positions'
            ];

            const categoryAliases = {
                'Teaching Positions': ['Teaching Positions', 'Teaching'],
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

            if (!allowedCategories.includes(category)) {
                return res.status(400).json({
                    error: 'Invalid category',
                    allowedCategories
                });
            }

            params.push(categoryAliases[category]);
            conditions.push(`category = ANY($${params.length})`);
        }

        // General search
        if (search) {
            params.push(`%${search}%`);

            conditions.push(`
                (
                    position_title ILIKE $${params.length}
                    OR status ILIKE $${params.length}
                    OR category ILIKE $${params.length}
                    OR salary_grade ILIKE $${params.length}
                )
            `);
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

        // Query positions
        const dataQuery = `
            SELECT
                position_id,
                position_title,
                salary_grade,
                category
            FROM positions
            ${whereClause}
            ORDER BY position_id DESC
            LIMIT $${params.length + 1}
            OFFSET $${params.length + 2}
        `;

        // Query total number of records
        const countQuery = `
            SELECT COUNT(*)
            FROM positions
            ${whereClause}
        `;

        const [positionsResult, countResult] = await Promise.all([
            pool.query(
                dataQuery,
                [...params, parsedLimit, offset]
            ),
            pool.query(
                countQuery,
                params
            )
        ]);

        const totalItems = parseInt(
            countResult.rows[0].count,
            10
        );

        const totalPages = Math.ceil(
            totalItems / parsedLimit
        );

        return res.status(200).json({
            pagination: {
                totalItems,
                totalPages,
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
            error: 'Internal server error'
        });
    }
};