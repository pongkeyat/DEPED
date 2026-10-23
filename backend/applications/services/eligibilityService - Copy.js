/**
 * 9. CIVIL_SERVICE_ELIGIBILITY SERVICE
 */

export const insertApplicantsCivilServiceEligibility = async (client, applicantId, data) => {
    const { eligibility_type, rating, date_of_exam, place_of_exam, license_number } = data;

    const cleanUpper = (val) => val && val.trim() !== "" ? val.trim().toUpperCase() : null;
    const cleanRating = rating !== undefined && rating !== null && rating !== "" ? parseFloat(rating) : null;
    const cleanDateOfExam = date_of_exam && date_of_exam.trim() !== "" ? date_of_exam.trim() : null;

    const result = await client.query(
        `INSERT INTO civil_service_eligibility (
            applicant_id,
            eligibility_type,
            rating,
            date_of_exam,
            place_of_exam,
            license_number
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
            applicantId,
            cleanUpper(eligibility_type),
            cleanRating,
            cleanDateOfExam,
            cleanUpper(place_of_exam),
            cleanUpper(license_number)
        ]
    );

    return result.rows[0];
};