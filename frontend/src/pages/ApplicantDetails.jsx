import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  User,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Eye,
  Pencil
} from "lucide-react";

import {
  getApplicationById,
  updateApplicationStatus
} from "../api/ApplicationApi";

import ActionModal from "../components/ActionModal";
import ApplicantEditModal from "../components/applications/ApplicantEditModal";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";


// ============================================================
// STATUS STYLES
// ============================================================

const getStatusStyles = (status) => {

  const normalized =
    (status || "").toLowerCase().trim();


  if (normalized === "complete") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  if (normalized === "incomplete") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  if (
    normalized === "under_review" ||
    normalized === "under review"
  ) {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }

  if (normalized === "initial screening") {
    return "bg-orange-100 text-orange-700 border-orange-200";
  }

  if (normalized === "for assessment") {
    return "bg-violet-100 text-violet-700 border-violet-200";
  }

  if (normalized === "ranked") {
    return "bg-teal-100 text-teal-700 border-teal-200";
  }

  return "bg-slate-100 text-slate-700 border-slate-200";
};


// ============================================================
// DOCUMENT REQUIREMENTS
// ============================================================
//
// IMPORTANT:
// These fields must match applicant_documents.
//
// ============================================================

const DOCUMENT_REQUIREMENTS = [

  {
    field: "has_application_letter",
    label:
      "Letter of Intent"
  },

  {
    field: "has_personal_data_sheet",
    label:
      "Personal Data Sheet (PDS) with Work Experience Sheet"
  },

  {
    field: "has_prc_license_id",
    label:
      "PRC License/ID"
  },

  {
    field: "has_civil_service_eligibility_cert",
    label:
      "Certificate of Eligibility/Rating"
  },

  {
    field: "has_diploma",
    label:
      "Diploma"
  },

  {
    field: "has_transcript_of_records",
    label:
      "Transcript of Records (TOR) / Academic Record"
  },

  {
    field: "has_training_certificates",
    label:
      "Certificate/s of Training"
  },

  {
    field: "has_certificate_of_employment",
    label:
      "Certificate of Employment / Contract of Service"
  },

  {
    field: "has_service_record",
    label:
      "Service Record"
  },

  {
    field: "has_latest_appointment",
    label:
      "Latest Appointment"
  },

  {
    field: "has_performance_rating",
    label:
      "Performance Rating"
  },

  {
    field: "has_omnibus_sworn_statement",
    label:
      "Checklist of Requirements and Omnibus Sworn Statement"
  }

];


// ============================================================
// RESOLVE FILE URL
// ============================================================

const resolveFileUrl = (urlOrPath) => {

  if (!urlOrPath) {
    return null;
  }


  /*
   * If the value is an array, return the first file.
   * Multiple training certificates are handled separately
   * in getDocumentFiles().
   */

  const filePath =
    Array.isArray(urlOrPath)
      ? urlOrPath[0]
      : urlOrPath;


  if (
    !filePath ||
    typeof filePath !== "string"
  ) {
    return null;
  }


  const normalizedPath =
    filePath
      .trim()
      .replace(/\\/g, "/");


  if (!normalizedPath) {
    return null;
  }


  /*
   * Already a complete URL
   */

  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://")
  ) {
    return normalizedPath;
  }


  /*
   * Normalize uploads path
   */

  const cleanPath =
    normalizedPath.startsWith("/uploads/")
      ? normalizedPath
      : normalizedPath.startsWith("uploads/")
        ? `/${normalizedPath}`
        : `/uploads/${normalizedPath.replace(/^\/+/, "")}`;


  return `${API_BASE_URL.replace(/\/+$/, "")}${cleanPath}`;
};


// ============================================================
// GET ALL FILES FOR A DOCUMENT
// ============================================================

const getDocumentFiles = (applicant, field) => {

  if (!applicant) {
    return [];
  }


  const rawKey =
    field.replace(/^has_/, "");


  const possibleValues = [

    applicant[`${rawKey}_url`],

    applicant[`${rawKey}_file_path`],

    applicant[`${rawKey}_path`],

    applicant[`${rawKey}_file`],

    applicant[`${rawKey}_filename`],

    applicant[rawKey]

  ];


  const foundValue =
    possibleValues.find(
      (value) =>
        Array.isArray(value)
          ? value.length > 0
          : typeof value === "string" &&
            value.trim() !== ""
    );


  if (!foundValue) {
    return [];
  }


  const values =
    Array.isArray(foundValue)
      ? foundValue
      : [foundValue];


  return values
    .filter(
      (value) =>
        typeof value === "string" &&
        value.trim() !== ""
    )
    .map(
      (value) => ({
        url: resolveFileUrl(value),

        name:
          value
            .split("/")
            .pop() || "Uploaded File"
      })
    )
    .filter(
      (file) => file.url
    );
};


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ApplicantDetails() {

  const { id } = useParams();

  const navigate = useNavigate();


  // ==========================================================
  // STATES
  // ==========================================================

  const [applicant, setApplicant] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [updating, setUpdating] =
    useState(false);


  // ==========================================================
  // CHECKED DOCUMENTS
  // ==========================================================

  const [checkedDocs, setCheckedDocs] =
    useState({});


  // ==========================================================
  // MODALS
  // ==========================================================

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showConfirmModal, setShowConfirmModal] =
    useState(false);

  const [modalError, setModalError] =
    useState(null);


  // ==========================================================
  // FETCH APPLICANT
  // ==========================================================

  useEffect(() => {

    const fetchApplicantDetails = async () => {

      try {

        setLoading(true);

        setError(null);


        const response =
          await getApplicationById(id);


        const data =
          response && response.data
            ? response.data
            : response;


        setApplicant(data);


        // ======================================================
        // INITIAL CHECKBOX STATE
        // ======================================================

        if (data) {

          const initialCheckedState = {};


          DOCUMENT_REQUIREMENTS.forEach(
            (document) => {

              initialCheckedState[
                document.field
              ] =
                Boolean(
                  data[document.field]
                );

            }
          );


          setCheckedDocs(
            initialCheckedState
          );

        }


      } catch (err) {

        console.error(
          "Error fetching applicant details:",
          err
        );


        setError(
          "Failed to load applicant details. Please try again."
        );


      } finally {

        setLoading(false);

      }

    };


    if (id) {
      fetchApplicantDetails();
    }

  }, [id]);


  // ============================================================
  // DOCUMENTS
  // ============================================================

  const documents =
    DOCUMENT_REQUIREMENTS.map(
      (document) => ({

        ...document,

        files:
          getDocumentFiles(
            applicant,
            document.field
          )

      })
    );


  // ============================================================
  // CHECKBOX CHANGE
  // ============================================================

  const handleCheckboxChange = (
    fullKey
  ) => {

    setCheckedDocs(
      (prev) => ({

        ...prev,

        [fullKey]:
          !prev[fullKey]

      })
    );

  };


  // ============================================================
  // DOCUMENT COUNTS
  // ============================================================

  const totalDocs =
    documents.length;


  const checkedDocsCount =
    Object.values(
      checkedDocs
    ).filter(Boolean).length;


  const isAllChecked =
    totalDocs > 0 &&
    checkedDocsCount === totalDocs;


  // ============================================================
  // APPLICATION STATUS
  // ============================================================

  const rawStatus =
    applicant?.application_status || "";


  const normalizedStatus =
    rawStatus
      .toLowerCase()
      .trim();


  const isUnderReview =
    normalizedStatus === "under_review" ||
    normalizedStatus === "under review";

  const isFinalStatus = [
    "complete",
    "completed",
    "incomplete",
  ].includes(normalizedStatus);

  const canUpdateStatus =
    isUnderReview && !isFinalStatus;


  const currentStatus = rawStatus;


  // ============================================================
  // CONFIRM APPLICATION
  // ============================================================

  const handleConfirmApplication = async () => {

    setShowConfirmModal(false);


    try {

      setUpdating(true);


      const applicantId =
        applicant.applicant_id || id;


      const targetStatus =
        isAllChecked
          ? "complete"
          : "incomplete";


      const remarksText =
        isAllChecked

          ? "Verification complete: All required document checkboxes verified during review."

          : `Verification incomplete: Only ${checkedDocsCount} of ${totalDocs} document requirements verified during review.`;


      const payload = {

        application_status:
          targetStatus,

        hr_remarks_notes:
          applicant.hr_remarks_notes

            ? `${applicant.hr_remarks_notes}\n[${remarksText}]`

            : remarksText

      };


      await updateApplicationStatus(
        applicantId,
        payload
      );


      // ========================================================
      // UPDATE LOCAL STATE
      // ========================================================

      setApplicant(
        (prev) => ({

          ...prev,

          application_status:
            targetStatus,

          hr_remarks_notes:
            payload.hr_remarks_notes

        })
      );


    } catch (err) {

      console.error(
        "Error updating application status:",
        err
      );


      setModalError(
        "Failed to update application status. Please try again."
      );


    } finally {

      setUpdating(false);

    }

  };


  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center">

        <div className="text-center">

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3E74] mx-auto mb-4"></div>

          <p className="text-slate-600 font-medium">
            Loading applicant profile...
          </p>

        </div>

      </div>

    );

  }


  // ============================================================
  // ERROR SCREEN
  // ============================================================

  if (error || !applicant) {

    return (

      <div className="min-h-screen flex items-center justify-center p-6">

        <div className="bg-white rounded-3xl p-8 shadow-md text-center max-w-md w-full">

          <AlertCircle
            className="text-red-500 w-12 h-12 mx-auto mb-3"
          />

          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Profile Not Found
          </h2>

          <p className="text-slate-500 mb-6">
            {error ||
              "Could not retrieve the requested applicant record."}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="rounded-xl bg-[#1E3E74] px-6 py-2.5 font-semibold text-white hover:bg-[#17325e] transition-colors"
          >
            Go Back
          </button>

        </div>

      </div>

    );

  }


  // ============================================================
  // MAIN UI
  // ============================================================

  return (

    <div className="min-h-screen p-6 relative">


      {/* ======================================================
          TOP NAVIGATION
          ====================================================== */}

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-semibold text-[#1E3E74] shadow hover:bg-slate-50 transition-colors"
        >

          <ArrowLeft size={18} />

          Back to Applications

        </button>


      <div className="flex items-center gap-3">

        {/* STATUS
            Only show status when it is NOT under_review
        */}
        {!isUnderReview && (
          <span
            className={`
              rounded-full
              border
              px-4
              py-1.5
              text-sm
              font-bold
              shadow-sm
              uppercase
              tracking-wide
              flex
              items-center
              gap-1.5
              ${getStatusStyles(currentStatus)}
            `}
          >
            {currentStatus || "N/A"}
          </span>
        )}

        {/* ACTION BUTTON
            Only show when status is under_review
        */}
        {isUnderReview && (
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={updating}
            className={`
              inline-flex
              items-center
              gap-2
              text-white
              font-semibold
              px-5
              py-2
              rounded-xl
              text-sm
              shadow
              transition-colors
              disabled:opacity-50
              ${
                isAllChecked
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }
            `}
          >
            {isAllChecked ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}

            {updating
              ? "Processing..."
              : `Mark as ${
                  isAllChecked
                    ? "Complete"
                    : "Incomplete"
                }`}
          </button>
        )}

        {/* EDIT APPLICANT */}
        <button
          type="button"
          onClick={() => setShowEditModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1E3E74] px-5 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-[#17325e]"
        >
          <Pencil size={16} />
          Edit Applicant
        </button>

      </div>

      </div>


      {/* ======================================================
          APPLICANT HEADER
          ====================================================== */}

      <div className="relative mb-8 flex min-h-[88px] flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm md:flex-row md:items-center">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />


        {/* APPLICANT NAME */}

        <div className="flex items-center gap-5">

          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-[#1E3E74] font-bold text-2xl shadow-inner">

            {applicant.first_name
              ? applicant.first_name[0].toUpperCase()
              : <User size={36} />
            }

          </div>


          <div>

            <h1 className="text-3xl font-bold text-[#1E3E74]">

              {applicant.last_name},

              {" "}

              {applicant.first_name}

              {" "}

              {applicant.middle_name || ""}

              {" "}

              {applicant.suffix || ""}

            </h1>


            <p className="text-slate-600 font-medium text-lg mt-0.5">

              Applying for:{" "}

              <span className="text-[#1E3E74] font-semibold">

                {applicant.position_title || "N/A"}

              </span>

              {" "}

              ({applicant.office_unit || "N/A"})

            </p>


            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">


              {applicant.contact_number && (

                <span className="flex items-center gap-1.5">

                  <Phone size={15} />

                  {applicant.contact_number}

                </span>

              )}


              {applicant.email_address && (

                <span className="flex items-center gap-1.5">

                  <Mail size={15} />

                  {applicant.email_address}

                </span>

              )}


              {applicant.residential_address && (

                <span className="flex items-center gap-1.5">

                  <MapPin size={15} />

                  {applicant.residential_address}

                </span>

              )}

            </div>

          </div>

        </div>


        {/* APPLICATION DETAILS */}

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[220px]">

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Application Details
          </p>

          <p className="text-sm font-medium text-slate-700">
            <strong>Vacancy ID:</strong>{" "}
            {applicant.vacancy_id || "N/A"}
          </p>

          <p className="text-sm font-medium text-slate-700">
            <strong>Date Received:</strong>{" "}
            {applicant.date_received || "N/A"}
          </p>

          <p className="text-sm font-medium text-slate-700">
            <strong>Submission:</strong>{" "}
            {applicant.submission_type || "N/A"}
          </p>

        </div>

      </div>


      {/* ======================================================
          MAIN GRID
          ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


        {/* ====================================================
            LEFT COLUMN
            ==================================================== */}

        <div className="lg:col-span-2 space-y-8">


          {/* ==================================================
              EDUCATION
              ================================================== */}

          <div className="rounded-3xl bg-white shadow p-6">

            <h2 className="text-xl font-bold text-[#1E3E74] flex items-center gap-2 mb-4">

              <GraduationCap size={22} />

              Education Background

            </h2>


            {applicant.education_list &&
            applicant.education_list.length > 0 ? (

              <div className="space-y-3">

                {applicant.education_list.map(
                  (edu, idx) => (

                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                    >

                      <div className="flex justify-between items-start">

                        <div>

                          <h3 className="font-bold text-slate-800">

                            {edu.degree_course ||
                              edu.education_level ||
                              "Education"}

                          </h3>

                          <p className="text-slate-600 text-sm">

                            {edu.school_name || "N/A"}

                          </p>

                        </div>


                        <span className="text-xs px-3 py-1 bg-blue-100 text-[#1E3E74] rounded-full font-semibold">

                          {edu.education_level || "N/A"}

                        </span>

                      </div>


                      {edu.honors_awards && (

                        <p className="text-xs text-emerald-600 mt-2 font-medium">

                          Honors/Awards:{" "}

                          {edu.honors_awards}

                        </p>

                      )}

                    </div>

                  )
                )}

              </div>

            ) : (

              <p className="text-slate-400 text-sm italic">
                No education records specified.
              </p>

            )}

          </div>


          {/* ==================================================
              WORK EXPERIENCE
              ================================================== */}

          <div className="rounded-3xl bg-white shadow p-6">

            <h2 className="text-xl font-bold text-[#1E3E74] flex items-center gap-2 mb-4">

              <Briefcase size={22} />

              Work Experience

            </h2>


            {applicant.work_experience_list &&
            applicant.work_experience_list.length > 0 ? (

              <div className="space-y-3">

                {applicant.work_experience_list.map(
                  (work, idx) => (

                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                    >

                      <div className="flex justify-between items-start">

                        <div>

                          <h3 className="font-bold text-slate-800">

                            {work.position_title ||
                              "Position N/A"}

                          </h3>

                          <p className="text-slate-600 text-sm">

                            {work.company_office ||
                              "Company/Office N/A"}

                          </p>

                          <p className="text-slate-500 text-xs mt-1">

                            {work.appointment_status ||
                              "Status N/A"}

                          </p>

                        </div>


                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">

                          <Calendar size={13} />

                          {work.experience_date_from ||
                            work.date_from ||
                            "N/A"}

                          {" — "}

                          {work.experience_date_to ||
                            work.date_to ||
                            "Present"}

                        </span>

                      </div>


                      <div className="flex gap-4 mt-2 text-xs text-slate-500">

                        <span>
                          Salary: ₱
                          {work.monthly_salary || "0.00"}
                        </span>

                        <span>
                          Govt Service:{" "}
                          {work.is_govt_service
                            ? "Yes"
                            : "No"}
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            ) : (

              <p className="text-slate-400 text-sm italic">
                No work experience records specified.
              </p>

            )}

          </div>


          {/* ==================================================
              TRAININGS
              ================================================== */}

          <div className="rounded-3xl bg-white shadow p-6">

            <h2 className="text-xl font-bold text-[#1E3E74] flex items-center gap-2 mb-4">

              <Award size={22} />

              Relevant Trainings & Seminars

            </h2>


            {applicant.trainings_list &&
            applicant.trainings_list.length > 0 ? (

              <div className="space-y-3">

                {applicant.trainings_list.map(
                  (train, idx) => (

                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                    >

                      <h3 className="font-bold text-slate-800">

                        {train.training_title ||
                          "Training"}

                      </h3>

                      <p className="text-slate-600 text-sm">

                        Conducted by:{" "}

                        {train.conducted_by ||
                          "N/A"}

                        {" "}

                        (
                        {train.hours_attended || 0}
                        {" "}
                        hours)

                      </p>

                    </div>

                  )
                )}

              </div>

            ) : (

              <p className="text-slate-400 text-sm italic">
                No training records specified.
              </p>

            )}

          </div>

        </div>


        {/* ====================================================
            RIGHT COLUMN
            ==================================================== */}

        <div className="space-y-8">


          {/* ==================================================
              ELIGIBILITY
              ================================================== */}

          <div className="rounded-3xl bg-white shadow p-6">

            <h2 className="text-xl font-bold text-[#1E3E74] mb-4">

              Civil Service Eligibility

            </h2>


            {applicant.eligibility_list &&
            applicant.eligibility_list.length > 0 ? (

              <div className="space-y-3">

                {applicant.eligibility_list.map(
                  (elig, idx) => (

                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                    >

                      <h3 className="font-bold text-slate-800">

                        {elig.eligibility_type ||
                          "Eligibility"}

                      </h3>

                      <p className="text-xs text-slate-600 mt-1">

                        Rating:{" "}
                        {elig.rating || "N/A"}

                        {" | "}

                        License:{" "}
                        {elig.license_number ||
                          "N/A"}

                      </p>

                      <p className="text-xs text-slate-500 mt-0.5">

                        Exam Date:{" "}

                        {elig.date_of_exam ||
                          "N/A"}

                      </p>

                    </div>

                  )
                )}

              </div>

            ) : (

              <p className="text-slate-400 text-sm italic">
                No eligibility records specified.
              </p>

            )}

          </div>


          {/* ==================================================
              DOCUMENT VERIFICATION
              ================================================== */}

          <div className="rounded-3xl bg-white shadow p-6">


            {/* HEADER */}

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-xl font-bold text-[#1E3E74] flex items-center gap-2">

                <FileText size={22} />

                Document Verification

              </h2>


              <span
                className={`
                  text-xs
                  font-bold
                  px-2.5
                  py-1
                  rounded-lg
                  border
                  ${
                    isAllChecked
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }
                `}
              >

                {checkedDocsCount}
                {" / "}
                {totalDocs}
                {" Checked"}

              </span>

            </div>


            {/* =================================================
                DOCUMENT LIST
                ================================================= */}

            {documents.length > 0 ? (

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">

                {documents.map(
                  (doc, idx) => {

                    const isChecked =
                      !!checkedDocs[
                        doc.field
                      ];


                    return (

                      <div
                        key={doc.field}
                        className={`
                          rounded-xl
                          border
                          transition-colors
                          p-3
                          ${
                            isChecked
                              ? "bg-emerald-50/50 border-emerald-200"
                              : "bg-slate-50 border-slate-100"
                          }
                        `}
                      >


                        {/* =====================================
                            DOCUMENT ROW
                            ===================================== */}

                        <div className="flex items-start justify-between gap-3">


                          {/* CHECKBOX + DOCUMENT NAME */}

                          <label className="flex items-start gap-3 cursor-pointer min-w-0 flex-1">

                            <input
                              type="checkbox"

                              checked={isChecked}

                              disabled={!isUnderReview}

                              onChange={() =>
                                handleCheckboxChange(
                                  doc.field
                                )
                              }

                              className="
                                mt-0.5
                                h-4
                                w-4
                                rounded
                                border-slate-300
                                text-[#1E3E74]
                                focus:ring-[#1E3E74]
                                cursor-pointer
                                disabled:cursor-not-allowed
                              "
                            />


                            <div className="min-w-0">

                              <span
                                className={`
                                  text-sm
                                  font-medium
                                  ${
                                    isChecked
                                      ? "text-emerald-800 font-semibold"
                                      : "text-slate-700"
                                  }
                                `}
                              >

                                <span className="text-slate-400 mr-1">

                                  {String.fromCharCode(
                                    97 + idx
                                  )}.

                                </span>

                                {doc.label}

                              </span>


                              {/* FILE COUNT */}

                              {doc.files.length > 0 && (

                                <p className="text-xs text-green-600 mt-1">

                                  {doc.files.length === 1
                                    ? "1 file uploaded"
                                    : `${doc.files.length} files uploaded`
                                  }

                                </p>

                              )}

                            </div>

                          </label>


                          {/* ===================================
                              FILE BUTTONS
                              =================================== */}

                          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">

                            {doc.files.length > 0 ? (

                              doc.files.map(
                                (file, fileIndex) => (

                                  <a
                                    key={`${doc.field}-${fileIndex}`}

                                    href={file.url}

                                    target="_blank"

                                    rel="noopener noreferrer"

                                    className="
                                      inline-flex
                                      items-center
                                      gap-1
                                      text-xs
                                      font-semibold
                                      text-[#1E3E74]
                                      bg-blue-50
                                      border
                                      border-blue-200
                                      hover:bg-blue-100
                                      px-2.5
                                      py-1
                                      rounded-lg
                                      transition-colors
                                    "
                                    title={file.name}
                                  >

                                    <Eye size={13} />

                                    {doc.files.length > 1
                                      ? `View ${fileIndex + 1}`
                                      : "View"
                                    }

                                  </a>

                                )
                              )

                            ) : (

                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-1
                                  text-xs
                                  font-medium
                                  text-slate-400
                                  bg-slate-100
                                  border
                                  border-slate-200
                                  px-2.5
                                  py-1
                                  rounded-lg
                                  cursor-not-allowed
                                "
                                title="No uploaded file path available"
                              >

                                <Eye size={13} />

                                No File

                              </span>

                            )}

                          </div>

                        </div>

                      </div>

                    );

                  }
                )}

              </div>

            ) : (

              <p className="text-slate-400 text-sm italic">
                No document entries found.
              </p>

            )}

          </div>


          {/* ==================================================
              HR REMARKS
              ================================================== */}

          {applicant.hr_remarks_notes && (

            <div className="rounded-3xl bg-blue-50/50 border border-blue-100 shadow p-6">

              <h2 className="text-lg font-bold text-[#1E3E74] mb-2">

                HR Remarks & Notes

              </h2>

              <p className="text-slate-600 text-sm whitespace-pre-wrap">

                {applicant.hr_remarks_notes}

              </p>

            </div>

          )}

        </div>

      </div>


      {/* ======================================================
          CONFIRMATION MODAL
          ====================================================== */}

      {canUpdateStatus && (

        <ActionModal

          isOpen={showConfirmModal}

          type={
            isAllChecked
              ? "confirm"
              : "warning"
          }

          title={
            isAllChecked
              ? "Confirm Complete Status"
              : "Mark as Incomplete?"
          }

          message={

            isAllChecked

              ? "All document requirements are checked. Are you sure you want to mark this application as COMPLETE?"

              : `Only ${checkedDocsCount} out of ${totalDocs} document requirements are checked. Are you sure you want to mark this application as INCOMPLETE?`

          }

          onClose={() =>
            setShowConfirmModal(false)
          }

          onConfirm={
            handleConfirmApplication
          }

        />

      )}


      {/* ======================================================
          ERROR MODAL
          ====================================================== */}

      <ActionModal

        isOpen={
          Boolean(modalError)
        }

        type="error"

        title="Action Failed"

        message={modalError}

        onClose={() =>
          setModalError(null)
        }

      />

      {/* ======================================================
          EDIT APPLICANT MODAL
          ====================================================== */}
      <ApplicantEditModal
        isOpen={showEditModal}
        applicant={applicant}
        applicantId={
          applicant?.job_applications_id ||
          applicant?.applicant_id ||
          id
        }
        onClose={() => setShowEditModal(false)}
        onUpdated={async () => {
          try {
            const response = await getApplicationById(id);
            const data = response?.data ?? response;
            setApplicant(data);
          } catch (err) {
            console.error("Failed to refresh applicant after update:", err);
            setError("Applicant was updated, but refreshing the details failed. Please reload the page.");
          }
        }}
      />

    </div>

  );

}