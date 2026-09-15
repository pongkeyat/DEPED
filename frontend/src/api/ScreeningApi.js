import axios from 'axios';

const POST_SCREENING = import.meta.env.VITE_SCREENING_POST

export const postScreening = async (screening_forms) => {
    const res = await axios.post(POST_SCREENING, screening_forms)
    return res.data;
}