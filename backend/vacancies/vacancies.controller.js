import pool from "../config/db.js";
import cron from "node-cron";

import {
    createVacancyService,
    createQualificationService,
    createRemarkService,
    getAllVacanciesService,
    getVacancyByIdService,
    updateVacancyStatusService,
    updateVacancyService,
    archiveVacancyService
} from "./vacancies.services.js";

import {
    sendInitialScreeningEmail,
    sendRequirementsReminderEmail,
} from "./email.service.js";

// ============================================================
// HELPER: Generate Vacancy ID
// Example: VCY-2026-0001
// ============================================================

const generateVacancyId = async (client) => {
    const currentYear = new Date().getFullYear();
    const prefix = `VCY-${currentYear}-`;

    const result = await client.query(
        `SELECT vacancy_id
         FROM vacancies
         WHERE vacancy_id LIKE $1
         ORDER BY vacancy_id DESC
         LIMIT 1`,
        [`${prefix}%`]
    );

    let nextSequence = 1;

    if (result.rows.length > 0) {
        const lastId = result.rows[0].vacancy_id;
        const lastSequence = parseInt(lastId.split("-")[2], 10);
        nextSequence = lastSequence + 1;
    }

    return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};

const getDateKey = (value) => {
    if (!value) return "";
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
};

const sendVacancyDeadlineReminders = async (vacancyId) => {
    const applicantsResult = await pool.query(
        `
        SELECT
            ai.email_address,
            ai.first_name,
            ai.last_name,
            ai.ticket,
            COALESCE(p.position_title, v.position_title) AS position_title,
            v.application_deadline
        FROM public.vacancies AS v
        LEFT JOIN public.positions AS p
            ON p.position_id = v.position_id
        JOIN public.job_applications AS ja
            ON ja.vacancy_id = v.vacancy_id
        JOIN public.applicant_information AS ai
            ON ai.job_applications_id = ja.job_applications_id
        WHERE v.vacancy_id = $1
          AND ai.email_address IS NOT NULL
          AND TRIM(ai.email_address) <> ''
        ORDER BY ai.applicant_id
        `,
        [vacancyId]
    );

    const emailReminders = {
        recipients: applicantsResult.rowCount,
        sent: 0,
        failed: 0,
    };

    for (const applicant of applicantsResult.rows) {
        const result = await sendRequirementsReminderEmail(
            applicant.email_address,
            applicant.first_name,
            applicant.last_name,
            applicant.ticket,
            applicant.position_title,
            applicant.application_deadline
        );

        if (result?.success) {
            emailReminders.sent++;
        } else {
            emailReminders.failed++;
            console.error(
                `[Requirements Reminder] Failed for ${applicant.email_address}:`,
                result?.error || "Unknown email error"
            );
        }
    }

    return emailReminders;
};

// ============================================================
// POST /api/vacancies
// CREATE COMPLETE VACANCY
// ============================================================

export const postCompleteVacancy = async (req, res) => {
    const {
        position_id,
        plantilla_position,
        office_unit,
        place_of_assignment,
        number_of_vacancies,
        application_posted,
        application_deadline,
        education_requirement,
        training_requirement,
        experience_requirement,
        eligibility_requirement,
        remark_text
    } = req.body;

    if (
        !position_id ||
        !plantilla_position ||
        !office_unit ||
        !place_of_assignment ||
        !number_of_vacancies ||
        !application_posted ||
        !application_deadline ||
        !education_requirement ||
        !training_requirement ||
        !experience_requirement ||
        !eligibility_requirement
    ) {
        return res.status(400).json({
            success: false,
            error: "All required fields must be provided."
        });
    }

    const postedDate = new Date(application_posted);

    if (isNaN(postedDate.getTime())) {
        return res.status(400).json({
            success: false,
            error: "Invalid application posted date."
        });
    }

    const deadlineDate = new Date(application_deadline);

    if (isNaN(deadlineDate.getTime())) {
        return res.status(400).json({
            success: false,
            error: "Invalid application deadline."
        });
    }

    if (
        deadlineDate <
        new Date(
            postedDate.getFullYear(),
            postedDate.getMonth(),
            postedDate.getDate()
        )
    ) {
        return res.status(400).json({
            success: false,
            error: "Application deadline cannot be before the posted date."
        });
    }

    const now = new Date();

    const todayDate = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");

    const postedDateString = [
        postedDate.getFullYear(),
        String(postedDate.getMonth() + 1).padStart(2, "0"),
        String(postedDate.getDate()).padStart(2, "0")
    ].join("-");

    if (postedDateString !== todayDate) {
        return res.status(400).json({
            success: false,
            error: "The application posted date must be today's date."
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const vacancyId = await generateVacancyId(client);

        const newVacancy = await createVacancyService(
            client,
            {
                ...req.body,
                vacancy_id: vacancyId
            }
        );

        const newQualification =
            await createQualificationService(
                client,
                vacancyId,
                req.body
            );

        const newRemark = await createRemarkService(
            client,
            vacancyId,
            remark_text
        );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Vacancy successfully created with qualifications and remarks.",
            data: {
                vacancy: newVacancy,
                qualifications: newQualification,
                remarks: newRemark
            }
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Error creating vacancy:", error);

        if (error.message === "POSITION_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                error: "Selected position ID does not exist."
            });
        }

        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });

    } finally {
        client.release();
    }
};

// ============================================================
// GET /api/vacancies
// GET ALL VACANCIES WITH SEARCH, FILTER, AND PAGINATION
// ============================================================

export const getAllVacancies = async (req, res) => {
    try {
        // Fallback: automatically transition expired Open vacancies.
        // The scheduled job can also perform this update.
        await pool.query(`
            UPDATE public.vacancies
            SET status = 'Evaluation'
            WHERE status = 'Open'
              AND application_deadline <= CURRENT_DATE
              AND is_archived = FALSE
        `);

        const {
            search = "",
            status = "",
            plantilla_position = "",
            office_unit = "",
            place_of_assignment = "",
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

        if (status) {
            params.push(status);
            conditions.push(`v.status = $${params.length}`);
        }

        if (plantilla_position) {
            params.push(`%${plantilla_position}%`);
            conditions.push(
                `v.plantilla_position ILIKE $${params.length}`
            );
        }

        if (office_unit) {
            params.push(`%${office_unit}%`);
            conditions.push(
                `v.office_unit ILIKE $${params.length}`
            );
        }

        if (place_of_assignment) {
            params.push(`%${place_of_assignment}%`);
            conditions.push(
                `v.place_of_assignment ILIKE $${params.length}`
            );
        }

        if (search) {
            params.push(`%${search}%`);

            conditions.push(`
                (
                    v.plantilla_position ILIKE $${params.length}
                    OR v.office_unit ILIKE $${params.length}
                    OR v.place_of_assignment ILIKE $${params.length}
                    OR v.vacancy_id ILIKE $${params.length}
                    OR p.position_title ILIKE $${params.length}
                )
            `);
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const dataQuery = `
            SELECT
                v.vacancy_id,
                v.position_id,
                v.plantilla_position,
                v.office_unit,
                v.place_of_assignment,
                v.number_of_vacancies,
                v.application_posted,
                v.application_deadline,
                v.status,
                v.salary_grade,
                v.is_archived,
                p.position_title,
                p.category,
                q.qualification_id,
                q.education_requirement,
                q.training_requirement,
                q.experience_requirement,
                q.eligibility_requirement,
                r.remark_text,
                r.memo
            FROM public.vacancies v
            LEFT JOIN public.positions p
                ON v.position_id = p.position_id
            LEFT JOIN public.vacancy_specific_qualifications q
                ON v.vacancy_id = q.vacancy_id
            LEFT JOIN public.vacancies_remarks r
                ON v.vacancy_id = r.vacancy_id
            ${whereClause}
            ORDER BY
                v.application_posted DESC,
                v.vacancy_id DESC
            LIMIT $${params.length + 1}
            OFFSET $${params.length + 2}
        `;

        const countQuery = `
            SELECT COUNT(DISTINCT v.vacancy_id)
            FROM public.vacancies v
            LEFT JOIN public.positions p
                ON v.position_id = p.position_id
            ${whereClause}
        `;

        const [
            vacanciesResult,
            countResult
        ] = await Promise.all([
            pool.query(
                dataQuery,
                [...params, parsedLimit, offset]
            ),
            pool.query(countQuery, params)
        ]);

        const totalItems = parseInt(
            countResult.rows[0].count,
            10
        );

        const totalPages = Math.ceil(
            totalItems / parsedLimit
        );

        return res.status(200).json({
            success: true,
            pagination: {
                totalItems,
                totalPages,
                currentPage: parsedPage,
                limit: parsedLimit
            },
            data: vacanciesResult.rows
        });

    } catch (error) {
        console.error("Error fetching all vacancies:", error);

        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

// ============================================================
// GET /api/vacancies/:id
// GET SINGLE VACANCY
// ============================================================

export const getVacancyById = async (req, res) => {
    const { id } = req.params;

    try {
        // Fallback deadline check for this vacancy.
        await pool.query(
            `
            UPDATE public.vacancies
            SET status = 'Evaluation'
            WHERE vacancy_id = $1
              AND status = 'Open'
              AND application_deadline <= CURRENT_DATE
              AND is_archived = FALSE
            `,
            [id]
        );

        const vacancy = await getVacancyByIdService(id);

        if (!vacancy) {
            return res.status(404).json({
                success: false,
                error: `Vacancy with ID '${id}' not found.`
            });
        }

        return res.status(200).json({
            success: true,
            data: vacancy
        });

    } catch (error) {
        console.error(
            `Error fetching vacancy ${id}:`,
            error
        );

        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

// ============================================================
// PUT /api/vacancies/:id
// EDIT COMPLETE VACANCY
// ============================================================

export const updateVacancy = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Fetch existing vacancy first
        const existingVacancy = await getVacancyByIdService(id);

        if (!existingVacancy) {
            return res.status(404).json({
                success: false,
                error: `Vacancy with ID '${id}' not found.`
            });
        }

        if (
            existingVacancy.is_archived === true ||
            String(existingVacancy.status).toLowerCase() === "archived"
        ) {
            return res.status(400).json({
                success: false,
                error: "Archived vacancies cannot be edited."
            });
        }

        // 2. Fallback to existing values if fields are not provided in req.body
        const position_id = req.body.position_id ?? existingVacancy.position_id;
        const plantilla_position = req.body.plantilla_position ?? existingVacancy.plantilla_position;
        const office_unit = req.body.office_unit ?? existingVacancy.office_unit;
        const place_of_assignment = req.body.place_of_assignment ?? existingVacancy.place_of_assignment;
        const number_of_vacancies = req.body.number_of_vacancies ?? existingVacancy.number_of_vacancies;
        const application_posted = req.body.application_posted ?? existingVacancy.application_posted;
        const application_deadline = req.body.application_deadline ?? existingVacancy.application_deadline;
        const deadlineChanged =
            getDateKey(application_deadline) !==
            getDateKey(existingVacancy.application_deadline);

        // Handle nested qualifications structure safely
        const existingQuals = existingVacancy.qualifications || existingVacancy;
        const education_requirement = req.body.education_requirement ?? existingQuals.education_requirement;
        const training_requirement = req.body.training_requirement ?? existingQuals.training_requirement;
        const experience_requirement = req.body.experience_requirement ?? existingQuals.experience_requirement;
        const eligibility_requirement = req.body.eligibility_requirement ?? existingQuals.eligibility_requirement;
        
        const remark_text = req.body.remark_text ?? existingVacancy.remark_text;

        // 3. Validate dates
        const postedDate = new Date(application_posted);
        const deadlineDate = new Date(application_deadline);

        if (isNaN(postedDate.getTime()) || isNaN(deadlineDate.getTime())) {
            return res.status(400).json({
                success: false,
                error: "Invalid application dates."
            });
        }

        if (deadlineDate < postedDate) {
            return res.status(400).json({
                success: false,
                error: "Application deadline cannot be before the posted date."
            });
        }

        // 4. Perform update
        const updatedVacancy = await updateVacancyService(
            id,
            {
                position_id,
                plantilla_position,
                office_unit,
                place_of_assignment,
                number_of_vacancies,
                application_posted,
                application_deadline,
                qualifications: {
                    education_requirement,
                    training_requirement,
                    experience_requirement,
                    eligibility_requirement
                },
                remark_text
            }
        );

        let emailReminders = null;
        if (deadlineChanged) {
            try {
                emailReminders = await sendVacancyDeadlineReminders(id);
            } catch (emailError) {
                console.error(
                    `Failed to send deadline reminders for vacancy ${id}:`,
                    emailError
                );
                emailReminders = {
                    recipients: null,
                    sent: 0,
                    failed: null,
                    error: "Unable to send deadline reminder emails.",
                };
            }
        }

        return res.status(200).json({
            success: true,
            message: emailReminders?.error
                ? "Vacancy updated, but deadline reminder emails could not be sent."
                : emailReminders?.recipients === 0
                  ? "Vacancy updated, but there are no applicant email addresses to notify."
                : emailReminders?.failed
                  ? "Vacancy updated, but some deadline reminder emails failed."
                  : "Vacancy successfully updated.",
            data: updatedVacancy,
            ...(deadlineChanged ? { emailReminders } : {}),
        });

    } catch (error) {
        console.error(
            `Error updating vacancy ${id}:`,
            error
        );

        if (error.message === "POSITION_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                error: "Selected position ID does not exist."
            });
        }

        if (error.message === "VACANCY_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                error: `Vacancy with ID '${id}' not found.`
            });
        }

        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

// ============================================================
// PATCH /api/vacancies/:id/archive
// ARCHIVE CLOSED VACANCIES ONLY
// ============================================================

export const archiveVacancy = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            UPDATE public.vacancies
            SET is_archived = TRUE
            WHERE vacancy_id = $1
              AND status = 'Closed'
              AND is_archived = FALSE
            RETURNING vacancy_id, status, is_archived
            `,
            [id]
        );

        if (result.rows.length === 0) {
            const existing = await pool.query(
                `
                SELECT status, is_archived
                FROM public.vacancies
                WHERE vacancy_id = $1
                `,
                [id]
            );

            if (existing.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Vacancy not found."
                });
            }

            if (existing.rows[0].is_archived) {
                return res.status(400).json({
                    success: false,
                    message: "Vacancy is already archived."
                });
            }

            return res.status(400).json({
                success: false,
                message: "Only closed vacancies can be archived."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Closed vacancy archived successfully.",
            vacancy: result.rows[0]
        });

    } catch (error) {
        console.error("Archive vacancy error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to archive vacancy."
        });
    }
};

// ============================================================
// PATCH /api/vacancies/:id/status
// WORKFLOW: OPEN -> EVALUATION -> ASSESSMENT -> CLOSED
// ============================================================



export const updateVacancyStatus = async (req, res) => {
    const { id } = req.params;
    const { memo, status: requestedStatus } = req.body;

    const client = await pool.connect();

    let updatedApplicants = 0;
    let updatedApplicantIds = [];
    let previousStatus;
    let nextStatus;
    let deadline;
    let deadlinePassed;
    let screeningTriggered = false;

    try {
        await client.query("BEGIN");

        // GET VACANCY
        const vacancyResult = await client.query(
            `
            SELECT
                vacancy_id,
                status,
                application_deadline,
                application_deadline <= CURRENT_DATE AS deadline_passed
            FROM public.vacancies
            WHERE vacancy_id = $1
              AND is_archived = FALSE
            FOR UPDATE
            `,
            [id]
        );

        if (vacancyResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                error: `Vacancy '${id}' not found or archived.`,
            });
        }

        const vacancy = vacancyResult.rows[0];

        previousStatus = vacancy.status;
        nextStatus = previousStatus;
        deadline = vacancy.application_deadline;
        deadlinePassed = vacancy.deadline_passed;

        // VALIDATE TERMINATION MEMO
        let cleanedMemo = null;

        if (requestedStatus === "Terminated") {
            cleanedMemo =
                typeof memo === "string" ? memo.trim() : "";

            if (!cleanedMemo) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    error: "A memo is required when terminating a vacancy.",
                });
            }

            if (previousStatus === "Terminated") {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    error: "This vacancy has already been terminated.",
                });
            }
        }

        // DETERMINE NEXT STATUS
        if (requestedStatus === "Terminated") {
            nextStatus = "Terminated";
        } else if (
            requestedStatus === "Assessment" &&
            ["Evaluation", "Terminated"].includes(previousStatus)
        ) {
            // Allow Evaluation or Terminated -> Assessment
            // when the API explicitly requests Assessment.
            nextStatus = "Assessment";
        } else if (requestedStatus === "Evaluation") {
            nextStatus = "Evaluation";
        } else if (
            previousStatus === "Open" &&
            deadlinePassed
        ) {
            nextStatus = "Evaluation";
        } else if (previousStatus === "Evaluation") {
            nextStatus = "Assessment";
        } else if (previousStatus === "Assessment") {
            nextStatus = "Closed";
        } else if (previousStatus === "Closed") {
            nextStatus = "Closed";
        }

        // DETERMINE WHETHER INITIAL SCREENING SHOULD RUN
        screeningTriggered =
            previousStatus !== nextStatus &&
            ["Evaluation", "Terminated"].includes(nextStatus);

        // UPDATE VACANCY STATUS
        await client.query(
            `
            UPDATE public.vacancies
            SET status = $1
            WHERE vacancy_id = $2
            `,
            [nextStatus, id]
        );

        // SAVE TERMINATION MEMO
        if (
            requestedStatus === "Terminated" &&
            cleanedMemo
        ) {
            await client.query(
                `
                INSERT INTO public.vacancies_remarks (
                    vacancy_id,
                    remark_text,
                    memo
                )
                VALUES ($1, $2, $3)
                `,
                [id, cleanedMemo, cleanedMemo]
            );
        }

        // MOVE COMPLETE APPLICANTS TO INITIAL SCREENING
        if (screeningTriggered) {
            const applicationUpdateResult = await client.query(
                `
                UPDATE public.hr_remarks_final_notes AS hr
                SET
                    application_status = 'initial screening',
                    updated_at = CURRENT_TIMESTAMP
                FROM public.applicant_information AS ai
                JOIN public.job_applications AS ja
                    ON ja.job_applications_id =
                       ai.job_applications_id
                WHERE hr.applicant_id = ai.applicant_id
                  AND ja.vacancy_id = $1
                  AND LOWER(TRIM(hr.application_status)) = 'complete'
                RETURNING hr.applicant_id
                `,
                [id]
            );

            updatedApplicants = applicationUpdateResult.rowCount;

            updatedApplicantIds = applicationUpdateResult.rows.map(
                (applicant) => applicant.applicant_id
            );
        }

        await client.query("COMMIT");
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Rollback error:", rollbackError);
        }

        console.error(
            `Error updating status for vacancy ${id}:`,
            error
        );

        return res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    } finally {
        client.release();
    }

    // SEND INITIAL SCREENING EMAILS
    let emailsSent = 0;
    let emailsFailed = 0;

    if (
        screeningTriggered &&
        updatedApplicantIds.length > 0
    ) {
        try {
            const applicantsResult = await pool.query(
                `
                SELECT
                    applicant_id,
                    first_name,
                    last_name,
                    email_address,
                    ticket
                FROM public.applicant_information
                WHERE applicant_id = ANY($1)
                  AND email_address IS NOT NULL
                  AND TRIM(email_address) <> ''
                `,
                [updatedApplicantIds]
            );

            for (const applicant of applicantsResult.rows) {
                try {
                    const result = await sendInitialScreeningEmail(
                        applicant.email_address,
                        applicant.first_name,
                        applicant.last_name,
                        applicant.ticket
                    );

                    if (result?.success) {
                        emailsSent++;
                    } else {
                        emailsFailed++;
                    }
                } catch (emailError) {
                    emailsFailed++;

                    console.error(
                        `Initial screening email failed for applicant ${applicant.applicant_id}:`,
                        emailError
                    );
                }
            }
        } catch (emailQueryError) {
            console.error(
                "Failed to retrieve applicants for initial screening emails:",
                emailQueryError
            );
        }
    }

    // GET UPDATED VACANCY
    const updatedVacancyResult = await pool.query(
        `
        SELECT *
        FROM public.vacancies
        WHERE vacancy_id = $1
        `,
        [id]
    );

    // RESPONSE
    return res.status(200).json({
        success: true,
        message:
            previousStatus === nextStatus
                ? `Vacancy status remains ${nextStatus}.`
                : `Vacancy status changed from ${previousStatus} to ${nextStatus}.`,
        previousStatus,
        currentStatus: nextStatus,
        deadline,
        deadlinePassed,
        data: updatedVacancyResult.rows[0],
        applicantsUpdated: updatedApplicants,
        emailsSent,
        emailsFailed,
    });
};

// ============================================================
// AUTOMATED REQUIREMENTS REMINDER
// Send a reminder at 8:00 AM Philippine time when a vacancy's
// application deadline is exactly two days away.
// ============================================================

const sendUpcomingDeadlineRequirementsReminders = async () => {
    try {
        console.log(
            "[Requirements Reminder] Checking upcoming deadlines..."
        );

        // Get today's date in Philippine time.
        const manilaDate = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date());

        // Calculate the date two days from today.
        const today = new Date(`${manilaDate}T00:00:00`);
        today.setDate(today.getDate() + 2);

        const targetDeadline = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0"),
        ].join("-");

        console.log(
            `[Requirements Reminder] Target deadline: ${targetDeadline}`
        );

        const applicantsResult = await pool.query(
            `
            SELECT
                ai.email_address,
                ai.first_name,
                ai.last_name,
                ai.ticket,
                p.position_title,
                v.application_deadline,
                v.vacancy_id
            FROM public.vacancies AS v
            LEFT JOIN public.positions AS p
                ON p.position_id = v.position_id
            JOIN public.job_applications AS ja
                ON ja.vacancy_id = v.vacancy_id
            JOIN public.applicant_information AS ai
                ON ai.job_applications_id = ja.job_applications_id
            WHERE v.application_deadline = $1::date
              AND v.status = 'Open'
              AND v.is_archived = FALSE
              AND ai.email_address IS NOT NULL
              AND TRIM(ai.email_address) <> ''
            ORDER BY v.vacancy_id, ai.applicant_id
            `,
            [targetDeadline]
        );

        console.log(
            `[Requirements Reminder] Applicants found: ${applicantsResult.rowCount}`
        );

        let emailsSent = 0;
        let emailsFailed = 0;

        for (const applicant of applicantsResult.rows) {
            try {
                const result = await sendRequirementsReminderEmail(
                    applicant.email_address,
                    applicant.first_name,
                    applicant.last_name,
                    applicant.ticket,
                    applicant.position_title,
                    applicant.application_deadline
                );

                if (result?.success) {
                    emailsSent++;

                    console.log(
                        `[Requirements Reminder] Email sent to ${applicant.email_address}`
                    );
                } else {
                    emailsFailed++;

                    console.error(
                        `[Requirements Reminder] Failed for ${applicant.email_address}:`,
                        result?.error || "Unknown email error"
                    );
                }
            } catch (emailError) {
                emailsFailed++;

                console.error(
                    `[Requirements Reminder] Error sending to ${applicant.email_address}:`,
                    emailError
                );
            }
        }

        console.log(
            `[Requirements Reminder] Finished. Found: ${applicantsResult.rowCount}, sent: ${emailsSent}, failed: ${emailsFailed}.`
        );
    } catch (error) {
        console.error(
            "[Requirements Reminder] Scheduled check failed:",
            error
        );
    }
};

// ============================================================
// RUN DAILY AT 8:00 AM PHILIPPINE TIME
// ============================================================

cron.schedule(
    "0 8 * * *",
    sendUpcomingDeadlineRequirementsReminders,
    {
        timezone: "Asia/Manila",
    }
);
