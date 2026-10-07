import axios from 'axios';

// ============================================================
// AXIOS CONFIGURATION
// ============================================================
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// ============================================================
// 1. CREATE / SCHEDULE ASSESSMENT SESSION
// ============================================================
export const postAssessmentSession = async (formData) => {
    const selectedApplicants = Array.isArray(formData.job_applications_id)
        ? formData.job_applications_id
        : [formData.job_applications_id].filter(Boolean);

    const panelUserIds = Array.isArray(formData.panelUserIds)
        ? formData.panelUserIds
            .map(Number)
            .filter(id => Number.isInteger(id) && id > 0)
        : [];

    const payload = {
        vacancy_id: formData.vacancy_id,
        selectedApplicants,
        session_date: formData.session_date,
        venue: formData.venue,
        panelUserIds,
        remarks: formData.remarks || '',
    };

    console.log('========================================');
    console.log('CREATE ASSESSMENT SESSION');
    console.log('========================================');
    console.log('Payload:', payload);
    console.log('Selected Applicants:', selectedApplicants);
    console.log('Panel User IDs:', panelUserIds);

    try {
        const res = await api.post(
            '/interview-sessions',
            payload
        );

        console.log(
            'Assessment session created:',
            res.data
        );

        return res.data;
    } catch (error) {
        console.error(
            'Error creating assessment session:',
            error.response?.data || error.message
        );

        throw error;
    }
};

// ============================================================
// LEGACY ALIAS
// ============================================================
export const postApplications = postAssessmentSession;

// ============================================================
// 2. FETCH ALL INTERVIEW / ASSESSMENT SESSIONS
// ============================================================
export const getInterviewSessions = async () => {
    try {
        const res = await api.get(
            '/interview-sessions'
        );

        return res.data;
    } catch (error) {
        console.error(
            'Error fetching interview sessions:',
            error.response?.data || error.message
        );

        throw error;
    }
};

// ============================================================
// 3. FETCH & MAP INTERVIEW SESSIONS FOR CALENDAR
// ============================================================
export const getInterviewDate = async () => {
    try {
        const res = await api.get(
            '/interview-sessions'
        );

        const rawSessions =
            res.data?.sessions || [];

        return rawSessions.map((session, index) => {
            const dateParts = (
                session.session_date || ''
            ).split('-');

            const year = parseInt(
                dateParts[0],
                10
            );

            const month =
                parseInt(
                    dateParts[1],
                    10
                ) - 1;

            const day = parseInt(
                dateParts[2],
                10
            );

            const isCompleted =
                session.status === 'Completed';

            const isCancelled =
                session.status === 'Cancelled';

            return {
                ...session,

                // Assessment session is the parent
                // of the applicant interview sessions.
                id:
                    session.assessment_session_id ||
                    session.session_id ||
                    `temp-${index}`,

                assessmentSessionId:
                    session.assessment_session_id,

                year: !isNaN(year)
                    ? year
                    : new Date().getFullYear(),

                month: !isNaN(month)
                    ? month
                    : new Date().getMonth(),

                day: !isNaN(day)
                    ? day
                    : new Date().getDate(),

                applicantName:
                    `${session.first_name || ''} ${
                        session.last_name || ''
                    }`.trim(),

                position:
                    session.position_title ||
                    `Vacancy #${session.vacancy_id}`,

                code:
                    session.job_applications_id
                        ? `APP-${session.job_applications_id}`
                        : '',

                timePerApplicant:
                    '30 mins',

                status:
                    session.status ||
                    'Scheduled',

                calBg: isCancelled
                    ? 'bg-red-600'
                    : isCompleted
                        ? 'bg-green-600'
                        : 'bg-blue-600',

                statusBg: isCancelled
                    ? 'bg-red-100 text-red-800'
                    : isCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800',
            };
        });
    } catch (error) {
        console.error(
            'Error fetching interview dates:',
            error.response?.data || error.message
        );

        throw error;
    }
};

// ============================================================
// 4. UPDATE INTERVIEW SESSION
// ============================================================
export const updateInterviewSession = async (
    sessionId,
    updateData
) => {
    try {
        const res = await api.put(
            `/interview-sessions/${sessionId}`,
            updateData
        );

        return res.data;
    } catch (error) {
        console.error(
            'Error updating interview session:',
            error.response?.data || error.message
        );

        throw error;
    }
};

// ============================================================
// 5. FETCH ACTIVE HRMPSB USERS
// ============================================================
export const getHRMPSBUsers = async () => {
    try {
        const res = await api.get(
            '/usersAuth/getAllUsers'
        );

        console.log(
            'HRMPSB USERS RESPONSE:',
            res.data
        );

        /*
         * Support possible backend response formats:
         *
         * { data: [...] }
         * { data: { users: [...] } }
         * { users: [...] }
         * [...]
         */

        let users = [];

        if (Array.isArray(res.data)) {
            users = res.data;
        } else if (
            Array.isArray(res.data?.data)
        ) {
            users = res.data.data;
        } else if (
            Array.isArray(res.data?.data?.users)
        ) {
            users = res.data.data.users;
        } else if (
            Array.isArray(res.data?.users)
        ) {
            users = res.data.users;
        }

        const hrmpsbUsers = users.filter(user => {
            const role = String(
                user.role ||
                user.user_role ||
                ''
            )
                .trim()
                .toLowerCase();

            const isArchived =
                user.is_archived === true;

            return (
                role === 'hrmpsb' &&
                !isArchived
            );
        });

        console.log(
            'ACTIVE HRMPSB USERS:',
            hrmpsbUsers
        );

        return hrmpsbUsers;
    } catch (error) {
        console.error(
            'Error fetching HRMPSB users:',
            error.response?.data || error.message
        );

        throw error;
    }
};