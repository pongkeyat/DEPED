
import { useEffect, useState } from "react";
import {
    Search,
    Plus,
    Pencil,
    X,
    Archive,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
} from "lucide-react";

import {
    getPositions,
    createPosition,
    updatePosition,
    archivePosition,
    restorePosition,
} from "../api/PositionsApi";

const PositionsManagement = () => {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Add/Edit modal
    const [showPositionModal, setShowPositionModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null);

    const [formData, setFormData] = useState({
        position_title: "",
        salary_grade: "",
        category: "",
    });

    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // Archive confirmation
    const [archiveTarget, setArchiveTarget] = useState(null);
    const [archiving, setArchiving] = useState(false);

    // Restore confirmation
    const [restoreTarget, setRestoreTarget] = useState(null);
    const [restoring, setRestoring] = useState(false);

    // Success/error feedback
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");

    const itemsPerPage = 10;

    // =========================================
    // FETCH POSITIONS
    // =========================================
    const fetchPositions = async () => {
        try {
            setLoading(true);

            const response = await getPositions("", 1000, 1);

            console.log("Positions:", response);

            setPositions(response?.data || []);
        } catch (error) {
            console.error("Error fetching positions:", error);
            setPositions([]);
            setActionError(
                error?.response?.data?.message ||
                "Unable to load positions. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPositions();
    }, []);

    // =========================================
    // SEARCH
    // =========================================
    const filteredPositions = positions.filter((position) => {
        const value = search.toLowerCase();

        return (
            position.position_title?.toLowerCase().includes(value) ||
            String(position.salary_grade || "")
                .toLowerCase()
                .includes(value) ||
            position.category?.toLowerCase().includes(value) ||
            position.status?.toLowerCase().includes(value)
        );
    });

    // =========================================
    // PAGINATION
    // =========================================
    const totalPages = Math.ceil(
        filteredPositions.length / itemsPerPage
    );

    const startIndex = (currentPage - 1) * itemsPerPage;

    const displayedPositions = filteredPositions.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // =========================================
    // ADD POSITION
    // =========================================
    const handleAdd = () => {
        setEditingPosition(null);

        setFormData({
            position_title: "",
            salary_grade: "",
            category: "",
        });

        setFormError("");
        setActionError("");
        setShowPositionModal(true);
    };

    // =========================================
    // EDIT POSITION
    // =========================================
    const handleEdit = (position) => {
        if (position.status?.toLowerCase() === "archived") {
            return;
        }

        setEditingPosition(position);

        setFormData({
            position_title: position.position_title || "",
            salary_grade: position.salary_grade ?? "",
            category: position.category || "",
        });

        setFormError("");
        setActionError("");
        setShowPositionModal(true);
    };

    // =========================================
    // FORM INPUT CHANGES
    // =========================================
    const handleFormChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =========================================
    // CREATE / UPDATE POSITION
    // =========================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        setFormError("");
        setActionMessage("");
        setActionError("");

        const title = formData.position_title.trim();
        const salaryGrade = Number(formData.salary_grade);

        if (
            !title ||
            !formData.category ||
            formData.salary_grade === ""
        ) {
            setFormError("Please complete all required fields.");
            return;
        }

        if (!Number.isFinite(salaryGrade) || salaryGrade < 1) {
            setFormError("Enter a valid positive salary grade.");
            return;
        }

        const payload = {
            position_title: title,
            salary_grade: salaryGrade,
            category: formData.category,
        };

        try {
            setSaving(true);

            if (editingPosition) {
                await updatePosition(
                    editingPosition.position_id,
                    payload
                );

                setActionMessage("Position updated successfully.");
            } else {
                await createPosition(payload);

                setActionMessage("Position created successfully.");
            }

            setShowPositionModal(false);
            setEditingPosition(null);

            await fetchPositions();
        } catch (error) {
            console.error("Error saving position:", error);

            setFormError(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Unable to save position. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================
    // OPEN ARCHIVE CONFIRMATION
    // =========================================
    const handleArchiveClick = (position) => {
        if (
            !position ||
            position.status?.toLowerCase() === "archived" ||
            archiving
        ) {
            return;
        }

        setActionMessage("");
        setActionError("");
        setArchiveTarget(position);
    };

    // =========================================
    // CONFIRM ARCHIVE
    // =========================================
    const handleArchive = async () => {
        if (!archiveTarget || archiving) return;

        try {
            setArchiving(true);
            setActionError("");
            setActionMessage("");

            await archivePosition(archiveTarget.position_id);

            setActionMessage(
                `${archiveTarget.position_title} was archived successfully.`
            );

            setArchiveTarget(null);

            await fetchPositions();
        } catch (error) {
            console.error("Error archiving position:", error);

            setActionError(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Unable to archive position. Please try again."
            );
        } finally {
            setArchiving(false);
        }
    };

    // =========================================
    // OPEN RESTORE CONFIRMATION
    // =========================================
    const handleRestore = (position) => {
        if (
            !position ||
            position.status?.toLowerCase() !== "archived" ||
            restoring
        ) {
            return;
        }

        setActionMessage("");
        setActionError("");
        setRestoreTarget(position);
    };

    // =========================================
    // CONFIRM RESTORE
    // =========================================
    const handleConfirmRestore = async () => {
        if (!restoreTarget || restoring) return;

        try {
            setRestoring(true);
            setActionError("");
            setActionMessage("");

            await restorePosition(restoreTarget.position_id);

            setActionMessage(
                `${restoreTarget.position_title} was restored successfully.`
            );

            setRestoreTarget(null);

            await fetchPositions();
        } catch (error) {
            console.error("Error restoring position:", error);

            setActionError(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Unable to restore position. Please try again."
            );
        } finally {
            setRestoring(false);
        }
    };

    // =========================================
    // RENDER
    // =========================================
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Positions Management
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage non-teaching positions.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleAdd}
                    className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                    <Plus size={18} />
                    Add Position
                </button>
            </div>

            {/* SEARCH */}
            <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="relative max-w-md">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="text"
                        placeholder="Search position..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>

            {/* POSITIONS TABLE */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    #
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Position Title
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Salary Grade
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Category
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>

                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-sm text-gray-500"
                                    >
                                        Loading positions...
                                    </td>
                                </tr>
                            ) : displayedPositions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-sm text-gray-500"
                                    >
                                        No positions found.
                                    </td>
                                </tr>
                            ) : (
                                displayedPositions.map((position, index) => {
                                    const isArchived =
                                        position.status?.toLowerCase() ===
                                        "archived";

                                    return (
                                        <tr
                                            key={
                                                position.position_id || index
                                            }
                                            className="transition hover:bg-gray-50"
                                        >
                                            {/* NUMBER */}
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {startIndex + index + 1}
                                            </td>

                                            {/* POSITION TITLE */}
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">
                                                    {position.position_title}
                                                </p>
                                            </td>

                                            {/* SALARY GRADE */}
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {position.salary_grade
                                                    ? `SG ${position.salary_grade}`
                                                    : "—"}
                                            </td>

                                            {/* CATEGORY */}
                                            <td className="px-6 py-4">
                                                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                                    {position.category || "—"}
                                                </span>
                                            </td>

                                            {/* STATUS */}
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                                        isArchived
                                                            ? "bg-gray-100 text-gray-600"
                                                            : position.status?.toLowerCase() ===
                                                                "active"
                                                              ? "bg-green-100 text-green-700"
                                                              : "bg-amber-100 text-amber-700"
                                                    }`}
                                                >
                                                    {position.status || "—"}
                                                </span>
                                            </td>

                                            {/* ACTIONS */}
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {isArchived ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRestore(
                                                                    position
                                                                )
                                                            }
                                                            disabled={restoring}
                                                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                            title="Restore position"
                                                        >
                                                            <RotateCcw
                                                                size={17}
                                                            />
                                                            Restore
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        position
                                                                    )
                                                                }
                                                                className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                                                title="Edit"
                                                            >
                                                                <Pencil
                                                                    size={17}
                                                                />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleArchiveClick(
                                                                        position
                                                                    )
                                                                }
                                                                className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50"
                                                                title="Archive"
                                                            >
                                                                <Archive
                                                                    size={17}
                                                                />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">
                        Showing{" "}
                        <span className="font-medium text-gray-900">
                            {displayedPositions.length}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium text-gray-900">
                            {filteredPositions.length}
                        </span>{" "}
                        positions
                    </p>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.max(prev - 1, 1)
                                )
                            }
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <span className="whitespace-nowrap px-2 text-sm text-gray-600">
                            Page{" "}
                            <span className="font-semibold text-gray-900">
                                {currentPage}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-gray-900">
                                {totalPages || 1}
                            </span>
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(prev + 1, totalPages)
                                )
                            }
                            disabled={
                                currentPage === totalPages ||
                                totalPages === 0
                            }
                            className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* SUCCESS / ERROR FEEDBACK */}
            {(actionMessage || actionError) && (
                <div
                    className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                        actionError
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-green-200 bg-green-50 text-green-700"
                    }`}
                >
                    <div className="flex items-center justify-between gap-3">
                        <span>{actionError || actionMessage}</span>

                        <button
                            type="button"
                            onClick={() => {
                                setActionMessage("");
                                setActionError("");
                            }}
                            className="shrink-0 font-semibold"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* ADD / EDIT POSITION MODAL */}
            {showPositionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {editingPosition
                                        ? "Edit Position"
                                        : "Add Position"}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    {editingPosition
                                        ? "Update the position details below."
                                        : "Enter the details for the new position."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    !saving &&
                                    setShowPositionModal(false)
                                }
                                disabled={saving}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-6"
                        >
                            {formError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Position Title{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    name="position_title"
                                    value={formData.position_title}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Administrative Officer II"
                                    maxLength={255}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Salary Grade{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="number"
                                    name="salary_grade"
                                    value={formData.salary_grade}
                                    onChange={handleFormChange}
                                    min="1"
                                    step="1"
                                    placeholder="Enter salary grade"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Category{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">
                                        Select category
                                    </option>
                                    <option value="Teaching Positions">
                                        Teaching Positions
                                    </option>
                                    <option value="School Administration Positions">
                                        School Administration Positions
                                    </option>
                                    <option value="Related Teaching Positions">
                                        Related Teaching Positions
                                    </option>
                                    <option value="Non-Teaching Positions">
                                        Non-Teaching Positions
                                    </option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        !saving &&
                                        setShowPositionModal(false)
                                    }
                                    disabled={saving}
                                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingPosition
                                          ? "Save Changes"
                                          : "Create Position"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ARCHIVE CONFIRMATION MODAL */}
            {archiveTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                            <Archive size={22} />
                        </div>

                        <h2 className="text-lg font-semibold text-gray-900">
                            Archive Position
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            Are you sure you want to archive{" "}
                            <span className="font-semibold text-gray-900">
                                {archiveTarget.position_title}
                            </span>
                            ? This position will be marked as archived and
                            will remain in the database for historical
                            records.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    !archiving &&
                                    setArchiveTarget(null)
                                }
                                disabled={archiving}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleArchive}
                                disabled={archiving}
                                className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {archiving
                                    ? "Archiving..."
                                    : "Confirm Archive"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESTORE CONFIRMATION MODAL */}
            {restoreTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Confirm Restore
                            </h2>

                            <button
                                type="button"
                                onClick={() =>
                                    !restoring &&
                                    setRestoreTarget(null)
                                }
                                disabled={restoring}
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                                aria-label="Close confirmation"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                                    <RotateCcw size={23} />
                                </div>

                                <div>
                                    <p className="font-medium text-gray-900">
                                        Restore this position?
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        {restoreTarget.position_title}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <AlertCircle
                                    size={18}
                                    className="mt-0.5 shrink-0 text-amber-600"
                                />

                                <p className="text-sm leading-relaxed text-amber-800">
                                    This position will be changed from
                                    Archived to Active and will become
                                    available for normal position management
                                    again.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() =>
                                    !restoring &&
                                    setRestoreTarget(null)
                                }
                                disabled={restoring}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmRestore}
                                disabled={restoring}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <RotateCcw size={16} />
                                {restoring
                                    ? "Restoring..."
                                    : "Confirm Restore"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PositionsManagement;
