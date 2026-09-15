export const insertApplicantDocuments = async (client, applicantId, data) => {
    const {
        // A. Letter of Intent
        has_application_letter = false,

        // B. Personal Data Sheet
        has_personal_data_sheet = false,

        // C. PRC License / ID
        has_prc_license_id = false,

        // D. Civil Service Eligibility / Rating
        has_civil_service_eligibility_cert = false,

        // E. Diploma / Academic Record
        has_diploma = false,
        has_transcript_of_records = false,

        // F. Training Certificates
        has_training_certificates = false,

        // G. Certificate of Employment / Service Record
        has_certificate_of_employment = false,
        has_service_record = false,

        // H. Latest Appointment
        has_latest_appointment = false,

        // I. Performance Rating
        has_performance_rating = false,

        // J. Checklist + Omnibus Sworn Statement
        has_omnibus_sworn_statement = false
    } = data;

    const result = await client.query(
        `INSERT INTO applicant_documents (
            applicant_id,

            -- A
            has_application_letter,

            -- B
            has_personal_data_sheet,

            -- C
            has_prc_license_id,

            -- D
            has_civil_service_eligibility_cert,

            -- E
            has_diploma,
            has_transcript_of_records,

            -- F
            has_training_certificates,

            -- G
            has_certificate_of_employment,
            has_service_record,

            -- H
            has_latest_appointment,

            -- I
            has_performance_rating,

            -- J
            has_omnibus_sworn_statement

        ) VALUES (
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
            $12,
            $13
        )

        ON CONFLICT (applicant_id) DO UPDATE SET

            -- A
            has_application_letter =
                EXCLUDED.has_application_letter,

            -- B
            has_personal_data_sheet =
                EXCLUDED.has_personal_data_sheet,

            -- C
            has_prc_license_id =
                EXCLUDED.has_prc_license_id,

            -- D
            has_civil_service_eligibility_cert =
                EXCLUDED.has_civil_service_eligibility_cert,

            -- E
            has_diploma =
                EXCLUDED.has_diploma,

            has_transcript_of_records =
                EXCLUDED.has_transcript_of_records,

            -- F
            has_training_certificates =
                EXCLUDED.has_training_certificates,

            -- G
            has_certificate_of_employment =
                EXCLUDED.has_certificate_of_employment,

            has_service_record =
                EXCLUDED.has_service_record,

            -- H
            has_latest_appointment =
                EXCLUDED.has_latest_appointment,

            -- I
            has_performance_rating =
                EXCLUDED.has_performance_rating,

            -- J
            has_omnibus_sworn_statement =
                EXCLUDED.has_omnibus_sworn_statement

        RETURNING *`,

        [
            applicantId,

            // A
            has_application_letter,

            // B
            has_personal_data_sheet,

            // C
            has_prc_license_id,

            // D
            has_civil_service_eligibility_cert,

            // E
            has_diploma,
            has_transcript_of_records,

            // F
            has_training_certificates,

            // G
            has_certificate_of_employment,
            has_service_record,

            // H
            has_latest_appointment,

            // I
            has_performance_rating,

            // J
            has_omnibus_sworn_statement
        ]
    );

    return result.rows[0];
};