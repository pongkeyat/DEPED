import axios from 'axios';

const POST_SCREENING = import.meta.env.VITE_SCREENING_POST
const INITIAL_EVALUATION_API = (
    import.meta.env.VITE_INITIAL_EVALUATION_API ||
    (POST_SCREENING
        ? POST_SCREENING.replace(/\/initial-evaluation\/?$/, '')
        : 'http://localhost:5000/api/initial-evaluation')
).replace(/\/+$/, '');

export const postScreening = async (screening_forms) => {
    const res = await axios.post(POST_SCREENING, screening_forms)
    return res.data;
}

export const getPerformanceOptionsForApplicant = async (applicantId) => {
    const response = await axios.get(
        `${INITIAL_EVALUATION_API}/performance-options/${encodeURIComponent(applicantId)}`,
        { withCredentials: true }
    );
    return response.data?.data;
};