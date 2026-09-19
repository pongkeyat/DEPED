import pool from "../config/db.js";

import {
    calculateNonTeachingScoring
} from "./nonTeaching.service.js";

import {
    calculateTeacherIInitialScreening
} from "./teaching.service.js";


/*
|--------------------------------------------------------------------------
| CREATE INITIAL SCREENING
|--------------------------------------------------------------------------
*/

export const createInitialScreening = async (data) => {

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

        await client.query("BEGIN");


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


        /*
        |--------------------------------------------------------------------------
        | POSITION INFORMATION
        |--------------------------------------------------------------------------
        */

        const positionTitle =
            vacancy.position_title
                ?.trim()
                .toUpperCase();


        const salaryGrade =
            vacancy.salary_grade;


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

            salaryGrade,

            salaryGroup: null,

            education: {

                value: null,

                increment: null,

                points: 0

            },

            training: {

                hours: 0,

                increment: null,

                points: 0,

                records: []

            },

            experience: {

                months: 0,

                increment: null,

                points: 0,

                records: [],

                mergedPeriods: []

            },

            total: 0

        };


        /*
        |--------------------------------------------------------------------------
        | 5. CALCULATE INITIAL SCREENING POINTS
        |--------------------------------------------------------------------------
        |
        | Teacher I and Non-Teaching positions use
        | different scoring rules.
        |
        |--------------------------------------------------------------------------
        */

        if (
            screeningOverallResult ===
            "QUALIFIED"
        ) {


            /*
            |--------------------------------------------------------------------------
            | DETERMINE TEACHER I
            |--------------------------------------------------------------------------
            |
            | Your database currently uses "Teacher 1"
            | while some records may use "Teacher I".
            |
            | Both must use the Teacher I scoring service.
            |
            |--------------------------------------------------------------------------
            */

            const isTeacherI =
                positionTitle === "TEACHER I" ||
                positionTitle === "TEACHER 1";


            /*
            |--------------------------------------------------------------------------
            | TEACHER I
            |--------------------------------------------------------------------------
            |
            | Teacher I Initial Screening:
            |
            | Education  = 10 maximum
            | Training   = 10 maximum
            | Experience = 10 maximum
            |
            | Total = 30 maximum
            |
            | LET/PBET/LEPT, COI and NCOI are NOT
            | calculated here.
            |
            |--------------------------------------------------------------------------
            */

            if (isTeacherI) {

                scoring =
                    await calculateTeacherIInitialScreening(
                        client,
                        resolvedApplicantId
                    );


                /*
                |--------------------------------------------------------------------------
                | Make sure salary information is still
                | available in the returned object.
                |--------------------------------------------------------------------------
                */

                scoring.salaryGrade =
                    salaryGrade;


                scoring.salaryGroup =
                    null;

            }


            /*
            |--------------------------------------------------------------------------
            | NON-TEACHING
            |--------------------------------------------------------------------------
            |
            | Existing Non-Teaching calculation remains
            | inside nonTeaching.service.js.
            |
            |--------------------------------------------------------------------------
            */

            else {

                scoring =
                    await calculateNonTeachingScoring(
                        client,
                        resolvedApplicantId,
                        salaryGrade
                    );

            }

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


                    /*
                    |--------------------------------------------------------------------------
                    | SCREENING RESULTS
                    |--------------------------------------------------------------------------
                    */

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

                    Number(scoring.education?.value) ??
                        null,


                    scoring.education?.increment ??
                        null,


                    scoring.education?.points ??
                        0,


                    /*
                    |--------------------------------------------------------------------------
                    | TRAINING
                    |--------------------------------------------------------------------------
                    */

                    scoring.training?.hours ??
                        0,


                    scoring.training?.increment ??
                        null,


                    scoring.training?.points ??
                        0,


                    /*
                    |--------------------------------------------------------------------------
                    | EXPERIENCE
                    |--------------------------------------------------------------------------
                    */

                    scoring.experience?.months ??
                        0,


                    scoring.experience?.increment ??
                        null,


                    scoring.experience?.points ??
                        0,


                    /*
                    |--------------------------------------------------------------------------
                    | TOTAL
                    |--------------------------------------------------------------------------
                    */

                    scoring.total ??
                        0

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

                salaryGrade:
                    scoring.salaryGrade,


                salaryGroup:
                    scoring.salaryGroup,


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