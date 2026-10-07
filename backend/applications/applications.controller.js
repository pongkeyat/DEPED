import pool from '../config/db.js';

// Import services for all 10 tables
import { insertJobApplication } from './services/jobApplicationService.js';
import { insertApplicantInformation } from './services/applicantInfoService.js';
import { insertEqualOpportunityDeclarations } from './services/equalOpportunityService.js';
import { insertApplicantDocuments } from './services/applicantDocumentsService.js';
import { insertApplicantUploadedFiles } from './services/uploadedFilesService.js';
import { insertApplicantsEducation } from './services/educationService.js';
import { insertApplicantsWorkExperience } from './services/workExperienceService.js';
import { insertApplicantsTraining } from './services/trainingService.js';
import { insertApplicantsCivilServiceEligibility } from './services/eligibilityService.js';
import { insertHRRemarks } from './services/hrRemarksService.js';
import { sendApplicationReceivedEmail } from "../applications/services/email.services.js";


export const submitFullApplication = async (req, res) => {


    const client = await pool.connect();

    try {

        await client.query('BEGIN');

        const body = req.body || {};

        const parsedBody = body.payload
            ? JSON.parse(body.payload)
            : body;

        const uploadedFilePaths = (req.files || []).reduce(
            (files, file) => {

                const documentField = file.fieldname.replace(
                    /_file$/,
                    ''
                );

                const documentName = documentField.replace(
                    /^has_/,
                    ''
                );

                const normalizedDocumentName = {
                    oath_of_office: 'latest_appointment',
                    birth_certificate: 'omnibus_sworn_statement',
                    tin_id_or_verification: 'prc_license_id'
                }[documentName] || documentName;

                const pathValue = `/uploads/${file.filename}`;

                const pathKey =
                    `${normalizedDocumentName}_path`;


                if (documentName === 'training_certificates') {

                    if (!Array.isArray(files[pathKey])) {
                        files[pathKey] = [];
                    }

                    files[pathKey].push(pathValue);

                } else {

                    files[pathKey] = pathValue;

                }


                return files;

            },
            {}
        );


        uploadedFilePaths.diploma_path ||=
            uploadedFilePaths.transcript_of_records_path;

        uploadedFilePaths.certificate_of_employment_path ||=
            uploadedFilePaths.service_record_path;

        const {
            job_application = parsedBody.job_applications,

            applicant_info,

            equal_opportunity,

            document_checklist,

            uploaded_files = uploadedFilePaths,

            education_list = [],

            work_experience_list = [],

            trainings_list = [],

            eligibility_list = [],

            hr_remarks

        } = parsedBody;

        if (!job_application || !applicant_info) {

            return res.status(400).json({
                success: false,
                message:
                    'job_application and applicant_info are required.'
            });

        }

        if (
            !job_application.vacancy_id ||
            String(job_application.vacancy_id).trim() === ''
        ) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                success: false,
                message: 'A vacancy must be selected before submitting an application.'
            });
        }

        const jobApplicationId =
            await insertJobApplication(
                client,
                job_application
            );

        const applicantInfoRecord =
            await insertApplicantInformation(
                client,
                jobApplicationId,
                applicant_info
            );

        const applicantId =
            applicantInfoRecord.applicant_id;

        const ticket =
             applicantInfoRecord.ticket;

        if (!ticket) {
            throw new Error('Application ticket was not generated.');
        }

        if (equal_opportunity) {

            await insertEqualOpportunityDeclarations(
                client,
                applicantId,
                equal_opportunity
            );

        }

        if (document_checklist) {

            await insertApplicantDocuments(
                client,
                applicantId,
                document_checklist
            );

        }

        if (uploaded_files) {

            await insertApplicantUploadedFiles(
                client,
                applicantId,
                uploaded_files
            );

        }


        if (
            Array.isArray(education_list) &&
            education_list.length > 0
        ) {

            await insertApplicantsEducation(
                client,
                applicantId,
                education_list
            );

        }

        if (
            Array.isArray(work_experience_list) &&
            work_experience_list.length > 0
        ) {

            for (const workItem of work_experience_list) {

                await insertApplicantsWorkExperience(
                    client,
                    applicantId,
                    workItem
                );

            }

        }

        if (
            Array.isArray(trainings_list) &&
            trainings_list.length > 0
        ) {

            for (const trainingItem of trainings_list) {

                await insertApplicantsTraining(
                    client,
                    applicantId,
                    trainingItem
                );

            }

        }

        if (
            Array.isArray(eligibility_list) &&
            eligibility_list.length > 0
        ) {

            for (const eligibilityItem of eligibility_list) {

                await insertApplicantsCivilServiceEligibility(
                    client,
                    applicantId,
                    eligibilityItem
                );

            }

        }

        const initialStatusData = hr_remarks || {

            application_status: 'Initial Screening',

            hr_remarks_notes: 'Initial submission'

        };


        await insertHRRemarks(
            client,
            applicantId,
            initialStatusData
        );

        await client.query('COMMIT');


        if (applicant_info?.email_address) {

            try {

                await sendApplicationReceivedEmail(
                    applicant_info.email_address,
                    applicant_info.first_name,
                    applicant_info.last_name,
                    ticket
                );

                console.log(
                    `✅ Application received email sent to ${applicant_info.email_address}`
                );

            } catch (emailError) {

                console.error(
                    '⚠️ Application saved, but email could not be sent:',
                    emailError
                );

            }

        } else {

            console.warn(
                '⚠️ Application submitted without an email address.'
            );

        }



        return res.status(201).json({
            success: true,
            message:
                'Application successfully submitted.',
            data: {
                job_applications_id:
                    jobApplicationId,
                applicant_id:
                    applicantId,
                ticket
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(
            'Transaction Failed. Rolling back changes...',
            error
        );


        return res.status(500).json({
            success: false,
            message:
                'Failed to process job application transaction.',
            error: error.message

        });


    } finally {
        client.release();
    }

};



export const getFullApplicants = async (req, res) => {

    try {

   

        const mainQuery = `

            SELECT



                job_applications.job_applications_id,

                job_applications.vacancy_id,

                vacancies.position_title,

                vacancies.office_unit,

                job_applications.date_received,

                job_applications.time_received,

                job_applications.received_by,

                job_applications.submission_type,

                COALESCE(
                    hr_remarks_final_notes.application_status,
                    'Initial Screening'
                ) AS application_status,


                -- ==================================================
                -- APPLICANT INFORMATION
                -- ==================================================

                applicant_information.applicant_id,

                applicant_information.first_name,

                applicant_information.middle_name,

                applicant_information.last_name,

                applicant_information.suffix,

                applicant_information.sex,

                applicant_information.date_of_birth,

                applicant_information.civil_status,

                applicant_information.contact_number,

                applicant_information.email_address,

                applicant_information.residential_address,


                -- ==================================================
                -- EQUAL OPPORTUNITY
                -- ==================================================

                equal_opportunity_declarations.is_pwd,

                equal_opportunity_declarations.is_solo_parent,

                equal_opportunity_declarations.is_indigenous_person,


                -- ==================================================
                -- DOCUMENT CHECKLIST
                -- ==================================================

                applicant_documents.*,


                -- ==================================================
                -- UPLOADED FILES
                -- ==================================================

                applicant_uploaded_files.application_letter_path,

                applicant_uploaded_files.personal_data_sheet_path,

                applicant_uploaded_files.prc_license_id_path,

                applicant_uploaded_files.civil_service_eligibility_cert_path,

                applicant_uploaded_files.diploma_path,

                applicant_uploaded_files.transcript_of_records_path,

                applicant_uploaded_files.training_certificates_path,

                applicant_uploaded_files.certificate_of_employment_path,

                applicant_uploaded_files.service_record_path,

                applicant_uploaded_files.latest_appointment_path,

                applicant_uploaded_files.performance_rating_path,

                applicant_uploaded_files.omnibus_sworn_statement_path,


                -- ==================================================
                -- HR REMARKS
                -- ==================================================

                hr_remarks_final_notes.hr_remarks_notes


            FROM job_applications


            -- ======================================================
            -- VACANCY
            -- ======================================================

            LEFT JOIN vacancies

                ON job_applications.vacancy_id =
                   vacancies.vacancy_id


            -- ======================================================
            -- APPLICANT INFORMATION
            -- ======================================================

            LEFT JOIN applicant_information

                ON job_applications.job_applications_id =
                   applicant_information.job_applications_id


            -- ======================================================
            -- EQUAL OPPORTUNITY
            -- ======================================================

            LEFT JOIN equal_opportunity_declarations

                ON applicant_information.applicant_id =
                   equal_opportunity_declarations.applicant_id


            -- ======================================================
            -- DOCUMENT CHECKLIST
            -- ======================================================

            LEFT JOIN applicant_documents

                ON applicant_information.applicant_id =
                   applicant_documents.applicant_id


            -- ======================================================
            -- UPLOADED FILES
            -- ======================================================

            LEFT JOIN applicant_uploaded_files

                ON applicant_information.applicant_id =
                   applicant_uploaded_files.applicant_id


            -- ======================================================
            -- HR REMARKS
            -- ======================================================

            LEFT JOIN hr_remarks_final_notes

                ON applicant_information.applicant_id =
                   hr_remarks_final_notes.applicant_id

        `;


        const mainResult =
            await pool.query(mainQuery);


        const applicants =
            mainResult.rows;


        // ======================================================
        // NO APPLICANTS
        // ======================================================

        if (applicants.length === 0) {

            return res.status(200).json({

                success: true,

                count: 0,

                data: []

            });

        }


        // ======================================================
        // COLLECT APPLICANT IDS
        // ======================================================

        const applicantIds = applicants

            .map(
                app => app.applicant_id
            )

            .filter(
                id =>
                    id !== null &&
                    id !== undefined
            );


        if (applicantIds.length === 0) {

            return res.status(200).json({

                success: true,

                count: applicants.length,

                data: applicants

            });

        }


        // ======================================================
        // FETCH CHILD TABLES
        // ======================================================

        const [
            educationRes,
            workRes,
            trainingRes,
            eligibilityRes

        ] = await Promise.all([

            pool.query(
                `
                SELECT *
                FROM education
                WHERE applicant_id = ANY($1)
                `,
                [applicantIds]
            ),

            pool.query(
                `
                SELECT *,
                       date_from AS experience_date_from,
                       date_to AS experience_date_to
                FROM work_experience
                WHERE applicant_id = ANY($1)
                `,
                [applicantIds]
            ),

            pool.query(
                `
                SELECT *,
                       date_from AS training_date_from,
                       date_to AS training_date_to
                FROM relevant_trainings
                WHERE applicant_id = ANY($1)
                `,
                [applicantIds]
            ),

            pool.query(
                `
                SELECT *
                FROM civil_service_eligibility
                WHERE applicant_id = ANY($1)
                `,
                [applicantIds]
            )

        ]);


        // ======================================================
        // GROUP CHILD RECORDS
        // ======================================================

        const educationMap =
            groupBy(
                educationRes.rows,
                'applicant_id'
            );

        const workMap =
            groupBy(
                workRes.rows,
                'applicant_id'
            );

        const trainingMap =
            groupBy(
                trainingRes.rows,
                'applicant_id'
            );

        const eligibilityMap =
            groupBy(
                eligibilityRes.rows,
                'applicant_id'
            );


        // ======================================================
        // ATTACH ARRAYS
        // ======================================================

        const enrichedData =
            applicants.map(app => ({

                ...app,

                education_list:
                    educationMap.get(
                        app.applicant_id
                    ) || [],

                work_experience_list:
                    workMap.get(
                        app.applicant_id
                    ) || [],

                trainings_list:
                    trainingMap.get(
                        app.applicant_id
                    ) || [],

                eligibility_list:
                    eligibilityMap.get(
                        app.applicant_id
                    ) || []

            }));


        // ======================================================
        // RESPONSE
        // ======================================================

        return res.status(200).json({

            success: true,

            count:
                enrichedData.length,

            data:
                enrichedData

        });


    } catch (error) {

        console.error(
            'Fetch all applicants failure:',
            error
        );


        return res.status(500).json({

            success: false,

            error:
                'Internal server error fetching application profiles.'

        });

    }

};




function groupBy(array, key) {

    return array.reduce(

        (map, item) => {

            const keyValue =
                item[key];


            if (!map.has(keyValue)) {

                map.set(
                    keyValue,
                    []
                );

            }


            map.get(keyValue).push(item);


            return map;

        },

        new Map()

    );

}



export const getApplicantById = async (req, res) => {

    // Extract ID from URL
    const { id } = req.params;


    try {

        // ======================================================
        // MAIN QUERY
        // ======================================================

        const mainQuery = `

            SELECT


                -- ==================================================
                -- JOB APPLICATION
                -- ==================================================

                job_applications.job_applications_id,

                job_applications.vacancy_id,

                vacancies.position_title,

                vacancies.office_unit,

                job_applications.date_received,

                job_applications.time_received,

                job_applications.received_by,

                job_applications.submission_type,

                COALESCE(
                    hr_remarks_final_notes.application_status,
                    'Initial Screening'
                ) AS application_status,


                -- ==================================================
                -- APPLICANT INFORMATION
                -- ==================================================

                applicant_information.applicant_id,

                applicant_information.first_name,

                applicant_information.middle_name,

                applicant_information.last_name,

                applicant_information.suffix,

                applicant_information.sex,

                applicant_information.date_of_birth,

                applicant_information.civil_status,

                applicant_information.contact_number,

                applicant_information.email_address,

                applicant_information.residential_address,


                -- ==================================================
                -- EQUAL OPPORTUNITY
                -- ==================================================

                equal_opportunity_declarations.is_pwd,

                equal_opportunity_declarations.is_solo_parent,

                equal_opportunity_declarations.is_indigenous_person,


                -- ==================================================
                -- DOCUMENT CHECKLIST
                -- ==================================================

                applicant_documents.*,


                -- ==================================================
                -- UPLOADED FILES
                -- ==================================================

                applicant_uploaded_files.application_letter_path,

                applicant_uploaded_files.personal_data_sheet_path,

                applicant_uploaded_files.prc_license_id_path,

                applicant_uploaded_files.civil_service_eligibility_cert_path,

                applicant_uploaded_files.diploma_path,

                applicant_uploaded_files.transcript_of_records_path,

                applicant_uploaded_files.training_certificates_path,

                applicant_uploaded_files.certificate_of_employment_path,

                applicant_uploaded_files.service_record_path,

                applicant_uploaded_files.latest_appointment_path,

                applicant_uploaded_files.performance_rating_path,

                applicant_uploaded_files.omnibus_sworn_statement_path,


                -- ==================================================
                -- HR REMARKS
                -- ==================================================

                hr_remarks_final_notes.hr_remarks_notes,


                -- ==================================================
                -- VACANCY-SPECIFIC QUALIFICATIONS
                -- ==================================================

                vacancy_specific_qualifications.education_requirement,

                vacancy_specific_qualifications.training_requirement,

                vacancy_specific_qualifications.experience_requirement,

                vacancy_specific_qualifications.eligibility_requirement


            FROM job_applications


            -- ======================================================
            -- VACANCY
            -- ======================================================

            LEFT JOIN vacancies

                ON job_applications.vacancy_id =
                   vacancies.vacancy_id


            -- ======================================================
            -- VACANCY QUALIFICATIONS
            -- ======================================================

            LEFT JOIN vacancy_specific_qualifications

                ON vacancies.vacancy_id =
                   vacancy_specific_qualifications.vacancy_id


            -- ======================================================
            -- APPLICANT INFORMATION
            -- ======================================================

            LEFT JOIN applicant_information

                ON job_applications.job_applications_id =
                   applicant_information.job_applications_id


            -- ======================================================
            -- EQUAL OPPORTUNITY
            -- ======================================================

            LEFT JOIN equal_opportunity_declarations

                ON applicant_information.applicant_id =
                   equal_opportunity_declarations.applicant_id


            -- ======================================================
            -- DOCUMENT CHECKLIST
            -- ======================================================

            LEFT JOIN applicant_documents

                ON applicant_information.applicant_id =
                   applicant_documents.applicant_id


            -- ======================================================
            -- UPLOADED FILES
            -- ======================================================

            LEFT JOIN applicant_uploaded_files

                ON applicant_information.applicant_id =
                   applicant_uploaded_files.applicant_id


            -- ======================================================
            -- HR REMARKS
            -- ======================================================

            LEFT JOIN hr_remarks_final_notes

                ON applicant_information.applicant_id =
                   hr_remarks_final_notes.applicant_id


            -- ======================================================
            -- FIND APPLICANT
            -- ======================================================

            WHERE applicant_information.applicant_id = $1

               OR job_applications.job_applications_id = $1

        `;


        const mainResult =
            await pool.query(
                mainQuery,
                [id]
            );


        // ======================================================
        // APPLICANT NOT FOUND
        // ======================================================

        if (
            mainResult.rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Applicant not found.'

            });

        }


        // ======================================================
        // MAIN RECORD
        // ======================================================

        const applicantRecord =
            mainResult.rows[0];


        const applicantId =
            applicantRecord.applicant_id;


        // ======================================================
        // FETCH CHILD TABLES
        // ======================================================

        const [
            educationRes,
            workRes,
            trainingRes,
            eligibilityRes

        ] = await Promise.all([

            pool.query(
                `
                SELECT *
                FROM education
                WHERE applicant_id = $1
                `,
                [applicantId]
            ),

            pool.query(
                `
                SELECT *,
                       date_from AS experience_date_from,
                       date_to AS experience_date_to
                FROM work_experience
                WHERE applicant_id = $1
                `,
                [applicantId]
            ),

            pool.query(
                `
                SELECT *,
                       date_from AS training_date_from,
                       date_to AS training_date_to
                FROM relevant_trainings
                WHERE applicant_id = $1
                `,
                [applicantId]
            ),

            pool.query(
                `
                SELECT *
                FROM civil_service_eligibility
                WHERE applicant_id = $1
                `,
                [applicantId]
            )

        ]);


        // ======================================================
        // BUILD RESPONSE
        // ======================================================

        const responseData = {

            ...applicantRecord,

            education_list:
                educationRes.rows,

            work_experience_list:
                workRes.rows,

            trainings_list:
                trainingRes.rows,

            eligibility_list:
                eligibilityRes.rows

        };


        // ======================================================
        // RESPONSE
        // ======================================================

        return res.status(200).json({

            success: true,

            data:
                responseData

        });


    } catch (error) {

        console.error(
            'Fetch applicant failure:',
            error
        );


        return res.status(500).json({

            success: false,

            error:
                'Internal server error fetching applicant profile.'

        });

    }

};


/**
 * ============================================================
 * 4. UPDATE APPLICATION STATUS
 * ============================================================
 */

export const updateApplicationStatus = async (req, res) => {

    const { id } = req.params;

    const {
        application_status,
        hr_remarks_notes

    } = req.body;


    // ==========================================================
    // NORMALIZE STATUS
    // ==========================================================

    const normalizedStatus =
        typeof application_status === 'string'
            ? application_status.trim().toLowerCase()
            : application_status;


    try {

        // ======================================================
        // CHECK EXISTING HR REMARKS
        // ======================================================

        const checkQuery = `

            SELECT *

            FROM hr_remarks_final_notes

            WHERE applicant_id = $1

        `;


        const checkResult =
            await pool.query(
                checkQuery,
                [id]
            );


        // ======================================================
        // UPDATE EXISTING RECORD
        // ======================================================

        if (
            checkResult.rows.length > 0
        ) {

            const updateQuery = `

                UPDATE hr_remarks_final_notes

                SET

                    application_status =
                        COALESCE(
                            $1,
                            application_status
                        ),

                    hr_remarks_notes =
                        COALESCE(
                            $2,
                            hr_remarks_notes
                        )

                WHERE applicant_id = $3

                RETURNING *;

            `;


            const updateResult =
                await pool.query(

                    updateQuery,

                    [
                        normalizedStatus,
                        hr_remarks_notes,
                        id
                    ]

                );


            return res.status(200).json({

                success: true,

                message:
                    'Application status updated successfully.',

                data:
                    updateResult.rows[0]

            });

        }


        // ======================================================
        // CREATE NEW RECORD
        // ======================================================

        else {

            const insertQuery = `

                INSERT INTO hr_remarks_final_notes (

                    applicant_id,

                    application_status,

                    hr_remarks_notes

                )

                VALUES (

                    $1,
                    $2,
                    $3

                )

                RETURNING *;

            `;


            const insertResult =
                await pool.query(

                    insertQuery,

                    [
                        id,

                        normalizedStatus ||
                            'initial screening',

                        hr_remarks_notes ||
                            ''

                    ]

                );


            return res.status(201).json({

                success: true,

                message:
                    'Application status created successfully.',

                data:
                    insertResult.rows[0]

            });

        }


    } catch (error) {

        console.error(
            'Error updating application status:',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Internal server error updating status.',

            error:
                error.message

        });

    }

};





export const updateFullApplicant = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        const payload = req.body?.payload;
        const body = typeof payload === "string"
            ? JSON.parse(payload)
            : payload || req.body || {};

        await client.query("BEGIN");

        // 1. Find the existing applicant
        const applicantResult = await client.query(
            `
            SELECT
                ai.applicant_id,
                ai.job_applications_id
            FROM applicant_information ai
            WHERE ai.applicant_id = $1
               OR ai.job_applications_id = $1
            FOR UPDATE
            `,
            [id]
        );

        if (!applicantResult.rows.length) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Applicant not found."
            });
        }

        const {
            applicant_id,
            job_applications_id
        } = applicantResult.rows[0];

        const job_application =
            body.job_application ?? body.job_applications;

        const {
            applicant_info,
            equal_opportunity,
            document_checklist,
            uploaded_files,
            education_list,
            work_experience_list,
            trainings_list,
            eligibility_list,
            hr_remarks
        } = body;

        // 2. Update job application
        if (job_application) {
            const fields = [
                "vacancy_id",
                "date_received",
                "time_received",
                "received_by",
                "submission_type"
            ].filter(field =>
                Object.prototype.hasOwnProperty.call(
                    job_application,
                    field
                )
            );

            if (fields.length) {
                const assignments = fields.map(
                    (field, index) => `${field} = $${index + 1}`
                );
                const values = fields.map(
                    field => job_application[field] ?? null
                );

                await client.query(
                    `
                    UPDATE job_applications
                    SET ${assignments.join(", ")}
                    WHERE job_applications_id = $${fields.length + 1}
                    `,
                    [...values, job_applications_id]
                );
            }
        }

        // 3. Update applicant information
        if (applicant_info) {
            const fields = [
                "last_name",
                "first_name",
                "middle_name",
                "suffix",
                "sex",
                "date_of_birth",
                "civil_status",
                "contact_number",
                "email_address",
                "residential_address"
            ];

            const suppliedFields = fields.filter(field =>
                Object.prototype.hasOwnProperty.call(
                    applicant_info,
                    field
                )
            );

            if (suppliedFields.length) {
                const assignments = suppliedFields.map(
                    (field, index) => `${field} = $${index + 1}`
                );
                const values = suppliedFields.map(
                    field => applicant_info[field] ?? null
                );

                await client.query(
                    `
                    UPDATE applicant_information
                    SET ${assignments.join(", ")}
                    WHERE applicant_id = $${suppliedFields.length + 1}
                    `,
                    [...values, applicant_id]
                );
            }
        }

        // 4. Equal opportunity declarations
        if (equal_opportunity) {
            await client.query(
                `
                INSERT INTO equal_opportunity_declarations (
                    applicant_id,
                    is_pwd,
                    is_solo_parent,
                    is_indigenous_person
                )
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (applicant_id)
                DO UPDATE SET
                    is_pwd = EXCLUDED.is_pwd,
                    is_solo_parent = EXCLUDED.is_solo_parent,
                    is_indigenous_person =
                        EXCLUDED.is_indigenous_person
                `,
                [
                    applicant_id,
                    equal_opportunity.is_pwd ?? false,
                    equal_opportunity.is_solo_parent ?? false,
                    equal_opportunity.is_indigenous_person ?? false
                ]
            );
        }

        // 5. Document checklist
        if (document_checklist) {
            await client.query(
                `
                INSERT INTO applicant_documents (
                    applicant_id,
                    has_application_letter,
                    has_personal_data_sheet,
                    has_prc_license_id,
                    has_civil_service_eligibility_cert,
                    has_diploma,
                    has_transcript_of_records,
                    has_training_certificates,
                    has_certificate_of_employment,
                    has_service_record,
                    has_latest_appointment,
                    has_performance_rating,
                    has_omnibus_sworn_statement
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7,
                    $8, $9, $10, $11, $12, $13
                )
                ON CONFLICT (applicant_id)
                DO UPDATE SET
                    has_application_letter =
                        EXCLUDED.has_application_letter,
                    has_personal_data_sheet =
                        EXCLUDED.has_personal_data_sheet,
                    has_prc_license_id =
                        EXCLUDED.has_prc_license_id,
                    has_civil_service_eligibility_cert =
                        EXCLUDED.has_civil_service_eligibility_cert,
                    has_diploma =
                        EXCLUDED.has_diploma,
                    has_transcript_of_records =
                        EXCLUDED.has_transcript_of_records,
                    has_training_certificates =
                        EXCLUDED.has_training_certificates,
                    has_certificate_of_employment =
                        EXCLUDED.has_certificate_of_employment,
                    has_service_record =
                        EXCLUDED.has_service_record,
                    has_latest_appointment =
                        EXCLUDED.has_latest_appointment,
                    has_performance_rating =
                        EXCLUDED.has_performance_rating,
                    has_omnibus_sworn_statement =
                        EXCLUDED.has_omnibus_sworn_statement
                `,
                [
                    applicant_id,
                    document_checklist.has_application_letter ?? false,
                    document_checklist.has_personal_data_sheet ?? false,
                    document_checklist.has_prc_license_id ?? false,
                    document_checklist.has_civil_service_eligibility_cert ?? false,
                    document_checklist.has_diploma ?? false,
                    document_checklist.has_transcript_of_records ?? false,
                    document_checklist.has_training_certificates ?? false,
                    document_checklist.has_certificate_of_employment ?? false,
                    document_checklist.has_service_record ?? false,
                    document_checklist.has_latest_appointment ?? false,
                    document_checklist.has_performance_rating ?? false,
                    document_checklist.has_omnibus_sworn_statement ?? false
                ]
            );
        }

        // 6. Replace submitted applicant detail lists
        if (Array.isArray(education_list)) {
            await client.query(
                "DELETE FROM education WHERE applicant_id = $1",
                [applicant_id]
            );
            await insertApplicantsEducation(
                client,
                applicant_id,
                education_list
            );
        }

        if (Array.isArray(work_experience_list)) {
            await client.query(
                "DELETE FROM work_experience WHERE applicant_id = $1",
                [applicant_id]
            );
            for (const workItem of work_experience_list) {
                await insertApplicantsWorkExperience(
                    client,
                    applicant_id,
                    workItem
                );
            }
        }

        if (Array.isArray(trainings_list)) {
            await client.query(
                "DELETE FROM relevant_trainings WHERE applicant_id = $1",
                [applicant_id]
            );
            for (const trainingItem of trainings_list) {
                await insertApplicantsTraining(
                    client,
                    applicant_id,
                    trainingItem
                );
            }
        }

        if (Array.isArray(eligibility_list)) {
            await client.query(
                "DELETE FROM civil_service_eligibility WHERE applicant_id = $1",
                [applicant_id]
            );
            for (const eligibilityItem of eligibility_list) {
                await insertApplicantsCivilServiceEligibility(
                    client,
                    applicant_id,
                    eligibilityItem
                );
            }
        }

        // 6. Uploaded files
        // Store paths for newly uploaded files alongside supplied paths.
        const uploadedFilePaths = (req.files || []).reduce(
            (files, file) => {
                const documentName = file.fieldname.replace(/_file$/, "");
                const normalizedDocumentName = {
                    oath_of_office: "latest_appointment",
                    birth_certificate: "omnibus_sworn_statement",
                    tin_id_or_verification: "prc_license_id"
                }[documentName] || documentName;
                const pathKey = `${normalizedDocumentName}_path`;
                const pathValue = `/uploads/${file.filename}`;

                if (documentName === "training_certificates") {
                    files[pathKey] ||= [];
                    files[pathKey].push(pathValue);
                } else {
                    files[pathKey] = pathValue;
                }

                return files;
            },
            {}
        );
        const filesToSave = {
            ...(uploaded_files || {}),
            ...uploadedFilePaths
        };

        if (Object.keys(filesToSave).length) {
            const columns = [
                "application_letter_path",
                "personal_data_sheet_path",
                "prc_license_id_path",
                "civil_service_eligibility_cert_path",
                "diploma_path",
                "transcript_of_records_path",
                "training_certificates_path",
                "certificate_of_employment_path",
                "service_record_path",
                "latest_appointment_path",
                "performance_rating_path",
                "omnibus_sworn_statement_path"
            ];

            const suppliedColumns = columns.filter(
                column =>
                    Object.prototype.hasOwnProperty.call(
                        filesToSave,
                        column
                    )
            );

            if (suppliedColumns.length) {
                const values = suppliedColumns.map(
                    column => filesToSave[column]
                );

                const insertColumns = [
                    "applicant_id",
                    ...suppliedColumns
                ];

                const placeholders = insertColumns.map(
                    (_, index) => `$${index + 1}`
                );

                const updates = suppliedColumns.map(column =>
                    column === "training_certificates_path"
                        ? `${column} = COALESCE(applicant_uploaded_files.${column}, ARRAY[]::TEXT[]) || EXCLUDED.${column}`
                        : `${column} = EXCLUDED.${column}`
                );

                await client.query(
                    `
                    INSERT INTO applicant_uploaded_files (
                        ${insertColumns.join(", ")}
                    )
                    VALUES (${placeholders.join(", ")})
                    ON CONFLICT (applicant_id)
                    DO UPDATE SET
                        ${updates.join(", ")},
                        updated_at = CURRENT_TIMESTAMP
                    `,
                    [applicant_id, ...values]
                );
            }
        }

        // 7. HR remarks
        if (hr_remarks) {
            await client.query(
                `
                INSERT INTO hr_remarks_final_notes (
                    applicant_id,
                    hr_remarks_notes,
                    application_status
                )
                VALUES ($1, $2, $3)
                ON CONFLICT (applicant_id)
                DO UPDATE SET
                    hr_remarks_notes =
                        COALESCE(
                            EXCLUDED.hr_remarks_notes,
                            hr_remarks_final_notes.hr_remarks_notes
                        ),
                    application_status =
                        COALESCE(
                            EXCLUDED.application_status,
                            hr_remarks_final_notes.application_status
                        ),
                    updated_at = CURRENT_TIMESTAMP
                `,
                [
                    applicant_id,
                    hr_remarks.hr_remarks_notes ?? null,
                    hr_remarks.application_status ?? null
                ]
            );
        }

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Applicant updated successfully.",
            data: {
                applicant_id,
                job_applications_id
            }
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Update applicant error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update applicant.",
            error: error.message
        });

    } finally {
        client.release();
    }
};