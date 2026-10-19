import pool from '../config/db.js';

// ======================================================
// 1. GET ALL OFFICE UNITS
// ======================================================
export const getAllOfficeUnits = async (req, res) => {
    try {
        const { search = '', status = '' } = req.query;
        const conditions = [];
        const params = [];

        if (search.trim()) {
            params.push(`%${search.trim()}%`);
            conditions.push(`office_unit_name ILIKE $${params.length}`);
        }

        if (status === 'Active') conditions.push('is_archived = FALSE');
        if (status === 'Archived') conditions.push('is_archived = TRUE');

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const result = await pool.query(
            `SELECT office_unit_id, office_unit_name, is_archived,
                    CASE WHEN is_archived THEN 'Archived' ELSE 'Active' END AS status,
                    created_at, updated_at
             FROM office_units
             ${whereClause}
             ORDER BY office_unit_name ASC`,
            params
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching office units:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch office units.'
        });
    }
};

// ======================================================
// 2. CREATE OFFICE UNIT
// ======================================================
export const createOfficeUnit = async (req, res) => {
    try {
        const office_unit_name = String(req.body?.office_unit_name ?? '').trim();

        if (!office_unit_name) {
            return res.status(400).json({
                success: false,
                message: 'Office unit name is required.'
            });
        }

        const result = await pool.query(
            `INSERT INTO office_units (office_unit_name)
             VALUES ($1)
             RETURNING office_unit_id, office_unit_name, is_archived, created_at, updated_at`,
            [office_unit_name]
        );

        return res.status(201).json({
            success: true,
            message: 'Office unit created successfully.',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'This office unit already exists.'
            });
        }

        console.error('Error creating office unit:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create office unit.'
        });
    }
};

// ======================================================
// 3. UPDATE OFFICE UNIT
// ======================================================
export const updateOfficeUnit = async (req, res) => {
    try {
        const { office_unit_id } = req.params;
        const office_unit_name = String(req.body?.office_unit_name ?? '').trim();

        if (!office_unit_name) {
            return res.status(400).json({
                success: false,
                message: 'Office unit name is required.'
            });
        }

        const result = await pool.query(
            `UPDATE office_units
             SET office_unit_name = $1, updated_at = CURRENT_TIMESTAMP
             WHERE office_unit_id = $2
             RETURNING office_unit_id, office_unit_name, is_archived, created_at, updated_at`,
            [office_unit_name, office_unit_id]
        );

        if (!result.rowCount) {
            return res.status(404).json({
                success: false,
                message: 'Office unit not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Office unit updated successfully.',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'This office unit already exists.'
            });
        }

        console.error('Error updating office unit:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update office unit.'
        });
    }
};

// ======================================================
// 4. ARCHIVE OFFICE UNIT
// ======================================================
export const archiveOfficeUnit = async (req, res) => {
    try {
        const { office_unit_id } = req.params;

        const result = await pool.query(
            `UPDATE office_units
             SET is_archived = TRUE, updated_at = CURRENT_TIMESTAMP
             WHERE office_unit_id = $1 AND is_archived = FALSE
             RETURNING office_unit_id, office_unit_name, is_archived`,
            [office_unit_id]
        );

        if (!result.rowCount) {
            const existing = await pool.query(
                'SELECT office_unit_id, is_archived FROM office_units WHERE office_unit_id = $1',
                [office_unit_id]
            );

            if (!existing.rowCount) {
                return res.status(404).json({
                    success: false,
                    message: 'Office unit not found.'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'This office unit is already archived.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Office unit archived successfully.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error archiving office unit:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to archive office unit.'
        });
    }
};

// ======================================================
// 5. RESTORE OFFICE UNIT
// ======================================================
export const restoreOfficeUnit = async (req, res) => {
    try {
        const { office_unit_id } = req.params;

        const result = await pool.query(
            `UPDATE office_units
             SET is_archived = FALSE, updated_at = CURRENT_TIMESTAMP
             WHERE office_unit_id = $1 AND is_archived = TRUE
             RETURNING office_unit_id, office_unit_name, is_archived`,
            [office_unit_id]
        );

        if (!result.rowCount) {
            const existing = await pool.query(
                'SELECT office_unit_id, is_archived FROM office_units WHERE office_unit_id = $1',
                [office_unit_id]
            );

            if (!existing.rowCount) {
                return res.status(404).json({
                    success: false,
                    message: 'Office unit not found.'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'This office unit is not archived.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Office unit restored successfully.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error restoring office unit:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to restore office unit.'
        });
    }
};
