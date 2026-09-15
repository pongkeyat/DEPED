/**
 * 3. EQUAL_OPPORTUNITY_DECLARATIONS SERVICE
 */

export const insertEqualOpportunityDeclarations = async (client, applicantId, data) => {
    const { is_pwd, is_solo_parent, is_indigenous_person } = data;

    const result = await client.query(
        `INSERT INTO equal_opportunity_declarations (
            applicant_id,
            is_pwd,
            is_solo_parent,
            is_indigenous_person
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (applicant_id) DO UPDATE SET
            is_pwd = EXCLUDED.is_pwd,
            is_solo_parent = EXCLUDED.is_solo_parent,
            is_indigenous_person = EXCLUDED.is_indigenous_person
        RETURNING *`,
        [
            applicantId,
            Boolean(is_pwd),
            Boolean(is_solo_parent),
            Boolean(is_indigenous_person)
        ]
    );

    return result.rows[0];
};