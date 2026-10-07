import { useEffect, useState } from "react";
import {
    Search,
    Plus,
    Pencil,
    Archive,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import {
    getPositions,
    createPosition,
    updatePosition,
    archivePosition,
} from "../api/PositionsApi";

import PositionFormModal from "../components/positions/PositionFormModal";
import ConfirmCreatePositionModal from "../components/positions/ConfirmCreatePositionModal";
import ConfirmEditPositionModal from "../components/positions/ConfirmEditPositionModal";
import ConfirmArchivePositionModal from "../components/positions/ConfirmArchivePositionModal";

const PositionsManagement = () => {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [salaryGradeFilter, setSalaryGradeFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [showPositionModal, setShowPositionModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null);

    const [showConfirmCreate, setShowConfirmCreate] = useState(false);
    const [pendingPositionPayload, setPendingPositionPayload] = useState(null);

    const [showConfirmEdit, setShowConfirmEdit] = useState(false);
    const [pendingEditPayload, setPendingEditPayload] = useState(null);

    const [formData, setFormData] = useState({
        position_title: "",
        salary_grade: "",
        category: "",
        education: "",
        training: "",
        experience: "",
        eligibility: "",
    });

    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [archiveTarget, setArchiveTarget] = useState(null);
    const [archiving, setArchiving] = useState(false);

    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");

    const itemsPerPage = 10;

    // ======================================================
    // FETCH POSITIONS
    // ======================================================

    const fetchPositions = async () => {
        try {
            setLoading(true);

            const response = await getPositions("", 1000, 1);

            console.log("Positions:", response);

            setPositions(response?.data || []);
        } catch (error) {
            console.error("Error fetching positions:", error);
            setPositions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPositions();
    }, []);

    // ======================================================
    // SEARCH
    // ======================================================

    const filteredPositions = positions.filter((position) => {
        const value = search.toLowerCase();

        const matchesSearch =
            position.position_title?.toLowerCase().includes(value) ||
            String(position.salary_grade || "")
                .toLowerCase()
                .includes(value) ||
            position.category?.toLowerCase().includes(value) ||
            position.status?.toLowerCase().includes(value);

        const matchesSalaryGrade =
            !salaryGradeFilter ||
            String(position.salary_grade ?? "") === salaryGradeFilter;

        const matchesCategory =
            !categoryFilter || position.category === categoryFilter;

        return matchesSearch && matchesSalaryGrade && matchesCategory;
    });

    // ======================================================
    // PAGINATION
    // ======================================================

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
    }, [search, salaryGradeFilter, categoryFilter]);

    // ======================================================
    // ADD POSITION
    // ======================================================

    const handleAdd = () => {
        setEditingPosition(null);

        setFormData({
            position_title: "",
            salary_grade: "",
            category: "",
            education: "",
            training: "",
            experience: "",
            eligibility: "",
        });

        setFormError("");
        setActionMessage("");
        setActionError("");

        setShowPositionModal(true);
    };

    // ======================================================
    // EDIT POSITION
    // ======================================================

    const handleEdit = (position) => {
        if (position.status?.toLowerCase() === "archived") {
            return;
        }

        setEditingPosition(position);

        setFormData({
            position_title: position.position_title || "",
            salary_grade: position.salary_grade ?? "",
            category: position.category || "",
            education: position.education || "",
            training: position.training || "",
            experience: position.experience || "",
            eligibility: position.eligibility || "",
        });

        setFormError("");
        setActionMessage("");
        setActionError("");

        setShowPositionModal(true);
    };

    // ======================================================
    // FORM CHANGE
    // ======================================================

    const handleFormChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ======================================================
    // SUBMIT POSITION
    // ======================================================

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

        if (!formData.education.trim()) {
            setFormError("Education qualification is required.");
            return;
        }

        if (!formData.training.trim()) {
            setFormError("Training qualification is required.");
            return;
        }

        if (!formData.experience.trim()) {
            setFormError("Experience qualification is required.");
            return;
        }

        if (!formData.eligibility.trim()) {
            setFormError("Eligibility qualification is required.");
            return;
        }

        const payload = {
            position_title: title,
            salary_grade: salaryGrade,
            category: formData.category,
            education: formData.education.trim(),
            training: formData.training.trim(),
            experience: formData.experience.trim(),
            eligibility: formData.eligibility.trim(),
        };

        // ==================================================
        // CREATE
        // ==================================================

        if (!editingPosition) {
            setPendingPositionPayload(payload);
            setShowConfirmCreate(true);
            return;
        }

        // ==================================================
        // EDIT
        // Show confirmation before updating
        // ==================================================

        setPendingEditPayload({
            ...payload,
            position_id: editingPosition.position_id,
        });

        setShowConfirmEdit(true);
    };

    // ======================================================
    // CONFIRM CREATE
    // ======================================================

    const handleConfirmCreate = async () => {
        if (!pendingPositionPayload) return;

        try {
            setSaving(true);
            setFormError("");
            setActionError("");

            await createPosition(pendingPositionPayload);

            setActionMessage("Position created successfully.");

            setShowConfirmCreate(false);
            setPendingPositionPayload(null);
            setShowPositionModal(false);
            setEditingPosition(null);

            setFormData({
                position_title: "",
                salary_grade: "",
                category: "",
                education: "",
                training: "",
                experience: "",
                eligibility: "",
            });

            await fetchPositions();
        } catch (error) {
            console.error("Error creating position:", error);

            setFormError(
                error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    "Unable to create position. Please try again."
            );

            setShowConfirmCreate(false);
            setPendingPositionPayload(null);
        } finally {
            setSaving(false);
        }
    };

    // ======================================================
    // CONFIRM EDIT
    // ======================================================

    const handleConfirmEdit = async () => {
        if (!pendingEditPayload) return;

        try {
            setSaving(true);
            setFormError("");
            setActionError("");
            setActionMessage("");

            const {
                position_id,
                ...payload
            } = pendingEditPayload;

            await updatePosition(position_id, payload);

            setActionMessage("Position updated successfully.");

            setShowConfirmEdit(false);
            setPendingEditPayload(null);

            setShowPositionModal(false);
            setEditingPosition(null);

            setFormData({
                position_title: "",
                salary_grade: "",
                category: "",
                education: "",
                training: "",
                experience: "",
                eligibility: "",
            });

            await fetchPositions();
        } catch (error) {
            console.error("Error updating position:", error);

            setFormError(
                error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    "Unable to update position. Please try again."
            );

            setShowConfirmEdit(false);
            setPendingEditPayload(null);
        } finally {
            setSaving(false);
        }
    };

    // ======================================================
    // ARCHIVE POSITION
    // ======================================================

    const handleArchive = async () => {
        if (!archiveTarget) return;

        try {
            setArchiving(true);
            setActionError("");
            setActionMessage("");

            await archivePosition(
                archiveTarget.position_id
            );

            setActionMessage(
                `${archiveTarget.position_title} was archived successfully.`
            );

            setArchiveTarget(null);

            await fetchPositions();
        } catch (error) {
            console.error(
                "Error archiving position:",
                error
            );

            setActionError(
                error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    "Unable to archive position. Please try again."
            );

            setArchiveTarget(null);
        } finally {
            setArchiving(false);
        }
    };

    // ======================================================
    // RENDER
    // ======================================================

    return (
        <div className="min-h-screen p-6">
            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="relative mb-6 flex min-h-[88px] items-center justify-between gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Positions Management
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage positions and their qualification requirements.
                    </p>
                </div>

                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                    <Plus size={18} />
                    Add Position
                </button>
            </div>

            {/* ==================================================
                SEARCH
            ================================================== */}

            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            placeholder="Search position..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <select
                        value={salaryGradeFilter}
                        onChange={(e) =>
                            setSalaryGradeFilter(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        aria-label="Filter by salary grade"
                    >
                        <option value="">
                            All Salary Grades
                        </option>

                        {[
                            ...new Set(
                                positions
                                    .map(
                                        (position) =>
                                            position.salary_grade
                                    )
                                    .filter(
                                        (grade) =>
                                            grade !== null &&
                                            grade !== undefined &&
                                            grade !== ""
                                    )
                            ),
                        ]
                            .sort(
                                (a, b) =>
                                    Number(a) - Number(b)
                            )
                            .map((grade) => (
                                <option
                                    key={grade}
                                    value={String(grade)}
                                >
                                    SG {grade}
                                </option>
                            ))}
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) =>
                            setCategoryFilter(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        aria-label="Filter by category"
                    >
                        <option value="">
                            All Categories
                        </option>

                        {[
                            ...new Set(
                                positions
                                    .map(
                                        (position) =>
                                            position.category
                                    )
                                    .filter(Boolean)
                            ),
                        ]
                            .sort((a, b) =>
                                a.localeCompare(b)
                            )
                            .map((category) => (
                                <option
                                    key={category}
                                    value={category}
                                >
                                    {category}
                                </option>
                            ))}
                    </select>
                </div>
            </div>

            {/* ==================================================
                TABLE
            ================================================== */}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1b4584]">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-white">
                                    #
                                </th>

                                <th className="px-6 py-4 text-left font-semibold text-white">
                                    Position Title
                                </th>

                                <th className="px-6 py-4 text-left font-semibold text-white">
                                    SalaryGrade
                                </th>

                                <th className="px-6 py-4 text-left font-semibold text-white">
                                    Category
                                </th>

                                <th className="px-6 py-4 text-left font-semibold text-white">
                                    Education
                                </th>

                                <th className="px-6 py-4 text-left font-semibold text-white">
                                    Training
                                </th>

                                <th className="px-6 py-4 text-left font-semibold text-white">
                                    Experience
                                </th>

                                <th className="px-6 py-4 text-left font-semibold text-white">
                                    Eligibility
                                </th>

                                <th className="px-6 py-4 text-left font-semibold text-white">
                                    Status
                                </th>

                                <th className="px-6 py-4 text-right font-semibold text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="10"
                                        className="px-6 py-12 text-center text-sm text-gray-500"
                                    >
                                        Loading positions...
                                    </td>
                                </tr>
                            ) : displayedPositions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="10"
                                        className="px-6 py-12 text-center text-sm text-gray-500"
                                    >
                                        No positions found.
                                    </td>
                                </tr>
                            ) : (
                                displayedPositions.map(
                                    (position, index) => (
                                        <tr
                                            key={
                                                position.position_id ||
                                                index
                                            }
                                            className="transition hover:bg-gray-50"
                                        >
                                            {/* NUMBER */}
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {startIndex +
                                                    index +
                                                    1}
                                            </td>

                                            {/* POSITION */}
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">
                                                    {
                                                        position.position_title
                                                    }
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
                                                <span className="inline-flex whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                                    {
                                                        position.category
                                                    }
                                                </span>
                                            </td>

                                            {/* EDUCATION */}
                                            <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                                                <div
                                                    className="line-clamp-3"
                                                    title={
                                                        position.education ||
                                                        ""
                                                    }
                                                >
                                                    {position.education ||
                                                        "—"}
                                                </div>
                                            </td>

                                            {/* TRAINING */}
                                            <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                                                <div
                                                    className="line-clamp-3"
                                                    title={
                                                        position.training ||
                                                        ""
                                                    }
                                                >
                                                    {position.training ||
                                                        "—"}
                                                </div>
                                            </td>

                                            {/* EXPERIENCE */}
                                            <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                                                <div
                                                    className="line-clamp-3"
                                                    title={
                                                        position.experience ||
                                                        ""
                                                    }
                                                >
                                                    {position.experience ||
                                                        "—"}
                                                </div>
                                            </td>

                                            {/* ELIGIBILITY */}
                                            <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                                                <div
                                                    className="line-clamp-3"
                                                    title={
                                                        position.eligibility ||
                                                        ""
                                                    }
                                                >
                                                    {position.eligibility ||
                                                        "—"}
                                                </div>
                                            </td>

                                            {/* STATUS */}
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                                                        position.status?.toLowerCase() ===
                                                        "active"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-100 text-gray-600"
                                                    }`}
                                                >
                                                    {
                                                        position.status
                                                    }
                                                </span>
                                            </td>

                                            {/* ACTIONS */}
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(
                                                                position
                                                            )
                                                        }
                                                        disabled={
                                                            position.status?.toLowerCase() ===
                                                            "archived"
                                                        }
                                                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30"
                                                        title="Edit"
                                                    >
                                                        <Pencil
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            setArchiveTarget(
                                                                position
                                                            )
                                                        }
                                                        disabled={
                                                            position.status?.toLowerCase() ===
                                                            "archived"
                                                        }
                                                        className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-30"
                                                        title="Archive"
                                                    >
                                                        <Archive
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ==================================================
                    PAGINATION
                ================================================== */}

                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
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

                    <div className="flex items-center gap-2">
                        <button
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

                        <span className="px-3 text-sm text-gray-600">
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
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(
                                        prev + 1,
                                        totalPages
                                    )
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

            {/* ==================================================
                SUCCESS / ERROR FEEDBACK
            ================================================== */}

            {(actionMessage || actionError) && (
                <div
                    className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                        actionError
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-green-200 bg-green-50 text-green-700"
                    }`}
                >
                    <div className="flex items-center justify-between gap-3">
                        <span>
                            {actionError || actionMessage}
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                setActionMessage("");
                                setActionError("");
                            }}
                            className="font-semibold"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* ==================================================
                POSITION FORM
            ================================================== */}

            <PositionFormModal
                open={showPositionModal}
                editingPosition={editingPosition}
                formData={formData}
                saving={saving}
                formError={formError}
                onChange={handleFormChange}
                onSubmit={handleSubmit}
                onClose={() =>
                    !saving &&
                    setShowPositionModal(false)
                }
            />

            {/* ==================================================
                CREATE CONFIRMATION
            ================================================== */}

            <ConfirmCreatePositionModal
                position={pendingPositionPayload}
                saving={saving}
                onCancel={() => {
                    if (saving) return;

                    setShowConfirmCreate(false);
                    setPendingPositionPayload(null);
                }}
                onConfirm={handleConfirmCreate}
            />

            {/* ==================================================
                EDIT CONFIRMATION
            ================================================== */}

            <ConfirmEditPositionModal
                position={
                    showConfirmEdit
                        ? pendingEditPayload
                        : null
                }
                saving={saving}
                onCancel={() => {
                    if (saving) return;

                    setShowConfirmEdit(false);
                    setPendingEditPayload(null);
                }}
                onConfirm={handleConfirmEdit}
            />

            {/* ==================================================
                ARCHIVE CONFIRMATION
            ================================================== */}

            <ConfirmArchivePositionModal
                position={archiveTarget}
                archiving={archiving}
                onCancel={() =>
                    setArchiveTarget(null)
                }
                onConfirm={handleArchive}
            />
        </div>
    );
};

export default PositionsManagement;