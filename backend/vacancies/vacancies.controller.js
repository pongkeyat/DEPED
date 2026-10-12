
import pool from "../config/db.js";

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

import { sendInitialScreeningEmail } from "./email.service.js";

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
                r.remark_text
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
        number_of_vacancies === undefined ||
        number_of_vacancies === null ||
        Number(number_of_vacancies) <= 0 ||
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
    const deadlineDate = new Date(application_deadline);

    if (
        isNaN(postedDate.getTime()) ||
        isNaN(deadlineDate.getTime())
    ) {
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

    try {
        const existingVacancy =
            await getVacancyByIdService(id);

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

        return res.status(200).json({
            success: true,
            message: "Vacancy successfully updated.",
            data: updatedVacancy
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
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

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
                error: `Vacancy '${id}' not found or archived.`
            });
        }

        const vacancy = vacancyResult.rows[0];
        const previousStatus = vacancy.status;
        let nextStatus = previousStatus;

        // Each API call advances only one stage.
        if (previousStatus === "Evaluation") {
            nextStatus = "Assessment";
        } else if (previousStatus === "Assessment") {
            nextStatus = "Closed";
        } else if (
            previousStatus === "Open" &&
            vacancy.deadline_passed
        ) {
            nextStatus = "Evaluation";
        } else if (previousStatus === "Closed") {
            nextStatus = "Closed";
        }

        const vacancyUpdateResult = await client.query(
            `
            UPDATE public.vacancies
            SET status = $1
            WHERE vacancy_id = $2
            RETURNING *
            `,
            [nextStatus, id]
        );

        let updatedApplicants = 0;
        let updatedApplicantIds = [];

        // When the vacancy first becomes Closed, update eligible applicants.
        if (
            previousStatus !== "Closed" &&
            nextStatus === "Closed"
        ) {
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

        let emailsSent = 0;
        let emailsFailed = 0;

        // Send initial screening emails only on transition to Closed.
        if (
            previousStatus !== "Closed" &&
            nextStatus === "Closed" &&
            updatedApplicantIds.length > 0
        ) {
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
        }

        return res.status(200).json({
            success: true,
            message: previousStatus === nextStatus
                ? `Vacancy status remains ${nextStatus}.`
                : `Vacancy status changed from ${previousStatus} to ${nextStatus}.`,
            previousStatus,
            currentStatus: nextStatus,
            deadline: vacancy.application_deadline,
            deadlinePassed: vacancy.deadline_passed,
            data: vacancyUpdateResult.rows[0],
            applicantsUpdated: updatedApplicants,
            emailsSent,
            emailsFailed
        });

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
            error: "Internal server error"
        });

    } finally {
        client.release();
    }
};
