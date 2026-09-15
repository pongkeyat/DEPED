import axios from 'axios';

const POST_APPLICATIONS = import.meta.env.VITE_APPLICATIONS_POST;
const GET_APPLICATIONS = import.meta.env.VITE_APPLICATIONS_GET;
const GET_APPLICATIONS_BY_ID = import.meta.env.VITE_APPLICATIONS_GET_BY_ID;
const UPDATE_APPLICATION_STATUS = import.meta.env.VITE_APPLICATIONS_UPDATE_STATUS;

// 📁 UPDATED: Configured to support file uploads via FormData
export const postApplications = async (formData, uploadedFiles = {}) => {
    try {
        console.log(`[API Network Request] Submitting application data...`);
        const multipartData = new FormData();
        const payload = structuredClone(formData);

        Object.entries(payload.document_checklist || {}).forEach(([field, value]) => {
            if (field.endsWith('_file')) {
                delete payload.document_checklist[field];
                return;
            }
            payload.document_checklist[field] = value;
        });

        multipartData.append('payload', JSON.stringify(payload));

        Object.entries(formData.document_checklist || {}).forEach(([field, value]) => {
            if (field.endsWith('_file') && value instanceof File) {
                multipartData.append(field, value);
            }
        });

        Object.entries(uploadedFiles).forEach(([field, value]) => {
            if (field.endsWith('_file') && value instanceof File) {
                multipartData.append(field, value);
            }
        });

        const res = await axios.post(POST_APPLICATIONS, multipartData);
        return res.data;
    } catch (error) {
        console.error("API Error [postApplications]:", error?.response?.data || error.message);
        throw error;
    }
};

export const getApplications = async () => {
    try {
        console.log(`[API Network Request] Fetching all applications...`);
        const res = await axios.get(GET_APPLICATIONS);
        return res.data;
    } catch (error) {
        console.error("API Error [getApplications]:", error?.response?.data || error.message);
        throw error;
    }
};

export const getApplicationById = async (id) => {
    if (!id) {
        console.error("API Error: getApplicationById was called without an ID");
        return null;
    }


    try {
        const cleanBaseUrl = GET_APPLICATIONS_BY_ID.replace(/\/+$/, '');
        const encodedId = encodeURIComponent(id);

        console.log(`[API Network Request] Fetching details from: ${cleanBaseUrl}/${encodedId}`);
        
        const res = await axios.get(`${cleanBaseUrl}/${encodedId}`);
        return res.data?.data ?? res.data;
    } catch (error) {
        console.error(`API Error [getApplicationById (${id})]:`, error?.response?.data || error.message);
        throw error;
    }
};

export const updateApplicationStatus = async (id, statusData) => {
    if (!id) {
        console.error("API Error: updateApplicationStatus was called without an ID");
        return null;
    }

    try {
        const cleanBaseUrl = UPDATE_APPLICATION_STATUS
            ? UPDATE_APPLICATION_STATUS.replace(/\/+$/, '')
            : `${GET_APPLICATIONS_BY_ID.replace(/\/+$/, '')}/updateApplicationStatus`;

        console.log(`[API Network Request] Updating status for ID ${id}...`);
        
        const res = await axios.put(`${cleanBaseUrl}/${id}`, statusData);
        return res.data;
    } catch (error) {
        console.error(`API Error [updateApplicationStatus (${id})]:`, error?.response?.data || error.message);
        throw error;
    }
};


export const getApplicationsByVacancyId = async (vacancyId) => {
    if (!vacancyId) return [];
    try {
        const res = await axios.get(GET_APPLICATIONS);
        const payload = res.data;

        let rows = [];
        if (Array.isArray(payload)) rows = payload;
        else if (Array.isArray(payload.data)) rows = payload.data;
        else if (Array.isArray(payload.data?.data)) rows = payload.data.data;
        else if (Array.isArray(payload.rows)) rows = payload.rows;
        else if (Array.isArray(payload.applications)) rows = payload.applications;

        // 1. Filter by vacancy_id
        const filtered = rows.filter(r =>
            String(r.vacancy_id ?? r.vacancyId ?? '').trim() === String(vacancyId).trim()
        );

        // 2. Map the data cleanly for your modal dropdown
        return filtered.map(r => ({
            ...r,
            // Point the modal's expected singular key to your actual backend plural property
            job_application_id: r.job_applications_id, 
            
            // Build the string your dropdown uses to show the applicant's name
            candidate_name: r.first_name ? `${r.first_name} ${r.last_name || ''}`.trim() : null
        }));
        
    } catch (error) {
        console.error(`Error filtering applications for vacancy ${vacancyId}:`, error.message);
        return [];
    }
};
