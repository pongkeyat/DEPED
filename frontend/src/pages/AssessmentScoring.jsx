import React, { useEffect, useState, useMemo } from "react";
import {
  getAssessmentOptionsByCriterion,
  getQualifiedApplicantForAssessment,
  submitAssessment,
} from "../api/assessmentApi";
import { getInterviewSessions } from "../api/InterviewSessionApi";
import {BASE_CRITERIA_CONFIG} from "../components/assessment/assessmentCriteria";
import SessionSelector from "../components/assessment/SessionSelector";
import ApplicantRow from "../components/assessment/ApplicantRow";
import ActionModal from "../components/ActionModal";

export default function AssessmentScoring() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [sessionApplicants, setSessionApplicants] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [applicantScores, setApplicantScores] = useState({});
  const [submittedApplicants, setSubmittedApplicants] = useState({});
  const [applicantDetails, setApplicantDetails] = useState({});
  const [submittingApplicant, setSubmittingApplicant] = useState("");
  const [loading, setLoading] = useState(true);

  // ActionModal State Management
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "confirm", // "confirm" | "error"
    title: "",
    message: "",
    onConfirm: null,
  });

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const showErrorModal = (title, message) => {
    setModalConfig({
      isOpen: true,
      type: "error",
      title,
      message,
      onConfirm: null,
    });
  };

  const showSuccessModal = (title, message) => {
    setModalConfig({
      isOpen: true,
      type: "error", // Uses single "Close" button format for notifications
      title,
      message,
      onConfirm: null,
    });
  };

  const getApplicantId = (item) => item?.applicant_id || item?.job_applications_id || "";

  // 1. Fetch Dynamic Dropdown Options on Mount
  useEffect(() => {
    const loadDynamicCriteria = async () => {
      try {
        setLoading(true);
        const dynamicCriteria = await Promise.all(
          BASE_CRITERIA_CONFIG.map(async (criterion) => {
            if (criterion.type !== "dropdown") return criterion;

            const res = await getAssessmentOptionsByCriterion(criterion.id);
            const optionsData = Array.isArray(res) ? res : res?.data || [];

            return {
              ...criterion,
              options: optionsData.map((opt) => ({
                value: Number(opt.points),
                label: `${opt.option_label || opt.option_name || opt.description || "Option"} - ${opt.points}`,
                optionId: opt.assessment_option_id,
              })),
            };
          })
        );
        setCriteria(dynamicCriteria);
      } catch (err) {
        console.error("Error loading criteria options:", err);
        showErrorModal("Configuration Error", "Failed to load assessment criteria options.");
      } finally {
        setLoading(false);
      }
    };

    loadDynamicCriteria();
  }, []);

  // 2. Load Interview Sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await getInterviewSessions();
        const data = response?.sessions || response;

        if (!Array.isArray(data)) {
          setSessions([]);
          return;
        }

        // The session endpoint does not include screening status. The
        // qualified-applicant endpoint is the source of truth for filtering.
        const qualifiedRows = await Promise.all(
          data.map(async (session) => {
            const applicantId = getApplicantId(session);

            if (!applicantId) return null;

            try {
              await getQualifiedApplicantForAssessment(applicantId);
              return session;
            } catch {
              return null;
            }
          })
        );

        setSessions(qualifiedRows.filter(Boolean));
      } catch (err) {
        console.error("Error loading sessions:", err);
        showErrorModal("Data Fetch Error", "Unable to load assessment sessions.");
      }
    };
    loadSessions();
  }, []);

  // 3. Fetch Applicants on Session Change
  useEffect(() => {
    let mounted = true;

    if (!selectedSession) {
      setSessionApplicants([]);
      setApplicantScores({});
      setApplicantDetails({});
      return;
    }

    const selectedRows = sessions.filter(
      (session) => String(session.session_id) === String(selectedSession)
    );

    setSessionApplicants(selectedRows);
    setApplicantScores({});
    setSubmittedApplicants({});
    setApplicantDetails({});

    const loadSessionApplicantDetails = async () => {
      try {
        const details = await Promise.all(
          selectedRows.map(async (item) => {
            const id = getApplicantId(item);
            if (!id) return null;
            const res = await getQualifiedApplicantForAssessment(id);
            return [id, res?.data || res];
          })
        );

        if (mounted) {
          setApplicantDetails(Object.fromEntries(details.filter(Boolean)));
        }
      } catch (err) {
        if (mounted) {
          console.error("Error loading applicant details:", err);
          showErrorModal("Data Fetch Error", "Unable to load initial screening scores.");
        }
      }
    };

    loadSessionApplicantDetails();

    return () => {
      mounted = false;
    };
  }, [selectedSession, sessions]);

  // Compute grand total per applicant
  const computeGrandTotal = (item) => {
    const id = getApplicantId(item);
    const details = applicantDetails[id] || item;

    const edu = Number(details?.education_points ?? details?.education?.points ?? 0);
    const trn = Number(details?.training_points ?? details?.training?.points ?? 0);
    const exp = Number(details?.experience_points ?? details?.experience?.points ?? 0);

    const selectedScores = applicantScores[id] || {};
    const dropdownTotal = criteria
      .filter((c) => c.type === "dropdown" || c.type === "text")
      .reduce((sum, c) => sum + Number(selectedScores[c.id] || 0), 0);

    return edu + trn + exp + dropdownTotal;
  };

  // 4. Calculate Rank Status dynamically sorted by Grand Total
  const applicantRanks = useMemo(() => {
    const totals = sessionApplicants.map((item) => ({
      id: getApplicantId(item),
      total: computeGrandTotal(item),
    }));

    totals.sort((a, b) => b.total - a.total);

    const rankMap = {};
    totals.forEach((entry, index) => {
      if (entry.id) {
        rankMap[entry.id] = index + 1;
      }
    });

    return rankMap;
  }, [sessionApplicants, applicantScores, applicantDetails, criteria]);

  const handleScoreChange = (applicantId, criterionId, value) => {
    setApplicantScores((prev) => ({
      ...prev,
      [applicantId]: {
        ...(prev[applicantId] || {}),
        [criterionId]:
          criteria.find((criterion) => criterion.id === criterionId)?.type === "text"
            ? value
            : value === ""
              ? ""
              : Number(value),
      },
    }));
  };

  // Initiate confirmation modal
  const initiateAssess = (item) => {
    const applicantId = getApplicantId(item);
    if (!applicantId) {
      showErrorModal("Invalid Applicant", "Applicant ID could not be found.");
      return;
    }

    const selectedScores = applicantScores[applicantId] || {};

    // Validate required scored criteria
    for (const criterion of criteria) {
      if (criterion.type !== "dropdown" && criterion.type !== "text") continue;
      const score = selectedScores[criterion.id];
      if (score === undefined || score === null || score === "") {
        showErrorModal(
          "Missing Information",
          `Please select a score for ${criterion.name}.`
        );
        return;
      }

      if (criterion.type === "text" && Number.isNaN(Number(score))) {
        showErrorModal(
          "Invalid Score",
          `${criterion.name} must contain a numeric score.`
        );
        return;
      }
    }

    const applicantName =
      `${item?.first_name || ""} ${item?.middle_name || ""} ${item?.last_name || ""}`
        .replace(/\s+/g, " ")
        .trim() || "this applicant";

    const currentRank = applicantRanks[applicantId] || "N/A";

    setModalConfig({
      isOpen: true,
      type: "confirm",
      title: "Confirm Assessment Submission",
      message: `Are you sure you want to submit scores for ${applicantName}? Current calculated status is Rank ${currentRank}.`,
      onConfirm: () => executeAssess(item, applicantId),
    });
  };

  // Submit assessment payload to API
  const executeAssess = async (item, applicantId) => {
    closeModal();
    try {
      setSubmittingApplicant(applicantId);

      const selectedScores = applicantScores[applicantId] || {};

      const submissionScores = criteria
        .filter((c) => c.type === "dropdown" || c.type === "text")
        .map((criterion) => {
          const score = Number(selectedScores[criterion.id]);
          const selectedOption =
            criterion.type === "dropdown"
              ? criterion.options?.find((opt) => opt.value === score)
              : null;

          return {
            assessment_criteria_id: criterion.id,
            assessment_option_id: selectedOption?.optionId || null,
            score,
          };
        });

      await submitAssessment({
        applicant_id: applicantId,
        scored_by: "HR-TEST",
        scores: submissionScores,
        rank: applicantRanks[applicantId] || null,
      });

      setSubmittedApplicants((previous) => ({
        ...previous,
        [applicantId]: applicantRanks[applicantId] || null,
      }));

      showSuccessModal(
        "Assessment Submitted",
        `Scores successfully saved! Assigned Rank: #${applicantRanks[applicantId] || "N/A"}.`
      );
    } catch (err) {
      console.error("Error submitting assessment:", err);
      showErrorModal(
        "Submission Error",
        err.response?.data?.error || err.message || "Unable to submit assessment score."
      );
    } finally {
      setSubmittingApplicant("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="text-gray-500">Loading criteria options & sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Applicant Assessment</h1>
          <p className="mt-1 text-sm text-gray-500">
            Select an assessment session to evaluate and rank applicants.
          </p>
        </header>

        <SessionSelector
          sessions={sessions}
          selectedSession={selectedSession}
          onSelectSession={setSelectedSession}
        />

        {!selectedSession ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-700">Select an Assessment Session</h2>
            <p className="mt-2 text-sm text-gray-500">Choose a session above to display its applicants.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Applicant Scoring</h2>
                <p className="mt-1 text-sm text-gray-500">Ratings automatically calculate and rank applicants.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {sessionApplicants.length} Applicant{sessionApplicants.length !== 1 ? "s" : ""}
              </span>
            </div>

            {sessionApplicants.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-gray-500">No applicants are assigned to this session.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1600px] w-full text-left">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    <tr>
                      <th className="sticky left-0 z-20 bg-gray-50 px-4 py-4 min-w-[220px]">Name</th>
                      {criteria.map((c) => (
                        <th key={c.id} className="px-4 py-4 text-center min-w-[150px]">
                          {c.name}
                        </th>
                      ))}
                      <th className="px-4 py-4 text-center">Subtotal</th>
                      <th className="px-4 py-4 text-center">Grand Total</th>
                      <th className="px-4 py-4 text-center">Status</th>
                      <th className="px-4 py-4 text-right min-w-[140px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sessionApplicants.map((item) => {
                      const id = getApplicantId(item);
                      return (
                        <ApplicantRow
                          key={id || item.session_id}
                          item={item}
                          applicantDetails={applicantDetails}
                          criteria={criteria}
                          scores={applicantScores[id] || {}}
                          rank={applicantRanks[id]}
                          submittedRank={submittedApplicants[id]}
                          onScoreChange={handleScoreChange}
                          onAssess={() => initiateAssess(item)}
                          isSubmitting={submittingApplicant === id}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ActionModal for confirmations and alerts */}
      <ActionModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onClose={closeModal}
      />
    </div>
  );
}