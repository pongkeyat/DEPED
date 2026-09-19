import {
    createInitialScreening
} from "./initialEvaluation.service.js";

export const postInitialScreening = async (req, res) => {

    try {

        const {
            job_applications_id,
            applicant_id,

            education_passed,
            eligibility_passed,
            training_passed,
            experience_passed,

            overall_result,
            screened_by
        } = req.body;


        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        // Either job_applications_id or applicant_id is required
        if (
            job_applications_id === undefined &&
            applicant_id === undefined
        ) {

            return res.status(400).json({
                error:
                    "job_applications_id or applicant_id is required."
            });
        }


        // All initial screening criteria are required
        if (
            education_passed === undefined ||
            eligibility_passed === undefined ||
            training_passed === undefined ||
            experience_passed === undefined
        ) {

            return res.status(400).json({
                error:
                    "All screening criteria are required."
            });
        }


        // Overall result is required
        if (!overall_result) {

            return res.status(400).json({
                error:
                    "overall_result is required."
            });
        }


        // Screened by is required
        if (!screened_by) {

            return res.status(400).json({
                error:
                    "screened_by is required."
            });
        }


        /*
        |--------------------------------------------------------------------------
        | SERVICE
        |--------------------------------------------------------------------------
        */

        const result =
            await createInitialScreening(
                req.body
            );


        /*
        |--------------------------------------------------------------------------
        | SUCCESS
        |--------------------------------------------------------------------------
        */

        return res.status(201).json({

            message:
                "Initial screening submitted successfully.",

            ...result
        });


    } catch (error) {

        console.error(
            "Initial Screening Error:",
            error
        );


        /*
        |--------------------------------------------------------------------------
        | SERVICE ERROR
        |--------------------------------------------------------------------------
        */

        if (error.statusCode) {

            return res.status(
                error.statusCode
            ).json({
                error: error.message
            });
        }


        /*
        |--------------------------------------------------------------------------
        | SERVER ERROR
        |--------------------------------------------------------------------------
        */

        return res.status(500).json({
            error:
                "Internal server error."
        });
    }
};