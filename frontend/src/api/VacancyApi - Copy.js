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

const VACANCY_RESOURCE_URL = GET_VACANCIES
    .replace(/\/getVacancies\/?$/i, "")
    .replace(/\/+$/, "");

const PUT_VACANCIES =
    import.meta.env.VITE_VACANCIES_PUT ||
    "http://localhost:5000/api/vacancies";

const PATCH_ARCHIVE =
    import.meta.env.VITE_VACANCIES_PATCH_ARCHIVE ||
    "http://localhost:5000/api/vacancies";

const PATCH_STATUS =
    import.meta.env.VITE_VACANCIES_PATCH_STATUS ||
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

export const getVacancyMemo = async (vacancy_id) => {
    try {
        const response = await axios.get(
            `${VACANCY_RESOURCE_URL}/${encodeURIComponent(vacancy_id)}/memo`,
            { responseType: "blob" }
        );

        return response.data;
    } catch (error) {
        const responseData = error.response?.data;
        if (responseData instanceof Blob) {
            try {
                const errorBody = JSON.parse(await responseData.text());
                error.message =
                    errorBody.error ||
                    errorBody.message ||
                    "Unable to retrieve the memo file.";
            } catch {
                error.message = "Unable to retrieve the memo file.";
            }
        } else if (responseData?.error || responseData?.message) {
            error.message = responseData.error || responseData.message;
        }

        console.error(
            "Error retrieving vacancy memo:",
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


// ============================================================
// UPDATE VACANCY STATUS
// PATCH /api/vacancies/:id/status
// ============================================================


export const updateVacancyStatus = async (vacancy_id, statusOrData, memo = "") => {
    try {
        // Support both a status string and an object containing status and memo.
        const payload =
            typeof statusOrData === "object" && statusOrData !== null
                ? statusOrData
                : {
                      status: statusOrData,
                      ...(memo ? { memo } : {}),
                  };
        const requestData = payload.memo_file
            ? Object.entries(payload).reduce((formData, [key, value]) => {
                  if (value !== undefined && value !== null) {
                      formData.append(key, value);
                  }

                  return formData;
              }, new FormData())
            : payload;

        const res = await axios.patch(
            `${PATCH_STATUS}/${encodeURIComponent(vacancy_id)}/status`,
            requestData
        );

        return res.data;
    } catch (error) {
        console.error(
            "Error updating vacancy status:",
            error.response?.data || error.message
        );

        throw error;
    }
};



export const restoreVacancy = async (id) => {
    const response = await axios.patch(
        `${import.meta.env.VITE_VACANCIES_RESTORE}/${encodeURIComponent(id)}/restore`
    );

    return response.data;
};
