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
        // 1. SUBMIT ASSESSMENT
        // ========================================================
        const result =
            await submitAssessment(req.body);


        // ========================================================
        // 2. GET APPLICANT ID
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

            data: result,

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
export const getAssessmentCriteriaController =
    async (req, res) => {

        try {

            const criteria =
                await getAssessmentCriteria();

            return res.status(200).json({

                success: true,

                data: criteria

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


            const options =
                await getAssessmentCriteriaOption(
                    assessment_criteria_id
                );


            return res.status(200).json({

                success: true,

                data: options

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