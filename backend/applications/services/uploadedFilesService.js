export const insertApplicantUploadedFiles = async (
    client,
    applicantId,
    data
) => {

    // ============================================================
    // EXTRACT DATA
    // ============================================================

    const {
        application_letter_path = null,

        personal_data_sheet_path = null,

        prc_license_id_path = null,

        civil_service_eligibility_cert_path = null,

        diploma_path = null,

        transcript_of_records_path = null,

        training_certificates_path = [],

        certificate_of_employment_path = null,

        service_record_path = null,

        latest_appointment_path = null,

        performance_rating_path = null,

        omnibus_sworn_statement_path = null

    } = data || {};


    // ============================================================
    // CLEAN SINGLE PATH
    // ============================================================

    const cleanPath = (path) => {

        if (
            typeof path !== "string" ||
            path.trim() === ""
        ) {
            return null;
        }

        return path.trim();
    };


    // ============================================================
    // CLEAN ARRAY OF PATHS
    // ============================================================

    const cleanPathArray = (paths) => {

        // If nothing was supplied
        if (!paths) {
            return [];
        }


        // Convert single value into an array
        const values =
            Array.isArray(paths)
                ? paths
                : [paths];


        return values

            .filter(
                (path) =>
                    typeof path === "string" &&
                    path.trim() !== ""
            )

            .map(
                (path) =>
                    path.trim()
            );

    };


    // ============================================================
    // CLEAN ALL PATHS
    // ============================================================

    const applicationLetterPath =
        cleanPath(application_letter_path);

    const personalDataSheetPath =
        cleanPath(personal_data_sheet_path);

    const prcLicenseIdPath =
        cleanPath(prc_license_id_path);

    const civilServiceEligibilityCertPath =
        cleanPath(
            civil_service_eligibility_cert_path
        );

    const diplomaPath =
        cleanPath(diploma_path);

    const transcriptOfRecordsPath =
        cleanPath(
            transcript_of_records_path
        );

    const trainingCertificatesPath =
        cleanPathArray(
            training_certificates_path
        );

    const certificateOfEmploymentPath =
        cleanPath(
            certificate_of_employment_path
        );

    const serviceRecordPath =
        cleanPath(
            service_record_path
        );

    const latestAppointmentPath =
        cleanPath(
            latest_appointment_path
        );

    const performanceRatingPath =
        cleanPath(
            performance_rating_path
        );

    const omnibusSwornStatementPath =
        cleanPath(
            omnibus_sworn_statement_path
        );


    // ============================================================
    // DEBUG
    // ============================================================

    console.log(
        "Uploading applicant documents for applicant:",
        applicantId
    );

    console.log({
        applicationLetterPath,
        personalDataSheetPath,
        prcLicenseIdPath,
        civilServiceEligibilityCertPath,
        diplomaPath,
        transcriptOfRecordsPath,
        trainingCertificatesPath,
        certificateOfEmploymentPath,
        serviceRecordPath,
        latestAppointmentPath,
        performanceRatingPath,
        omnibusSwornStatementPath
    });


    // ============================================================
    // INSERT / UPDATE
    // ============================================================

    const result = await client.query(

        `
        INSERT INTO applicant_uploaded_files (

            applicant_id,

            application_letter_path,

            personal_data_sheet_path,

            prc_license_id_path,

            civil_service_eligibility_cert_path,

            diploma_path,

            transcript_of_records_path,

            training_certificates_path,

            certificate_of_employment_path,

            service_record_path,

            latest_appointment_path,

            performance_rating_path,

            omnibus_sworn_statement_path

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

            $12,

            $13

        )

        ON CONFLICT (applicant_id)

        DO UPDATE SET

            application_letter_path =
                EXCLUDED.application_letter_path,

            personal_data_sheet_path =
                EXCLUDED.personal_data_sheet_path,

            prc_license_id_path =
                EXCLUDED.prc_license_id_path,

            civil_service_eligibility_cert_path =
                EXCLUDED.civil_service_eligibility_cert_path,

            diploma_path =
                EXCLUDED.diploma_path,

            transcript_of_records_path =
                EXCLUDED.transcript_of_records_path,

            training_certificates_path =
                EXCLUDED.training_certificates_path,

            certificate_of_employment_path =
                EXCLUDED.certificate_of_employment_path,

            service_record_path =
                EXCLUDED.service_record_path,

            latest_appointment_path =
                EXCLUDED.latest_appointment_path,

            performance_rating_path =
                EXCLUDED.performance_rating_path,

            omnibus_sworn_statement_path =
                EXCLUDED.omnibus_sworn_statement_path,

            updated_at =
                CURRENT_TIMESTAMP

        RETURNING *;

        `,

        [

            // $1
            applicantId,

            // $2
            applicationLetterPath,

            // $3
            personalDataSheetPath,

            // $4
            prcLicenseIdPath,

            // $5
            civilServiceEligibilityCertPath,

            // $6
            diplomaPath,

            // $7
            transcriptOfRecordsPath,

            // $8
            trainingCertificatesPath,

            // $9
            certificateOfEmploymentPath,

            // $10
            serviceRecordPath,

            // $11
            latestAppointmentPath,

            // $12
            performanceRatingPath,

            // $13
            omnibusSwornStatementPath

        ]

    );


    // ============================================================
    // RETURN INSERTED RECORD
    // ============================================================

    return result.rows[0];

};