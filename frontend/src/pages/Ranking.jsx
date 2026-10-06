import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getRankingByVacancy } from "../api/rankingAPI";
import { getVacancies } from "../api/VacancyApi";

import CARPrintForm from "../components/ranking/CARPrintForm";
import RankingHeader from "../components/ranking/RankingHeader";

const Ranking = () => {
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
    // GET VACANCIES
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

                // ----------------------------------------------------
                // Keep non-teaching / related teaching /
                // school administration vacancies.
                // ----------------------------------------------------

                const nonTeachingVacancies = data.filter((vacancy) => {
                    const category = String(vacancy.category || "")
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, " ");

                    return (
                        category !== "teaching" &&
                        category !== "teaching positions"
                    );
                });

                setVacancies(nonTeachingVacancies);
            } catch (error) {
                console.error(
                    "Error fetching vacancies:",
                    error.response?.data || error.message
                );

                setError("Failed to load vacancies.");
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
                await getRankingByVacancy(vacancyId);

            const rankingData = Array.isArray(response)
                ? response
                : Array.isArray(response?.data)
                    ? response.data
                    : [];

            setRanking(rankingData);
        } catch (error) {
            console.error(
                "Error fetching ranking:",
                error.response?.data || error.message
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
    // SELECTED VACANCY
    // ============================================================

    const selectedVacancyData = vacancies.find(
        (vacancy) =>
            String(vacancy.vacancy_id) ===
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
            return "0.00";
        }

        const numericScore = Number(score);

        if (!Number.isFinite(numericScore)) {
            return "0.00";
        }

        return numericScore.toFixed(2);
    };

    // ============================================================
    // GET APPLICANT NAME
    // ============================================================

    const getApplicantName = (applicant) => {
        if (applicant?.applicant_name) {
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

        return name || "Unnamed Applicant";
    };

    // ============================================================
    // GET APPLICATION CODE
    // ============================================================

    const getApplicationCode = (applicant) => {
        return (
            applicant?.application_code ||
            applicant?.applicationCode ||
            applicant?.application_id ||
            "—"
        );
    };

    // ============================================================
    // GET ASSESSMENT SCORE
    // ============================================================

    const getAssessmentScore = (
        applicant,
        criterionName
    ) => {
        const normalizedName = String(
            criterionName || ""
        )
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

        const directMappings = {
            performance: [
                "performance",
                "performance_points",
                "performance_score",
                "performance_rating",
            ],

            "outstanding accomplishments": [
                "outstanding_accomplishments",
                "outstanding_accomplishments_points",
                "outstanding_accomplishments_score",
                "outstanding_points",
                "outstanding_accomplishment_points",
            ],

            "application of education": [
                "application_of_education",
                "application_of_education_points",
                "application_of_education_score",
                "application_of_education_rating",
            ],

            "application of l&d": [
                "application_of_learning_development",
                "application_of_learning_and_development",
                "application_of_l_and_d",
                "application_of_ld",
                "application_of_lnd",
                "application_of_learning_development_points",
                "application_of_learning_development_score",
                "application_of_learning_and_development_points",
                "application_of_learning_and_development_score",
            ],

            potential: [
                "potential",
                "potential_points",
                "potential_score",
                "potential_rating",
            ],
        };

        const genericScoreKeys = [
            "points",
            "score",
            "value",
            "total",
            "rating",
            "result",
        ];

        const possibleKeys =
            directMappings[normalizedName] || [];

        const getNumericValue = (value) => {
            const numericValue = Number(value);
            return Number.isFinite(numericValue)
                ? numericValue
                : null;
        };

        const findNestedScore = (source, keys) => {
            for (const key of keys) {
                const value = source?.[key];

                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {
                    const numericValue = getNumericValue(value);

                    if (numericValue !== null) {
                        return numericValue;
                    }
                }
            }

            return null;
        };

        const directScore = findNestedScore(
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

        const assessmentScore = findNestedScore(
            assessment,
            possibleKeys
        );

        if (assessmentScore !== null) {
            return assessmentScore;
        }

        const assessmentList =
            applicant?.assessment_criteria ||
            applicant?.assessmentCriteria ||
            applicant?.criteria ||
            [];

        if (Array.isArray(assessmentList)) {
            const found = assessmentList.find((item) => {
                const itemName = String(
                    item?.criterion_name ||
                    item?.name ||
                    item?.criterion ||
                    item?.label ||
                    ""
                )
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, " ");

                return (
                    itemName === normalizedName ||
                    itemName.includes(normalizedName) ||
                    normalizedName.includes(itemName)
                );
            });

            if (found) {
                const criterionScore = findNestedScore(found, genericScoreKeys);

                if (criterionScore !== null) {
                    return criterionScore;
                }
            }

            const fallbackMatched = assessmentList.find((item) => {
                const itemName = String(
                    item?.criterion_name ||
                    item?.name ||
                    item?.criterion ||
                    item?.label ||
                    ""
                )
                    .trim()
                    .toLowerCase();

                return (
                    itemName.includes("let") ||
                    itemName.includes("coi") ||
                    itemName.includes("ncoi") ||
                    itemName.includes("pbet")
                );
            });

            if (fallbackMatched) {
                const criterionScore = findNestedScore(
                    fallbackMatched,
                    genericScoreKeys
                );

                if (criterionScore !== null) {
                    return criterionScore;
                }
            }
        }

        return 0;
    };

    // ============================================================
    // GET EDUCATION
    // ============================================================

    const getEducationScore = (applicant) => {
        return (
            applicant?.education?.points ??
            applicant?.education_points ??
            applicant?.education_score ??
            0
        );
    };

    // ============================================================
    // GET TRAINING
    // ============================================================

    const getTrainingScore = (applicant) => {
        return (
            applicant?.training?.points ??
            applicant?.training_points ??
            applicant?.training_score ??
            0
        );
    };

    // ============================================================
    // GET EXPERIENCE
    // ============================================================

    const getExperienceScore = (applicant) => {
        const score = Number(
            applicant?.experience?.points ??
            applicant?.experience_points ??
            applicant?.experience_score ??
            0
        );

        const category = String(applicant?.category || "").toLowerCase();

        return category.includes("school admin")
            ? Math.min(score, 10)
            : score;
    };

    // ============================================================
    // GET TOTAL
    // ============================================================

    const getTotalScore = (applicant) => {
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

        if (explicitTotal !== undefined) {
            const numericValue = Number(explicitTotal);

            if (Number.isFinite(numericValue)) {
                return numericValue;
            }
        }

        const education = Number(
            getEducationScore(applicant) || 0
        );
        const training = Number(
            getTrainingScore(applicant) || 0
        );
        const experience = Number(
            getExperienceScore(applicant) || 0
        );
        const performance = Number(
            getAssessmentScore(applicant, "Performance") || 0
        );
        const outstanding = Number(
            getAssessmentScore(
                applicant,
                "Outstanding Accomplishments"
            ) || 0
        );
        const applicationEducation = Number(
            getAssessmentScore(
                applicant,
                "Application of Education"
            ) || 0
        );
        const applicationLD = Number(
            getAssessmentScore(
                applicant,
                "Application of L&D"
            ) || 0
        );
        const potential = Number(
            getAssessmentScore(applicant, "Potential") || 0
        );

        return (
            education +
            training +
            experience +
            performance +
            outstanding +
            applicationEducation +
            applicationLD +
            potential
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
                EVERYTHING ON SCREEN
                HIDDEN WHEN PRINTING
            ===================================================== */}

            <div className="print:hidden">

                {/* =================================================
                    HEADER
                ================================================= */}

                <RankingHeader
                    onBack={() => navigate("/")}
                    onPrint={handlePrint}
                />

                {/* =================================================
                    VACANCY SELECTOR
                ================================================= */}

                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="vacancy"
                            className="text-sm font-semibold text-gray-800"
                        >
                            Select Vacancy
                        </label>

                        <p className="text-xs text-gray-500">
                            Select a vacancy to display its
                            applicant ranking.
                        </p>
                    </div>

                    <select
                        id="vacancy"
                        value={selectedVacancy}
                        onChange={handleVacancyChange}
                        disabled={loadingVacancies}
                        className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#1f3f73] focus:ring-2 focus:ring-[#1f3f73]/20 disabled:bg-gray-100"
                    >
                        <option value="">
                            {loadingVacancies
                                ? "Loading vacancies..."
                                : "Select a vacancy"}
                        </option>

                        {vacancies.map((vacancy) => (
                            <option
                                key={vacancy.vacancy_id}
                                value={vacancy.vacancy_id}
                            >
                                {vacancy.position_title}
                                {" — "}
                                {vacancy.vacancy_id}
                                {" — "}
                                {vacancy.category || "N/A"}
                            </option>
                        ))}
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
                    RANKING
                ================================================= */}

                {selectedVacancy && (

                    <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                        {/* =============================================
                            RANKING HEADER
                        ============================================= */}

                        <div className="border-b border-gray-200 px-6 py-5">

                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                                <div>

                                    <h2 className="text-lg font-bold text-gray-900">
                                        Comparative Assessment Results
                                    </h2>

                                    {selectedVacancyData && (
                                        <div className="mt-2 flex flex-wrap items-center gap-2">

                                            <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                                {selectedVacancyData.position_title}
                                            </span>

                                            <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-[#1f3f73]">
                                                {selectedVacancyData.vacancy_id}
                                            </span>

                                            <span className="rounded-lg bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                                                {selectedVacancyData.category ||
                                                    "N/A"}
                                            </span>

                                        </div>
                                    )}

                                </div>

                                {!loadingRanking && (
                                    <div className="rounded-xl bg-[#1f3f73]/10 px-4 py-2 text-sm font-semibold text-[#1f3f73]">
                                        {ranking.length} Qualified Applicant
                                        {ranking.length !== 1
                                            ? "s"
                                            : ""}
                                    </div>
                                )}

                            </div>

                        </div>

                        {/* =============================================
                            LOADING
                        ============================================= */}

                        {loadingRanking && (

                            <div className="flex flex-col items-center justify-center px-6 py-16">

                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1f3f73]" />

                                <p className="mt-4 text-sm text-gray-500">
                                    Loading applicant ranking...
                                </p>

                            </div>

                        )}

                        {/* =============================================
                            NO RESULTS
                        ============================================= */}

                        {!loadingRanking &&
                            ranking.length === 0 && (

                                <div className="px-6 py-16 text-center">

                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                                        <span className="text-xl">
                                            📋
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-sm font-semibold text-gray-700">
                                        No ranking available
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        No qualified applicants were
                                        found for this vacancy.
                                    </p>

                                </div>
                            )}

                        {/* =============================================
                            RANKING TABLE
                        ============================================= */}

                        {!loadingRanking &&
                            ranking.length > 0 && (

                                <div className="p-5">

                                    <div className="overflow-x-auto">

                                        <table className="w-full min-w-[1500px] border-separate border-spacing-y-2">

                                            {/* =================================
                                                TABLE HEADER
                                            ================================= */}

                                            <thead>

                                                <tr>

                                                    <th className="rounded-l-xl bg-gray-50 px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        No.
                                                    </th>

                                                    <th className="bg-gray-50 px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Name of Applicant
                                                    </th>

                                                    <th className="bg-gray-50 px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Application Code
                                                    </th>

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Education
                                                    </th>

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Training
                                                    </th>

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Experience
                                                    </th>

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Performance
                                                    </th>

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Outstanding
                                                        <br />
                                                        Accomplishments
                                                    </th>

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Application
                                                        <br />
                                                        of Education
                                                    </th>

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Application
                                                        <br />
                                                        of L&D
                                                    </th>

                                                    <th className="bg-gray-50 px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Potential
                                                    </th>

                                                    <th className="rounded-r-xl bg-gray-50 px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Total
                                                    </th>

                                                </tr>

                                            </thead>

                                            {/* =================================
                                                TABLE BODY
                                            ================================= */}

                                            <tbody>

                                                {ranking.map(
                                                    (applicant, index) => {

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

                                                        const performance =
                                                            getAssessmentScore(
                                                                applicant,
                                                                "Performance"
                                                            );

                                                        const outstanding =
                                                            getAssessmentScore(
                                                                applicant,
                                                                "Outstanding Accomplishments"
                                                            );

                                                        const applicationEducation =
                                                            getAssessmentScore(
                                                                applicant,
                                                                "Application of Education"
                                                            );

                                                        const applicationLD =
                                                            getAssessmentScore(
                                                                applicant,
                                                                "Application of L&D"
                                                            );

                                                        const potential =
                                                            getAssessmentScore(
                                                                applicant,
                                                                "Potential"
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

                                                                {/* =================
                                                                    NO.
                                                                ================= */}

                                                                <td className="rounded-l-xl bg-white px-4 py-4 text-center align-middle shadow-sm ring-1 ring-gray-100">

                                                                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-600">
                                                                        {index + 1}
                                                                    </div>

                                                                </td>

                                                                {/* =================
                                                                    NAME
                                                                ================= */}

                                                                <td className="bg-white px-4 py-4 align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <div className="font-semibold text-gray-800">
                                                                        {getApplicantName(
                                                                            applicant
                                                                        )}
                                                                    </div>

                                                                    {applicant.applicant_id && (
                                                                        <div className="mt-1 text-xs text-gray-400">
                                                                            {
                                                                                applicant.applicant_id
                                                                            }
                                                                        </div>
                                                                    )}

                                                                </td>

                                                                {/* =================
                                                                    APPLICATION CODE
                                                                ================= */}

                                                                <td className="bg-white px-4 py-4 align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="inline-flex rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                                                                        {getApplicationCode(
                                                                            applicant
                                                                        )}
                                                                    </span>

                                                                </td>

                                                                {/* =================
                                                                    EDUCATION
                                                                ================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {formatScore(
                                                                            education
                                                                        )}
                                                                    </span>

                                                                </td>

                                                                {/* =================
                                                                    TRAINING
                                                                ================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {formatScore(
                                                                            training
                                                                        )}
                                                                    </span>

                                                                </td>

                                                                {/* =================
                                                                    EXPERIENCE
                                                                ================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {formatScore(
                                                                            experience
                                                                        )}
                                                                    </span>

                                                                </td>

                                                                {/* =================
                                                                    PERFORMANCE
                                                                ================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {formatScore(
                                                                            performance
                                                                        )}
                                                                    </span>

                                                                </td>

                                                                {/* =================
                                                                    OUTSTANDING
                                                                ================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {formatScore(
                                                                            outstanding
                                                                        )}
                                                                    </span>

                                                                </td>

                                                                {/* =================
                                                                    APPLICATION EDUCATION
                                                                ================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {formatScore(
                                                                            applicationEducation
                                                                        )}
                                                                    </span>

                                                                </td>

                                                                {/* =================
                                                                    APPLICATION L&D
                                                                ================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {formatScore(
                                                                            applicationLD
                                                                        )}
                                                                    </span>

                                                                </td>

                                                                {/* =================
                                                                    POTENTIAL
                                                                ================= */}

                                                                <td className="bg-white px-4 py-4 text-center align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                    <span className="font-semibold text-gray-700">
                                                                        {formatScore(
                                                                            potential
                                                                        )}
                                                                    </span>

                                                                </td>

                                                                {/* =================
                                                                    TOTAL
                                                                ================= */}

                                                                <td className="rounded-r-xl bg-white px-4 py-4 text-center align-middle shadow-sm ring-1 ring-gray-100">

                                                                    <span className="inline-flex min-w-[70px] items-center justify-center rounded-lg bg-[#1f3f73]/10 px-3 py-2 text-sm font-bold text-[#1f3f73]">
                                                                        {formatScore(
                                                                            total
                                                                        )}
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
                ANNEX I — COMPARATIVE ASSESSMENT RESULT
            ========================================================= */}

            <CARPrintForm
                vacancy={selectedVacancyData}
                ranking={ranking}
            />

        </div>
    );
};

export default Ranking;