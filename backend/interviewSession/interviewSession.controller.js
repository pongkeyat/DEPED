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
        panelists,
        remarks
    } = req.body;

    // ============================================================
    // 1. VALIDATION
    // ============================================================

    if (
        !vacancy_id ||
        !session_date ||
        !venue ||
        !panelists
    ) {
        return res.status(400).json({
            error:
                "Vacancy ID, Session Date, Venue, and Panelists are required."
        });
    }

    if (
        !Array.isArray(selectedApplicants) ||
        selectedApplicants.length === 0
    ) {
        return res.status(400).json({
            error:
                "At least one job applicant must be selected."
        });
    }

    const client = await pool.connect();

    // Store email information here.
    // Emails will be sent ONLY after COMMIT.
    const applicantsForEmail = [];

    try {
        await client.query("BEGIN");

        // ========================================================
        // 2. VERIFY VACANCY
        // ========================================================

        const vacancyResult = await client.query(
            `
            SELECT
                v.vacancy_id,
                v.position_id,
                p.position_title
            FROM vacancies v
            INNER JOIN positions p
                ON p.position_id = v.position_id
            WHERE v.vacancy_id = $1
            LIMIT 1
            `,
            [String(vacancy_id)]
        );

        if (vacancyResult.rowCount === 0) {
            throw new Error(
                "Vacancy not found."
            );
        }

        const vacancy = vacancyResult.rows[0];

        // ========================================================
        // 3. VERIFY SELECTED APPLICANTS
        // ========================================================

        for (const applicationId of selectedApplicants) {
            const applicantResult = await client.query(
                `
                SELECT
                    ai.applicant_id,
                    ai.job_applications_id,
                    ai.first_name,
                    ai.middle_name,
                    ai.last_name,
                    ai.suffix,
                    ai.email_address,
                    ai.application_code,
                    h.application_status
                FROM applicant_information ai
                LEFT JOIN hr_remarks_final_notes h
                    ON h.applicant_id = ai.applicant_id
                INNER JOIN job_applications ja
                    ON ja.job_applications_id =
                        ai.job_applications_id
                WHERE ai.job_applications_id = $1
                  AND ja.vacancy_id = $2
                LIMIT 1
                `,
                [
                    String(applicationId),
                    String(vacancy_id)
                ]
            );

            if (applicantResult.rowCount === 0) {
                throw new Error(
                    `Applicant/application not found for: ${applicationId}`
                );
            }

            const applicant = applicantResult.rows[0];

            // ----------------------------------------------------
            // ONLY QUALIFIED APPLICANTS CAN BE SCHEDULED
            // ----------------------------------------------------

            const normalizedStatus = String(
                applicant.application_status || ""
            )
                .trim()
                .toLowerCase();

            if (
                normalizedStatus !== "qualified" &&
                normalizedStatus !==
                    "initial_screening_qualified"
            ) {
                throw new Error(
                    `Applicant ${applicationId} is not qualified for assessment.`
                );
            }

            // ----------------------------------------------------
            // APPLICATION CODE MUST EXIST
            // ----------------------------------------------------

            if (!applicant.application_code) {
                throw new Error(
                    `Applicant ${applicationId} does not have an application code.`
                );
            }

            // ----------------------------------------------------
            // SAVE INFORMATION FOR EMAIL
            // ----------------------------------------------------

            applicantsForEmail.push({
                applicant_id: applicant.applicant_id,
                job_applications_id:
                    applicant.job_applications_id,
                firstName: applicant.first_name,
                lastName: applicant.last_name,
                email: applicant.email_address,
                applicationCode:
                    applicant.application_code,
                positionTitle:
                    vacancy.position_title
            });
        }

        // ========================================================
        // 4. CREATE PARENT ASSESSMENT SESSION
        // ========================================================

        const assessmentSessionResult =
            await client.query(
                `
                INSERT INTO assessment_sessions (
                    vacancy_id,
                    session_date,
                    venue,
                    conducted_by,
                    remarks
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5
                )
                RETURNING
                    assessment_session_id,
                    vacancy_id,
                    TO_CHAR(
                        session_date,
                        'YYYY-MM-DD'
                    ) AS session_date,
                    venue,
                    conducted_by,
                    remarks,
                    status,
                    created_at,
                    updated_at
                `,
                [
                    String(vacancy_id),
                    session_date,
                    venue,
                    panelists,
                    remarks || ""
                ]
            );

        const assessmentSession =
            assessmentSessionResult.rows[0];

        const assessmentSessionId =
            assessmentSession.assessment_session_id;

        // ========================================================
        // 5. CREATE INDIVIDUAL INTERVIEW SESSION
        // ========================================================

        const insertedSessions = [];

        for (const applicationId of selectedApplicants) {
            const result = await client.query(
                `
                INSERT INTO interview_sessions (
                    assessment_session_id,
                    vacancy_id,
                    job_applications_id,
                    session_date,
                    venue,
                    conducted_by,
                    remarks
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7
                )
                RETURNING
                    session_id,
                    assessment_session_id,
                    vacancy_id,
                    job_applications_id,
                    TO_CHAR(
                        session_date,
                        'YYYY-MM-DD'
                    ) AS session_date,
                    venue,
                    conducted_by,
                    remarks,
                    status,
                    created_at,
                    updated_at
                `,
                [
                    assessmentSessionId,
                    String(vacancy_id),
                    String(applicationId),
                    session_date,
                    venue,
                    panelists,
                    remarks || ""
                ]
            );

            insertedSessions.push(
                result.rows[0]
            );

            // ====================================================
            // 6. UPDATE APPLICANT STATUS
            // ====================================================

            const updateStatus =
                await client.query(
                    `
                    UPDATE hr_remarks_final_notes h
                    SET application_status =
                        'for assessment'
                    FROM applicant_information ai
                    WHERE ai.applicant_id =
                        h.applicant_id
                      AND ai.job_applications_id =
                        $1
                    RETURNING
                        h.applicant_id,
                        h.application_status
                    `,
                    [
                        String(applicationId)
                    ]
                );

            if (updateStatus.rowCount === 0) {
                throw new Error(
                    `HR remarks status record not found for application: ${applicationId}`
                );
            }
        }

        // ========================================================
        // 7. COMMIT DATABASE CHANGES
        // ========================================================

        await client.query("COMMIT");

        // ========================================================
        // 8. SEND ASSESSMENT EMAILS
        // ========================================================
        //
        // IMPORTANT:
        // Emails are sent AFTER COMMIT.
        //
        // If an email fails, the assessment session remains
        // successfully saved in the database.
        // ========================================================

        const emailResults = [];

        for (const applicant of applicantsForEmail) {
            try {
                const emailResult =
                    await sendAssessmentInvitationEmail({
                        email: applicant.email,
                        firstName: applicant.firstName,
                        lastName: applicant.lastName,
                        positionTitle:
                            applicant.positionTitle,
                        applicationCode:
                            applicant.applicationCode,
                        sessionDate:
                            session_date,
                        sessionTime: null,
                        venue
                    });

                emailResults.push({
                    applicant_id:
                        applicant.applicant_id,
                    email:
                        applicant.email,
                    sent: true,
                    messageId:
                        emailResult?.messageId || null
                });
            } catch (emailError) {
                console.error(
                    `Assessment email failed for applicant ${applicant.applicant_id}:`,
                    emailError
                );

                emailResults.push({
                    applicant_id:
                        applicant.applicant_id,
                    email:
                        applicant.email,
                    sent: false,
                    error:
                        emailError.message
                });
            }
        }

        // ========================================================
        // 9. RESPONSE
        // ========================================================

        return res.status(201).json({
            message:
                "Assessment session created successfully. Applicants scheduled for assessment and email notifications processed.",

            assessmentSession,

            sessions:
                insertedSessions,

            applicantStatus:
                "for assessment",

            emailNotifications:
                emailResults
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Error creating assessment session:",
            error
        );

        // ========================================================
        // FOREIGN KEY ERROR
        // ========================================================

        if (error.code === "23503") {
            return res.status(400).json({
                error:
                    "Invalid database reference. Verify your vacancy and applicant IDs."
            });
        }

        // ========================================================
        // DUPLICATE APPLICANT / SESSION
        // ========================================================

        if (error.code === "23505") {
            return res.status(409).json({
                error:
                    "One or more applicants are already scheduled for this vacancy."
            });
        }

        // ========================================================
        // APPLICANT NOT QUALIFIED
        // ========================================================

        if (
            error.message?.includes(
                "is not qualified for assessment"
            )
        ) {
            return res.status(400).json({
                error: error.message
            });
        }

        // ========================================================
        // APPLICATION CODE MISSING
        // ========================================================

        if (
            error.message?.includes(
                "does not have an application code"
            )
        ) {
            return res.status(400).json({
                error: error.message
            });
        }

        // ========================================================
        // APPLICANT NOT FOUND
        // ========================================================

        if (
            error.message?.includes(
                "Applicant/application not found"
            )
        ) {
            return res.status(404).json({
                error: error.message
            });
        }

        // ========================================================
        // HR STATUS RECORD MISSING
        // ========================================================

        if (
            error.message?.includes(
                "HR remarks status record not found"
            )
        ) {
            return res.status(404).json({
                error: error.message
            });
        }

        // ========================================================
        // STATUS CONSTRAINT
        // ========================================================

        if (error.code === "23514") {
            return res.status(400).json({
                error:
                    "The applicant status violates a database constraint. Ensure 'for assessment' is an allowed status."
            });
        }

        // ========================================================
        // GENERIC ERROR
        // ========================================================

        return res.status(500).json({
            error:
                error.message ||
                "Internal server error."
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