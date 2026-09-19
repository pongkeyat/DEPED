import pool from "../config/db.js";

import {
    createVacancyService,
    createQualificationService,
    createRemarkService,
    getAllVacanciesService,
    getVacancyByIdService,
    updateVacancyStatusService
} from "./vacancies.services.js";


// ============================================================
// Helper function to auto-generate formatted vacancy_id
// Example: VCY-2026-0001
// ============================================================

const generateVacancyId = async (client) => {

    const currentYear = new Date().getFullYear();
    const prefix = `VCY-${currentYear}-`;

    const query = `
        SELECT vacancy_id
        FROM vacancies
        WHERE vacancy_id LIKE $1
        ORDER BY vacancy_id DESC
        LIMIT 1
    `;

    const result = await client.query(query, [`${prefix}%`]);

    let nextSequence = 1;

    if (result.rows.length > 0) {

        const lastId = result.rows[0].vacancy_id;

        const lastSequence = parseInt(
            lastId.split("-")[2],
            10
        );

        nextSequence = lastSequence + 1;
    }

    // Example: VCY-2026-0001
    return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};


// ============================================================
// POST /api/vacancies
// Create Complete Vacancy
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


    // ========================================================
    // Validate Required Fields
    // ========================================================

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
            error: "All required fields must be provided."
        });
    }


    // ========================================================
    // Validate Posted Date
    // ========================================================

    const postedDate = new Date(application_posted)
        .toISOString()
        .split("T")[0];

    const todayDate = new Date()
        .toISOString()
        .split("T")[0];


    if (postedDate !== todayDate) {

        return res.status(400).json({
            error: "The application posted date must be today's date."
        });
    }


    // ========================================================
    // Connect to Database
    // ========================================================

    const client = await pool.connect();


    try {

        await client.query("BEGIN");


        // ====================================================
        // 1. Generate Vacancy ID
        // ====================================================

        const vacancyId = await generateVacancyId(client);


        // ====================================================
        // 2. Create Vacancy
        // ====================================================

        const newVacancy = await createVacancyService(
            client,
            {
                ...req.body,

                // Automatically generated
                vacancy_id: vacancyId,

                // Explicitly include Place of Assignment
                place_of_assignment: place_of_assignment
            }
        );


        // ====================================================
        // 3. Create Qualifications
        // ====================================================

        const newQualification =
            await createQualificationService(
                client,
                vacancyId,
                req.body
            );


        // ====================================================
        // 4. Create Remarks
        // ====================================================

        const newRemark =
            await createRemarkService(
                client,
                vacancyId,
                remark_text
            );


        // ====================================================
        // 5. Commit Transaction
        // ====================================================

        await client.query("COMMIT");


        // ====================================================
        // 6. Return Response
        // ====================================================

        return res.status(201).json({

            message:
                "Vacancy successfully created with qualifications and remarks.",

            data: {

                vacancy: newVacancy,

                qualifications:
                    newQualification,

                remarks:
                    newRemark
            }
        });


    } catch (error) {

        await client.query("ROLLBACK");


        // ====================================================
        // Position Not Found
        // ====================================================

        if (error.message === "POSITION_NOT_FOUND") {

            return res.status(404).json({
                error:
                    "Selected position ID does not exist."
            });
        }


        // ====================================================
        // Other Errors
        // ====================================================

        console.error(
            "Error in transactional vacancy creation:",
            error
        );


        return res.status(500).json({
            error: "Internal server error"
        });


    } finally {

        client.release();
    }
};


// ============================================================
// GET /api/vacancies
// Get All Vacancies
// ============================================================

export const getAllVacancies = async (req, res) => {

    try {

        // ====================================================
        // Automatically Close Expired Vacancies
        // ====================================================

        const autoCloseQuery = `
            UPDATE vacancies
            SET status = 'Closed'
            WHERE application_deadline < CURRENT_DATE
              AND status != 'Closed'
        `;

        await pool.query(autoCloseQuery);


        // ====================================================
        // Query Parameters
        // ====================================================

        const {
            search = "",
            status = "",
            plantilla_position = "",
            office_unit = "",
            place_of_assignment = "",
            page = 1,
            limit = 20
        } = req.query;


        const parsedPage =
            parseInt(page, 10) || 1;

        const parsedLimit =
            parseInt(limit, 10) || 20;

        const offset =
            (parsedPage - 1) * parsedLimit;


        // ====================================================
        // Build Conditions
        // ====================================================

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

            params.push(
                `%${plantilla_position}%`
            );

            conditions.push(
                `v.plantilla_position ILIKE $${params.length}`
            );
        }


        // Office Unit Filter
        if (office_unit) {

            params.push(
                `%${office_unit}%`
            );

            conditions.push(
                `v.office_unit ILIKE $${params.length}`
            );
        }


        // Place of Assignment Filter
        if (place_of_assignment) {

            params.push(
                `%${place_of_assignment}%`
            );

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


        // ====================================================
        // Get Vacancy Data
        // ====================================================

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


        // ====================================================
        // Count Vacancies
        // ====================================================

        const countQuery = `
            SELECT COUNT(DISTINCT v.vacancy_id)

            FROM vacancies v

            LEFT JOIN positions p
                ON v.position_id = p.position_id

            ${whereClause}
        `;


        // ====================================================
        // Execute Queries
        // ====================================================

        const [
            vacanciesResult,
            countResult
        ] = await Promise.all([

            pool.query(
                dataQuery,
                [
                    ...params,
                    parsedLimit,
                    offset
                ]
            ),

            pool.query(
                countQuery,
                params
            )
        ]);


        const totalItems =
            parseInt(
                countResult.rows[0].count,
                10
            );


        const totalPages =
            Math.ceil(
                totalItems / parsedLimit
            );


        // ====================================================
        // Response
        // ====================================================

        return res.status(200).json({

            pagination: {

                totalItems,

                totalPages,

                currentPage:
                    parsedPage,

                limit:
                    parsedLimit
            },

            data:
                vacanciesResult.rows
        });


    } catch (error) {

        console.error(
            "Error fetching all vacancies:",
            error
        );


        return res.status(500).json({
            error: "Internal server error"
        });
    }
};


// ============================================================
// GET /api/vacancies/:id
// Get Single Vacancy
// ============================================================

export const getVacancyById = async (req, res) => {

    const { id } = req.params;


    try {

        // ====================================================
        // Automatically Close Expired Vacancy
        // ====================================================

        const autoCloseQuery = `
            UPDATE vacancies

            SET status = 'Closed'

            WHERE vacancy_id = $1

              AND application_deadline < CURRENT_DATE

              AND status != 'Closed'
        `;


        await pool.query(
            autoCloseQuery,
            [id]
        );


        // ====================================================
        // Get Vacancy
        // ====================================================

        const vacancy =
            await getVacancyByIdService(id);


        // ====================================================
        // Vacancy Not Found
        // ====================================================

        if (!vacancy) {

            return res.status(404).json({

                error:
                    `Vacancy with ID '${id}' not found.`
            });
        }


        // ====================================================
        // Response
        // ====================================================

        return res.status(200).json({

            data: vacancy
        });


    } catch (error) {

        console.error(
            `Error fetching vacancy ${id}:`,
            error
        );


        return res.status(500).json({
            error: "Internal server error"
        });
    }
};


// ============================================================
// PATCH /api/vacancies/:id/status
// Update Vacancy Status
// ============================================================

// ============================================================
// PATCH /api/vacancies/:id/status
// Update Vacancy Status
// ============================================================

export const updateVacancyStatus = async (req, res) => {

    const { id } = req.params;
    const { status } = req.body || {};

    // ========================================================
    // 1. Validate Status
    // ========================================================

    if (
        !status ||
        !["Open", "Closed"].includes(status)
    ) {
        return res.status(400).json({
            error:
                "Status must be provided and set to either 'Open' or 'Closed'."
        });
    }

    try {

        // ====================================================
        // 2. Use Existing Service
        // ====================================================

        const result = await updateVacancyStatusService(
            id,
            status
        );

        // ====================================================
        // 3. Response
        // ====================================================

        return res.status(200).json({
            message: `Vacancy status manually set to ${status}.`,
            data: result
        });

    } catch (error) {

        console.error(
            `Error updating status for vacancy ${id}:`,
            error
        );

        // ====================================================
        // Vacancy Not Found
        // ====================================================

        if (error.message === "VACANCY_NOT_FOUND") {
            return res.status(404).json({
                error: `Vacancy with ID '${id}' not found.`
            });
        }

        // ====================================================
        // Server Error
        // ====================================================

        return res.status(500).json({
            error: "Internal server error"
        });
    }
};