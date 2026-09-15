import pool from "../config/db.js";

// ==========================================
// CREATE PANELIST
// ==========================================
export const createPanelist = async (req, res) => {
    try {
        const {
            first_name,
            middle_name,
            last_name,
            position,
        } = req.body;

        if (!first_name || !last_name || !position) {
            return res.status(400).json({
                message:
                    "First name, last name, and position are required.",
            });
        }

        const query = `
            INSERT INTO panelists (
                first_name,
                middle_name,
                last_name,
                position
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const values = [
            first_name,
            middle_name || null,
            last_name,
            position,
        ];

        const result = await pool.query(query, values);

        return res.status(201).json({
            message: "Panelist created successfully.",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Error creating panelist:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
};

// ==========================================
// GET ALL PANELISTS
// ==========================================
export const getAllPanelists = async (req, res) => {
    try {
        const query = `
            SELECT
                panelist_id,
                first_name,
                middle_name,
                last_name,
                position
            FROM panelists
            ORDER BY panelist_id ASC
        `;

        const result = await pool.query(query);

        return res.status(200).json({
            data: result.rows,
        });
    } catch (error) {
        console.error("Error fetching panelists:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
};

// ==========================================
// GET PANELIST BY ID
// ==========================================
export const getPanelistById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT
                panelist_id,
                first_name,
                middle_name,
                last_name,
                position
            FROM panelists
            WHERE panelist_id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Panelist not found.",
            });
        }

        return res.status(200).json({
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Error fetching panelist:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
};

// ==========================================
// UPDATE PANELIST
// ==========================================
export const updatePanelist = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            first_name,
            middle_name,
            last_name,
            position,
        } = req.body;

        if (!first_name || !last_name || !position) {
            return res.status(400).json({
                message:
                    "First name, last name, and position are required.",
            });
        }

        const query = `
            UPDATE panelists
            SET
                first_name = $1,
                middle_name = $2,
                last_name = $3,
                position = $4
            WHERE panelist_id = $5
            RETURNING *
        `;

        const values = [
            first_name,
            middle_name || null,
            last_name,
            position,
            id,
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Panelist not found.",
            });
        }

        return res.status(200).json({
            message: "Panelist updated successfully.",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Error updating panelist:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
};

// ==========================================
// DELETE PANELIST
// ==========================================
export const deletePanelist = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            DELETE FROM panelists
            WHERE panelist_id = $1
            RETURNING *
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Panelist not found.",
            });
        }

        return res.status(200).json({
            message: "Panelist deleted successfully.",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Error deleting panelist:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
};