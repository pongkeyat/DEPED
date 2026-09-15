import axios from 'axios';

const POST_VACANCIES = import.meta.env.VITE_VACANCIES_POST || 'http://localhost:5000/api/vacancies/postVacancy'
const GET_VACANCIES = import.meta.env.VITE_VACANCIES_GET || 'http://localhost:5000/api/vacancies/getVacancies'

export const postVacancies = async (vacancy_form) => {
    const res = await axios.post(POST_VACANCIES, vacancy_form)
    return res.data;
}

export const getVacancies = async (params = {}) => {
    try {
        const res = await axios.get(GET_VACANCIES, { params });
        const responseData = res.data;

        // Handle the new controller response shape: { pagination: {...}, data: [...] }
        if (responseData && Array.isArray(responseData.data)) {
            return {
                data: responseData.data,
                pagination: responseData.pagination || {}
            };
        }

        // Fallbacks for legacy response structures
        if (Array.isArray(responseData)) return { data: responseData, pagination: {} };
        if (responseData == null) return { data: [], pagination: {} };
        if (Array.isArray(responseData.vacancy)) return { data: responseData.vacancy, pagination: responseData.pagination || {} };
        if (Array.isArray(responseData.rows)) return { data: responseData.rows, pagination: responseData.pagination || {} };

        console.warn('Unexpected vacancies response shape, returning empty array:', responseData);
        return { data: [], pagination: {} };
    } catch (error) {
        console.error("Error fetching vacancies from API:", error.message);
        throw error; 
    }
};


