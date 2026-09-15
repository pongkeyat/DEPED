/**
 * 1. JOB_APPLICATIONS SERVICE
 */

import crypto from 'crypto';

export const insertJobApplication = async (client, data) => {
    const { vacancy_id, date_received, time_received, received_by, submission_type } = data;

    // Generate a unique 7-character ID (e.g., "JA-1A2B")
    const customId = `JA-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Clean up string fields to handle empty strings or spaces gracefully
    const finalVacancyId = vacancy_id && String(vacancy_id).trim() !== "" ? String(vacancy_id).trim() : null;
    const finalReceivedBy = received_by && received_by.trim() !== "" ? received_by.trim() : null;
    const finalSubmissionType = submission_type && submission_type.trim() !== "" ? submission_type.trim() : null;

    const result = await client.query(
        `INSERT INTO job_applications (
            job_applications_id,
            vacancy_id, 
            date_received, 
            time_received, 
            received_by, 
            submission_type
        )
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING job_applications_id`,
        [customId, finalVacancyId, date_received, time_received, finalReceivedBy, finalSubmissionType]
    );

    return result.rows[0].job_applications_id;
};

export const getJobApplicationById = async (client, jobApplicationId) => {
    const result = await client.query(
        `SELECT * FROM job_applications WHERE job_applications_id = $1`,
        [jobApplicationId]
    );
    return result.rows[0] || null;
};

export const deleteJobApplication = async (client, jobApplicationId) => {
    const result = await client.query(
        `DELETE FROM job_applications WHERE job_applications_id = $1 RETURNING *`,
        [jobApplicationId]
    );
    return result.rows[0] || null;
};