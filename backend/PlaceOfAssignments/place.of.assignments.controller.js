import pool from '../config/db.js';

// ======================================================
// 1. GET ALL PLACES OF ASSIGNMENT
// ======================================================
export const getAllPlacesOfAssignment = async (req, res) => {
    try {
        const { search = '', status = '' } = req.query;
        const conditions = [];
        const params = [];

        if (search.trim()) {
            params.push(`%${search.trim()}%`);
            conditions.push(`place_name ILIKE $${params.length}`);
        }

        if (status === 'Active') conditions.push('is_archived = FALSE');
        if (status === 'Archived') conditions.push('is_archived = TRUE');

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const result = await pool.query(
            `SELECT place_id, place_name, is_archived,
                    CASE WHEN is_archived THEN 'Archived' ELSE 'Active' END AS status,
                    created_at, updated_at
             FROM places_of_assignment
             ${whereClause}
             ORDER BY place_name ASC`,
            params
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching places of assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch places of assignment.'
        });
    }
};

// ======================================================
// 2. CREATE PLACE OF ASSIGNMENT
// ======================================================
export const createPlaceOfAssignment = async (req, res) => {
    try {
        const place_name = String(req.body?.place_name ?? '').trim();

        if (!place_name) {
            return res.status(400).json({
                success: false,
                message: 'Place of assignment is required.'
            });
        }

        const result = await pool.query(
            `INSERT INTO places_of_assignment (place_name)
             VALUES ($1)
             RETURNING place_id, place_name, is_archived, created_at, updated_at`,
            [place_name]
        );

        return res.status(201).json({
            success: true,
            message: 'Place of assignment created successfully.',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'This place of assignment already exists.'
            });
        }

        console.error('Error creating place of assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create place of assignment.'
        });
    }
};

// ======================================================
// 3. UPDATE PLACE OF ASSIGNMENT
// ======================================================
export const updatePlaceOfAssignment = async (req, res) => {
    try {
        const { place_id } = req.params;
        const place_name = String(req.body?.place_name ?? '').trim();

        if (!place_name) {
            return res.status(400).json({
                success: false,
                message: 'Place of assignment is required.'
            });
        }

        const result = await pool.query(
            `UPDATE places_of_assignment
             SET place_name = $1, updated_at = CURRENT_TIMESTAMP
             WHERE place_id = $2
             RETURNING place_id, place_name, is_archived, created_at, updated_at`,
            [place_name, place_id]
        );

        if (!result.rowCount) {
            return res.status(404).json({
                success: false,
                message: 'Place of assignment not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Place of assignment updated successfully.',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'This place of assignment already exists.'
            });
        }

        console.error('Error updating place of assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update place of assignment.'
        });
    }
};

// ======================================================
// 4. ARCHIVE PLACE OF ASSIGNMENT
// ======================================================
export const archivePlaceOfAssignment = async (req, res) => {
    try {
        const { place_id } = req.params;

        const result = await pool.query(
            `UPDATE places_of_assignment
             SET is_archived = TRUE, updated_at = CURRENT_TIMESTAMP
             WHERE place_id = $1 AND is_archived = FALSE
             RETURNING place_id, place_name, is_archived`,
            [place_id]
        );

        if (!result.rowCount) {
            const existing = await pool.query(
                'SELECT place_id, is_archived FROM places_of_assignment WHERE place_id = $1',
                [place_id]
            );

            if (!existing.rowCount) {
                return res.status(404).json({
                    success: false,
                    message: 'Place of assignment not found.'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'This place of assignment is already archived.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Place of assignment archived successfully.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error archiving place of assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to archive place of assignment.'
        });
    }
};

// ======================================================
// 5. RESTORE PLACE OF ASSIGNMENT
// ======================================================
export const restorePlaceOfAssignment = async (req, res) => {
    try {
        const { place_id } = req.params;

        const result = await pool.query(
            `UPDATE places_of_assignment
             SET is_archived = FALSE, updated_at = CURRENT_TIMESTAMP
             WHERE place_id = $1 AND is_archived = TRUE
             RETURNING place_id, place_name, is_archived`,
            [place_id]
        );

        if (!result.rowCount) {
            const existing = await pool.query(
                'SELECT place_id, is_archived FROM places_of_assignment WHERE place_id = $1',
                [place_id]
            );

            if (!existing.rowCount) {
                return res.status(404).json({
                    success: false,
                    message: 'Place of assignment not found.'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'This place of assignment is not archived.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Place of assignment restored successfully.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error restoring place of assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to restore place of assignment.'
        });
    }
};
