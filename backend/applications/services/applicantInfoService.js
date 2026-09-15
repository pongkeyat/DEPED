/**
 * 2. APPLICANT_INFORMATION SERVICE
 */

import crypto from 'crypto';

export const insertApplicantInformation = async (client, jobApplicationId, data) => {
    // 1. Generate a custom unique applicant_id
    const applicantId = `APP-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const {
        last_name,
        first_name,
        middle_name,
        suffix,
        sex,
        date_of_birth,
        civil_status,
        contact_number,
        email_address,
        residential_address
    } = data;

    const query = `
        INSERT INTO applicant_information (
            applicant_id,
            job_applications_id,
            last_name,
            first_name,
            middle_name,
            suffix,
            sex,
            date_of_birth,
            civil_status,
            contact_number,
            email_address,
            residential_address
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING applicant_id;
    `;

    const values = [
        applicantId,
        jobApplicationId,
        last_name,
        first_name,
        middle_name || null,
        suffix || null,
        sex,
        date_of_birth,
        civil_status,
        contact_number,
        email_address,
        residential_address
    ];

    const result = await client.query(query, values);
    return result.rows[0];
};

export const getApplicantInformationById = async (client, applicantId) => {
    const result = await client.query(
        `SELECT * FROM applicant_information WHERE applicant_id = $1`,
        [applicantId]
    );
    return result.rows[0] || null;
};