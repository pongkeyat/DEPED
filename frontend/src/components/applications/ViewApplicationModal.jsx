
import React from "react";
import { X, FileText, UserRound, GraduationCap, BriefcaseBusiness, ShieldCheck } from "lucide-react";

const DOCUMENT_LABELS = {
  has_application_letter: "Application Letter",
  has_omnibus_sworn_statement: "Omnibus Sworn Statement",
  has_certificate_of_employment: "Certificate of Employment",
  has_civil_service_eligibility_cert: "Civil Service Eligibility Certificate",
  has_diploma: "Diploma",
  has_medical_certificate: "Medical Certificate",
  has_nbi_clearance: "NBI Clearance",
  has_performance_rating: "Performance Rating",
  has_personal_data_sheet: "Personal Data Sheet",
  has_prc_license_id: "PRC License / ID",
  has_training_certificates: "Training Certificates",
  has_transcript_of_records: "Transcript of Records",
  has_voter_id_or_comelec_cert: "Voter ID / COMELEC Certificate",
  has_cert_of_outstanding_accomplishments: "Certificate of Outstanding Accomplishments",
  has_marriage_certificate_psa: "PSA Marriage Certificate",
  has_latest_appointment: "Latest Appointment",
  has_service_record: "Service Record",
};

const formatLabel = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/^has /i, "")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Not provided";
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, item]) => item !== null && item !== undefined && item !== "")
      .map(([key, item]) => `${formatLabel(key)}: ${formatValue(item)}`)
      .join(" • ") || "Not provided";
  }

  return String(value);
};

const getFileName = (file) => {
  if (!file) return "";

  if (Array.isArray(file)) {
    return file.map(getFileName).filter(Boolean).join(", ");
  }

  if (typeof file === "string") {
    return file;
  }

  return file.name || file.filename || file.originalname || "Uploaded file";
};

const getDocumentStatus = (documents, field) => {
  const file = documents?.[`${field}_file`];

  if (Array.isArray(file) && file.length > 0) {
    return file.map(getFileName).join(", ");
  }

  if (file && !Array.isArray(file)) {
    return getFileName(file);
  }

  return documents?.[field] ? "Marked as provided; file unavailable in preview" : "Not uploaded";
};

const Section = ({ title, icon: Icon, children }) => (
  <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3">
      {Icon && <Icon size={18} className="text-[#1a4480]" />}
      <h3 className="font-bold text-gray-800">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const Field = ({ label, value }) => (
  <div className="min-w-0">
    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p className="break-words text-sm text-gray-900 whitespace-pre-wrap">
      {formatValue(value)}
    </p>
  </div>
);

const FieldGrid = ({ data, exclude = [] }) => {
  const entries = Object.entries(data || {}).filter(
    ([key]) => !exclude.includes(key)
  );

  if (!entries.length) {
    return <p className="text-sm text-gray-500">No entries provided.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <Field key={key} label={formatLabel(key)} value={value} />
      ))}
    </div>
  );
};

export default function ViewApplicationModal({
  isOpen,
  onClose,
  formData,
  selectedJob,
  isCertified,
}) {
  if (!isOpen) return null;

  const applicant = formData?.applicantData || {};
  const application = formData?.applicationData || {};
  const education = formData?.educationData?.educationList || [];
  const trainings = formData?.trainingData?.trainings || [];
  const eligibility = formData?.eligibilityData || [];
  const workExperience = formData?.workExperienceData || [];
  const documents = formData?.documentData || {};
  const equalOpportunity = formData?.equalOpportunityData || {};

  const closeOnBackdrop = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-6"
      onMouseDown={closeOnBackdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-application-title"
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 bg-[#1a4480] px-5 py-4 text-white sm:px-7">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/15 p-2">
              <FileText size={22} />
            </div>
            <div>
              <h2 id="view-application-title" className="text-lg font-bold sm:text-xl">
                Review Application
              </h2>
              <p className="text-xs text-blue-100 sm:text-sm">
                Review the information you entered before submitting.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close application review"
            className="rounded-lg p-2 transition hover:bg-white/15"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">
              Please check every section carefully.
            </p>
            <p className="mt-1 text-sm text-blue-800">
              This is a read-only preview. Close this window to return to the
              application form and correct any information.
            </p>
          </div>

          {/* Vacancy */}
          <Section title="Vacancy / Position Applied For" icon={BriefcaseBusiness}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Position Title" value={selectedJob?.title} />
              <Field label="Vacancy Code" value={selectedJob?.vacancyCode} />
              <Field label="Vacancy ID" value={application.vacancy_id} />
              <Field label="Salary Grade" value={selectedJob?.salaryGrade} />
              <Field label="Office / Unit" value={selectedJob?.office} />
              <Field label="Number of Slots" value={selectedJob?.slots} />
              <Field label="Posting Date" value={selectedJob?.postingDate} />
              <Field label="Application Deadline" value={selectedJob?.deadline} />
              <Field label="Education Qualification" value={selectedJob?.education} />
              <Field label="Training Qualification" value={selectedJob?.training} />
              <Field label="Experience Qualification" value={selectedJob?.experience} />
              <Field label="Eligibility Qualification" value={selectedJob?.eligibility} />
              <div className="sm:col-span-2">
                <Field label="Remarks / Instructions" value={selectedJob?.remarksText} />
              </div>
              <Field label="Submission Type" value="Online" />
            </div>
          </Section>

          {/* Applicant */}
          <Section title="Applicant Information" icon={UserRound}>
            <FieldGrid
              data={applicant}
              exclude={["addressParts"]}
            />

            {applicant.addressParts && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-700">
                  Address Details
                </h4>
                <FieldGrid data={applicant.addressParts} />
              </div>
            )}
          </Section>

          {/* Education */}
          <Section title="Educational Background" icon={GraduationCap}>
            {education.length ? (
              <div className="space-y-4">
                {education.map((item, index) => (
                  <div
                    key={item.id || item.group_id || index}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <h4 className="mb-3 text-sm font-bold text-[#1a4480]">
                      Education Entry {index + 1}
                    </h4>
                    <FieldGrid data={item} exclude={["id", "group_id"]} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No education entries provided.</p>
            )}
          </Section>

          {/* Training */}
          <Section title="Relevant Trainings / Seminars" icon={GraduationCap}>
            {trainings.length ? (
              <div className="space-y-4">
                {trainings.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <h4 className="mb-3 text-sm font-bold text-[#1a4480]">
                      Training Entry {index + 1}
                    </h4>
                    <FieldGrid data={item} exclude={["id", "group_id"]} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No training entries provided.</p>
            )}
          </Section>

          {/* Eligibility */}
          <Section title="Civil Service Eligibility" icon={ShieldCheck}>
            {eligibility.length ? (
              <div className="space-y-4">
                {eligibility.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <h4 className="mb-3 text-sm font-bold text-[#1a4480]">
                      Eligibility Entry {index + 1}
                    </h4>
                    <FieldGrid data={item} exclude={["id", "group_id"]} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No eligibility entries provided.</p>
            )}
          </Section>

          {/* Work Experience */}
          <Section title="Work Experience" icon={BriefcaseBusiness}>
            {workExperience.length ? (
              <div className="space-y-4">
                {workExperience.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <h4 className="mb-3 text-sm font-bold text-[#1a4480]">
                      Work Experience {index + 1}
                    </h4>
                    <FieldGrid data={item} exclude={["id", "group_id"]} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No work experience entries provided.</p>
            )}
          </Section>

          {/* Equal Opportunity */}
          <Section title="Equal Opportunity Declaration" icon={ShieldCheck}>
            <FieldGrid data={equalOpportunity} />
          </Section>

          {/* Documents */}
          <Section title="Basic Documentary Requirements" icon={FileText}>
            <div className="space-y-3">
              {Object.entries(DOCUMENT_LABELS).map(([field, label]) => {
                const uploaded = Boolean(
                  documents[`${field}_file`] &&
                  (!Array.isArray(documents[`${field}_file`]) ||
                    documents[`${field}_file`].length > 0)
                );

                const checked = Boolean(documents[field]);
                const provided = uploaded || checked;

                return (
                  <div
                    key={field}
                    className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {label}
                    </span>

                    <div className="text-sm sm:max-w-[60%] sm:text-right">
                      <span
                        className={
                          provided
                            ? "font-semibold text-emerald-700"
                            : "font-medium text-gray-500"
                        }
                      >
                        {provided ? "Provided" : "Not provided"}
                      </span>
                      {(uploaded || checked) && (
                        <p className="mt-1 break-words text-xs text-gray-500">
                          {getDocumentStatus(documents, field)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-gray-500">
              The preview displays files currently available in the form. Files
              may need to be selected again if the page was refreshed.
            </p>
          </Section>

          {/* Certification */}
          <Section title="Applicant Certification" icon={ShieldCheck}>
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded ${
                  isCertified
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isCertified ? "✓" : "!"}
              </span>
              <div>
                <p className="text-sm leading-6 text-gray-800">
                  I certify that the information I have provided in this
                  application is true, complete, and accurate to the best of my
                  knowledge. I understand that any false or misleading
                  information may result in the disqualification of my
                  application.
                </p>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    isCertified ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {isCertified ? "Certification accepted" : "Not yet certified"}
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:px-7">
          <p className="text-xs text-gray-500">
            Review complete? Close this preview to return to your application.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#1a4480] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143765]"
          >
            Back to Application
          </button>
        </div>
      </div>
    </div>
  );
}
