import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
    X,
    Calendar,
    MapPin,
    Users,
    FileText,
    CheckCircle2,
    Loader2,
} from "lucide-react";
import { getVacancies } from "../../api/VacancyApi";
import { getApplicationsByVacancyId } from "../../api/ApplicationApi";
export default function InterviewSessionModal({
    showModal,
    onClose,
    onSave,
    isSaving = false,
}) {
    // ============================================================
    // VACANCIES
    // ============================================================
    const [vacancies, setVacancies] = useState([]);
    const [loadingVacancies, setLoadingVacancies] = useState(false);
    // ============================================================
    // APPLICANTS
    // ============================================================
    const [rawApplicants, setRawApplicants] = useState([]);
    const [loadingApplicants, setLoadingApplicants] = useState(false);
    // ============================================================
    // HRMPSB USERS
    // ============================================================
    const [panelists, setPanelists] = useState([]);
    const [loadingPanelists, setLoadingPanelists] = useState(false);
    const [selectedPanelistId, setSelectedPanelistId] = useState("");
    // ============================================================
    // APPLICANT SELECTION
    // ============================================================
    const [selectAll, setSelectAll] = useState(false);
    // ============================================================
    // FORM DATA
    // ============================================================
    const [formData, setFormData] = useState({
        vacancy_id: "",
        job_applications_id: [],
        session_date: "",
        venue: "",
        conducted_by: [],
        remarks: "",
    });
    // ============================================================
    // ERRORS
    // ============================================================
    const [errors, setErrors] = useState({});
    // ============================================================
    // RESET FORM
    // ============================================================
    const handleClose = () => {
        setFormData({
            vacancy_id: "",
            job_applications_id: [],
            session_date: "",
            venue: "",
            conducted_by: [],
            remarks: "",
        });
        setErrors({});
        setSelectAll(false);
        setRawApplicants([]);
        setPanelists([]);
        setSelectedPanelistId("");
        onClose();
    };
    // ============================================================
    // LOAD CLOSED VACANCIES
    // ============================================================
    useEffect(() => {
        if (!showModal) return;
        const fetchVacancies = async () => {
            try {
                setLoadingVacancies(true);
                const response = await getVacancies();
                const vacancyList =
                    response?.data ||
                    (Array.isArray(response)
                        ? response
                        : []);
                // Only CLOSED vacancies
                const closedVacancies = vacancyList.filter(
                    (vacancy) =>
                        String(vacancy.status || "")
                            .trim()
                            .toLowerCase() === "closed"
                );
                setVacancies(closedVacancies);
            } catch (error) {
                console.error(
                    "Failed to load vacancies:",
                    error
                );
                setVacancies([]);
            } finally {
                setLoadingVacancies(false);
            }
        };
        fetchVacancies();
    }, [showModal]);
    // ============================================================
    // LOAD HRMPSB USERS
    // ============================================================
    useEffect(() => {
        if (!showModal) return;

        const fetchHRMPSBUsers = async () => {
            try {
                setLoadingPanelists(true);

                const apiUrl =
                    import.meta.env.VITE_GET_ALL_USERS ||
                    import.meta.env.VITE_GET_USERS_API;

                if (!apiUrl) {
                    throw new Error(
                        "Users API URL is not configured. Set VITE_GET_ALL_USERS in .env."
                    );
                }

                const response = await axios.get(apiUrl, {
                    withCredentials: true,
                });

                console.log("GET ALL USERS RESPONSE:", response.data);

                const userList =
                    response?.data?.data ??
                    (Array.isArray(response?.data) ? response.data : []);

                const hrmpsbUsers = userList.filter((user) => {
                    const role = String(
                        user?.role ??
                        user?.user_role ??
                        user?.userRole ??
                        ""
                    )
                        .trim()
                        .toLowerCase();

                    return role === "hrmpsb";
                });

                console.log("HRMPSB USERS:", hrmpsbUsers);
                setPanelists(hrmpsbUsers);
            } catch (error) {
                console.error("ERROR FETCHING HRMPSB USERS:", error);
                console.error("SERVER RESPONSE:", error.response?.data);
                setPanelists([]);
            } finally {
                setLoadingPanelists(false);
            }
        };

        fetchHRMPSBUsers();
    }, [showModal]);

    // ============================================================
    // LOAD APPLICANTS WHEN VACANCY CHANGES
    // ============================================================
    useEffect(() => {
        let mounted = true;
        const vacancyId =
            formData.vacancy_id;
        if (!vacancyId) {
            setRawApplicants([]);
            setSelectAll(false);
            setFormData((prev) => ({
                ...prev,
                job_applications_id: [],
            }));
            return;
        }
        setLoadingApplicants(true);
        (async () => {
            try {
                const data =
                    await getApplicationsByVacancyId(
                        vacancyId
                    );
                if (!mounted) return;
                setRawApplicants(
                    Array.isArray(data)
                        ? data
                        : data?.data || []
                );
            } catch (error) {
                console.error(
                    "Could not load applicants for vacancy",
                    vacancyId,
                    error
                );
                if (mounted) {
                    setRawApplicants([]);
                }
            } finally {
                if (mounted) {
                    setLoadingApplicants(false);
                }
            }
        })();
        setSelectAll(false);
        setFormData((prev) => ({
            ...prev,
            job_applications_id: [],
        }));
        return () => {
            mounted = false;
        };
    }, [formData.vacancy_id]);
    // ============================================================
    // FILTER QUALIFIED APPLICANTS
    // ============================================================
    const qualifiedApplicants = useMemo(() => {
        const seenIds = new Set();
        const seenNames = new Set();
        return rawApplicants
            .filter((app) => {
                const status = String(
                    app.application_status ||
                    app.status ||
                    ""
                )
                    .trim()
                    .toLowerCase()
                    .replace(/[\s-]+/g, "_");
                return (
                    status === "qualified" ||
                    status ===
                        "initial_screening_qualified"
                );
            })
            .map((app) => ({
                ...app,
                id:
                    app.job_application_id ||
                    app.job_applications_id ||
                    app.id,
            }))
            .filter((app) => {
                const nameKey = (
                    app.candidate_name || ""
                )
                    .trim()
                    .toLowerCase();
                if (
                    !app.id ||
                    seenIds.has(app.id) ||
                    (
                        nameKey &&
                        seenNames.has(nameKey)
                    )
                ) {
                    return false;
                }
                seenIds.add(app.id);
                if (nameKey) {
                    seenNames.add(nameKey);
                }
                return true;
            });
    }, [rawApplicants]);
    // ============================================================
    // SELECT ALL APPLICANTS
    // ============================================================
    const handleToggleAll = (e) => {
        const checked =
            e.target.checked;
        setSelectAll(checked);
        if (
            checked &&
            qualifiedApplicants.length > 0
        ) {
            const allIds =
                qualifiedApplicants.map(
                    (app) => app.id
                );
            setFormData((prev) => ({
                ...prev,
                job_applications_id: allIds,
            }));
            if (errors.job_applications_id) {
                setErrors((prev) => ({
                    ...prev,
                    job_applications_id: "",
                }));
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                job_applications_id: [],
            }));
        }
    };
    // ============================================================
    // GET USER DISPLAY NAME
    // ============================================================
    const getUserFullName = (user) => {
        if (user?.full_name) return user.full_name;

        return [
            user?.first_name,
            user?.middle_name,
            user?.last_name,
        ]
            .filter(Boolean)
            .join(" ")
            .trim() || user?.email || "Unknown User";
    };

    // ============================================================
    // ADD HRMPSB USER
    // ============================================================
    const addPanelist = (e) => {
        const selectedUserId = e.target.value;

        if (!selectedUserId) return;

        setFormData((prev) => {
            const current = Array.isArray(prev.conducted_by)
                ? prev.conducted_by
                : [];

            const exists = current.some(
                (id) => String(id) === String(selectedUserId)
            );

            if (exists) return prev;

            return {
                ...prev,
                conducted_by: [...current, selectedUserId],
            };
        });

        setSelectedPanelistId("");

        if (errors.conducted_by) {
            setErrors((prev) => ({
                ...prev,
                conducted_by: "",
            }));
        }
    };

    // ============================================================
    // REMOVE HRMPSB USER
    // ============================================================
    const removePanelist = (userIdToRemove) => {
        setFormData((prev) => ({
            ...prev,
            conducted_by: prev.conducted_by.filter(
                (userId) => String(userId) !== String(userIdToRemove)
            ),
        }));
    };

    // ============================================================
    // GENERAL FORM CHANGE
    // ============================================================
    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };
    // ============================================================
    // SINGLE APPLICANT
    // ============================================================
    const handleSingleApplicantChange = (e) => {
        const value =
            e.target.value;
        setSelectAll(false);
        setFormData((prev) => ({
            ...prev,
            job_applications_id:
                value
                    ? [value]
                    : [],
        }));
        if (errors.job_applications_id) {
            setErrors((prev) => ({
                ...prev,
                job_applications_id: "",
            }));
        }
    };
    // ============================================================
    // SUBMIT
    // ============================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.vacancy_id) {
            newErrors.vacancy_id =
                "Please select a vacancy position";
        }
        if (
            !formData.job_applications_id ||
            formData.job_applications_id.length === 0
        ) {
            newErrors.job_applications_id =
                "Please select at least one applicant";
        }
        if (!formData.session_date) {
            newErrors.session_date =
                "Session date is required";
        }
        if (!formData.venue) {
            newErrors.venue =
                "Venue location is required";
        }
        if (
            formData.conducted_by.length === 0
        ) {
            newErrors.conducted_by =
                "At least one HRMPSB panel member is required";
        }
        if (
            Object.keys(newErrors).length > 0
        ) {
            setErrors(newErrors);
            return;
        }
        try {
            await onSave(formData);
            handleClose();
        } catch (error) {
            console.error(
                "Error saving session:",
                error
            );
            alert(
                `❌ Failed to save the session: ${
                    error.message ||
                    "Please try again."
                }`
            );
        }
    };
    // ============================================================
    // HIDE MODAL
    // ============================================================
    if (!showModal) return null;
    // ============================================================
    // UI
    // ============================================================
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-[620px] overflow-hidden rounded-xl border border-slate-300 bg-[#f3f4f6] shadow-2xl">
                {/* =================================================
                    HEADER
                ================================================= */}
                <div className="flex items-center justify-between bg-[#212529] px-5 py-3.5 text-white">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                        <Calendar className="h-4 w-4 text-slate-300" />
                        <span>
                            Create Assessment Session
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSaving}
                        className="text-slate-400 transition-colors hover:text-white disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {/* =================================================
                    FORM
                ================================================= */}
                <form
                    onSubmit={handleSubmit}
                    className="max-h-[550px] space-y-4 overflow-y-auto p-5"
                >
                    {/* =================================================
                        VACANCY
                    ================================================= */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-600">
                            Select Job Vacancy (Closed Only)
                        </label>
                        <select
                            name="vacancy_id"
                            value={formData.vacancy_id}
                            onChange={handleChange}
                            disabled={
                                isSaving ||
                                loadingVacancies
                            }
                            className={`w-full rounded-lg border ${
                                errors.vacancy_id
                                    ? "border-rose-500"
                                    : "border-slate-200"
                            } bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 disabled:bg-slate-100`}
                        >
                            <option value="">
                                {loadingVacancies
                                    ? "Loading vacancies list..."
                                    : vacancies.length === 0
                                        ? "-- No closed vacancies available --"
                                        : "-- Choose Vacancy Position --"}
                            </option>
                            {vacancies.map((v) => {
                                const id =
                                    v.vacancy_id ||
                                    v.id;
                                return (
                                    <option
                                        key={id}
                                        value={id}
                                    >
                                        {v.position_title ||
                                            v.job_title ||
                                            v.title}
                                        {v.department
                                            ? ` (${v.department})`
                                            : ""}
                                    </option>
                                );
                            })}
                        </select>
                        {errors.vacancy_id && (
                            <span className="text-[10px] font-semibold text-rose-500">
                                {errors.vacancy_id}
                            </span>
                        )}
                    </div>
                    {/* =================================================
                        APPLICANT
                    ================================================= */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wide text-slate-600">
                                Select Candidate
                            </label>
                            {formData.vacancy_id &&
                                qualifiedApplicants.length > 0 && (
                                    <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={
                                                handleToggleAll
                                            }
                                            disabled={isSaving}
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>
                                            Select All Applicants (
                                            {
                                                qualifiedApplicants.length
                                            }
                                            )
                                        </span>
                                    </label>
                                )}
                        </div>
                        <select
                            name="job_applications_id"
                            value={
                                selectAll
                                    ? ""
                                    : formData
                                        .job_applications_id[0] ||
                                      ""
                            }
                            onChange={
                                handleSingleApplicantChange
                            }
                            disabled={
                                !formData.vacancy_id ||
                                loadingApplicants ||
                                selectAll ||
                                isSaving
                            }
                            className={`w-full rounded-lg border ${
                                errors.job_applications_id
                                    ? "border-rose-500"
                                    : "border-slate-200"
                            } bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400`}
                        >
                            <option value="">
                                {loadingApplicants
                                    ? "Downloading candidate list..."
                                    : selectAll
                                        ? `✓ All ${qualifiedApplicants.length} candidates selected`
                                        : !formData.vacancy_id
                                            ? "-- Select a vacancy first --"
                                            : qualifiedApplicants.length === 0
                                                ? "-- No qualified candidates found --"
                                                : "-- Choose Applicant --"}
                            </option>
                            {!selectAll &&
                                qualifiedApplicants.map(
                                    (app) => (
                                        <option
                                            key={app.id}
                                            value={app.id}
                                        >
                                            {app.candidate_name ||
                                                `Applicant ID: ${app.id}`}
                                        </option>
                                    )
                                )}
                        </select>
                        {errors.job_applications_id && (
                            <span className="text-[10px] font-semibold text-rose-500">
                                {errors.job_applications_id}
                            </span>
                        )}
                    </div>
                    {/* =================================================
                        SESSION DATE
                    ================================================= */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-600">
                            Session Schedule Date
                        </label>
                        <input
                            type="date"
                            name="session_date"
                            value={formData.session_date}
                            onChange={handleChange}
                            disabled={isSaving}
                            className={`w-full rounded-lg border ${
                                errors.session_date
                                    ? "border-rose-500"
                                    : "border-slate-200"
                            } bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 disabled:bg-slate-100`}
                        />
                        {errors.session_date && (
                            <span className="text-[10px] font-semibold text-rose-500">
                                {errors.session_date}
                            </span>
                        )}
                    </div>
                    {/* =================================================
                        VENUE
                    ================================================= */}
                    <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            Venue Location
                        </label>
                        <input
                            type="text"
                            name="venue"
                            value={formData.venue}
                            onChange={handleChange}
                            disabled={isSaving}
                            placeholder="e.g., HRMPSB Conference Room"
                            className={`w-full rounded-lg border ${
                                errors.venue
                                    ? "border-rose-500"
                                    : "border-slate-200"
                            } bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 disabled:bg-slate-100`}
                        />
                        {errors.venue && (
                            <span className="text-[10px] font-semibold text-rose-500">
                                {errors.venue}
                            </span>
                        )}
                    </div>
                    {/* =================================================
                        HRMPSB PANEL MEMBERS
                    ================================================= */}
                    <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            HRMPSB Panel Members
                        </label>

                        <select
                            value={selectedPanelistId}
                            onChange={addPanelist}
                            disabled={isSaving || loadingPanelists}
                            className={`w-full rounded-lg border ${
                                errors.conducted_by
                                    ? "border-rose-500"
                                    : "border-slate-200"
                            } bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 disabled:bg-slate-100`}
                        >
                            <option value="">
                                {loadingPanelists
                                    ? "Loading HRMPSB users..."
                                    : panelists.filter((user) => {
                                          const userId =
                                              user?.user_id ?? user?.id;
                                          return (
                                              userId &&
                                              !formData.conducted_by.some(
                                                  (id) =>
                                                      String(id) ===
                                                      String(userId)
                                              )
                                          );
                                      }).length === 0
                                    ? formData.conducted_by.length > 0
                                        ? "-- All HRMPSB users selected --"
                                        : "-- No HRMPSB users available --"
                                    : "-- Select HRMPSB Panel Member --"}
                            </option>

                            {panelists
                                .filter((user) => {
                                    const userId =
                                        user?.user_id ?? user?.id;

                                    return (
                                        userId &&
                                        !formData.conducted_by.some(
                                            (id) =>
                                                String(id) ===
                                                String(userId)
                                        )
                                    );
                                })
                                .map((user) => {
                                    const userId =
                                        user?.user_id ?? user?.id;

                                    return (
                                        <option
                                            key={userId}
                                            value={userId}
                                        >
                                            {getUserFullName(user)}
                                            {user?.email
                                                ? ` - ${user.email}`
                                                : ""}
                                        </option>
                                    );
                                })}
                        </select>

                        {errors.conducted_by && (
                            <span className="text-[10px] font-semibold text-rose-500">
                                {errors.conducted_by}
                            </span>
                        )}

                        {formData.conducted_by.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {formData.conducted_by.map((userId) => {
                                    const user = panelists.find(
                                        (item) =>
                                            String(
                                                item?.user_id ?? item?.id
                                            ) === String(userId)
                                    );

                                    return (
                                        <span
                                            key={userId}
                                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-800"
                                        >
                                            {user
                                                ? getUserFullName(user)
                                                : userId}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removePanelist(userId)
                                                }
                                                disabled={isSaving}
                                                className="text-slate-400 hover:text-rose-600 disabled:opacity-50"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* =================================================
                        REMARKS
                    ================================================= */}
                    <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            Remarks / Additional Instructions
                        </label>
                        <textarea
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            disabled={isSaving}
                            rows={2}
                            placeholder="Optional notes or instructions for this testing block..."
                            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 disabled:bg-slate-100"
                        />
                    </div>
                    {/* =================================================
                        ACTIONS
                    ================================================= */}
                    <div className="flex justify-end gap-3 border-t border-slate-200 bg-white pt-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSaving}
                            className="rounded-md px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 rounded-md bg-[#1e3a6a] px-5 py-2.5 text-xs font-bold text-white shadow transition-colors hover:bg-[#112d55] disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Save Session
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
