import pool from "../config/db.js";


// ============================================================
// GET APPLICANT SUMMARY REPORT
// ============================================================
// Returns:
// - Total Applicants
// - PWD
// - Solo Parent
// - Indigenous Person
// - Married
// - Single
// - Qualified
// - Disqualified
// ============================================================

export const getApplicantSummaryReport = async (req, res) => {

    try {

        const query = `
            SELECT

                COUNT(DISTINCT ai.applicant_id)
                    AS total_applicants,

                COUNT(
                    DISTINCT CASE
                        WHEN COALESCE(eod.is_pwd, false) = true
                        THEN ai.applicant_id
                    END
                ) AS pwd,

                COUNT(
                    DISTINCT CASE
                        WHEN COALESCE(eod.is_solo_parent, false) = true
                        THEN ai.applicant_id
                    END
                ) AS solo_parent,

                COUNT(
                    DISTINCT CASE
                        WHEN COALESCE(eod.is_indigenous_person, false) = true
                        THEN ai.applicant_id
                    END
                ) AS indigenous_person,

                COUNT(
                    DISTINCT CASE
                        WHEN LOWER(TRIM(ai.civil_status)) = 'married'
                        THEN ai.applicant_id
                    END
                ) AS married,

                COUNT(
                    DISTINCT CASE
                        WHEN LOWER(TRIM(ai.civil_status)) = 'single'
                        THEN ai.applicant_id
                    END
                ) AS single,

                COUNT(
                    DISTINCT CASE
                        WHEN LOWER(TRIM(hr.application_status)) = 'qualified'
                        THEN ai.applicant_id
                    END
                ) AS qualified,

                COUNT(
                    DISTINCT CASE
                        WHEN LOWER(TRIM(hr.application_status)) = 'disqualified'
                        THEN ai.applicant_id
                    END
                ) AS disqualified

            FROM applicant_information ai

            LEFT JOIN equal_opportunity_declarations eod
                ON eod.applicant_id = ai.applicant_id

            LEFT JOIN hr_remarks_final_notes hr
                ON hr.applicant_id = ai.applicant_id;
        `;


        const result =
            await pool.query(query);


        const row =
            result.rows[0];


        return res.status(200).json({

            success: true,

            data: {

                total_applicants:
                    Number(row.total_applicants || 0),

                pwd:
                    Number(row.pwd || 0),

                solo_parent:
                    Number(row.solo_parent || 0),

                indigenous_person:
                    Number(row.indigenous_person || 0),

                married:
                    Number(row.married || 0),

                single:
                    Number(row.single || 0),

                qualified:
                    Number(row.qualified || 0),

                disqualified:
                    Number(row.disqualified || 0)

            }

        });


    } catch (error) {

        console.error(
            "Error generating applicant summary report:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to generate applicant summary report.",

            error:
                error.message

        });

    }

};