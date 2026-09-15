import axios from "axios";

const RANKING_API =
    import.meta.env.VITE_RANKING_POST ||
    "http://localhost:5000/api/ranking";

const rankingAPI = axios.create({
    baseURL: RANKING_API,
    headers: {
        "Content-Type": "application/json",
    },
});

/*
|--------------------------------------------------------------------------
| GET RANKING BY VACANCY
|--------------------------------------------------------------------------
| Example:
| GET http://localhost:5000/api/ranking/VCY-2026-0005
|
*/

export const getRankingByVacancy = async (vacancyId) => {
    try {
        if (!vacancyId) {
            throw new Error("Vacancy ID is required.");
        }

        const response = await rankingAPI.get(
            `/${vacancyId}`
        );

        return response.data;

    } catch (error) {
        console.error(
            "Error fetching ranking:",
            error.response?.data || error.message
        );

        throw error;
    }
};

export default rankingAPI;