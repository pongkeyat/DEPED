import React, { useState } from "react";

import ApplicationHeader from "../components/applications/ApplicationsHeader";
import StepProgress from "../components/applications/StepProgress";

import ApplicantForm from "../components/applications/ApplicantForm";
import Applications from "../components/applications/Applications";

import DocumentChecklist from "../components/applications/DocumentChecklist";

import EqualOpportunityDeclaration from "../components/applications/EqualOpportunityDeclaration";

import HRRemarksForm from "../components/applications/HRRemarksForm";

import ApplicantEducationForm from "../components/applications/ApplicantEducationForm";

import ApplicantTrainingForm from "../components/applications/ApplicantTrainingForm";

import CivilServiceEligibilityForm from "../components/applications/CivilServiceEligibilityForm";

import WorkExperienceForm from "../components/applications/WorkExperienceForm";

import ActionModal from "../components/ActionModal";

import { postApplications } from "../api/ApplicationApi";


export default function ReceiveApplications() {

  // ============================================================
  // LOADING
  // ============================================================

  const [loading, setLoading] = useState(false);


  // ============================================================
  // MODALS
  // ============================================================

  const [successModal, setSuccessModal] = useState(false);

  const [errorModalMessage, setErrorModalMessage] = useState(null);


  // ============================================================
  // FORM DATA
  // ============================================================

  const [formData, setFormData] = useState({

    // ==========================================================
    // APPLICANT INFORMATION
    // ==========================================================

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


    // ==========================================================
    // APPLICATION INFORMATION
    // ==========================================================

    applicationData: {

      vacancy_id: "",

      dateReceived:
        new Date().toISOString().split("T")[0],

      timeReceived:
        new Date().toLocaleTimeString(
          [],
          {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit"
          }
        ),

      receivedBy: "System Administrator",

      submissionType: "Walk-In"

    },


    // ==========================================================
    // EDUCATION
    // ==========================================================

      educationData: {
          educationList: [
              {
                  level: "",
                  school_name: "",
                  degree_course: "",
                  honors_awards: "",
                  units: ""
              }
          ]
      },


    // ==========================================================
    // TRAINING
    // ==========================================================

    trainingData: {

      trainings: []

    },


    // ==========================================================
    // CIVIL SERVICE ELIGIBILITY
    // ==========================================================

    eligibilityData: [],


    // ==========================================================
    // WORK EXPERIENCE
    // ==========================================================

    workExperienceData: {

      position_title: "",

      company_office: "",

      date_from: "",

      date_to: "",

      monthly_salary: "",

      appointment_status: "",

      is_govt_service: null

    },


    // ==========================================================
    // DOCUMENT CHECKLIST
    // ==========================================================
    //
    // These fields MUST match applicant_documents.
    //
    // A. Letter of Intent
    // B. Personal Data Sheet
    // C. PRC License / ID
    // D. Eligibility / Rating
    // E. Diploma
    // E. Transcript of Records
    // F. Training Certificates
    // G. Certificate of Employment
    // G. Service Record
    // H. Latest Appointment
    // I. Performance Rating
    // J. Omnibus Sworn Statement
    //
    // ==========================================================

    documentData: {

      // A
      has_application_letter: false,

      // B
      has_personal_data_sheet: false,

      // C
      has_prc_license_id: false,

      // D
      has_civil_service_eligibility_cert: false,

      // E
      has_diploma: false,

      has_transcript_of_records: false,

      // F
      has_training_certificates: false,

      // G
      has_certificate_of_employment: false,

      has_service_record: false,

      // H
      has_latest_appointment: false,

      // I
      has_performance_rating: false,

      // J
      has_omnibus_sworn_statement: false

    },


    // ==========================================================
    // UPLOADED DOCUMENT FILES
    // ==========================================================
    //
    // Kept separate from documentData so File objects don't
    // accidentally become part of the JSON checklist.
    //
    // ==========================================================

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


    // ==========================================================
    // EQUAL OPPORTUNITY
    // ==========================================================

    equalOpportunityData: {

      is_pwd: null,

      is_solo_parent: null,

      is_indigenous_person: null

    },


    // ==========================================================
    // HR REMARKS
    // ==========================================================

    hrRemarksData: {

      hr_remarks_notes: "",

      application_status: ""

    }

  });


  // ============================================================
  // APPLICANT CHANGE
  // ============================================================

  const handleApplicantChange = (name, value) => {

    setFormData((prev) => ({

      ...prev,

      applicantData: {

        ...prev.applicantData,

        [name]: value

      }

    }));

  };


  // ============================================================
  // APPLICATION CHANGE
  // ============================================================

  const handleApplicationChange = (name, value) => {

    setFormData((prev) => ({

      ...prev,

      applicationData: {

        ...prev.applicationData,

        [name]: value

      }

    }));

  };


  // ============================================================
  // EDUCATION CHANGE
  // ============================================================

  const handleEducationChange = (name, value) => {

    setFormData((prev) => ({

      ...prev,

      educationData: {

        ...prev.educationData,

        [name]: value

      }

    }));

  };


  // ============================================================
  // TRAINING CHANGE
  // ============================================================

  const handleTrainingChange = (name, value) => {

    setFormData((prev) => ({

      ...prev,

      trainingData: {

        ...prev.trainingData,

        [name]: value

      }

    }));

  };


  // ============================================================
  // ELIGIBILITY CHANGE
  // ============================================================

  const handleEligibilityChange = (updatedList) => {

    setFormData((prev) => ({

      ...prev,

      eligibilityData: updatedList

    }));

  };


  // ============================================================
  // WORK EXPERIENCE CHANGE
  // ============================================================

  const handleWorkExperienceChange = (updatedList) => {

    setFormData((prev) => ({

      ...prev,

      workExperienceData: updatedList

    }));

  };


  // ============================================================
  // DOCUMENT CHECKBOX CHANGE
  // ============================================================

  const handleDocumentChange = (name, value) => {

    setFormData((prev) => ({

      ...prev,

      documentData: {

        ...prev.documentData,

        [name]: value

      }

    }));

  };


  // ============================================================
  // DOCUMENT FILE UPLOAD
  // ============================================================
  //
  // Supports:
  //
  // Single file:
  // File
  //
  // Multiple files:
  // File[]
  //
  // Training certificates use multiple files.
  //
  // ============================================================

  const handleFileUpload = (field, file) => {

    setFormData((prev) => ({

      ...prev,

      uploadedFiles: {

        ...prev.uploadedFiles,

        [`${field}_file`]: file

      },

      documentData: {

        ...prev.documentData,

        [field]: true

      }

    }));

  };


  // ============================================================
  // EQUAL OPPORTUNITY CHANGE
  // ============================================================

  const handleEqualOpportunityChange = (name, value) => {

    setFormData((prev) => ({

      ...prev,

      equalOpportunityData: {

        ...prev.equalOpportunityData,

        [name]: value

      }

    }));

  };


  // ============================================================
  // HR REMARKS CHANGE
  // ============================================================

  const handleHRRemarksChange = (name, value) => {

    setFormData((prev) => ({

      ...prev,

      hrRemarksData: {

        ...prev.hrRemarksData,

        [name]: value

      }

    }));

  };


  // ============================================================
  // SUBMIT APPLICATION
  // ============================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    setErrorModalMessage(null);


    // ==========================================================
    // DOCUMENT CHECKLIST
    // ==========================================================

    const documentChecklist = {

      has_application_letter:
        formData.documentData.has_application_letter,

      has_personal_data_sheet:
        formData.documentData.has_personal_data_sheet,

      has_prc_license_id:
        formData.documentData.has_prc_license_id,

      has_civil_service_eligibility_cert:
        formData.documentData.has_civil_service_eligibility_cert,

      has_diploma:
        formData.documentData.has_diploma,

      has_transcript_of_records:
        formData.documentData.has_transcript_of_records,

      has_training_certificates:
        formData.documentData.has_training_certificates,

      has_certificate_of_employment:
        formData.documentData.has_certificate_of_employment,

      has_service_record:
        formData.documentData.has_service_record,

      has_latest_appointment:
        formData.documentData.has_latest_appointment,

      has_performance_rating:
        formData.documentData.has_performance_rating,

      has_omnibus_sworn_statement:
        formData.documentData.has_omnibus_sworn_statement

    };


    // ==========================================================
    // BUILD PAYLOAD
    // ==========================================================

    const payload = {

      // ========================================================
      // JOB APPLICATION
      // ========================================================

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
          formData.applicationData.submissionType

      },


      // ========================================================
      // APPLICANT INFORMATION
      // ========================================================

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
          formData.applicantData.contactNumber || null

      },


      // ========================================================
      // DOCUMENT CHECKLIST
      // ========================================================

      document_checklist:
        documentChecklist,


      // ========================================================
      // EQUAL OPPORTUNITY
      // ========================================================

      equal_opportunity:
        formData.equalOpportunityData,


      // ========================================================
      // EDUCATION
      // ========================================================

      education_list:
        formData.educationData.educationList,


      // ========================================================
      // TRAINING
      // ========================================================

      trainings_list:
        formData.trainingData.trainings,


      // ========================================================
      // ELIGIBILITY
      // ========================================================

      eligibility_list:
        formData.eligibilityData,


      // ========================================================
      // WORK EXPERIENCE
      // ========================================================

      work_experience_list:

        formData.workExperienceData.position_title

          ? [formData.workExperienceData]

          : [],


      // ========================================================
      // HR REMARKS
      // ========================================================

      hr_remarks:
        formData.hrRemarksData

    };


    // ==========================================================
    // SUBMIT
    // ==========================================================

    try {

      /*
       * IMPORTANT:
       *
       * postApplications() should combine:
       *
       * 1. payload
       * 2. formData.uploadedFiles
       *
       * into FormData.
       */

      await postApplications(
        payload,
        formData.uploadedFiles
      );


      // ========================================================
      // SUCCESS
      // ========================================================

      setSuccessModal(true);


    } catch (err) {

      console.error(
        "Application submission error:",
        err
      );


      setErrorModalMessage(

        err.response?.data?.message ||

        err.response?.data?.error ||

        "An error occurred during submission."

      );


    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="p-5 min-h-screen space-y-6 bg-gray-50 relative">


      {/* ======================================================
          HEADER
          ====================================================== */}

      <ApplicationHeader />


      {/* ======================================================
          PROGRESS
          ====================================================== */}

      <StepProgress />


      {/* ======================================================
          FORM
          ====================================================== */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-w-5xl mx-auto"
      >


        {/* ====================================================
            APPLICATION
            ==================================================== */}

        <Applications
          formData={formData.applicationData}
          onChange={handleApplicationChange}
        />


        {/* ====================================================
            APPLICANT
            ==================================================== */}

        <ApplicantForm
          formData={formData.applicantData}
          onChange={handleApplicantChange}
        />


        {/* ====================================================
            EDUCATION
            ==================================================== */}

        <ApplicantEducationForm
          data={formData.educationData}
          onChange={handleEducationChange}
        />


        {/* ====================================================
            TRAINING
            ==================================================== */}

        <ApplicantTrainingForm
          trainings={formData.trainingData.trainings}
          onChange={handleTrainingChange}
        />


        {/* ====================================================
            CIVIL SERVICE ELIGIBILITY
            ==================================================== */}

        <CivilServiceEligibilityForm
          data={formData.eligibilityData}
          onChange={handleEligibilityChange}
        />


        {/* ====================================================
            WORK EXPERIENCE
            ==================================================== */}

        <WorkExperienceForm
          data={formData.workExperienceData}
          onChange={handleWorkExperienceChange}
        />


        {/* ====================================================
            EQUAL OPPORTUNITY
            ==================================================== */}

        <EqualOpportunityDeclaration
          data={formData.equalOpportunityData}
          onChange={handleEqualOpportunityChange}
        />


        {/* ====================================================
            DOCUMENT CHECKLIST
            ==================================================== */}

        <DocumentChecklist
          documents={formData.documentData}
          onChange={handleDocumentChange}
          onFileUpload={handleFileUpload}
        />


        {/* ====================================================
            HR REMARKS
            ==================================================== */}

        <HRRemarksForm
          data={formData.hrRemarksData}
          onChange={handleHRRemarksChange}
        />


        {/* ====================================================
            SUBMIT BUTTON
            ==================================================== */}

        <div className="flex justify-end pt-4">

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >

            {loading
              ? "Submitting..."
              : "Submit Application"}

          </button>

        </div>

      </form>


      {/* ======================================================
          SUCCESS MODAL
          ====================================================== */}

      <ActionModal
        isOpen={successModal}
        type="confirm"
        title="Success!"
        message="Application submitted successfully!"
        onClose={() => setSuccessModal(false)}
        onConfirm={() => setSuccessModal(false)}
      />


      {/* ======================================================
          ERROR MODAL
          ====================================================== */}

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