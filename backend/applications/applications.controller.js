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


/**
 * ============================================================
 * 1. SUBMIT FULL APPLICATION
 * ============================================================
 *
 * Handles full job application submission within a single
 * SQL transaction.
 *

 * URL:
 * POST /api/applications/submit
 *
 * Document checklist is based on:
 *
 * A. Letter of Intent
 * B. PDS with Work Experience Sheet
 * C. PRC License/ID, if applicable
 * D. Certificate of Eligibility/Rating, if applicable
 * E. Diploma / Academic Record / TOR
 * F. Certificate/s of Training
 * G. Certificate of Employment / Contract of Service /
 *    Service Record
 * H. Latest Appointment, if applicable
 * I. Performance Rating
 * J. Checklist of Requirements and Omnibus Sworn Statement
 */
export const submitFullApplication = async (req, res) => {

    // Acquire a dedicated client connection
    const client = await pool.connect();

    try {

        // ======================================================
        // 1. START TRANSACTION
        // ======================================================

        await client.query('BEGIN');


        // ======================================================
        // 2. PARSE REQUEST BODY
        // ======================================================

        const body = req.body || {};

        const parsedBody = body.payload
            ? JSON.parse(body.payload)
            : body;


        // ======================================================
        // 3. PROCESS UPLOADED FILES
        // ======================================================
        //
        // Converts:
        //
        // application_letter_file
        //        ↓
        // application_letter_path
        //
        // prc_license_id_file
        //        ↓
        // prc_license_id_path
        //
        // training_certificates_file
        //        ↓
        // training_certificates_path[]
        //
        // Training certificates are treated as multiple files.
        // ======================================================

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

                const pathKey = `${normalizedDocumentName}_path`;


                // ------------------------------------------------
                // Training certificates can contain multiple files
                // ------------------------------------------------

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


        // ======================================================
        // 4. EXTRACT APPLICATION DATA
        // ======================================================

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


        // ======================================================
        // 5. BASIC VALIDATION
        // ======================================================

        if (!job_application || !applicant_info) {

            return res.status(400).json({
                success: false,
                message:
                    'job_application and applicant_info are required.'
            });

        }


        // ======================================================
        // STEP 1: MASTER APPLICATION RECORD
        // ======================================================
        //
        // Returns generated job_applications_id
        // Example:
        // JA-0001
        // ======================================================

        const jobApplicationId =
            await insertJobApplication(
                client,
                job_application
            );


        // ======================================================
        // STEP 2: APPLICANT INFORMATION
        // ======================================================
        //
        // Generates applicant_id linked to jobApplicationId
        // ======================================================

        const applicantInfoRecord =
            await insertApplicantInformation(
                client,
                jobApplicationId,
                applicant_info
            );

        const applicantId =
            applicantInfoRecord.applicant_id;


        // ======================================================
        // STEP 3: EQUAL OPPORTUNITY DECLARATION
        // ======================================================

        if (equal_opportunity) {

            await insertEqualOpportunityDeclarations(
                client,
                applicantId,
                equal_opportunity
            );

        }


        // ======================================================
        // STEP 4: DOCUMENT CHECKLIST
        // ======================================================

        if (document_checklist) {

            await insertApplicantDocuments(
                client,
                applicantId,
                document_checklist
            );

        }


        // ======================================================
        // STEP 5: UPLOADED DOCUMENT FILES
        // ======================================================

        if (uploaded_files) {

            await insertApplicantUploadedFiles(
                client,
                applicantId,
                uploaded_files
            );

        }


        // ======================================================
        // STEP 6: EDUCATION
        // ======================================================

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


        // ======================================================
        // STEP 7: WORK EXPERIENCE
        // ======================================================

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


        // ======================================================
        // STEP 8: TRAININGS
        // ======================================================

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


        // ======================================================
        // STEP 9: CIVIL SERVICE ELIGIBILITY
        // ======================================================

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


        // ======================================================
        // STEP 10: INITIAL HR REMARKS / APPLICATION STATUS
        // ======================================================
        //
        // Initial status is:
        // Initial Screening
        // ======================================================

        const initialStatusData = hr_remarks || {

            application_status: 'Initial Screening',

            hr_remarks_notes: 'Initial submission'

        };


        await insertHRRemarks(
            client,
            applicantId,
            initialStatusData
        );


        // ======================================================
        // COMMIT TRANSACTION
        // ======================================================

        await client.query('COMMIT');


        // ======================================================
        // SUCCESS RESPONSE
        // ======================================================

        return res.status(201).json({

            success: true,

            message:
                'Application successfully submitted.',

            data: {

                job_applications_id:
                    jobApplicationId,

                applicant_id:
                    applicantId

            }

        });


    } catch (error) {

        // ======================================================
        // ROLLBACK
        // ======================================================

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

        // ======================================================
        // RELEASE CLIENT
        // ======================================================

        client.release();

    }

};


/**
 * ============================================================
 * 2. GET ALL FULL APPLICANTS
 * ============================================================
 *
 * Returns:
 *
 * - Job application
 * - Vacancy
 * - Applicant information
 * - Equal opportunity declarations
 * - Document checklist
 * - Uploaded document paths
 * - HR remarks
 * - Education
 * - Work experience
 * - Trainings
 * - Eligibility
 */
export const getFullApplicants = async (req, res) => {

    try {

        // ======================================================
        // 1. MAIN QUERY
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


/**
 * ============================================================
 * HELPER: GROUP ROWS BY FOREIGN KEY
 * ============================================================
 */

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


/**
 * ============================================================
 * 3. GET APPLICANT BY ID
 * ============================================================
 *
 * Accepts either:
 *
 * applicant_id
 *
 * OR
 *
 * job_applications_id
 */
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