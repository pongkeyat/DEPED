import pool from "../config/db.js";

const normalizeCriterionName = (name) =>
    String(name || "")
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

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
        WITH assessment_scores_by_applicant AS (
            SELECT
                scores.applicant_id,
                criteria.criterion_name,
                CASE
                    WHEN p.category ILIKE '%school admin%'
                         AND UPPER(TRIM(criteria.criterion_name)) = 'EXPERIENCE'
                    THEN LEAST(scores.score, 10)
                    ELSE scores.score
                END AS score
            FROM assessment_scores scores
            INNER JOIN assessment_criteria criteria
                ON criteria.assessment_criteria_id =
                   scores.assessment_criteria_id
            INNER JOIN applicant_information score_applicant
                ON score_applicant.applicant_id =
                   scores.applicant_id
            INNER JOIN job_applications score_application
                ON score_application.job_applications_id =
                   score_applicant.job_applications_id
            INNER JOIN vacancies score_vacancy
                ON score_vacancy.vacancy_id =
                   score_application.vacancy_id
            INNER JOIN positions p
                ON p.position_id =
                   score_vacancy.position_id
        ),

        assessment_totals AS (
            SELECT
                applicant_id,
                COALESCE(SUM(score), 0) AS assessment_total,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'criterion_name', criterion_name,
                            'score', score
                        )
                    ),
                    '[]'::json
                ) AS assessment_criteria
            FROM assessment_scores_by_applicant
            GROUP BY applicant_id
        ),

        applicant_ranking AS (
            SELECT
                ai.applicant_id,
                ai.application_code,
                ai.first_name,
                ai.middle_name,
                ai.last_name,
                ai.suffix,
                ja.job_applications_id,
                ja.vacancy_id,
                v.position_title,
                v.plantilla_position,
                v.salary_grade,
                p.category,
                hr.application_status,
                ins.education_value,
                ins.education_increment,
                ins.education_points,
                ins.training_hours,
                ins.training_increment,
                ins.training_points,
                ins.experience_months,
                ins.experience_increment,
                CASE
                    WHEN p.category ILIKE '%school admin%'
                    THEN LEAST(COALESCE(ins.experience_points, 0), 10)
                    ELSE COALESCE(ins.experience_points, 0)
                END AS experience_points,
                CASE
                    WHEN p.category ILIKE '%school admin%'
                    THEN COALESCE(ins.education_points, 0)
                         + COALESCE(ins.training_points, 0)
                         + LEAST(COALESCE(ins.experience_points, 0), 10)
                    ELSE COALESCE(ins.initial_screening_points, 0)
                END AS initial_screening_points,
                COALESCE(at.assessment_total, 0) AS assessment_total,
                COALESCE(at.assessment_criteria, '[]'::json)
                    AS assessment_criteria,
                CASE
                    WHEN p.category ILIKE '%school admin%'
                      OR p.category ILIKE '%related teaching%'
                    THEN COALESCE(at.assessment_total, 0)
                    ELSE COALESCE(ins.initial_screening_points, 0)
                         + COALESCE(at.assessment_total, 0)
                END AS combined_total
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
            INNER JOIN initial_screening ins
                ON ins.job_applications_id =
                   ja.job_applications_id
            INNER JOIN hr_remarks_final_notes hr
                ON hr.applicant_id =
                   ai.applicant_id
            LEFT JOIN assessment_totals at
                ON at.applicant_id =
                   ai.applicant_id
            WHERE ja.vacancy_id = $1
              AND UPPER(TRIM(hr.application_status)) = 'RANK'
        )

        SELECT
            applicant_ranking.*,
            RANK() OVER (
                ORDER BY
                    applicant_ranking.combined_total DESC
            ) AS rank
        FROM applicant_ranking
        ORDER BY
            combined_total DESC,
            last_name ASC,
            first_name ASC;
    `;

    const result = await pool.query(
        query,
        [vacancyId]
    );

    return result.rows.map((row) => {
        const category = String(row.category || "");
        const assessmentCriteria = Array.isArray(row.assessment_criteria)
            ? row.assessment_criteria
            : [];
        const getAssessmentScore = (...names) => {
            const acceptedNames = names.map(normalizeCriterionName);
            const criterion = assessmentCriteria.find((item) =>
                acceptedNames.includes(
                    normalizeCriterionName(item.criterion_name)
                )
            );

            return Number(criterion?.score || 0);
        };

        return {
        rank: Number(row.rank),

        applicant_id:
            row.applicant_id,

        application_code:
            row.application_code,

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

        category,

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

        experience_score:
            Number(row.experience_points || 0),

        performance_score:
            getAssessmentScore("Performance"),

        outstanding_accomplishments_score:
            getAssessmentScore("Outstanding Accomplishments"),

        application_of_education_score:
            getAssessmentScore("Application of Education"),

        application_of_learning_development_score:
            getAssessmentScore(
                "Application of Learning & Development",
                "Application of L&D"
            ),

        potential_score:
            getAssessmentScore("Potential"),

        assessment_criteria:
            assessmentCriteria,

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
        };
    });
};