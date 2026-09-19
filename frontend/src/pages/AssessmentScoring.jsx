import React, { useEffect, useState, useMemo } from "react";

import {
  getAssessmentCriteria,
  getQualifiedApplicantForAssessment,
  submitAssessment,
} from "../api/assessmentApi";

import { getInterviewSessions } from "../api/InterviewSessionApi";

import { BASE_CRITERIA_CONFIG } from "../components/assessment/assessmentCriteria";

import SessionSelector from "../components/assessment/SessionSelector";
import ApplicantRow from "../components/assessment/ApplicantRow";
import ActionModal from "../components/ActionModal";

export default function AssessmentScoring() {
  // ============================================================
  // STATE
  // ============================================================

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");

  const [sessionApplicants, setSessionApplicants] = useState([]);

  const [criteria, setCriteria] = useState([]);

  const [applicantScores, setApplicantScores] = useState({});

  const [submittedApplicants, setSubmittedApplicants] = useState({});

  const [applicantDetails, setApplicantDetails] = useState({});

  const [submittingApplicant, setSubmittingApplicant] =
    useState("");

  const [loading, setLoading] = useState(true);

  // ============================================================
  // MODAL
  // ============================================================

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "confirm",
    title: "",
    message: "",
    onConfirm: null,
  });

  const closeModal = () => {
    setModalConfig((prev) => ({
      ...prev,
      isOpen: false,
    }));
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
      type: "success",
      title,
      message,
      onConfirm: null,
    });
  };

  // ============================================================
  // GET APPLICANT ID
  // ============================================================

  const getApplicantId = (item) => {
    return (
      item?.applicant_id ||
      item?.job_applications_id ||
      ""
    );
  };

  // ============================================================
  // GET POSITION / CATEGORY / ASSESSMENT TYPE
  // ============================================================

  const getPositionTitle = (session) => {
    return String(
      session?.position_title ||
        session?.position ||
        session?.vacancy?.position_title ||
        ""
    ).trim().toUpperCase();
  };

  const getCategory = (session) => {
    return String(
      session?.category ||
        session?.position_category ||
        session?.vacancy_category ||
        session?.vacancy?.category ||
        ""
    ).trim().toUpperCase();
  };

  /*
   * assessment_type is the source of truth.
   *
   * It can come directly from the interview session, vacancy,
   * or position. We do NOT hard-code criterion names here.
   */
  const getAssessmentType = (session) => {
    // 1. Prefer an assessment_type already supplied by the backend.
    const explicitType =
      session?.assessment_type ??
      session?.assessmentType ??
      session?.vacancy?.assessment_type ??
      session?.vacancy?.assessmentType ??
      session?.position?.assessment_type ??
      session?.position?.assessmentType ??
      "";

    if (String(explicitType).trim()) {
      return String(explicitType)
        .trim()
        .toUpperCase();
    }

    // 2. If the session does not contain assessment_type,
    // derive it from the category that is already present.
    const category = String(
      session?.category ??
        session?.position_category ??
        session?.vacancy_category ??
        session?.vacancy?.category ??
        ""
    )
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ");

    if (
      category === "TEACHING" ||
      category === "TEACHING POSITIONS"
    ) {
      return "TEACHING";
    }

    if (
      category === "RELATED TEACHING" ||
      category === "RELATED-TEACHING"
    ) {
      return "RELATED_TEACHING";
    }

    if (
      category === "SCHOOL ADMINISTRATION" ||
      category === "SCHOOL ADMINISTRATION POSITIONS"
    ) {
      return "SCHOOL_ADMINISTRATION";
    }

    if (
      category === "NON-TEACHING" ||
      category === "NON TEACHING" ||
      category === "NON-TEACHING POSITIONS"
    ) {
      return "NON_TEACHING";
    }

    return "";
  };

  const getSessionCategoryName = (session) => {
    const assessmentType = getAssessmentType(session);
    const category = getCategory(session);

    if (assessmentType === "TEACHING") return "Teaching";
    if (assessmentType === "RELATED_TEACHING") return "Related Teaching";
    if (assessmentType === "SCHOOL_ADMINISTRATION") return "School Administration";
    if (assessmentType === "NON_TEACHING") return "Non-Teaching";

    if (category.includes("RELATED") && category.includes("TEACHING")) {
      return "Related Teaching";
    }

    if (category.includes("TEACHING")) {
      return "Teaching";
    }

    if (category.includes("SCHOOL ADMIN")) {
      return "School Administration";
    }

    return "Non-Teaching";
  };

  // ============================================================
  // 1. LOAD INTERVIEW SESSIONS
  // ============================================================

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);

        const response =
          await getInterviewSessions();

        const data =
          response?.sessions || response;

        if (!Array.isArray(data)) {
          setSessions([]);
          return;
        }

        // ------------------------------------------------------
        // Only keep sessions with qualified applicants
        // ------------------------------------------------------

        const qualifiedRows =
          await Promise.all(
            data.map(async (session) => {
              const applicantId =
                getApplicantId(session);

              if (!applicantId) {
                return null;
              }

              try {
                await getQualifiedApplicantForAssessment(
                  applicantId
                );

                return session;
              } catch {
                return null;
              }
            })
          );

        setSessions(
          qualifiedRows.filter(Boolean)
        );
      } catch (err) {
        console.error(
          "Error loading sessions:",
          err
        );

        showErrorModal(
          "Data Fetch Error",
          "Unable to load assessment sessions."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  // ============================================================
  // 2. GET SELECTED SESSION
  // ============================================================

  const selectedSessionData = useMemo(() => {
    if (!selectedSession) {
      return null;
    }

    return (
      sessions.find(
        (session) =>
          String(session.session_id) ===
          String(selectedSession)
      ) || null
    );
  }, [selectedSession, sessions]);

  // ============================================================
  // 3. LOAD CRITERIA BY ASSESSMENT TYPE
  // ============================================================

  useEffect(() => {
    const loadDynamicCriteria = async () => {
      if (!selectedSessionData) {
        setCriteria([]);
        return;
      }

      try {
        setLoading(true);

        const assessmentType =
          getAssessmentType(selectedSessionData);

        console.log("=================================");
        console.log("ASSESSMENT SESSION");
        console.log("Position:", getPositionTitle(selectedSessionData));
        console.log("Category:", getCategory(selectedSessionData));
        console.log("Assessment Type:", assessmentType);
        console.log("=================================");

        if (!assessmentType) {
          setCriteria([]);
          showErrorModal(
            "Assessment Type Missing",
            "This assessment session does not have an assessment type. Please configure the assessment_type in the database."
          );
          return;
        }

        // Initial screening is common and is NOT loaded from
        // assessment_criteria.
        const initialCriteria =
          BASE_CRITERIA_CONFIG
            .filter((criterion) => criterion.type === "initial")
            .map((criterion) => ({
              ...criterion,
              id: Number(criterion.id),
              name: String(criterion.name || "").trim(),
            }));

        /*
         * The API now returns:
         *
         * [
         *   {
         *     assessment_criteria_id,
         *     criterion_name,
         *     max_points,
         *     is_manual,
         *     assessment_type,
         *     options: [...]
         *   }
         * ]
         *
         * No criterion names are hard-coded here.
         */
        const response =
          await getAssessmentCriteria(assessmentType);

        const criteriaData =
          Array.isArray(response)
            ? response
            : response?.data || [];

        console.log(
          "Criteria returned by assessment_type:",
          criteriaData
        );

        const processedAssessmentCriteria =
          criteriaData.map((criterion) => {
            const name = String(
              criterion.criterion_name ||
                criterion.name ||
                ""
            ).trim();

            const isManual =
              Boolean(criterion.is_manual);

            const type =
              isManual
                ? "text"
                : "dropdown";

            const options =
              Array.isArray(criterion.options)
                ? criterion.options
                    .map((opt) => ({
                      value: Number(opt.points),
                      label:
                        `${opt.option_label || "Option"} - ${opt.points}`,
                      optionId:
                        Number(opt.assessment_option_id),
                    }))
                    .filter(
                      (opt) =>
                        Number.isFinite(opt.value)
                    )
                : [];

            return {
              id:
                Number(
                  criterion.assessment_criteria_id
                ),

              name,

              type,

              max:
                Number(
                  criterion.max_points || 0
                ),

              options,

              assessmentType:
                criterion.assessment_type ||
                assessmentType,

              isManual,
            };
          });

        const finalCriteria = [
          ...initialCriteria,
          ...processedAssessmentCriteria,
        ];

        console.log(
          "FINAL CRITERIA:",
          finalCriteria
        );

        setCriteria(finalCriteria);

      } catch (err) {
        console.error(
          "Error loading criteria:",
          err
        );

        setCriteria([]);

        showErrorModal(
          "Configuration Error",
          err.response?.data?.message ||
            err.message ||
            "Failed to load assessment criteria for this assessment type."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDynamicCriteria();
  }, [selectedSessionData]);

  // ============================================================
  // 4. FETCH APPLICANTS WHEN SESSION CHANGES
  // ============================================================

  useEffect(() => {
    let mounted = true;

    if (!selectedSession) {
      setSessionApplicants([]);
      setApplicantScores({});
      setApplicantDetails({});
      setSubmittedApplicants({});
      return;
    }

    const selectedRows =
      sessions.filter(
        (session) =>
          String(session.session_id) ===
          String(selectedSession)
      );

    setSessionApplicants(
      selectedRows
    );

    setApplicantScores({});
    setSubmittedApplicants({});
    setApplicantDetails({});

    const loadSessionApplicantDetails =
      async () => {
        try {
          const details =
            await Promise.all(
              selectedRows.map(
                async (item) => {
                  const id =
                    getApplicantId(
                      item
                    );

                  if (!id) {
                    return null;
                  }

                  const res =
                    await getQualifiedApplicantForAssessment(
                      id
                    );

                  return [
                    id,
                    res?.data || res,
                  ];
                }
              )
            );

          if (mounted) {
            setApplicantDetails(
              Object.fromEntries(
                details.filter(Boolean)
              )
            );
          }
        } catch (err) {
          if (mounted) {
            console.error(
              "Error loading applicant details:",
              err
            );

            showErrorModal(
              "Data Fetch Error",
              "Unable to load initial screening scores."
            );
          }
        }
      };

    loadSessionApplicantDetails();

    return () => {
      mounted = false;
    };
  }, [selectedSession, sessions]);

  // ============================================================
  // 5. GET INITIAL SCREENING SCORE
  // ============================================================

  const getInitialScreeningScore = (
    item,
    criterionName
  ) => {
    const id =
      getApplicantId(item);

    const details =
      applicantDetails[id] || item;

    const name =
      String(
        criterionName || ""
      )
        .trim()
        .toUpperCase();

    if (
      name === "EDUCATION"
    ) {
      return Number(
        details?.education_points ??
          details?.education?.points ??
          details?.initial_screening?.education?.points ??
          0
      );
    }

    if (
      name === "TRAINING"
    ) {
      return Number(
        details?.training_points ??
          details?.training?.points ??
          details?.initial_screening?.training?.points ??
          0
      );
    }

    if (
      name === "EXPERIENCE"
    ) {
      return Number(
        details?.experience_points ??
          details?.experience?.points ??
          details?.initial_screening?.experience?.points ??
          0
      );
    }

    return 0;
  };

  // ============================================================
  // 6. COMPUTE GRAND TOTAL
  // ============================================================

  const computeGrandTotal = (
    item
  ) => {
    const id =
      getApplicantId(item);

    const initialTotal =
      getInitialScreeningScore(
        item,
        "Education"
      ) +
      getInitialScreeningScore(
        item,
        "Training"
      ) +
      getInitialScreeningScore(
        item,
        "Experience"
      );

    const selectedScores =
      applicantScores[id] || {};

    const assessmentTotal =
      criteria
        .filter(
          (criterion) =>
            criterion.type ===
              "dropdown" ||
            criterion.type === "text"
        )
        .reduce(
          (
            sum,
            criterion
          ) =>
            sum +
            Number(
              selectedScores[
                criterion.id
              ] || 0
            ),
          0
        );

    return (
      initialTotal +
      assessmentTotal
    );
  };

  // ============================================================
  // 7. CALCULATE RANK
  // ============================================================

  const applicantRanks =
    useMemo(() => {
      const totals =
        sessionApplicants.map(
          (item) => ({
            id:
              getApplicantId(
                item
              ),

            total:
              computeGrandTotal(
                item
              ),
          })
        );

      totals.sort(
        (a, b) =>
          b.total - a.total
      );

      const rankMap = {};

      totals.forEach(
        (
          entry,
          index
        ) => {
          if (entry.id) {
            rankMap[
              entry.id
            ] = index + 1;
          }
        }
      );

      return rankMap;
    }, [
      sessionApplicants,
      applicantScores,
      applicantDetails,
      criteria,
    ]);

  // ============================================================
  // 8. HANDLE SCORE CHANGE
  // ============================================================

  const handleScoreChange = (
    applicantId,
    criterionId,
    value
  ) => {
    setApplicantScores(
      (prev) => ({
        ...prev,

        [applicantId]: {
          ...(prev[
            applicantId
          ] || {}),

          [criterionId]:
            criteria.find(
              (criterion) =>
                criterion.id ===
                criterionId
            )?.type === "text"
              ? value
              : value === ""
              ? ""
              : Number(value),
        },
      })
    );
  };

  // ============================================================
  // 9. INITIATE ASSESSMENT
  // ============================================================

  const initiateAssess = (
    item
  ) => {
    const applicantId =
      getApplicantId(item);

    if (!applicantId) {
      showErrorModal(
        "Invalid Applicant",
        "Applicant ID could not be found."
      );

      return;
    }

    const selectedScores =
      applicantScores[
        applicantId
      ] || {};

    // ----------------------------------------------------------
    // Check every actual assessment criterion
    // ----------------------------------------------------------

    for (
      const criterion of criteria
    ) {
      if (
        criterion.type !==
          "dropdown" &&
        criterion.type !== "text"
      ) {
        continue;
      }

      const score =
        selectedScores[
          criterion.id
        ];

      if (
        score === undefined ||
        score === null ||
        score === ""
      ) {
        showErrorModal(
          "Missing Information",
          `Please select or enter a score for ${criterion.name}.`
        );

        return;
      }

      // --------------------------------------------------------
      // Validate manual score
      // --------------------------------------------------------

      if (
        criterion.type ===
          "text" &&
        Number.isNaN(
          Number(score)
        )
      ) {
        showErrorModal(
          "Invalid Score",
          `${criterion.name} must contain a numeric score.`
        );

        return;
      }

      // --------------------------------------------------------
      // Validate maximum score
      // --------------------------------------------------------

      if (
        criterion.max !==
          undefined &&
        Number(score) >
          Number(
            criterion.max
          )
      ) {
        showErrorModal(
          "Invalid Score",
          `${criterion.name} cannot exceed ${criterion.max} points.`
        );

        return;
      }

      if (
        Number(score) < 0
      ) {
        showErrorModal(
          "Invalid Score",
          `${criterion.name} cannot be negative.`
        );

        return;
      }
    }

    const applicantName =
      `${item?.first_name || ""} ${
        item?.middle_name || ""
      } ${
        item?.last_name || ""
      }`
        .replace(
          /\s+/g,
          " "
        )
        .trim() ||
      "this applicant";

    const currentRank =
      applicantRanks[
        applicantId
      ] || "N/A";

    const category =
      getSessionCategoryName(
        selectedSessionData
      );

    setModalConfig({
      isOpen: true,

      type: "confirm",

      title:
        "Confirm Assessment Submission",

      message:
        `Are you sure you want to submit the ${category} assessment scores for ${applicantName}? Current calculated status is Rank ${currentRank}.`,

      onConfirm: () =>
        executeAssess(
          item,
          applicantId
        ),
    });
  };

  // ============================================================
  // 10. SUBMIT ASSESSMENT
  // ============================================================

  const executeAssess = async (
    item,
    applicantId
  ) => {
    closeModal();

    try {
      setSubmittingApplicant(
        applicantId
      );

      const selectedScores =
        applicantScores[
          applicantId
        ] || {};

      // --------------------------------------------------------
      // Only submit actual assessment criteria
      // Do NOT submit Education / Training / Experience
      // --------------------------------------------------------

      const submissionScores =
        criteria
          .filter(
            (criterion) =>
              criterion.type ===
                "dropdown" ||
              criterion.type === "text"
          )
          .map(
            (criterion) => {
              const score =
                Number(
                  selectedScores[
                    criterion.id
                  ]
                );

              const selectedOption =
                criterion.type ===
                "dropdown"
                  ? criterion.options?.find(
                      (opt) =>
                        Number(
                          opt.value
                        ) ===
                        score
                    )
                  : null;

              return {
                assessment_criteria_id:
                  Number(
                    criterion.id
                  ),

                assessment_option_id:
                  selectedOption?.optionId ||
                  null,

                score,
              };
            }
          );

      console.log(
        "Submitting assessment:",
        {
          applicant_id:
            applicantId,

          scores:
            submissionScores,
        }
      );

      await submitAssessment({
        applicant_id:
          applicantId,

        scored_by:
          "HR-TEST",

        scores:
          submissionScores,

        rank:
          applicantRanks[
            applicantId
          ] || null,
      });

      // --------------------------------------------------------
      // Mark as submitted
      // --------------------------------------------------------

      setSubmittedApplicants(
        (previous) => ({
          ...previous,

          [applicantId]:
            applicantRanks[
              applicantId
            ] || null,
        })
      );

      showSuccessModal(
        "Assessment Submitted",
        `Scores successfully saved! Assigned Rank: #${
          applicantRanks[
            applicantId
          ] || "N/A"
        }.`
      );

    } catch (err) {
      console.error(
        "Error submitting assessment:",
        err
      );

      showErrorModal(
        "Submission Error",
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Unable to submit assessment score."
      );

    } finally {
      setSubmittingApplicant(
        ""
      );
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="text-gray-500">
            Loading assessment sessions and criteria...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // SELECTED SESSION CATEGORY
  // ============================================================

  const currentCategory =
    selectedSessionData
      ? getSessionCategoryName(
          selectedSessionData
        )
      : "";

  const currentPosition =
    selectedSessionData
      ? getPositionTitle(
          selectedSessionData
        )
      : "";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <div className="mx-auto max-w-[1800px]">

        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <header className="mb-6">

          <h1 className="text-2xl font-bold text-gray-900">
            Applicant Assessment
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Select an assessment session to evaluate and rank applicants.
          </p>

        </header>

        {/* ======================================================
            SESSION SELECTOR
        ====================================================== */}

        <SessionSelector
          sessions={sessions}
          selectedSession={
            selectedSession
          }
          onSelectSession={
            setSelectedSession
          }
        />

        {/* ======================================================
            NO SESSION
        ====================================================== */}

        {!selectedSession ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">

            <h2 className="text-lg font-semibold text-gray-700">
              Select an Assessment Session
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Choose a session above to display its applicants.
            </p>

          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm">

            {/* ==================================================
                SESSION INFORMATION
            ================================================== */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>

                <h2 className="text-lg font-semibold text-gray-900">
                  Applicant Scoring
                </h2>

                <div className="mt-2 flex flex-wrap gap-2">

                  {/* Category */}

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      currentCategory ===
                      "Teaching"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {currentCategory ||
                      "Unknown Category"}
                  </span>

                  {/* Position */}

                  {currentPosition && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {currentPosition}
                    </span>
                  )}

                </div>

                <p className="mt-2 text-sm text-gray-500">
                  Initial Screening:{" "}
                  <strong>30 points</strong>
                  {" "}+
                  {" "}
                  Assessment:{" "}
                  <strong>
                    {criteria
                      .filter((c) => c.type !== "initial")
                      .reduce(
                        (sum, c) =>
                          sum + Number(c.max || 0),
                        0
                      )}{" "}
                    points
                  </strong>
                </p>

              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">

                {sessionApplicants.length}{" "}

                Applicant
                {sessionApplicants.length !==
                1
                  ? "s"
                  : ""}

              </span>

            </div>

            {/* ==================================================
                APPLICANTS
            ================================================== */}

            {sessionApplicants.length ===
            0 ? (
              <div className="p-10 text-center">

                <p className="text-sm text-gray-500">
                  No applicants are assigned to this session.
                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="min-w-[1900px] w-full text-left">

                  {/* =================================================
                      TABLE HEADER
                  ================================================= */}

                  <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600">

                    <tr>

                      <th className="sticky left-0 z-20 min-w-[240px] bg-gray-50 px-4 py-4">
                        Applicant
                      </th>

                      {/* =================================================
                          CRITERIA
                      ================================================= */}

                      {criteria.map(
                        (criterion) => (
                          <th
                            key={
                              criterion.id
                            }
                            className="min-w-[160px] px-4 py-4 text-center"
                          >

                            <div>
                              {
                                criterion.name
                              }
                            </div>

                            {criterion.type ===
                              "initial" && (
                              <div className="mt-1 text-[10px] font-normal normal-case text-gray-400">
                                Initial Screening
                              </div>
                            )}

                            {criterion.type !==
                              "initial" &&
                              criterion.max >
                                0 && (
                                <div className="mt-1 text-[10px] font-normal normal-case text-gray-400">
                                  Max:{" "}
                                  {
                                    criterion.max
                                  }
                                </div>
                              )}

                          </th>
                        )
                      )}

                      {/* =================================================
                          INITIAL TOTAL
                      ================================================= */}

                      <th className="min-w-[120px] px-4 py-4 text-center">

                        <div>
                          Initial
                        </div>

                        <div className="text-[10px] font-normal">
                          / 30
                        </div>

                      </th>

                      {/* =================================================
                          ASSESSMENT TOTAL
                      ================================================= */}

                      <th className="min-w-[120px] px-4 py-4 text-center">

                        <div>
                          Assessment
                        </div>

                        <div className="text-[10px] font-normal">
                          /{" "}
                          {criteria
                            .filter((c) => c.type !== "initial")
                            .reduce(
                              (sum, c) =>
                                sum + Number(c.max || 0),
                              0
                            )}
                        </div>

                      </th>

                      {/* =================================================
                          GRAND TOTAL
                      ================================================= */}

                      <th className="min-w-[130px] px-4 py-4 text-center">

                        <div>
                          Grand Total
                        </div>

                        <div className="text-[10px] font-normal">
                          / 100
                        </div>

                      </th>

                      {/* =================================================
                          STATUS
                      ================================================= */}

                      <th className="min-w-[120px] px-4 py-4 text-center">
                        Status
                      </th>

                      {/* =================================================
                          ACTION
                      ================================================= */}

                      <th className="min-w-[140px] px-4 py-4 text-right">
                        Action
                      </th>

                    </tr>

                  </thead>

                  {/* ==================================================
                      TABLE BODY
                  ================================================== */}

                  <tbody className="divide-y divide-gray-200">

                    {sessionApplicants.map(
                      (item) => {
                        const id =
                          getApplicantId(
                            item
                          );

                        return (
                          <ApplicantRow
                            key={
                              id ||
                              item.session_id
                            }

                            item={item}

                            applicantDetails={
                              applicantDetails
                            }

                            criteria={
                              criteria
                            }

                            scores={
                              applicantScores[
                                id
                              ] || {}
                            }

                            rank={
                              applicantRanks[
                                id
                              ]
                            }

                            submittedRank={
                              submittedApplicants[
                                id
                              ]
                            }

                            onScoreChange={
                              handleScoreChange
                            }

                            onAssess={() =>
                              initiateAssess(
                                item
                              )
                            }

                            isSubmitting={
                              submittingApplicant ===
                              id
                            }
                          />
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================
          ACTION MODAL
      ======================================================== */}

      <ActionModal
        isOpen={
          modalConfig.isOpen
        }

        type={
          modalConfig.type
        }

        title={
          modalConfig.title
        }

        message={
          modalConfig.message
        }

        onConfirm={
          modalConfig.onConfirm
        }

        onClose={
          closeModal
        }
      />

    </div>
  );
}