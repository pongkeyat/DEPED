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

const getAssessmentTypeFromCategory = (category) => {
    switch (normalize(category)) {
        case "TEACHING":
        case "TEACHING POSITIONS":
            return "TEACHING";

        case "RELATED TEACHING":
        case "RELATED-TEACHING":
        case "RELATED TEACHING POSITIONS":
        case "RELATED-TEACHING POSITIONS":
            return "RELATED_TEACHING";

        case "SCHOOL ADMINISTRATION":
        case "SCHOOL ADMINISTRATION POSITION":
        case "SCHOOL ADMINISTRATION POSITIONS":
            return "SCHOOL_ADMINISTRATION";

        case "NON-TEACHING":
        case "NON TEACHING":
        case "NON-TEACHING POSITIONS":
        case "NON TEACHING POSITIONS":
            return "NON_TEACHING";

        default:
            return "";
    }
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
    const isSchoolAdministration =
        normalize(applicant.category).includes(
            "SCHOOL ADMINISTRATION"
        );
    const experiencePoints = Number(
        applicant.experience_points || 0
    );
    const educationPoints = Number(
        applicant.education_points || 0
    );
    const trainingPoints = Number(
        applicant.training_points || 0
    );
    const normalizedExperiencePoints =
        isSchoolAdministration
            ? Math.min(experiencePoints, 10)
            : experiencePoints;

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
                isSchoolAdministration
                    ? educationPoints +
                      trainingPoints +
                      normalizedExperiencePoints
                    : Number(
                        applicant.initial_screening_points || 0
                    ),

            education: {

                value:
                    applicant.education_value,

                increment:
                    Number(
                        applicant.education_increment || 0
                    ),

                points:
                    educationPoints
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
                    trainingPoints
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
                    normalizedExperiencePoints
            }
        }
    };
};


/*
|--------------------------------------------------------------------------
| GET ASSESSMENT CRITERIA BY ASSESSMENT TYPE
|--------------------------------------------------------------------------
|
| TEACHING
| RELATED_TEACHING
| SCHOOL_ADMINISTRATION
| NON_TEACHING
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
| SUBMIT ASSESSMENT
|--------------------------------------------------------------------------
*/

export const submitAssessment = async (
    data
) => {

    const {
        applicant_id,
        scores,
        scored_by
    } = data;

    const client =
        await pool.connect();

    try {

        await client.query(
            "BEGIN"
        );


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

        const applicantResult =
            await client.query(
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

                    ins.initial_screening_points,

                    ins.education_points,

                    ins.training_points,

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
        | 4. DETERMINE ASSESSMENT TYPE
        |--------------------------------------------------------------------------
        */

        const category =
            normalize(
                applicant.category
            );


        let assessmentType = "";


        /*
        |--------------------------------------------------------------------------
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
        |--------------------------------------------------------------------------
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
        |--------------------------------------------------------------------------
        | SCHOOL ADMINISTRATION
        |--------------------------------------------------------------------------
        */

        else if (
            category === "SCHOOL ADMINISTRATION" ||
            category === "SCHOOL ADMINISTRATION POSITIONS" ||
            category === "SCHOOL ADMINISTRATION POSITION"
        ) {

            assessmentType =
                "SCHOOL_ADMINISTRATION";
        }


        /*
        |--------------------------------------------------------------------------
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
        | 5. VALIDATE ASSESSMENT TYPE
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
        | 6. GET CRITERIA
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
        | 7. CHECK CRITERIA
        |--------------------------------------------------------------------------
        */

        if (
            criteriaRows.length === 0
        ) {

            throw new Error(
                "NO_ASSESSMENT_CRITERIA_FOUND"
            );
        }


        /*
        |--------------------------------------------------------------------------
        | 8. RELATED TEACHING /
        |    SCHOOL ADMINISTRATION
        |    MUST HAVE 8 CRITERIA
        |--------------------------------------------------------------------------
        */

        const requiresEightCriteria =
            assessmentType === "RELATED_TEACHING" ||
            assessmentType === "SCHOOL_ADMINISTRATION";


        if (requiresEightCriteria) {

            const requiredCriteria = [

                "EDUCATION",

                "TRAINING",

                "EXPERIENCE",

                "PERFORMANCE",

                "OUTSTANDING ACCOMPLISHMENTS",

                "APPLICATION OF EDUCATION",

                "APPLICATION OF LEARNING & DEVELOPMENT",

                "POTENTIAL"

            ];


            const existingCriteriaNames =
                criteriaRows.map(
                    criterion =>
                        normalize(
                            criterion.criterion_name
                        )
                );


            const missingCriteria =
                requiredCriteria.filter(
                    required =>
                        !existingCriteriaNames.includes(
                            required
                        )
                );


            if (
                missingCriteria.length > 0
            ) {

                console.error(
                    "INCOMPLETE ASSESSMENT CRITERIA",
                    {
                        assessmentType,

                        missingCriteria,

                        existingCriteria:
                            existingCriteriaNames
                    }
                );


                throw new Error(
                    assessmentType ===
                    "RELATED_TEACHING"

                        ? "INCOMPLETE_RELATED_TEACHING_CRITERIA"

                        : "INCOMPLETE_SCHOOL_ADMINISTRATION_CRITERIA"
                );
            }
        }


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
        | 10. PREVENT DUPLICATES
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


            if (
                !Number.isInteger(
                    criterionId
                )
            ) {

                throw new Error(
                    "INVALID_ASSESSMENT_CRITERIA_ID"
                );
            }


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
            | CHECK CRITERION
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

                                    type:
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
            | CRITERION NAME
            |--------------------------------------------------------------------------
            */

            const criterionName =
                normalize(
                    criterion.criterion_name
                );


            let finalScore = 0;


            /*
            |--------------------------------------------------------------------------
            | 12. RELATED TEACHING /
            |     SCHOOL ADMINISTRATION ETE
            |--------------------------------------------------------------------------
            |
            | Education, Training and Experience
            | come from initial_screening.
            |
            | Frontend cannot change these values.
            |
            |--------------------------------------------------------------------------
            */

            const isETE =
                (
                    assessmentType ===
                        "RELATED_TEACHING" ||

                    assessmentType ===
                        "SCHOOL_ADMINISTRATION"
                ) &&

                [
                    "EDUCATION",
                    "TRAINING",
                    "EXPERIENCE"
                ].includes(
                    criterionName
                );


            if (
                isETE
            ) {

                /*
                |--------------------------------------------------------------------------
                | EDUCATION
                |--------------------------------------------------------------------------
                */

                if (
                    criterionName ===
                    "EDUCATION"
                ) {

                    finalScore =
                        Number(
                            applicant.education_points ||
                            0
                        );
                }


                /*
                |--------------------------------------------------------------------------
                | TRAINING
                |--------------------------------------------------------------------------
                */

                else if (
                    criterionName ===
                    "TRAINING"
                ) {

                    finalScore =
                        Number(
                            applicant.training_points ||
                            0
                        );
                }


                /*
                |--------------------------------------------------------------------------
                | EXPERIENCE
                |--------------------------------------------------------------------------
                */

                else if (
                    criterionName ===
                    "EXPERIENCE"
                ) {

                    finalScore =
                        Number(
                            applicant.experience_points ||
                            0
                        );

                    if (
                        assessmentType ===
                        "SCHOOL_ADMINISTRATION"
                    ) {
                        finalScore =
                            Math.min(
                                finalScore,
                                10
                            );
                    }
                }

            }


            /*
            |--------------------------------------------------------------------------
            | 13. MANUAL CRITERION
            |--------------------------------------------------------------------------
            */

            else if (
                criterion.is_manual === true
            ) {

                if (
                    score === null ||
                    score === undefined ||
                    String(score).trim() === ""
                ) {

                    throw new Error(
                        `INVALID_SCORE_${criterion.criterion_name}`
                    );
                }


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
            | 14. OPTION-BASED CRITERION
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

                    throw new Error(
                        "INVALID_ASSESSMENT_OPTION"
                    );
                }


                finalScore =
                    Number(
                        optionResult.rows[0]
                            .points || 0
                    );


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
            | 15. VALIDATE MAXIMUM SCORE
            |--------------------------------------------------------------------------
            */

            const maxPoints =
                Number(
                    criterion.max_points
                );


            if (
                Number.isNaN(
                    maxPoints
                ) ||

                maxPoints < 0 ||

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
            | 16. SAVE SCORE
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

                    isETE
                        ? null
                        : (
                            assessment_option_id ||
                            null
                        ),

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
        | 17. REQUIRE ALL CRITERIA
        |--------------------------------------------------------------------------
        */

        const requiredCriteriaIds =
            criteriaRows.map(
                criterion =>
                    Number(
                        criterion.assessment_criteria_id
                    )
            );


        const missingCriteriaIds =
            requiredCriteriaIds.filter(
                id =>
                    !submittedCriteriaIds.has(
                        id
                    )
            );


        if (
            missingCriteriaIds.length > 0
        ) {

            console.error(
                "Missing assessment criteria",
                {
                    applicant_id,

                    assessmentType,

                    missingCriteriaIds
                }
            );


            throw new Error(
                "ALL_ASSESSMENT_CRITERIA_REQUIRED"
            );
        }


        /*
        |--------------------------------------------------------------------------
        | 18. GET SAVED SCORES
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
        | 19. CALCULATE ASSESSMENT TOTAL
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
        | 20. CALCULATE MAXIMUM
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
        | 21. RELATED TEACHING /
        |     SCHOOL ADMINISTRATION
        |     MUST BE 100 POINTS
        |--------------------------------------------------------------------------
        */

        const requires100PointAssessment =
            assessmentType ===
                "RELATED_TEACHING" ||

            assessmentType ===
                "SCHOOL_ADMINISTRATION";


        if (
            requires100PointAssessment &&

            maximumAssessmentScore !==
                100
        ) {

            console.error(
                "ASSESSMENT MAXIMUM IS NOT 100",
                {
                    assessmentType,

                    maximumAssessmentScore,

                    criteria:
                        criteriaRows.map(
                            criterion => ({
                                name:
                                    criterion.criterion_name,

                                max:
                                    criterion.max_points
                            })
                        )
                }
            );


            throw new Error(

                assessmentType ===
                "RELATED_TEACHING"

                    ? "INVALID_RELATED_TEACHING_MAXIMUM"

                    : "INVALID_SCHOOL_ADMINISTRATION_MAXIMUM"

            );
        }


        /*
        |--------------------------------------------------------------------------
        | 22. INITIAL SCREENING POINTS
        |--------------------------------------------------------------------------
        */

        const initialScreeningPoints =
            Number(
                applicant.initial_screening_points ||
                0
            );


        /*
        |--------------------------------------------------------------------------
        | 23. COMBINED TOTAL
        |--------------------------------------------------------------------------
        |
        | RELATED TEACHING:
        | SCHOOL ADMINISTRATION:
        |
        | Education + Training + Experience
        | are already included in the 100-point
        | assessment.
        |
        | Therefore:
        |
        | combinedTotal = assessmentTotal
        |
        | Do NOT add initial_screening_points again.
        |
        |--------------------------------------------------------------------------
        */

        const is100PointIntegratedAssessment =
            assessmentType ===
                "RELATED_TEACHING" ||

            assessmentType ===
                "SCHOOL_ADMINISTRATION";


        const combinedTotal =
            is100PointIntegratedAssessment

                ? assessmentTotal

                : initialScreeningPoints +
                  assessmentTotal;


        /*
        |--------------------------------------------------------------------------
        | 24. COMMIT
        |--------------------------------------------------------------------------
        */

        await client.query(
            "COMMIT"
        );


        /*
        |--------------------------------------------------------------------------
        | 25. RETURN
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





export const submitPanelistAssessment = async ({
    applicant_id,
    assessment_session_id,
    scored_by_user_id,
    scores,
}) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // ========================================================
        // 1. BASIC VALIDATION
        // ========================================================

        if (!applicant_id) {
            throw new Error("APPLICANT_ID_REQUIRED");
        }

        if (!assessment_session_id) {
            throw new Error("ASSESSMENT_SESSION_REQUIRED");
        }

        if (
            !scored_by_user_id ||
            !Number.isInteger(
                Number(scored_by_user_id)
            )
        ) {
            throw new Error("PANELIST_ID_REQUIRED");
        }

        if (
            !Array.isArray(scores) ||
            scores.length === 0
        ) {
            throw new Error("INVALID_SCORES");
        }

        const userId =
            Number(scored_by_user_id);

        const sessionId =
            String(
                assessment_session_id
            ).trim();

        // ========================================================
        // 2. VERIFY PANELIST IS ASSIGNED TO THIS SESSION
        // ========================================================

        const panelistResult =
            await client.query(
                `
                SELECT
                    asp.id,
                    asp.assessment_session_id,
                    asp.user_id,
                    u.first_name,
                    u.last_name,
                    u.role,
                    u.is_archived
                FROM assessment_session_panel_members asp
                INNER JOIN users u
                    ON u.id = asp.user_id
                WHERE asp.assessment_session_id = $1
                  AND asp.user_id = $2
                  AND LOWER(TRIM(u.role)) = 'hrmpsb'
                  AND COALESCE(
                        u.is_archived,
                        false
                      ) = false
                LIMIT 1
                `,
                [
                    sessionId,
                    userId,
                ]
            );

        if (
            panelistResult.rows.length === 0
        ) {
            throw new Error(
                "PANELIST_NOT_ASSIGNED"
            );
        }

        const panelist =
            panelistResult.rows[0];

        console.log(
            `Panelist verified: ${panelist.first_name} ${panelist.last_name} (${userId})`
        );

        // ========================================================
        // 3. VERIFY ASSESSMENT SESSION EXISTS
        // ========================================================

        const sessionResult =
            await client.query(
                `
                SELECT
                    assessment_session_id
                FROM assessment_sessions
                WHERE assessment_session_id = $1
                LIMIT 1
                `,
                [
                    sessionId,
                ]
            );

        if (
            sessionResult.rows.length === 0
        ) {
            throw new Error(
                "ASSESSMENT_SESSION_NOT_FOUND"
            );
        }

        // ========================================================
        // 4. VERIFY APPLICANT BELONGS TO THIS SESSION
        // ========================================================

        const applicantSessionResult =
            await client.query(
                `
                SELECT
                    interview_sessions.assessment_session_id,
                    interview_sessions.job_applications_id,
                    applicant_information.applicant_id
                FROM interview_sessions
                INNER JOIN applicant_information
                    ON applicant_information.job_applications_id =
                       interview_sessions.job_applications_id
                WHERE interview_sessions.assessment_session_id = $1
                  AND applicant_information.applicant_id = $2
                LIMIT 1
                `,
                [
                    sessionId,
                    applicant_id,
                ]
            );

        if (
            applicantSessionResult.rows.length === 0
        ) {
            throw new Error(
                "APPLICANT_NOT_IN_SESSION"
            );
        }

        // ========================================================
        // 5. GET APPLICANT CATEGORY
        // ========================================================
        //
        // IMPORTANT:
        // The category comes from the applicant's position.
        //
        // applicant
        //    ↓
        // job application
        //    ↓
        // vacancy
        //    ↓
        // position
        //    ↓
        // category
        //
        // ========================================================

        const applicantCategoryResult =
            await client.query(
                `
                SELECT
                    ai.applicant_id,
                    ai.job_applications_id,

                    ja.vacancy_id,

                    v.position_id,
                    v.position_title AS vacancy_position_title,

                    p.position_title AS actual_position_title,
                    p.category,
                    p.salary_grade,
                    screening.screening_id,
                    screening.education_points,
                    screening.training_points,
                    screening.experience_points

                FROM applicant_information ai

                INNER JOIN job_applications ja
                    ON ja.job_applications_id =
                       ai.job_applications_id

                INNER JOIN vacancies v
                    ON v.vacancy_id =
                       ja.vacancy_id

                INNER JOIN positions p
                    ON p.position_id =
                       v.position_id

                LEFT JOIN LATERAL (
                    SELECT
                        ins.screening_id,
                        ins.education_points,
                        ins.training_points,
                        ins.experience_points
                    FROM initial_screening ins
                    WHERE ins.job_applications_id =
                          ai.job_applications_id
                      AND UPPER(TRIM(ins.overall_result)) =
                          'QUALIFIED'
                    ORDER BY ins.screening_id DESC
                    LIMIT 1
                ) screening ON TRUE

                WHERE ai.applicant_id = $1

                LIMIT 1
                `,
                [
                    applicant_id,
                ]
            );

        if (
            applicantCategoryResult.rows.length === 0
        ) {
            throw new Error(
                "APPLICANT_CATEGORY_NOT_FOUND"
            );
        }

        const applicant =
            applicantCategoryResult.rows[0];

        const rawCategory =
            applicant.category || "";

        // ========================================================
        // 6. DETERMINE ASSESSMENT TYPE
        // ========================================================

        const assessmentType =
            getAssessmentTypeFromCategory(
                rawCategory
            );

        console.log(
            "=============================================="
        );

        console.log(
            "PANELIST ASSESSMENT CATEGORY"
        );

        console.log(
            "Applicant:",
            applicant_id
        );

        console.log(
            "Position:",
            applicant.actual_position_title ||
                applicant.vacancy_position_title
        );

        console.log(
            "Raw Category:",
            rawCategory
        );

        console.log(
            "Assessment Type:",
            assessmentType
        );

        console.log(
            "=============================================="
        );

        // ========================================================
        // 7. DO NOT SILENTLY DEFAULT TO NON-TEACHING
        // ========================================================

        if (!assessmentType) {
            console.error(
                "UNKNOWN APPLICANT CATEGORY",
                {
                    applicant_id,
                    position_id:
                        applicant.position_id,
                    position_title:
                        applicant.actual_position_title ||
                        applicant.vacancy_position_title,
                    rawCategory,
                }
            );

            throw new Error(
                `UNKNOWN_APPLICANT_CATEGORY: ${rawCategory}`
            );
        }

        // ========================================================
        // 8. PREVENT DUPLICATE CRITERIA IN SUBMISSION
        // ========================================================

        const submittedCriteriaIds =
            new Set();

        for (const item of scores) {
            const criterionId =
                Number(
                    item.assessment_criteria_id
                );

            if (
                !Number.isInteger(
                    criterionId
                ) ||
                criterionId <= 0
            ) {
                throw new Error(
                    "INVALID_ASSESSMENT_CRITERIA_ID"
                );
            }

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
        }

        // ========================================================
        // 9. GET CRITERIA FOR THE CORRECT CATEGORY
        // ========================================================

        const requiredCriteriaResult =
            await client.query(
                `
                SELECT
                    assessment_criteria_id,
                    criterion_name,
                    max_points,
                    is_manual,
                    assessment_type,
                    is_active
                FROM assessment_criteria
                WHERE is_active = TRUE
                  AND UPPER(
                        TRIM(assessment_type)
                      ) = $1
                ORDER BY
                    assessment_criteria_id ASC
                `,
                [
                    assessmentType,
                ]
            );

        const criteriaRows =
            requiredCriteriaResult.rows;

        const requiredCriteriaIds =
            criteriaRows.map(
                (row) =>
                    Number(
                        row.assessment_criteria_id
                    )
            );

        if (
            requiredCriteriaIds.length === 0
        ) {
            throw new Error(
                `NO_ACTIVE_CRITERIA_FOR_${assessmentType}`
            );
        }

        console.log(
            `Required criteria for ${assessmentType}:`,
            requiredCriteriaIds
        );

        console.log(
            "Required criteria details:",
            criteriaRows.map(
                (row) => ({
                    id: Number(
                        row.assessment_criteria_id
                    ),
                    name: row.criterion_name,
                    max: Number(
                        row.max_points || 0
                    ),
                    type:
                        row.assessment_type,
                    manual:
                        Boolean(
                            row.is_manual
                        ),
                })
            )
        );

        // ========================================================
        // 10. MAKE SURE SUBMITTED CRITERIA BELONG TO THIS
        //     APPLICANT'S ASSESSMENT CATEGORY
        // ========================================================

        const requiredCriteriaSet =
            new Set(
                requiredCriteriaIds
            );

        for (
            const criterionId
            of submittedCriteriaIds
        ) {
            if (
                !requiredCriteriaSet.has(
                    criterionId
                )
            ) {
                console.error(
                    "INVALID CATEGORY CRITERION",
                    {
                        applicant_id,
                        assessmentType,
                        submittedCriterionId:
                            criterionId,
                        requiredCriteria:
                            requiredCriteriaIds,
                    }
                );

                throw new Error(
                    "ASSESSMENT_CRITERION_DOES_NOT_BELONG_TO_POSITION"
                );
            }
        }

        // ========================================================
        // 11. SAVE / UPDATE EACH PANELIST SCORE
        // ========================================================

        for (const item of scores) {
            const criterionId =
                Number(
                    item.assessment_criteria_id
                );

            const optionId =
                item.assessment_option_id
                    ? Number(
                        item.assessment_option_id
                    )
                    : null;

            let score =
                Number(item.score);

            const remarks =
                item.remarks !== undefined &&
                item.remarks !== null &&
                String(
                    item.remarks
                ).trim() !== ""
                    ? String(
                        item.remarks
                    ).trim()
                    : null;

            // ====================================================
            // GET CRITERION
            // ====================================================

            const criterionResult =
                await client.query(
                    `
                    SELECT
                        assessment_criteria_id,
                        criterion_name,
                        max_points,
                        is_manual,
                        assessment_type
                    FROM assessment_criteria
                    WHERE assessment_criteria_id = $1
                      AND is_active = TRUE
                    LIMIT 1
                    `,
                    [
                        criterionId,
                    ]
                );

            if (
                criterionResult.rows.length === 0
            ) {
                throw new Error(
                    `ASSESSMENT_CRITERIA_NOT_FOUND_${criterionId}`
                );
            }

            const criterion =
                criterionResult.rows[0];

            const criterionName =
                normalize(criterion.criterion_name);
            const isIntegratedScreeningCriterion =
                (
                    assessmentType === "RELATED_TEACHING" ||
                    assessmentType === "SCHOOL_ADMINISTRATION"
                ) &&
                (
                    criterionName === "EDUCATION" ||
                    criterionName === "TRAINING" ||
                    criterionName === "EXPERIENCE"
                );

            if (isIntegratedScreeningCriterion) {
                if (!applicant.screening_id) {
                    throw new Error(
                        "APPLICANT_INITIAL_SCREENING_NOT_FOUND"
                    );
                }

                const screeningScoreByCriterion = {
                    EDUCATION: applicant.education_points,
                    TRAINING: applicant.training_points,
                    EXPERIENCE: applicant.experience_points,
                };
                const screeningScore = Number(
                    screeningScoreByCriterion[criterionName] ?? 0
                );
                const expectedScore =
                    assessmentType === "SCHOOL_ADMINISTRATION" &&
                    criterionName === "EXPERIENCE"
                        ? Math.min(screeningScore, 10)
                        : screeningScore;

                if (
                    !Number.isFinite(expectedScore) ||
                    Math.abs(score - expectedScore) > 1e-9
                ) {
                    throw new Error(
                        `INVALID_INITIAL_SCREENING_SCORE_${criterionId}`
                    );
                }

                score = expectedScore;
            }

            // ====================================================
            // MAKE SURE CRITERION BELONGS TO ASSESSMENT TYPE
            // ====================================================

            const criterionAssessmentType =
                String(
                    criterion.assessment_type ||
                        ""
                )
                    .trim()
                    .toUpperCase();

            if (
                criterionAssessmentType !==
                assessmentType
            ) {
                console.error(
                    "CRITERION CATEGORY MISMATCH",
                    {
                        applicant_id,
                        assessmentType,
                        criterionId,
                        criterionAssessmentType,
                        criterionName:
                            criterion.criterion_name,
                    }
                );

                throw new Error(
                    `CRITERION_CATEGORY_MISMATCH_${criterionId}`
                );
            }

            // ====================================================
            // VALIDATE SCORE
            // ====================================================

            if (
                !Number.isFinite(score)
            ) {
                throw new Error(
                    `INVALID_SCORE_FOR_CRITERION_${criterionId}`
                );
            }

            const maxPoints =
                Number(
                    criterion.max_points
                );

            if (
                score < 0 ||
                score > maxPoints
            ) {
                throw new Error(
                    `INVALID_SCORE_FOR_CRITERION_${criterionId}`
                );
            }

            // ====================================================
            // VALIDATE OPTION
            // ====================================================

            if (
                !criterion.is_manual &&
                !isIntegratedScreeningCriterion
            ) {
                if (!optionId) {
                    throw new Error(
                        `ASSESSMENT_OPTION_REQUIRED_${criterionId}`
                    );
                }

                const optionResult =
                    await client.query(
                        `
                        SELECT
                            assessment_option_id,
                            assessment_criteria_id,
                            option_label,
                            points,
                            is_active
                        FROM assessment_options
                        WHERE assessment_option_id = $1
                          AND assessment_criteria_id = $2
                          AND is_active = TRUE
                        LIMIT 1
                        `,
                        [
                            optionId,
                            criterionId,
                        ]
                    );

                if (
                    optionResult.rows.length === 0
                ) {
                    throw new Error(
                        `INVALID_ASSESSMENT_OPTION_${criterionId}`
                    );
                }

                const option =
                    optionResult.rows[0];

                const optionPoints =
                    Number(
                        option.points
                    );

                if (
                    optionPoints !==
                    score
                ) {
                    throw new Error(
                        `OPTION_SCORE_MISMATCH_${criterionId}`
                    );
                }
            }

            // ====================================================
            // INSERT / UPDATE
            // ====================================================
            //
            // Existing scores are NOT duplicated.
            //
            // Same:
            // applicant
            // criterion
            // session
            // panelist
            //
            // = UPDATE
            //
            // ====================================================

            await client.query(
                `
                INSERT INTO assessment_scores (
                    applicant_id,
                    assessment_criteria_id,
                    assessment_option_id,
                    score,
                    remarks,
                    scored_by,
                    scored_by_user_id,
                    assessment_session_id
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8
                )
                ON CONFLICT (
                    applicant_id,
                    assessment_criteria_id,
                    assessment_session_id,
                    scored_by_user_id
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

                    optionId,

                    score,

                    remarks,

                    `${panelist.first_name || ""} ${
                        panelist.last_name || ""
                    }`.trim() ||
                        `USER-${userId}`,

                    userId,

                    sessionId,
                ]
            );
        }

        // ========================================================
        // 12. GET ALL ASSIGNED PANELISTS
        // ========================================================

        const panelistsResult =
            await client.query(
                `
                SELECT
                    asp.user_id,
                    u.first_name,
                    u.last_name
                FROM assessment_session_panel_members asp
                INNER JOIN users u
                    ON u.id = asp.user_id
                WHERE asp.assessment_session_id = $1
                  AND COALESCE(
                        u.is_archived,
                        false
                      ) = false
                ORDER BY
                    asp.user_id
                `,
                [
                    sessionId,
                ]
            );

        const panelists =
            panelistsResult.rows.map(
                (row) =>
                    Number(
                        row.user_id
                    )
            );

        const totalPanelists =
            panelists.length;

        // ========================================================
        // 13. REQUIRE AT LEAST TWO PANELISTS
        // ========================================================

        if (
            totalPanelists < 2
        ) {
            throw new Error(
                "MINIMUM_TWO_PANELISTS_REQUIRED"
            );
        }

        console.log(
            `Assessment session ${sessionId} has ${totalPanelists} panelists`
        );

        // ========================================================
        // 14. CHECK CURRENT PANELIST COMPLETION
        // ========================================================

        const thisPanelistCompletionResult =
            await client.query(
                `
                SELECT
                    COUNT(
                        DISTINCT assessment_criteria_id
                    ) AS criteria_count

                FROM assessment_scores

                WHERE applicant_id = $1
                  AND assessment_session_id = $2
                  AND scored_by_user_id = $3
                  AND assessment_criteria_id =
                      ANY($4::integer[])
                `,
                [
                    applicant_id,

                    sessionId,

                    userId,

                    requiredCriteriaIds,
                ]
            );

        const thisPanelistCriteriaCount =
            Number(
                thisPanelistCompletionResult
                    .rows[0]
                    ?.criteria_count || 0
            );

        const panelistCompleted =
            thisPanelistCriteriaCount >=
            requiredCriteriaIds.length;

        console.log(
            `Panelist ${userId}: ${thisPanelistCriteriaCount}/${requiredCriteriaIds.length} criteria`
        );

        // ========================================================
        // 15. CHECK ALL PANELISTS
        // ========================================================

        const panelistCompletionResult =
            await client.query(
                `
                SELECT
                    scored_by_user_id,

                    COUNT(
                        DISTINCT assessment_criteria_id
                    ) AS criteria_count

                FROM assessment_scores

                WHERE applicant_id = $1
                  AND assessment_session_id = $2

                  AND scored_by_user_id =
                      ANY($3::integer[])

                  AND assessment_criteria_id =
                      ANY($4::integer[])

                GROUP BY
                    scored_by_user_id
                `,
                [
                    applicant_id,

                    sessionId,

                    panelists,

                    requiredCriteriaIds,
                ]
            );

        const completedPanelists =
            panelistCompletionResult.rows
                .filter(
                    (row) =>
                        Number(
                            row.criteria_count
                        ) >=
                        requiredCriteriaIds.length
                )
                .map(
                    (row) =>
                        Number(
                            row.scored_by_user_id
                        )
                );

        const submittedCount =
            completedPanelists.length;

        const allCompleted =
            submittedCount ===
            totalPanelists;

        console.log(
            `Panelist completion: ${submittedCount}/${totalPanelists}`
        );

        console.log(
            "Completed panelists:",
            completedPanelists
        );

        // ========================================================
        // 16. FINAL AVERAGE
        // ========================================================

        let finalAverage = null;

        if (allCompleted) {
            // ====================================================
            // IMPORTANT
            // ====================================================
            //
            // Average each criterion across all panelists first.
            //
            // Example:
            //
            // Panelist 1:
            // Education = 10
            // Training = 35
            // Experience = 25
            //
            // Panelist 2:
            // Education = 10
            // Training = 35
            // Experience = 25
            //
            // Criterion averages:
            //
            // Education  = AVG(10,10) = 10
            // Training   = AVG(35,35) = 35
            // Experience = AVG(25,25) = 25
            //
            // Final:
            //
            // 10 + 35 + 25 = 70
            //
            // NOT:
            //
            // 70 + 70 = 140
            //
            // ====================================================

            const averageResult =
                await client.query(
                    `
                    SELECT
                        SUM(
                            criterion_average
                        ) AS final_average

                    FROM (
                        SELECT
                            assessment_criteria_id,

                            AVG(score)
                                AS criterion_average

                        FROM assessment_scores

                        WHERE applicant_id = $1
                          AND assessment_session_id = $2

                          AND scored_by_user_id =
                              ANY($3::integer[])

                          AND assessment_criteria_id =
                              ANY($4::integer[])

                        GROUP BY
                            assessment_criteria_id

                    ) averaged_criteria
                    `,
                    [
                        applicant_id,

                        sessionId,

                        panelists,

                        requiredCriteriaIds,
                    ]
                );

            finalAverage =
                Number(
                    Number(
                        averageResult
                            .rows[0]
                            ?.final_average || 0
                    ).toFixed(2)
                );

            console.log(
                "=============================================="
            );

            console.log(
                `FINAL AVERAGE FOR APPLICANT ${applicant_id}:`,
                finalAverage
            );

            console.log(
                "=============================================="
            );

            // ====================================================
            // 17. MARK APPLICANT AS READY FOR RANKING
            // ====================================================
            //
            // Only after EVERY assigned panelist has completed.
            //
            // ====================================================

            const rankUpdateResult =
                await client.query(
                    `
                    UPDATE hr_remarks_final_notes

                    SET
                        application_status = 'rank',
                        updated_at =
                            CURRENT_TIMESTAMP

                    WHERE applicant_id = $1

                    RETURNING
                        applicant_id,
                        application_status
                    `,
                    [
                        applicant_id,
                    ]
                );

            console.log(
                "Ranking status update:",
                rankUpdateResult.rows
            );
        }

        // ========================================================
        // 18. COMMIT
        // ========================================================

        await client.query(
            "COMMIT"
        );

        // ========================================================
        // 19. RETURN
        // ========================================================

        return {
            success: true,

            applicant_id,

            assessment_session_id:
                sessionId,

            panelist_user_id:
                userId,

            assessment_type:
                assessmentType,

            panelist_completed:
                panelistCompleted,

            total_panelists:
                totalPanelists,

            submitted_panelists:
                submittedCount,

            completed_panelists:
                completedPanelists,

            remaining_panelists:
                totalPanelists -
                submittedCount,

            finalized:
                allCompleted,

            final_average:
                finalAverage,
        };
    } catch (error) {
        // ========================================================
        // ROLLBACK
        // ========================================================

        await client.query(
            "ROLLBACK"
        );

        console.error(
            "submitPanelistAssessment ERROR:",
            error
        );

        throw error;
    } finally {
        client.release();
    }
};