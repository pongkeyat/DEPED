import pool from "../config/db.js";

/*
|--------------------------------------------------------------------------
| GET QUALIFIED APPLICANT FOR ASSESSMENT
|--------------------------------------------------------------------------
*/

export const getQualifiedApplicantForAssessment = async (applicantId) => {

    const query = `
        SELECT
            ai.applicant_id,
            ai.job_applications_id,

            ja.vacancy_id,

            v.position_title,
            v.salary_grade,

            ins.screening_id,
            ins.overall_result,
            ins.initial_screening_points,

            ins.education_value,
            ins.education_increment,
            ins.education_points,

            ins.training_hours,
            ins.training_increment,
            ins.training_points,

            ins.experience_months,
            ins.experience_increment,
            ins.experience_points

        FROM applicant_information ai

        JOIN job_applications ja
            ON ja.job_applications_id = ai.job_applications_id

        JOIN vacancies v
            ON v.vacancy_id = ja.vacancy_id

        JOIN initial_screening ins
            ON ins.job_applications_id = ai.job_applications_id

        WHERE ai.applicant_id = $1

          AND UPPER(TRIM(ins.overall_result))
              = 'QUALIFIED'

        ORDER BY
            ins.screening_id DESC

        LIMIT 1
    `;

    const result = await pool.query(
        query,
        [applicantId]
    );

    if (result.rows.length === 0) {

        throw new Error(
            "APPLICANT_NOT_QUALIFIED"
        );
    }

    const applicant = result.rows[0];

    return {
        applicant_id: applicant.applicant_id,

        job_applications_id:
            applicant.job_applications_id,

        vacancy_id:
            applicant.vacancy_id,

        position_title:
            applicant.position_title,

        salary_grade:
            applicant.salary_grade,

        initial_screening: {
            screening_id:
                applicant.screening_id,

            overall_result:
                applicant.overall_result,

            total:
                Number(
                    applicant.initial_screening_points || 0
                ),

            education: {
                value:
                    Number(
                        applicant.education_value || 0
                    ),

                increment:
                    Number(
                        applicant.education_increment || 0
                    ),

                points:
                    Number(
                        applicant.education_points || 0
                    )
            },

            training: {
                hours:
                    Number(
                        applicant.training_hours || 0
                    ),

                increment:
                    Number(
                        applicant.training_increment || 0
                    ),

                points:
                    Number(
                        applicant.training_points || 0
                    )
            },

            experience: {
                months:
                    Number(
                        applicant.experience_months || 0
                    ),

                increment:
                    Number(
                        applicant.experience_increment || 0
                    ),

                points:
                    Number(
                        applicant.experience_points || 0
                    )
            }
        }
    };
};



export const submitAssessment = async (data) => {

    const {
        applicant_id,
        scores,
        scored_by
    } = data;

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        /*
        |--------------------------------------------------------------------------
        | 1. VERIFY APPLICANT IS QUALIFIED
        |--------------------------------------------------------------------------
        */

        const applicantResult = await client.query(
            `
            SELECT
                ai.applicant_id,
                ai.job_applications_id,
                ins.screening_id,
                ins.overall_result,
                ins.initial_screening_points
            FROM applicant_information ai

            JOIN initial_screening ins
                ON ins.job_applications_id =
                   ai.job_applications_id

            WHERE ai.applicant_id = $1

              AND UPPER(TRIM(ins.overall_result))
                  = 'QUALIFIED'

            ORDER BY ins.screening_id DESC

            LIMIT 1
            `,
            [applicant_id]
        );

        if (applicantResult.rows.length === 0) {
            throw new Error("APPLICANT_NOT_QUALIFIED");
        }

        const applicant = applicantResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | 2. VALIDATE SCORES
        |--------------------------------------------------------------------------
        */

        if (!Array.isArray(scores) || scores.length === 0) {

            throw new Error("INVALID_SCORES");
        }


        /*
        |--------------------------------------------------------------------------
        | 3. INSERT / UPDATE ASSESSMENT SCORES
        |--------------------------------------------------------------------------
        */

        for (const item of scores) {

            const {
                assessment_criteria_id,
                assessment_option_id,
                score,
                remarks
            } = item;


            if (!assessment_criteria_id) {
                throw new Error(
                    "ASSESSMENT_CRITERIA_REQUIRED"
                );
            }


            /*
            |----------------------------------------------------------------------
            | Get criterion
            |----------------------------------------------------------------------
            */

            const criteriaResult =
                await client.query(
                    `
                    SELECT
                        assessment_criteria_id,
                        criterion_name,
                        max_points,
                        is_manual
                    FROM assessment_criteria
                    WHERE assessment_criteria_id = $1
                      AND is_active = TRUE
                    `,
                    [assessment_criteria_id]
                );


            if (criteriaResult.rows.length === 0) {

                throw new Error(
                    "INVALID_ASSESSMENT_CRITERIA"
                );
            }


            const criterion =
                criteriaResult.rows[0];


            let finalScore = 0;


            /*
            |----------------------------------------------------------------------
            | MANUAL SCORE
            |----------------------------------------------------------------------
            */

            if (criterion.is_manual) {

                finalScore =
                    Number(score || 0);

            }


            /*
            |----------------------------------------------------------------------
            | OPTION-BASED SCORE
            |----------------------------------------------------------------------
            */

            else {

                if (!assessment_option_id) {

                    throw new Error(
                        "ASSESSMENT_OPTION_REQUIRED"
                    );
                }


                const optionResult =
                    await client.query(
                        `
                        SELECT
                            points
                        FROM assessment_options
                        WHERE assessment_option_id = $1

                          AND assessment_criteria_id = $2

                          AND is_active = TRUE
                        `,
                        [
                            assessment_option_id,
                            assessment_criteria_id
                        ]
                    );


                if (optionResult.rows.length === 0) {

                    throw new Error(
                        "INVALID_ASSESSMENT_OPTION"
                    );
                }


                finalScore =
                    Number(
                        optionResult.rows[0].points
                    );
            }


            /*
            |----------------------------------------------------------------------
            | Validate maximum score
            |----------------------------------------------------------------------
            */

            if (
                finalScore < 0 ||
                finalScore > Number(criterion.max_points)
            ) {

                throw new Error(
                    `INVALID_SCORE_${criterion.criterion_name}`
                );
            }


            /*
            |----------------------------------------------------------------------
            | Save score
            |----------------------------------------------------------------------
            */

            await client.query(
                `
                INSERT INTO assessment_scores (
                    applicant_id,
                    assessment_criteria_id,
                    assessment_option_id,
                    score,
                    remarks,
                    scored_by
                )
                VALUES ($1, $2, $3, $4, $5, $6)

                ON CONFLICT (
                    applicant_id,
                    assessment_criteria_id
                )

                DO UPDATE SET
                    assessment_option_id =
                        EXCLUDED.assessment_option_id,

                    score =
                        EXCLUDED.score,

                    remarks =
                        EXCLUDED.remarks,

                    scored_by =
                        EXCLUDED.scored_by,

                    updated_at =
                        CURRENT_TIMESTAMP
                `,
                [
                    applicant_id,
                    assessment_criteria_id,
                    assessment_option_id || null,
                    finalScore,
                    remarks || null,
                    scored_by || null
                ]
            );
        }


        /*
        |--------------------------------------------------------------------------
        | 4. GET SAVED ASSESSMENT SCORES
        |--------------------------------------------------------------------------
        */

        const scoresResult = await client.query(
            `
            SELECT
                ac.assessment_criteria_id,
                ac.criterion_name,
                ac.max_points,
                ac.is_manual,
                ases.assessment_option_id,
                ases.score,
                ases.remarks,
                ases.scored_by

            FROM assessment_scores ases

            JOIN assessment_criteria ac
                ON ac.assessment_criteria_id =
                   ases.assessment_criteria_id

            WHERE ases.applicant_id = $1

            ORDER BY ac.assessment_criteria_id
            `,
            [applicant_id]
        );


        /*
        |--------------------------------------------------------------------------
        | 5. CALCULATE ASSESSMENT TOTAL
        |--------------------------------------------------------------------------
        */

        const assessmentTotal =
            scoresResult.rows.reduce(
                (total, row) =>
                    total + Number(row.score || 0),
                0
            );


        /*
        |--------------------------------------------------------------------------
        | 6. COMMIT
        |--------------------------------------------------------------------------
        */

        await client.query("COMMIT");


        return {

            applicant_id,

            job_applications_id:
                applicant.job_applications_id,

            initial_screening_points:
                Number(
                    applicant.initial_screening_points || 0
                ),

            assessment_scores:
                scoresResult.rows,

            assessment_total:
                assessmentTotal,

            /*
            |----------------------------------------------------------------------
            | Temporary combined total
            |----------------------------------------------------------------------
            */

            combined_total:
                Number(
                    applicant.initial_screening_points || 0
                ) + assessmentTotal
        };

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
};




/*
|--------------------------------------------------------------------------
| GET ASSESSMENT CRITERIA
|--------------------------------------------------------------------------
*/

export const getAssessmentCriteria = async () => {
    const query = `
        SELECT
            assessment_criteria_id,
            criterion_name,
            max_points,
            is_manual
        FROM assessment_criteria
        WHERE is_active = TRUE
        ORDER BY assessment_criteria_id ASC
    `;

    const result = await pool.query(query);

    return result.rows.map((criteria) => ({
        assessment_criteria_id: criteria.assessment_criteria_id,
        criterion_name: criteria.criterion_name,
        max_points: Number(criteria.max_points || 0),
        is_manual: criteria.is_manual
    }));
};


export const getAssessmentCriteriaOption = async (assessmentCriteriaId) => {
    const query = `
        SELECT
            assessment_option_id,
            assessment_criteria_id,
            option_label,
            points
        FROM assessment_options
        WHERE assessment_criteria_id = $1
        ORDER BY assessment_option_id ASC
    `;

    const result = await pool.query(query, [assessmentCriteriaId]);

    return result.rows.map((option) => ({
        assessment_option_id: option.assessment_option_id,
        assessment_criteria_id: option.assessment_criteria_id,
        option_label: option.option_label,
        points: Number(option.points || 0)
    }));
};