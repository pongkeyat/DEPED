import React, { useState, useEffect, useMemo } from "react";

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
import { getHRMPSBUsers } from "../../api/InterviewSessionApi";

export default function InterviewSessionModal({
    showModal,
    onClose,
    onSave,
    isSaving = false,
}) {
    // ============================================================
    // STATE
    // ============================================================

    const [vacancies, setVacancies] = useState([]);
    const [loadingVacancies, setLoadingVacancies] = useState(false);

    const [rawApplicants, setRawApplicants] = useState([]);
    const [loadingApplicants, setLoadingApplicants] = useState(false);

    const [panelists, setPanelists] = useState([]);
    const [loadingPanelists, setLoadingPanelists] = useState(false);
    const [selectedPanelistId, setSelectedPanelistId] = useState("");

    const [selectAll, setSelectAll] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        vacancy_id: "",
        job_applications_id: [],
        session_date: "",
        venue: "",
        panelUserIds: [],
        remarks: "",
    });

    // ============================================================
    // CONFIRMATION STATE
    // ============================================================

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingPayload, setPendingPayload] = useState(null);

    // ============================================================
    // CLOSE / RESET MODAL
    // ============================================================

    const handleClose = () => {
        setFormData({
            vacancy_id: "",
            job_applications_id: [],
            session_date: "",
            venue: "",
            panelUserIds: [],
            remarks: "",
        });

        setErrors({});
        setSelectAll(false);
        setRawApplicants([]);
        setPanelists([]);
        setSelectedPanelistId("");

        setShowConfirmModal(false);
        setPendingPayload(null);

        onClose();
    };

    // ============================================================
    // LOAD CLOSED VACANCIES
    // ============================================================

    useEffect(() => {
        if (!showModal) return;

        let mounted = true;

        const fetchVacancies = async () => {
            try {
                setLoadingVacancies(true);

                const response = await getVacancies();

                const list =
                    response?.data?.data ||
                    response?.data ||
                    (Array.isArray(response)
                        ? response
                        : []);

                if (mounted) {
                    const closedVacancies = Array.isArray(list)
                        ? list.filter(
                            (vacancy) =>
                                String(
                                    vacancy.status || ""
                                )
                                    .trim()
                                    .toLowerCase() === "closed"
                        )
                        : [];

                    setVacancies(closedVacancies);
                }
            } catch (error) {
                console.error(
                    "Failed to load vacancies:",
                    error
                );

                if (mounted) {
                    setVacancies([]);
                }
            } finally {
                if (mounted) {
                    setLoadingVacancies(false);
                }
            }
        };

        fetchVacancies();

        return () => {
            mounted = false;
        };
    }, [showModal]);

    // ============================================================
    // LOAD ACTIVE HRMPSB USERS
    // ============================================================

    useEffect(() => {
        if (!showModal) return;

        let mounted = true;

        const fetchHRMPSBUsers = async () => {
            try {
                setLoadingPanelists(true);

                const users = await getHRMPSBUsers();

                if (mounted) {
                    setPanelists(
                        Array.isArray(users)
                            ? users
                            : []
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to fetch HRMPSB users:",
                    error.response?.data ||
                    error.message
                );

                if (mounted) {
                    setPanelists([]);
                }
            } finally {
                if (mounted) {
                    setLoadingPanelists(false);
                }
            }
        };

        fetchHRMPSBUsers();

        return () => {
            mounted = false;
        };
    }, [showModal]);

    // ============================================================
    // LOAD APPLICANTS WHEN VACANCY CHANGES
    // ============================================================

    useEffect(() => {
        let mounted = true;

        const vacancyId = formData.vacancy_id;

        if (!vacancyId) {
            setRawApplicants([]);
            setSelectAll(false);

            setFormData((prev) => ({
                ...prev,
                job_applications_id: [],
            }));

            setLoadingApplicants(false);

            return () => {
                mounted = false;
            };
        }

        const fetchApplicants = async () => {
            try {
                setLoadingApplicants(true);

                const response =
                    await getApplicationsByVacancyId(
                        vacancyId
                    );

                const list =
                    response?.data?.data ||
                    response?.data ||
                    (Array.isArray(response)
                        ? response
                        : []);

                if (mounted) {
                    setRawApplicants(
                        Array.isArray(list)
                            ? list
                            : []
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to load applicants:",
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
        };

        setSelectAll(false);

        setFormData((prev) => ({
            ...prev,
            job_applications_id: [],
        }));

        fetchApplicants();

        return () => {
            mounted = false;
        };
    }, [formData.vacancy_id]);

    // ============================================================
    // QUALIFIED APPLICANTS ONLY
    // ============================================================

    const qualifiedApplicants = useMemo(() => {
        const seenIds = new Set();

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
                    app.job_application_id ??
                    app.job_applications_id ??
                    app.id,
            }))
            .filter((app) => {
                const id = String(app.id ?? "");

                if (!id || seenIds.has(id)) {
                    return false;
                }

                seenIds.add(id);

                return true;
            });
    }, [rawApplicants]);

    // ============================================================
    // USER HELPERS
    // ============================================================

    const getUserId = (user) =>
        Number(user?.id ?? user?.user_id);

    const getUserFullName = (user) => {
        if (user?.full_name) {
            return user.full_name;
        }

        return (
            [
                user?.first_name,
                user?.middle_name,
                user?.last_name,
            ]
                .filter(Boolean)
                .join(" ")
                .trim() ||
            user?.email ||
            "Unknown User"
        );
    };

    // ============================================================
    // SELECT ALL APPLICANTS
    // ============================================================

    const handleToggleAll = (event) => {
        const checked = event.target.checked;

        setSelectAll(checked);

        setFormData((prev) => ({
            ...prev,

            job_applications_id: checked
                ? qualifiedApplicants.map(
                    (app) => app.id
                )
                : [],
        }));

        setErrors((prev) => ({
            ...prev,
            job_applications_id: "",
        }));
    };

    // ============================================================
    // ADD HRMPSB PANEL MEMBER
    // ============================================================

    const addPanelist = (event) => {
        const userId = Number(event.target.value);

        if (
            !userId ||
            !Number.isSafeInteger(userId)
        ) {
            return;
        }

        setFormData((prev) => ({
            ...prev,

            panelUserIds:
                prev.panelUserIds.includes(userId)
                    ? prev.panelUserIds
                    : [
                        ...prev.panelUserIds,
                        userId,
                    ],
        }));

        setSelectedPanelistId("");

        setErrors((prev) => ({
            ...prev,
            panelUserIds: "",
        }));
    };

    // ============================================================
    // REMOVE HRMPSB PANEL MEMBER
    // ============================================================

    const removePanelist = (userId) => {
        setFormData((prev) => ({
            ...prev,

            panelUserIds:
                prev.panelUserIds.filter(
                    (id) =>
                        Number(id) !==
                        Number(userId)
                ),
        }));
    };

    // ============================================================
    // GENERAL FORM CHANGE
    // ============================================================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    // ============================================================
    // SINGLE APPLICANT SELECTION
    // ============================================================

    const handleSingleApplicantChange = (
        event
    ) => {
        const value = event.target.value;

        setSelectAll(false);

        setFormData((prev) => ({
            ...prev,

            job_applications_id: value
                ? [value]
                : [],
        }));

        setErrors((prev) => ({
            ...prev,
            job_applications_id: "",
        }));
    };

    // ============================================================
    // SUBMIT
    // ============================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        const newErrors = {};

        if (!formData.vacancy_id) {
            newErrors.vacancy_id =
                "Please select a vacancy.";
        }

        if (
            !formData.job_applications_id ||
            !formData.job_applications_id.length
        ) {
            newErrors.job_applications_id =
                "Please select at least one qualified applicant.";
        }

        if (!formData.session_date) {
            newErrors.session_date =
                "Session date is required.";
        }

        if (!formData.venue.trim()) {
            newErrors.venue =
                "Venue location is required.";
        }

        if (
            !formData.panelUserIds ||
            !formData.panelUserIds.length
        ) {
            newErrors.panelUserIds =
                "Select at least one HRMPSB panel member.";
        }

        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            return;
        }

        try {
            const payload = {
                ...formData,

                panelUserIds:
                    formData.panelUserIds.map(
                        Number
                    ),
            };

            console.log(
                "========================================"
            );

            console.log(
                "SUBMITTING ASSESSMENT SESSION"
            );

            console.log(
                "========================================"
            );

            console.log(
                "Payload:",
                payload
            );

            console.log(
                "Panel IDs:",
                payload.panelUserIds
            );

            console.log(
                "Applicants:",
                payload.selectedApplicants
            );

            // ====================================================
            // SHOW CONFIRMATION BEFORE ACTUAL SAVE
            // ====================================================

            setPendingPayload(payload);
            setShowConfirmModal(true);
        } catch (error) {
            console.error(
                "Error preparing assessment session:",
                error
            );

            alert(
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                "Failed to prepare the assessment session."
            );
        }
    };

    // ============================================================
    // CONFIRM SUBMISSION
    // ============================================================

    const handleConfirmSubmit = async () => {
        if (!pendingPayload || isSaving) {
            return;
        }

        try {
            await onSave(pendingPayload);

            setShowConfirmModal(false);
            setPendingPayload(null);

            handleClose();
        } catch (error) {
            console.error(
                "Error saving assessment session:",
                error
            );

            setShowConfirmModal(false);
            setPendingPayload(null);

            alert(
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                "Failed to save the assessment session."
            );
        }
    };

    // ============================================================
    // CANCEL CONFIRMATION
    // ============================================================

    const handleCancelConfirmation = () => {
        if (isSaving) {
            return;
        }

        setShowConfirmModal(false);
        setPendingPayload(null);
    };

    // ============================================================
    // DON'T RENDER WHEN CLOSED
    // ============================================================

    if (!showModal) {
        return null;
    }

    // ============================================================
    // UI
    // ============================================================

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm">
            <div className="w-full max-w-[620px] overflow-hidden rounded-xl border border-slate-300 bg-[#f3f4f6] shadow-2xl">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="flex items-center justify-between bg-[#212529] px-5 py-3.5 text-white">

                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">

                        <Calendar className="h-4 w-4" />

                        Create Assessment Session
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSaving}
                        className="text-slate-400 hover:text-white disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* ==================================================
                    FORM
                ================================================== */}

                <form
                    onSubmit={handleSubmit}
                    className="max-h-[75vh] space-y-4 overflow-y-auto p-5"
                >

                    {/* ==================================================
                        VACANCY
                    ================================================== */}

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
                            } bg-white px-3 py-2 text-xs outline-none focus:border-blue-500`}
                        >
                            <option value="">
                                {loadingVacancies
                                    ? "Loading vacancies..."
                                    : "-- Select Closed Vacancy --"}
                            </option>

                            {vacancies.map(
                                (vacancy) => (
                                    <option
                                        key={
                                            vacancy.vacancy_id
                                        }
                                        value={
                                            vacancy.vacancy_id
                                        }
                                    >
                                        {vacancy.position_title ||
                                            vacancy.position_name ||
                                            vacancy.vacancy_id}{" "}
                                        (
                                        {
                                            vacancy.vacancy_id
                                        }
                                        )
                                    </option>
                                )
                            )}
                        </select>

                        {errors.vacancy_id && (
                            <span className="text-[10px] text-rose-500">
                                {errors.vacancy_id}
                            </span>
                        )}
                    </div>

                    {/* ==================================================
                        QUALIFIED APPLICANTS
                    ================================================== */}

                    <div className="flex flex-col gap-1.5">

                        <div className="flex items-center justify-between">

                            <label className="text-xs font-bold uppercase tracking-wide text-slate-600">
                                Qualified Applicants
                            </label>

                            <label className="flex items-center gap-1.5 text-xs text-slate-600">

                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={
                                        handleToggleAll
                                    }
                                    disabled={
                                        isSaving ||
                                        !qualifiedApplicants.length
                                    }
                                />

                                Select all
                            </label>
                        </div>

                        <select
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
                                isSaving ||
                                loadingApplicants ||
                                !formData.vacancy_id ||
                                selectAll
                            }
                            className={`w-full rounded-lg border ${
                                errors.job_applications_id
                                    ? "border-rose-500"
                                    : "border-slate-200"
                            } bg-white px-3 py-2 text-xs outline-none focus:border-blue-500`}
                        >
                            <option value="">
                                {loadingApplicants
                                    ? "Loading applicants..."
                                    : !formData.vacancy_id
                                        ? "-- Select a vacancy first --"
                                        : selectAll
                                            ? `All ${qualifiedApplicants.length} applicants selected`
                                            : qualifiedApplicants.length
                                                ? "-- Choose Applicant --"
                                                : "-- No qualified applicants found --"}
                            </option>

                            {!selectAll &&
                                qualifiedApplicants.map(
                                    (app) => (
                                        <option
                                            key={app.id}
                                            value={app.id}
                                        >
                                            {app.candidate_name ||
                                                app.applicant_name ||
                                                `${app.first_name || ""} ${app.last_name || ""}`.trim() ||
                                                `Application ${app.id}`}
                                        </option>
                                    )
                                )}
                        </select>

                        {formData
                            .job_applications_id
                            .length > 0 && (
                            <p className="text-[11px] text-slate-500">
                                {
                                    formData
                                        .job_applications_id
                                        .length
                                }{" "}
                                applicant(s) selected
                            </p>
                        )}

                        {errors.job_applications_id && (
                            <span className="text-[10px] text-rose-500">
                                {
                                    errors.job_applications_id
                                }
                            </span>
                        )}
                    </div>

                    {/* ==================================================
                        DATE
                    ================================================== */}

                    <div className="flex flex-col gap-1.5">

                        <label className="text-xs font-bold uppercase tracking-wide text-slate-600">
                            Session Schedule Date
                        </label>

                        <input
                            type="date"
                            name="session_date"
                            value={
                                formData.session_date
                            }
                            onChange={handleChange}
                            disabled={isSaving}
                            className={`w-full rounded-lg border ${
                                errors.session_date
                                    ? "border-rose-500"
                                    : "border-slate-200"
                            } bg-white px-3 py-2 text-xs outline-none focus:border-blue-500`}
                        />

                        {errors.session_date && (
                            <span className="text-[10px] text-rose-500">
                                {
                                    errors.session_date
                                }
                            </span>
                        )}
                    </div>

                    {/* ==================================================
                        VENUE
                    ================================================== */}

                    <div className="flex flex-col gap-1.5">

                        <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                            <MapPin className="h-3.5 w-3.5" />

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
                            } bg-white px-3 py-2 text-xs outline-none focus:border-blue-500`}
                        />

                        {errors.venue && (
                            <span className="text-[10px] text-rose-500">
                                {errors.venue}
                            </span>
                        )}
                    </div>

                    {/* ==================================================
                        HRMPSB PANEL MEMBERS
                    ================================================== */}

                    <div className="flex flex-col gap-1.5">

                        <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                            <Users className="h-3.5 w-3.5" />

                            HRMPSB Panel Members
                        </label>

                        <select
                            value={
                                selectedPanelistId
                            }
                            onChange={addPanelist}
                            disabled={
                                isSaving ||
                                loadingPanelists
                            }
                            className={`w-full rounded-lg border ${
                                errors.panelUserIds
                                    ? "border-rose-500"
                                    : "border-slate-200"
                            } bg-white px-3 py-2 text-xs outline-none focus:border-blue-500`}
                        >
                            <option value="">
                                {loadingPanelists
                                    ? "Loading HRMPSB users..."
                                    : panelists.length
                                        ? "-- Select HRMPSB Panel Member --"
                                        : "-- No HRMPSB users available --"}
                            </option>

                            {panelists
                                .filter(
                                    (user) =>
                                        !formData.panelUserIds.includes(
                                            getUserId(user)
                                        )
                                )
                                .map((user) => (
                                    <option
                                        key={getUserId(
                                            user
                                        )}
                                        value={getUserId(
                                            user
                                        )}
                                    >
                                        {getUserFullName(
                                            user
                                        )}

                                        {user.email
                                            ? ` - ${user.email}`
                                            : ""}
                                    </option>
                                ))}
                        </select>

                        {errors.panelUserIds && (
                            <span className="text-[10px] text-rose-500">
                                {
                                    errors.panelUserIds
                                }
                            </span>
                        )}

                        {/* ============================================
                            ASSIGNED PANEL MEMBERS
                        ============================================ */}

                        {formData.panelUserIds
                            .length > 0 && (
                            <div className="mt-1 rounded-lg border border-slate-200 bg-white p-3">

                                <div className="mb-2 flex items-center justify-between">

                                    <span className="text-xs font-semibold text-slate-700">
                                        Assigned panel members
                                    </span>

                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                        {
                                            formData
                                                .panelUserIds
                                                .length
                                        }{" "}
                                        selected
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-1.5">

                                    {formData.panelUserIds.map(
                                        (userId) => {
                                            const user =
                                                panelists.find(
                                                    (
                                                        item
                                                    ) =>
                                                        getUserId(
                                                            item
                                                        ) ===
                                                        Number(
                                                            userId
                                                        )
                                                );

                                            return (
                                                <span
                                                    key={
                                                        userId
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-800"
                                                >
                                                    {user
                                                        ? getUserFullName(
                                                            user
                                                        )
                                                        : `User ${userId}`}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removePanelist(
                                                                userId
                                                            )
                                                        }
                                                        disabled={
                                                            isSaving
                                                        }
                                                        className="text-slate-400 hover:text-rose-600"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            );
                                        }
                                    )}
                                </div>

                                <p className="mt-2 text-[10px] text-slate-500">
                                    The final assessment
                                    average will use
                                    the members assigned
                                    to this session.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ==================================================
                        REMARKS
                    ================================================== */}

                    <div className="flex flex-col gap-1.5">

                        <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                            <FileText className="h-3.5 w-3.5" />

                            Remarks / Additional Instructions
                        </label>

                        <textarea
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            disabled={isSaving}
                            rows={2}
                            placeholder="Optional notes or instructions..."
                            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* ==================================================
                        BUTTONS
                    ================================================== */}

                    <div className="flex justify-end gap-3 border-t border-slate-200 bg-white pt-3">

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSaving}
                            className="rounded-md px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                isSaving ||
                                loadingPanelists
                            }
                            className="flex items-center gap-2 rounded-md bg-[#1e3a6a] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#112d55] disabled:opacity-50"
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

            {/* ============================================================
                CONFIRMATION MODAL
            ============================================================ */}

            {showConfirmModal && pendingPayload && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl">

                        <div className="flex items-center gap-2 bg-[#212529] px-5 py-3.5 text-white">
                            <Calendar className="h-4 w-4" />

                            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                                Confirm Assessment Session
                            </span>
                        </div>

                        <div className="p-5">

                            <p className="text-sm font-semibold text-slate-800">
                                Are you sure you want to save this assessment session?
                            </p>

                            <p className="mt-1.5 text-xs leading-5 text-slate-500">
                                Please review the session details before confirming.
                            </p>

                            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">

                                <div className="space-y-2 text-xs">

                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">
                                            Vacancy
                                        </span>

                                        <span className="text-right font-semibold text-slate-800">
                                            {vacancies.find(
                                                (vacancy) =>
                                                    String(
                                                        vacancy.vacancy_id
                                                    ) ===
                                                    String(
                                                        pendingPayload.vacancy_id
                                                    )
                                            )?.position_title ||
                                                vacancies.find(
                                                    (vacancy) =>
                                                        String(
                                                            vacancy.vacancy_id
                                                        ) ===
                                                        String(
                                                            pendingPayload.vacancy_id
                                                        )
                                                )?.position_name ||
                                                pendingPayload.vacancy_id}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">
                                            Applicants
                                        </span>

                                        <span className="font-semibold text-slate-800">
                                            {
                                                pendingPayload
                                                    .job_applications_id
                                                    .length
                                            }
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">
                                            Session Date
                                        </span>

                                        <span className="font-semibold text-slate-800">
                                            {
                                                pendingPayload.session_date
                                            }
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">
                                            Venue
                                        </span>

                                        <span className="text-right font-semibold text-slate-800">
                                            {
                                                pendingPayload.venue
                                            }
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">
                                            Panel Members
                                        </span>

                                        <span className="font-semibold text-slate-800">
                                            {
                                                pendingPayload
                                                    .panelUserIds
                                                    .length
                                            }
                                        </span>
                                    </div>

                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">

                            <button
                                type="button"
                                onClick={
                                    handleCancelConfirmation
                                }
                                disabled={isSaving}
                                className="rounded-md px-4 py-2 text-xs font-bold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleConfirmSubmit
                                }
                                disabled={isSaving}
                                className="flex items-center gap-2 rounded-md bg-[#1e3a6a] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#112d55] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Confirm
                                    </>
                                )}
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}