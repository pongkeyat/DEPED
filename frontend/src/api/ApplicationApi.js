
import axios from 'axios';

// ======================================================
// API ENDPOINTS
// ======================================================

const POST_APPLICATIONS =
    import.meta.env.VITE_APPLICATIONS_POST;

const GET_APPLICATIONS =
    import.meta.env.VITE_APPLICATIONS_GET;

const GET_APPLICATIONS_BY_ID =
    import.meta.env.VITE_APPLICATIONS_GET_BY_ID;

const UPDATE_APPLICATION_STATUS =
    import.meta.env.VITE_APPLICATIONS_UPDATE_STATUS;

const UPDATE_APPLICANT =
    import.meta.env.VITE_APPLICATIONS_UPDATE_APPLICANT;


// ======================================================
// HELPER: REMOVE TRAILING SLASHES
// ======================================================

const cleanUrl = (url) => {
    return url ? url.replace(/\/+$/, '') : '';
};


// ======================================================
// HELPER: APPEND FILES TO FORMDATA
// ======================================================

const appendApplicantFiles = (
    multipartData,
    formData,
    uploadedFiles = {}
) => {
    // Files from document checklist
    Object.entries(formData.document_checklist || {}).forEach(
        ([field, value]) => {
            if (
                field.endsWith('_file') &&
                value instanceof File
            ) {
                multipartData.append(field, value);
            }
        }
    );

    // Additional uploaded files
    Object.entries(uploadedFiles).forEach(
        ([field, value]) => {
            if (
                field.endsWith('_file') &&
                value instanceof File
            ) {
                multipartData.append(field, value);
            }
        }
    );
};


// ======================================================
// HELPER: PREPARE APPLICANT FORMDATA
// ======================================================

const prepareApplicantFormData = (
    formData,
    uploadedFiles = {}
) => {
    const multipartData = new FormData();

    // Clone applicant data to avoid modifying the original
    const payload = structuredClone(formData);

    // Remove file properties from the JSON payload
    Object.entries(payload.document_checklist || {}).forEach(
        ([field]) => {
            if (field.endsWith('_file')) {
                delete payload.document_checklist[field];
            }
        }
    );

    // Add JSON payload
    multipartData.append(
        'payload',
        JSON.stringify(payload)
    );

    // Add uploaded files
    appendApplicantFiles(
        multipartData,
        formData,
        uploadedFiles
    );

    return multipartData;
};


// ======================================================
// 1. SUBMIT APPLICATION
// ======================================================

export const postApplications = async (
    formData,
    uploadedFiles = {}
) => {
    try {
        console.log(
            '[API Network Request] Submitting application data...'
        );

        const multipartData = prepareApplicantFormData(
            formData,
            uploadedFiles
        );

        const res = await axios.post(
            POST_APPLICATIONS,
            multipartData
        );

        return res.data;

    } catch (error) {
        console.error(
            'API Error [postApplications]:',
            error?.response?.data || error.message
        );

        throw error;
    }
};


// ======================================================
// 2. GET ALL APPLICATIONS
// ======================================================

export const getApplications = async () => {
    try {
        console.log(
            '[API Network Request] Fetching all applications...'
        );

        const res = await axios.get(
            GET_APPLICATIONS
        );

        return res.data;

    } catch (error) {
        console.error(
            'API Error [getApplications]:',
            error?.response?.data || error.message
        );

        throw error;
    }
};


// ======================================================
// 3. GET APPLICATION BY ID
// ======================================================

export const getApplicationById = async (id) => {
    if (!id) {
        console.error(
            'API Error: getApplicationById was called without an ID'
        );

        return null;
    }

    try {
        const cleanBaseUrl = cleanUrl(
            GET_APPLICATIONS_BY_ID
        );

        const encodedId = encodeURIComponent(id);

        console.log(
            `[API Network Request] Fetching details from: ${cleanBaseUrl}/${encodedId}`
        );

        const res = await axios.get(
            `${cleanBaseUrl}/${encodedId}`
        );

        return res.data?.data ?? res.data;

    } catch (error) {
        console.error(
            `API Error [getApplicationById (${id})]:`,
            error?.response?.data || error.message
        );

        throw error;
    }
};


// ======================================================
// 4. UPDATE APPLICATION STATUS
// ======================================================

export const updateApplicationStatus = async (
    id,
    statusData
) => {
    if (!id) {
        console.error(
            'API Error: updateApplicationStatus was called without an ID'
        );

        return null;
    }

    try {
        const cleanBaseUrl = UPDATE_APPLICATION_STATUS
            ? cleanUrl(UPDATE_APPLICATION_STATUS)
            : `${cleanUrl(GET_APPLICATIONS_BY_ID)}/updateApplicationStatus`;

        const encodedId = encodeURIComponent(id);

        console.log(
            `[API Network Request] Updating status for ID ${id}...`
        );

        const res = await axios.put(
            `${cleanBaseUrl}/${encodedId}`,
            statusData
        );

        return res.data;

    } catch (error) {
        console.error(
            `API Error [updateApplicationStatus (${id})]:`,
            error?.response?.data || error.message
        );

        throw error;
    }
};


// ======================================================
// 5. GET APPLICATIONS BY VACANCY ID
// ======================================================

export const getApplicationsByVacancyId = async (
    vacancyId
) => {
    if (!vacancyId) {
        return [];
    }

    try {
        const res = await axios.get(
            GET_APPLICATIONS
        );

        const payload = res.data;

        let rows = [];

        if (Array.isArray(payload)) {
            rows = payload;
        } else if (Array.isArray(payload.data)) {
            rows = payload.data;
        } else if (Array.isArray(payload.data?.data)) {
            rows = payload.data.data;
        } else if (Array.isArray(payload.rows)) {
            rows = payload.rows;
        } else if (Array.isArray(payload.applications)) {
            rows = payload.applications;
        }

        // Filter applications by vacancy ID
        const filtered = rows.filter((r) => {
            return (
                String(
                    r.vacancy_id ??
                    r.vacancyId ??
                    ''
                ).trim() === String(vacancyId).trim()
            );
        });

        // Map data for modal dropdowns
        return filtered.map((r) => ({
            ...r,

            job_application_id:
                r.job_applications_id,

            candidate_name: r.first_name
                ? `${r.first_name} ${r.last_name || ''}`.trim()
                : null
        }));

    } catch (error) {
        console.error(
            `Error filtering applications for vacancy ${vacancyId}:`,
            error.message
        );

        return [];
    }
};


// ======================================================
// 6. UPDATE FULL APPLICANT
// ======================================================

export const updateApplicant = async (
    id,
    formData,
    uploadedFiles = {}
) => {
    if (!id) {
        console.error(
            'API Error: updateApplicant was called without an ID'
        );

        return null;
    }

    if (!UPDATE_APPLICANT) {
        throw new Error(
            'VITE_APPLICATIONS_UPDATE_APPLICANT is not configured in your .env file.'
        );
    }

    try {
        console.log(
            `[API Network Request] Updating applicant with ID ${id}...`
        );

        // Prepare multipart form data
        const multipartData = prepareApplicantFormData(
            formData,
            uploadedFiles
        );

        const cleanBaseUrl = cleanUrl(
            UPDATE_APPLICANT
        );

        const encodedId = encodeURIComponent(id);

        // Send PUT request to backend
        const res = await axios.put(
            `${cleanBaseUrl}/${encodedId}`,
            multipartData
        );

        console.log(
            'Applicant updated successfully:',
            res.data
        );

        return res.data;

    } catch (error) {
        console.error(
            `API Error [updateApplicant (${id})]:`,
            error?.response?.data || error.message
        );

        throw error;
    }
};