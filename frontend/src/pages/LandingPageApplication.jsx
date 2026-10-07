import React, { useState } from "react";
import { useLocation } from "react-router-dom";

import StepProgress from "../components/applications/StepProgress";
import ApplicantForm from "../components/applications/ApplicantForm";
import Applications from "../components/applications/Applications";
import LandingPageDocument from "../components/applications/LandingpageDocument";
import EqualOpportunityDeclaration from "../components/applications/EqualOpportunityDeclaration";
import ApplicantEducationForm from "../components/applications/ApplicantEducationForm";
import ApplicantTrainingForm from "../components/applications/ApplicantTrainingForm";
import CivilServiceEligibilityForm from "../components/applications/CivilServiceEligibilityForm";
import WorkExperienceForm from "../components/applications/WorkExperienceForm";
import LandingPageApplicationHeader from "../components/applications/LandingpageApplicationHeader";
import ActionModal from "../components/ActionModal";

import { postApplications } from "../api/ApplicationApi";

export default function LandingPageApplication({
  selectedJob: selectedJobProp,
}) {
  const location = useLocation();
  const selectedJob = location.state?.job ?? selectedJobProp;

  const [loading, setLoading] = useState(false);

  // ============================================================
  // MODAL STATES
  // ============================================================

  const [successModal, setSuccessModal] = useState(false);
  const [applicationTicket, setApplicationTicket] = useState("");
  const [errorModalMessage, setErrorModalMessage] = useState(null);

  // ============================================================
  // CERTIFICATION
  // ============================================================

  const [isCertified, setIsCertified] = useState(false);

  // ============================================================
  // FORM DATA
  // ============================================================

  const [formData, setFormData] = useState({
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
      address: "",
    },

    applicationData: {
      vacancy_id:
        selectedJob?.vacancy_id ||
        selectedJob?.id ||
        "",

      dateReceived: new Date()
        .toISOString()
        .split("T")[0],

      timeReceived: new Date().toLocaleTimeString([], {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      }),

      receivedBy: "System Administrator",
      submissionType: "Walk-In",
    },

    educationData: {
      educationList: [
        {
          level: "",
          school_name: "",
          degree_course: "",
          honors_awards: "",
        },
      ],
    },

    trainingData: {
      trainings: [],
    },

    eligibilityData: [],
    workExperienceData: [],

    documentData: {
      has_application_letter: false,
      has_omnibus_sworn_statement: false,
      has_certificate_of_employment: false,
      has_civil_service_eligibility_cert: false,
      has_diploma: false,
      has_medical_certificate: false,
      has_nbi_clearance: false,
      has_performance_rating: false,
      has_personal_data_sheet: false,
      has_prc_license_id: false,
      has_training_certificates: false,
      has_transcript_of_records: false,
      has_voter_id_or_comelec_cert: false,
      has_cert_of_outstanding_accomplishments: false,
      has_marriage_certificate_psa: false,
      has_latest_appointment: false,
      has_service_record: false,
    },

    equalOpportunityData: {
      is_pwd: null,
      is_solo_parent: null,
      is_indigenous_person: null,
    },
  });

  // ============================================================
  // RESET FORM
  // ============================================================

  const resetFormData = () => {
    setFormData({
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
        address: "",
      },

      applicationData: {
        vacancy_id:
          selectedJob?.vacancy_id ||
          selectedJob?.id ||
          "",

        dateReceived: new Date()
          .toISOString()
          .split("T")[0],

        timeReceived: new Date().toLocaleTimeString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),

        receivedBy: "System Administrator",
        submissionType: "Walk-In",
      },

      educationData: {
        educationList: [
          {
            level: "",
            school_name: "",
            degree_course: "",
            honors_awards: "",
          },
        ],
      },

      trainingData: {
        trainings: [],
      },

      eligibilityData: [],
      workExperienceData: [],

      documentData: {
        has_application_letter: false,
        has_omnibus_sworn_statement: false,
        has_certificate_of_employment: false,
        has_civil_service_eligibility_cert: false,
        has_diploma: false,
        has_medical_certificate: false,
        has_nbi_clearance: false,
        has_performance_rating: false,
        has_personal_data_sheet: false,
        has_prc_license_id: false,
        has_training_certificates: false,
        has_transcript_of_records: false,
        has_voter_id_or_comelec_cert: false,
        has_cert_of_outstanding_accomplishments: false,
        has_marriage_certificate_psa: false,
        has_latest_appointment: false,
        has_service_record: false,
      },

      equalOpportunityData: {
        is_pwd: null,
        is_solo_parent: null,
        is_indigenous_person: null,
      },
    });

    setIsCertified(false);
  };

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleApplicantChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      applicantData: {
        ...prev.applicantData,
        [name]: value,
      },
    }));
  };

  const handleApplicationChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      applicationData: {
        ...prev.applicationData,
        [name]: value,
      },
    }));
  };

  const handleEducationChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      educationData: {
        ...prev.educationData,
        [name]: value,
      },
    }));
  };

  const handleTrainingChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      trainingData: {
        ...prev.trainingData,
        [name]: value,
      },
    }));
  };

  const handleEligibilityChange = (updatedList) => {
    setFormData((prev) => ({
      ...prev,
      eligibilityData: updatedList,
    }));
  };

  const handleWorkExperienceChange = (updatedList) => {
    setFormData((prev) => ({
      ...prev,
      workExperienceData: updatedList,
    }));
  };

  const handleDocumentChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      documentData: {
        ...prev.documentData,
        [name]: value,
      },
    }));
  };

  const handleFileUpload = (field, file) => {
    setFormData((prev) => ({
      ...prev,
      documentData: {
        ...prev.documentData,
        [`${field}_file`]: file,
        [field]: true,
      },
    }));
  };

  const handleEqualOpportunityChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      equalOpportunityData: {
        ...prev.equalOpportunityData,
        [name]: value,
      },
    }));
  };

  // ============================================================
  // DOCUMENT CHECKLIST VALIDATION
  // ============================================================

  const isDocumentChecklistValid = () => {
    const mandatoryDocs = [
      "has_application_letter",
      "has_personal_data_sheet",
      "has_transcript_of_records",
      "has_omnibus_sworn_statement",
    ];

    return mandatoryDocs.every(
      (field) =>
        formData.documentData[field] === true &&
        Boolean(formData.documentData[`${field}_file`])
    );
  };

  // ============================================================
  // SUBMIT APPLICATION
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ==========================================================
    // CERTIFICATION VALIDATION
    // ==========================================================

    if (!isCertified) {
      setErrorModalMessage(
        "Please read and check the certification checkbox before submitting your application."
      );
      return;
    }

    // ==========================================================
    // DOCUMENT VALIDATION
    // ==========================================================

    if (!isDocumentChecklistValid()) {
      setErrorModalMessage(
        "Please fulfill all required mandatory documents before submitting."
      );
      return;
    }

    // ==========================================================
    // VACANCY VALIDATION
    // ==========================================================

    if (!formData.applicationData.vacancy_id) {
      setErrorModalMessage(
        "Please select a vacancy before submitting your application."
      );
      return;
    }

    setLoading(true);
    setErrorModalMessage(null);

    // ==========================================================
    // PAYLOAD
    // ==========================================================

    const payload = {
      job_applications: {
        vacancy_id:
          formData.applicationData.vacancy_id || null,

        date_received:
          formData.applicationData.dateReceived,

        time_received:
          formData.applicationData.timeReceived,

        received_by:
          formData.applicationData.receivedBy,

        submission_type:
          formData.applicationData.submissionType,
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
          formData.applicantData.dob,

        civil_status:
          formData.applicantData.civilStatus,

        email_address:
          formData.applicantData.email,

        residential_address:
          formData.applicantData.address,

        contact_number:
          formData.applicantData.contactNumber || null,
      },

      document_checklist:
        formData.documentData,

      equal_opportunity:
        formData.equalOpportunityData,

      education_list:
        formData.educationData.educationList,

      trainings_list:
        formData.trainingData.trainings,

      eligibility_list:
        formData.eligibilityData,

      work_experience_list:
        formData.workExperienceData,

      hr_remarks: {
        application_status: "under_review",

        hr_remarks_notes:
          "Application submitted online and pending initial HR review.",
      },
    };

    // ==========================================================
    // SUBMIT
    // ==========================================================

    try {
      const response = await postApplications(payload);

      // Get generated application ticket
      setApplicationTicket(
        response?.data?.ticket || ""
      );

      // IMPORTANT:
      // Clear all inputs only after successful submission
      resetFormData();

      // Show success modal
      setSuccessModal(true);
    } catch (err) {
      setErrorModalMessage(
        err.response?.data?.message ||
          "An error occurred during submission."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // JOB STATUS
  // ============================================================

  const isJobOpen = (deadlineDate) => {
    if (!deadlineDate) return false;

    return new Date(deadlineDate) >= new Date();
  };

  // ============================================================
  // SUBMIT BUTTON STATE
  // ============================================================

  const isSubmitDisabled =
    loading ||
    !isDocumentChecklistValid() ||
    !isCertified;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="p-5 min-h-screen space-y-6 bg-gray-50 relative">
      <LandingPageApplicationHeader />

      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-w-5xl mx-auto"
      >
        {/* ======================================================
            SELECTED JOB
        ====================================================== */}

        {selectedJob && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#1a4480] text-white px-6 py-4">
              <h2 className="text-2xl font-bold tracking-wide">
                {selectedJob.title}
              </h2>

              <p className="text-slate-200 text-sm font-light mt-0.5">
                Vacancy Code: {selectedJob.vacancyCode}
              </p>
            </div>

            <div className="p-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* POSITION INFORMATION */}

                <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-5">
                  <h3 className="font-bold text-gray-500 text-xs tracking-wider uppercase border-b border-sky-100/70 pb-2 mb-3">
                    POSITION INFORMATION
                  </h3>

                  <div className="space-y-3.5 text-sm text-gray-700">
                    <div className="grid grid-cols-3">
                      <span className="text-gray-400">
                        Position Title:
                      </span>

                      <span className="col-span-2 font-bold text-gray-900">
                        {selectedJob.title}
                      </span>
                    </div>

                    <div className="grid grid-cols-3">
                      <span className="text-gray-400">
                        Salary Grade:
                      </span>

                      <span className="col-span-2 font-bold text-gray-900">
                        {selectedJob.salaryGrade}
                      </span>
                    </div>

                    <div className="grid grid-cols-3">
                      <span className="text-gray-400">
                        Office Unit:
                      </span>

                      <span className="col-span-2 font-bold text-gray-900">
                        {selectedJob.office}
                      </span>
                    </div>

                    <div className="grid grid-cols-3">
                      <span className="text-gray-400">
                        No. of Slots:
                      </span>

                      <span className="col-span-2 font-medium text-gray-900">
                        {selectedJob.slots}
                      </span>
                    </div>

                    <div className="grid grid-cols-3">
                      <span className="text-gray-400">
                        Posting Date:
                      </span>

                      <span className="col-span-2 font-medium text-gray-600">
                        {selectedJob.postingDate}
                      </span>
                    </div>

                    <div className="grid grid-cols-3">
                      <span className="text-gray-400">
                        Deadline:
                      </span>

                      <span className="col-span-2 font-semibold">
                        {isJobOpen(selectedJob.deadline) ? (
                          <span className="text-green-600">
                            {selectedJob.deadline}{" "}
                            <span className="text-xs font-normal text-green-500">
                              (Active)
                            </span>
                          </span>
                        ) : (
                          <span className="text-red-500">
                            {selectedJob.deadline}{" "}
                            <span className="text-xs font-normal text-red-400">
                              (Expired)
                            </span>
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QUALIFICATION STANDARDS */}

                <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-5">
                  <h3 className="font-bold text-gray-500 text-xs tracking-wider uppercase border-b border-emerald-100/70 pb-2 mb-3">
                    QUALIFICATION STANDARDS
                  </h3>

                  <div className="space-y-4 text-sm text-gray-700">
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">
                        Education:
                      </p>

                      <p className="font-medium text-gray-900">
                        {selectedJob.education}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">
                        Training:
                      </p>

                      <p className="font-medium text-emerald-700">
                        {selectedJob.training}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">
                        Experience:
                      </p>

                      <p className="font-medium text-emerald-700">
                        {selectedJob.experience}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">
                        Eligibility:
                      </p>

                      <p className="font-medium text-emerald-700">
                        {selectedJob.eligibility}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* REMARKS */}

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-2.5 text-sm text-amber-900">
                <span className="bg-amber-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  i
                </span>

                <p>
                  <strong className="text-amber-900 font-bold">
                    Remarks:{" "}
                  </strong>

                  {selectedJob.remarksText ||
                    "No additional instructions provided."}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
              <span className="border border-gray-300 text-gray-400 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                i
              </span>

              <span>
                Submit application at the HR Office, La Union SDO
              </span>
            </div>
          </div>
        )}

        {/* ======================================================
            APPLICATION
        ====================================================== */}

        <Applications
          formData={formData.applicationData}
          onChange={handleApplicationChange}
          submissionType="Online"
        />

        {/* ======================================================
            APPLICANT
        ====================================================== */}

        <ApplicantForm
          formData={formData.applicantData}
          onChange={handleApplicantChange}
        />

        {/* ======================================================
            EDUCATION
        ====================================================== */}

        <ApplicantEducationForm
          data={formData.educationData}
          onChange={handleEducationChange}
        />

        {/* ======================================================
            TRAINING
        ====================================================== */}

        <ApplicantTrainingForm
          trainings={formData.trainingData.trainings}
          onChange={handleTrainingChange}
        />

        {/* ======================================================
            ELIGIBILITY
        ====================================================== */}

        <CivilServiceEligibilityForm
          data={formData.eligibilityData}
          onChange={handleEligibilityChange}
        />

        {/* ======================================================
            WORK EXPERIENCE
        ====================================================== */}

        <WorkExperienceForm
          data={formData.workExperienceData}
          onChange={handleWorkExperienceChange}
        />

        {/* ======================================================
            EQUAL OPPORTUNITY
        ====================================================== */}

        <EqualOpportunityDeclaration
          data={formData.equalOpportunityData}
          onChange={handleEqualOpportunityChange}
        />

        {/* ======================================================
            DOCUMENTS
        ====================================================== */}

        <LandingPageDocument
          documents={formData.documentData}
          onChange={handleDocumentChange}
          onFileUpload={handleFileUpload}
        />

        {/* ======================================================
            CERTIFICATION
        ====================================================== */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#1a4480] text-white px-6 py-4">
            <h2 className="text-lg font-bold tracking-wide">
              CERTIFICATION
            </h2>

            <p className="text-slate-200 text-xs mt-1">
              Applicant Certification and Declaration
            </p>
          </div>

          <div className="p-6">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCertified}
                onChange={(e) =>
                  setIsCertified(e.target.checked)
                }
                className="
                  mt-1
                  h-5
                  w-5
                  shrink-0
                  cursor-pointer
                  rounded
                  border-gray-300
                  text-blue-600
                  focus:ring-2
                  focus:ring-blue-500
                "
              />

              <span className="text-sm leading-6 text-gray-700">
                I certify that the information I have provided
                in this application is true, complete, and
                accurate to the best of my knowledge. I understand
                that any false or misleading information may result
                in the disqualification of my application.
              </span>
            </label>

            {!isCertified && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-medium text-amber-700">
                  ⚠️ Please read and check the certification box
                  before submitting your application.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================
            SUBMIT SECTION
        ====================================================== */}

        <div className="flex flex-col items-end space-y-2 pt-2">
          {!isDocumentChecklistValid() && (
            <p className="w-full text-right text-xs text-amber-600 font-medium">
              ⚠️ Please attach and check all required documents
              before submitting.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`px-6 py-3 rounded-xl font-semibold text-white transition-all ${
              isSubmitDisabled
                ? "bg-gray-400 cursor-not-allowed opacity-60"
                : "bg-blue-600 hover:bg-blue-700 shadow-md cursor-pointer"
            }`}
          >
            {loading
              ? "Submitting..."
              : "Submit Application"}
          </button>
        </div>
      </form>

      {/* ========================================================
          SUCCESS MODAL
      ======================================================== */}

      <ActionModal
        isOpen={successModal}
        type="confirm"
        title="Success!"
        message={
          applicationTicket
            ? `Application submitted successfully!\nApplication Ticket: ${applicationTicket}`
            : "Application submitted successfully, but the application ticket was not returned. Please contact the HR Office."
        }
        onClose={() => setSuccessModal(false)}
        onConfirm={() => setSuccessModal(false)}
      />

      {/* ========================================================
          ERROR MODAL
      ======================================================== */}

      <ActionModal
        isOpen={Boolean(errorModalMessage)}
        type="error"
        title="Submission Failed"
        message={errorModalMessage}
        onClose={() => setErrorModalMessage(null)}
      />
    </div>
  );
}