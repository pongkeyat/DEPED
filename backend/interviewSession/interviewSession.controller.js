import pool from "../config/db.js";

// POST /api/interview-sessions - Schedule new sessions
export const postInterviewSession = async (req, res) => {
    const { vacancy_id, selectedApplicants, session_date, venue, panelists, remarks } = req.body;

    // 1. Input Validation
    if (!vacancy_id || !session_date || !venue || !panelists) {
        return res.status(400).json({ 
            error: 'Vacancy ID, Session Date, Venue, and Panelists are required.' 
        });
    }

    if (!Array.isArray(selectedApplicants) || selectedApplicants.length === 0) {
        return res.status(400).json({ 
            error: 'At least one job applicant must be selected.' 
        });
    }

    // Acquire a dedicated client for safe transaction execution
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const insertedSessions = [];

        // Loop through each applicant string ID and execute insert
        for (const applicantId of selectedApplicants) {
            const result = await client.query(
                `INSERT INTO interview_sessions (
                    vacancy_id, 
                    job_applications_id, 
                    session_date, 
                    venue, 
                    conducted_by, 
                    remarks
                )
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING 
                    session_id,
                    vacancy_id,
                    job_applications_id,
                    TO_CHAR(session_date, 'YYYY-MM-DD') AS session_date,
                    venue,
                    conducted_by,
                    remarks,
                    status,
                    created_at;`,
                [
                    String(vacancy_id), 
                    String(applicantId), 
                    session_date, 
                    venue, 
                    panelists, 
                    remarks || ''
                ]
            );

            insertedSessions.push(result.rows[0]);
        }

        await client.query('COMMIT');

        return res.status(201).json({ 
            message: 'Assessment sessions successfully scheduled.',
            sessions: insertedSessions 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating interview session entries:', error);

        if (error.code === '23503') {
            return res.status(400).json({ 
                error: 'Invalid database reference constraint. Verify your vacancy and applicant IDs.' 
            });
        }
        if (error.code === '23505') {
            return res.status(409).json({ 
                error: 'One or more applicants are already scheduled for this vacancy.' 
            });
        }

        return res.status(500).json({ error: 'Internal server error.' });
    } finally {
        client.release();
    }
};


// GET /api/interview-sessions - Retrieve all interview sessions with joined details
export const getInterviewSessions = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                i.session_id, 
                i.vacancy_id, 
                i.job_applications_id, 
                a.applicant_id, 
                v.position_title, 
                a.first_name, 
                a.middle_name, 
                a.last_name, 
                a.suffix, 
                h.application_status,
                TO_CHAR(i.session_date, 'YYYY-MM-DD') AS session_date, 
                i.venue, 
                i.conducted_by, 
                i.remarks, 
                i.status 
            FROM interview_sessions i 

            INNER JOIN job_applications j  
                ON j.job_applications_id = i.job_applications_id 

            INNER JOIN applicant_information a  
                ON a.job_applications_id = j.job_applications_id 

            INNER JOIN vacancies v  
                ON v.vacancy_id = j.vacancy_id 

            INNER JOIN hr_remarks_final_notes h
                ON h.applicant_id = a.applicant_id

            WHERE LOWER(TRIM(h.application_status)) = 'qualified'

            ORDER BY 
                a.last_name ASC, 
                a.first_name ASC;
        `;

        const result = await pool.query(queryText);

        return res.status(200).json({
            message: 'Interview sessions retrieved successfully.',
            sessions: result.rows
        });

    } catch (error) {
        console.error('Error fetching interview sessions:', error);
        return res.status(500).json({
            error: 'Internal server error.'
        });
    }
};


// PUT /api/interview-sessions/:id - Update session by custom session_id (e.g., session-0001)
export const updateInterviewSession = async (req, res) => {
    const { id } = req.params; // Accepts custom string IDs like session-0001
    const { venue, status, session_date, remarks, conducted_by } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Session ID parameter is required.' });
    }

    const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ 
            error: `Invalid status. Allowed values: ${validStatuses.join(', ')}` 
        });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (venue !== undefined) {
        updates.push(`venue = $${paramIndex++}`);
        values.push(venue);
    }
    if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
    }
    if (session_date !== undefined) {
        updates.push(`session_date = $${paramIndex++}`);
        values.push(session_date);
    }
    if (remarks !== undefined) {
        updates.push(`remarks = $${paramIndex++}`);
        values.push(remarks);
    }
    if (conducted_by !== undefined) {
        updates.push(`conducted_by = $${paramIndex++}`);
        values.push(conducted_by);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'At least one field to update must be provided.' });
    }

    values.push(id);
    const queryText = `
        UPDATE interview_sessions
        SET ${updates.join(', ')}
        WHERE session_id = $${paramIndex}
        RETURNING 
            session_id,
            vacancy_id,
            job_applications_id,
            TO_CHAR(session_date, 'YYYY-MM-DD') AS session_date,
            venue,
            conducted_by,
            remarks,
            status,
            updated_at;
    `;

    try {
        const result = await pool.query(queryText, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Interview session not found.' });
        }

        return res.status(200).json({
            message: 'Interview session updated successfully.',
            session: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating interview session:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};