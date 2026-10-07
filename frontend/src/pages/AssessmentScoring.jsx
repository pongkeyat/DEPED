import React, { useEffect, useState, useMemo } from "react";

import {
    getAssessmentCriteria,
    getQualifiedApplicantForAssessment,
    submitPanelistAssessment,
    getPanelistSubmittedApplicantIds,
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

    const [submittingApplicant, setSubmittingApplicant] = useState("");

    const [loading, setLoading] = useState(true);

    // Stores the response from the panelist submission.
    const [panelSubmissionStatus, setPanelSubmissionStatus] = useState({});
    const [panelSubmissionStatusReady, setPanelSubmissionStatusReady] = useState(false);

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
        )
            .trim()
            .toUpperCase();
    };

    const getCategory = (session) => {
        return String(
            session?.category ||
            session?.position_category ||
            session?.vacancy_category ||
            session?.vacancy?.category ||
            ""
        )
            .trim()
            .toUpperCase();
    };

    const getAssessmentType = (session) => {
        // --------------------------------------------------------
        // 1. Prefer assessment_type from backend
        // --------------------------------------------------------

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
                .toUpperCase()
                .replace(/\s+/g, "_");
        }

        // --------------------------------------------------------
        // 2. Derive from category
        // --------------------------------------------------------

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
            category === "RELATED-TEACHING" ||
            category === "RELATED_TEACHING" ||
            category === "RELATED TEACHING POSITIONS"
        ) {
            return "RELATED_TEACHING";
        }

        if (
            category === "SCHOOL ADMINISTRATION" ||
            category === "SCHOOL ADMINISTRATION POSITIONS" ||
            category === "SCHOOL ADMINISTRATION POSITION" ||
            category === "SCHOOL_ADMINISTRATION"
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

        if (assessmentType === "TEACHING") {
            return "Teaching";
        }

        if (assessmentType === "RELATED_TEACHING") {
            return "Related Teaching";
        }

        if (assessmentType === "SCHOOL_ADMINISTRATION") {
            return "School Administration";
        }

        if (assessmentType === "NON_TEACHING") {
            return "Non-Teaching";
        }

        if (
            category.includes("RELATED") &&
            category.includes("TEACHING")
        ) {
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
    // INTEGRATED 100-POINT CATEGORIES
    // ============================================================

    const isIntegrated100PointAssessment = (sessionOrType) => {
        const type =
            typeof sessionOrType === "string"
                ? sessionOrType
                : getAssessmentType(sessionOrType);

        const normalized = String(type || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_");

        return (
            normalized === "RELATED_TEACHING" ||
            normalized === "SCHOOL_ADMINISTRATION"
        );
    };

    // ============================================================
    // 1. LOAD INTERVIEW SESSIONS
    // ============================================================

    useEffect(() => {
        const loadSessions = async () => {
            try {
                setLoading(true);

                const response = await getInterviewSessions();

                const data =
                    response?.sessions || response;

                if (!Array.isArray(data)) {
                    setSessions([]);
                    return;
                }

                const validSessions = data.filter(
                    (session) =>
                        session.assessment_session_id &&
                        Array.isArray(session.applicants) &&
                        session.applicants.length > 0
                );

                setSessions(validSessions);
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
                    String(
                        session.assessment_session_id
                    ) === String(selectedSession)
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
                    getAssessmentType(
                        selectedSessionData
                    );

                console.log(
                    "================================="
                );
                console.log("ASSESSMENT SESSION");
                console.log(
                    "Session:",
                    selectedSessionData.assessment_session_id
                );
                console.log(
                    "Position:",
                    getPositionTitle(selectedSessionData)
                );
                console.log(
                    "Category:",
                    getCategory(selectedSessionData)
                );
                console.log(
                    "Assessment Type:",
                    assessmentType
                );
                console.log(
                    "================================="
                );

                if (!assessmentType) {
                    setCriteria([]);

                    showErrorModal(
                        "Assessment Type Missing",
                        "This assessment session does not have an assessment type. Please configure the assessment_type in the database."
                    );

                    return;
                }

                // ------------------------------------------------
                // INITIAL SCREENING CRITERIA
                // ------------------------------------------------

                const initialCriteria =
                    BASE_CRITERIA_CONFIG
                        .filter(
                            (criterion) =>
                                criterion.type === "initial"
                        )
                        .map((criterion) => ({
                            ...criterion,
                            id: Number(criterion.id),
                            name: String(
                                criterion.name || ""
                            ).trim(),
                        }));

                // ------------------------------------------------
                // GET ASSESSMENT CRITERIA
                // ------------------------------------------------

                const response =
                    await getAssessmentCriteria(
                        assessmentType
                    );

                const criteriaData =
                    Array.isArray(response)
                        ? response
                        : response?.data || [];

                console.log(
                    "Criteria returned by assessment_type:",
                    criteriaData
                );

                const normalizedAssessmentType =
                    String(assessmentType || "")
                        .trim()
                        .toUpperCase()
                        .replace(/\s+/g, "_");

                const isIntegratedAssessment =
                    isIntegrated100PointAssessment(
                        normalizedAssessmentType
                    );

                const isRelatedTeaching =
                    normalizedAssessmentType ===
                    "RELATED_TEACHING";

                const isSchoolAdministration =
                    normalizedAssessmentType ===
                    "SCHOOL_ADMINISTRATION";

                // ------------------------------------------------
                // PROCESS DATABASE CRITERIA
                // ------------------------------------------------

                const processedAssessmentCriteria =
                    criteriaData.map((criterion) => {
                        const name = String(
                            criterion.criterion_name ||
                            criterion.name ||
                            ""
                        ).trim();

                        const normalizedName =
                            name
                                .toUpperCase()
                                .replace(/\s+/g, " ");

                        const isIntegratedETE =
                            isIntegratedAssessment &&
                            (
                                normalizedName ===
                                    "EDUCATION" ||
                                normalizedName ===
                                    "TRAINING" ||
                                normalizedName ===
                                    "EXPERIENCE"
                            );

                        const isManual =
                            Boolean(
                                criterion.is_manual
                            );

                        const type =
                            isIntegratedETE
                                ? "initial"
                                : isManual
                                    ? "text"
                                    : "dropdown";

                        const options =
                            Array.isArray(
                                criterion.options
                            )
                                ? criterion.options
                                    .map((opt) => ({
                                        value: Number(
                                            opt.points
                                        ),
                                        label:
                                            `${
                                                opt.option_label ||
                                                "Option"
                                            } - ${
                                                opt.points
                                            }`,
                                        optionId:
                                            Number(
                                                opt.assessment_option_id
                                            ),
                                    }))
                                    .filter(
                                        (opt) =>
                                            Number.isFinite(
                                                opt.value
                                            )
                                    )
                                : [];

                        return {
                            id: Number(
                                criterion.assessment_criteria_id
                            ),

                            name,

                            type,

                            max: Number(
                                criterion.max_points || 0
                            ),

                            options,

                            assessmentType:
                                criterion.assessment_type ||
                                assessmentType,

                            isManual,

                            isIntegratedETE,

                            isRelatedTeachingETE:
                                isRelatedTeaching &&
                                isIntegratedETE,

                            isSchoolAdministrationETE:
                                isSchoolAdministration &&
                                isIntegratedETE,
                        };
                    });

                // ------------------------------------------------
                // SORT INTEGRATED CRITERIA
                // ------------------------------------------------

                const integratedOrder = {
                    EDUCATION: 1,
                    TRAINING: 2,
                    EXPERIENCE: 3,
                };

                const orderedProcessedAssessmentCriteria =
                    isIntegratedAssessment
                        ? [
                            ...processedAssessmentCriteria,
                        ].sort((a, b) => {
                            const aName =
                                String(
                                    a.name || ""
                                )
                                    .trim()
                                    .toUpperCase();

                            const bName =
                                String(
                                    b.name || ""
                                )
                                    .trim()
                                    .toUpperCase();

                            const aOrder =
                                integratedOrder[
                                    aName
                                ] || 99;

                            const bOrder =
                                integratedOrder[
                                    bName
                                ] || 99;

                            if (
                                aOrder !==
                                bOrder
                            ) {
                                return (
                                    aOrder -
                                    bOrder
                                );
                            }

                            return (
                                Number(a.id || 0) -
                                Number(b.id || 0)
                            );
                        })
                        : processedAssessmentCriteria;

                // ------------------------------------------------
                // VALIDATE INTEGRATED CRITERIA
                // ------------------------------------------------

                if (isIntegratedAssessment) {
                    const eteCriteria =
                        orderedProcessedAssessmentCriteria.filter(
                            (criterion) =>
                                criterion.isIntegratedETE
                        );

                    if (eteCriteria.length !== 3) {
                        setCriteria([]);

                        showErrorModal(
                            "Integrated Assessment Criteria Missing",
                            `${getSessionCategoryName(
                                selectedSessionData
                            )} requires Education, Training, and Experience criteria in assessment_criteria.`
                        );

                        return;
                    }

                    const eteMax =
                        eteCriteria.reduce(
                            (sum, criterion) =>
                                sum +
                                Number(
                                    criterion.max || 0
                                ),
                            0
                        );

                    if (eteMax !== 30) {
                        setCriteria([]);

                        showErrorModal(
                            "Invalid ETE Configuration",
                            `${getSessionCategoryName(
                                selectedSessionData
                            )} requires Education, Training, and Experience to total 30 points.`
                        );

                        return;
                    }
                }

                // ------------------------------------------------
                // FINAL CRITERIA
                // ------------------------------------------------

                const finalCriteria =
                    isIntegratedAssessment
                        ? orderedProcessedAssessmentCriteria
                        : [
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
            setPanelSubmissionStatus({});
            setPanelSubmissionStatusReady(false);
            return;
        }

        const selectedSessionRecord =
            sessions.find(
                (session) =>
                    String(
                        session.assessment_session_id
                    ) === String(selectedSession)
            );

        const selectedRows =
            (
                selectedSessionRecord?.applicants ||
                []
            ).map((applicant) => ({
                ...selectedSessionRecord,
                ...applicant,

                assessment_session_id:
                    selectedSessionRecord.assessment_session_id,
            }));

        // IMPORTANT:
        // We keep ALL applicants in the session.
        // A panelist submitting does NOT remove the applicant.
        setSessionApplicants(selectedRows);

        setApplicantScores({});
        setSubmittedApplicants({});
        setApplicantDetails({});
        setPanelSubmissionStatus({});
        setPanelSubmissionStatusReady(false);

        const loadPanelSubmissionStatus = async () => {
            try {
                const response =
                    await getPanelistSubmittedApplicantIds(
                        selectedSession
                    );

                if (!Array.isArray(response?.submittedApplicantIds)) {
                    throw new Error(
                        "Invalid panelist submission status response."
                    );
                }

                if (mounted) {
                    setPanelSubmissionStatus(
                        Object.fromEntries(
                            response.submittedApplicantIds.map(
                                (id) => [
                                    id,
                                    { submitted: true },
                                ]
                            )
                        )
                    );
                    setPanelSubmissionStatusReady(true);
                }
            } catch (err) {
                if (mounted) {
                    console.error(
                        "Error loading panelist submission status:",
                        err
                    );

                    showErrorModal(
                        "Submission Status Error",
                        err.response?.data?.error ||
                            "Unable to check whether you have already submitted scores for this session."
                    );
                }
            }
        };

        loadPanelSubmissionStatus();

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
                                        res?.data ||
                                            res,
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
        const id = getApplicantId(item);

        const details =
            applicantDetails[id] || item;

        const name = String(
            criterionName || ""
        )
            .trim()
            .toUpperCase();

        if (name === "EDUCATION") {
            return Number(
                details?.education_points ??
                    details?.education?.points ??
                    details?.initial_screening
                        ?.education?.points ??
                    0
            );
        }

        if (name === "TRAINING") {
            return Number(
                details?.training_points ??
                    details?.training?.points ??
                    details?.initial_screening
                        ?.training?.points ??
                    0
            );
        }

        if (name === "EXPERIENCE") {
            return Number(
                details?.experience_points ??
                    details?.experience?.points ??
                    details?.initial_screening
                        ?.experience?.points ??
                    0
            );
        }

        return 0;
    };

    // ============================================================
    // 6. COMPUTE CURRENT TOTAL
    //
    // IMPORTANT:
    // This is only the CURRENT PANELIST'S working score.
    // It is NOT the final panel average.
    // ============================================================

    const computeGrandTotal = (item) => {
        const id = getApplicantId(item);

        const integrated =
            isIntegrated100PointAssessment(
                selectedSessionData
            );

        const initialTotal = integrated
            ? criteria
                .filter(
                    (criterion) =>
                        criterion.isIntegratedETE
                )
                .reduce(
                    (sum, criterion) =>
                        sum +
                        getInitialScreeningScore(
                            item,
                            criterion.name
                        ),
                    0
                )
            : getInitialScreeningScore(
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
                    (sum, criterion) =>
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
    // 7. CURRENT PANELIST RANK
    //
    // This is ONLY a local working rank.
    // It must not be treated as final ranking.
    // ============================================================

    const applicantRanks = useMemo(() => {
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
            (entry, index) => {
                if (entry.id) {
                    rankMap[
                        entry.id
                    ] =
                        index + 1;
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

    const initiateAssess = (item) => {
        const applicantId =
            getApplicantId(item);

        if (!applicantId) {
            showErrorModal(
                "Invalid Applicant",
                "Applicant ID could not be found."
            );

            return;
        }

        if (!selectedSession) {
            showErrorModal(
                "No Assessment Session",
                "Please select an assessment session."
            );

            return;
        }

        const selectedScores =
            applicantScores[
                applicantId
            ] || {};

        const isIntegratedAssessment =
            isIntegrated100PointAssessment(
                selectedSessionData
            );

        // --------------------------------------------------------
        // Validate criteria
        // --------------------------------------------------------

        for (
            const criterion of criteria
        ) {
            // ----------------------------------------------------
            // Integrated ETE
            // ----------------------------------------------------

            if (
                criterion.isIntegratedETE
            ) {
                const eteScore =
                    getInitialScreeningScore(
                        item,
                        criterion.name
                    );

                if (
                    !Number.isFinite(
                        eteScore
                    ) ||
                    eteScore < 0 ||
                    eteScore >
                        Number(
                            criterion.max || 0
                        )
                ) {
                    showErrorModal(
                        "Invalid Initial Screening Score",
                        `${criterion.name} has an invalid Initial Screening score.`
                    );

                    return;
                }

                continue;
            }

            // ----------------------------------------------------
            // Editable criteria
            // ----------------------------------------------------

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

            // ----------------------------------------------------
            // Manual score
            // ----------------------------------------------------

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

            // ----------------------------------------------------
            // Maximum
            // ----------------------------------------------------

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

            // ----------------------------------------------------
            // Minimum
            // ----------------------------------------------------

            if (
                Number(score) < 0
            ) {
                showErrorModal(
                    "Invalid Score",
                    `${criterion.name} cannot be negative.`
                );

                return;
            }

            // ----------------------------------------------------
            // Dropdown option validation
            // ----------------------------------------------------

            if (
                criterion.type ===
                "dropdown"
            ) {
                const selectedOption =
                    criterion.options?.find(
                        (option) =>
                            Number(
                                option.value
                            ) ===
                            Number(score)
                    );

                if (
                    !selectedOption
                ) {
                    showErrorModal(
                        "Invalid Selection",
                        `Please select a valid option for ${criterion.name}.`
                    );

                    return;
                }
            }
        }

        // --------------------------------------------------------
        // Integrated ETE total
        // --------------------------------------------------------

        if (isIntegratedAssessment) {
            const eteTotal =
                criteria
                    .filter(
                        (criterion) =>
                            criterion.isIntegratedETE
                    )
                    .reduce(
                        (
                            sum,
                            criterion
                        ) =>
                            sum +
                            getInitialScreeningScore(
                                item,
                                criterion.name
                            ),
                        0
                    );

            if (
                eteTotal > 30
            ) {
                showErrorModal(
                    "Invalid Integrated Assessment Score",
                    "Education, Training, and Experience may not exceed 30 points in total."
                );

                return;
            }
        }

        // --------------------------------------------------------
        // Applicant name
        // --------------------------------------------------------

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

        // --------------------------------------------------------
        // Current panelist working rank
        // --------------------------------------------------------

        const currentRank =
            applicantRanks[
                applicantId
            ] || "N/A";

        const currentTotal =
            computeGrandTotal(item);

        const category =
            getSessionCategoryName(
                selectedSessionData
            );

        // --------------------------------------------------------
        // IMPORTANT:
        // Tell user this is a panelist submission.
        // It is NOT automatically the final rank.
        // --------------------------------------------------------

        setModalConfig({
            isOpen: true,

            type: "confirm",

            title:
                "Confirm Panel Assessment",

            message:
                `Are you sure you want to submit your ${category} assessment scores for ${applicantName}? Your current score is ${currentTotal} points (working rank #${currentRank}). This submission will be recorded as your panel assessment. The final average will only be determined after all assigned HRMPSB panel members have submitted.`,

            onConfirm: () =>
                executeAssess(
                    item,
                    applicantId
                ),
        });
    };

    // ============================================================
    // 10. SUBMIT PANELIST ASSESSMENT
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

            const isIntegratedAssessment =
                isIntegrated100PointAssessment(
                    selectedSessionData
                );

            // ----------------------------------------------------
            // Build submission scores
            // ----------------------------------------------------

            const submissionScores =
                criteria
                    .filter(
                        (criterion) =>
                            criterion.type ===
                                "dropdown" ||
                            criterion.type ===
                                "text" ||
                            (
                                isIntegratedAssessment &&
                                criterion.isIntegratedETE
                            )
                    )
                    .map(
                        (criterion) => {
                            const score =
                                criterion.isIntegratedETE
                                    ? getInitialScreeningScore(
                                        item,
                                        criterion.name
                                    )
                                    : Number(
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
                                            Number(
                                                score
                                            )
                                    )
                                    : null;

                            return {
                                assessment_criteria_id:
                                    Number(
                                        criterion.id
                                    ),

                                assessment_option_id:
                                    selectedOption
                                        ?.optionId ||
                                    null,

                                score:
                                    Number(
                                        score
                                    ),

                                remarks: "",
                            };
                        }
                    );

            // ----------------------------------------------------
            // Get session ID
            // ----------------------------------------------------

            const assessmentSessionId =
                selectedSessionData
                    ?.assessment_session_id ||
                selectedSession;

            if (
                !assessmentSessionId
            ) {
                throw new Error(
                    "Assessment session ID is missing."
                );
            }

            // ----------------------------------------------------
            // Debug
            // ----------------------------------------------------

            console.log(
                "================================="
            );

            console.log(
                "SUBMITTING PANELIST ASSESSMENT"
            );

            console.log(
                "Assessment Session:",
                assessmentSessionId
            );

            console.log(
                "Applicant:",
                applicantId
            );

            console.log(
                "Scores:",
                submissionScores
            );

            console.log(
                "================================="
            );

            // ----------------------------------------------------
            // NEW PANELIST SUBMISSION API
            //
            // Do NOT send scored_by from the frontend.
            //
            // The backend should get the logged-in user's ID
            // from authentication/session middleware.
            // ----------------------------------------------------

            const response =
                await submitPanelistAssessment({
                    applicant_id:
                        applicantId,

                    assessment_session_id:
                        assessmentSessionId,

                    scores:
                        submissionScores,
                });

            console.log(
                "Panelist submission response:",
                response
            );

            // ----------------------------------------------------
            // Determine completion state from backend response
            // ----------------------------------------------------

            const panelistCount =
                Number(
                    response?.panelistCount ??
                    response?.assignedPanelists ??
                    response?.totalPanelists ??
                    0
                );

            const completedPanelists =
                Number(
                    response?.completedPanelists ??
                    response?.submittedPanelists ??
                    response?.completedCount ??
                    0
                );

            const allPanelistsSubmitted =
                Boolean(
                    response?.allPanelistsSubmitted ??
                    response?.isComplete ??
                    response?.finalized ??
                    false
                );

            const finalAverage =
                response?.finalAverage ??
                response?.average ??
                null;

            const finalRank =
                response?.finalRank ??
                response?.rank ??
                null;

            // ----------------------------------------------------
            // Save status locally
            //
            // DO NOT remove applicant.
            // ----------------------------------------------------

            setPanelSubmissionStatus(
                (previous) => ({
                    ...previous,

                    [applicantId]: {
                        submitted: true,

                        panelistCount,

                        completedPanelists,

                        allPanelistsSubmitted,

                        finalAverage,

                        finalRank,
                    },
                })
            );

            // ----------------------------------------------------
            // Keep submitted state separate from final ranking.
            //
            // ApplicantRow can still receive submittedRank.
            // Only pass a real rank when backend finalized it.
            // ----------------------------------------------------

            setSubmittedApplicants(
                (previous) => ({
                    ...previous,

                    [applicantId]:
                        allPanelistsSubmitted
                            ? finalRank
                            : null,
                })
            );

            // ----------------------------------------------------
            // SUCCESS MESSAGE
            // ----------------------------------------------------

            if (
                allPanelistsSubmitted
            ) {
                showSuccessModal(
                    "Assessment Completed",
                    finalAverage !== null
                        ? `All assigned HRMPSB panel members have submitted their scores. The final average is ${Number(
                            finalAverage
                        ).toFixed(
                            2
                        )} points${
                            finalRank
                                ? ` and the final rank is #${finalRank}.`
                                : "."
                        }`
                        : "All assigned HRMPSB panel members have submitted their scores. The assessment is now complete."
                );
            } else {
                const completedText =
                    completedPanelists > 0 &&
                    panelistCount > 0
                        ? `${completedPanelists} of ${panelistCount} assigned panel members have submitted.`
                        : "Your assessment has been recorded.";

                showSuccessModal(
                    "Assessment Submitted",
                    `${completedText} The applicant will remain available until all assigned HRMPSB panel members have submitted their assessments.`
                );
            }

            // ----------------------------------------------------
            // IMPORTANT:
            //
            // NO:
            // setSessionApplicants(filter(...))
            //
            // NO:
            // setSelectedSession("")
            //
            // The applicant remains in the session.
            // ----------------------------------------------------
        } catch (err) {
            console.error(
                "Error submitting panelist assessment:",
                err
            );

            const errorMessage =
                err.response?.data?.error ||
                err.response?.data?.message ||
                err.message ||
                "Unable to submit assessment score.";

            showErrorModal(
                "Submission Error",
                errorMessage
            );
        } finally {
            setSubmittingApplicant("");
        }
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="min-h-screen p-6">
                <div className="mx-auto max-w-7xl rounded-xl bg-white p-10 text-center shadow-sm">
                    <p className="text-gray-500">
                        Loading assessment sessions and
                        criteria...
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
        <div className="min-h-screen p-6">
            <div className="mx-auto max-w-[1800px]">

                {/* ==================================================
                    PAGE HEADER
                ================================================== */}

                <header className="relative mb-6 min-h-[88px] overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

                    <div className="pl-3">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Applicant Assessment
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Select an assessment session to
                            evaluate applicants. Each assigned
                            HRMPSB panel member submits an
                            independent assessment.
                        </p>
                    </div>
                </header>

                {/* ==================================================
                    SESSION SELECTOR
                ================================================== */}

                <SessionSelector
                    sessions={sessions}
                    selectedSession={
                        selectedSession
                    }
                    onSelectSession={
                        setSelectedSession
                    }
                />

                {/* ==================================================
                    NO SESSION
                ================================================== */}

                {!selectedSession ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-700">
                            Select an Assessment Session
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                            Choose a session above to
                            display its applicants.
                        </p>
                    </div>
                ) : (
                    <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

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
                                            {
                                                currentPosition
                                            }
                                        </span>
                                    )}

                                    {/* Session ID */}

                                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                        Session:{" "}
                                        {
                                            selectedSessionData?.assessment_session_id
                                        }
                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-gray-500">
                                    {isIntegrated100PointAssessment(
                                        selectedSessionData
                                    ) ? (
                                        <>
                                            Initial Screening
                                            ETE:{" "}
                                            <strong>
                                                30 points
                                            </strong>{" "}
                                            + Other Assessment:{" "}
                                            <strong>
                                                {criteria
                                                    .filter(
                                                        (c) =>
                                                            c.type !==
                                                            "initial"
                                                    )
                                                    .reduce(
                                                        (
                                                            sum,
                                                            c
                                                        ) =>
                                                            sum +
                                                            Number(
                                                                c.max ||
                                                                    0
                                                            ),
                                                        0
                                                    )}{" "}
                                                points
                                            </strong>{" "}
                                            ={" "}
                                            <strong>
                                                100 points
                                            </strong>
                                        </>
                                    ) : (
                                        <>
                                            Initial Screening:{" "}
                                            <strong>
                                                30 points
                                            </strong>{" "}
                                            + Assessment:{" "}
                                            <strong>
                                                {criteria
                                                    .filter(
                                                        (c) =>
                                                            c.type !==
                                                            "initial"
                                                    )
                                                    .reduce(
                                                        (
                                                            sum,
                                                            c
                                                        ) =>
                                                            sum +
                                                            Number(
                                                                c.max ||
                                                                    0
                                                            ),
                                                        0
                                                    )}{" "}
                                                points
                                            </strong>
                                        </>
                                    )}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    Final ranking is calculated
                                    only after all assigned
                                    HRMPSB panel members submit.
                                </p>
                            </div>

                            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                                {
                                    sessionApplicants.length
                                }{" "}
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
                                    No applicants are assigned
                                    to this session.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">

                                <table className="min-w-max w-full border-collapse text-left">

                                    {/* ==================================================
                                        TABLE HEADER
                                    ================================================== */}

                                    <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700">
                                        <tr>
                                            <th className="sticky left-0 z-20 min-w-[240px] border border-gray-300 bg-gray-50 px-3 py-3 text-center">
                                                Name of Applicant
                                            </th>

                                            {criteria.map(
                                                (
                                                    criterion
                                                ) => (
                                                    <th
                                                        key={
                                                            criterion.id
                                                        }
                                                        className="min-w-[100px] border border-gray-300 bg-gray-50 px-2 py-3 text-center align-middle"
                                                    >
                                                        <div className="normal-case leading-tight">
                                                            {
                                                                criterion.name
                                                            }
                                                        </div>

                                                        {criterion.type !==
                                                            "initial" &&
                                                            Number(
                                                                criterion.max
                                                            ) >
                                                                0 && (
                                                                <div className="mt-1 text-[10px] font-normal normal-case text-gray-500">
                                                                    Max:{" "}
                                                                    {
                                                                        criterion.max
                                                                    }
                                                                </div>
                                                            )}
                                                    </th>
                                                )
                                            )}

                                            <th className="min-w-[120px] border border-gray-300 bg-gray-50 px-3 py-3 text-center">
                                                Total
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

                                                const panelStatus =
                                                    panelSubmissionStatus[
                                                        id
                                                    ];

                                                const currentWorkingTotal =
                                                    computeGrandTotal(
                                                        item
                                                    );

                                                return (
                                                    <React.Fragment
                                                        key={
                                                            id ||
                                                            item.assessment_session_id
                                                        }
                                                    >
                                                        <ApplicantRow
                                                            item={
                                                                item
                                                            }

                                                            applicantDetails={
                                                                applicantDetails
                                                            }

                                                            criteria={
                                                                criteria
                                                            }

                                                            scores={
                                                                applicantScores[
                                                                    id
                                                                ] ||
                                                                {}
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

                                                            isSubmitted={
                                                                Boolean(
                                                                    panelStatus?.submitted
                                                                )
                                                            }

                                                            submissionStatusReady={
                                                                panelSubmissionStatusReady
                                                            }
                                                        />

                                                        {/* ==================================================
                                                            PANELIST SUBMISSION STATUS
                                                        ================================================== */}

                                                        {panelStatus?.submitted && (
                                                            <tr>
                                                                <td
                                                                    colSpan={
                                                                        criteria.length +
                                                                        2
                                                                    }
                                                                    className="border-x border-b border-gray-200 bg-gray-50 px-4 py-2"
                                                                >
                                                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">

                                                                        <div className="flex flex-wrap items-center gap-2">

                                                                            <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">
                                                                                Your assessment has been submitted
                                                                            </span>

                                                                            {panelStatus.panelistCount >
                                                                                0 && (
                                                                                <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
                                                                                    {
                                                                                        panelStatus.completedPanelists
                                                                                    }{" "}
                                                                                    /{" "}
                                                                                    {
                                                                                        panelStatus.panelistCount
                                                                                    }{" "}
                                                                                    panel members submitted
                                                                                </span>
                                                                            )}

                                                                            {panelStatus.allPanelistsSubmitted && (
                                                                                <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                                                                                    All panel assessments completed
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex items-center gap-3 text-gray-600">

                                                                            {!panelStatus.allPanelistsSubmitted && (
                                                                                <span>
                                                                                    Current panelist total:{" "}
                                                                                    <strong>
                                                                                        {currentWorkingTotal.toFixed(
                                                                                            2
                                                                                        )}
                                                                                    </strong>
                                                                                </span>
                                                                            )}

                                                                            {panelStatus.allPanelistsSubmitted &&
                                                                                panelStatus.finalAverage !==
                                                                                    null && (
                                                                                    <span className="font-semibold text-gray-900">
                                                                                        Final Average:{" "}
                                                                                        {Number(
                                                                                            panelStatus.finalAverage
                                                                                        ).toFixed(
                                                                                            2
                                                                                        )}
                                                                                    </span>
                                                                                )}

                                                                            {panelStatus.allPanelistsSubmitted &&
                                                                                panelStatus.finalRank && (
                                                                                    <span className="font-semibold text-indigo-700">
                                                                                        Final Rank: #
                                                                                        {
                                                                                            panelStatus.finalRank
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
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