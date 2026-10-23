import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Briefcase,
    GraduationCap,
    Award,
    AlertCircle,
    Calendar
} from "lucide-react";

import { getApplicationById } from "../api/ApplicationApi";
import { postScreening } from "../api/ScreeningApi";
import { getAssessmentCriteria } from "../api/assessmentApi";

import ActionModal from "../components/ActionModal";
import DocumentPreviewModal from "../components/applications/DocumentPreviewModal";
import ApplicantHeader from "../components/appliacantEvaluation/ApplicantHeader";
import QualificationOverview from "../components/appliacantEvaluation/QualificationOverview";
import EvaluationSection from "../components/appliacantEvaluation/EvaluationSection";
import FinalEvaluationCard from "../components/appliacantEvaluation/FinalEvaluationCard";

const getPerformanceAssessmentType = (category) => {
    const normalizedCategory = String(category || "")
        .trim()
        .toUpperCase()
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ");

    const assessmentTypes = {
        "NON TEACHING": "NON_TEACHING",
        "NON TEACHING POSITION": "NON_TEACHING",
        "NON TEACHING POSITIONS": "NON_TEACHING",
        "SCHOOL ADMINISTRATION": "SCHOOL_ADMINISTRATION",
        "SCHOOL ADMINISTRATION POSITION": "SCHOOL_ADMINISTRATION",
        "SCHOOL ADMINISTRATION POSITIONS": "SCHOOL_ADMINISTRATION",
        "RELATED TEACHING": "RELATED_TEACHING",
        "RELATED TEACHING POSITION": "RELATED_TEACHING",
        "RELATED TEACHING POSITIONS": "RELATED_TEACHING",
    };

    return assessmentTypes[normalizedCategory] || "";
};

const getPerformanceScore = (optionPoints, assessmentType, maxPoints) => {
    const points = Number(optionPoints);

    if (points > 5) {
        return points;
    }

    if (assessmentType === "RELATED_TEACHING") {
        return (points / 5) * 20;
    }

    return (points / 5) * Number(maxPoints);
};

const getPerformanceRatingFile = (path) => {
    const filePath = String(path || "").trim();
    if (!filePath) return null;

    const normalizedPath = filePath.replace(/\\/g, "/");
    const encodedFileName =
        normalizedPath.split("/").pop() || "Performance rating file";
    let fileName = encodedFileName;
    try {
        fileName = decodeURIComponent(encodedFileName);
    } catch {
        // Keep the encoded filename if it is not valid URI encoding.
    }
    const extension = fileName.split(".").pop()?.toLowerCase();
    const typeByExtension = {
        pdf: "application/pdf",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
    };

    let url;
    try {
        const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
        url = new URL(normalizedPath, new URL(apiBaseUrl).origin).toString();
    } catch (error) {
        console.error("Invalid Performance rating file URL:", error);
        return null;
    }

    return {
        url,
        name: fileName,
        type: typeByExtension[extension] || "",
        isImage: String(typeByExtension[extension] || "").startsWith("image/"),
    };
};

const getStatusStyles = (status) => {
    switch (status) {
        case "Initial Screening":
            return "bg-orange-100 text-orange-700 border-orange-200";

        case "For Assessment":
            return "bg-violet-100 text-violet-700 border-violet-200";

        case "Ranked":
            return "bg-teal-100 text-teal-700 border-teal-200";

        case "Qualified":
        case "complete":
            return "bg-emerald-100 text-emerald-700 border-emerald-200";

        case "Disqualified":
            return "bg-rose-100 text-rose-700 border-rose-200";

        default:
            return "bg-slate-100 text-slate-700 border-slate-200";
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
    const [performanceCriterion, setPerformanceCriterion] = useState(null);
    const [selectedPerformanceOptionId, setSelectedPerformanceOptionId] =
        useState("");
    const [performanceOptionsLoading, setPerformanceOptionsLoading] =
        useState(false);
    const [performanceOptionsError, setPerformanceOptionsError] =
        useState("");
    const [performanceFilePreview, setPerformanceFilePreview] = useState(null);

    // Confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // ======================================================
    // FETCH APPLICANT
    // ======================================================

    useEffect(() => {
        const fetchApplicantDetails = async () => {
            try {
                setLoading(true);

                const response = await getApplicationById(id);

                const data =
                    response && response.data
                        ? response.data
                        : response;

                setApplicant(data);
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

    const performanceAssessmentType =
        getPerformanceAssessmentType(applicant?.category);
    const performanceRatingFile = getPerformanceRatingFile(
        applicant?.performance_rating_path
    );

    useEffect(() => {
        let mounted = true;

        const loadPerformanceOptions = async () => {
            setPerformanceCriterion(null);
            setSelectedPerformanceOptionId("");
            setPerformanceOptionsError("");

            if (!performanceAssessmentType) {
                setPerformanceOptionsLoading(false);
                return;
            }

            try {
                setPerformanceOptionsLoading(true);

                const response = await getAssessmentCriteria(
                    performanceAssessmentType
                );
                const criteria = Array.isArray(response)
                    ? response
                    : response?.data || [];
                const criterion = criteria.find(
                    (item) =>
                        String(
                            item?.criterion_name ||
                                item?.name ||
                                ""
                        )
                            .trim()
                            .toUpperCase() === "PERFORMANCE" &&
                        Array.isArray(item?.options) &&
                        item.options.length > 0
                );
                const options = Array.isArray(criterion?.options)
                    ? criterion.options.filter(
                        (option) =>
                            Number.isInteger(
                                Number(option.assessment_option_id)
                            ) &&
                            Number.isFinite(Number(option.points))
                    )
                    : [];

                if (mounted && criterion && options.length > 0) {
                    setPerformanceCriterion({
                        ...criterion,
                        options,
                    });
                }
            } catch (err) {
                console.error(
                    "Error loading Performance assessment options:",
                    err
                );
                if (mounted) {
                    setPerformanceOptionsError(
                        "Performance ratings could not be loaded. You can still complete the existing evaluation fields."
                    );
                }
            } finally {
                if (mounted) {
                    setPerformanceOptionsLoading(false);
                }
            }
        };

        loadPerformanceOptions();

        return () => {
            mounted = false;
        };
    }, [performanceAssessmentType]);

    const selectedPerformanceOption =
        performanceCriterion?.options?.find(
            (option) =>
                Number(option.assessment_option_id) ===
                Number(selectedPerformanceOptionId)
        );
    const selectedPerformancePoints =
        selectedPerformanceOption
            ? getPerformanceScore(
                selectedPerformanceOption.points,
                performanceAssessmentType,
                performanceCriterion.max_points
            )
            : null;

    // ======================================================
    // LOADING
    // ======================================================

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

    // ======================================================
    // ERROR
    // ======================================================

    if (error || !applicant) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-8 shadow-md text-center max-w-md w-full">
                    <AlertCircle className="text-red-500 w-12 h-12 mx-auto mb-3" />

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

    // ======================================================
    // QUALIFICATION DATA
    // ======================================================

    const education =
        applicant?.education_requirement ||
        applicant?.education ||
        applicant?.education_attained ||
        "Not Specified";

    const experience =
        applicant?.experience_requirement ||
        applicant?.experience ||
        applicant?.work_experience ||
        "Not Specified";

    const training =
        applicant?.training_requirement ||
        applicant?.training ||
        applicant?.training_hours ||
        "Not Specified";

    const eligibility =
        applicant?.eligibility_requirement ||
        applicant?.eligibility ||
        applicant?.civil_service ||
        "Not Specified";

    const isEducationPass = Boolean(
        applicant?.education_list &&
        applicant.education_list.length > 0
    );

    const isExperiencePass = Boolean(
        applicant?.work_experience_list &&
        applicant.work_experience_list.length > 0
    );

    const isTrainingPass = Boolean(
        applicant?.trainings_list &&
        applicant.trainings_list.length > 0
    );

    const isEligibilityPass = Boolean(
        applicant?.eligibility_list &&
        applicant.eligibility_list.length > 0
    );

    const overallPass =
        isEducationPass &&
        isExperiencePass &&
        isTrainingPass &&
        isEligibilityPass;

    // ======================================================
    // OPEN CONFIRMATION
    // ======================================================

    const handleStatusAction = () => {
        if (actionLoading) return;

        setShowConfirmModal(true);
    };

    // ======================================================
    // CONFIRM SCREENING
    // ======================================================

    const handleConfirmScreening = async () => {
        setShowConfirmModal(false);

        try {
            setActionLoading(true);
            setModalError(null);

            // Get evaluator ID from localStorage
            const currentEvaluatorId =
                localStorage.getItem("user_id") || 1;

            const payload = {
                job_applications_id:
                    applicant?.job_applications_id || id,

                applicant_id:
                    applicant?.applicant_id,

                education_passed:
                    isEducationPass,

                education_remarks:
                    isEducationPass
                        ? "Meets education requirement"
                        : "Does not meet education requirement",

                eligibility_passed:
                    isEligibilityPass,

                eligibility_remarks:
                    isEligibilityPass
                        ? "Meets eligibility requirement"
                        : "Does not meet eligibility requirement",

                training_passed:
                    isTrainingPass,

                training_remarks:
                    isTrainingPass
                        ? "Meets training requirement"
                        : "Does not meet training requirement",

                experience_passed:
                    isExperiencePass,

                experience_remarks:
                    isExperiencePass
                        ? "Meets experience requirement"
                        : "Does not meet experience requirement",

                overall_result:
                    overallPass
                        ? "qualified"
                        : "disqualified",

                general_remarks:
                    applicant?.hr_remarks_notes ||
                    (
                        overallPass
                            ? "Applicant passed initial screening."
                            : "Applicant failed initial screening."
                    ),

                screened_by:
                    currentEvaluatorId,

                submitted_documents_passed:
                    overallPass,

                documents_note:
                    null
            };

            if (selectedPerformanceOption) {
                payload.performance_assessment_option_id =
                    Number(
                        selectedPerformanceOption.assessment_option_id
                    );
                payload.performance_points =
                    selectedPerformancePoints;
            }

            await postScreening(payload);

            // Update local state
            setApplicant((prev) => ({
                ...prev,
                application_status:
                    overallPass
                        ? "qualified"
                        : "disqualified"
            }));

            // Return to previous page
            navigate(-1);
        } catch (err) {
            console.error(
                "Error submitting screening evaluation:",
                err
            );

            const apiErrorMessage =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                "Failed to update applicant status. Please try again.";

            setModalError(apiErrorMessage);
        } finally {
            setActionLoading(false);
        }
    };

    // ======================================================
    // RENDER
    // ======================================================

    return (
        <div className="min-h-screen p-6 relative">

            {/* HEADER */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                <button
                    onClick={() =>
                        navigate(
                            `/applicants/${encodeURIComponent(id)}`
                        )
                    }
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-semibold text-[#1E3E74] shadow hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Applications
                </button>

                <div className="flex items-center gap-3">
                    <span
                        className={`rounded-full border px-4 py-1.5 text-sm font-bold shadow-sm ${getStatusStyles(
                            applicant?.application_status
                        )}`}
                    >
                        Status:{" "}
                        {applicant?.application_status ||
                            "Initial Screening"}
                    </span>
                </div>
            </div>

            {/* APPLICANT HEADER */}
            <ApplicantHeader
                applicant={applicant}
            />

            {/* QUALIFICATION OVERVIEW */}
            <QualificationOverview
                education={education}
                experience={experience}
                training={training}
                eligibility={eligibility}
            />

            {/* EVALUATION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT COLUMN */}
                <div className="space-y-8">

                    {/* EDUCATION */}
                    <EvaluationSection
                        title="Education Background"
                        icon={GraduationCap}
                        isPass={isEducationPass}
                    >
                        {applicant?.education_list &&
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
                                                            edu.education_level}
                                                    </h3>

                                                    <p className="text-slate-600 text-sm">
                                                        {edu.school_name}
                                                    </p>
                                                </div>

                                                <span className="text-xs px-3 py-1 bg-blue-100 text-[#1E3E74] rounded-full font-semibold">
                                                    {edu.education_level}
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
                    </EvaluationSection>

                    {/* WORK EXPERIENCE */}
                    <EvaluationSection
                        title="Work Experience"
                        icon={Briefcase}
                        isPass={isExperiencePass}
                    >
                        {applicant?.work_experience_list &&
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
                                                        {work.company_office}
                                                    </h3>

                                                    <p className="text-slate-600 text-sm font-medium">
                                                        {work.appointment_status ||
                                                            "Position/Status N/A"}
                                                    </p>
                                                </div>

                                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                    <Calendar size={13} />

                                                    {work.experience_date_from ||
                                                        work.date_from}{" "}
                                                    —{" "}
                                                    {work.experience_date_to ||
                                                        work.date_to ||
                                                        "Present"}
                                                </span>
                                            </div>

                                            <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                                <span>
                                                    Salary: ₱
                                                    {work.monthly_salary ||
                                                        "0.00"}
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
                    </EvaluationSection>

                    {performanceAssessmentType && (
                        <EvaluationSection
                            title="Performance Rating"
                            icon={Award}
                        >
                            {performanceRatingFile && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPerformanceFilePreview({
                                            url: performanceRatingFile.url,
                                            name: performanceRatingFile.name,
                                            type: performanceRatingFile.type,
                                        })
                                    }
                                    className="mb-4 flex w-full max-w-xs items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2 text-left transition hover:border-[#1E3E74] hover:bg-blue-50"
                                    aria-label={`Preview ${performanceRatingFile.name}`}
                                >
                                    {performanceRatingFile.isImage ? (
                                        <img
                                            src={performanceRatingFile.url}
                                            alt="Performance rating document thumbnail"
                                            className="h-16 w-16 rounded-lg border border-slate-200 bg-white object-cover"
                                        />
                                    ) : (
                                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-[#1E3E74]">
                                            {performanceRatingFile.type ===
                                            "application/pdf"
                                                ? "PDF"
                                                : "FILE"}
                                        </span>
                                    )}
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-slate-700">
                                            Performance rating file
                                        </span>
                                        <span className="block truncate text-xs text-slate-500">
                                            {performanceRatingFile.name}
                                        </span>
                                        <span className="mt-1 block text-xs font-medium text-[#1E3E74]">
                                            Click to preview
                                        </span>
                                    </span>
                                </button>
                            )}
                            {performanceOptionsLoading ? (
                                <p className="text-sm text-slate-500">
                                    Loading active Performance ratings...
                                </p>
                            ) : performanceOptionsError ? (
                                <p className="text-sm text-amber-700">
                                    {performanceOptionsError}
                                </p>
                            ) : performanceCriterion?.options?.length ? (
                                <div>
                                    <label
                                        htmlFor="initial-performance-rating"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Select a Performance rating
                                    </label>
                                    <select
                                        id="initial-performance-rating"
                                        value={selectedPerformanceOptionId}
                                        onChange={(event) =>
                                            setSelectedPerformanceOptionId(
                                                event.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1E3E74] focus:ring-1 focus:ring-[#1E3E74]"
                                    >
                                        <option value="">
                                            Select Performance rating
                                        </option>
                                        {performanceCriterion.options.map(
                                            (option) => (
                                                <option
                                                    key={
                                                        option.assessment_option_id
                                                    }
                                                    value={
                                                        option.assessment_option_id
                                                    }
                                                >
                                                    {option.option_label} (
                                                    {option.points} points)
                                                </option>
                                            )
                                        )}
                                    </select>
                                    {selectedPerformanceOption && (
                                        <p className="mt-2 text-sm text-slate-600">
                                            Performance score:{" "}
                                            <span className="font-semibold text-slate-800">
                                                {selectedPerformancePoints}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">
                                    No active Performance rating options are configured for this category.
                                </p>
                            )}
                        </EvaluationSection>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-8">

                    {/* TRAINING */}
                    <EvaluationSection
                        title="Relevant Trainings & Seminars"
                        icon={Award}
                        isPass={isTrainingPass}
                    >
                        {applicant?.trainings_list &&
                        applicant.trainings_list.length > 0 ? (
                            <div className="space-y-3">
                                {applicant.trainings_list.map(
                                    (train, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                                        >
                                            <h3 className="font-bold text-slate-800">
                                                {train.training_title}
                                            </h3>

                                            <p className="text-slate-600 text-sm">
                                                Conducted by:{" "}
                                                {train.conducted_by ||
                                                    "N/A"}{" "}
                                                (
                                                {train.hours_attended ||
                                                    0}{" "}
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
                    </EvaluationSection>

                    {/* ELIGIBILITY */}
                    <EvaluationSection
                        title="Civil Service Eligibility"
                        isPass={isEligibilityPass}
                    >
                        {applicant?.eligibility_list &&
                        applicant.eligibility_list.length > 0 ? (
                            <div className="space-y-3">
                                {applicant.eligibility_list.map(
                                    (elig, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                                        >
                                            <h3 className="font-bold text-slate-800">
                                                {elig.eligibility_type}
                                            </h3>

                                            <p className="text-xs text-slate-600 mt-1">
                                                Rating:{" "}
                                                {elig.rating ||
                                                    "N/A"}{" "}
                                                | License:{" "}
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
                    </EvaluationSection>

                    {/* FINAL EVALUATION */}
                    <FinalEvaluationCard
                        overallPass={overallPass}
                        remarks={applicant?.hr_remarks_notes}
                        actionLoading={actionLoading}
                        onHandleAction={handleStatusAction}
                    />
                </div>
            </div>

            {/* ======================================================
                CONFIRMATION MODAL
            ====================================================== */}

            <ActionModal
                isOpen={showConfirmModal}
                type="confirm"
                title="Confirm Initial Screening"
                message={
                    overallPass
                        ? "Are you sure you want to submit this applicant as Qualified? This will update the applicant's screening result."
                        : "Are you sure you want to submit this applicant as Not Qualified? This will update the applicant's screening result."
                }
                onClose={() => {
                    if (!actionLoading) {
                        setShowConfirmModal(false);
                    }
                }}
                onConfirm={handleConfirmScreening}
            />

            {/* ======================================================
                ERROR MODAL
            ====================================================== */}

            <ActionModal
                isOpen={Boolean(modalError)}
                type="error"
                title="Action Failed"
                message={modalError}
                onClose={() => setModalError(null)}
            />

            {performanceFilePreview && (
                <DocumentPreviewModal
                    file={performanceFilePreview}
                    onClose={() => setPerformanceFilePreview(null)}
                />
            )}
        </div>
    );
}