import axios from "axios";

// ============================================================
// API ENDPOINTS
// ============================================================

const POST_VACANCIES =
    import.meta.env.VITE_VACANCIES_POST ||
    "http://localhost:5000/api/vacancies";

const GET_VACANCIES =
    import.meta.env.VITE_VACANCIES_GET ||
    "http://localhost:5000/api/vacancies";

const PUT_VACANCIES =
    import.meta.env.VITE_VACANCIES_PUT ||
    "http://localhost:5000/api/vacancies";

const PATCH_ARCHIVE =
    import.meta.env.VITE_VACANCIES_PATCH_ARCHIVE ||
    "http://localhost:5000/api/vacancies";


// ============================================================
// CREATE VACANCY
// POST /api/vacancies
// ============================================================

export const postVacancies = async (vacancy_form) => {
    try {
        const res = await axios.post(
            POST_VACANCIES,
            vacancy_form
        );

        return res.data;
    } catch (error) {
        console.error(
            "Error creating vacancy:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ============================================================
// GET ALL VACANCIES
// GET /api/vacancies
// ============================================================

export const getVacancies = async (params = {}) => {
    try {
        const res = await axios.get(
            GET_VACANCIES,
            { params }
        );

        const responseData = res.data;

        if (
            responseData &&
            Array.isArray(responseData.data)
        ) {
            return {
                data: responseData.data,
                pagination: responseData.pagination || {}
            };
        }

        // Legacy response formats
        if (Array.isArray(responseData)) {
            return {
                data: responseData,
                pagination: {}
            };
        }

        if (responseData == null) {
            return {
                data: [],
                pagination: {}
            };
        }

        if (Array.isArray(responseData.vacancy)) {
            return {
                data: responseData.vacancy,
                pagination: responseData.pagination || {}
            };
        }

        if (Array.isArray(responseData.rows)) {
            return {
                data: responseData.rows,
                pagination: responseData.pagination || {}
            };
        }

        console.warn(
            "Unexpected vacancies response shape:",
            responseData
        );

        return {
            data: [],
            pagination: {}
        };

    } catch (error) {
        console.error(
            "Error fetching vacancies:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ============================================================
// EDIT VACANCY
// PUT /api/vacancies/:id
// ============================================================

export const updateVacancy = async (
    vacancy_id,
    vacancy_form
) => {
    try {
        const res = await axios.put(
            `${PUT_VACANCIES}/${encodeURIComponent(vacancy_id)}`,
            vacancy_form
        );

        return res.data;

    } catch (error) {
        console.error(
            "Error updating vacancy:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ============================================================
// ARCHIVE VACANCY
// PATCH /api/vacancies/:id/archive
// ============================================================

export const archiveVacancy = async (vacancy_id) => {
    try {
        const res = await axios.patch(
            `${PATCH_ARCHIVE}/${encodeURIComponent(vacancy_id)}/archive`
        );

        return res.data;

    } catch (error) {
        console.error(
            "Error archiving vacancy:",
            error.response?.data || error.message
        );

        throw error;
    }
};