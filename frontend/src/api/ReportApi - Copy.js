import axios from "axios";

axios.defaults.withCredentials = true;

const REPORTS_GET = import.meta.env.VITE_REPORTS_GET;

export const getApplicantSummaryReport = async () => {
    const response = await axios.get(REPORTS_GET);
    return response.data;
};