import pool from "../config/db.js";

/*
|--------------------------------------------------------------------------
| NON-TEACHING SALARY GROUP
|--------------------------------------------------------------------------
*/

export const getSalaryGroup = (salaryGrade) => {
    const sg = Number(salaryGrade);

    if (Number.isNaN(sg)) {
        return null;
    }

    if (sg >= 1 && sg <= 9) {
        return "SG_1_9";
    }

    if (sg >= 10 && sg <= 22) {
        return "SG_10_22_27";
    }

    if (sg === 24) {
        return "SG_24";
    }

    if (sg === 27) {
        return "SG_10_22_27";
    }

    return "GENERAL_SERVICES";
};


/*
|--------------------------------------------------------------------------
| NON-TEACHING EDUCATION CALCULATION
|--------------------------------------------------------------------------
*/

export const calculateEducation = async (
    client,
    applicantId,
    salaryGroup
) => {

    const educationResult = await client.query(
        `
        SELECT
            e.education_level,
            e.degree_course,
            e.school_name,
            r.increment_level

        FROM education e

        LEFT JOIN education_increment_rules r
            ON UPPER(TRIM(r.education_level))
             = UPPER(TRIM(e.education_level))

        WHERE e.applicant_id = $1

        ORDER BY
            r.increment_level DESC NULLS LAST

        LIMIT 1
        `,
        [applicantId]
    );


    /*
    |--------------------------------------------------------------------------
    | NO EDUCATION RECORD
    |--------------------------------------------------------------------------
    */

    if (educationResult.rows.length === 0) {
        return {
            value: null,
            increment: null,
            points: 0
        };
    }


    const education = educationResult.rows[0];


    /*
    |--------------------------------------------------------------------------
    | GET EDUCATION INCREMENT
    |--------------------------------------------------------------------------
    */

    const educationIncrement =
        education.increment_level !== null
            ? Number(education.increment_level)
            : null;


    /*
    |--------------------------------------------------------------------------
    | GET EDUCATION POINTS
    |--------------------------------------------------------------------------
    */

    let educationPoints = 0;

    if (
        educationIncrement !== null &&
        salaryGroup
    ) {

        const pointResult = await client.query(
            `
            SELECT
                points

            FROM education_point_rules

            WHERE salary_group = $1

              AND $2 >= increment_from

              AND (
                    increment_to IS NULL
                    OR $2 <= increment_to
                  )

            ORDER BY
                increment_from DESC

            LIMIT 1
            `,
            [
                salaryGroup,
                educationIncrement
            ]
        );


        if (pointResult.rows.length > 0) {

            educationPoints =
                Number(
                    pointResult.rows[0].points
                );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RETURN EDUCATION RESULT
    |--------------------------------------------------------------------------
    */

    return {
        value: educationIncrement,
        increment: educationIncrement,
        points: educationPoints
    };
};


/*
|--------------------------------------------------------------------------
| NON-TEACHING TRAINING CALCULATION
|--------------------------------------------------------------------------
*/

export const calculateTraining = async (
    client,
    applicantId,
    salaryGroup
) => {

    const result = await client.query(
        `
        SELECT
            training_title,
            date_from,
            date_to,
            hours_attended,
            training_type,
            conducted_by

        FROM relevant_trainings

        WHERE applicant_id = $1

        ORDER BY date_from
        `,
        [applicantId]
    );


    /*
    |--------------------------------------------------------------------------
    | NO TRAINING RECORDS
    |--------------------------------------------------------------------------
    */

    if (result.rows.length === 0) {

        return {
            hours: 0,
            increment: null,
            points: 0,
            records: []
        };
    }


    /*
    |--------------------------------------------------------------------------
    | TOTAL TRAINING HOURS
    |--------------------------------------------------------------------------
    */

    const totalHours =
        result.rows.reduce(
            (total, training) => {

                const hours =
                    Number(
                        training.hours_attended
                    ) || 0;

                return total + hours;
            },
            0
        );


    /*
    |--------------------------------------------------------------------------
    | GET TRAINING INCREMENT
    |--------------------------------------------------------------------------
    */

    const incrementResult =
        await client.query(
            `
            SELECT
                increment_level

            FROM training_increment_rules

            WHERE $1 >= hours_from

              AND (
                    hours_to IS NULL
                    OR $1 <= hours_to
                  )

            ORDER BY
                hours_from DESC

            LIMIT 1
            `,
            [totalHours]
        );


    const trainingIncrement =
        incrementResult.rows.length > 0
            ? Number(
                incrementResult.rows[0]
                    .increment_level
            )
            : null;


    /*
    |--------------------------------------------------------------------------
    | GET TRAINING POINTS
    |--------------------------------------------------------------------------
    */

    let trainingPoints = 0;

    if (
        trainingIncrement !== null &&
        salaryGroup
    ) {

        const pointResult =
            await client.query(
                `
                SELECT
                    points

                FROM training_point_rules

                WHERE salary_group = $1

                  AND $2 >= increment_from

                  AND (
                        increment_to IS NULL
                        OR $2 <= increment_to
                      )

                ORDER BY
                    increment_from DESC

                LIMIT 1
                `,
                [
                    salaryGroup,
                    trainingIncrement
                ]
            );


        if (pointResult.rows.length > 0) {

            trainingPoints =
                Number(
                    pointResult.rows[0].points
                );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RETURN TRAINING RESULT
    |--------------------------------------------------------------------------
    */

    return {

        hours:
            totalHours,

        increment:
            trainingIncrement,

        points:
            trainingPoints,

        records:
            result.rows
    };
};


/*
|--------------------------------------------------------------------------
| NON-TEACHING EXPERIENCE CALCULATION
|--------------------------------------------------------------------------
*/

export const calculateExperience = async (
    client,
    applicantId,
    salaryGroup
) => {

    const experienceResult =
        await client.query(
            `
            SELECT
                position_title,
                company_office,
                date_from,
                date_to,
                monthly_salary,
                appointment_status,
                is_govt_service

            FROM work_experience

            WHERE applicant_id = $1

            ORDER BY date_from ASC
            `,
            [applicantId]
        );


    /*
    |--------------------------------------------------------------------------
    | NO EXPERIENCE RECORDS
    |--------------------------------------------------------------------------
    */

    if (experienceResult.rows.length === 0) {

        return {
            months: 0,
            increment: 0,
            points: 0,
            records: []
        };
    }


    /*
    |--------------------------------------------------------------------------
    | CONVERT DATES
    |--------------------------------------------------------------------------
    */

    const records =
        experienceResult.rows

            .map(record => {

                const startDate =
                    new Date(record.date_from);

                const endDate =
                    record.date_to
                        ? new Date(record.date_to)
                        : new Date();

                return {
                    ...record,
                    startDate,
                    endDate
                };
            })

            .filter(record =>
                !isNaN(
                    record.startDate.getTime()
                ) &&
                !isNaN(
                    record.endDate.getTime()
                ) &&
                record.endDate >=
                    record.startDate
            );


    /*
    |--------------------------------------------------------------------------
    | SORT BY START DATE
    |--------------------------------------------------------------------------
    */

    records.sort(
        (a, b) =>
            a.startDate.getTime() -
            b.startDate.getTime()
    );


    /*
    |--------------------------------------------------------------------------
    | MERGE OVERLAPPING EXPERIENCE PERIODS
    |--------------------------------------------------------------------------
    */

    const mergedPeriods = [];


    for (const record of records) {

        const currentStart =
            record.startDate;

        const currentEnd =
            record.endDate;


        if (mergedPeriods.length === 0) {

            mergedPeriods.push({
                startDate: currentStart,
                endDate: currentEnd
            });

            continue;
        }


        const lastPeriod =
            mergedPeriods[
                mergedPeriods.length - 1
            ];


        /*
        |--------------------------------------------------------------------------
        | OVERLAPPING OR DIRECTLY FOLLOWING
        |--------------------------------------------------------------------------
        */

        if (
            currentStart.getTime() <=
            lastPeriod.endDate.getTime() +
            (24 * 60 * 60 * 1000)
        ) {

            if (
                currentEnd.getTime() >
                lastPeriod.endDate.getTime()
            ) {

                lastPeriod.endDate =
                    currentEnd;
            }

        } else {

            /*
            |--------------------------------------------------------------------------
            | NON-OVERLAPPING PERIOD
            |--------------------------------------------------------------------------
            */

            mergedPeriods.push({
                startDate: currentStart,
                endDate: currentEnd
            });
        }
    }


    /*
    |--------------------------------------------------------------------------
    | CALCULATE TOTAL UNIQUE MONTHS
    |--------------------------------------------------------------------------
    */

    let totalMonths = 0;


    for (const period of mergedPeriods) {

        const start =
            period.startDate;

        const end =
            period.endDate;


        const years =
            end.getFullYear() -
            start.getFullYear();


        const months =
            end.getMonth() -
            start.getMonth();


        const calculatedMonths =
            (years * 12) + months;


        totalMonths += Math.max(
            0,
            calculatedMonths
        );
    }


    /*
    |--------------------------------------------------------------------------
    | GET EXPERIENCE INCREMENT
    |--------------------------------------------------------------------------
    */

    let experienceIncrement = null;


    const incrementResult =
        await client.query(
            `
            SELECT
                increment_level

            FROM experience_increment_rules

            WHERE $1 >= months_from

              AND (
                    months_to IS NULL
                    OR $1 <= months_to
                  )

            ORDER BY
                months_from DESC

            LIMIT 1
            `,
            [totalMonths]
        );


    if (incrementResult.rows.length > 0) {

        experienceIncrement =
            Number(
                incrementResult.rows[0]
                    .increment_level
            );
    }


    /*
    |--------------------------------------------------------------------------
    | GET EXPERIENCE POINTS
    |--------------------------------------------------------------------------
    */

    let experiencePoints = 0;


    if (
        experienceIncrement !== null &&
        salaryGroup
    ) {

        const pointResult =
            await client.query(
                `
                SELECT
                    points

                FROM experience_point_rules

                WHERE salary_group = $1

                  AND $2 >= increment_from

                  AND (
                        increment_to IS NULL
                        OR $2 <= increment_to
                      )

                ORDER BY
                    increment_from DESC

                LIMIT 1
                `,
                [
                    salaryGroup,
                    experienceIncrement
                ]
            );


        if (pointResult.rows.length > 0) {

            experiencePoints =
                Number(
                    pointResult.rows[0].points
                );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RETURN EXPERIENCE RESULT
    |--------------------------------------------------------------------------
    */

    return {

        months:
            totalMonths,

        increment:
            experienceIncrement,

        points:
            experiencePoints,

        records:
            experienceResult.rows,

        mergedPeriods
    };
};


/*
|--------------------------------------------------------------------------
| CALCULATE COMPLETE NON-TEACHING SCREENING SCORE
|--------------------------------------------------------------------------
*/

export const calculateNonTeachingScoring = async (
    client,
    applicantId,
    salaryGrade
) => {

    const salaryGroup =
        getSalaryGroup(salaryGrade);


    const education =
        await calculateEducation(
            client,
            applicantId,
            salaryGroup
        );


    const training =
        await calculateTraining(
            client,
            applicantId,
            salaryGroup
        );


    const experience =
        await calculateExperience(
            client,
            applicantId,
            salaryGroup
        );


    const total =
        Number(education.points || 0) +
        Number(training.points || 0) +
        Number(experience.points || 0);


    return {

        salaryGrade,

        salaryGroup,

        education,

        training,

        experience,

        total
    };
};