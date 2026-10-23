/**
 * 10. HR_REMARKS_FINAL_NOTES SERVICE
 */

export const insertHRRemarks = async (client, applicantId, data) => {
    const { hr_remarks_notes, application_status } = data;

    const cleanHRRemarksNotes = hr_remarks_notes && hr_remarks_notes.trim() !== "" ? hr_remarks_notes.trim() : null;
    const cleanApplicationStatus = application_status && application_status.trim() !== "" ? application_status.trim().toLowerCase() : 'pending';

    const result = await client.query(
        `INSERT INTO hr_remarks_final_notes (
            applicant_id,
            hr_remarks_notes,
            application_status
        ) VALUES ($1, $2, $3)
        ON CONFLICT (applicant_id) DO UPDATE SET
            hr_remarks_notes = EXCLUDED.hr_remarks_notes,
            application_status = EXCLUDED.application_status,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [
            applicantId,
            cleanHRRemarksNotes,
            cleanApplicationStatus
        ]
    );

    return result.rows[0];
};