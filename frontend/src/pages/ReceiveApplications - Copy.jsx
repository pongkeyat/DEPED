import React, { useEffect, useRef, useState } from "react";
import ApplicationHeader from "../components/applications/ApplicationsHeader";
import StepProgress from "../components/applications/StepProgress";
import ApplicantForm from "../components/applications/ApplicantForm";
import Applications from "../components/applications/Applications";
// Same checklist component the Job Application Portal uses (table + thumbnail preview)
import DocumentChecklist from "../components/applications/LandingpageDocument";
import EqualOpportunityDeclaration from "../components/applications/EqualOpportunityDeclaration";
import HRRemarksForm from "../components/applications/HRRemarksForm";
import ApplicantEducationForm from "../components/applications/ApplicantEducationForm";
import ApplicantTrainingForm from "../components/applications/ApplicantTrainingForm";
import CivilServiceEligibilityForm from "../components/applications/CivilServiceEligibilityForm";
import WorkExperienceForm from "../components/applications/WorkExperienceForm";
import PhilippineAddressSelector from "../components/applications/PhilippineAddressSelector";
import DocumentPreviewModal from "../components/applications/DocumentPreviewModal";
import ActionModal from "../components/ActionModal";
import { postApplications } from "../api/ApplicationApi";
import useFormDraft, { mergeDraft } from "../hooks/useFormDraft";
import { getSubmissionError } from "../utils/submissionError";
import { stripGroupIds } from "../utils/groupRows";
import { getVacancies } from "../api/VacancyApi";

// ============================================================
// WIZARD STEPS (one card per step)
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
  { id: "remarks", short: "HR Remarks", title: "HR Remarks & Evaluation" },
];

// ============================================================
// INITIAL FORM DATA (single source of truth, reused by reset)
// ============================================================

const createInitialFormData = () => ({
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
    address: "", // full string, sent to the API
    addressParts: {
      province: null,
      city: null,
      barangay: null,
      street: "",
    },
  },

  applicationData: {
    vacancy_id: "",
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
        units: "",
        graduation_status: "",
      },
    ],
  },

  trainingData: { trainings: [] },

  eligibilityData: [],

  workExperienceData: {
    position_title: "",
    company_office: "",
    date_from: "",
    date_to: "",
    monthly_salary: "",
    appointment_status: "",
    is_govt_service: null,
    is_internal: null,
  },

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
    has_omnibus_sworn_statement: false,
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
    omnibus_sworn_statement_file: null,
  },

  equalOpportunityData: {
    is_pwd: null,
    is_solo_parent: null,
    is_indigenous_person: null,
  },

  hrRemarksData: {
    hr_remarks_notes: "",
    application_status: "",
  },
});

// Work experience rows that actually contain something (empty rows are dropped)
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
        typeof e.is_govt_service === "boolean" ||
        typeof e.is_internal === "boolean")
  );
};

// The 12 required documents (same field names the checklist uses)
const DOCUMENT_FIELDS = Object.keys(createInitialFormData().documentData);

export default function ReceiveApplications() {
  const formRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState(null);
  const [formData, setFormData] = useState(createInitialFormData);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  // In-app document preview (replaces opening a new browser tab)
  const [previewFile, setPreviewFile] = useState(null);
  const [vacancies, setVacancies] = useState([]);

  // ============================================================
  // DRAFT (autosaved; cleared after a successful submit)
  // ============================================================
  const { ready, restored, clearDraft } = useFormDraft({
    key: "receive-application-draft-v1",
    formData,
    step: currentStep,
    onRestore: (saved, step) => {
      setFormData(mergeDraft(createInitialFormData(), saved));
      setCurrentStep(
        Number.isInteger(step) ? Math.min(Math.max(step, 0), STEPS.length - 1) : 0
      );
    },
  });

  const [discardModal, setDiscardModal] = useState(false);

  const handleDiscardDraft = async () => {
    setDiscardModal(false);
    await clearDraft();
    resetForm();
  };

  // ============================================================
  // ALL 12 DOCUMENTS MUST BE UPLOADED BEFORE SUBMITTING
  // ============================================================
  // The checklist stores each upload as uploadedFiles[`${field}_file`]
  // (e.g. "has_diploma_file"), so check those exact keys.
  const missingDocuments = DOCUMENT_FIELDS.filter((field) => {
    const file = formData.uploadedFiles[`${field}_file`];
    return Array.isArray(file) ? file.length === 0 : !file;
  });

  // Scroll to top whenever the step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const resetForm = () => {
    setFormData(createInitialFormData());
    setCurrentStep(0);
  };

  // ============================================================
  // LOAD VACANCIES AND RESOLVE THE SELECTED VACANCY CATEGORY
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadVacancies = async () => {
      try {
        const response = await getVacancies();

        // Support the common API response shapes: array, { data: [] },
        // { vacancies: [] }, and Axios responses wrapping those shapes.
        const body = response?.data ?? response;
        const list = Array.isArray(body)
          ? body
          : Array.isArray(body?.vacancies)
          ? body.vacancies
          : Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body?.rows)
          ? body.rows
          : [];

        if (!cancelled) setVacancies(list);
      } catch (error) {
        console.error("Error loading vacancies for application form:", error);
        if (!cancelled) setVacancies([]);
      }
    };

    loadVacancies();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedVacancy = vacancies.find((vacancy) => {
    const id =
      vacancy?.vacancy_id ??
      vacancy?.id ??
      vacancy?.vacancyId ??
      vacancy?.vacancy_code;

    return String(id ?? "") === String(formData.applicationData.vacancy_id ?? "");
  });

  const selectedVacancyCategory = String(
    selectedVacancy?.category ??
      selectedVacancy?.position_category ??
      selectedVacancy?.vacancy_category ??
      selectedVacancy?.position?.category ??
      selectedVacancy?.position?.position_category ??
      ""
  ).trim();

  // ============================================================
  // CHANGE HANDLERS
  // ============================================================

  const updateSection = (section) => (name, value) =>
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [name]: value },
    }));

  const handleApplicantChange = updateSection("applicantData");
  const handleApplicationChange = updateSection("applicationData");
  const handleEducationChange = updateSection("educationData");
  const handleTrainingChange = updateSection("trainingData");
  const handleDocumentChange = updateSection("documentData");
  const handleEqualOpportunityChange = updateSection("equalOpportunityData");
  const handleHRRemarksChange = updateSection("hrRemarksData");

  const handleEligibilityChange = (updatedList) =>
    setFormData((prev) => ({ ...prev, eligibilityData: updatedList }));

  const handleWorkExperienceChange = (updatedList) =>
    setFormData((prev) => ({ ...prev, workExperienceData: updatedList }));

  const handleFileUpload = (field, file) =>
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: { ...prev.uploadedFiles, [`${field}_file`]: file },
      documentData: { ...prev.documentData, [field]: true },
    }));

  // Address selector gives us the structured parts + the joined string
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
  // WIZARD NAVIGATION
  // ============================================================

  // Checks that don't rely on a native `required` attribute
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

    // Native validation of the inputs on the current step
    if (formRef.current && !formRef.current.reportValidity()) return;

    setStepError("");
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStepError("");
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Pressing Enter inside an input on steps 1-8 must go to the next step,
    // never submit the whole application.
    if (!isLastStep) {
      handleNext();
      return;
    }

    if (missingDocuments.length > 0) {
      setErrorModalMessage(
        `Please upload all Basic Documentary Requirements before submitting (${missingDocuments.length} remaining).`
      );
      return;
    }

    setLoading(true);
    setErrorModalMessage(null);

    const documentChecklist = { ...formData.documentData };

    const submittedWorkExperience = normalizeWorkExperience(
      formData.workExperienceData
    ).map((experience) => ({
      ...experience,
      is_internal:
        typeof experience.is_internal === "boolean"
          ? experience.is_internal
          : null,
    }));

    const payload = {
      job_applications: {
        vacancy_id: formData.applicationData.vacancy_id || null,
        date_received: formData.applicationData.dateReceived,
        time_received: formData.applicationData.timeReceived,
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

      document_checklist: documentChecklist,
      equal_opportunity: formData.equalOpportunityData,
      education_list: stripGroupIds(
        formData.educationData.educationList.map((education) => ({
          ...education,
          // Graduated = units are automatic, so nothing is sent
          units:
            education.graduation_status === "Graduated"
              ? null
              : education.units,
          graduation_status: education.graduation_status || null,
        }))
      ),
      // group_id is only used by the form to group rows under one "Conducted By"
      trainings_list: formData.trainingData.trainings.map(
        ({ group_id, day_type, ...training }) => training
      ),
      eligibility_list: stripGroupIds(formData.eligibilityData),
      work_experience_list: stripGroupIds(submittedWorkExperience),

      hr_remarks: {
        ...formData.hrRemarksData,
        application_status:
          formData.hrRemarksData.application_status || "Complete",
      },
    };

    try {
      await postApplications(payload, formData.uploadedFiles);
      clearDraft(); // submitted: the saved draft is no longer needed
      resetForm();
      setSuccessModal(true);
    } catch (err) {
      console.error("Application submission error:", err, err.response?.data);

      const { message, stepId } = getSubmissionError(err);
      setErrorModalMessage(message);

      // Jump to the step that failed, so the user can fix it right away
      if (stepId) {
        const stepIndex = STEPS.findIndex((step) => step.id === stepId);
        if (stepIndex >= 0) setCurrentStep(stepIndex);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // STEP CONTENT
  // ============================================================

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "vacancy":
        return (
          <Applications
            formData={formData.applicationData}
            onChange={handleApplicationChange}
            submissionType="Onsite"
          />
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
            category={selectedVacancyCategory}
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
          <DocumentChecklist
            documents={formData.documentData}
            uploadedFiles={formData.uploadedFiles}
            onChange={handleDocumentChange}
            onFileUpload={handleFileUpload}
            onPreview={setPreviewFile}
            requiredFields={DOCUMENT_FIELDS}
          />
        );

      case "remarks":
        return (
          <HRRemarksForm
            data={formData.hrRemarksData}
            onChange={handleHRRemarksChange}
          />
        );

      default:
        return null;
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen p-6 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="[&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-[#1E3E74]">
          <ApplicationHeader />
        </div>

        {/* STEP PROGRESS */}
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
              Your unsubmitted draft was restored. It is saved automatically
              until you submit.
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

        {/* FORM */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="mx-auto max-w-5xl space-y-6"
        >
          {ready ? (
            renderStep()
          ) : (
            <div className="py-16 text-center text-sm text-slate-500">
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

          {isLastStep && missingDocuments.length > 0 && (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              Upload all Basic Documentary Requirements in Step 8 to enable
              submission ({missingDocuments.length} remaining).
            </div>
          )}

          {/* NAVIGATION */}
          <div className="flex items-center justify-between pt-4">
            <button
              key="back"
              type="button"
              onClick={handleBack}
              disabled={isFirstStep || loading}
              className="rounded-xl border border-[#1E3E74] px-6 py-3 font-semibold text-[#1E3E74] transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>

            {isLastStep ? (
              <button
                key="submit"
                type="submit"
                disabled={loading || missingDocuments.length > 0}
                className="rounded-xl bg-[#1E3E74] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#17325e] disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            ) : (
              <button
                key="next"
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-[#1E3E74] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#17325e]"
              >
                Next Page
              </button>
            )}
          </div>
        </form>

        {/* IN-APP DOCUMENT PREVIEW */}
        <DocumentPreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />

        <ActionModal
          isOpen={discardModal}
          type="warning"
          title="Discard draft?"
          message={"Your saved draft will be deleted and the form will be cleared.\nThis cannot be undone."}
          onClose={() => setDiscardModal(false)}
          onConfirm={handleDiscardDraft}
        />

        <ActionModal
          isOpen={successModal}
          type="confirm"
          title="Success!"
          message={"Application submitted successfully!\nKindly check your email."}
          onClose={() => setSuccessModal(false)}
          onConfirm={() => setSuccessModal(false)}
        />

        <ActionModal
          isOpen={Boolean(errorModalMessage)}
          type="error"
          title="Submission Failed"
          message={errorModalMessage}
          onClose={() => setErrorModalMessage(null)}
        />
      </div>
    </div>
  );
}