import { useState } from "react";
import {
  X,
  FileText,
  UserRound,
  GraduationCap,
  BriefcaseBusiness,
  ShieldCheck,
} from "lucide-react";
import DocumentPreviewModal from "./DocumentPreviewModal";
import DocumentFileThumbnail from "./DocumentFileThumbnail";

// Same 12 requirements (a to l) and order as the Basic Documentary Requirement
// table, with the "if applicable" / "if available" notes left out.
const DOCUMENT_REQUIREMENTS = [
  {
    field: "has_application_letter",
    label:
      "Letter of intent addressed to the Head of Office, or to the highest human resource officer designated by the Head of Office",
  },
  {
    field: "has_personal_data_sheet",
    label:
      "Duly accomplished Personal Data Sheet (PDS) (CS Form No. 212, Revised 2017) with Work Experience Sheet",
  },
  {
    field: "has_prc_license_id",
    label: "Photocopy of valid and updated PRC License/ID",
  },
  {
    field: "has_civil_service_eligibility_cert",
    label: "Photocopy of Certificate of Eligibility/Rating",
  },
  {
    field: "has_diploma",
    label:
      "Photocopy of scholastic/academic record such as Diploma, including completion of graduate and post-graduate units/degrees",
  },
  {
    field: "has_transcript_of_records",
    label:
      "Photocopy of scholastic/academic record such as Transcript of Records (TOR), including completion of graduate and post-graduate units/degrees",
  },
  {
    field: "has_training_certificates",
    label: "Photocopy of Certificate/s of Training",
  },
  {
    field: "has_certificate_of_employment",
    label:
      "Photocopy of Certificate of Employment, Contract of Service, or duly signed Service Record",
  },
  {
    field: "has_service_record",
    label: "Photocopy of Service Record",
  },
  {
    field: "has_latest_appointment",
    label: "Photocopy of latest appointment",
  },
  {
    field: "has_performance_rating",
    label:
      "Photocopy of the Performance Rating in the last rating period(s) covering one (1) year performance in the current/latest position prior to the deadline of submission",
  },
  {
    field: "has_omnibus_sworn_statement",
    label:
      "Checklist of Requirements and Omnibus Sworn Statement on the Certification on the Authenticity and Veracity (CAV) of the documents submitted and Data Privacy Consent Form",
  },
];

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

// Uploaded files of one requirement, as a list
const getUploadedFiles = (documents, field) =>
  [].concat(documents?.[`${field}_file`] ?? []).filter(Boolean);

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
  // Must stay above the early return below (rules of hooks)
  const [previewFile, setPreviewFile] = useState(null);

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
    <>
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

            {/* Documents (same a-l table layout as the application form) */}
            <Section title="Basic Documentary Requirements" icon={FileText}>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="w-12 border border-gray-300 py-3 text-gray-700">
                        #
                      </th>

                      <th className="border border-gray-300 px-4 py-3 text-left text-gray-700">
                        Basic Documentary Requirement
                      </th>

                      <th className="w-36 border border-gray-300 text-gray-700">
                        Document
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {DOCUMENT_REQUIREMENTS.map(({ field, label }, index) => {
                      const files = getUploadedFiles(documents, field);
                      const uploaded = files.length > 0;
                      const previewable = files.filter((f) => f instanceof File);

                      return (
                        <tr key={field} className="bg-white">
                          {/* Letter a to l */}
                          <td className="border border-gray-300 py-3 text-center align-top font-medium text-gray-600">
                            {String.fromCharCode(97 + index)}.
                          </td>

                          {/* Requirement + uploaded file name(s) */}
                          <td className="border border-gray-300 px-4 py-3 leading-6 text-gray-800">
                            <span>{label}</span>

                            {uploaded && (
                              <div className="mt-2 space-y-1">
                                {files.map((file, i) => (
                                  <span
                                    key={`${field}-${i}`}
                                    className="flex items-center gap-1 text-xs text-green-600"
                                  >
                                    <FileText size={12} />
                                    {getFileName(file)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Uploaded file thumbnail, or "Not uploaded" */}
                          <td className="border border-gray-300 py-2 text-center align-middle">
                            {uploaded ? (
                              <div className="flex items-center justify-center gap-2">
                                {previewable.length > 0 && (
                                  <DocumentFileThumbnail
                                    files={previewable}
                                    onPreview={setPreviewFile}
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">
                                Not uploaded
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

      {/* In-app file preview (sits above this modal) */}
      <DocumentPreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </>
  );
}