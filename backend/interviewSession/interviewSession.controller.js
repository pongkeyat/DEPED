import pool from "../config/db.js";
import { sendAssessmentInvitationEmail } from "./email.service.js";


// ============================================================
// POST /api/interview-sessions
// Create ONE assessment session with MULTIPLE applicants
// ============================================================

// ============================================================
// POST /api/interview-sessions
// Create ONE assessment session with MULTIPLE applicants
// ============================================================

export const postInterviewSession = async (req, res) => {
    const {
        vacancy_id,
        selectedApplicants,
        session_date,
        venue,
        panelUserIds,
        remarks
    } = req.body || {};

    // 1. Validate required fields
    if (!vacancy_id || !session_date || !venue) {
        return res.status(400).json({
            error: "Vacancy ID, Session Date, and Venue are required."
        });
    }

    if (!Array.isArray(selectedApplicants) || selectedApplicants.length === 0) {
        return res.status(400).json({
            error: "At least one job applicant must be selected."
        });
    }

    if (new Set(selectedApplicants.map(String)).size !== selectedApplicants.length) {
        return res.status(400).json({
            error: "Duplicate applicants are not allowed."
        });
    }

    // Panel size is dynamic: 3, 4, 5, or more members.
    if (!Array.isArray(panelUserIds) || panelUserIds.length === 0) {
        return res.status(400).json({
            error: "Select at least one HRMPSB panel member."
        });
    }

    const normalizedPanelUserIds = panelUserIds.map(Number);

    if (
        normalizedPanelUserIds.some(
            id => !Number.isSafeInteger(id) || id <= 0
        ) ||
        new Set(normalizedPanelUserIds).size !== normalizedPanelUserIds.length
    ) {
        return res.status(400).json({
            error: "Panel member IDs must be valid, positive, and unique."
        });
    }

    const client = await pool.connect();
    let transactionStarted = false;
    const applicantsForEmail = [];

    try {
        await client.query("BEGIN");
        transactionStarted = true;

        // 2. Verify the vacancy
        const vacancyResult = await client.query(
            `SELECT v.vacancy_id, v.position_id, p.position_title
             FROM vacancies v
             INNER JOIN positions p ON p.position_id = v.position_id
             WHERE v.vacancy_id = $1
             LIMIT 1`,
            [String(vacancy_id)]
        );

        if (vacancyResult.rowCount === 0) {
            const error = new Error("Vacancy not found.");
            error.statusCode = 404;
            throw error;
        }

        const vacancy = vacancyResult.rows[0];

        // 3. Verify every selected user is an active HRMPSB member
        const panelResult = await client.query(
            `SELECT id, first_name, last_name
             FROM users
             WHERE id = ANY($1::integer[])
               AND LOWER(TRIM(role)) = 'hrmpsb'
               AND is_archived = FALSE
             ORDER BY id`,
            [normalizedPanelUserIds]
        );

        if (panelResult.rowCount !== normalizedPanelUserIds.length) {
            const error = new Error(
                "One or more selected users are invalid, archived, or are not HRMPSB members."
            );
            error.statusCode = 400;
            throw error;
        }

        // Use names for the existing conducted_by display field.
        // Actual assignments are saved separately using user IDs.
        const panelistNames = panelResult.rows
            .map(user => `${user.first_name || ""} ${user.last_name || ""}`.trim())
            .filter(Boolean)
            .join(", ");

        // 4. Verify applicants and collect email information
        for (const applicationId of selectedApplicants) {
            const applicantResult = await client.query(
                `SELECT
                    ai.applicant_id,
                    ai.job_applications_id,
                    ai.first_name,
                    ai.last_name,
                    ai.email_address,
                    ai.application_code,
                    h.application_status
                 FROM applicant_information ai
                 LEFT JOIN hr_remarks_final_notes h
                    ON h.applicant_id = ai.applicant_id
                 INNER JOIN job_applications ja
                    ON ja.job_applications_id = ai.job_applications_id
                 WHERE ai.job_applications_id = $1
                   AND ja.vacancy_id = $2
                 LIMIT 1`,
                [String(applicationId), String(vacancy_id)]
            );

            if (applicantResult.rowCount === 0) {
                const error = new Error(
                    `Applicant/application not found for: ${applicationId}`
                );
                error.statusCode = 404;
                throw error;
            }

            const applicant = applicantResult.rows[0];
            const normalizedStatus = String(
                applicant.application_status || ""
            ).trim().toLowerCase();

            if (
                normalizedStatus !== "qualified" &&
                normalizedStatus !== "initial_screening_qualified"
            ) {
                const error = new Error(
                    `Applicant ${applicationId} is not qualified for assessment.`
                );
                error.statusCode = 400;
                throw error;
            }

            if (!applicant.application_code) {
                const error = new Error(
                    `Applicant ${applicationId} does not have an application code.`
                );
                error.statusCode = 400;
                throw error;
            }

            applicantsForEmail.push({
                applicant_id: applicant.applicant_id,
                firstName: applicant.first_name,
                lastName: applicant.last_name,
                email: applicant.email_address,
                applicationCode: applicant.application_code,
                positionTitle: vacancy.position_title
            });
        }

        // 5. Create the parent assessment session
        const assessmentSessionResult = await client.query(
            `INSERT INTO assessment_sessions (
                vacancy_id,
                session_date,
                venue,
                conducted_by,
                remarks
             )
             VALUES ($1, $2, $3, $4, $5)
             RETURNING
                assessment_session_id,
                vacancy_id,
                TO_CHAR(session_date, 'YYYY-MM-DD') AS session_date,
                venue,
                conducted_by,
                remarks,
                status,
                created_at,
                updated_at`,
            [
                String(vacancy_id),
                session_date,
                venue,
                panelistNames,
                remarks || ""
            ]
        );

        const assessmentSession = assessmentSessionResult.rows[0];
        const assessmentSessionId = assessmentSession.assessment_session_id;

        // 6. Save all panel assignments
        // This is inside the same transaction as the session creation.
        for (const userId of normalizedPanelUserIds) {
            await client.query(
                `INSERT INTO assessment_session_panel_members (
                    assessment_session_id,
                    user_id
                 )
                 VALUES ($1, $2)`,
                [assessmentSessionId, userId]
            );
        }

        // 7. Create one interview session per applicant
        const insertedSessions = [];

        for (const applicationId of selectedApplicants) {
            const result = await client.query(
                `INSERT INTO interview_sessions (
                    assessment_session_id,
                    vacancy_id,
                    job_applications_id,
                    session_date,
                    venue,
                    conducted_by,
                    remarks
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING
                    session_id,
                    assessment_session_id,
                    vacancy_id,
                    job_applications_id,
                    TO_CHAR(session_date, 'YYYY-MM-DD') AS session_date,
                    venue,
                    conducted_by,
                    remarks,
                    status,
                    created_at,
                    updated_at`,
                [
                    assessmentSessionId,
                    String(vacancy_id),
                    String(applicationId),
                    session_date,
                    venue,
                    panelistNames,
                    remarks || ""
                ]
            );

            insertedSessions.push(result.rows[0]);

            // 8. Update applicant status
            const updateStatus = await client.query(
                `UPDATE hr_remarks_final_notes h
                 SET application_status = 'for assessment'
                 FROM applicant_information ai
                 WHERE ai.applicant_id = h.applicant_id
                   AND ai.job_applications_id = $1
                 RETURNING h.applicant_id, h.application_status`,
                [String(applicationId)]
            );

            if (updateStatus.rowCount === 0) {
                const error = new Error(
                    `HR remarks status record not found for application: ${applicationId}`
                );
                error.statusCode = 404;
                throw error;
            }
        }

        // 9. Commit all database changes before sending emails
        await client.query("COMMIT");
        transactionStarted = false;

        // 10. Send invitation emails after the transaction commits
        const emailResults = [];

        for (const applicant of applicantsForEmail) {
            try {
                const emailResult = await sendAssessmentInvitationEmail({
                    email: applicant.email,
                    firstName: applicant.firstName,
                    lastName: applicant.lastName,
                    positionTitle: applicant.positionTitle,
                    applicationCode: applicant.applicationCode,
                    sessionDate: session_date,
                    sessionTime: null,
                    venue
                });

                emailResults.push({
                    applicant_id: applicant.applicant_id,
                    email: applicant.email,
                    sent: true,
                    messageId: emailResult?.messageId || null
                });
            } catch (emailError) {
                console.error(
                    `Assessment email failed for applicant ${applicant.applicant_id}:`,
                    emailError
                );

                emailResults.push({
                    applicant_id: applicant.applicant_id,
                    email: applicant.email,
                    sent: false,
                    error: emailError.message
                });
            }
        }

        // 11. Return the created session and assigned panel
        return res.status(201).json({
            message: "Assessment session created successfully.",
            assessmentSession,
            panelMembers: panelResult.rows.map(user => ({
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name
            })),
            panelMemberCount: normalizedPanelUserIds.length,
            sessions: insertedSessions,
            applicantStatus: "for assessment",
            emailNotifications: emailResults
        });
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Transaction rollback failed:", rollbackError);
            }
        }

        console.error("Error creating assessment session:", error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                error: error.message
            });
        }

        if (error.code === "23503") {
            return res.status(400).json({
                error: "Invalid database reference. Verify the vacancy, applicant, and panel member IDs."
            });
        }

        if (error.code === "23505") {
            return res.status(409).json({
                error: "A duplicate record was detected. Check the selected applicants and panel assignments."
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                error: "The applicant status violates a database constraint. Ensure 'for assessment' is an allowed status."
            });
        }

        return res.status(500).json({
            error: error.message || "Internal server error."
        });
    } finally {
        client.release();
    }
};


// GET /api/interview-sessions - Retrieve all interview sessions with joined details
// ============================================================
// GET /api/interview-sessions
// Retrieve assessment sessions grouped by session
// ============================================================

export const getInterviewSessions = async (req, res) => {

    try {

        const queryText = `

            SELECT

                a_session.assessment_session_id,

                a_session.vacancy_id,

                v.position_title,

                p.category,

                CASE

                    WHEN UPPER(TRIM(p.category))
                        IN (
                            'TEACHING',
                            'TEACHING POSITIONS'
                        )
                    THEN 'TEACHING'


                    WHEN UPPER(TRIM(p.category))
                        IN (
                            'RELATED TEACHING',
                            'RELATED-TEACHING',
                            'RELATED TEACHING POSITIONS'
                        )
                    THEN 'RELATED_TEACHING'


                    WHEN UPPER(TRIM(p.category))
                        IN (
                            'SCHOOL ADMINISTRATION',
                            'SCHOOL ADMINISTRATION POSITIONS'
                        )
                    THEN 'SCHOOL_ADMINISTRATION'


                    WHEN UPPER(TRIM(p.category))
                        IN (
                            'NON-TEACHING',
                            'NON TEACHING',
                            'NON-TEACHING POSITIONS',
                            'NON TEACHING POSITIONS'
                        )
                    THEN 'NON_TEACHING'


                    ELSE NULL

                END AS assessment_type,


                TO_CHAR(
                    a_session.session_date,
                    'YYYY-MM-DD'
                ) AS session_date,


                a_session.venue,

                a_session.conducted_by,

                a_session.remarks,

                a_session.status,


                COUNT(i.session_id) FILTER (
                    WHERE LOWER(
                        TRIM(COALESCE(h.application_status, ''))
                    ) <> 'rank'
                )
                    AS applicant_count,


                COALESCE(

                    JSON_AGG(

                        JSON_BUILD_OBJECT(

                            'session_id',
                            i.session_id,

                            'job_applications_id',
                            i.job_applications_id,

                            'applicant_id',
                            a.applicant_id,

                            'first_name',
                            a.first_name,

                            'middle_name',
                            a.middle_name,

                            'last_name',
                            a.last_name,

                            'suffix',
                            a.suffix,

                            'application_status',
                            h.application_status

                        )

                        ORDER BY
                            a.last_name ASC,
                            a.first_name ASC

                    )

                    FILTER (
                        WHERE i.session_id IS NOT NULL
                          AND LOWER(
                              TRIM(COALESCE(h.application_status, ''))
                          ) <> 'rank'
                    ),

                    '[]'::json

                ) AS applicants


            FROM assessment_sessions a_session


            INNER JOIN vacancies v

                ON v.vacancy_id =
                    a_session.vacancy_id


            INNER JOIN positions p

                ON p.position_id =
                    v.position_id


            LEFT JOIN interview_sessions i

                ON i.assessment_session_id =
                    a_session.assessment_session_id


            LEFT JOIN job_applications j

                ON j.job_applications_id =
                    i.job_applications_id


            LEFT JOIN applicant_information a

                ON a.job_applications_id =
                    j.job_applications_id


            LEFT JOIN hr_remarks_final_notes h

                ON h.applicant_id =
                    a.applicant_id


            GROUP BY

                a_session.assessment_session_id,

                a_session.vacancy_id,

                v.position_title,

                p.category,

                a_session.session_date,

                a_session.venue,

                a_session.conducted_by,

                a_session.remarks,

                a_session.status


            ORDER BY

                a_session.session_date DESC,

                a_session.assessment_session_id DESC;

        `;


        const result =
            await pool.query(queryText);


        return res.status(200).json({

            message:
                "Assessment sessions retrieved successfully.",

            sessions:
                result.rows

        });


    } catch (error) {

        console.error(
            "Error fetching assessment sessions:",
            error
        );


        return res.status(500).json({

            error:
                "Internal server error."

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