
import React, { useEffect, useState } from "react";
import { updateApplicant } from "../../api/ApplicationApi";
import ApplicantEducationForm from "./ApplicantEducationForm";
import ApplicantTrainingForm from "./ApplicantTrainingForm";
import CivilServiceEligibilityForm from "./CivilServiceEligibilityForm";
import WorkExperienceForm from "./WorkExperienceForm";
import EqualOpportunityDeclaration from "./EqualOpportunityDeclaration";
import DocumentChecklist from "./DocumentChecklist";
import HRRemarksForm from "./HRRemarksForm";
import ActionModal from "../ActionModal";

const initialFormData = {
    applicantData: {
        lastName: "",
        firstName: "",
        middleName: "",
        suffix: "",
        sex: "",
        dob: "",
        civilStatus: "",
        contactNumber: "",
        email: "",
        address: ""
    },

    applicationData: {
        vacancy_id: "",
        dateReceived: "",
        timeReceived: "",
        receivedBy: "",
        submissionType: ""
    },

    educationData: {
        educationList: []
    },

    trainingData: {
        trainings: []
    },

    eligibilityData: [],

    workExperienceData: [],

    documentData: {
        has_application_letter: false,
        has_personal_data_sheet: false,
        has_prc_license_id: false,
        has_civil_service_eligibility_cert: false,
        has_diploma: false,
        has_transcript_of_records: false,
        has_training_certificates: false,
        has_certificate_of_employment: false,
        has_service_record: false,
        has_latest_appointment: false,
        has_performance_rating: false,
        has_omnibus_sworn_statement: false
    },

    uploadedFiles: {
        application_letter_file: null,
        personal_data_sheet_file: null,
        prc_license_id_file: null,
        civil_service_eligibility_cert_file: null,
        diploma_file: null,
        transcript_of_records_file: null,
        training_certificates_file: [],
        certificate_of_employment_file: null,
        service_record_file: null,
        latest_appointment_file: null,
        performance_rating_file: null,
        omnibus_sworn_statement_file: null
    },

    equalOpportunityData: {
        is_pwd: null,
        is_solo_parent: null,
        is_indigenous_person: null
    },

    hrRemarksData: {
        hr_remarks_notes: "",
        application_status: ""
    }
};

// ======================================================
// HELPERS
// ======================================================

const firstDefined = (...values) =>
    values.find((value) => value !== undefined && value !== null);

const toDateInput = (value) => {
    if (!value) return "";

    return String(value).slice(0, 10);
};

const toTimeInput = (value) => {
    if (!value) return "";

    return String(value).slice(0, 5);
};

const asArray = (value) =>
    Array.isArray(value) ? value : [];

const normalizeUploadedFiles = (applicant) => {
    const uploadedFiles = {
        ...initialFormData.uploadedFiles
    };

    if (!applicant) {
        return uploadedFiles;
    }

    const uploadedSource = {
        ...(applicant.document_checklist ||
            applicant.applicant_documents ||
            applicant.documentData ||
            {}),
        ...(applicant.uploaded_files ||
            applicant.applicant_uploaded_files ||
            applicant.uploadedFiles ||
            {})
    };

    const documentFields = [
        "application_letter",
        "personal_data_sheet",
        "prc_license_id",
        "civil_service_eligibility_cert",
        "diploma",
        "transcript_of_records",
        "training_certificates",
        "certificate_of_employment",
        "service_record",
        "latest_appointment",
        "performance_rating",
        "omnibus_sworn_statement"
    ];

    documentFields.forEach((field) => {
        const fileKey = `${field}_file`;

        const candidate = firstDefined(
            uploadedSource[`${field}_path`],
            uploadedSource[`${field}_file_path`],
            uploadedSource[fileKey],
            applicant[`${field}_path`],
            applicant[`${field}_file_path`],
            applicant[fileKey],
            applicant[`${field}_url`],
            applicant[`${field}_filename`]
        );

        if (
            candidate === undefined ||
            candidate === null ||
            candidate === ""
        ) {
            return;
        }

        const normalizedValue =
            Array.isArray(candidate)
                ? candidate.filter((value) =>
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                )
                : candidate;

        uploadedFiles[fileKey] =
            field === "training_certificates" &&
            !Array.isArray(normalizedValue)
                ? [normalizedValue]
                : normalizedValue;
    });

    return uploadedFiles;
};

const normalizeApplicant = (applicant) => {
    if (!applicant) return initialFormData;

    const applicantInfo =
        applicant.applicant_info ||
        applicant.applicant_information ||
        applicant.applicantData ||
        applicant;

    const application =
        applicant.job_application ||
        applicant.jobApplications ||
        applicant.applicationData ||
        applicant;

    const documents =
        applicant.document_checklist ||
        applicant.applicant_documents ||
        applicant.documentData ||
        {};

    const equalOpportunity =
        applicant.equal_opportunity ||
        applicant.equal_opportunity_declarations ||
        applicant.equalOpportunityData ||
        {};

    const hrRemarks =
        applicant.hr_remarks ||
        applicant.hr_remarks_final_notes ||
        applicant.hrRemarksData ||
        {};

    const education = asArray(
        firstDefined(
            applicant.education_list,
            applicant.educationData?.educationList,
            applicant.education
        )
    );

    const trainings = asArray(
        firstDefined(
            applicant.trainings_list,
            applicant.trainingData?.trainings,
            applicant.relevant_trainings
        )
    );

    const eligibility = asArray(
        firstDefined(
            applicant.eligibility_list,
            applicant.eligibilityData,
            applicant.civil_service_eligibility
        )
    );

    const workExperience = asArray(
        firstDefined(
            applicant.work_experience_list,
            applicant.workExperienceData,
            applicant.work_experience
        )
    );

    return {
        applicantData: {
            lastName: firstDefined(
                applicantInfo.last_name,
                applicantInfo.lastName,
                ""
            ),
            firstName: firstDefined(
                applicantInfo.first_name,
                applicantInfo.firstName,
                ""
            ),
            middleName: firstDefined(
                applicantInfo.middle_name,
                applicantInfo.middleName,
                ""
            ),
            suffix: firstDefined(
                applicantInfo.suffix,
                ""
            ),
            sex: firstDefined(
                applicantInfo.sex,
                ""
            ),
            dob: toDateInput(
                firstDefined(
                    applicantInfo.date_of_birth,
                    applicantInfo.dob
                )
            ),
            civilStatus: firstDefined(
                applicantInfo.civil_status,
                applicantInfo.civilStatus,
                ""
            ),
            contactNumber: firstDefined(
                applicantInfo.contact_number,
                applicantInfo.contactNumber,
                ""
            ),
            email: firstDefined(
                applicantInfo.email_address,
                applicantInfo.email,
                ""
            ),
            address: firstDefined(
                applicantInfo.residential_address,
                applicantInfo.address,
                ""
            )
        },

        applicationData: {
            vacancy_id: firstDefined(
                application.vacancy_id,
                application.vacancyId,
                application.vacancy?.vacancy_id,
                ""
            ),
            dateReceived: toDateInput(
                firstDefined(
                    application.date_received,
                    application.dateReceived,
                    ""
                )
            ),
            timeReceived: toTimeInput(
                firstDefined(
                    application.time_received,
                    application.timeReceived,
                    ""
                )
            ),
            receivedBy: firstDefined(
                application.received_by,
                application.receivedBy,
                ""
            ),
            submissionType: firstDefined(
                application.submission_type,
                application.submissionType,
                ""
            )
        },

        educationData: {
            educationList: education.map((item) => ({
                ...item,
                level: firstDefined(item.level, item.education_level, ""),
                school_name: firstDefined(item.school_name, ""),
                degree_course: firstDefined(item.degree_course, ""),
                honors_awards: firstDefined(item.honors_awards, ""),
                units: firstDefined(item.units, ""),
                date_from: toDateInput(firstDefined(item.date_from, item.education_date_from, item.start_date)),
                date_to: toDateInput(firstDefined(item.date_to, item.education_date_to, item.end_date))
            }))
        },

        trainingData: {
            trainings: trainings.map((item) => ({
                ...item,
                training_title: firstDefined(
                    item.training_title,
                    item.title,
                    ""
                ),
                title: firstDefined(
                    item.title,
                    item.training_title,
                    ""
                ),
                date_from: toDateInput(
                    firstDefined(item.date_from, item.training_date_from, item.start_date)
                ),
                date_to: toDateInput(
                    firstDefined(item.date_to, item.training_date_to, item.end_date)
                )
            }))
        },

        eligibilityData: eligibility.map((item) => ({
            ...item,
            date_of_exam: toDateInput(
                firstDefined(item.date_of_exam, item.exam_date, item.date_taken)
            ),
            validity_date: toDateInput(
                firstDefined(item.validity_date, item.expiration_date, item.expiry_date)
            )
        })),

        workExperienceData: workExperience.map((item) => ({
            ...item,
            position_title: firstDefined(
                item.position_title,
                ""
            ),
            company_office: firstDefined(
                item.company_office,
                ""
            ),
            date_from: toDateInput(
                firstDefined(
                    item.experience_date_from,
                    item.date_from
                )
            ),
            date_to: toDateInput(
                firstDefined(
                    item.experience_date_to,
                    item.date_to
                )
            ),
            monthly_salary: firstDefined(
                item.monthly_salary,
                ""
            ),
            appointment_status: firstDefined(
                item.appointment_status,
                ""
            ),
            is_govt_service: firstDefined(
                item.is_govt_service,
                null
            )
        })),

        documentData: {
            ...initialFormData.documentData,
            ...documents
        },

        uploadedFiles: normalizeUploadedFiles(applicant),

        equalOpportunityData: {
            is_pwd: firstDefined(
                equalOpportunity.is_pwd,
                null
            ),
            is_solo_parent: firstDefined(
                equalOpportunity.is_solo_parent,
                null
            ),
            is_indigenous_person: firstDefined(
                equalOpportunity.is_indigenous_person,
                null
            )
        },

        hrRemarksData: {
            hr_remarks_notes: firstDefined(
                hrRemarks.hr_remarks_notes,
                hrRemarks.hr_remarks,
                ""
            ),
            application_status: firstDefined(
                hrRemarks.application_status,
                applicant.application_status,
                ""
            )
        }
    };
};


// ======================================================
// EDIT APPLICANT MODAL
// ======================================================

export default function ApplicantEditModal({
    isOpen,
    applicant,
    applicantId,
    onClose,
    onUpdated
}) {
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [successModal, setSuccessModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] =
        useState(null);

    // ======================================================
    // LOAD APPLICANT DATA
    // ======================================================

    useEffect(() => {
        if (isOpen && applicant) {
            setFormData(normalizeApplicant(applicant));
            setSuccessModal(false);
            setErrorModalMessage(null);
        }
    }, [isOpen, applicant]);

    if (!isOpen) return null;

    // ======================================================
    // UPDATE NESTED FORM STATE
    // ======================================================

    const updateSection = (section, name, value) => {
        setFormData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [name]: value
            }
        }));
    };
const handleApplicationChange = (name, value) => {
        updateSection("applicationData", name, value);
    };

    const handleEducationChange = (name, value) => {
        updateSection("educationData", name, value);
    };

    const handleTrainingChange = (name, value) => {
        updateSection("trainingData", name, value);
    };

    const handleEligibilityChange = (updatedList) => {
        setFormData((prev) => ({
            ...prev,
            eligibilityData: updatedList
        }));
    };

    const handleWorkExperienceChange = (updatedList) => {
        setFormData((prev) => ({
            ...prev,
            workExperienceData: Array.isArray(updatedList)
                ? updatedList
                : updatedList
                    ? [updatedList]
                    : []
        }));
    };

    const handleDocumentChange = (name, value) => {
        updateSection("documentData", name, value);
    };

    const handleEqualOpportunityChange = (name, value) => {
        updateSection("equalOpportunityData", name, value);
    };

    const handleHRRemarksChange = (name, value) => {
        updateSection("hrRemarksData", name, value);
    };

    // ======================================================
    // FILE UPLOAD
    // ======================================================

    const handleFileUpload = (field, file) => {
        setFormData((prev) => ({
            ...prev,

            uploadedFiles: {
                ...prev.uploadedFiles,
                [`${field}_file`]: file
            },

            documentData: {
                ...prev.documentData,
                [field]: Boolean(
                    Array.isArray(file)
                        ? file.length
                        : file
                )
            }
        }));
    };

    // ======================================================
    // BUILD UPDATE PAYLOAD
    // ======================================================

    const buildPayload = () => {
        const applicationData = formData?.applicationData || {};

        return {
            job_applications: {
                vacancy_id:
                    applicationData.vacancy_id || null,

                date_received:
                    applicationData.dateReceived || null,

                time_received:
                    applicationData.timeReceived || null,

                received_by:
                    applicationData.receivedBy || null,

                submission_type:
                    applicationData.submissionType || null
            },

            applicant_info: {
                first_name:
                    formData.applicantData.firstName,

                middle_name:
                    formData.applicantData.middleName || null,

                last_name:
                    formData.applicantData.lastName,

                suffix:
                    formData.applicantData.suffix || null,

                sex:
                    formData.applicantData.sex,

                date_of_birth:
                    formData.applicantData.dob || null,

                civil_status:
                    formData.applicantData.civilStatus,

                email_address:
                    formData.applicantData.email,

                residential_address:
                    formData.applicantData.address,

                contact_number:
                    formData.applicantData.contactNumber || null
            },

            document_checklist: {
                ...formData.documentData
            },

            equal_opportunity: {
                ...formData.equalOpportunityData
            },

            education_list:
                formData.educationData.educationList || [],

            trainings_list:
                formData.trainingData.trainings || [],

            eligibility_list:
                formData.eligibilityData || [],

            work_experience_list:
                formData.workExperienceData || [],

            hr_remarks: {
                ...formData.hrRemarksData
            }
        };
    };

    // ======================================================
    // SAVE APPLICANT
    // ======================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        const id =
            applicantId ||
            applicant?.job_applications_id ||
            applicant?.applicant_id;

        if (!id) {
            setErrorModalMessage(
                "Applicant ID is missing. Please select an applicant again."
            );
            return;
        }

        setLoading(true);
        setErrorModalMessage(null);

        try {
            const payload = buildPayload();

            const response = await updateApplicant(
                id,
                payload,
                formData.uploadedFiles
            );

            if (
                response?.success === false
            ) {
                throw new Error(
                    response.message ||
                    "The applicant could not be updated."
                );
            }

            onUpdated?.();
            onClose?.();

        } catch (error) {
            console.error(
                "Update applicant error:",
                error
            );

            setErrorModalMessage(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error.message ||
                "Failed to update applicant."
            );
        } finally {
            setLoading(false);
        }
    };

    // ======================================================
    // RENDER
    // ======================================================

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-6">
                <div className="relative flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl">

                    {/* HEADER */}
                    <div className="flex items-center justify-between border-b bg-white px-5 py-4 sm:px-7">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                Edit Applicant
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Update applicant information and application documents.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
                            aria-label="Close modal"
                        >
                            &times;
                        </button>
                    </div>

                    {/* FORM CONTENT */}
                    <form
                        onSubmit={handleSubmit}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-7">
{/* EDUCATION */}
                            <ApplicantEducationForm
                                data={formData.educationData}
                                onChange={handleEducationChange}
                            />

                            {/* TRAINING */}
                            <ApplicantTrainingForm
                                trainings={
                                    formData.trainingData.trainings
                                }
                                onChange={handleTrainingChange}
                            />

                            {/* ELIGIBILITY */}
                            <CivilServiceEligibilityForm
                                data={formData.eligibilityData}
                                onChange={handleEligibilityChange}
                            />

                            {/* WORK EXPERIENCE */}
                            <WorkExperienceForm
                                data={formData.workExperienceData}
                                onChange={handleWorkExperienceChange}
                            />

                            {/* EQUAL OPPORTUNITY */}
                            <EqualOpportunityDeclaration
                                data={formData.equalOpportunityData}
                                onChange={handleEqualOpportunityChange}
                            />

                            {/* DOCUMENT CHECKLIST */}
                            <DocumentChecklist
                                documents={formData.documentData}
                                uploadedFiles={formData.uploadedFiles}
                                onChange={handleDocumentChange}
                                onFileUpload={handleFileUpload}
                            />

                            {/* HR REMARKS */}
                            <HRRemarksForm
                                data={formData.hrRemarksData}
                                onChange={handleHRRemarksChange}
                            />

                        </div>

                        {/* FOOTER BUTTONS */}
                        <div className="flex flex-col-reverse gap-3 border-t bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                            >
                                {loading
                                    ? "Saving Changes..."
                                    : "Save Changes"}
                            </button>

                        </div>
                    </form>
                </div>
            </div>

            {/* SUCCESS MODAL */}
            <ActionModal
                isOpen={successModal}
                type="confirm"
                title="Applicant Updated"
                message="The applicant information has been updated successfully."
                onClose={() => {
                    setSuccessModal(false);
                    onUpdated?.();
                    onClose?.();
                }}
                onConfirm={() => {
                    setSuccessModal(false);
                    onUpdated?.();
                    onClose?.();
                }}
            />

            {/* ERROR MODAL */}
            <ActionModal
                isOpen={Boolean(errorModalMessage)}
                type="error"
                title="Update Failed"
                message={errorModalMessage}
                onClose={() => setErrorModalMessage(null)}
            />
        </>
    );
}