import pool from "../config/db.js";

/**
 * Get ranked applicants for a vacancy
 *
 * Ranking:
 *
 * Initial Screening Points
 * +
 * Assessment Total
 * =
 * Combined Total
 *
 * Only applicants with application_status = RANK
 * are included.
 */
export const getRankingByVacancy = async (vacancyId) => {

    const query = `
        WITH assessment_totals AS (
            SELECT
                applicant_id,
                COALESCE(SUM(score), 0) AS assessment_total
            FROM assessment_scores
            GROUP BY applicant_id
        )

        SELECT
            ai.applicant_id,

            ai.first_name,
            ai.middle_name,
            ai.last_name,
            ai.suffix,

            ja.job_applications_id,
            ja.vacancy_id,

            v.position_title,
            v.plantilla_position,
            v.salary_grade,

            /* =========================
               APPLICATION STATUS
               ========================= */

            hr.application_status,

            /* =========================
               INITIAL SCREENING
               ========================= */

            ins.education_value,
            ins.education_increment,
            ins.education_points,

            ins.training_hours,
            ins.training_increment,
            ins.training_points,

            ins.experience_months,
            ins.experience_increment,
            ins.experience_points,

            COALESCE(
                ins.initial_screening_points,
                0
            ) AS initial_screening_points,

            /* =========================
               ASSESSMENT
               ========================= */

            COALESCE(
                at.assessment_total,
                0
            ) AS assessment_total,

            /* =========================
               FINAL TOTAL
               ========================= */

            (
                COALESCE(
                    ins.initial_screening_points,
                    0
                )
                +
                COALESCE(
                    at.assessment_total,
                    0
                )
            ) AS combined_total,

            /* =========================
               RANK
               ========================= */

            RANK() OVER (
                ORDER BY
                    (
                        COALESCE(
                            ins.initial_screening_points,
                            0
                        )
                        +
                        COALESCE(
                            at.assessment_total,
                            0
                        )
                    ) DESC
            ) AS rank

        FROM applicant_information ai

        /* =========================
           JOB APPLICATION
           ========================= */

        INNER JOIN job_applications ja
            ON ja.job_applications_id =
               ai.job_applications_id

        /* =========================
           VACANCY
           ========================= */

        INNER JOIN vacancies v
            ON v.vacancy_id =
               ja.vacancy_id

        /* =========================
           INITIAL SCREENING
           ========================= */

        INNER JOIN initial_screening ins
            ON ins.job_applications_id =
               ja.job_applications_id

        /* =========================
           HR REMARKS / STATUS
           ========================= */

        INNER JOIN hr_remarks_final_notes hr
            ON hr.applicant_id =
               ai.applicant_id

        /* =========================
           ASSESSMENT TOTAL
           ========================= */

        LEFT JOIN assessment_totals at
            ON at.applicant_id =
               ai.applicant_id

        /* =========================
           ONLY THIS VACANCY
           ========================= */

        WHERE ja.vacancy_id = $1

        /* =========================
           ONLY RANK APPLICANTS
           ========================= */

        AND UPPER(
            TRIM(hr.application_status)
        ) = 'RANK'

        /* =========================
           HIGHEST SCORE FIRST
           ========================= */

        ORDER BY
            combined_total DESC,
            ai.last_name ASC,
            ai.first_name ASC;
    `;

    const result = await pool.query(
        query,
        [vacancyId]
    );

    return result.rows.map((row) => ({
        rank: Number(row.rank),

        applicant_id:
            row.applicant_id,

        job_applications_id:
            row.job_applications_id,

        applicant_name: [
            row.first_name,
            row.middle_name,
            row.last_name,
            row.suffix
        ]
            .filter(Boolean)
            .join(" "),

        first_name:
            row.first_name,

        middle_name:
            row.middle_name,

        last_name:
            row.last_name,

        suffix:
            row.suffix,

        vacancy_id:
            row.vacancy_id,

        position_title:
            row.position_title,

        plantilla_position:
            row.plantilla_position,

        salary_grade:
            row.salary_grade,

        /* =========================
           APPLICATION STATUS
           ========================= */

        application_status:
            row.application_status,

        /* =========================
           EDUCATION
           ========================= */

        education: {
            value:
                Number(
                    row.education_value || 0
                ),

            increment:
                Number(
                    row.education_increment || 0
                ),

            points:
                Number(
                    row.education_points || 0
                )
        },

        /* =========================
           TRAINING
           ========================= */

        training: {
            hours:
                Number(
                    row.training_hours || 0
                ),

            increment:
                Number(
                    row.training_increment || 0
                ),

            points:
                Number(
                    row.training_points || 0
                )
        },

        /* =========================
           EXPERIENCE
           ========================= */

        experience: {
            months:
                Number(
                    row.experience_months || 0
                ),

            increment:
                Number(
                    row.experience_increment || 0
                ),

            points:
                Number(
                    row.experience_points || 0
                )
        },

        /* =========================
           INITIAL SCREENING TOTAL
           ========================= */

        initial_screening_points:
            Number(
                row.initial_screening_points || 0
            ),

        /* =========================
           ASSESSMENT TOTAL
           ========================= */

        assessment_total:
            Number(
                row.assessment_total || 0
            ),

        /* =========================
           FINAL SCORE
           ========================= */

        combined_total:
            Number(
                row.combined_total || 0
            ),

        screening_result:
            "RANK"
    }));
};