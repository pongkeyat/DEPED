import {
    getQualifiedApplicantForAssessment,
    submitAssessment,
    getAssessmentCriteria,
    getAssessmentCriteriaOption,
} from "./assessment.service.js";

import pool from "../config/db.js";


// ============================================================
// GET QUALIFIED APPLICANT
// ============================================================
export const getQualifiedApplicant = async (req, res) => {

    try {

        const { applicantId } = req.params;

        if (!applicantId) {

            return res.status(400).json({
                error: "Applicant ID is required."
            });

        }

        const applicant =
            await getQualifiedApplicantForAssessment(
                applicantId
            );

        return res.status(200).json({

            message:
                "Qualified applicant loaded successfully.",

            data: applicant

        });

    } catch (error) {

        if (
            error.message ===
            "APPLICANT_NOT_QUALIFIED"
        ) {

            return res.status(403).json({

                error:
                    "Applicant is not qualified for assessment."

            });

        }

        console.error(
            "Get qualified applicant error:",
            error
        );

        return res.status(500).json({

            error:
                "Internal server error."

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

                error:
                    "Applicant ID is required."

            });

        }


        // ========================================================
        // 2. SUBMIT ASSESSMENT
        // ========================================================
        //
        // The assessment.service.js will automatically determine:
        //
        // TEACHER I
        //      LET/PBET/LEPT
        //      COI
        //      NCOI
        //
        // or
        //
        // NON-TEACHING
        //      Education
        //      Training
        //      Experience
        //      Performance
        //      Outstanding Accomplishments
        //      Application of Education
        //      Application of Learning & Development
        //      Potential
        //
        // based on the applicant's vacancy.
        // ========================================================

        const result =
            await submitAssessment(
                req.body
            );


        // ========================================================
        // 3. UPDATE APPLICATION STATUS TO RANK
        // ========================================================
        await pool.query(
            `
                UPDATE hr_remarks_final_notes
                SET application_status = $1
                WHERE applicant_id = $2
            `,
            [
                "rank",
                applicant_id
            ]
        );


        // ========================================================
        // 4. RETURN SUCCESS
        // ========================================================
        return res.status(201).json({

            message:
                "Assessment submitted successfully and applicant ranked.",

            data:
                result,

            application_status:
                "rank"

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

                error:
                    "Applicant is not qualified for assessment."

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

                error:
                    "Assessment scores are required."

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

                error:
                    "Applicant ID is required."

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

                error:
                    "Assessment criterion is required."

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

                error:
                    "The selected assessment criterion does not belong to this applicant's position."

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

                error:
                    "Duplicate assessment criterion submitted."

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

                error:
                    "Please select an assessment option."

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

                error:
                    "The selected assessment option is invalid."

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

                error:
                    "No assessment criteria were found."

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

                error:
                    "All Teacher I assessment criteria are required."

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

                error:
                    "Teacher I assessment criteria are incomplete in the database."

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

                error:
                    "One or more assessment scores exceed the allowed maximum."

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

            error:
                error.message ||
                "Internal server error."

        });

    }

};


// ============================================================
// GET ASSESSMENT CRITERIA
// ============================================================
//
// Optional query:
//
// Teacher I:
// GET /api/assessment/criteria?position=TEACHER%20I
//
// Non-Teaching:
// GET /api/assessment/criteria?position=SECURITY%20GUARD%20I
//
// If no position is supplied, all active criteria are returned.
// ============================================================
export const getAssessmentCriteriaController =
    async (req, res) => {

        try {

            const { position, category } = req.query;


            const criteria =
                await getAssessmentCriteria(
                    position || null,
                    category || null
                );


            return res.status(200).json({

                success: true,

                data:
                    criteria

            });

        } catch (error) {

            console.error(
                "Error fetching assessment criteria:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Failed to fetch assessment criteria."

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
                        "Assessment criteria ID is required."

                });

            }


            const options =
                await getAssessmentCriteriaOption(
                    assessment_criteria_id
                );


            return res.status(200).json({

                success: true,

                data:
                    options

            });

        } catch (error) {

            console.error(
                "Error fetching assessment criteria options:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Failed to fetch assessment criteria options."

            });

        }

    };