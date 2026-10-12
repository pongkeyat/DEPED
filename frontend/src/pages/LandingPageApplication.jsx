
import React, { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { useLocation } from "react-router-dom";

import StepProgress from "../components/applications/StepProgress";
import ApplicantForm from "../components/applications/ApplicantForm";
import ApplicationForLandingPage from "../components/applications/ApplicationForLandingPage";
import LandingPageDocument from "../components/applications/LandingpageDocument";
import EqualOpportunityDeclaration from "../components/applications/EqualOpportunityDeclaration";
import ApplicantEducationForm from "../components/applications/ApplicantEducationForm";
import ApplicantTrainingForm from "../components/applications/ApplicantTrainingForm";
import CivilServiceEligibilityForm from "../components/applications/CivilServiceEligibilityForm";
import WorkExperienceForm from "../components/applications/WorkExperienceForm";
import LandingPageApplicationHeader from "../components/applications/LandingpageApplicationHeader";
import PhilippineAddressSelector from "../components/applications/PhilippineAddressSelector";
import DocumentPreviewModal from "../components/applications/DocumentPreviewModal";
import ViewApplicationModal from "../components/applications/ViewApplicationModal";
import ActionModal from "../components/ActionModal";

import { postApplications } from "../api/ApplicationApi";
import useFormDraft, { mergeDraft } from "../hooks/useFormDraft";
import { getSubmissionError } from "../utils/submissionError";
import { stripGroupIds } from "../utils/groupRows";

// ============================================================
// WIZARD STEPS
// ============================================================

const STEPS = [
  { id: "vacancy", short: "Vacancy", title: "Vacancy / Position Applied For" },
  { id: "applicant", short: "Applicant", title: "Applicant Information" },
  { id: "education", short: "Education", title: "Educational Background" },
  { id: "training", short: "Training", title: "Relevant Trainings / Seminars" },
  { id: "eligibility", short: "Eligibility", title: "Civil Service Eligibility" },
  { id: "work", short: "Work", title: "Work Experience" },
  { id: "equal", short: "Equal Opp.", title: "Equal Opportunity Declaration" },
  { id: "documents", short: "Documents", title: "Basic Documentary Requirement" },
];

// ============================================================
// INITIAL FORM DATA
// ============================================================

const getJobId = (job) => job?.vacancy_id || job?.id || "";

const createInitialFormData = (selectedJob) => ({
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
    addressParts: {
      province: null,
      city: null,
      barangay: null,
      street: "",
    },
  },

  applicationData: {
    vacancy_id: getJobId(selectedJob),
    dateReceived: new Date().toISOString().split("T")[0],
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
// NORMALIZE WORK EXPERIENCE
// ============================================================

const normalizeWorkExperience = (data) => {
  const list = Array.isArray(data)
    ? data
    : data?.position_title || data?.company_office
      ? [data]
      : [];

  return list.filter(
    (e) =>
      e &&
      ([
        e.position_title,
        e.company_office,
        e.date_from,
        e.date_to,
        e.monthly_salary,
        e.appointment_status,
      ].some((v) => String(v ?? "").trim() !== "") ||
        typeof e.is_govt_service === "boolean")
  );
};

// ============================================================
// REQUIRED DOCUMENTS
// Documents a to k are required; Omnibus Sworn Statement is optional.
// ============================================================

const PORTAL_REQUIRED_DOCS = [
  "has_application_letter",
  "has_personal_data_sheet",
  "has_prc_license_id",
  "has_civil_service_eligibility_cert",
  "has_diploma",
  "has_transcript_of_records",
  "has_training_certificates",
  "has_certificate_of_employment",
  "has_service_record",
  "has_latest_appointment",
  "has_performance_rating",
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function LandingPageApplication({
  selectedJob: selectedJobProp,
}) {
  const location = useLocation();
  const selectedJob = location.state?.job ?? selectedJobProp;
  const formRef = useRef(null);

  const [loading, setLoading] = useState(false);

  // Modals
  const [successModal, setSuccessModal] = useState(false);
  const [applicationTicket, setApplicationTicket] = useState("");
  const [errorModalMessage, setErrorModalMessage] = useState(null);
  const [discardModal, setDiscardModal] = useState(false);

  // Application review modal
  const [viewApplicationModal, setViewApplicationModal] = useState(false);

  // Certification is intentionally not included in the saved draft.
  const [isCertified, setIsCertified] = useState(false);

  // Form and wizard state
  const [formData, setFormData] = useState(() =>
    createInitialFormData(selectedJob)
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState("");

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  // In-app document preview
  const [previewFile, setPreviewFile] = useState(null);

  // ============================================================
  // DRAFT
  // One draft per vacancy; cleared after successful submission.
  // ============================================================

  const { ready, restored, clearDraft } = useFormDraft({
    key: `landing-application-draft-v1:${getJobId(selectedJob) || "general"}`,
    formData,
    step: currentStep,

    onRestore: (saved, step) => {
      const merged = mergeDraft(createInitialFormData(selectedJob), saved);

      // Always retain the vacancy the applicant actually opened.
      if (getJobId(selectedJob)) {
        merged.applicationData = {
          ...merged.applicationData,
          vacancy_id: getJobId(selectedJob),
        };
      }

      setFormData(merged);

      setCurrentStep(
        Number.isInteger(step)
          ? Math.min(Math.max(step, 0), STEPS.length - 1)
          : 0
      );
    },
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // ============================================================
  // RESET AND DISCARD DRAFT
  // ============================================================

  const resetFormData = () => {
    setFormData(createInitialFormData(selectedJob));
    setCurrentStep(0);
    setIsCertified(false);
  };

  const handleDiscardDraft = async () => {
    setDiscardModal(false);
    await clearDraft();
    resetFormData();
  };

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const updateSection = (section) => (name, value) =>
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));

  const handleApplicantChange = updateSection("applicantData");
  const handleApplicationChange = updateSection("applicationData");
  const handleEducationChange = updateSection("educationData");
  const handleTrainingChange = updateSection("trainingData");
  const handleDocumentChange = updateSection("documentData");
  const handleEqualOpportunityChange = updateSection("equalOpportunityData");

  const handleEligibilityChange = (updatedList) =>
    setFormData((prev) => ({
      ...prev,
      eligibilityData: updatedList,
    }));

  const handleWorkExperienceChange = (updatedList) =>
    setFormData((prev) => ({
      ...prev,
      workExperienceData: updatedList,
    }));

  const handleFileUpload = (field, file) =>
    setFormData((prev) => ({
      ...prev,
      documentData: {
        ...prev.documentData,
        [`${field}_file`]: file,
        [field]: true,
      },
    }));

  const handleAddressChange = (parts, fullAddress) =>
    setFormData((prev) => ({
      ...prev,
      applicantData: {
        ...prev.applicantData,
        addressParts: parts,
        address: fullAddress,
      },
    }));

  // ============================================================
  // MISSING REQUIRED DOCUMENTS
  // ============================================================

  const missingRequiredDocs = PORTAL_REQUIRED_DOCS.filter((field) => {
    const file = formData.documentData[`${field}_file`];
    return Array.isArray(file) ? file.length === 0 : !file;
  });

  // ============================================================
  // WIZARD VALIDATION AND NAVIGATION
  // ============================================================

  const validateStep = () => {
    const id = STEPS[currentStep].id;

    if (id === "vacancy" && !formData.applicationData.vacancy_id) {
      return "Please select a vacancy posting.";
    }

    if (id === "education") {
      const incomplete = formData.educationData.educationList.some(
        (e) => !e.level || !String(e.school_name ?? "").trim()
      );

      if (incomplete) {
        return "Please complete the Level and School/University for each education entry.";
      }
    }

    if (id === "work") {
      const missingTitle = normalizeWorkExperience(
        formData.workExperienceData
      ).some((e) => !String(e.position_title ?? "").trim());

      if (missingTitle) {
        return "Please enter the Position Title for each work experience entry, or remove the entry if you don't need it.";
      }
    }

    return "";
  };

  const handleNext = () => {
    const message = validateStep();

    if (message) {
      setStepError(message);
      return;
    }

    if (formRef.current && !formRef.current.reportValidity()) {
      return;
    }

    setStepError("");
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStepError("");
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  // ============================================================
  // SUBMIT APPLICATION
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Pressing Enter on steps 1–7 advances to the next step.
    if (!isLastStep) {
      handleNext();
      return;
    }

    if (!isCertified) {
      setErrorModalMessage(
        "Please read and check the certification checkbox before submitting your application."
      );
      return;
    }

    if (missingRequiredDocs.length > 0) {
      setErrorModalMessage(
        `Please upload the required documents (a to k) in Step 8 before submitting (${missingRequiredDocs.length} remaining).`
      );
      return;
    }

    if (!formData.applicationData.vacancy_id) {
      setErrorModalMessage(
        "Please select a vacancy before submitting your application."
      );
      return;
    }

    setLoading(true);
    setErrorModalMessage(null);

    // Use the actual submission date and time, not the draft's start time.
    const now = new Date();

    const payload = {
      job_applications: {
        vacancy_id: formData.applicationData.vacancy_id || null,
        date_received: now.toISOString().split("T")[0],
        time_received: now.toLocaleTimeString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        received_by: formData.applicationData.receivedBy,
        submission_type: formData.applicationData.submissionType,
      },

      applicant_info: {
        first_name: formData.applicantData.firstName,
        middle_name: formData.applicantData.middleName || null,
        last_name: formData.applicantData.lastName,
        suffix: formData.applicantData.suffix || null,
        sex: formData.applicantData.sex,
        date_of_birth: formData.applicantData.dob,
        civil_status: formData.applicantData.civilStatus,
        email_address: formData.applicantData.email,
        residential_address: formData.applicantData.address,
        contact_number: formData.applicantData.contactNumber || null,
      },

      document_checklist: formData.documentData,
      equal_opportunity: formData.equalOpportunityData,

      education_list: stripGroupIds(
        formData.educationData.educationList
      ),

      // group_id only groups training rows under "Conducted By".
      trainings_list: formData.trainingData.trainings.map(
        ({ group_id, ...training }) => training
      ),

      eligibility_list: stripGroupIds(formData.eligibilityData),

      work_experience_list: stripGroupIds(
        normalizeWorkExperience(formData.workExperienceData)
      ),

      hr_remarks: {
        application_status: "under_review",
        hr_remarks_notes:
          "Application submitted online and pending initial HR review.",
      },
    };

    try {
      const response = await postApplications(payload);

      setApplicationTicket(response?.data?.ticket || "");

      // Clear the draft and form only after successful submission.
      await clearDraft();
      resetFormData();

      setSuccessModal(true);
    } catch (err) {
      console.error(
        "Application submission error:",
        err,
        err.response?.data
      );

      const { message, stepId } = getSubmissionError(err);

      setErrorModalMessage(message);

      // Return the applicant to the step associated with the error.
      if (stepId) {
        const stepIndex = STEPS.findIndex((step) => step.id === stepId);

        if (stepIndex >= 0) {
          setCurrentStep(stepIndex);
        }
      }
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

  const isSubmitDisabled =
    loading || !isCertified || missingRequiredDocs.length > 0;

  // ============================================================
  // SELECTED JOB CARD
  // ============================================================

  const renderJobCard = () =>
    selectedJob && (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-[#1a4480] px-6 py-4 text-white">
          <h2 className="text-2xl font-bold tracking-wide">
            {selectedJob.title}
          </h2>

          <p className="mt-0.5 text-sm font-light text-slate-200">
            Vacancy Code: {selectedJob.vacancyCode}
          </p>
        </div>

        <div className="bg-white p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* POSITION INFORMATION */}
            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-5">
              <h3 className="mb-3 border-b border-sky-100/70 pb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                POSITION INFORMATION
              </h3>

              <div className="space-y-3.5 text-sm text-gray-700">
                <div className="grid grid-cols-3">
                  <span className="text-gray-400">Position Title:</span>
                  <span className="col-span-2 font-bold text-gray-900">
                    {selectedJob.title}
                  </span>
                </div>

                <div className="grid grid-cols-3">
                  <span className="text-gray-400">Salary Grade:</span>
                  <span className="col-span-2 font-bold text-gray-900">
                    {selectedJob.salaryGrade}
                  </span>
                </div>

                <div className="grid grid-cols-3">
                  <span className="text-gray-400">Office Unit:</span>
                  <span className="col-span-2 font-bold text-gray-900">
                    {selectedJob.office}
                  </span>
                </div>

                <div className="grid grid-cols-3">
                  <span className="text-gray-400">No. of Slots:</span>
                  <span className="col-span-2 font-medium text-gray-900">
                    {selectedJob.slots}
                  </span>
                </div>

                <div className="grid grid-cols-3">
                  <span className="text-gray-400">Posting Date:</span>
                  <span className="col-span-2 font-medium text-gray-600">
                    {selectedJob.postingDate}
                  </span>
                </div>

                <div className="grid grid-cols-3">
                  <span className="text-gray-400">Deadline:</span>
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
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-5">
              <h3 className="mb-3 border-b border-emerald-100/70 pb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                QUALIFICATION STANDARDS
              </h3>

              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <p className="mb-0.5 text-xs text-gray-400">Education:</p>
                  <p className="font-medium text-gray-900">
                    {selectedJob.education}
                  </p>
                </div>

                <div>
                  <p className="mb-0.5 text-xs text-gray-400">Training:</p>
                  <p className="font-medium text-emerald-700">
                    {selectedJob.training}
                  </p>
                </div>

                <div>
                  <p className="mb-0.5 text-xs text-gray-400">Experience:</p>
                  <p className="font-medium text-emerald-700">
                    {selectedJob.experience}
                  </p>
                </div>

                <div>
                  <p className="mb-0.5 text-xs text-gray-400">Eligibility:</p>
                  <p className="font-medium text-emerald-700">
                    {selectedJob.eligibility}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* REMARKS */}
          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-700 text-xs font-bold text-white">
              i
            </span>

            <p>
              <strong className="font-bold text-amber-900">Remarks: </strong>
              {selectedJob.remarksText ||
                "No additional instructions provided."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3 text-xs text-gray-500">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[10px] text-gray-400">
            i
          </span>
          <span>Submit application at the HR Office, La Union SDO</span>
        </div>
      </div>
    );

  // ============================================================
  // STEP CONTENT
  // ============================================================

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "vacancy":
        return (
          <>
            {renderJobCard()}

            <ApplicationForLandingPage
              formData={formData.applicationData}
              onChange={handleApplicationChange}
              submissionType="Online"
            />
          </>
        );

      case "applicant":
        return (
          <>
            <ApplicantForm
              formData={formData.applicantData}
              onChange={handleApplicantChange}
            />

            <PhilippineAddressSelector
              value={formData.applicantData.addressParts}
              onChange={handleAddressChange}
            />
          </>
        );

      case "education":
        return (
          <ApplicantEducationForm
            data={formData.educationData}
            onChange={handleEducationChange}
          />
        );

      case "training":
        return (
          <ApplicantTrainingForm
            trainings={formData.trainingData.trainings}
            onChange={handleTrainingChange}
          />
        );

      case "eligibility":
        return (
          <CivilServiceEligibilityForm
            data={formData.eligibilityData}
            onChange={handleEligibilityChange}
          />
        );

      case "work":
        return (
          <WorkExperienceForm
            data={formData.workExperienceData}
            onChange={handleWorkExperienceChange}
          />
        );

      case "equal":
        return (
          <EqualOpportunityDeclaration
            data={formData.equalOpportunityData}
            onChange={handleEqualOpportunityChange}
          />
        );

      case "documents":
        return (
          <>
            <LandingPageDocument
              documents={formData.documentData}
              onChange={handleDocumentChange}
              onFileUpload={handleFileUpload}
              onPreview={setPreviewFile}
              requiredFields={PORTAL_REQUIRED_DOCS}
            />

            {missingRequiredDocs.length > 0 && (
              <div
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                Please upload documents a to k to enable submission (
                {missingRequiredDocs.length} remaining). Item l is optional.
              </div>
            )}

            {/* CERTIFICATION */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="bg-[#1a4480] px-6 py-4 text-white">
                <h2 className="text-lg font-bold tracking-wide">
                  CERTIFICATION
                </h2>

                <p className="mt-1 text-xs text-slate-200">
                  Applicant Certification and Declaration
                </p>
              </div>

              <div className="p-6">
                <label className="flex cursor-pointer select-none items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isCertified}
                    onChange={(e) => setIsCertified(e.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />

                  <span className="text-sm leading-6 text-gray-700">
                    I certify that the information I have provided in this
                    application is true, complete, and accurate to the best of
                    my knowledge. I understand that any false or misleading
                    information may result in the disqualification of my
                    application.
                  </span>
                </label>

                {!isCertified && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-medium text-amber-700">
                      ⚠️ Please read and check the certification box before
                      submitting your application.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="relative min-h-screen space-y-6 bg-gray-50 p-5">
      <LandingPageApplicationHeader />

      <div className="mx-auto max-w-5xl">
        <StepProgress
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={(index) => {
            setStepError("");
            setCurrentStep(index);
          }}
        />
      </div>

      {/* DRAFT NOTICE */}
      {restored && (
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <span>
            Your unsubmitted application was restored. It is saved
            automatically on this device until you submit.
          </span>

          <button
            type="button"
            onClick={() => setDiscardModal(true)}
            className="rounded-lg border border-blue-300 px-3 py-1 font-medium hover:bg-blue-100"
          >
            Discard draft
          </button>
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mx-auto max-w-5xl space-y-6"
      >
        {ready ? (
          renderStep()
        ) : (
          <div className="py-16 text-center text-sm text-gray-500">
            Loading...
          </div>
        )}

        {stepError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {stepError}
          </div>
        )}

        {/* NAVIGATION */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            key="back"
            type="button"
            onClick={handleBack}
            disabled={isFirstStep || loading}
            className="rounded-xl border border-[#1a4480] px-6 py-3 font-semibold text-[#1a4480] transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>

          {isLastStep ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                key="view-application"
                type="button"
                onClick={() => setViewApplicationModal(true)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-[#1a4480] px-5 py-3 font-semibold text-[#1a4480] transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText size={18} />
                View Application
              </button>

              <button
                key="submit"
                type="submit"
                disabled={isSubmitDisabled}
                className={`rounded-xl px-6 py-3 font-semibold text-white transition-all ${
                  isSubmitDisabled
                    ? "cursor-not-allowed bg-gray-400 opacity-60"
                    : "cursor-pointer bg-blue-600 shadow-md hover:bg-blue-700"
                }`}
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          ) : (
            <button
              key="next"
              type="button"
              onClick={handleNext}
              className="rounded-xl bg-[#1a4480] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#143765]"
            >
              Next Page
            </button>
          )}
        </div>
      </form>

      {/* APPLICATION REVIEW MODAL */}
      <ViewApplicationModal
        isOpen={viewApplicationModal}
        onClose={() => setViewApplicationModal(false)}
        formData={formData}
        selectedJob={selectedJob}
        isCertified={isCertified}
      />

      {/* IN-APP DOCUMENT PREVIEW */}
      <DocumentPreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* DISCARD DRAFT MODAL */}
      <ActionModal
        isOpen={discardModal}
        type="warning"
        title="Discard draft?"
        message={
          "Your saved draft will be deleted and the form will be cleared.\nThis cannot be undone."
        }
        onClose={() => setDiscardModal(false)}
        onConfirm={handleDiscardDraft}
      />

      {/* SUCCESS MODAL */}
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

      {/* ERROR MODAL */}
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
