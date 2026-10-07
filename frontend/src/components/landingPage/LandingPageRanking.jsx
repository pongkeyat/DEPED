import { useEffect, useState } from "react";

import { getRankingByVacancy } from "../../api/rankingAPI";
import { getVacancies } from "../../api/VacancyApi";
import {
    ClipboardList,
    Users,
    CheckCircle2
} from "lucide-react";

const LandingPageRanking = () => {
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
    // GET CLOSED VACANCIES
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

                setVacancies(
                    data.filter(
                        (vacancy) =>
                            String(vacancy.status || "")
                                .trim()
                                .toLowerCase() === "closed"
                    )
                );
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
    // GET TOTAL SCORE
    // ============================================================

    const getTotalScore = (applicant) => {
        const possibleTotals = [
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
                ? Number(applicant.assessment_total) +
                  Number(applicant.initial_screening_points)
                : null,
        ];

        const explicitTotal = possibleTotals.find(
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

        return 0;
    };

    // ============================================================
    // FORMAT SCORE
    // ============================================================

    const formatScore = (score) => {
        const numericScore = Number(score);

        if (!Number.isFinite(numericScore)) {
            return "0.00";
        }

        return numericScore.toFixed(2);
    };

    // ============================================================
    // GET RANKING
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

            const response = await getRankingByVacancy(vacancyId);

            const rankingData = Array.isArray(response)
                ? response
                : Array.isArray(response?.data)
                ? response.data
                : [];

            // ========================================================
            // ONLY APPLICATION CODE + TOTAL SCORE
            // ========================================================

            const simplifiedRanking = rankingData
                .map((applicant) => ({
                    application_code:
                        applicant?.application_code ||
                        applicant?.applicationCode ||
                        applicant?.application_id ||
                        "—",

                    total_score: getTotalScore(applicant),
                }))
                .filter(
                    (applicant) =>
                        applicant.application_code !== "—"
                )
                .sort(
                    (a, b) =>
                        Number(b.total_score) -
                        Number(a.total_score)
                );

            setRanking(simplifiedRanking);
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
    // RENDER
    // ============================================================

    return (
        <section className="w-full space-y-6">

            {/* ====================================================
                TITLE
            ==================================================== */}

            <div className="relative flex min-h-[88px] flex-col gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

                <div className="flex items-center gap-4 pl-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3E74]">
                        <ClipboardList size={24} className="stroke-[2.2]" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#1E3E74]">
                            Applicant Ranking
                        </h2>

                        <p className="mt-0.5 text-sm text-gray-500">
                            View applicant rankings for closed vacancies.
                        </p>
                    </div>
                </div>

                {!loadingVacancies && !error && (
                    <div className="flex items-center gap-2 pl-3 text-sm text-gray-600 sm:pl-0">
                        <CheckCircle2 size={17} className="text-emerald-600" />
                        <span>
                            <strong className="text-gray-900">
                                {vacancies.length.toLocaleString()}
                            </strong>{" "}
                            closed {vacancies.length === 1 ? "vacancy" : "vacancies"}
                        </span>
                    </div>
                )}
            </div>

            {/* ====================================================
                VACANCY SELECTOR
            ==================================================== */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1E3E74]">
                        <Users size={20} />
                    </div>

                    <div>
                        <label
                            htmlFor="landing-ranking-vacancy"
                            className="block text-sm font-semibold text-gray-900"
                        >
                            Select a closed vacancy
                        </label>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Only closed vacancies are available for public ranking.
                        </p>
                    </div>
                </div>

                <select
                    id="landing-ranking-vacancy"
                    value={selectedVacancy}
                    onChange={handleVacancyChange}
                    disabled={loadingVacancies || vacancies.length === 0}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#1f3f73] focus:ring-2 focus:ring-[#1f3f73]/20 disabled:bg-gray-100"
                >
                    <option value="">
                        {loadingVacancies
                            ? "Loading closed vacancies..."
                            : vacancies.length === 0
                            ? "No closed vacancies available"
                            : "Select a closed vacancy"}
                    </option>

                    {vacancies.map((vacancy) => (
                        <option
                            key={vacancy.vacancy_id}
                            value={vacancy.vacancy_id}
                        >
                            {vacancy.position_title || "Position unavailable"}
                            {" — "}
                            {vacancy.vacancy_id}
                            {" — "}
                            {vacancy.category || "N/A"}
                        </option>
                    ))}
                </select>

            </div>

            {/* ====================================================
                ERROR
            ==================================================== */}

            {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* ====================================================
                SELECTED VACANCY
            ==================================================== */}

            {selectedVacancy && selectedVacancyData && (
                <div>

                    <div className="mb-4 flex flex-wrap items-center gap-2">

                        <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                            {selectedVacancyData.position_title}
                        </span>

                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#1f3f73]">
                            {selectedVacancyData.vacancy_id}
                        </span>

                        <span className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700">
                            {selectedVacancyData.category || "N/A"}
                        </span>

                    </div>

                    {/* =================================================
                        RANKING CARD
                    ================================================= */}

                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                        {/* =================================================
                            LOADING
                        ================================================= */}

                        {loadingRanking && (
                            <div className="flex flex-col items-center justify-center px-6 py-14">

                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1f3f73]" />

                                <p className="mt-4 text-sm text-gray-500">
                                    Loading applicant ranking...
                                </p>

                            </div>
                        )}

                        {/* =================================================
                            NO RESULTS
                        ================================================= */}

                        {!loadingRanking &&
                            ranking.length === 0 && (
                                <div className="px-6 py-14 text-center">

                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                                        <span className="text-xl">
                                            📋
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-sm font-semibold text-gray-700">
                                        No ranking available
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        No ranked applicants were found
                                        for this vacancy.
                                    </p>

                                </div>
                            )}

                        {/* =================================================
                            RANKING TABLE
                        ================================================= */}

                        {!loadingRanking &&
                            ranking.length > 0 && (
                                <div className="p-5">

                                    <div className="overflow-x-auto">

                                        <table className="w-full border-separate border-spacing-y-2">

                                            <thead>
                                                <tr>

                                                    <th className="rounded-l-xl bg-gray-50 px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Rank
                                                    </th>

                                                    <th className="bg-gray-50 px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Application Code
                                                    </th>

                                                    <th className="rounded-r-xl bg-gray-50 px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                        Total Score
                                                    </th>

                                                </tr>
                                            </thead>

                                            <tbody>

                                                {ranking.map(
                                                    (applicant, index) => (
                                                        <tr
                                                            key={
                                                                applicant.application_code ||
                                                                index
                                                            }
                                                        >

                                                            {/* RANK */}

                                                            <td className="rounded-l-xl bg-white px-4 py-4 text-center align-middle shadow-sm ring-1 ring-gray-100">

                                                                <div
                                                                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                                                                        index === 0
                                                                            ? "bg-yellow-100 text-yellow-700"
                                                                            : index === 1
                                                                            ? "bg-gray-200 text-gray-700"
                                                                            : index === 2
                                                                            ? "bg-orange-100 text-orange-700"
                                                                            : "bg-gray-100 text-gray-600"
                                                                    }`}
                                                                >
                                                                    {index + 1}
                                                                </div>

                                                            </td>

                                                            {/* APPLICATION CODE */}

                                                            <td className="bg-white px-4 py-4 align-middle shadow-sm ring-y-1 ring-gray-100">

                                                                <span className="inline-flex rounded-lg bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
                                                                    {
                                                                        applicant.application_code
                                                                    }
                                                                </span>

                                                            </td>

                                                            {/* TOTAL SCORE */}

                                                            <td className="rounded-r-xl bg-white px-4 py-4 text-center align-middle shadow-sm ring-1 ring-gray-100">

                                                                <span className="inline-flex min-w-[90px] items-center justify-center rounded-lg bg-[#1f3f73]/10 px-4 py-2 text-sm font-bold text-[#1f3f73]">
                                                                    {formatScore(
                                                                        applicant.total_score
                                                                    )}
                                                                </span>

                                                            </td>

                                                        </tr>
                                                    )
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                </div>
                            )}

                    </div>

                </div>
            )}

        </section>
    );
};

export default LandingPageRanking;