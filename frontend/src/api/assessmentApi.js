import axios from "axios";

/*
|--------------------------------------------------------------------------
| Environment Variables
|--------------------------------------------------------------------------
*/

const ASSESSMENT_QUALIFIED_GET =
    import.meta.env.VITE_ASSESSMENT_QUALIFIED_GET;

const ASSESSMENT_SUBMIT_POST =
    import.meta.env.VITE_ASSESSMENT_SUBMIT_POST;

const ASSESSMENT_OPTION_GET_BY_CRITERION =
    import.meta.env.VITE_ASSESSMENT_OPTION_GET_BY_CRITERION;

const ASSESSMENT_CRITERIA_GET =
    import.meta.env.VITE_ASSESSMENT_CRITERIA_GET;


/*
|--------------------------------------------------------------------------
| Get Qualified Applicant
|--------------------------------------------------------------------------
|
| GET /api/assessment/qualified/:applicantId
|
*/

export const getQualifiedApplicantForAssessment = async (
    applicantId
) => {

    try {

        const response = await axios.get(
            `${ASSESSMENT_QUALIFIED_GET}/${applicantId}`
        );

        return response.data;

    } catch (error) {

        console.error(
            "Error fetching qualified applicant:",
            error.response?.data || error.message
        );

        throw error;
    }
};


/*
|--------------------------------------------------------------------------
| Get Assessment Criteria
|--------------------------------------------------------------------------
|
| GET /api/scores/getAssessmentCriteria
|
*/

export const getAssessmentCriteria = async (position = "", category = "") => {

    try {

        const response = await axios.get(ASSESSMENT_CRITERIA_GET, {
            params: { position, category },
        });

        return response.data;

    } catch (error) {

        console.error(
            "Error fetching assessment criteria:",
            error.response?.data || error.message
        );

        throw error;
    }
};


/*
|--------------------------------------------------------------------------
| Get Assessment Options By Criterion
|--------------------------------------------------------------------------
|
| GET /api/assessmentOption/
|     getAssessmentOptionsByAssessmentCriteria
|
*/

export const getAssessmentOptionsByCriterion = async (
    assessmentCriteriaId
) => {

    try {

        const response = await axios.get(
            ASSESSMENT_OPTION_GET_BY_CRITERION,
            {
                params: {
                    assessment_criteria_id:
                        assessmentCriteriaId
                }
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "Error fetching assessment options:",
            error.response?.data || error.message
        );

        throw error;
    }
};


/*
|--------------------------------------------------------------------------
| Submit Assessment
|--------------------------------------------------------------------------
|
| POST /api/assessment/submit
|
*/

export const submitAssessment = async (
    assessmentData
) => {

    try {

        const response = await axios.post(
            ASSESSMENT_SUBMIT_POST,
            assessmentData
        );

        return response.data;

    } catch (error) {

        console.error(
            "Error submitting assessment:",
            error.response?.data || error.message
        );

        throw error;
    }
};