import {
    getRankingByVacancy
} from "./ranking.service.js";


export const getRanking = async (req, res) => {
    try {
        const { vacancyId } = req.params;

        if (!vacancyId) {
            return res.status(400).json({
                success: false,
                error: "Vacancy ID is required."
            });
        }

        const ranking = await getRankingByVacancy(vacancyId);

        return res.status(200).json({
            success: true,
            vacancy_id: vacancyId,
            count: ranking.length,
            data: ranking
        });

    } catch (error) {

        console.error("Error fetching ranking:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to fetch applicant ranking."
        });
    }
};