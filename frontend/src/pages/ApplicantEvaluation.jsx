import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, GraduationCap, Award, AlertCircle, Calendar } from "lucide-react";

import { getApplicationById } from "../api/ApplicationApi";
import { postScreening } from "../api/ScreeningApi"; // Import your API helper

// Modularized component imports
import ActionModal from "../components/ActionModal";
import ApplicantHeader from "../components/appliacantEvaluation/ApplicantHeader";
import QualificationOverview from "../components/appliacantEvaluation/QualificationOverview";
import EvaluationSection from "../components/appliacantEvaluation/EvaluationSection";
import FinalEvaluationCard from "../components/appliacantEvaluation/FinalEvaluationCard";

const getStatusStyles = (status) => {
  switch (status) {
    case "Initial Screening": return "bg-orange-100 text-orange-700 border-orange-200";
    case "For Assessment": return "bg-violet-100 text-violet-700 border-violet-200";
    case "Ranked": return "bg-teal-100 text-teal-700 border-teal-200";
    case "Qualified":
    case "complete": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Disqualified": return "bg-rose-100 text-rose-700 border-rose-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export default function ApplicantEvaluation() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchApplicantDetails = async () => {
      try {
        setLoading(true);
        const response = await getApplicationById(id);
        const data = response && response.data ? response.data : response;
        setApplicant(data);
      } catch (err) {
        console.error("Error fetching applicant details:", err);
        setError("Failed to load applicant details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchApplicantDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#edf2f8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3E74] mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading applicant profile...</p>
        </div>
      </div>
    );
  }

  if (error || !applicant) {
    return (
      <div className="min-h-screen bg-[#edf2f8] p-6 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 shadow-md text-center max-w-md w-full">
          <AlertCircle className="text-red-500 w-12 h-12 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
          <p className="text-slate-500 mb-6">{error || "Could not retrieve the requested applicant record."}</p>
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

  const education = applicant?.education_requirement || applicant?.education || applicant?.education_attained || "Not Specified";
  const experience = applicant?.experience_requirement || applicant?.experience || applicant?.work_experience || "Not Specified";
  const training = applicant?.training_requirement || applicant?.training || applicant?.training_hours || "Not Specified";
  const eligibility = applicant?.eligibility_requirement || applicant?.eligibility || applicant?.civil_service || "Not Specified";

  const isEducationPass = Boolean(applicant?.education_list && applicant.education_list.length > 0);
  const isExperiencePass = Boolean(applicant?.work_experience_list && applicant.work_experience_list.length > 0);
  const isTrainingPass = Boolean(applicant?.trainings_list && applicant.trainings_list.length > 0);
  const isEligibilityPass = Boolean(applicant?.eligibility_list && applicant.eligibility_list.length > 0);

  const overallPass = isEducationPass && isExperiencePass && isTrainingPass && isEligibilityPass;

  // Handles submitting the payload to the postInitialScreening backend endpoint
  const handleStatusAction = async () => {
    try {
      setActionLoading(true);
      setModalError(null);

      // Get evaluator ID from localStorage or auth context
      const currentEvaluatorId = localStorage.getItem("user_id") || 1;

      const payload = {
        job_applications_id: applicant?.job_applications_id || id,
        applicant_id: applicant?.applicant_id,
        education_passed: isEducationPass,
        education_remarks: isEducationPass ? "Meets education requirement" : "Does not meet education requirement",
        eligibility_passed: isEligibilityPass,
        eligibility_remarks: isEligibilityPass ? "Meets eligibility requirement" : "Does not meet eligibility requirement",
        training_passed: isTrainingPass,
        training_remarks: isTrainingPass ? "Meets training requirement" : "Does not meet training requirement",
        experience_passed: isExperiencePass,
        experience_remarks: isExperiencePass ? "Meets experience requirement" : "Does not meet experience requirement",
        overall_result: overallPass ? "qualified" : "unqualified",
        general_remarks: applicant?.hr_remarks_notes || (overallPass ? "Applicant passed initial screening." : "Applicant failed initial screening."),
        screened_by: currentEvaluatorId,
        submitted_documents_passed: overallPass,
        documents_note: null
      };

      await postScreening(payload);
      
      // Update local state and return to dashboard
      setApplicant((prev) => ({
        ...prev,
        application_status: overallPass ? "qualified" : "unqualified"
      }));

      navigate(-1);
    } catch (err) {
      console.error("Error submitting screening evaluation:", err);
      const apiErrorMessage = err.response?.data?.error || "Failed to update applicant status. Please try again.";
      setModalError(apiErrorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf2f8] p-6 relative">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(`/applicants/${encodeURIComponent(id)}`)}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-semibold text-[#1E3E74] shadow hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Applications
        </button>
        <div className="flex items-center gap-3">
          <span className={`rounded-full border px-4 py-1.5 text-sm font-bold shadow-sm ${getStatusStyles(applicant?.application_status)}`}>
            Status: {applicant?.application_status || "Initial Screening"}
          </span>
        </div>
      </div>

      <ApplicantHeader applicant={applicant} />

      <QualificationOverview
        education={education}
        experience={experience}
        training={training}
        eligibility={eligibility}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <EvaluationSection title="Education Background" icon={GraduationCap} isPass={isEducationPass}>
            {applicant?.education_list && applicant.education_list.length > 0 ? (
              <div className="space-y-3">
                {applicant.education_list.map((edu, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800">{edu.degree_course || edu.education_level}</h3>
                        <p className="text-slate-600 text-sm">{edu.school_name}</p>
                      </div>
                      <span className="text-xs px-3 py-1 bg-blue-100 text-[#1E3E74] rounded-full font-semibold">{edu.education_level}</span>
                    </div>
                    {edu.honors_awards && <p className="text-xs text-emerald-600 mt-2 font-medium">Honors/Awards: {edu.honors_awards}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">No education records specified.</p>
            )}
          </EvaluationSection>

          <EvaluationSection title="Work Experience" icon={Briefcase} isPass={isExperiencePass}>
            {applicant?.work_experience_list && applicant.work_experience_list.length > 0 ? (
              <div className="space-y-3">
                {applicant.work_experience_list.map((work, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800">{work.company_office}</h3>
                        <p className="text-slate-600 text-sm font-medium">{work.appointment_status || "Position/Status N/A"}</p>
                      </div>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Calendar size={13} /> {work.experience_date_from || work.date_from} — {work.experience_date_to || work.date_to || "Present"}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span>Salary: ₱{work.monthly_salary || "0.00"}</span>
                      <span>Govt Service: {work.is_govt_service ? "Yes" : "No"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">No work experience records specified.</p>
            )}
          </EvaluationSection>
        </div>

        <div className="space-y-8">
          <EvaluationSection title="Relevant Trainings & Seminars" icon={Award} isPass={isTrainingPass}>
            {applicant?.trainings_list && applicant.trainings_list.length > 0 ? (
              <div className="space-y-3">
                {applicant.trainings_list.map((train, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <h3 className="font-bold text-slate-800">{train.training_title}</h3>
                    <p className="text-slate-600 text-sm">Conducted by: {train.conducted_by || "N/A"} ({train.hours_attended || 0} hours)</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">No training records specified.</p>
            )}
          </EvaluationSection>

          <EvaluationSection title="Civil Service Eligibility" isPass={isEligibilityPass}>
            {applicant?.eligibility_list && applicant.eligibility_list.length > 0 ? (
              <div className="space-y-3">
                {applicant.eligibility_list.map((elig, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <h3 className="font-bold text-slate-800">{elig.eligibility_type}</h3>
                    <p className="text-xs text-slate-600 mt-1">Rating: {elig.rating || "N/A"} | License: {elig.license_number || "N/A"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Exam Date: {elig.date_of_exam || "N/A"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">No eligibility records specified.</p>
            )}
          </EvaluationSection>

          <FinalEvaluationCard
            overallPass={overallPass}
            remarks={applicant?.hr_remarks_notes}
            actionLoading={actionLoading}
            onHandleAction={handleStatusAction}
          />
        </div>
      </div>

      <ActionModal
        isOpen={Boolean(modalError)}
        type="error"
        title="Action Failed"
        message={modalError}
        onClose={() => setModalError(null)}
      />
    </div>
  );
}