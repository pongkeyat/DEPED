import { useEffect, useState } from "react";
import { getRankingByVacancy } from "../api/rankingAPI";
import { getVacancies } from "../api/VacancyApi";

const Ranking = () => {
    const [vacancies, setVacancies] = useState([]);
    const [selectedVacancy, setSelectedVacancy] = useState("");
    const [ranking, setRanking] = useState([]);

    const [loadingVacancies, setLoadingVacancies] = useState(true);
    const [loadingRanking, setLoadingRanking] = useState(false);

    const [error, setError] = useState("");

    /*
    |--------------------------------------------------------------------------
    | GET VACANCIES
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const fetchVacancies = async () => {
            try {
                setLoadingVacancies(true);
                setError("");

                const response = await getVacancies();
                setVacancies(response?.data || []);

            } catch (error) {
                console.error(
                    "Error fetching vacancies:",
                    error.response?.data || error.message
                );

                setError("Failed to load vacancies.");

            } finally {
                setLoadingVacancies(false);
            }
        };

        fetchVacancies();
    }, []);


    /*
    |--------------------------------------------------------------------------
    | GET RANKING WHEN VACANCY IS SELECTED
    |--------------------------------------------------------------------------
    */

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
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.error ||
                "Failed to load ranking."
            );

            setRanking([]);

        } finally {
            setLoadingRanking(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | SELECTED VACANCY
    |--------------------------------------------------------------------------
    */

    const selectedVacancyData = vacancies.find(
        (vacancy) =>
            vacancy.vacancy_id === selectedVacancy
    );


    /*
    |--------------------------------------------------------------------------
    | FORMAT SCORE
    |--------------------------------------------------------------------------
    */

    const formatScore = (score) => {
        return Number(score || 0).toFixed(2);
    };


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="min-h-screen bg-gray-100 p-6">

            {/* =========================================================
                HEADER
            ========================================================= */}

            <div className="mb-6">

                <h1 className="text-2xl font-bold text-[#1f3f73]">
                    Ranking
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    View qualified applicants ranked according to
                    their overall evaluation scores.
                </p>

            </div>


            {/* =========================================================
                VACANCY CONTAINER
            ========================================================= */}

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                <label
                    htmlFor="vacancy"
                    className="block text-sm font-semibold text-gray-700"
                >
                    Select Vacancy
                </label>

                <p className="mt-1 text-xs text-gray-500">
                    Select a vacancy to display its applicant ranking.
                </p>


                <select
                    id="vacancy"
                    value={selectedVacancy}
                    onChange={handleVacancyChange}
                    disabled={loadingVacancies}
                    className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#1f3f73] focus:ring-2 focus:ring-[#1f3f73]/20 disabled:bg-gray-100"
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
                        </option>
                    ))}

                </select>

            </div>


            {/* =========================================================
                ERROR
            ========================================================= */}

            {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}


            {/* =========================================================
                RANKING
            ========================================================= */}

            {selectedVacancy && (

                <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                    {/* -------------------------------------------------
                        RANKING HEADER
                    ------------------------------------------------- */}

                    <div className="border-b border-gray-200 px-6 py-5">

                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                            <div>

                                <h2 className="text-lg font-bold text-[#1f3f73]">
                                    Applicant Ranking
                                </h2>

                                {selectedVacancyData && (
                                    <p className="mt-1 text-sm text-gray-500">

                                        {selectedVacancyData.position_title}

                                        <span className="mx-2">
                                            •
                                        </span>

                                        {selectedVacancyData.vacancy_id}

                                    </p>
                                )}

                            </div>


                            {!loadingRanking && (
                                <div className="rounded-lg bg-[#1f3f73]/10 px-4 py-2 text-sm font-semibold text-[#1f3f73]">

                                    {ranking.length} Qualified Applicant
                                    {ranking.length !== 1 ? "s" : ""}

                                </div>
                            )}

                        </div>

                    </div>


                    {/* -------------------------------------------------
                        LOADING
                    ------------------------------------------------- */}

                    {loadingRanking && (

                        <div className="flex flex-col items-center justify-center px-6 py-16">

                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1f3f73]" />

                            <p className="mt-4 text-sm text-gray-500">
                                Loading applicant ranking...
                            </p>

                        </div>

                    )}


                    {/* -------------------------------------------------
                        NO RESULTS
                    ------------------------------------------------- */}

                    {!loadingRanking &&
                        ranking.length === 0 && (

                            <div className="px-6 py-16 text-center">

                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">

                                    <span className="text-xl">
                                        📋
                                    </span>

                                </div>

                                <h3 className="mt-4 text-sm font-semibold text-gray-700">
                                    No ranking available
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    No qualified applicants were found
                                    for this vacancy.
                                </p>

                            </div>

                        )}


                    {/* -------------------------------------------------
                        RANKING TABLE
                    ------------------------------------------------- */}

                    {!loadingRanking &&
                        ranking.length > 0 && (

                            <div className="overflow-x-auto">

                                <table className="w-full min-w-[1000px]">

                                    <thead>

                                        <tr className="border-b border-gray-200 bg-gray-50">

                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Rank
                                            </th>

                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Applicant
                                            </th>

                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Education
                                            </th>

                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Training
                                            </th>

                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Experience
                                            </th>

                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Initial Screening
                                            </th>

                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Assessment
                                            </th>

                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Overall Score
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {ranking.map((applicant, index) => (

                                            <tr
                                                key={
                                                    applicant.applicant_id ||
                                                    applicant.job_applications_id ||
                                                    index
                                                }
                                                className="border-b border-gray-100 transition hover:bg-gray-50"
                                            >

                                                {/* RANK */}

                                                <td className="px-5 py-4 text-center">

                                                    <div
                                                        className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                                                            applicant.rank === 1
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : applicant.rank === 2
                                                                    ? "bg-gray-200 text-gray-700"
                                                                    : applicant.rank === 3
                                                                        ? "bg-orange-100 text-orange-700"
                                                                        : "bg-gray-100 text-gray-600"
                                                        }`}
                                                    >
                                                        {applicant.rank}
                                                    </div>

                                                </td>


                                                {/* APPLICANT */}

                                                <td className="px-5 py-4">

                                                    <div className="font-semibold text-gray-800">
                                                        {applicant.applicant_name}
                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-400">
                                                        {applicant.applicant_id}
                                                    </div>

                                                </td>


                                                {/* EDUCATION */}

                                                <td className="px-5 py-4 text-center text-sm text-gray-700">

                                                    {formatScore(
                                                        applicant.education?.points
                                                    )}

                                                </td>


                                                {/* TRAINING */}

                                                <td className="px-5 py-4 text-center text-sm text-gray-700">

                                                    {formatScore(
                                                        applicant.training?.points
                                                    )}

                                                </td>


                                                {/* EXPERIENCE */}

                                                <td className="px-5 py-4 text-center text-sm text-gray-700">

                                                    {formatScore(
                                                        applicant.experience?.points
                                                    )}

                                                </td>


                                                {/* INITIAL SCREENING */}

                                                <td className="px-5 py-4 text-center">

                                                    <span className="font-semibold text-[#1f3f73]">

                                                        {formatScore(
                                                            applicant.initial_screening_points
                                                        )}

                                                    </span>

                                                </td>


                                                {/* ASSESSMENT */}

                                                <td className="px-5 py-4 text-center text-sm text-gray-700">

                                                    {formatScore(
                                                        applicant.assessment_total
                                                    )}

                                                </td>


                                                {/* OVERALL SCORE */}

                                                <td className="px-5 py-4 text-center">

                                                    <span className="text-base font-bold text-[#1f3f73]">

                                                        {formatScore(
                                                            applicant.combined_total
                                                        )}

                                                    </span>

                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        )}

                </div>

            )}

        </div>
    );
};

export default Ranking;