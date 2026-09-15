import axios from 'axios';

// Fallback base URL if environment variables are unset
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Configured Axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. Post/Schedule Interview Sessions
export const postAssessmentSession = async (formData) => {
    const payload = {
        vacancy_id: formData.vacancy_id,
        selectedApplicants: Array.isArray(formData.job_applications_id)
            ? formData.job_applications_id
            : [formData.job_applications_id].filter(Boolean),
        session_date: formData.session_date,
        venue: formData.venue,
        panelists: formData.conducted_by,
        remarks: formData.remarks || '',
    };

    const res = await api.post('/interview-sessions', payload);
    return res.data;
};

// Legacy alias export
export const postApplications = postAssessmentSession;

// 2. Fetch Raw Interview Sessions
export const getInterviewSessions = async () => {
    const res = await api.get('/interview-sessions');
    return res.data;
};

// 3. Fetch & Map Interview Sessions for Calendar Component
export const getInterviewDate = async () => {
    const res = await api.get('/interview-sessions');
    const rawSessions = res.data?.sessions || [];

    return rawSessions.map((session, index) => {
        // Safe Date Parsing ("YYYY-MM-DD")
        const dateParts = (session.session_date || '').split('-');
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
        const day = parseInt(dateParts[2], 10);

        // Derive status styling dynamically based on database session status
        const isCompleted = session.status === 'Completed';
        const isCancelled = session.status === 'Cancelled';

        return {
            ...session,
            // Unique ID using custom string session_id (e.g., session-0001)
            id: session.session_id || `temp-${index}`,
            year: !isNaN(year) ? year : new Date().getFullYear(),
            month: !isNaN(month) ? month : new Date().getMonth(),
            day: !isNaN(day) ? day : new Date().getDate(),

            // Formatted UI Properties
            applicantName: `${session.first_name || ''} ${session.last_name || ''}`.trim(),
            position: session.position_title || `Vacancy #${session.vacancy_id}`,
            code: `APP-${session.job_applications_id}`,
            timePerApplicant: '30 mins',
            status: session.status || 'Scheduled',

            // Dynamic Tailwind UI Indicators
            calBg: isCancelled ? 'bg-red-600' : isCompleted ? 'bg-green-600' : 'bg-blue-600',
            statusBg: isCancelled 
                ? 'bg-red-100 text-red-800' 
                : isCompleted 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800',
        };
    });
};

// 4. Update Interview Session (Status, Date, Venue)
export const updateInterviewSession = async (sessionId, updateData) => {
    const res = await api.put(`/interview-sessions/${sessionId}`, updateData);
    return res.data;
};

