import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getRankingByVacancy } from "../api/rankingAPI";
import { getVacancies } from "../api/VacancyApi";

import CARRQAHeader from "../components/ranking/CARRQAHeader";
import CARRQAPrintForm from "../components/ranking/CARRQAPrintForm";

const CARRQA = () => {
    const navigate = useNavigate();

    // ============================================================
    // STATE
    // ============================================================

    const [vacancies, setVacancies] = useState([]);
    const [selectedVacancy, setSelectedVacancy] = useState("");
    const [ranking, setRanking] = useState([]);

    const [loadingVacancies, setLoadingVacancies] = useState(true);
    const [loadingRanking, setLoadingRanking] = useState(false);

    const [error, setError] = useState("");

    // ============================================================
    // GET TEACHING VACANCIES
    // ============================================================

    useEffect(() => {
        const fetchVacancies = async () => {
            try {
                setLoadingVacancies(true);
                setError("");

                const response = await getVacancies({
                    limit: 1000,
                });

                const data = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];

                // ====================================================
                // TEACHING POSITIONS ONLY
                // ====================================================

                const teachingVacancies = data.filter(
                    (vacancy) => {
                        const category = String(
                            vacancy.category || ""
                        )
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, " ");

                        return (
                            category === "teaching" ||
                            category === "teaching positions"
                        );
                    }
                );

                setVacancies(teachingVacancies);
            } catch (error) {
                console.error(
                    "Error fetching vacancies:",
                    error.response?.data ||
                        error.message
                );

                setError(
                    "Failed to load vacancies."
                );

                setVacancies([]);
            } finally {
                setLoadingVacancies(false);
            }
        };

        fetchVacancies();
    }, []);

    // ============================================================
    // GET RANKING WHEN VACANCY IS SELECTED
    // ============================================================

    const handleVacancyChange = async (event) => {
        const vacancyId = event.target.value;

        setSelectedVacancy(vacancyId);
        setRanking([]);
        setError("");

        if (!vacancyId) {
            return;
        }

        try {
            setLoadingRanking(true);

            const response =
                await getRankingByVacancy(
                    vacancyId
                );

            const rankingData =
                Array.isArray(response)
                    ? response
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];

            setRanking(rankingData);
        } catch (error) {
            console.error(
                "Error fetching ranking:",
                error.response?.data ||
                    error.message
            );

            setError(
                error.response?.data?.error ||
                    error.response?.data?.message ||
                    "Failed to load ranking."
            );

            setRanking([]);
        } finally {
            setLoadingRanking(false);
        }
    };

    // ============================================================
    // REFRESH
    // ============================================================

 

    // ============================================================
    // SELECTED VACANCY
    // ============================================================

    const selectedVacancyData =
        vacancies.find(
            (vacancy) =>
                String(
                    vacancy.vacancy_id
                ) ===
                String(selectedVacancy)
        );

    // ============================================================
    // FORMAT SCORE
    // ============================================================

    const formatScore = (score) => {
        if (
            score === null ||
            score === undefined ||
            score === ""
        ) {
            return "0";
        }

        const numericScore =
            Number(score);

        if (!Number.isFinite(numericScore)) {
            return "0";
        }

        if (
            Number.isInteger(
                numericScore
            )
        ) {
            return String(
                numericScore
            );
        }

        return numericScore.toFixed(2);
    };

    // ============================================================
    // GET APPLICANT NAME
    // ============================================================

    const getApplicantName = (
        applicant
    ) => {
        if (
            applicant?.applicant_name
        ) {
            return applicant.applicant_name;
        }

        const name = [
            applicant?.first_name,
            applicant?.middle_name,
            applicant?.last_name,
            applicant?.suffix,
        ]
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

        return (
            name ||
            "Unnamed Applicant"
        );
    };

    // ============================================================
    // GET APPLICATION CODE
    // ============================================================

    const getApplicationCode = (
        applicant
    ) => {
        return (
            applicant?.application_code ||
            applicant?.applicationCode ||
            applicant?.application_id ||
            applicant?.job_application_code ||
            applicant?.job_applications_id ||
            "—"
        );
    };

    // ============================================================
    // GET EDUCATION SCORE
    // ============================================================

    const getEducationScore = (
        applicant
    ) => {
        return (
            applicant?.education
                ?.points ??
            applicant?.education_points ??
            applicant?.education_score ??
            0
        );
    };

    // ============================================================
    // GET TRAINING SCORE
    // ============================================================

    const getTrainingScore = (
        applicant
    ) => {
        return (
            applicant?.training
                ?.points ??
            applicant?.training_points ??
            applicant?.training_score ??
            0
        );
    };

    // ============================================================
    // GET EXPERIENCE SCORE
    // ============================================================

    const getExperienceScore = (
        applicant
    ) => {
        return (
            applicant?.experience
                ?.points ??
            applicant?.experience_points ??
            applicant?.experience_score ??
            0
        );
    };

    // ============================================================
    // GET TEACHING ASSESSMENT SCORE
    //
    // PBET / LET / LEPT
    // PPST COIs
    // PPST NCOIs
    // ============================================================

    const getAssessmentScore = (
        applicant,
        criterionName
    ) => {
        const normalizedName =
            String(
                criterionName || ""
            )
                .trim()
                .toLowerCase()
                .replace(/\s+/g, " ");

        const mappings = {
            "pbet/let/lept rating": [
                "pbet_let_lept_rating",
                "pbet_let_lept",
                "pbet_let_lept_points",
                "pbet_let_lept_score",
                "pbet_let_lept_rating_points",
                "pbet_let_lept_rating_score",
                "licensure_rating",
                "let_rating",
                "lept_rating",
                "pbet_rating",
                "license_rating",
                "let_points",
                "lept_points",
                "pbet_points",
                "licensure_points",
                "eligibility_rating",
                "eligibility_points",
                "let_score",
                "lept_score",
                "pbet_score",
                "eligibility_score",
            ],
            "ppst cois": [
                "ppst_cois",
                "ppst_coi",
                "ppst_cois_points",
                "ppst_cois_score",
                "classroom_observation",
                "classroom_observation_points",
                "classroom_observation_score",
                "ppst_coi_score",
                "coi_score",
                "coi_points",
                "ppst_coi_points",
                "classroom_observation_rating",
                "coi_rating",
            ],
            "ppst ncois": [
                "ppst_ncois",
                "ppst_ncoi",
                "ppst_ncois_points",
                "ppst_ncois_score",
                "teacher_reflection",
                "teacher_reflection_points",
                "teacher_reflection_score",
                "ncoi_score",
                "ppst_ncoi_score",
                "ncoi_points",
                "ppst_ncoi_points",
                "teacher_reflection_rating",
                "ncoi_rating",
            ],
        };

        const possibleKeys =
            mappings[
                normalizedName
            ] || [];

        const getNumericValue = (
            value
        ) => {
            const numericValue =
                Number(value);

            return Number.isFinite(
                numericValue
            )
                ? numericValue
                : null;
        };

        const findNestedScore = (
            source,
            keys
        ) => {
            for (const key of keys) {
                const value =
                    source?.[key];

                if (
                    value !==
                        undefined &&
                    value !== null &&
                    value !== ""
                ) {
                    const numericValue =
                        getNumericValue(
                            value
                        );

                    if (
                        numericValue !==
                        null
                    ) {
                        return numericValue;
                    }
                }
            }

            return null;
        };

        const directScore =
            findNestedScore(
                applicant,
                possibleKeys
            );

        if (directScore !== null) {
            return directScore;
        }

        const assessment =
            applicant?.assessment ||
            applicant?.assessment_scores ||
            applicant?.assessmentScores ||
            applicant?.scores ||
            {};

        const assessmentScore =
            findNestedScore(
                assessment,
                possibleKeys
            );

        if (assessmentScore !== null) {
            return assessmentScore;
        }

        const possibleContainers = [
            applicant?.initial_screening,
            applicant?.initialScreening,
            applicant?.comparative_assessment,
            applicant?.comparativeAssessment,
        ];

        for (const container of possibleContainers) {
            const nestedScore =
                findNestedScore(
                    container,
                    possibleKeys
                );

            if (nestedScore !== null) {
                return nestedScore;
            }
        }

        const assessmentList =
            applicant?.assessment_criteria ||
            applicant?.assessmentCriteria ||
            applicant?.criteria ||
            [];

        if (
            Array.isArray(
                assessmentList
            )
        ) {
            const matchedCriterion =
                assessmentList.find(
                    (item) => {
                        const itemName =
                            String(
                                item?.criterion_name ||
                                item?.name ||
                                item?.criterion ||
                                item?.label ||
                                ""
                            )
                                .trim()
                                .toLowerCase()
                                .replace(
                                    /\s+/g,
                                    " "
                                );

                        return (
                            itemName ===
                            normalizedName ||
                            itemName.includes(
                                normalizedName
                            ) ||
                            normalizedName.includes(
                                itemName
                            )
                        );
                    }
                );

            if (matchedCriterion) {
                const criterionScore =
                    findNestedScore(
                        matchedCriterion,
                        [
                            "points",
                            "score",
                            "value",
                            "total",
                            "rating",
                            "result",
                        ]
                    );

                if (
                    criterionScore !==
                    null
                ) {
                    return criterionScore;
                }
            }

            const fallbackMatched =
                assessmentList.find(
                    (item) => {
                        const itemName =
                            String(
                                item?.criterion_name ||
                                item?.name ||
                                item?.criterion ||
                                item?.label ||
                                ""
                            )
                                .trim()
                                .toLowerCase();

                        return (
                            itemName.includes(
                                "let"
                            ) ||
                            itemName.includes(
                                "coi"
                            ) ||
                            itemName.includes(
                                "ncoi"
                            ) ||
                            itemName.includes(
                                "pbet"
                            )
                        );
                    }
                );

            if (fallbackMatched) {
                const criterionScore =
                    findNestedScore(
                        fallbackMatched,
                        [
                            "points",
                            "score",
                            "value",
                            "total",
                            "rating",
                            "result",
                        ]
                    );

                if (
                    criterionScore !==
                    null
                ) {
                    return criterionScore;
                }
            }
        }

        return 0;
    };

    // ============================================================
    // GET TOTAL
    // ============================================================

    const getTotalScore = (
        applicant
    ) => {
        const explicitTotal = [
            applicant?.combined_total,
            applicant?.grand_total,
            applicant?.total_score,
            applicant?.total,
            applicant?.overall_score,
            applicant?.final_total,
            applicant?.overall_total,
            applicant?.screening_total,
            applicant?.assessment_total &&
                applicant?.initial_screening_points
                ? applicant.assessment_total +
                applicant.initial_screening_points
                : null,
        ].find(
            (value) =>
                value !== undefined &&
                value !== null &&
                value !== ""
        );

        if (
            explicitTotal !==
            undefined
        ) {
            const numericValue =
                Number(explicitTotal);

            if (
                Number.isFinite(
                    numericValue
                )
            ) {
                return numericValue;
            }
        }

        const education =
            Number(
                getEducationScore(
                    applicant
                ) || 0
            );
        const training =
            Number(
                getTrainingScore(
                    applicant
                ) || 0
            );
        const experience =
            Number(
                getExperienceScore(
                    applicant
                ) || 0
            );
        const pbetLetLept =
            Number(
                getAssessmentScore(
                    applicant,
                    "PBET/LET/LEPT Rating"
                ) || 0
            );
        const ppstCois =
            Number(
                getAssessmentScore(
                    applicant,
                    "PPST COIs"
                ) || 0
            );
        const ppstNcois =
            Number(
                getAssessmentScore(
                    applicant,
                    "PPST NCOIs"
                ) || 0
            );

        return (
            education +
            training +
            experience +
            pbetLetLept +
            ppstCois +
            ppstNcois
        );
    };

    // ============================================================
    // PRINT
    // ============================================================

    const handlePrint = () => {
        if (!selectedVacancy) {
            setError(
                "Please select a vacancy before printing."
            );
            return;
        }

        if (ranking.length === 0) {
            setError(
                "There are no ranked applicants to print."
            );
            return;
        }

        window.print();
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="min-h-screen p-6">

            {/* =====================================================
                SCREEN ONLY
            ===================================================== */}

            <div className="print:hidden">

                {/* =================================================
                    CARRQA HEADER
                ================================================= */}

                <CARRQAHeader
                    onBack={() =>
                        navigate("/")
                    }
                    onPrint={handlePrint}
                    loading={
                        loadingRanking
                    }
                />

                {/* =================================================
                    VACANCY SELECTOR
                ================================================= */}

                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                    <label
                        htmlFor="vacancy"
                        className="block text-sm font-semibold text-gray-800"
                    >
                        Select Teaching Vacancy
                    </label>

                    <p className="mt-1 text-xs text-gray-500">
                        Select a teaching vacancy
                        to display its registry
                        of qualified applicants.
                    </p>

                    <select
                        id="vacancy"
                        value={
                            selectedVacancy
                        }
                        onChange={
                            handleVacancyChange
                        }
                        disabled={
                            loadingVacancies
                        }
                        className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#1f3f73] focus:ring-2 focus:ring-[#1f3f73]/20 disabled:bg-gray-100"
                    >

                        <option value="">
                            {loadingVacancies
                                ? "Loading vacancies..."
                                : "Select a teaching vacancy"}
                        </option>

                        {vacancies.map(
                            (vacancy) => (
                                <option
                                    key={
                                        vacancy.vacancy_id
                                    }
                                    value={
                                        vacancy.vacancy_id
                                    }
                                >
                                    {
                                        vacancy.position_title
                                    }
                                    {" — "}
                                    {
                                        vacancy.vacancy_id
                                    }
                                    {" — "}
                                    {
                                        vacancy.category ||
                                        "Teaching"
                                    }
                                </option>
                            )
                        )}

                    </select>

                </div>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* =================================================
                    RESULTS
                ================================================= */}

                {selectedVacancy && (

                    <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                        {/* =========================================
                            RESULT HEADER
                        ========================================= */}

                        <div className="border-b border-gray-200 px-6 py-5">

                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                                <div>

                                    <h2 className="text-lg font-bold text-gray-900">
                                        CAR-RQA Applicant Results
                                    </h2>

                                    {selectedVacancyData && (
                                        <div className="mt-2 flex flex-wrap gap-2">

                                            <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                                {
                                                    selectedVacancyData.position_title
                                                }
                                            </span>

                                            <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-[#1f3f73]">
                                                {
                                                    selectedVacancyData.vacancy_id
                                                }
                                            </span>

                                            <span className="rounded-lg bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                                                {
                                                    selectedVacancyData.category ||
                                                    "Teaching"
                                                }
                                            </span>

                                        </div>
                                    )}

                                </div>

                                {!loadingRanking && (
                                    <div className="rounded-xl bg-[#1f3f73]/10 px-4 py-2 text-sm font-semibold text-[#1f3f73]">
                                        {
                                            ranking.length
                                        }{" "}
                                        Qualified Applicant
                                        {
                                            ranking.length !==
                                            1
                                                ? "s"
                                                : ""
                                        }
                                    </div>
                                )}

                            </div>

                        </div>

                        {/* =========================================
                            LOADING
                        ========================================= */}

                        {loadingRanking && (

                            <div className="flex flex-col items-center justify-center px-6 py-16">

                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1f3f73]" />

                                <p className="mt-4 text-sm text-gray-500">
                                    Loading applicant
                                    results...
                                </p>

                            </div>

                        )}

                        {/* =========================================
                            NO RESULTS
                        ========================================= */}

                        {!loadingRanking &&
                            ranking.length ===
                                0 && (

                                <div className="px-6 py-16 text-center">

                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                                        <span className="text-xl">
                                            📋
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-sm font-semibold text-gray-700">
                                        No applicants available
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        No qualified
                                        applicants
                                        were found
                                        for this
                                        teaching
                                        vacancy.
                                    </p>

                                </div>
                            )}

                        {/* =========================================
                            TEACHING CARRQA TABLE
                        ========================================= */}

                        {!loadingRanking &&
                            ranking.length >
                                0 && (

                                <div className="p-5">

                                    <div className="overflow-x-auto">

                                        <table className="w-full min-w-[1250px] border-separate border-spacing-y-2">

                                            {/* =================================
                                                TABLE HEADER
                                            ================================= */}

                                            <thead>

                                                <tr>

                                                    {/* NAME */}

                                                    <th className="rounded-l-xl bg-gray-50 px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Name of Applicant
                                                    </th>

                                                    {/* APPLICATION CODE */}

                                                    <th className="bg-gray-50 px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Application Code
                                                    </th>

                                                    {/* EDUCATION */}

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold tracking-wide text-gray-500">

                                                        <div>
                                                            Education
                                                        </div>

                                                        <div className="mt-1 text-[10px] font-normal text-gray-400">
                                                            10 pts
                                                        </div>

                                                    </th>

                                                    {/* TRAINING */}

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold tracking-wide text-gray-500">

                                                        <div>
                                                            Training
                                                        </div>

                                                        <div className="mt-1 text-[10px] font-normal text-gray-400">
                                                            10 pts
                                                        </div>

                                                    </th>

                                                    {/* EXPERIENCE */}

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold tracking-wide text-gray-500">

                                                        <div>
                                                            Experience
                                                        </div>

                                                        <div className="mt-1 text-[10px] font-normal text-gray-400">
                                                            10 pts
                                                        </div>

                                                    </th>

                                                    {/* PBET / LET / LEPT */}

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold tracking-wide text-gray-500">

                                                        <div className="leading-tight">
                                                            PBET /
                                                            LET /
                                                            LEPT
                                                            <br />
                                                            Rating
                                                        </div>

                                                        <div className="mt-1 text-[10px] font-normal text-gray-400">
                                                            10 pts
                                                        </div>

                                                    </th>

                                                    {/* PPST COIs */}

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold tracking-wide text-gray-500">

                                                        <div className="leading-tight">
                                                            PPST
                                                            COIs
                                                        </div>

                                                        <div className="mt-1 text-[10px] font-normal text-gray-400">
                                                            Classroom
                                                            Observation
                                                        </div>

                                                        <div className="text-[10px] font-normal text-gray-400">
                                                            35 pts
                                                        </div>

                                                    </th>

                                                    {/* PPST NCOIs */}

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold tracking-wide text-gray-500">

                                                        <div className="leading-tight">
                                                            PPST
                                                            NCOIs
                                                        </div>

                                                        <div className="mt-1 text-[10px] font-normal text-gray-400">
                                                            Teacher
                                                            Reflection
                                                        </div>

                                                        <div className="text-[10px] font-normal text-gray-400">
                                                            25 pts
                                                        </div>

                                                    </th>

                                                    {/* TOTAL */}

                                                    <th className="rounded-r-xl bg-gray-50 px-4 py-4 text-center text-xs font-bold tracking-wide text-gray-500">

                                                        <div>
                                                            Total
                                                        </div>

                                                        <div className="mt-1 text-[10px] font-normal text-gray-400">
                                                            100 pts
                                                        </div>

                                                    </th>

                                                </tr>

                                            </thead>

                                            {/* =================================
                                                TABLE BODY
                                            ================================= */}

                                            <tbody>

                                                {ranking.map(
                                                    (
                                                        applicant,
                                                        index
                                                    ) => {

                                                        const education =
                                                            getEducationScore(
                                                                applicant
                                                            );

                                                        const training =
                                                            getTrainingScore(
                                                                applicant
                                                            );

                                                        const experience =
                                                            getExperienceScore(
                                                                applicant
                                                            );

                                                        const pbetLetLept =
                                                            getAssessmentScore(
                                                                applicant,
                                                                "PBET/LET/LEPT Rating"
                                                            );

                                                        const ppstCois =
                                                            getAssessmentScore(
                                                                applicant,
                                                                "PPST COIs"
                                                            );

                                                        const ppstNcois =
                                                            getAssessmentScore(
                                                                applicant,
                                                                "PPST NCOIs"
                                                            );

                                                        const total =
                                                            getTotalScore(
                                                                applicant
                                                            );

                                                        return (

                                                            <tr
                                                                key={
                                                                    applicant.applicant_id ||
                                                                    applicant.job_applications_id ||
                                                                    index
                                                                }
                                                                className="group"
                                                            >

                                                                {/* =================================
                                                                    NAME
                                                                ================================= */}

                                                                <td className="rounded-l-xl bg-white px-4 py-4 align-middle shadow-sm ring-1 ring-gray-100">

                                                                    <div className="font-semibold text-gray-800">
                                                                        {
                                                                            getApplicantName(
                                                                                applicant
                                                                            )
                                                                        }
                                                                    </div>

                                                                    {applicant.applicant_id && (
                                                                        <div className="mt-1 text-xs text-gray-400">
                                                                            {
                                                                                applicant.applicant_id
                                                                            }
                                                                        </div>
                                                                    )}

                                                                </td>

                                                                {/* =================================
                                                                    APPLICATION CODE
                                                                ================================= */}

                                                                <td className="bg-white px-4 py-4 align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="inline-flex rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                                                                        {
                                                                            getApplicationCode(
                                                                                applicant
                                                                            )
                                                                        }
                                                                    </span>

                                                                </td>

                                                                {/* =================================
                                                                    EDUCATION
                                                                ================================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {
                                                                            formatScore(
                                                                                education
                                                                            )
                                                                        }
                                                                    </span>

                                                                </td>

                                                                {/* =================================
                                                                    TRAINING
                                                                ================================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {
                                                                            formatScore(
                                                                                training
                                                                            )
                                                                        }
                                                                    </span>

                                                                </td>

                                                                {/* =================================
                                                                    EXPERIENCE
                                                                ================================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {
                                                                            formatScore(
                                                                                experience
                                                                            )
                                                                        }
                                                                    </span>

                                                                </td>

                                                                {/* =================================
                                                                    PBET / LET / LEPT
                                                                ================================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {
                                                                            formatScore(
                                                                                pbetLetLept
                                                                            )
                                                                        }
                                                                    </span>

                                                                </td>

                                                                {/* =================================
                                                                    PPST COIs
                                                                ================================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {
                                                                            formatScore(
                                                                                ppstCois
                                                                            )
                                                                        }
                                                                    </span>

                                                                </td>

                                                                {/* =================================
                                                                    PPST NCOIs
                                                                ================================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {
                                                                            formatScore(
                                                                                ppstNcois
                                                                            )
                                                                        }
                                                                    </span>

                                                                </td>

                                                                {/* =================================
                                                                    TOTAL
                                                                ================================= */}

                                                                <td className="rounded-r-xl bg-white px-4 py-4 text-center align-middle shadow-sm ring-1 ring-gray-100">

                                                                    <span className="inline-flex min-w-[70px] items-center justify-center rounded-lg bg-[#1f3f73]/10 px-3 py-2 text-sm font-bold text-[#1f3f73]">
                                                                        {
                                                                            formatScore(
                                                                                total
                                                                            )
                                                                        }
                                                                    </span>

                                                                </td>

                                                            </tr>

                                                        );
                                                    }
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                </div>

                            )}

                    </div>

                )}

            </div>

            {/* =========================================================
                PRINT ONLY
                ANNEX I-1 — CAR-RQA
            ========================================================= */}

            <CARRQAPrintForm
                vacancy={
                    selectedVacancyData
                }
                ranking={ranking}
            />

        </div>
    );
};

export default CARRQA;