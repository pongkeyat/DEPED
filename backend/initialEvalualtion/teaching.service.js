import pool from "../config/db.js";

/**
 * ============================================================
 * TEACHER I - EDUCATION
 * ============================================================
 *
 * Education = 10 points maximum
 */
export const calculateTeacherIEducation = async (
    client,
    applicantId
) => {

    // ----------------------------------------------------------
    // GET APPLICANT EDUCATION
    // ----------------------------------------------------------

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


    // ----------------------------------------------------------
    // NO EDUCATION RECORD
    // ----------------------------------------------------------

    if (educationList.length === 0) {

        return {
            value: null,
            increment: 0,
            points: 0,
            educationLevel: null,
            units: null
        };
    }


    // ----------------------------------------------------------
    // FIND HIGHEST EDUCATION INCREMENT
    // ----------------------------------------------------------

    let highestIncrement = 0;
    let selectedEducation = null;


    for (const education of educationList) {

        const educationLevel =
            education.education_level
                ?.trim()
                .toUpperCase();

        let incrementLevel = null;


        // ------------------------------------------------------
        // BACHELOR'S DEGREE
        // ------------------------------------------------------

        if (
            educationLevel === "BACHELOR'S DEGREE"
        ) {

            incrementLevel = 6;
        }


        // ------------------------------------------------------
        // MASTER'S DEGREE
        // ------------------------------------------------------

        else if (
            educationLevel === "MASTER'S DEGREE"
        ) {

            const units =
                Number(education.units);


            if (!Number.isNaN(units)) {

                const ruleResult =
                    await client.query(
                        `
                        SELECT
                            increment_level
                        FROM teacher_i_education_rules
                        WHERE
                            UPPER(education_level)
                                = 'MASTER''S DEGREE'
                            AND units <= $1
                        ORDER BY units DESC
                        LIMIT 1
                        `,
                        [units]
                    );


                if (ruleResult.rows.length > 0) {

                    incrementLevel =
                        Number(
                            ruleResult.rows[0]
                                .increment_level
                        );
                }
            }
        }


        // ------------------------------------------------------
        // DOCTORATE DEGREE
        // ------------------------------------------------------

        else if (
            educationLevel === "DOCTORATE DEGREE"
        ) {

            const units =
                Number(education.units);


            if (!Number.isNaN(units)) {

                const ruleResult =
                    await client.query(
                        `
                        SELECT
                            increment_level
                        FROM teacher_i_education_rules
                        WHERE
                            UPPER(education_level)
                                = 'DOCTORATE DEGREE'
                            AND units <= $1
                        ORDER BY units DESC
                        LIMIT 1
                        `,
                        [units]
                    );


                if (ruleResult.rows.length > 0) {

                    incrementLevel =
                        Number(
                            ruleResult.rows[0]
                                .increment_level
                        );
                }
            }
        }


        // ------------------------------------------------------
        // KEEP HIGHEST INCREMENT
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


    // ----------------------------------------------------------
    // NO MATCHING EDUCATION
    // ----------------------------------------------------------

    if (highestIncrement === 0) {

        return {
            value: null,
            increment: 0,
            points: 0,
            educationLevel: null,
            units: null
        };
    }


    // ----------------------------------------------------------
    // GET EDUCATION POINTS
    // ----------------------------------------------------------

    const pointsResult =
        await client.query(
            `
            SELECT
                points
            FROM teacher_i_education_point_rules
            WHERE
                increment_from <= $1
                AND (
                    increment_to IS NULL
                    OR increment_to >= $1
                )
            ORDER BY increment_from DESC
            LIMIT 1
            `,
            [highestIncrement]
        );


    const points =
        pointsResult.rows.length > 0
            ? Number(
                pointsResult.rows[0].points
            )
            : 0;


    // ----------------------------------------------------------
    // RETURN EDUCATION SCORE
    // ----------------------------------------------------------

    return {

        value:
            selectedEducation
                ?.education_level || null,

        increment:
            highestIncrement,

        points:
            Math.min(points, 10),

        educationLevel:
            selectedEducation
                ?.education_level || null,

        units:
            selectedEducation
                ?.units ?? null
    };
};



/**
 * ============================================================
 * TEACHER I - TRAINING
 * ============================================================
 *
 * Training = 10 points maximum
 *
 * Process:
 *
 * Applicant Training Records
 *        ↓
 * Total Training Hours
 *        ↓
 * Training Increment
 *        ↓
 * Training Points
 */
export const calculateTeacherITraining = async (
    client,
    applicantId
) => {

    // ----------------------------------------------------------
    // 1. GET TOTAL TRAINING HOURS
    // ----------------------------------------------------------

    const trainingResult =
        await client.query(
            `
            SELECT
                COALESCE(
                    SUM(
                        COALESCE(
                            hours_attended,
                            0
                        )
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
    // 2. DETERMINE TRAINING INCREMENT
    // ----------------------------------------------------------

    const incrementResult =
        await client.query(
            `
            SELECT
                increment_level,
                training_hours,
                description
            FROM teacher_i_training_rules
            WHERE training_hours <= $1
            ORDER BY training_hours DESC
            LIMIT 1
            `,
            [totalTrainingHours]
        );


    const incrementLevel =
        Number(
            incrementResult.rows[0]
                ?.increment_level || 1
        );


    // ----------------------------------------------------------
    // 3. DETERMINE TRAINING POINTS
    // ----------------------------------------------------------

    const pointResult =
        await client.query(
            `
            SELECT
                points
            FROM teacher_i_training_point_rules
            WHERE
                $1 >= increment_from
                AND (
                    increment_to IS NULL
                    OR $1 <= increment_to
                )
            ORDER BY increment_from DESC
            LIMIT 1
            `,
            [incrementLevel]
        );


    let points = 0;


    if (
        pointResult.rows.length > 0
    ) {

        points =
            Number(
                pointResult.rows[0]
                    .points || 0
            );
    }


    // ----------------------------------------------------------
    // 4. MAXIMUM TRAINING POINTS = 10
    // ----------------------------------------------------------

    points =
        Math.min(points, 10);


    // ----------------------------------------------------------
    // 5. RETURN TRAINING SCORE
    // ----------------------------------------------------------

    return {

        hours:
            totalTrainingHours,

        increment:
            incrementLevel,

        points
    };
};



/**
 * ============================================================
 * TEACHER I - EXPERIENCE
 * ============================================================
 *
 * Experience = 10 points maximum
 *
 * Process:
 *
 * Applicant Work Experience
 *        ↓
 * Remove overlapping periods
 *        ↓
 * Calculate total months
 *        ↓
 * Experience Increment
 *        ↓
 * Experience Points
 */
export const calculateTeacherIExperience = async (
    client,
    applicantId
) => {

    // ----------------------------------------------------------
    // 1. GET APPLICANT WORK EXPERIENCE
    // ----------------------------------------------------------

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
              AND date_to IS NOT NULL
            ORDER BY date_from ASC
            `,
            [applicantId]
        );


    const experienceList =
        experienceResult.rows;


    // ----------------------------------------------------------
    // 2. NO EXPERIENCE RECORD
    // ----------------------------------------------------------

    if (
        experienceList.length === 0
    ) {

        return {
            months: 0,
            increment: 1,
            points: 0,
            records: [],
            mergedPeriods: []
        };
    }


    // ----------------------------------------------------------
    // 3. PREPARE EXPERIENCE PERIODS
    // ----------------------------------------------------------

    const periods =
        experienceList
            .map(experience => ({
                start:
                    new Date(
                        experience.date_from
                    ),

                end:
                    new Date(
                        experience.date_to
                    ),

                workExperienceId:
                    experience.work_experience_id,

                companyOffice:
                    experience.company_office,

                appointmentStatus:
                    experience.appointment_status,

                isGovtService:
                    experience.is_govt_service
            }))
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


    // ----------------------------------------------------------
    // 4. NO VALID EXPERIENCE PERIOD
    // ----------------------------------------------------------

    if (
        periods.length === 0
    ) {

        return {
            months: 0,
            increment: 1,
            points: 0,
            records: experienceList,
            mergedPeriods: []
        };
    }


    // ----------------------------------------------------------
    // 5. MERGE OVERLAPPING / CONTINUOUS PERIODS
    // ----------------------------------------------------------

    const mergedPeriods = [];


    for (const period of periods) {

        // First period
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


        // ------------------------------------------------------
        // CHECK IF PERIODS OVERLAP OR ARE CONTINUOUS
        // ------------------------------------------------------

        const dayAfterLast =
            new Date(last.end);

        dayAfterLast.setDate(
            dayAfterLast.getDate() + 1
        );


        if (
            period.start <= dayAfterLast
        ) {

            // Extend the merged period
            if (
                period.end > last.end
            ) {

                last.end =
                    period.end;
            }


            last.records.push(
                period
            );

        } else {

            // Start a new period
            mergedPeriods.push({
                start: period.start,
                end: period.end,
                records: [period]
            });
        }
    }


    // ----------------------------------------------------------
    // 6. CALCULATE TOTAL EXPERIENCE DAYS
    // ----------------------------------------------------------

    let totalDays = 0;


    for (
        const period of mergedPeriods
    ) {

        const start =
            new Date(period.start);

        const end =
            new Date(period.end);


        const difference =
            end.getTime() -
            start.getTime();


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
    // 7. CONVERT DAYS TO MONTHS
    // ----------------------------------------------------------

  const totalMonths = Math.floor(totalDays / 30.4375);

// ======================================================
// GET EXPERIENCE INCREMENT
// ======================================================
const incrementResult = await client.query(
    `
    SELECT
        increment_level,
        experience_months,
        description
    FROM teacher_i_experience_rules
    WHERE experience_months <= $1
    ORDER BY experience_months DESC
    LIMIT 1
    `,
    [totalMonths]
);

const incrementLevel =
    incrementResult.rows.length > 0
        ? Number(incrementResult.rows[0].increment_level)
        : 0;

    // ----------------------------------------------------------
    // 9. FIND EXPERIENCE POINTS
    // ----------------------------------------------------------

    const pointResult =
        await client.query(
            `
            SELECT
                points
            FROM teacher_i_experience_point_rules
            WHERE
                $1 >= increment_from
                AND (
                    increment_to IS NULL
                    OR $1 <= increment_to
                )
            ORDER BY increment_from DESC
            LIMIT 1
            `,
            [incrementLevel]
        );


    let points = 0;


    if (
        pointResult.rows.length > 0
    ) {

        points =
            Number(
                pointResult.rows[0]
                    .points || 0
            );
    }


    // ----------------------------------------------------------
    // 10. MAXIMUM EXPERIENCE POINTS = 10
    // ----------------------------------------------------------

    points =
        Math.min(points, 10);


    // ----------------------------------------------------------
    // 11. RETURN EXPERIENCE SCORE
    // ----------------------------------------------------------

    return {

        months:
            Number(
                totalMonths.toFixed(2)
            ),

        increment:
            incrementLevel,

        points,

        records:
            experienceList,

        mergedPeriods
    };
};



/**
 * ============================================================
 * TEACHER I INITIAL SCREENING
 * ============================================================
 *
 * Initial Screening:
 *
 * Education  = 10
 * Training   = 10
 * Experience = 10
 *
 * Total = 30
 */
export const calculateTeacherIInitialScreening = async (
    client,
    applicantId
) => {

    // ----------------------------------------------------------
    // 1. EDUCATION
    // ----------------------------------------------------------

    const education =
        await calculateTeacherIEducation(
            client,
            applicantId
        );


    // ----------------------------------------------------------
    // 2. TRAINING
    // ----------------------------------------------------------

    const training =
        await calculateTeacherITraining(
            client,
            applicantId
        );


    // ----------------------------------------------------------
    // 3. EXPERIENCE
    // ----------------------------------------------------------

    const experience =
        await calculateTeacherIExperience(
            client,
            applicantId
        );


    // ----------------------------------------------------------
    // 4. TOTAL
    // ----------------------------------------------------------

    const total =
        Number(education.points || 0) +
        Number(training.points || 0) +
        Number(experience.points || 0);


    // ----------------------------------------------------------
    // 5. RETURN COMPLETE RESULT
    // ----------------------------------------------------------

    return {

        education,

        training,

        experience,

        total
    };
};