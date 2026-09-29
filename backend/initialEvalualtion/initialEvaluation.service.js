import pool from "../config/db.js";

import {
    calculateNonTeachingScoring
} from "./nonTeaching.service.js";

import {
    calculateTeacherIInitialScreening
} from "./teaching.service.js";

import {
    calculateRelatedTeachingInitialScreening
} from "./relatedteaching.service.js";

import {
    calculateSchoolAdministrationInitialScreening
} from "./schoolAdministration.service.js";


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
                    v.position_id,
                    v.position_title,
                    v.salary_grade,
                    p.category

                FROM job_applications ja

                INNER JOIN vacancies v
                    ON v.vacancy_id =
                       ja.vacancy_id

                LEFT JOIN positions p
                    ON p.position_id =
                       v.position_id

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
        | 3. POSITION INFORMATION
        |--------------------------------------------------------------------------
        */

        const positionTitle =
            String(
                vacancy.position_title || ""
            )
                .trim()
                .toUpperCase();


        const positionCategory =
            String(
                vacancy.category || ""
            )
                .trim()
                .toUpperCase()
                .replace(/\s+/g, " ");


        const salaryGrade =
            vacancy.salary_grade;


        /*
        |--------------------------------------------------------------------------
        | 4. STANDARDIZE SCREENING RESULT
        |--------------------------------------------------------------------------
        */

        const rawResult =
            String(
                overall_result || ""
            )
                .trim()
                .toLowerCase();


        let screeningOverallResult;


        if (
            rawResult === "qualified"
        ) {

            screeningOverallResult =
                "QUALIFIED";

        }

        else if (
            rawResult === "unqualified" ||
            rawResult === "disqualified"
        ) {

            screeningOverallResult =
                "DISQUALIFIED";

        }

        else {

            const error =
                new Error(
                    "Invalid overall result value."
                );

            error.statusCode = 400;

            throw error;
        }


        /*
        |--------------------------------------------------------------------------
        | 5. DEFAULT SCORING
        |--------------------------------------------------------------------------
        |
        | No scoring is performed until the applicant is QUALIFIED.
        |
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
        | 6. CALCULATE INITIAL SCREENING POINTS
        |--------------------------------------------------------------------------
        |
        | QUALIFIED applicants are routed by position type:
        |
        | TEACHING
        |      -> Teacher I service
        |
        | RELATED-TEACHING
        |      -> Related Teaching service
        |
        | SCHOOL ADMINISTRATION
        |      -> School Administration service
        |
        | NON-TEACHING
        |      -> Non-Teaching service
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
            */

            const isTeacherI =
                positionTitle === "TEACHER I" ||
                positionTitle === "TEACHER 1";


            /*
            |--------------------------------------------------------------------------
            | DETERMINE RELATED-TEACHING
            |--------------------------------------------------------------------------
            */

            const isRelatedTeaching =
                positionCategory === "RELATED_TEACHING" ||
                positionCategory === "RELATED TEACHING" ||
                positionCategory === "RELATED-TEACHING" ||
                positionCategory === "RELATED TEACHING POSITIONS";


            /*
            |--------------------------------------------------------------------------
            | DETERMINE SCHOOL ADMINISTRATION
            |--------------------------------------------------------------------------
            */

            const isSchoolAdministration =
                positionCategory === "SCHOOL_ADMINISTRATION" ||
                positionCategory === "SCHOOL ADMINISTRATION POSITIONS" ||
                positionCategory === "SCHOOL ADMINISTRATION POSITION";


            /*
            |--------------------------------------------------------------------------
            | TEACHER I
            |--------------------------------------------------------------------------
            |
            | Teacher I initial screening:
            |
            | Education  = 10 maximum
            | Training   = 10 maximum
            | Experience = 10 maximum
            |
            | Total = 30 maximum
            |
            |--------------------------------------------------------------------------
            */

            if (isTeacherI) {

                scoring =
                    await calculateTeacherIInitialScreening(
                        client,
                        resolvedApplicantId
                    );


                scoring.salaryGrade =
                    salaryGrade;


                scoring.salaryGroup =
                    null;
            }


            /*
            |--------------------------------------------------------------------------
            | RELATED-TEACHING
            |--------------------------------------------------------------------------
            |
            | Related-Teaching ETE:
            |
            | Education  = 10 maximum
            | Training   = 10 maximum
            | Experience = 10 maximum
            |
            | These points belong to the 100-point
            | Related-Teaching comparative assessment.
            |
            |--------------------------------------------------------------------------
            */

            else if (isRelatedTeaching) {

                scoring =
                    await calculateRelatedTeachingInitialScreening(
                        client,
                        resolvedApplicantId,
                        vacancy.vacancy_id
                    );


                scoring.salaryGrade =
                    salaryGrade;


                scoring.salaryGroup =
                    null;
            }


            /*
            |--------------------------------------------------------------------------
            | SCHOOL ADMINISTRATION
            |--------------------------------------------------------------------------
            |
            | School Administration ETE:
            |
            | Education  = 10 maximum
            | Training   = 10 maximum
            | Experience = 10 maximum
            |
            | These points belong to the 100-point
            | School Administration comparative assessment.
            |
            |--------------------------------------------------------------------------
            */

            else if (isSchoolAdministration) {

                scoring =
                    await calculateSchoolAdministrationInitialScreening(
                        client,
                        resolvedApplicantId,
                        vacancy.vacancy_id
                    );


                scoring.salaryGrade =
                    salaryGrade;


                scoring.salaryGroup =
                    null;
            }


            /*
            |--------------------------------------------------------------------------
            | NON-TEACHING
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
        | 7. INSERT INITIAL SCREENING
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
                    |
                    | Education value may be text such as:
                    |
                    | "BACHELOR'S DEGREE"
                    |
                    | Therefore do NOT use Number().
                    |
                    |--------------------------------------------------------------------------
                    */

                    scoring.education?.increment,
                    scoring.education?.increment,
                    scoring.education?.points,


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
        | 8. UPDATE HR REMARKS
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
        | 9. COMMIT
        |--------------------------------------------------------------------------
        */

        await client.query(
            "COMMIT"
        );


        /*
        |--------------------------------------------------------------------------
        | 10. RETURN RESPONSE
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