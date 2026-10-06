import crypto from "crypto";

export const insertApplicantInformation = async (
    client,
    jobApplicationId,
    applicantInfo
) => {
    const applicantId = `APP-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

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
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12
        )
        RETURNING *;
    `;

    const values = [
        applicantId,
        jobApplicationId,
        applicantInfo.last_name ?? null,
        applicantInfo.first_name ?? null,
        applicantInfo.middle_name ?? null,
        applicantInfo.suffix ?? null,
        applicantInfo.sex ?? null,
        applicantInfo.date_of_birth ?? null,
        applicantInfo.civil_status ?? null,
        applicantInfo.contact_number ?? null,
        applicantInfo.email_address ?? null,
        applicantInfo.residential_address ?? null
    ];

    const result = await client.query(
        query,
        values
    );

    return result.rows[0];
};