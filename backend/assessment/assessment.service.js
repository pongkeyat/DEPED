import pool from "../config/db.js";

/*
|--------------------------------------------------------------------------
| NORMALIZE VALUES
|--------------------------------------------------------------------------
*/

const normalize = (value) => {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();
};


/*
|--------------------------------------------------------------------------
| GET QUALIFIED APPLICANT
|--------------------------------------------------------------------------
*/

export const getQualifiedApplicantForAssessment = async (
    applicantId
) => {

    const query = `
        SELECT
            ai.applicant_id,
            ai.job_applications_id,

            ja.vacancy_id,

            v.position_id,
            v.position_title,

            p.position_title AS actual_position_title,
            p.category,
            p.salary_grade,

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
            ON ja.job_applications_id =
               ai.job_applications_id

        JOIN vacancies v
            ON v.vacancy_id =
               ja.vacancy_id

        JOIN positions p
            ON p.position_id =
               v.position_id

        JOIN initial_screening ins
            ON ins.job_applications_id =
               ai.job_applications_id

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

        applicant_id:
            applicant.applicant_id,

        job_applications_id:
            applicant.job_applications_id,

        vacancy_id:
            applicant.vacancy_id,

        position_id:
            applicant.position_id,

        position_title:
            applicant.actual_position_title ||
            applicant.position_title,

        category:
            applicant.category,

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


/*
|--------------------------------------------------------------------------
| GET ASSESSMENT CRITERIA BY ASSESSMENT TYPE
|--------------------------------------------------------------------------
|
| Example:
|
| TEACHING
|   -> LET/PBET/LEPT
|   -> COI
|   -> NCOI
|
| NON_TEACHING
|   -> Performance
|   -> Outstanding Accomplishments
|   -> Application of Education
|   -> Application of Learning & Development
|   -> Potential
|
| RELATED_TEACHING
|   -> whatever criteria are assigned in DB
|
| SCHOOL_ADMINISTRATION
|   -> whatever criteria are assigned in DB
|
|--------------------------------------------------------------------------
*/

export const getAssessmentCriteriaByType = async (
    assessmentType
) => {

    if (!assessmentType) {
        throw new Error(
            "ASSESSMENT_TYPE_REQUIRED"
        );
    }

    const normalizedType =
        normalize(assessmentType);

    const query = `
        SELECT

            ac.assessment_criteria_id,

            ac.criterion_name,

            ac.max_points,

            ac.is_manual,

            ac.assessment_type,

            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(

                        'assessment_option_id',
                        ao.assessment_option_id,

                        'assessment_criteria_id',
                        ao.assessment_criteria_id,

                        'option_label',
                        ao.option_label,

                        'points',
                        ao.points

                    )

                    ORDER BY
                        ao.points DESC,
                        ao.assessment_option_id ASC

                )
                FILTER (
                    WHERE ao.assessment_option_id IS NOT NULL
                ),

                '[]'::json
            ) AS options

        FROM assessment_criteria ac

        LEFT JOIN assessment_options ao
            ON ao.assessment_criteria_id =
               ac.assessment_criteria_id

            AND ao.is_active = TRUE

        WHERE ac.is_active = TRUE

          AND UPPER(TRIM(ac.assessment_type))
              = $1

        GROUP BY

            ac.assessment_criteria_id,

            ac.criterion_name,

            ac.max_points,

            ac.is_manual,

            ac.assessment_type

        ORDER BY
            ac.assessment_criteria_id ASC
    `;

    const result = await pool.query(
        query,
        [normalizedType]
    );

    return result.rows.map(
        (criterion) => ({

            assessment_criteria_id:
                Number(
                    criterion.assessment_criteria_id
                ),

            criterion_name:
                criterion.criterion_name,

            max_points:
                Number(
                    criterion.max_points || 0
                ),

            is_manual:
                Boolean(
                    criterion.is_manual
                ),

            assessment_type:
                criterion.assessment_type,

            options:
                Array.isArray(
                    criterion.options
                )
                    ? criterion.options.map(
                        (option) => ({

                            assessment_option_id:
                                Number(
                                    option.assessment_option_id
                                ),

                            assessment_criteria_id:
                                Number(
                                    option.assessment_criteria_id
                                ),

                            option_label:
                                option.option_label,

                            points:
                                Number(
                                    option.points || 0
                                )
                        })
                    )
                    : []
        })
    );
};


/*
|--------------------------------------------------------------------------
| GET ASSESSMENT CRITERIA
|--------------------------------------------------------------------------
|
| This replaces the old position/category filtering.
|
| getAssessmentCriteria("TEACHING")
| getAssessmentCriteria("NON_TEACHING")
| getAssessmentCriteria("RELATED_TEACHING")
| getAssessmentCriteria("SCHOOL_ADMINISTRATION")
|
|--------------------------------------------------------------------------
*/

export const getAssessmentCriteria = async (
    assessmentType = null
) => {

    if (!assessmentType) {
        throw new Error(
            "ASSESSMENT_TYPE_REQUIRED"
        );
    }

    return await getAssessmentCriteriaByType(
        assessmentType
    );
};


/*
|--------------------------------------------------------------------------
| GET OPTIONS BY CRITERION
|--------------------------------------------------------------------------
|
| Kept for compatibility with your existing frontend/API.
|--------------------------------------------------------------------------
*/

export const getAssessmentCriteriaOption =
    async (
        assessmentCriteriaId
    ) => {

        if (!assessmentCriteriaId) {
            throw new Error(
                "ASSESSMENT_CRITERIA_ID_REQUIRED"
            );
        }

        const query = `
            SELECT

                assessment_option_id,

                assessment_criteria_id,

                option_label,

                points

            FROM assessment_options

            WHERE assessment_criteria_id = $1

              AND is_active = TRUE

            ORDER BY

                points DESC,

                assessment_option_id ASC
        `;

        const result =
            await pool.query(
                query,
                [
                    assessmentCriteriaId
                ]
            );

        return result.rows.map(
            (option) => ({

                assessment_option_id:
                    Number(
                        option.assessment_option_id
                    ),

                assessment_criteria_id:
                    Number(
                        option.assessment_criteria_id
                    ),

                option_label:
                    option.option_label,

                points:
                    Number(
                        option.points || 0
                    )
            })
        );
    };


/*
|--------------------------------------------------------------------------
| GET OPTIONS BY ASSESSMENT TYPE
|--------------------------------------------------------------------------
|
| Optional helper.
|
| This allows you to get ALL options belonging to an
| assessment type.
|--------------------------------------------------------------------------
*/

export const getAssessmentOptionsByType =
    async (
        assessmentType
    ) => {

        if (!assessmentType) {
            throw new Error(
                "ASSESSMENT_TYPE_REQUIRED"
            );
        }

        const normalizedType =
            normalize(assessmentType);

        const query = `
            SELECT

                ac.assessment_criteria_id,

                ac.criterion_name,

                ac.assessment_type,

                ao.assessment_option_id,

                ao.option_label,

                ao.points

            FROM assessment_criteria ac

            JOIN assessment_options ao
                ON ao.assessment_criteria_id =
                   ac.assessment_criteria_id

            WHERE ac.is_active = TRUE

              AND ao.is_active = TRUE

              AND UPPER(TRIM(ac.assessment_type))
                  = $1

            ORDER BY

                ac.assessment_criteria_id ASC,

                ao.points DESC,

                ao.assessment_option_id ASC
        `;

        const result =
            await pool.query(
                query,
                [normalizedType]
            );

        return result.rows.map(
            (row) => ({

                assessment_criteria_id:
                    Number(
                        row.assessment_criteria_id
                    ),

                criterion_name:
                    row.criterion_name,

                assessment_type:
                    row.assessment_type,

                assessment_option_id:
                    Number(
                        row.assessment_option_id
                    ),

                option_label:
                    row.option_label,

                points:
                    Number(
                        row.points || 0
                    )
            })
        );
    };


/*
|--------------------------------------------------------------------------
| GET CRITERION MAP
|--------------------------------------------------------------------------
*/

const getCriteriaMap = (
    criteria
) => {

    const map = new Map();

    for (
        const criterion
        of criteria
    ) {

        map.set(
            Number(
                criterion.assessment_criteria_id
            ),
            criterion
        );
    }

    return map;
};


/*
|--------------------------------------------------------------------------
| SUBMIT ASSESSMENT
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| SUBMIT ASSESSMENT
|--------------------------------------------------------------------------
|
| assessment_type exists ONLY in assessment_criteria.
|
| Applicant category:
|
| TEACHING
|     -> TEACHING
|
| NON-TEACHING
|     -> NON_TEACHING
|
| RELATED TEACHING
|     -> RELATED_TEACHING
|
| SCHOOL ADMINISTRATION
|     -> SCHOOL_ADMINISTRATION
|
| The actual criteria are then retrieved from:
|
| assessment_criteria.assessment_type
|
|--------------------------------------------------------------------------
*/

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
        | 1. VALIDATE REQUEST
        |--------------------------------------------------------------------------
        */

        if (!applicant_id) {
            throw new Error(
                "APPLICANT_ID_REQUIRED"
            );
        }

        if (
            !Array.isArray(scores) ||
            scores.length === 0
        ) {
            throw new Error(
                "INVALID_SCORES"
            );
        }


        /*
        |--------------------------------------------------------------------------
        | 2. GET QUALIFIED APPLICANT
        |--------------------------------------------------------------------------
        */

        const applicantResult = await client.query(
            `
                SELECT

                    ai.applicant_id,

                    ai.job_applications_id,

                    ja.vacancy_id,

                    v.position_id,

                    v.position_title,

                    p.position_title
                        AS actual_position_title,

                    p.category,

                    p.salary_grade,

                    ins.screening_id,

                    ins.overall_result,

                    ins.initial_screening_points

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

                JOIN initial_screening ins
                    ON ins.job_applications_id =
                       ai.job_applications_id

                WHERE ai.applicant_id = $1

                  AND UPPER(
                        TRIM(
                            ins.overall_result
                        )
                  ) = 'QUALIFIED'

                ORDER BY
                    ins.screening_id DESC

                LIMIT 1
            `,
            [applicant_id]
        );


        /*
        |--------------------------------------------------------------------------
        | 3. CHECK APPLICANT
        |--------------------------------------------------------------------------
        */

        if (
            applicantResult.rows.length === 0
        ) {
            throw new Error(
                "APPLICANT_NOT_QUALIFIED"
            );
        }

        const applicant =
            applicantResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | 4. GET CATEGORY
        |--------------------------------------------------------------------------
        */

        const category =
            String(
                applicant.category || ""
            )
                .trim()
                .toUpperCase()
                .replace(/\s+/g, " ");


        /*
        |--------------------------------------------------------------------------
        | 5. DETERMINE ASSESSMENT TYPE
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | assessment_type is NOT read from positions
        | or vacancies.
        |
        | It is stored in assessment_criteria.
        |
        |--------------------------------------------------------------------------
        */

        let assessmentType = "";


        /*
        | TEACHING
        |--------------------------------------------------------------------------
        */

        if (
            category === "TEACHING" ||
            category === "TEACHING POSITIONS"
        ) {

            assessmentType =
                "TEACHING";
        }


        /*
        | RELATED TEACHING
        |--------------------------------------------------------------------------
        */

        else if (
            category === "RELATED TEACHING" ||
            category === "RELATED-TEACHING" ||
            category === "RELATED TEACHING POSITIONS"
        ) {

            assessmentType =
                "RELATED_TEACHING";
        }


        /*
        | SCHOOL ADMINISTRATION
        |--------------------------------------------------------------------------
        */

        else if (
            category === "SCHOOL ADMINISTRATION" ||
            category === "SCHOOL ADMINISTRATION POSITIONS"
        ) {

            assessmentType =
                "SCHOOL_ADMINISTRATION";
        }


        /*
        | NON-TEACHING
        |--------------------------------------------------------------------------
        */

        else if (
            category === "NON-TEACHING" ||
            category === "NON TEACHING" ||
            category === "NON-TEACHING POSITIONS" ||
            category === "NON TEACHING POSITIONS"
        ) {

            assessmentType =
                "NON_TEACHING";
        }


        /*
        |--------------------------------------------------------------------------
        | 6. VALIDATE ASSESSMENT TYPE
        |--------------------------------------------------------------------------
        */

        if (!assessmentType) {

            console.error(
                "ASSESSMENT TYPE NOT FOUND",
                {
                    applicant_id,

                    position_id:
                        applicant.position_id,

                    position_title:
                        applicant.actual_position_title ||
                        applicant.position_title,

                    category:
                        applicant.category
                }
            );

            throw new Error(
                "ASSESSMENT_TYPE_NOT_FOUND"
            );
        }


        console.log(
            "================================="
        );

        console.log(
            "ASSESSMENT SUBMISSION"
        );

        console.log(
            "Applicant:",
            applicant_id
        );

        console.log(
            "Position:",
            applicant.actual_position_title ||
            applicant.position_title
        );

        console.log(
            "Category:",
            applicant.category
        );

        console.log(
            "Assessment Type:",
            assessmentType
        );

        console.log(
            "================================="
        );


        /*
        |--------------------------------------------------------------------------
        | 7. GET CRITERIA FROM DATABASE
        |--------------------------------------------------------------------------
        |
        | assessment_type is taken from assessment_criteria.
        |
        |--------------------------------------------------------------------------
        */

        const criteriaResult =
            await client.query(
                `
                    SELECT

                        assessment_criteria_id,

                        criterion_name,

                        max_points,

                        is_manual,

                        is_active,

                        assessment_type

                    FROM assessment_criteria

                    WHERE is_active = TRUE

                      AND UPPER(
                            TRIM(
                                assessment_type
                            )
                      ) = $1

                    ORDER BY
                        assessment_criteria_id ASC
                `,
                [
                    assessmentType
                ]
            );


        const criteriaRows =
            criteriaResult.rows;


        /*
        |--------------------------------------------------------------------------
        | 8. CHECK CRITERIA
        |--------------------------------------------------------------------------
        */

        if (
            criteriaRows.length === 0
        ) {

            console.error(
                "NO ASSESSMENT CRITERIA FOUND",
                {
                    applicant_id,

                    position:
                        applicant.actual_position_title ||
                        applicant.position_title,

                    category:
                        applicant.category,

                    assessmentType
                }
            );

            throw new Error(
                "NO_ASSESSMENT_CRITERIA_FOUND"
            );
        }


        console.log(
            "VALID CRITERIA:",
            criteriaRows.map(
                criterion => ({
                    id:
                        criterion.assessment_criteria_id,

                    name:
                        criterion.criterion_name,

                    max:
                        criterion.max_points,

                    type:
                        criterion.assessment_type
                })
            )
        );


        /*
        |--------------------------------------------------------------------------
        | 9. CREATE CRITERIA MAP
        |--------------------------------------------------------------------------
        */

        const criteriaMap =
            new Map();

        criteriaRows.forEach(
            criterion => {

                criteriaMap.set(
                    Number(
                        criterion.assessment_criteria_id
                    ),
                    criterion
                );
            }
        );


        /*
        |--------------------------------------------------------------------------
        | 10. PREVENT DUPLICATE CRITERIA
        |--------------------------------------------------------------------------
        */

        const submittedCriteriaIds =
            new Set();


        /*
        |--------------------------------------------------------------------------
        | 11. SAVE SCORES
        |--------------------------------------------------------------------------
        */

        for (
            const item
            of scores
        ) {

            const {
                assessment_criteria_id,
                assessment_option_id,
                score,
                remarks
            } = item;


            /*
            |--------------------------------------------------------------------------
            | VALIDATE CRITERION ID
            |--------------------------------------------------------------------------
            */

            if (
                !assessment_criteria_id
            ) {

                throw new Error(
                    "ASSESSMENT_CRITERIA_REQUIRED"
                );
            }


            const criterionId =
                Number(
                    assessment_criteria_id
                );


            /*
            |--------------------------------------------------------------------------
            | DUPLICATE CHECK
            |--------------------------------------------------------------------------
            */

            if (
                submittedCriteriaIds.has(
                    criterionId
                )
            ) {

                throw new Error(
                    "DUPLICATE_ASSESSMENT_CRITERIA"
                );
            }


            submittedCriteriaIds.add(
                criterionId
            );


            /*
            |--------------------------------------------------------------------------
            | CHECK CRITERION BELONGS TO ASSESSMENT TYPE
            |--------------------------------------------------------------------------
            */

            const criterion =
                criteriaMap.get(
                    criterionId
                );


            if (!criterion) {

                console.error(
                    "INVALID ASSESSMENT CRITERION",
                    {
                        applicant_id,

                        assessmentType,

                        submittedCriterionId:
                            criterionId,

                        validCriteria:
                            criteriaRows.map(
                                row => ({
                                    id:
                                        Number(
                                            row.assessment_criteria_id
                                        ),

                                    name:
                                        row.criterion_name,

                                    assessment_type:
                                        row.assessment_type
                                })
                            )
                    }
                );

                throw new Error(
                    "INVALID_ASSESSMENT_CRITERIA_FOR_POSITION"
                );
            }


            /*
            |--------------------------------------------------------------------------
            | 12. CALCULATE SCORE
            |--------------------------------------------------------------------------
            */

            let finalScore = 0;


            /*
            |--------------------------------------------------------------------------
            | MANUAL CRITERION
            |--------------------------------------------------------------------------
            */

            if (
                criterion.is_manual === true
            ) {

                finalScore =
                    Number(score);


                if (
                    Number.isNaN(
                        finalScore
                    )
                ) {

                    throw new Error(
                        `INVALID_SCORE_${criterion.criterion_name}`
                    );
                }
            }


            /*
            |--------------------------------------------------------------------------
            | OPTION-BASED CRITERION
            |--------------------------------------------------------------------------
            */

            else {

                if (
                    !assessment_option_id
                ) {

                    throw new Error(
                        "ASSESSMENT_OPTION_REQUIRED"
                    );
                }


                /*
                |--------------------------------------------------------------------------
                | CHECK OPTION
                |--------------------------------------------------------------------------
                */

                const optionResult =
                    await client.query(
                        `
                            SELECT

                                assessment_option_id,

                                assessment_criteria_id,

                                option_label,

                                points

                            FROM assessment_options

                            WHERE assessment_option_id = $1

                              AND assessment_criteria_id = $2

                              AND is_active = TRUE

                            LIMIT 1
                        `,
                        [
                            assessment_option_id,

                            criterionId
                        ]
                    );


                if (
                    optionResult.rows.length === 0
                ) {

                    console.error(
                        "INVALID ASSESSMENT OPTION",
                        {
                            applicant_id,

                            criterionId,

                            assessment_option_id
                        }
                    );

                    throw new Error(
                        "INVALID_ASSESSMENT_OPTION"
                    );
                }


                finalScore =
                    Number(
                        optionResult.rows[0]
                            .points
                    );
            }


            /*
            |--------------------------------------------------------------------------
            | 13. VALIDATE MAXIMUM SCORE
            |--------------------------------------------------------------------------
            */

            const maxPoints =
                Number(
                    criterion.max_points
                );


            if (
                Number.isNaN(
                    finalScore
                ) ||
                finalScore < 0 ||
                finalScore > maxPoints
            ) {

                throw new Error(
                    `INVALID_SCORE_${criterion.criterion_name}`
                );
            }


            /*
            |--------------------------------------------------------------------------
            | 14. SAVE ASSESSMENT SCORE
            |--------------------------------------------------------------------------
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

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6
                    )

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

                    criterionId,

                    assessment_option_id ||
                        null,

                    finalScore,

                    remarks ||
                        null,

                    scored_by ||
                        null
                ]
            );
        }


        /*
        |--------------------------------------------------------------------------
        | 15. GET SAVED SCORES
        |--------------------------------------------------------------------------
        */

        const scoresResult =
            await client.query(
                `
                    SELECT

                        ac.assessment_criteria_id,

                        ac.criterion_name,

                        ac.max_points,

                        ac.is_manual,

                        ac.assessment_type,

                        ases.assessment_option_id,

                        ao.option_label,

                        ases.score,

                        ases.remarks,

                        ases.scored_by

                    FROM assessment_scores ases

                    JOIN assessment_criteria ac
                        ON ac.assessment_criteria_id =
                           ases.assessment_criteria_id

                    LEFT JOIN assessment_options ao
                        ON ao.assessment_option_id =
                           ases.assessment_option_id

                    WHERE ases.applicant_id = $1

                      AND ac.is_active = TRUE

                      AND UPPER(
                            TRIM(
                                ac.assessment_type
                            )
                      ) = $2

                    ORDER BY
                        ac.assessment_criteria_id ASC
                `,
                [
                    applicant_id,

                    assessmentType
                ]
            );


        /*
        |--------------------------------------------------------------------------
        | 16. CALCULATE ASSESSMENT TOTAL
        |--------------------------------------------------------------------------
        */

        const assessmentTotal =
            scoresResult.rows.reduce(
                (
                    total,
                    row
                ) => {

                    return (
                        total +
                        Number(
                            row.score || 0
                        )
                    );
                },
                0
            );


        /*
        |--------------------------------------------------------------------------
        | 17. CALCULATE MAXIMUM ASSESSMENT SCORE
        |--------------------------------------------------------------------------
        */

        const maximumAssessmentScore =
            criteriaRows.reduce(
                (
                    total,
                    criterion
                ) => {

                    return (
                        total +
                        Number(
                            criterion.max_points || 0
                        )
                    );
                },
                0
            );


        /*
        |--------------------------------------------------------------------------
        | 18. INITIAL SCREENING POINTS
        |--------------------------------------------------------------------------
        */

        const initialScreeningPoints =
            Number(
                applicant.initial_screening_points ||
                0
            );


        /*
        |--------------------------------------------------------------------------
        | 19. COMBINED TOTAL
        |--------------------------------------------------------------------------
        */

        const combinedTotal =
            initialScreeningPoints +
            assessmentTotal;


        /*
        |--------------------------------------------------------------------------
        | 20. COMMIT
        |--------------------------------------------------------------------------
        */

        await client.query(
            "COMMIT"
        );


        /*
        |--------------------------------------------------------------------------
        | 21. RETURN
        |--------------------------------------------------------------------------
        */

        return {

            applicant_id,

            job_applications_id:
                applicant.job_applications_id,

            vacancy_id:
                applicant.vacancy_id,

            position_id:
                applicant.position_id,

            position_title:
                applicant.actual_position_title ||
                applicant.position_title,

            category:
                applicant.category,

            salary_grade:
                applicant.salary_grade,

            assessment_type:
                assessmentType,

            initial_screening_points:
                initialScreeningPoints,

            assessment_scores:
                scoresResult.rows,

            assessment_total:
                assessmentTotal,

            maximum_assessment_score:
                maximumAssessmentScore,

            combined_total:
                combinedTotal
        };


    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        console.error(
            "Submit assessment error:",
            error
        );

        throw error;

    } finally {

        client.release();
    }
};