import {
    getQualifiedApplicantForAssessment,
    submitAssessment,
    getAssessmentCriteria,
    getAssessmentCriteriaOption,
} from "./assessment.service.js";

import {
    sendIndividualEvaluationSheetEmail,
} from "../initialEvalualtion/email.service.js";

import pool from "../config/db.js";


// ============================================================
// GET QUALIFIED APPLICANT
// ============================================================

export const getQualifiedApplicant = async (req, res) => {

    try {

        const { applicantId } = req.params;

        if (!applicantId) {

            return res.status(400).json({
                error: "Applicant ID is required.",
            });

        }

        const applicant =
            await getQualifiedApplicantForAssessment(
                applicantId
            );

        return res.status(200).json({

            success: true,

            message:
                "Qualified applicant loaded successfully.",

            data:
                applicant,

        });

    } catch (error) {

        if (
            error.message ===
            "APPLICANT_NOT_QUALIFIED"
        ) {

            return res.status(403).json({

                success: false,

                error:
                    "Applicant is not qualified for assessment.",

            });

        }

        console.error(
            "Get qualified applicant error:",
            error
        );

        return res.status(500).json({

            success: false,

            error:
                "Internal server error.",

        });

    }

};


// ============================================================
// POST ASSESSMENT
// ============================================================

export const postAssessment = async (req, res) => {

    try {

        // ========================================================
        // 1. VALIDATE APPLICANT ID
        // ========================================================

        const {
            applicant_id
        } = req.body;


        if (!applicant_id) {

            return res.status(400).json({

                success: false,

                error:
                    "Applicant ID is required.",

            });

        }


        // ========================================================
        // 2. SUBMIT ASSESSMENT
        // ========================================================

        /*
        |--------------------------------------------------------------------------
        | The assessment service determines the correct criteria
        | based on the applicant's vacancy/category.
        |
        | TEACHING
        |     LET/PBET/LEPT
        |     COI
        |     NCOI
        |
        | NON-TEACHING
        |     Education
        |     Training
        |     Experience
        |     Performance
        |     Outstanding Accomplishments
        |     Application of Education
        |     Application of Learning & Development
        |     Potential
        |
        | RELATED TEACHING
        |     Appropriate criteria
        |
        | SCHOOL ADMINISTRATION
        |     Appropriate criteria
        |--------------------------------------------------------------------------
        */

        const result =
            await submitAssessment(
                req.body
            );


        // ========================================================
        // 3. UPDATE APPLICATION STATUS TO RANK
        // ========================================================

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT:
        |
        | "rank" here means the applicant has FINISHED assessment
        | and is now part of the ranking pool.
        |
        | This does NOT mean that we are sending a ranking result
        | to the applicant.
        |--------------------------------------------------------------------------
        */

        await pool.query(
            `
            UPDATE hr_remarks_final_notes
            SET
                application_status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE applicant_id = $2
            `,
            [
                "rank",
                applicant_id
            ]
        );


        // ========================================================
        // 4. GET APPLICANT INFORMATION FOR IES EMAIL
        // ========================================================

        const applicantResult =
            await pool.query(
                `
                SELECT
                    ai.applicant_id,
                    ai.first_name,
                    ai.last_name,
                    ai.email_address,
                    ai.job_applications_id,

                    ja.vacancy_id,

                    v.position_title,

                    p.category,
                    p.salary_grade

                FROM applicant_information ai

                JOIN job_applications ja
                    ON ja.job_applications_id =
                       ai.job_applications_id

                JOIN vacancies v
                    ON v.vacancy_id =
                       ja.vacancy_id

                JOIN positions p
                    ON p.position_id =
                       v.position_id

                WHERE ai.applicant_id = $1

                LIMIT 1
                `,
                [
                    applicant_id
                ]
            );


        // ========================================================
        // 5. SEND INDIVIDUAL EVALUATION SHEET
        // ========================================================

        if (
            applicantResult.rows.length > 0
        ) {

            const applicant =
                applicantResult.rows[0];


            if (
                applicant.email_address
            ) {

                try {

                    // ==================================================
                    // GET SAVED ASSESSMENT SCORES
                    // ==================================================

                    const scoresResult =
                        await pool.query(
                            `
                            SELECT
                                ac.assessment_criteria_id,
                                ac.criterion_name,
                                ac.max_points,

                                ases.score,
                                ases.remarks,

                                ao.option_label

                            FROM assessment_scores ases

                            JOIN assessment_criteria ac
                                ON ac.assessment_criteria_id =
                                   ases.assessment_criteria_id

                            LEFT JOIN assessment_options ao
                                ON ao.assessment_option_id =
                                   ases.assessment_option_id

                            WHERE ases.applicant_id = $1

                            ORDER BY
                                ac.assessment_criteria_id ASC
                            `,
                            [
                                applicant_id
                            ]
                        );


                    // ==================================================
                    // DETERMINE ASSESSMENT TYPE
                    // ==================================================

                    const category =
                        String(
                            applicant.category || ""
                        )
                            .trim()
                            .toUpperCase();


                    let assessmentType;


                    if (
                        category === "TEACHING"
                    ) {

                        assessmentType =
                            "TEACHING";

                    } else if (
                        category ===
                            "RELATED TEACHING" ||
                        category ===
                            "RELATED-TEACHING"
                    ) {

                        assessmentType =
                            "RELATED_TEACHING";

                    } else if (
                        category ===
                            "SCHOOL ADMINISTRATION"
                    ) {

                        assessmentType =
                            "SCHOOL_ADMINISTRATION";

                    } else {

                        assessmentType =
                            "NON_TEACHING";

                    }


                    // ==================================================
                    // SEND IES EMAIL
                    // ==================================================

                    await sendIndividualEvaluationSheetEmail({

                        email:
                            applicant.email_address,

                        firstName:
                            applicant.first_name,

                        lastName:
                            applicant.last_name,

                        positionTitle:
                            applicant.position_title,

                        applicationCode:
                            applicant.job_applications_id,

                        salaryGrade:
                            applicant.salary_grade,

                        category:
                            applicant.category,

                        assessmentType:
                            assessmentType,

                        scores:
                            scoresResult.rows,

                    });


                    console.log(
                        `IES email sent successfully to ${applicant.email_address}`
                    );


                } catch (emailError) {

                    /*
                    |--------------------------------------------------------------------------
                    | IMPORTANT
                    |
                    | Assessment has already been saved and applicant
                    | has already been moved to "rank".
                    |
                    | If the email fails, DO NOT undo the assessment
                    | or change the applicant's ranking status.
                    |--------------------------------------------------------------------------
                    */

                    console.error(
                        "Assessment saved and applicant ranked, but IES email failed:",
                        emailError
                    );

                }

            } else {

                console.warn(
                    `IES email skipped: applicant ${applicant_id} has no email address.`
                );

            }

        } else {

            console.warn(
                `IES email skipped: applicant ${applicant_id} was not found.`
            );

        }


        // ========================================================
        // 6. RETURN SUCCESS
        // ========================================================

        return res.status(201).json({

            success: true,

            message:
                "Assessment submitted successfully.",

            data:
                result,

            application_status:
                "rank",

        });


    } catch (error) {


        // ========================================================
        // APPLICANT NOT QUALIFIED
        // ========================================================

        if (
            error.message ===
            "APPLICANT_NOT_QUALIFIED"
        ) {

            return res.status(403).json({

                success: false,

                error:
                    "Applicant is not qualified for assessment.",

            });

        }


        // ========================================================
        // INVALID SCORES
        // ========================================================

        if (
            error.message ===
            "INVALID_SCORES"
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Assessment scores are required.",

            });

        }


        // ========================================================
        // APPLICANT ID REQUIRED
        // ========================================================

        if (
            error.message ===
            "APPLICANT_ID_REQUIRED"
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Applicant ID is required.",

            });

        }


        // ========================================================
        // INVALID ASSESSMENT CRITERIA
        // ========================================================

        if (
            error.message ===
            "ASSESSMENT_CRITERIA_REQUIRED"
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Assessment criterion is required.",

            });

        }


        // ========================================================
        // INVALID CRITERIA FOR POSITION
        // ========================================================

        if (
            error.message ===
            "INVALID_ASSESSMENT_CRITERIA_FOR_POSITION"
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "The selected assessment criterion does not belong to this applicant's position.",

            });

        }


        // ========================================================
        // DUPLICATE CRITERIA
        // ========================================================

        if (
            error.message ===
            "DUPLICATE_ASSESSMENT_CRITERIA"
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Duplicate assessment criterion submitted.",

            });

        }


        // ========================================================
        // OPTION REQUIRED
        // ========================================================

        if (
            error.message ===
            "ASSESSMENT_OPTION_REQUIRED"
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Please select an assessment option.",

            });

        }


        // ========================================================
        // INVALID OPTION
        // ========================================================

        if (
            error.message ===
            "INVALID_ASSESSMENT_OPTION"
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "The selected assessment option is invalid.",

            });

        }


        // ========================================================
        // NO CRITERIA FOUND
        // ========================================================

        if (
            error.message ===
            "NO_ASSESSMENT_CRITERIA_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                error:
                    "No assessment criteria were found.",

            });

        }


        // ========================================================
        // ALL TEACHER I CRITERIA REQUIRED
        // ========================================================

        if (
            error.message ===
            "ALL_TEACHER_I_CRITERIA_REQUIRED"
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "All Teacher I assessment criteria are required.",

            });

        }


        // ========================================================
        // MISSING TEACHER I CRITERIA
        // ========================================================

        if (
            error.message.startsWith(
                "MISSING_TEACHER_I_CRITERIA_"
            )
        ) {

            return res.status(500).json({

                success: false,

                error:
                    "Teacher I assessment criteria are incomplete in the database.",

            });

        }


        // ========================================================
        // INVALID SCORE
        // ========================================================

        if (
            error.message.startsWith(
                "INVALID_SCORE_"
            )
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "One or more assessment scores exceed the allowed maximum.",

            });

        }


        // ========================================================
        // SERVER ERROR
        // ========================================================

        console.error(
            "Submit assessment error:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                error.message ||
                "Internal server error.",

        });

    }

};


// ============================================================
// GET ASSESSMENT CRITERIA
// ============================================================

export const getAssessmentCriteriaController =
    async (req, res) => {

        try {

            const {
                position,
                category
            } = req.query;


            const criteria =
                await getAssessmentCriteria(
                    position || null,
                    category || null
                );


            return res.status(200).json({

                success: true,

                data:
                    criteria,

            });

        } catch (error) {

            console.error(
                "Error fetching assessment criteria:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Failed to fetch assessment criteria.",

            });

        }

    };


// ============================================================
// GET ASSESSMENT CRITERIA OPTIONS
// ============================================================

export const getAssessmentCriteriaControllerOption =
    async (req, res) => {

        try {

            const {
                assessment_criteria_id
            } = req.query;


            // ====================================================
            // VALIDATE CRITERIA ID
            // ====================================================

            if (!assessment_criteria_id) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Assessment criteria ID is required.",

                });

            }


            const options =
                await getAssessmentCriteriaOption(
                    assessment_criteria_id
                );


            return res.status(200).json({

                success: true,

                data:
                    options,

            });

        } catch (error) {

            console.error(
                "Error fetching assessment criteria options:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Failed to fetch assessment criteria options.",

            });

        }

    };