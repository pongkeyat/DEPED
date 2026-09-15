import pool from "../config/db.js";

/*
|--------------------------------------------------------------------------
| SALARY GROUP
|--------------------------------------------------------------------------
*/

const getSalaryGroup = (salaryGrade) => {
    const sg = Number(salaryGrade);

    if (Number.isNaN(sg)) {
        return null;
    }

    if (sg >= 1 && sg <= 9) {
        return "SG_1_9";
    }

    if (sg >= 10 && sg <= 22) {
        return "SG_10_22_27";
    }

    if (sg === 24) {
        return "SG_24";
    }

    if (sg === 27) {
        return "SG_10_22_27";
    }

    return "GENERAL_SERVICES";
};


/*
|--------------------------------------------------------------------------
| EDUCATION CALCULATION
|--------------------------------------------------------------------------
|
| education.education_level
|          ↓
| education_increment_rules
|          ↓
| increment_level
|          ↓
| education_point_rules
|          ↓
| education_points
|
|--------------------------------------------------------------------------
*/

const calculateEducation = async (
    client,
    applicantId,
    salaryGroup
) => {

    /*
    |--------------------------------------------------------------------------
    | 1. GET HIGHEST EDUCATIONAL ATTAINMENT
    |--------------------------------------------------------------------------
    */

    const educationResult = await client.query(
        `
        SELECT
            e.education_level,
            e.degree_course,
            e.school_name,
            r.increment_level

        FROM education e

        LEFT JOIN education_increment_rules r
            ON UPPER(TRIM(r.education_level))
             = UPPER(TRIM(e.education_level))

        WHERE e.applicant_id = $1

        ORDER BY
            r.increment_level DESC NULLS LAST

        LIMIT 1
        `,
        [applicantId]
    );


    /*
    |--------------------------------------------------------------------------
    | 2. NO EDUCATION RECORD
    |--------------------------------------------------------------------------
    */

    if (educationResult.rows.length === 0) {

        return {
            value: null,
            increment: null,
            points: 0
        };
    }


    const education =
        educationResult.rows[0];


    /*
    |--------------------------------------------------------------------------
    | 3. GET EDUCATION INCREMENT
    |--------------------------------------------------------------------------
    */

    const educationIncrement =
        education.increment_level !== null
            ? Number(education.increment_level)
            : null;


    /*
    |--------------------------------------------------------------------------
    | 4. GET EDUCATION POINTS
    |--------------------------------------------------------------------------
    */

    let educationPoints = 0;


    if (
        educationIncrement !== null &&
        salaryGroup
    ) {

        const pointResult = await client.query(
            `
            SELECT
                points

            FROM education_point_rules

            WHERE salary_group = $1

              AND $2 >= increment_from

              AND (
                    increment_to IS NULL
                    OR $2 <= increment_to
                  )

            ORDER BY
                increment_from DESC

            LIMIT 1
            `,
            [
                salaryGroup,
                educationIncrement
            ]
        );


        if (pointResult.rows.length > 0) {

            educationPoints =
                Number(
                    pointResult.rows[0].points
                );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | 5. RETURN EDUCATION RESULT
    |--------------------------------------------------------------------------
    */

    return {

        value:
            educationIncrement,

        increment:
            educationIncrement,

        points:
            educationPoints
    };
};


/*
|--------------------------------------------------------------------------
| TRAINING CALCULATION
|--------------------------------------------------------------------------
|
| NOT YET USED.
|
| We will implement this after Education has been tested.
|
|--------------------------------------------------------------------------
*/

const calculateTraining = async (
    client,
    applicantId,
    salaryGroup
) => {

    /*
    |--------------------------------------------------------------------------
    | 1. GET TRAINING RECORDS
    |--------------------------------------------------------------------------
    */

    const result = await client.query(
        `
        SELECT
            training_title,
            date_from,
            date_to,
            hours_attended,
            training_type,
            conducted_by

        FROM relevant_trainings

        WHERE applicant_id = $1

        ORDER BY date_from
        `,
        [applicantId]
    );


    /*
    |--------------------------------------------------------------------------
    | 2. NO TRAINING RECORDS
    |--------------------------------------------------------------------------
    */

    if (result.rows.length === 0) {

        return {
            hours: 0,
            increment: null,
            points: 0,
            records: []
        };
    }


    /*
    |--------------------------------------------------------------------------
    | 3. TOTAL TRAINING HOURS
    |--------------------------------------------------------------------------
    */

    const totalHours =
        result.rows.reduce(
            (total, training) => {

                const hours =
                    Number(
                        training.hours_attended
                    ) || 0;

                return total + hours;

            },
            0
        );


    /*
    |--------------------------------------------------------------------------
    | 4. GET TRAINING INCREMENT
    |--------------------------------------------------------------------------
    */

    const incrementResult =
        await client.query(
            `
            SELECT
                increment_level

            FROM training_increment_rules

            WHERE $1 >= hours_from

              AND (
                    hours_to IS NULL
                    OR $1 <= hours_to
                  )

            ORDER BY
                hours_from DESC

            LIMIT 1
            `,
            [totalHours]
        );


    const trainingIncrement =
        incrementResult.rows.length > 0
            ? Number(
                incrementResult.rows[0]
                    .increment_level
            )
            : null;


    /*
    |--------------------------------------------------------------------------
    | 5. GET TRAINING POINTS
    |--------------------------------------------------------------------------
    */

    let trainingPoints = 0;


    if (
        trainingIncrement !== null &&
        salaryGroup
    ) {

        const pointResult =
            await client.query(
                `
                SELECT
                    points

                FROM training_point_rules

                WHERE salary_group = $1

                  AND $2 >= increment_from

                  AND (
                        increment_to IS NULL
                        OR $2 <= increment_to
                      )

                ORDER BY
                    increment_from DESC

                LIMIT 1
                `,
                [
                    salaryGroup,
                    trainingIncrement
                ]
            );


        if (pointResult.rows.length > 0) {

            trainingPoints =
                Number(
                    pointResult.rows[0].points
                );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | 6. RETURN TRAINING SCORE
    |--------------------------------------------------------------------------
    */

    return {

        hours:
            totalHours,

        increment:
            trainingIncrement,

        points:
            trainingPoints,

        records:
            result.rows
    };
};


/*
|--------------------------------------------------------------------------
| EXPERIENCE CALCULATION
|--------------------------------------------------------------------------
|
| NOT YET USED.
|
|--------------------------------------------------------------------------
*/

const calculateExperience = async (
    client,
    applicantId,
    salaryGroup
) => {

    /*
    |--------------------------------------------------------------------------
    | 1. GET WORK EXPERIENCE RECORDS
    |--------------------------------------------------------------------------
    */

    const experienceResult = await client.query(
        `
        SELECT
            position_title,
            company_office,
            date_from,
            date_to,
            monthly_salary,
            appointment_status,
            is_govt_service

        FROM work_experience

        WHERE applicant_id = $1

        ORDER BY date_from ASC
        `,
        [applicantId]
    );


    /*
    |--------------------------------------------------------------------------
    | 2. NO EXPERIENCE RECORD
    |--------------------------------------------------------------------------
    */

    if (experienceResult.rows.length === 0) {

        return {
            months: 0,
            increment: 0,
            points: 0,
            records: []
        };
    }


    /*
    |--------------------------------------------------------------------------
    | 3. CONVERT DATES
    |--------------------------------------------------------------------------
    */

    const records = experienceResult.rows
        .map(record => {

            const startDate = new Date(record.date_from);

            const endDate = record.date_to
                ? new Date(record.date_to)
                : new Date();

            return {
                ...record,
                startDate,
                endDate
            };
        })
        .filter(record =>
            !isNaN(record.startDate.getTime()) &&
            !isNaN(record.endDate.getTime()) &&
            record.endDate >= record.startDate
        );


    /*
    |--------------------------------------------------------------------------
    | 4. SORT BY START DATE
    |--------------------------------------------------------------------------
    */

    records.sort(
        (a, b) =>
            a.startDate.getTime() -
            b.startDate.getTime()
    );


    /*
    |--------------------------------------------------------------------------
    | 5. MERGE OVERLAPPING EXPERIENCE PERIODS
    |--------------------------------------------------------------------------
    |
    | Example:
    |
    | Job A: 2021 → Present
    | Job B: 2022 → 2023
    |
    | Job B is already inside Job A.
    |
    | Therefore we count the period only once.
    |
    */

    const mergedPeriods = [];

    for (const record of records) {

        const currentStart = record.startDate;
        const currentEnd = record.endDate;

        if (mergedPeriods.length === 0) {

            mergedPeriods.push({
                startDate: currentStart,
                endDate: currentEnd
            });

            continue;
        }


        const lastPeriod =
            mergedPeriods[mergedPeriods.length - 1];


        /*
        |----------------------------------------------------------------------
        | If current experience overlaps or directly follows
        | the previous period, extend the previous period.
        |----------------------------------------------------------------------
        */

        if (
            currentStart.getTime() <=
            lastPeriod.endDate.getTime() + (24 * 60 * 60 * 1000)
        ) {

            if (
                currentEnd.getTime() >
                lastPeriod.endDate.getTime()
            ) {

                lastPeriod.endDate =
                    currentEnd;
            }

        } else {

            /*
            |------------------------------------------------------------------
            | Non-overlapping period
            |------------------------------------------------------------------
            */

            mergedPeriods.push({
                startDate: currentStart,
                endDate: currentEnd
            });
        }
    }


    /*
    |--------------------------------------------------------------------------
    | 6. CALCULATE TOTAL UNIQUE MONTHS
    |--------------------------------------------------------------------------
    */

    let totalMonths = 0;

    for (const period of mergedPeriods) {

        const start = period.startDate;
        const end = period.endDate;


        const years =
            end.getFullYear() -
            start.getFullYear();

        const months =
            end.getMonth() -
            start.getMonth();


        const calculatedMonths =
            (years * 12) + months;


        totalMonths += Math.max(
            0,
            calculatedMonths
        );
    }


    /*
    |--------------------------------------------------------------------------
    | 7. GET EXPERIENCE INCREMENT
    |--------------------------------------------------------------------------
    */

    let experienceIncrement = null;

    const incrementResult = await client.query(
        `
        SELECT
            increment_level

        FROM experience_increment_rules

        WHERE $1 >= months_from

          AND (
                months_to IS NULL
                OR $1 <= months_to
              )

        ORDER BY months_from DESC

        LIMIT 1
        `,
        [totalMonths]
    );


    if (incrementResult.rows.length > 0) {

        experienceIncrement =
            Number(
                incrementResult.rows[0].increment_level
            );
    }


    /*
    |--------------------------------------------------------------------------
    | 8. GET EXPERIENCE POINTS
    |--------------------------------------------------------------------------
    */

    let experiencePoints = 0;


    if (
        experienceIncrement !== null &&
        salaryGroup
    ) {

        const pointResult = await client.query(
            `
            SELECT
                points

            FROM experience_point_rules

            WHERE salary_group = $1

              AND $2 >= increment_from

              AND (
                    increment_to IS NULL
                    OR $2 <= increment_to
                  )

            ORDER BY increment_from DESC

            LIMIT 1
            `,
            [
                salaryGroup,
                experienceIncrement
            ]
        );


        if (pointResult.rows.length > 0) {

            experiencePoints =
                Number(
                    pointResult.rows[0].points
                );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | 9. RETURN RESULT
    |--------------------------------------------------------------------------
    */

    return {

        months: totalMonths,

        increment:
            experienceIncrement,

        points:
            experiencePoints,

        records:
            experienceResult.rows,

        mergedPeriods
    };
};


/*
|--------------------------------------------------------------------------
| CREATE INITIAL SCREENING
|--------------------------------------------------------------------------
*/

export const createInitialScreening = async (
    data
) => {

    const {

        job_applications_id,
        applicant_id,

        education_passed,
        education_remarks,

        eligibility_passed,
        eligibility_remarks,

        training_passed,
        training_remarks,

        experience_passed,
        experience_remarks,

        overall_result,

        general_remarks,

        screened_by,

        submitted_documents_passed,
        documents_note

    } = data;


    /*
    |--------------------------------------------------------------------------
    | GET DATABASE CLIENT
    |--------------------------------------------------------------------------
    */

    const client =
        await pool.connect();


    try {

        /*
        |--------------------------------------------------------------------------
        | START TRANSACTION
        |--------------------------------------------------------------------------
        */

        await client.query(
            "BEGIN"
        );


        /*
        |--------------------------------------------------------------------------
        | 1. FIND APPLICATION
        |--------------------------------------------------------------------------
        */

        const applicationResult =
            job_applications_id !== undefined

                ? await client.query(
                    `
                    SELECT
                        job_applications_id,
                        applicant_id

                    FROM applicant_information

                    WHERE job_applications_id = $1
                    `,
                    [
                        job_applications_id
                    ]
                )

                : await client.query(
                    `
                    SELECT
                        job_applications_id,
                        applicant_id

                    FROM applicant_information

                    WHERE applicant_id = $1
                    `,
                    [
                        applicant_id
                    ]
                );


        /*
        |--------------------------------------------------------------------------
        | APPLICATION NOT FOUND
        |--------------------------------------------------------------------------
        */

        if (
            applicationResult.rows.length === 0
        ) {

            const error =
                new Error(
                    "Job application not found."
                );

            error.statusCode = 404;

            throw error;
        }


        const application =
            applicationResult.rows[0];


        const resolvedApplicationId =
            application.job_applications_id;


        const resolvedApplicantId =
            application.applicant_id;


        /*
        |--------------------------------------------------------------------------
        | 2. GET VACANCY
        |--------------------------------------------------------------------------
        */

        const vacancyResult =
            await client.query(
                `
                SELECT
                    ja.vacancy_id,
                    v.position_title,
                    v.salary_grade

                FROM job_applications ja

                INNER JOIN vacancies v
                    ON v.vacancy_id =
                       ja.vacancy_id

                WHERE ja.job_applications_id = $1
                `,
                [
                    resolvedApplicationId
                ]
            );


        /*
        |--------------------------------------------------------------------------
        | VACANCY NOT FOUND
        |--------------------------------------------------------------------------
        */

        if (
            vacancyResult.rows.length === 0
        ) {

            const error =
                new Error(
                    "Vacancy information not found."
                );

            error.statusCode = 404;

            throw error;
        }


        const vacancy =
            vacancyResult.rows[0];


        const salaryGrade =
            vacancy.salary_grade;


        const salaryGroup =
            getSalaryGroup(
                salaryGrade
            );


        /*
        |--------------------------------------------------------------------------
        | 3. STANDARDIZE SCREENING RESULT
        |--------------------------------------------------------------------------
        */

        const rawResult =
            overall_result
                .trim()
                .toLowerCase();


        let screeningOverallResult;


        if (
            rawResult === "qualified"
        ) {

            screeningOverallResult =
                "QUALIFIED";

        } else if (
            rawResult === "unqualified" ||
            rawResult === "disqualified"
        ) {

            screeningOverallResult =
                "DISQUALIFIED";

        } else {

            const error =
                new Error(
                    "Invalid overall result value."
                );

            error.statusCode = 400;

            throw error;
        }


        /*
        |--------------------------------------------------------------------------
        | 4. DEFAULT SCORING
        |--------------------------------------------------------------------------
        */

        let scoring = {

            education: {

                value: null,

                increment: null,

                points: 0

            },

            training: {

                hours: 0,

                increment: null,

                points: 0

            },

            experience: {

                months: 0,

                increment: null,

                points: 0

            },

            total: 0

        };


        /*
        |--------------------------------------------------------------------------
        | 5. CALCULATE POINTS ONLY FOR QUALIFIED
        |--------------------------------------------------------------------------
        */

        if (
            screeningOverallResult ===
            "QUALIFIED"
        ) {

            /*
            |--------------------------------------------------------------------------
            | EDUCATION
            |--------------------------------------------------------------------------
            */

            scoring.education =
                await calculateEducation(
                    client,
                    resolvedApplicantId,
                    salaryGroup
                );

            scoring.training =
                await calculateTraining(
                    client,
                    resolvedApplicantId,
                    salaryGroup
                );
      


            /*
            |--------------------------------------------------------------------------
            | EXPERIENCE
            |--------------------------------------------------------------------------
            |
            | Temporarily disabled while Education
            | is being tested.
            |
            |--------------------------------------------------------------------------
            */

            scoring.experience =
                await calculateExperience(
                    client,
                    resolvedApplicantId,
                    salaryGroup
                );
    


            /*
            |--------------------------------------------------------------------------
            | TOTAL
            |--------------------------------------------------------------------------
            */

      scoring.total =
        Number(scoring.education.points || 0) +
        Number(scoring.training.points || 0) +
        Number(scoring.experience.points || 0);
        }


        /*
        |--------------------------------------------------------------------------
        | 6. INSERT INITIAL SCREENING
        |--------------------------------------------------------------------------
        */

        const screeningResult =
            await client.query(
                `
                INSERT INTO initial_screening (

                    job_applications_id,

                    education_passed,
                    education_remarks,

                    eligibility_passed,
                    eligibility_remarks,

                    training_passed,
                    training_remarks,

                    experience_passed,
                    experience_remarks,

                    overall_result,

                    general_remarks,
                    screened_by,

                    submitted_documents_passed,
                    documents_note,

                    education_value,
                    education_increment,
                    education_points,

                    training_hours,
                    training_increment,
                    training_points,

                    experience_months,
                    experience_increment,
                    experience_points,

                    initial_screening_points

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

                    $11,
                    $12,

                    $13,
                    $14,

                    $15,
                    $16,
                    $17,

                    $18,
                    $19,
                    $20,

                    $21,
                    $22,
                    $23,

                    $24

                )

                RETURNING *
                `,
                [

                    resolvedApplicationId,

                    education_passed,
                    education_remarks || null,

                    eligibility_passed,
                    eligibility_remarks || null,

                    training_passed,
                    training_remarks || null,

                    experience_passed,
                    experience_remarks || null,

                    screeningOverallResult,

                    general_remarks || null,

                    screened_by,

                    submitted_documents_passed !== undefined
                        ? submitted_documents_passed
                        : false,

                    documents_note || null,


                    /*
                    |--------------------------------------------------------------------------
                    | EDUCATION
                    |--------------------------------------------------------------------------
                    */

                    scoring.education.value,

                    scoring.education.increment,

                    scoring.education.points,


                    /*
                    |--------------------------------------------------------------------------
                    | TRAINING
                    |--------------------------------------------------------------------------
                    */

                    scoring.training.hours,

                    scoring.training.increment,

                    scoring.training.points,


                    /*
                    |--------------------------------------------------------------------------
                    | EXPERIENCE
                    |--------------------------------------------------------------------------
                    */

                    scoring.experience.months,

                    scoring.experience.increment,

                    scoring.experience.points,


                    /*
                    |--------------------------------------------------------------------------
                    | TOTAL
                    |--------------------------------------------------------------------------
                    */

                    scoring.total

                ]
            );


        /*
        |--------------------------------------------------------------------------
        | 7. UPDATE HR REMARKS
        |--------------------------------------------------------------------------
        */

        const hrStatus =
            screeningOverallResult ===
            "QUALIFIED"

                ? "qualified"

                : "unqualified";


        await client.query(
            `
            UPDATE hr_remarks_final_notes

            SET application_status = $1

            WHERE applicant_id = $2
            `,
            [
                hrStatus,
                resolvedApplicantId
            ]
        );


        /*
        |--------------------------------------------------------------------------
        | 8. COMMIT
        |--------------------------------------------------------------------------
        */

        await client.query(
            "COMMIT"
        );


        /*
        |--------------------------------------------------------------------------
        | 9. RETURN RESPONSE
        |--------------------------------------------------------------------------
        */

        return {

            screening:
                screeningResult.rows[0],

            scoring: {

                salaryGrade,

                salaryGroup,

                education:
                    scoring.education,

                training:
                    scoring.training,

                experience:
                    scoring.experience,

                total:
                    scoring.total

            }

        };


    } catch (error) {

        /*
        |--------------------------------------------------------------------------
        | ROLLBACK
        |--------------------------------------------------------------------------
        */

        await client.query(
            "ROLLBACK"
        );

        throw error;


    } finally {

        /*
        |--------------------------------------------------------------------------
        | RELEASE CLIENT
        |--------------------------------------------------------------------------
        */

        client.release();
    }
};