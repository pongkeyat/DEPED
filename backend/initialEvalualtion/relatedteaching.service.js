import pool from "../config/db.js";

/**
 * ============================================================
 * RELATED-TEACHING HELPERS
 * ============================================================
 */

/**
 * Normalize text for comparisons.
 */
const normalizeText = (value) => {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();
};


/**
 * ============================================================
 * GET VACANCY MINIMUM QUALIFICATION REQUIREMENTS
 * ============================================================
 *
 * Gets the minimum QS entered when the vacancy was created.
 */
export const getRelatedTeachingVacancyRequirements = async (
    client,
    vacancyId
) => {

    const result = await client.query(
        `
        SELECT
            v.vacancy_id,
            v.position_id,
            v.position_title,
            v.salary_grade,

            q.education_requirement,
            q.training_requirement,
            q.experience_requirement,
            q.eligibility_requirement

        FROM vacancies v

        LEFT JOIN vacancy_specific_qualifications q
            ON q.vacancy_id = v.vacancy_id

        WHERE v.vacancy_id = $1
        LIMIT 1
        `,
        [vacancyId]
    );

    if (result.rows.length === 0) {
        throw new Error("VACANCY_NOT_FOUND");
    }

    const vacancy = result.rows[0];

    if (!vacancy.education_requirement) {
        throw new Error("EDUCATION_REQUIREMENT_NOT_FOUND");
    }

    return vacancy;
};


/**
 * ============================================================
 * EDUCATION REQUIREMENT → INCREMENT LEVEL
 * ============================================================
 *
 * Converts the vacancy's minimum education requirement
 * into the corresponding Related-Teaching education level.
 */
const getMinimumEducationIncrement = async (
    client,
    requirement
) => {

    const value = normalizeText(requirement);

    if (
        !value ||
        value.includes("NONE REQUIRED") ||
        value.includes("NOT REQUIRED")
    ) {
        return 1;
    }

    let educationLevel = null;

    // ----------------------------------------------------------
    // DOCTORATE
    // ----------------------------------------------------------

    if (value.includes("DOCTORATE")) {

        const unitMatch = value.match(
            /(\d+)\s*(?:UNITS?|UNIT)/
        );

        if (unitMatch) {

            const units = Number(unitMatch[1]);

            const allowedUnits = [
                3, 6, 9, 12, 15, 18, 21, 24
            ];

            const validUnits = allowedUnits
                .filter(unit => unit <= units)
                .sort((a, b) => b - a)[0];

            if (validUnits) {
                educationLevel = `DOCTORATE ${validUnits} UNITS`;
            }
        }

        if (
            value.includes("COMPLETE ACADEMIC") ||
            value.includes("CAR")
        ) {
            educationLevel = "DOCTORATE CAR";
        }

        if (
            value.includes("DOCTORATE DEGREE") ||
            value === "DOCTORATE"
        ) {
            educationLevel = "DOCTORATE DEGREE";
        }
    }

    // ----------------------------------------------------------
    // MASTER'S
    // ----------------------------------------------------------

    if (!educationLevel && value.includes("MASTER")) {

        const unitMatch = value.match(
            /(\d+)\s*(?:UNITS?|UNIT)/
        );

        if (unitMatch) {

            const units = Number(unitMatch[1]);

            const allowedUnits = [
                6, 9, 12, 15, 18, 21,
                24, 27, 30, 33, 36,
                39, 42
            ];

            const validUnits = allowedUnits
                .filter(unit => unit <= units)
                .sort((a, b) => b - a)[0];

            if (validUnits) {
                educationLevel = `MASTER'S ${validUnits} UNITS`;
            }
        }

        if (
            value.includes("COMPLETE ACADEMIC") ||
            value.includes("CAR")
        ) {
            educationLevel = "MASTER'S CAR";
        }

        if (
            !educationLevel &&
            (
                value.includes("MASTER'S DEGREE") ||
                value.includes("MASTERS DEGREE") ||
                value === "MASTER'S"
            )
        ) {
            educationLevel = "MASTER'S DEGREE";
        }
    }

    // ----------------------------------------------------------
    // BACHELOR'S
    // ----------------------------------------------------------

    if (
        !educationLevel &&
        (
            value.includes("BACHELOR") ||
            value.includes("BACHELOR'S")
        )
    ) {
        educationLevel = "BACHELOR'S DEGREE";
    }

    // ----------------------------------------------------------
    // COLLEGE
    // ----------------------------------------------------------

    if (
        !educationLevel &&
        value.includes("2 YEARS")
    ) {
        educationLevel = "2 YEARS COLLEGE";
    }

    // ----------------------------------------------------------
    // HIGH SCHOOL
    // ----------------------------------------------------------

    if (
        !educationLevel &&
        (
            value.includes("SENIOR HIGH") ||
            value.includes("HIGH SCHOOL")
        )
    ) {
        educationLevel = "HIGH SCHOOL GRADUATE";
    }

    if (!educationLevel) {
        throw new Error(
            `UNSUPPORTED_EDUCATION_REQUIREMENT: ${requirement}`
        );
    }

    const ruleResult = await client.query(
        `
        SELECT
            education_level,
            increment_level,
            description
        FROM related_teaching_education_increment_rules
        WHERE UPPER(education_level) = $1
        LIMIT 1
        `,
        [educationLevel]
    );

    if (ruleResult.rows.length === 0) {
        throw new Error(
            `EDUCATION_RULE_NOT_FOUND: ${educationLevel}`
        );
    }

    return Number(
        ruleResult.rows[0].increment_level
    );
};


/**
 * ============================================================
 * TRAINING REQUIREMENT → INCREMENT LEVEL
 * ============================================================
 */
const getMinimumTrainingIncrement = async (
    client,
    requirement
) => {

    const value = normalizeText(requirement);

    if (
        !value ||
        value.includes("NONE REQUIRED") ||
        value.includes("NOT REQUIRED")
    ) {
        return 1;
    }

    const match = value.match(
        /(\d+(?:\.\d+)?)\s*(?:HOURS?|HOUR)/
    );

    if (!match) {
        return 1;
    }

    const minimumHours = Number(match[1]);

    const ruleResult = await client.query(
        `
        SELECT
            increment_level
        FROM related_teaching_training_increment_rules
        WHERE hours_from <= $1
          AND (
              hours_to IS NULL
              OR hours_to > $1
          )
        ORDER BY increment_level DESC
        LIMIT 1
        `,
        [minimumHours]
    );

    if (ruleResult.rows.length === 0) {
        return 1;
    }

    return Number(
        ruleResult.rows[0].increment_level
    );
};


/**
 * ============================================================
 * EXPERIENCE REQUIREMENT → INCREMENT LEVEL
 * ============================================================
 */
const getMinimumExperienceIncrement = async (
    client,
    requirement
) => {

    const value = normalizeText(requirement);

    if (
        !value ||
        value.includes("NONE REQUIRED") ||
        value.includes("NOT REQUIRED")
    ) {
        return 1;
    }

    let totalMonths = 0;

    // ----------------------------------------------------------
    // YEARS
    // ----------------------------------------------------------

    const yearMatch = value.match(
        /(\d+(?:\.\d+)?)\s*(?:YEARS?|YEAR)/
    );

    if (yearMatch) {
        totalMonths +=
            Number(yearMatch[1]) * 12;
    }

    // ----------------------------------------------------------
    // MONTHS
    // ----------------------------------------------------------

    const monthMatch = value.match(
        /(\d+(?:\.\d+)?)\s*(?:MONTHS?|MONTH)/
    );

    if (monthMatch) {
        totalMonths +=
            Number(monthMatch[1]);
    }

    if (totalMonths === 0) {
        return 1;
    }

    const ruleResult = await client.query(
        `
        SELECT
            increment_level
        FROM related_teaching_experience_increment_rules
        WHERE months_from <= $1
          AND (
              months_to IS NULL
              OR months_to > $1
          )
        ORDER BY increment_level DESC
        LIMIT 1
        `,
        [totalMonths]
    );

    if (ruleResult.rows.length === 0) {
        return 1;
    }

    return Number(
        ruleResult.rows[0].increment_level
    );
};


/**
 * ============================================================
 * GET RELATED-TEACHING POINTS
 * ============================================================
 */
const getEducationPoints = async (
    client,
    increment
) => {

    const result = await client.query(
        `
        SELECT points
        FROM related_teaching_education_point_rules
        WHERE increment_from <= $1
          AND (
              increment_to IS NULL
              OR increment_to >= $1
          )
        ORDER BY increment_from DESC
        LIMIT 1
        `,
        [increment]
    );

    return result.rows.length > 0
        ? Number(result.rows[0].points || 0)
        : 0;
};


const getTrainingPoints = async (
    client,
    increment
) => {

    const result = await client.query(
        `
        SELECT points
        FROM related_teaching_training_point_rules
        WHERE increment_from <= $1
          AND (
              increment_to IS NULL
              OR increment_to >= $1
          )
        ORDER BY increment_from DESC
        LIMIT 1
        `,
        [increment]
    );

    return result.rows.length > 0
        ? Number(result.rows[0].points || 0)
        : 0;
};


const getExperiencePoints = async (
    client,
    increment
) => {

    const result = await client.query(
        `
        SELECT points
        FROM related_teaching_experience_point_rules
        WHERE increment_from <= $1
          AND (
              increment_to IS NULL
              OR increment_to >= $1
          )
        ORDER BY increment_from DESC
        LIMIT 1
        `,
        [increment]
    );

    return result.rows.length > 0
        ? Number(result.rows[0].points || 0)
        : 0;
};


/**
 * ============================================================
 * RELATED-TEACHING - EDUCATION
 * ============================================================
 *
 * Maximum = 10 points
 *
 * Applicant Education Level
 *          ↓
 * Applicant Increment Level
 *          ↓
 * Vacancy Minimum QS Level
 *          ↓
 * Increments Above Minimum
 *          ↓
 * Education Points
 */
export const calculateRelatedTeachingEducation = async (
    client,
    applicantId,
    minimumEducationIncrement
) => {

    const educationResult = await client.query(
        `
        SELECT
            education_id,
            education_level,
            school_name,
            degree_course,
            honors_awards,
            units
        FROM education
        WHERE applicant_id = $1
        ORDER BY education_id ASC
        `,
        [applicantId]
    );

    const educationList = educationResult.rows;

    if (educationList.length === 0) {

        return {
            value: null,
            applicantIncrement: 0,
            minimumIncrement: minimumEducationIncrement,
            incrementsAboveMinimum: 0,
            points: 0,
            educationLevel: null,
            units: null,
            qualified: false
        };
    }

    let highestIncrement = 0;
    let selectedEducation = null;

    // ----------------------------------------------------------
    // CHECK EACH EDUCATION RECORD
    // ----------------------------------------------------------

    for (const education of educationList) {

        let educationLevel =
            normalizeText(
                education.education_level
            );

        let incrementLevel = null;

        // ------------------------------------------------------
        // MASTER'S WITH UNITS
        // ------------------------------------------------------

        if (
            educationLevel === "MASTER'S DEGREE" ||
            educationLevel === "MASTERS DEGREE"
        ) {

            const units =
                Number(education.units);

            if (
                !Number.isNaN(units) &&
                units >= 6
            ) {

                const allowedUnits = [
                    6, 9, 12, 15, 18,
                    21, 24, 27, 30, 33,
                    36, 39, 42
                ];

                const matchedUnits =
                    allowedUnits
                        .filter(unit => unit <= units)
                        .sort((a, b) => b - a)[0];

                if (matchedUnits) {

                    const ruleResult =
                        await client.query(
                            `
                            SELECT increment_level
                            FROM related_teaching_education_increment_rules
                            WHERE UPPER(education_level) = $1
                            LIMIT 1
                            `,
                            [
                                `MASTER'S ${matchedUnits} UNITS`
                            ]
                        );

                    if (
                        ruleResult.rows.length > 0
                    ) {
                        incrementLevel =
                            Number(
                                ruleResult.rows[0]
                                    .increment_level
                            );
                    }
                }
            }

            // Master's degree itself
            if (incrementLevel === null) {

                const ruleResult =
                    await client.query(
                        `
                        SELECT increment_level
                        FROM related_teaching_education_increment_rules
                        WHERE UPPER(education_level)
                            = 'MASTER''S DEGREE'
                        LIMIT 1
                        `
                    );

                if (
                    ruleResult.rows.length > 0
                ) {
                    incrementLevel =
                        Number(
                            ruleResult.rows[0]
                                .increment_level
                        );
                }
            }
        }

        // ------------------------------------------------------
        // DOCTORATE
        // ------------------------------------------------------

        else if (
            educationLevel === "DOCTORATE DEGREE" ||
            educationLevel === "DOCTORATE"
        ) {

            const units =
                Number(education.units);

            if (
                !Number.isNaN(units) &&
                units >= 3
            ) {

                const allowedUnits = [
                    3, 6, 9, 12, 15, 18,
                    21, 24
                ];

                const matchedUnits =
                    allowedUnits
                        .filter(unit => unit <= units)
                        .sort((a, b) => b - a)[0];

                if (matchedUnits) {

                    const ruleResult =
                        await client.query(
                            `
                            SELECT increment_level
                            FROM related_teaching_education_increment_rules
                            WHERE UPPER(education_level) = $1
                            LIMIT 1
                            `,
                            [
                                `DOCTORATE ${matchedUnits} UNITS`
                            ]
                        );

                    if (
                        ruleResult.rows.length > 0
                    ) {
                        incrementLevel =
                            Number(
                                ruleResult.rows[0]
                                    .increment_level
                            );
                    }
                }
            }

            if (incrementLevel === null) {

                const ruleResult =
                    await client.query(
                        `
                        SELECT increment_level
                        FROM related_teaching_education_increment_rules
                        WHERE UPPER(education_level)
                            = 'DOCTORATE DEGREE'
                        LIMIT 1
                        `
                    );

                if (
                    ruleResult.rows.length > 0
                ) {
                    incrementLevel =
                        Number(
                            ruleResult.rows[0]
                                .increment_level
                        );
                }
            }
        }

        // ------------------------------------------------------
        // OTHER EDUCATION LEVELS
        // ------------------------------------------------------

        else {

            const ruleResult =
                await client.query(
                    `
                    SELECT increment_level
                    FROM related_teaching_education_increment_rules
                    WHERE UPPER(education_level) = $1
                    LIMIT 1
                    `,
                    [educationLevel]
                );

            if (
                ruleResult.rows.length > 0
            ) {
                incrementLevel =
                    Number(
                        ruleResult.rows[0]
                            .increment_level
                    );
            }
        }

        // ------------------------------------------------------
        // KEEP HIGHEST EDUCATION
        // ------------------------------------------------------

        if (
            incrementLevel !== null &&
            incrementLevel > highestIncrement
        ) {

            highestIncrement =
                incrementLevel;

            selectedEducation =
                education;
        }
    }

    if (
        !selectedEducation ||
        highestIncrement === 0
    ) {

        return {
            value: null,
            applicantIncrement: 0,
            minimumIncrement: minimumEducationIncrement,
            incrementsAboveMinimum: 0,
            points: 0,
            educationLevel: null,
            units: null,
            qualified: false
        };
    }

    // ----------------------------------------------------------
    // INCREMENTS ABOVE MINIMUM QS
    // ----------------------------------------------------------

    const incrementsAboveMinimum =
        Math.max(
            0,
            highestIncrement -
            minimumEducationIncrement
        );

    // ----------------------------------------------------------
    // POINTS
    // ----------------------------------------------------------

    const points =
        await getEducationPoints(
            client,
            incrementsAboveMinimum
        );

    return {

        value:
            selectedEducation.education_level,

        applicantIncrement:
            highestIncrement,

        minimumIncrement:
            minimumEducationIncrement,

        incrementsAboveMinimum,

        points:
            Math.min(points, 10),

        educationLevel:
            selectedEducation.education_level,

        units:
            selectedEducation.units ?? null,

        qualified:
            highestIncrement >=
            minimumEducationIncrement
    };
};


/**
 * ============================================================
 * RELATED-TEACHING - TRAINING
 * ============================================================
 *
 * Maximum = 10 points
 */
export const calculateRelatedTeachingTraining = async (
    client,
    applicantId,
    minimumTrainingIncrement
) => {

    const trainingResult =
        await client.query(
            `
            SELECT
                COALESCE(
                    SUM(
                        COALESCE(hours_attended, 0)
                    ),
                    0
                ) AS total_training_hours
            FROM relevant_trainings
            WHERE applicant_id = $1
            `,
            [applicantId]
        );

    const totalTrainingHours =
        Number(
            trainingResult.rows[0]
                ?.total_training_hours || 0
        );

    // ----------------------------------------------------------
    // APPLICANT TRAINING INCREMENT
    // ----------------------------------------------------------

    const incrementResult =
        await client.query(
            `
            SELECT
                increment_level,
                hours_from,
                hours_to,
                description
            FROM related_teaching_training_increment_rules
            WHERE hours_from <= $1
              AND (
                  hours_to IS NULL
                  OR hours_to > $1
              )
            ORDER BY increment_level DESC
            LIMIT 1
            `,
            [totalTrainingHours]
        );

    const applicantIncrement =
        incrementResult.rows.length > 0
            ? Number(
                incrementResult.rows[0]
                    .increment_level
            )
            : 1;

    // ----------------------------------------------------------
    // INCREMENTS ABOVE MINIMUM QS
    // ----------------------------------------------------------

    const incrementsAboveMinimum =
        Math.max(
            0,
            applicantIncrement -
            minimumTrainingIncrement
        );

    // ----------------------------------------------------------
    // POINTS
    // ----------------------------------------------------------

    const points =
        await getTrainingPoints(
            client,
            incrementsAboveMinimum
        );

    return {

        hours:
            totalTrainingHours,

        applicantIncrement,

        minimumIncrement:
            minimumTrainingIncrement,

        incrementsAboveMinimum,

        points:
            Math.min(points, 10),

        qualified:
            applicantIncrement >=
            minimumTrainingIncrement
    };
};


/**
 * ============================================================
 * RELATED-TEACHING - EXPERIENCE
 * ============================================================
 *
 * Maximum = 10 points
 */
export const calculateRelatedTeachingExperience = async (
    client,
    applicantId,
    minimumExperienceIncrement
) => {

    const experienceResult =
        await client.query(
            `
            SELECT
                work_experience_id,
                date_from,
                date_to,
                company_office,
                appointment_status,
                is_govt_service
            FROM work_experience
            WHERE applicant_id = $1
              AND date_from IS NOT NULL
            ORDER BY date_from ASC
            `,
            [applicantId]
        );

    const experienceList =
        experienceResult.rows;

    if (experienceList.length === 0) {

        return {
            months: 0,
            applicantIncrement: 1,
            minimumIncrement: minimumExperienceIncrement,
            incrementsAboveMinimum: 0,
            points: 0,
            records: [],
            mergedPeriods: [],
            qualified:
                1 >= minimumExperienceIncrement
        };
    }

    // ----------------------------------------------------------
    // PREPARE EXPERIENCE PERIODS
    // ----------------------------------------------------------

    const periods =
        experienceList
            .map(experience => {

                const start =
                    new Date(
                        experience.date_from
                    );

                const end =
                    experience.date_to
                        ? new Date(
                            experience.date_to
                        )
                        : new Date();

                return {

                    start,
                    end,

                    workExperienceId:
                        experience.work_experience_id,

                    companyOffice:
                        experience.company_office,

                    appointmentStatus:
                        experience.appointment_status,

                    isGovtService:
                        experience.is_govt_service
                };
            })
            .filter(period =>
                !Number.isNaN(
                    period.start.getTime()
                ) &&
                !Number.isNaN(
                    period.end.getTime()
                ) &&
                period.end >= period.start
            )
            .sort(
                (a, b) =>
                    a.start.getTime() -
                    b.start.getTime()
            );

    if (periods.length === 0) {

        return {
            months: 0,
            applicantIncrement: 1,
            minimumIncrement: minimumExperienceIncrement,
            incrementsAboveMinimum: 0,
            points: 0,
            records: experienceList,
            mergedPeriods: [],
            qualified:
                1 >= minimumExperienceIncrement
        };
    }

    // ----------------------------------------------------------
    // MERGE OVERLAPPING / CONTINUOUS PERIODS
    // ----------------------------------------------------------

    const mergedPeriods = [];

    for (const period of periods) {

        if (
            mergedPeriods.length === 0
        ) {

            mergedPeriods.push({
                start: period.start,
                end: period.end,
                records: [period]
            });

            continue;
        }

        const last =
            mergedPeriods[
                mergedPeriods.length - 1
            ];

        const dayAfterLast =
            new Date(last.end);

        dayAfterLast.setDate(
            dayAfterLast.getDate() + 1
        );

        if (
            period.start <=
            dayAfterLast
        ) {

            if (
                period.end >
                last.end
            ) {

                last.end =
                    period.end;
            }

            last.records.push(
                period
            );

        } else {

            mergedPeriods.push({
                start: period.start,
                end: period.end,
                records: [period]
            });
        }
    }

    // ----------------------------------------------------------
    // TOTAL EXPERIENCE DAYS
    // ----------------------------------------------------------

    let totalDays = 0;

    for (
        const period of mergedPeriods
    ) {

        const difference =
            period.end.getTime() -
            period.start.getTime();

        const days =
            Math.floor(
                difference /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            ) + 1;

        totalDays += days;
    }

    // ----------------------------------------------------------
    // CONVERT DAYS TO MONTHS
    // ----------------------------------------------------------

    const totalMonths =
        Math.floor(
            totalDays / 30.4375
        );

    // ----------------------------------------------------------
    // APPLICANT EXPERIENCE INCREMENT
    // ----------------------------------------------------------

    const incrementResult =
        await client.query(
            `
            SELECT
                increment_level,
                months_from,
                months_to,
                description
            FROM related_teaching_experience_increment_rules
            WHERE months_from <= $1
              AND (
                  months_to IS NULL
                  OR months_to > $1
              )
            ORDER BY increment_level DESC
            LIMIT 1
            `,
            [totalMonths]
        );

    const applicantIncrement =
        incrementResult.rows.length > 0
            ? Number(
                incrementResult.rows[0]
                    .increment_level
            )
            : 1;

    // ----------------------------------------------------------
    // INCREMENTS ABOVE MINIMUM QS
    // ----------------------------------------------------------

    const incrementsAboveMinimum =
        Math.max(
            0,
            applicantIncrement -
            minimumExperienceIncrement
        );

    // ----------------------------------------------------------
    // POINTS
    // ----------------------------------------------------------

    const points =
        await getExperiencePoints(
            client,
            incrementsAboveMinimum
        );

    return {

        months:
            Number(
                totalMonths.toFixed(2)
            ),

        applicantIncrement,

        minimumIncrement:
            minimumExperienceIncrement,

        incrementsAboveMinimum,

        points:
            Math.min(points, 10),

        records:
            experienceList,

        mergedPeriods,

        qualified:
            applicantIncrement >=
            minimumExperienceIncrement
    };
};


/**
 * ============================================================
 * RELATED-TEACHING ETE / INITIAL SCREENING COMPUTATION
 * ============================================================
 *
 * Education = 10 maximum
 * Training  = 10 maximum
 * Experience = 10 maximum
 *
 * NOTE:
 * This returns the ETE breakdown.
 * For Related-Teaching, these points belong to the
 * 100-point comparative assessment and should NOT later
 * be added again on top of the 100-point assessment.
 */
export const calculateRelatedTeachingInitialScreening = async (
    client,
    applicantId,
    vacancyId
) => {

    // ----------------------------------------------------------
    // 1. GET VACANCY REQUIREMENTS
    // ----------------------------------------------------------

    const vacancy =
        await getRelatedTeachingVacancyRequirements(
            client,
            vacancyId
        );

    // ----------------------------------------------------------
    // 2. DETERMINE MINIMUM QS LEVELS
    // ----------------------------------------------------------

    const minimumEducationIncrement =
        await getMinimumEducationIncrement(
            client,
            vacancy.education_requirement
        );

    const minimumTrainingIncrement =
        await getMinimumTrainingIncrement(
            client,
            vacancy.training_requirement
        );

    const minimumExperienceIncrement =
        await getMinimumExperienceIncrement(
            client,
            vacancy.experience_requirement
        );

    // ----------------------------------------------------------
    // 3. EDUCATION
    // ----------------------------------------------------------

    const education =
        await calculateRelatedTeachingEducation(
            client,
            applicantId,
            minimumEducationIncrement
        );

    // ----------------------------------------------------------
    // 4. TRAINING
    // ----------------------------------------------------------

    const training =
        await calculateRelatedTeachingTraining(
            client,
            applicantId,
            minimumTrainingIncrement
        );

    // ----------------------------------------------------------
    // 5. EXPERIENCE
    // ----------------------------------------------------------

    const experience =
        await calculateRelatedTeachingExperience(
            client,
            applicantId,
            minimumExperienceIncrement
        );

    // ----------------------------------------------------------
    // 6. ETE TOTAL
    // ----------------------------------------------------------

    const total =
        Number(education.points || 0) +
        Number(training.points || 0) +
        Number(experience.points || 0);

    // ----------------------------------------------------------
    // 7. ETE QUALIFICATION RESULT
    // ----------------------------------------------------------

    const qualifiedByETE =
        education.qualified &&
        training.qualified &&
        experience.qualified;

    // ----------------------------------------------------------
    // 8. RETURN COMPLETE RESULT
    // ----------------------------------------------------------

    return {

        vacancy: {
            vacancy_id:
                vacancy.vacancy_id,

            position_id:
                vacancy.position_id,

            position_title:
                vacancy.position_title,

            salary_grade:
                vacancy.salary_grade
        },

        minimumQualification: {
            education:
                vacancy.education_requirement,

            training:
                vacancy.training_requirement,

            experience:
                vacancy.experience_requirement,

            eligibility:
                vacancy.eligibility_requirement
        },

        minimumIncrements: {
            education:
                minimumEducationIncrement,

            training:
                minimumTrainingIncrement,

            experience:
                minimumExperienceIncrement
        },

        education,

        training,

        experience,

        total,

        qualifiedByETE
    };
};