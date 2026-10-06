import { useEffect, useState } from "react";
import {
    Search,
    Plus,
    Pencil,
    X,
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

const PositionsManagement = () => {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [salaryGradeFilter, setSalaryGradeFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [showPositionModal, setShowPositionModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null);

    // ======================================================
    // FORM DATA
    // ======================================================

    const [formData, setFormData] = useState({
        position_title: "",
        salary_grade: "",
        category: "",

        // QUALIFICATIONS
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
            String(position.salary_grade || "").toLowerCase().includes(value) ||
            position.category?.toLowerCase().includes(value) ||
            position.status?.toLowerCase().includes(value);
        const matchesSalaryGrade =
            !salaryGradeFilter || String(position.salary_grade ?? "") === salaryGradeFilter;
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

    const startIndex =
        (currentPage - 1) * itemsPerPage;

    const displayedPositions =
        filteredPositions.slice(
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
        if (
            position.status?.toLowerCase() ===
            "archived"
        ) {
            return;
        }

        setEditingPosition(position);

        setFormData({
            position_title:
                position.position_title || "",

            salary_grade:
                position.salary_grade ?? "",

            category:
                position.category || "",

            // QUALIFICATIONS
            education:
                position.education || "",

            training:
                position.training || "",

            experience:
                position.experience || "",

            eligibility:
                position.eligibility || "",
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
        const {
            name,
            value
        } = e.target;

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

        const title =
            formData.position_title.trim();

        const salaryGrade =
            Number(formData.salary_grade);

        // ==================================================
        // BASIC VALIDATION
        // ==================================================

        if (
            !title ||
            !formData.category ||
            formData.salary_grade === ""
        ) {
            setFormError(
                "Please complete all required fields."
            );
            return;
        }

        if (
            !Number.isFinite(salaryGrade) ||
            salaryGrade < 1
        ) {
            setFormError(
                "Enter a valid positive salary grade."
            );
            return;
        }

        // ==================================================
        // QUALIFICATION VALIDATION
        // ==================================================

        if (!formData.education.trim()) {
            setFormError(
                "Education qualification is required."
            );
            return;
        }

        if (!formData.training.trim()) {
            setFormError(
                "Training qualification is required."
            );
            return;
        }

        if (!formData.experience.trim()) {
            setFormError(
                "Experience qualification is required."
            );
            return;
        }

        if (!formData.eligibility.trim()) {
            setFormError(
                "Eligibility qualification is required."
            );
            return;
        }

        // ==================================================
        // PAYLOAD
        // ==================================================

        const payload = {
            position_title: title,

            salary_grade: salaryGrade,

            category: formData.category,

            // QUALIFICATIONS
            education:
                formData.education.trim(),

            training:
                formData.training.trim(),

            experience:
                formData.experience.trim(),

            eligibility:
                formData.eligibility.trim(),
        };

        console.log(
            "Position payload:",
            payload
        );

        try {
            setSaving(true);

            if (editingPosition) {
                await updatePosition(
                    editingPosition.position_id,
                    payload
                );

                setActionMessage(
                    "Position updated successfully."
                );
            } else {
                await createPosition(payload);

                setActionMessage(
                    "Position created successfully."
                );
            }

            setShowPositionModal(false);
            setEditingPosition(null);

            await fetchPositions();

        } catch (error) {
            console.error(
                "Error saving position:",
                error
            );

            setFormError(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Unable to save position. Please try again."
            );
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
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <select
                        value={salaryGradeFilter}
                        onChange={(e) => setSalaryGradeFilter(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        aria-label="Filter by salary grade"
                    >
                        <option value="">All Salary Grades</option>
                        {[...new Set(positions.map((position) => position.salary_grade).filter((grade) => grade !== null && grade !== undefined && grade !== ""))]
                            .sort((a, b) => Number(a) - Number(b))
                            .map((grade) => (
                                <option key={grade} value={String(grade)}>
                                    SG {grade}
                                </option>
                            ))}
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        aria-label="Filter by category"
                    >
                        <option value="">All Categories</option>
                        {[...new Set(positions.map((position) => position.category).filter(Boolean))]
                            .sort((a, b) => a.localeCompare(b))
                            .map((category) => (
                                <option key={category} value={category}>
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

            <thead className="bg-[#1b4584] px-6 py-4 ">
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
                                        {startIndex + index + 1}
                                    </td>

                                    {/* POSITION */}
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
                                        <span className="inline-flex whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                            {position.category}
                                        </span>
                                    </td>

                                    {/* EDUCATION */}
                                    <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                                        <div
                                            className="line-clamp-3"
                                            title={position.education || ""}
                                        >
                                            {position.education || "—"}
                                        </div>
                                    </td>

                                    {/* TRAINING */}
                                    <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                                        <div
                                            className="line-clamp-3"
                                            title={position.training || ""}
                                        >
                                            {position.training || "—"}
                                        </div>
                                    </td>

                                    {/* EXPERIENCE */}
                                    <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                                        <div
                                            className="line-clamp-3"
                                            title={position.experience || ""}
                                        >
                                            {position.experience || "—"}
                                        </div>
                                    </td>

                                    {/* ELIGIBILITY */}
                                    <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                                        <div
                                            className="line-clamp-3"
                                            title={position.eligibility || ""}
                                        >
                                            {position.eligibility || "—"}
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
                                            {position.status}
                                        </span>

                                    </td>

                                    {/* ACTIONS */}
                                    <td className="px-6 py-4">

                                        <div className="flex justify-end gap-2">

                                            <button
                                                onClick={() =>
                                                    handleEdit(position)
                                                }
                                                disabled={
                                                    position.status?.toLowerCase() ===
                                                    "archived"
                                                }
                                                className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30"
                                                title="Edit"
                                            >
                                                <Pencil size={17} />
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
                                                <Archive size={17} />
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
                                setCurrentPage(
                                    (prev) =>
                                        Math.max(
                                            prev - 1,
                                            1
                                        )
                                )
                            }
                            disabled={
                                currentPage === 1
                            }
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
                                setCurrentPage(
                                    (prev) =>
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
                            {actionError ||
                                actionMessage}
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
                ADD / EDIT MODAL
            ================================================== */}

            {showPositionModal && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">

                        {/* MODAL HEADER */}

                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">

                            <div>

                                <h2 className="text-lg font-semibold text-gray-900">

                                    {editingPosition
                                        ? "Edit Position"
                                        : "Add Position"}

                                </h2>

                                <p className="mt-1 text-sm text-gray-500">

                                    {editingPosition
                                        ? "Update the position details and qualification requirements."
                                        : "Enter the position details and qualification requirements."}

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

                        {/* FORM */}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-6"
                        >

                            {/* FORM ERROR */}

                            {formError && (

                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                                    {formError}

                                </div>

                            )}

                            {/* ==================================================
                                POSITION TITLE
                            ================================================== */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">

                                    Position Title{" "}

                                    <span className="text-red-500">
                                        *
                                    </span>

                                </label>

                                <input
                                    type="text"
                                    name="position_title"
                                    value={
                                        formData.position_title
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    placeholder="e.g. Teacher I"
                                    maxLength={255}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                            </div>

                            {/* ==================================================
                                SALARY GRADE
                            ================================================== */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">

                                    Salary Grade{" "}

                                    <span className="text-red-500">
                                        *
                                    </span>

                                </label>

                                <input
                                    type="number"
                                    name="salary_grade"
                                    value={
                                        formData.salary_grade
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    min="1"
                                    step="1"
                                    placeholder="Enter salary grade"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                            </div>

                            {/* ==================================================
                                CATEGORY
                            ================================================== */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">

                                    Category{" "}

                                    <span className="text-red-500">
                                        *
                                    </span>

                                </label>

                                <select
                                    name="category"
                                    value={
                                        formData.category
                                    }
                                    onChange={
                                        handleFormChange
                                    }
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

                            {/* ==================================================
                                QUALIFICATIONS HEADER
                            ================================================== */}

                            <div className="border-t border-gray-200 pt-5">

                                <div className="mb-4">

                                    <h3 className="text-base font-semibold text-gray-900">
                                        Qualification Requirements
                                    </h3>

                                    <p className="mt-1 text-xs text-gray-500">
                                        Enter the qualification requirements for this position.
                                    </p>

                                </div>

                                {/* ==================================================
                                    EDUCATION
                                ================================================== */}

                                <div className="mb-4">

                                    <label className="mb-2 block text-sm font-medium text-gray-700">

                                        Education{" "}

                                        <span className="text-red-500">
                                            *
                                        </span>

                                    </label>

                                    <textarea
                                        name="education"
                                        value={
                                            formData.education
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="e.g. Bachelor's Degree in Education"
                                        rows={3}
                                        required
                                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                </div>

                                {/* ==================================================
                                    TRAINING
                                ================================================== */}

                                <div className="mb-4">

                                    <label className="mb-2 block text-sm font-medium text-gray-700">

                                        Training{" "}

                                        <span className="text-red-500">
                                            *
                                        </span>

                                    </label>

                                    <textarea
                                        name="training"
                                        value={
                                            formData.training
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="e.g. None required"
                                        rows={2}
                                        required
                                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                </div>

                                {/* ==================================================
                                    EXPERIENCE
                                ================================================== */}

                                <div className="mb-4">

                                    <label className="mb-2 block text-sm font-medium text-gray-700">

                                        Experience{" "}

                                        <span className="text-red-500">
                                            *
                                        </span>

                                    </label>

                                    <textarea
                                        name="experience"
                                        value={
                                            formData.experience
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="e.g. None required"
                                        rows={2}
                                        required
                                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                </div>

                                {/* ==================================================
                                    ELIGIBILITY
                                ================================================== */}

                                <div>

                                    <label className="mb-2 block text-sm font-medium text-gray-700">

                                        Eligibility{" "}

                                        <span className="text-red-500">
                                            *
                                        </span>

                                    </label>

                                    <textarea
                                        name="eligibility"
                                        value={
                                            formData.eligibility
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="e.g. RA 1080 (Teacher)"
                                        rows={2}
                                        required
                                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                </div>

                            </div>

                            {/* ==================================================
                                BUTTONS
                            ================================================== */}

                            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPositionModal(
                                            false
                                        )
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

            {/* ==================================================
                ARCHIVE CONFIRMATION MODAL
            ================================================== */}

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

                                {
                                    archiveTarget.position_title
                                }

                            </span>

                            ? This position will be marked as archived and will remain in the database for historical records.

                        </p>

                        <div className="mt-6 flex justify-end gap-3">

                            <button
                                type="button"
                                onClick={() =>
                                    setArchiveTarget(null)
                                }
                                disabled={archiving}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleArchive
                                }
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

        </div>
    );
};

export default PositionsManagement;