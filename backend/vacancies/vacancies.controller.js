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

    // Validate required fields
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

    // Validate dates
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

    if (deadlineDate < new Date(
        postedDate.getFullYear(),
        postedDate.getMonth(),
        postedDate.getDate()
    )) {
        return res.status(400).json({
            success: false,
            error: "Application deadline cannot be before the posted date."
        });
    }

    // Compare local calendar dates instead of UTC dates
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

        // 1. Generate Vacancy ID
        const vacancyId = await generateVacancyId(client);

        // 2. Create Vacancy
        const newVacancy = await createVacancyService(
            client,
            {
                ...req.body,
                vacancy_id: vacancyId
            }
        );

        // 3. Create Qualifications
        const newQualification =
            await createQualificationService(
                client,
                vacancyId,
                req.body
            );

        // 4. Create Remarks
        const newRemark =
            await createRemarkService(
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
        // Automatically close expired vacancies.
        // Archived vacancies must remain archived.
        await pool.query(
            `UPDATE vacancies
             SET status = 'Closed'
             WHERE application_deadline < CURRENT_DATE
               AND status NOT IN ('Closed', 'Archived')`
        );

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

        // Status Filter
        if (status) {
            params.push(status);

            conditions.push(
                `v.status = $${params.length}`
            );
        }

        // Plantilla Position Filter
        if (plantilla_position) {
            params.push(`%${plantilla_position}%`);

            conditions.push(
                `v.plantilla_position ILIKE $${params.length}`
            );
        }

        // Office Unit Filter
        if (office_unit) {
            params.push(`%${office_unit}%`);

            conditions.push(
                `v.office_unit ILIKE $${params.length}`
            );
        }

        // Place of Assignment Filter
        if (place_of_assignment) {
            params.push(`%${place_of_assignment}%`);

            conditions.push(
                `v.place_of_assignment ILIKE $${params.length}`
            );
        }

        // General Search
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

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        // Get Vacancy Data
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
                p.position_title,
                p.category,

                q.qualification_id,
                q.education_requirement,
                q.training_requirement,
                q.experience_requirement,
                q.eligibility_requirement,

                r.remark_text

            FROM vacancies v

            LEFT JOIN positions p
                ON v.position_id = p.position_id

            LEFT JOIN vacancy_specific_qualifications q
                ON v.vacancy_id = q.vacancy_id

            LEFT JOIN vacancies_remarks r
                ON v.vacancy_id = r.vacancy_id

            ${whereClause}

            ORDER BY
                v.application_posted DESC,
                v.vacancy_id DESC

            LIMIT $${params.length + 1}
            OFFSET $${params.length + 2}
        `;

        // Count Vacancies
        const countQuery = `
            SELECT COUNT(DISTINCT v.vacancy_id)

            FROM vacancies v

            LEFT JOIN positions p
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
        // Automatically close expired vacancies
        // without changing archived vacancies.
        await pool.query(
            `UPDATE vacancies
             SET status = 'Closed'
             WHERE vacancy_id = $1
               AND application_deadline < CURRENT_DATE
               AND status NOT IN ('Closed', 'Archived')`,
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

    // Validate required fields
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

    // Validate dates
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
        // Get existing vacancy
        const existingVacancy =
            await getVacancyByIdService(id);

        if (!existingVacancy) {
            return res.status(404).json({
                success: false,
                error: `Vacancy with ID '${id}' not found.`
            });
        }

        // Prevent editing archived vacancies
        if (
            String(existingVacancy.status).toLowerCase() === "archived"
        ) {
            return res.status(400).json({
                success: false,
                error: "Archived vacancies cannot be edited. Restore the vacancy first."
            });
        }

        // Update vacancy, qualifications, and remarks
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
// ARCHIVE VACANCY
// ============================================================

export const archiveVacancy = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE vacancies
             SET status = 'Archive'
             WHERE vacancy_id = $1
             RETURNING vacancy_id, status`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vacancy not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Vacancy archived successfully",
            vacancy: result.rows[0],
        });
    } catch (error) {
        console.error("Archive vacancy error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to archive vacancy",
        });
    }
};


// ============================================================
// PATCH /api/vacancies/:id/status
// UPDATE VACANCY STATUS (OPEN / CLOSED)
// ============================================================

export const updateVacancyStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};

    // Validate status
    if (
        !status ||
        !["Open", "Closed"].includes(status)
    ) {
        return res.status(400).json({
            success: false,
            error: "Status must be provided and set to either 'Open' or 'Closed'."
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
            String(existingVacancy.status).toLowerCase() === "archived"
        ) {
            return res.status(400).json({
                success: false,
                error: "Archived vacancies cannot have their status changed. Restore the vacancy first."
            });
        }

        const result = await updateVacancyStatusService(
            id,
            status
        );

        return res.status(200).json({
            success: true,
            message: `Vacancy status manually set to ${status}.`,
            data: result
        });

    } catch (error) {
        console.error(
            `Error updating status for vacancy ${id}:`,
            error
        );

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