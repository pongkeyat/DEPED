/**
 * 8. RELEVANT_TRAININGS SERVICE
 */

export const insertApplicantsTraining = async (client, applicantId, data) => {
    const trainingData = data?.training || data;

    const {
        training_title,
        date_from,
        date_to,
        hours_attended,
        training_type,
        conducted_by
    } = trainingData;

    const cleanUpper = (val) => val && val.trim() !== "" ? val.trim().toUpperCase() : null;

    const cleanDateFrom = date_from || null;
    const cleanDateTo = date_to || null;
    const cleanHoursAttended = hours_attended !== undefined && hours_attended !== null && hours_attended !== "" ? Number(hours_attended) : null;

    const result = await client.query(
        `INSERT INTO relevant_trainings (
            applicant_id,
            training_title,
            date_from,
            date_to,
            hours_attended,
            training_type,
            conducted_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
            applicantId,
            cleanUpper(training_title),
            cleanDateFrom,
            cleanDateTo,
            cleanHoursAttended,
            cleanUpper(training_type),
            cleanUpper(conducted_by)
        ]
    );

    return result.rows[0];
};