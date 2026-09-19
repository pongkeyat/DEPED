import pool from "../config/db.js";

// Service 1: Vacancy Logic
// Service 1: Vacancy Logic
export const createVacancyService = async (client, data) => {
    const {
        vacancy_id,
        position_id,
        plantilla_position,
        office_unit,
        place_of_assignment,
        number_of_vacancies,
        application_posted,
        application_deadline
    } = data;

    // Get position information
    const positionQuery = await client.query(
        `
        SELECT position_title, salary_grade
        FROM positions
        WHERE position_id = $1
        `,
        [position_id]
    );

    if (positionQuery.rows.length === 0) {
        throw new Error("POSITION_NOT_FOUND");
    }

    const {
        position_title,
        salary_grade
    } = positionQuery.rows[0];

    // Insert vacancy
    const vacancyQuery = await client.query(
        `
        INSERT INTO vacancies (
            vacancy_id,
            position_id,
            plantilla_position,
            position_title,
            salary_grade,
            office_unit,
            place_of_assignment,
            number_of_vacancies,
            application_posted,
            application_deadline,
            status
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            'Open'
        )
        RETURNING *
        `,
        [
            vacancy_id,
            position_id,
            plantilla_position,
            position_title,
            salary_grade,
            office_unit,
            place_of_assignment,
            number_of_vacancies,
            application_posted,
            application_deadline
        ]
    );

    return vacancyQuery.rows[0];
};

// Service 2: Qualifications Logic
export const createQualificationService = async (client, vacancy_id, data) => {
    const { education_requirement, training_requirement, experience_requirement, eligibility_requirement } = data;

    const qualQuery = await client.query(
        `INSERT INTO vacancy_specific_qualifications (vacancy_id, education_requirement, training_requirement, experience_requirement, eligibility_requirement)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [vacancy_id, education_requirement, training_requirement, experience_requirement, eligibility_requirement]
    );

    return qualQuery.rows[0];
};

// Service 3: Remarks Logic
export const createRemarkService = async (client, vacancy_id, remark_text) => {
    if (!remark_text) return null;

    const remarkQuery = await client.query(
        `INSERT INTO vacancies_remarks (vacancy_id, remark_text)
         VALUES ($1, $2) RETURNING *`,
        [vacancy_id, remark_text]
    );

    return remarkQuery.rows[0];
};

// Service 4: Get All Vacancies with Search, Status Filter, and Pagination
export const getAllVacanciesService = async ({ search = '', status = '', page = 1, limit = 10 }) => {
    const offset = (page - 1) * limit;
    
    // Automatically evaluates status as 'Closed' if current date has passed application_deadline
    const query = `
        SELECT 
            vacancies.vacancy_id,
            vacancies.position_id,
            positions.position_title,
            positions.salary_grade,
            vacancies.plantilla_position,
            vacancies.office_unit,
            vacancies.place_of_assignment,
            vacancies.number_of_vacancies,
            vacancies.application_posted,
            vacancies.application_deadline,
            CASE 
                WHEN vacancies.application_deadline < CURRENT_DATE THEN 'Closed'
                ELSE vacancies.status 
            END AS status,
            CASE 
                WHEN vacancy_specific_qualifications.qualification_id IS NOT NULL THEN json_build_object(
                    'qualification_id', vacancy_specific_qualifications.qualification_id,
                    'education_requirement', vacancy_specific_qualifications.education_requirement,
                    'training_requirement', vacancy_specific_qualifications.training_requirement,
                    'experience_requirement', vacancy_specific_qualifications.experience_requirement,
                    'eligibility_requirement', vacancy_specific_qualifications.eligibility_requirement
                )
                ELSE NULL 
            END AS qualifications,
            vacancies_remarks.remark_text
        FROM vacancies
        JOIN positions ON vacancies.position_id = positions.position_id
        LEFT JOIN vacancy_specific_qualifications ON vacancies.vacancy_id = vacancy_specific_qualifications.vacancy_id
        LEFT JOIN vacancies_remarks ON vacancies.vacancy_id = vacancies_remarks.vacancy_id
        WHERE 
            (positions.position_title ILIKE $1 OR vacancies.vacancy_id ILIKE $1 OR vacancies.office_unit ILIKE $1)
            AND ($2 = '' OR (
                CASE 
                    WHEN vacancies.application_deadline < CURRENT_DATE THEN 'Closed'
                    ELSE vacancies.status 
                END
            ) = $2)
        ORDER BY vacancies.application_posted DESC, vacancies.vacancy_id DESC
        LIMIT $3 OFFSET $4;
    `;

    const countQuery = `
        SELECT COUNT(*) 
        FROM vacancies
        JOIN positions ON vacancies.position_id = positions.position_id
        WHERE 
            (positions.position_title ILIKE $1 OR vacancies.vacancy_id ILIKE $1 OR vacancies.office_unit ILIKE $1)
            AND ($2 = '' OR (
                CASE 
                    WHEN vacancies.application_deadline < CURRENT_DATE THEN 'Closed'
                    ELSE vacancies.status 
                END
            ) = $2);
    `;

    const searchTerm = `%${search}%`;
    const [dataResult, countResult] = await Promise.all([
        pool.query(query, [searchTerm, status, limit, offset]),
        pool.query(countQuery, [searchTerm, status])
    ]);

    const totalItems = parseInt(countResult.rows[0].count, 10);

    return {
        vacancies: dataResult.rows,
        pagination: {
            totalItems,
            currentPage: Number(page),
            totalPages: Math.ceil(totalItems / limit),
            limit: Number(limit)
        }
    };
};

// Service 5: Get Single Vacancy by vacancy_id
export const getVacancyByIdService = async (vacancy_id) => {
    const query = `
        SELECT 
            vacancies.vacancy_id,
            vacancies.position_id,
            positions.position_title,
            positions.salary_grade,
            vacancies.plantilla_position,
            vacancies.office_unit,
            vacancies.number_of_vacancies,
            vacancies.place_of_assignment,
            vacancies.application_posted,
            vacancies.application_deadline,
            CASE 
                WHEN vacancies.application_deadline < CURRENT_DATE THEN 'Closed'
                ELSE vacancies.status 
            END AS status,
            CASE 
                WHEN vacancy_specific_qualifications.qualification_id IS NOT NULL THEN json_build_object(
                    'qualification_id', vacancy_specific_qualifications.qualification_id,
                    'education_requirement', vacancy_specific_qualifications.education_requirement,
                    'training_requirement', vacancy_specific_qualifications.training_requirement,
                    'experience_requirement', vacancy_specific_qualifications.experience_requirement,
                    'eligibility_requirement', vacancy_specific_qualifications.eligibility_requirement
                )
                ELSE NULL 
            END AS qualifications,
            vacancies_remarks.remark_text
        FROM vacancies
        JOIN positions ON vacancies.position_id = positions.position_id
        LEFT JOIN vacancy_specific_qualifications ON vacancies.vacancy_id = vacancy_specific_qualifications.vacancy_id
        LEFT JOIN vacancies_remarks ON vacancies.vacancy_id = vacancies_remarks.vacancy_id
        WHERE vacancies.vacancy_id = $1;
    `;

    const result = await pool.query(query, [vacancy_id]);
    return result.rows[0] || null;
};

// Service 6: Update Vacancy Status Manually (e.g., Close early or Reopen)
export const updateVacancyStatusService = async (vacancy_id, status) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // ======================================================
        // 1. Update vacancy status
        // ======================================================
        const vacancyQuery = `
            UPDATE vacancies
            SET status = $1
            WHERE vacancy_id = $2
            RETURNING vacancy_id, status;
        `;

        const vacancyResult = await client.query(
            vacancyQuery,
            [status, vacancy_id]
        );

        if (vacancyResult.rows.length === 0) {
            throw new Error("VACANCY_NOT_FOUND");
        }

        // ======================================================
        // 2. If vacancy is CLOSED
        //    Change COMPLETE applicants to INITIAL SCREENING
        // ======================================================
        let applicantsReset = 0;

        if (String(status).toLowerCase() === "closed") {

            const applicantStatusQuery = `
                UPDATE hr_remarks_final_notes hr
                SET application_status = 'initial screening'

                FROM applicant_information ai
                JOIN job_applications ja
                    ON ja.job_applications_id =
                       ai.job_applications_id

                WHERE hr.applicant_id = ai.applicant_id
                  AND ja.vacancy_id = $1
                  AND LOWER(
                      TRIM(hr.application_status)
                  ) = 'complete'

                RETURNING hr.applicant_id;
            `;

            const applicantResult = await client.query(
                applicantStatusQuery,
                [vacancy_id]
            );

            applicantsReset = applicantResult.rowCount;
        }

        // ======================================================
        // 3. Commit both changes
        // ======================================================
        await client.query("COMMIT");

        return {
            ...vacancyResult.rows[0],
            applicants_reset: applicantsReset
        };

    } catch (error) {

        // ======================================================
        // Rollback if anything fails
        // ======================================================
        await client.query("ROLLBACK");

        console.error(
            "Update vacancy status error:",
            error
        );

        throw error;

    } finally {
        client.release();
    }
};