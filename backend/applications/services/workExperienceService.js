/**
 * 7. WORK_EXPERIENCE SERVICE
 */

export const insertApplicantsWorkExperience = async (client, applicantId, data) => {
    const experienceData = data?.work_experience || data;

    const {
        position_title,
        company_office,
        date_from,
        date_to,
        monthly_salary,
        appointment_status,
        is_govt_service
    } = experienceData;

    const cleanPositionTitle = position_title && position_title.trim() !== "" ? position_title.trim().toUpperCase() : null;
    const cleanCompanyOffice = company_office && company_office.trim() !== "" ? company_office.trim().toUpperCase() : null;
    const cleanAppointmentStatus = appointment_status && appointment_status.trim() !== "" ? appointment_status.trim().toUpperCase() : null;

    const cleanDateFrom = date_from || null;
    const cleanDateTo = (date_to && date_to.toString().trim().toUpperCase() !== "PRESENT" && date_to.toString().trim() !== "") ? date_to : null;
    const cleanMonthlySalary = monthly_salary || null;
    const cleanIsGovtService = typeof is_govt_service === 'boolean' ? is_govt_service : null;

    const result = await client.query(
        `INSERT INTO work_experience (
            applicant_id,
            position_title,
            company_office,
            date_from,
            date_to,
            monthly_salary,
            appointment_status,
            is_govt_service
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
            applicantId,
            cleanPositionTitle,
            cleanCompanyOffice,
            cleanDateFrom,
            cleanDateTo,
            cleanMonthlySalary,
            cleanAppointmentStatus,
            cleanIsGovtService
        ]
    );

    return result.rows[0];
};