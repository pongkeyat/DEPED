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

import {
    sendQualifiedInitialEvaluationEmail,
    sendNotQualifiedInitialEvaluationEmail
} from "./email.service.js";

/* ============================================================
   HELPER
============================================================ */

const formatDate = (value) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
};

const buildFullName = (
    firstName,
    middleName,
    lastName,
    suffix
) => {
    return [
        firstName,
        middleName,
        lastName,
        suffix
    ]
        .filter(
            value =>
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ""
        )
        .join(" ");
};

const buildEducationQualification = (row) => {
    const parts = [];

    if (row.education_level) {
        parts.push(row.education_level);
    }

    if (row.degree_course) {
        parts.push(row.degree_course);
    }

    if (row.school_name) {
        parts.push(`School: ${row.school_name}`);
    }

    if (
        row.units !== null &&
        row.units !== undefined &&
        row.units !== ""
    ) {
        parts.push(`Units: ${row.units}`);
    }

    if (row.honors_awards) {
        parts.push(`Honors/Awards: ${row.honors_awards}`);
    }

    return parts.join(" — ");
};

const getNumericIncrement = (...values) => {
    for (const value of values) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            continue;
        }

        const numericValue = Number(value);

        if (Number.isFinite(numericValue)) {
            return numericValue;
        }
    }

    return null;
};

const buildExperienceQualification = (row) => {
    const parts = [];

    if (row.position_title) {
        parts.push(row.position_title);
    }

    if (row.company_office) {
        parts.push(row.company_office);
    }

    if (row.date_from || row.date_to) {
        const from =
            row.date_from
                ? formatDate(row.date_from)
                : "";

        const to =
            row.date_to
                ? formatDate(row.date_to)
                : "Present";

        parts.push(`${from} - ${to}`);
    }

    if (row.appointment_status) {
        parts.push(`Appointment: ${row.appointment_status}`);
    }

    return parts.join(" — ");
};

const buildTrainingQualification = (row) => {
    const parts = [];

    if (row.training_title) {
        parts.push(row.training_title);
    }

    if (
        row.hours_attended !== null &&
        row.hours_attended !== undefined
    ) {
        parts.push(
            `${row.hours_attended} hour(s)`
        );
    }

    if (row.training_type) {
        parts.push(
            `Type: ${row.training_type}`
        );
    }

    if (row.conducted_by) {
        parts.push(
            `Conducted by: ${row.conducted_by}`
        );
    }

    if (row.date_from || row.date_to) {
        const from =
            row.date_from
                ? formatDate(row.date_from)
                : "";

        const to =
            row.date_to
                ? formatDate(row.date_to)
                : "";

        parts.push(`${from} - ${to}`);
    }

    return parts.join(" — ");
};

const buildEligibilityQualification = (row) => {
    const parts = [];

    if (row.eligibility_type) {
        parts.push(row.eligibility_type);
    }

    if (
        row.rating !== null &&
        row.rating !== undefined &&
        row.rating !== ""
    ) {
        parts.push(
            `Rating: ${row.rating}`
        );
    }

    if (row.license_number) {
        parts.push(
            `License No.: ${row.license_number}`
        );
    }

    if (row.date_of_exam) {
        parts.push(
            `Date: ${formatDate(row.date_of_exam)}`
        );
    }

    if (row.place_of_exam) {
        parts.push(
            `Place: ${row.place_of_exam}`
        );
    }

    return parts.join(" — ");
};

/* ============================================================
   CREATE INITIAL SCREENING
============================================================ */

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

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        /* ========================================================
           1. FIND APPLICATION
        ======================================================== */

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

        /* ========================================================
           2. GET VACANCY
        ======================================================== */

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
                .replace(/[-_]+/g, " ")
                .replace(/\s+/g, " ");

        const salaryGrade =
            vacancy.salary_grade;

        /* ========================================================
           3. GET APPLICANT INFORMATION
        ======================================================== */

        const applicantResult =
            await client.query(
                `
                SELECT
                    applicant_id,
                    first_name,
                    middle_name,
                    last_name,
                    suffix,
                    email_address,
                    residential_address,
                    ticket,
                    application_code
                FROM applicant_information
                WHERE applicant_id = $1
                `,
                [
                    resolvedApplicantId
                ]
            );

        if (
            applicantResult.rows.length === 0
        ) {

            const error =
                new Error(
                    "Applicant information not found."
                );

            error.statusCode = 404;

            throw error;
        }

        const applicant =
            applicantResult.rows[0];

        /* ========================================================
           4. GET VACANCY QUALIFICATION STANDARDS
        ======================================================== */

        const qualificationResult =
            await client.query(
                `
                SELECT
                    qualification_id,
                    education_requirement,
                    training_requirement,
                    experience_requirement,
                    eligibility_requirement
                FROM vacancy_specific_qualifications
                WHERE vacancy_id = $1
                LIMIT 1
                `,
                [
                    vacancy.vacancy_id
                ]
            );

        const qualifications =
            qualificationResult.rows[0] || {
                education_requirement: null,
                training_requirement: null,
                experience_requirement: null,
                eligibility_requirement: null
            };

        /* ========================================================
           5. GET ACTUAL APPLICANT QUALIFICATIONS

           IMPORTANT:
           These queries are intentionally sequential.

           Do NOT use Promise.all() here because all queries
           use the same PostgreSQL client inside the transaction.
        ======================================================== */

        const educationResult =
            await client.query(
                `
                SELECT
                    education_level,
                    school_name,
                    degree_course,
                    honors_awards,
                    units
                FROM education
                WHERE applicant_id = $1
                ORDER BY education_level
                `,
                [
                    resolvedApplicantId
                ]
            );

        const experienceResult =
            await client.query(
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
                ORDER BY date_from DESC
                `,
                [
                    resolvedApplicantId
                ]
            );

        const trainingResult =
            await client.query(
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
                ORDER BY date_from DESC
                `,
                [
                    resolvedApplicantId
                ]
            );

        const eligibilityResult =
            await client.query(
                `
                SELECT
                    eligibility_type,
                    rating,
                    date_of_exam,
                    place_of_exam,
                    license_number
                FROM civil_service_eligibility
                WHERE applicant_id = $1
                ORDER BY date_of_exam DESC
                `,
                [
                    resolvedApplicantId
                ]
            );

        /* ========================================================
           6. BUILD ACTUAL QUALIFICATION ARRAYS
        ======================================================== */

        const educationQualifications =
            educationResult.rows
                .map(
                    buildEducationQualification
                )
                .filter(Boolean);

        const experienceQualifications =
            experienceResult.rows
                .map(
                    buildExperienceQualification
                )
                .filter(Boolean);

        const trainingQualifications =
            trainingResult.rows
                .map(
                    buildTrainingQualification
                )
                .filter(Boolean);

        const eligibilityQualifications =
            eligibilityResult.rows
                .map(
                    buildEligibilityQualification
                )
                .filter(Boolean);

        /* ========================================================
           7. BUILD QUALIFICATION TABLE
        ======================================================== */

        const qualificationStandards = [

            {
                criterion: "Education",

                requirement:
                    qualifications.education_requirement,

                actual:
                    educationQualifications,

                remarks:
                    education_passed
                        ? "Qualified"
                        : (
                            education_remarks ||
                            "Did not meet requirement"
                        )
            },

            {
                criterion: "Training",

                requirement:
                    qualifications.training_requirement,

                actual:
                    trainingQualifications,

                remarks:
                    training_passed
                        ? "Qualified"
                        : (
                            training_remarks ||
                            "Did not meet requirement"
                        )
            },

            {
                criterion: "Experience",

                requirement:
                    qualifications.experience_requirement,

                actual:
                    experienceQualifications,

                remarks:
                    experience_passed
                        ? "Qualified"
                        : (
                            experience_remarks ||
                            "Did not meet requirement"
                        )
            },

            {
                criterion: "Eligibility",

                requirement:
                    qualifications.eligibility_requirement,

                actual:
                    eligibilityQualifications,

                remarks:
                    eligibility_passed
                        ? "Qualified"
                        : (
                            eligibility_remarks ||
                            "Did not meet requirement"
                        )
            }

        ];

        /* ========================================================
           8. EVALUATION DETAILS
        ======================================================== */

        const evaluationDetails =
            qualificationStandards.map(
                item => ({
                    criterion:
                        item.criterion,

                    requirement:
                        item.requirement,

                    actual:
                        item.actual,

                    remarks:
                        item.remarks
                })
            );

        /* ========================================================
           9. STANDARDIZE RESULT
        ======================================================== */

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

        /* ========================================================
           10. DEFAULT SCORING
        ======================================================== */

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

        /* ========================================================
           11. CALCULATE SCORING
        ======================================================== */

        if (
            screeningOverallResult ===
            "QUALIFIED"
        ) {

            const isTeacherI =
                positionTitle === "TEACHER I" ||
                positionTitle === "TEACHER 1";

            const isRelatedTeaching =
                positionCategory.startsWith(
                    "RELATED TEACHING"
                );

            const isSchoolAdministration =
                positionCategory.startsWith(
                    "SCHOOL ADMINISTRATION"
                );

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

            else if (
                isRelatedTeaching
            ) {

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

            else if (
                isSchoolAdministration
            ) {

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

            else {

                scoring =
                    await calculateNonTeachingScoring(
                        client,
                        resolvedApplicantId,
                        salaryGrade
                    );
            }
        }

        /* ========================================================
           12. INSERT INITIAL SCREENING
        ======================================================== */

        const educationIncrement = getNumericIncrement(
            scoring.education?.applicantIncrement,
            scoring.education?.increment,
            scoring.education?.value
        );
        const trainingIncrement = getNumericIncrement(
            scoring.training?.applicantIncrement,
            scoring.training?.increment
        );
        const experienceIncrement = getNumericIncrement(
            scoring.experience?.applicantIncrement,
            scoring.experience?.increment
        );

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

                    submitted_documents_passed !==
                    undefined
                        ? submitted_documents_passed
                        : false,

                    documents_note || null,

                    /* ====================================================
                       EDUCATION

                       FIXED:
                       value → education_value
                       increment → education_increment
                       points → education_points
                    ==================================================== */

                    educationIncrement,

                    educationIncrement,

                    scoring.education?.points ??
                        0,

                    /* ====================================================
                       TRAINING
                    ==================================================== */

                    scoring.training?.hours ??
                        0,

                    trainingIncrement,

                    scoring.training?.points ??
                        0,

                    /* ====================================================
                       EXPERIENCE
                    ==================================================== */

                    scoring.experience?.months ??
                        0,

                    experienceIncrement,

                    scoring.experience?.points ??
                        0,

                    /* ====================================================
                       TOTAL
                    ==================================================== */

                    scoring.total ??
                        0

                ]
            );

        /* ========================================================
           13. UPDATE HR STATUS
        ======================================================== */

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

        /* ========================================================
           14. GENERATE APPLICATION CODE
               ONLY FOR QUALIFIED APPLICANTS
        ======================================================== */

        let applicationCode = null;

        if (
            screeningOverallResult ===
            "QUALIFIED"
        ) {

            const existingCodeResult =
                await client.query(
                    `
                    SELECT
                        application_code
                    FROM applicant_information
                    WHERE applicant_id = $1
                    FOR UPDATE
                    `,
                    [
                        resolvedApplicantId
                    ]
                );

            applicationCode =
                existingCodeResult
                    .rows[0]
                    ?.application_code ||
                null;

            if (!applicationCode) {

                const codeResult =
                    await client.query(
                        `
                        SELECT
                            generate_application_code()
                            AS application_code
                        `
                    );

                applicationCode =
                    codeResult
                        .rows[0]
                        .application_code;

                await client.query(
                    `
                    UPDATE applicant_information
                    SET application_code = $1
                    WHERE applicant_id = $2
                    `,
                    [
                        applicationCode,
                        resolvedApplicantId
                    ]
                );
            }
        }

        /* ========================================================
           15. COMMIT DATABASE CHANGES
        ======================================================== */

        await client.query(
            "COMMIT"
        );

        /* ========================================================
           16. SEND RESULT EMAIL

           EMAIL IS AFTER COMMIT
        ======================================================== */

        const applicantFullName =
            buildFullName(
                applicant.first_name,
                applicant.middle_name,
                applicant.last_name,
                applicant.suffix
            );

        const evaluationDate =
            new Date();

        if (
            applicant.email_address
        ) {

            try {

                if (
                    screeningOverallResult ===
                    "QUALIFIED"
                ) {

                    await sendQualifiedInitialEvaluationEmail({

                        email:
                            applicant.email_address,

                        firstName:
                            applicant.first_name,

                        lastName:
                            applicant.last_name,

                        residentialAddress:
                            applicant.residential_address,

                        positionTitle:
                            vacancy.position_title,

                        qualificationStandards,

                        applicantQualifications: {

                            education:
                                educationQualifications,

                            experience:
                                experienceQualifications,

                            training:
                                trainingQualifications,

                            eligibility:
                                eligibilityQualifications
                        },

                        evaluationDetails,

                        initialEvaluationDate:
                            evaluationDate,

                        applicationCode,

                        hrmoName:
                            screened_by ||
                            "Human Resource Management Officer"
                    });

                }

                else {

                    await sendNotQualifiedInitialEvaluationEmail({

                        email:
                            applicant.email_address,

                        firstName:
                            applicant.first_name,

                        lastName:
                            applicant.last_name,

                        residentialAddress:
                            applicant.residential_address,

                        positionTitle:
                            vacancy.position_title,

                        qualificationStandards,

                        applicantQualifications: {

                            education:
                                educationQualifications,

                            experience:
                                experienceQualifications,

                            training:
                                trainingQualifications,

                            eligibility:
                                eligibilityQualifications
                        },

                        evaluationDetails,

                        initialEvaluationDate:
                            evaluationDate,

                        hrmoName:
                            screened_by ||
                            "Human Resource Management Officer"
                    });
                }

            }

            catch (emailError) {

                console.error(
                    "⚠️ Initial evaluation saved, but email could not be sent:",
                    emailError
                );
            }

        }

        else {

            console.warn(
                `⚠️ Applicant ${applicantFullName} has no email address.`
            );
        }

        /* ========================================================
           17. RETURN RESPONSE
        ======================================================== */

        return {

            screening:
                screeningResult.rows[0],

            applicationCode,

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

    }

    catch (error) {

        try {

            await client.query(
                "ROLLBACK"
            );

        }

        catch (rollbackError) {

            console.error(
                "Rollback error:",
                rollbackError
            );
        }

        throw error;

    }

    finally {

        client.release();

    }

};