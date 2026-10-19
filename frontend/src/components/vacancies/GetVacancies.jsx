import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    Briefcase,
    CheckCircle,
    XCircle,
    Users,
    Archive,
    Pencil,
    X,
    Eye,
    RotateCcw,
} from "lucide-react";
import {
    getVacancies,
    archiveVacancy,
    restoreVacancy,
    updateVacancyStatus,
} from "../../api/VacancyApi";
import EditVacancyModal from "./EditVacancyModal";
const normalizeStatus = (status) =>
    String(status ?? "").trim().toLowerCase();

const isClosedStatus = (status) =>
    ["close", "closed"].includes(normalizeStatus(status));

export default function GetVacancies({ onPostVacancy }) {
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    // Archive modal
    const [selectedVacancy, setSelectedVacancy] = useState(null);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [archiveError, setArchiveError] = useState("");

    // Restore confirmation modal
    const [selectedRestoreVacancy, setSelectedRestoreVacancy] = useState(null);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [restoreError, setRestoreError] = useState("");

    // Termination memo view modal
    const [selectedMemoVacancy, setSelectedMemoVacancy] = useState(null);
    const [showMemoModal, setShowMemoModal] = useState(false);
    // Edit modal
    const [selectedEditVacancy, setSelectedEditVacancy] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    // Search and filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [officeFilter, setOfficeFilter] = useState("");
    const [appliedFilters, setAppliedFilters] = useState({
        status: "",
        office: "",
        search: "",
    });
    // Pagination
    const [entriesPerPage, setEntriesPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    // Refresh trigger
    const [refreshKey, setRefreshKey] = useState(0);
    // =====================================================
    // FETCH VACANCIES
    // =====================================================
    const fetchVacancies = async () => {
        try {
            setLoading(true);
            const response = await getVacancies();
            const data = response?.data || [];
            setVacancies(
                Array.isArray(data)
                    ? data.filter((vacancy) =>
                        ["open", "close", "closed", "assessment", "terminated"].includes(
                            normalizeStatus(vacancy.status)
                        )
                    )
                    : []
            );
        } catch (err) {
            console.error("Failed to load vacancies:", err);
            setVacancies([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchVacancies();
    }, [refreshKey]);
    // =====================================================
    // METRIC CARDS
    // =====================================================
    const totalVacancies = vacancies.length;
    const openVacancies = vacancies.filter(
        (v) => v.status === "Open" || !v.status
    ).length;
    const closedVacancies = vacancies.filter(
        (v) => isClosedStatus(v.status)
    ).length;
    const totalSlots = vacancies.reduce(
        (acc, curr) =>
            acc + (Number(curr.number_of_vacancies) || 0),
        0
    );
    const cards = [
        {
            title: "Total Vacancies",
            value: totalVacancies,
            icon: Briefcase,
            color: "border-t-[#1b4584]",
            bg: "bg-blue-50",
            iconColor: "text-[#1b4584]",
        },
        {
            title: "Open Postings",
            value: openVacancies,
            icon: CheckCircle,
            color: "border-t-green-500",
            bg: "bg-green-50",
            iconColor: "text-green-500",
        },
        {
            title: "Closed Postings",
            value: closedVacancies,
            icon: XCircle,
            color: "border-t-red-500",
            bg: "bg-red-50",
            iconColor: "text-red-500",
        },
        {
            title: "Total Available Slots",
            value: totalSlots,
            icon: Users,
            color: "border-t-purple-500",
            bg: "bg-purple-50",
            iconColor: "text-purple-500",
        },
    ];
    // =====================================================
    // FILTER HANDLERS
    // =====================================================
    const handleApplyFilters = () => {
        setAppliedFilters({
            status: statusFilter,
            office: officeFilter,
            search: searchTerm.trim().toLowerCase(),
        });
        setCurrentPage(1);
    };
    const handleResetFilters = () => {
        setStatusFilter("");
        setOfficeFilter("");
        setSearchTerm("");
        setAppliedFilters({
            status: "",
            office: "",
            search: "",
        });
        setCurrentPage(1);
    };
    // =====================================================
    // FILTER VACANCIES
    // =====================================================
    const filteredVacancies = vacancies.filter((item) => {
        const matchesStatus =
            !appliedFilters.status ||
            (normalizeStatus(item.status) === normalizeStatus(appliedFilters.status) ||
                (isClosedStatus(item.status) && isClosedStatus(appliedFilters.status)));
        const matchesOffice =
            !appliedFilters.office ||
            item.office_unit === appliedFilters.office;
        const positionTitle = (
            item.position_title ||
            item.plantilla_position ||
            ""
        ).toLowerCase();
        const vacancyId = String(
            item.vacancy_id || item.id || ""
        ).toLowerCase();
        const matchesSearch =
            !appliedFilters.search ||
            positionTitle.includes(appliedFilters.search) ||
            vacancyId.includes(appliedFilters.search);
        return (
            matchesStatus &&
            matchesOffice &&
            matchesSearch
        );
    });
    // =====================================================
    // PAGINATION
    // =====================================================
    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredVacancies.length / entriesPerPage
        )
    );
    const startIndex =
        (currentPage - 1) * entriesPerPage;
    const paginatedVacancies =
        filteredVacancies.slice(
            startIndex,
            startIndex + entriesPerPage
        );
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);
    // =====================================================
    // EDIT VACANCY
    // =====================================================
    const handleEditClick = (vacancy) => {
        setSelectedEditVacancy(vacancy);
        setShowEditModal(true);
    };
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setSelectedEditVacancy(null);
    };
    const handleVacancyUpdated = () => {
        // Refresh vacancy list after successful update
        setShowEditModal(false);
        setSelectedEditVacancy(null);
        setRefreshKey((prev) => prev + 1);
    };
    // =====================================================
    // ARCHIVE VACANCY
    // =====================================================
    const handleArchiveClick = (vacancy) => {
        // Only CLOSED vacancies can be archived.
        if (!isClosedStatus(vacancy.status)) {
            setArchiveError("Only closed vacancies can be archived.");
            return;
        }
        setSelectedVacancy(vacancy);
        setArchiveError("");
        setShowArchiveModal(true);
    };
    const handleCloseArchiveModal = () => {
        if (archiving) return;
        setShowArchiveModal(false);
        setSelectedVacancy(null);
        setArchiveError("");
    };
    const handleConfirmArchive = async () => {
        if (!selectedVacancy) return;
        const vacancyId =
            selectedVacancy.vacancy_id ||
            selectedVacancy.id;
        if (!vacancyId) {
            setArchiveError("Vacancy ID is missing.");
            return;
        }
        if (!isClosedStatus(selectedVacancy.status)) {
            setArchiveError("Only closed vacancies can be archived.");
            return;
        }
        try {
            setArchiving(true);
            setArchiveError("");
            await archiveVacancy(vacancyId);
            setShowArchiveModal(false);
            setSelectedVacancy(null);
            setCurrentPage(1);
            setRefreshKey((prev) => prev + 1);
        } catch (err) {
            console.error("Archive vacancy error:", err);
            setArchiveError(
                err.response?.data?.message ||
                "Failed to archive vacancy. Please try again."
            );
        } finally {
            setArchiving(false);
        }
    };
    // =====================================================
    // RESTORE ARCHIVED VACANCY
    // =====================================================
    const handleRestoreClick = (vacancy) => {
        if (vacancy.is_archived !== true) return;

        setSelectedRestoreVacancy(vacancy);
        setRestoreError("");
        setShowRestoreModal(true);
    };

    const handleCloseRestoreModal = () => {
        if (restoring) return;

        setShowRestoreModal(false);
        setSelectedRestoreVacancy(null);
        setRestoreError("");
    };

    const handleConfirmRestore = async () => {
        if (!selectedRestoreVacancy) return;

        const vacancyId =
            selectedRestoreVacancy.vacancy_id ||
            selectedRestoreVacancy.id;

        if (!vacancyId) {
            setRestoreError("Vacancy ID is missing.");
            return;
        }

        if (selectedRestoreVacancy.is_archived !== true) {
            setRestoreError("Only archived vacancies can be restored.");
            return;
        }

        try {
            setRestoring(true);
            setRestoreError("");

            await restoreVacancy(vacancyId);

            setShowRestoreModal(false);
            setSelectedRestoreVacancy(null);
            setCurrentPage(1);
            setRefreshKey((prev) => prev + 1);
        } catch (err) {
            console.error("Restore vacancy error:", err);
            setRestoreError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to restore vacancy. Please try again."
            );
        } finally {
            setRestoring(false);
        }
    };

    // =====================================================
    // =====================================================
    // TERMINATE VACANCY -> TERMINATED
    // =====================================================
    const [terminatingVacancyId, setTerminatingVacancyId] = useState(null);
    const [terminationReason, setTerminationReason] = useState("");
    const [terminating, setTerminating] = useState(false);
    const [terminationError, setTerminationError] = useState("");
    const handleTerminateClick = (vacancy) => {
        const id = vacancy.vacancy_id || vacancy.id;
        if (!id) return;
        if (String(terminatingVacancyId) === String(id)) {
            setTerminatingVacancyId(null);
        } else {
            setTerminatingVacancyId(id);
        }
        setTerminationReason("");
        setTerminationError("");
    };
    const handleSubmitTermination = async (vacancy) => {
        const id = vacancy.vacancy_id || vacancy.id;
        const reason = terminationReason.trim();
        if (!id) {
            setTerminationError("Vacancy ID is missing.");
            return;
        }
        if (!reason) {
            setTerminationError("Please enter a reason.");
            return;
        }
        try {
            setTerminating(true);
            setTerminationError("");
            // Send both the new status and required termination memo.
            await updateVacancyStatus(id, {
                status: "Terminated",
                memo: reason,
            });
            setTerminatingVacancyId(null);
            setTerminationReason("");
            setCurrentPage(1);
            setRefreshKey((previous) => previous + 1);
        } catch (error) {
            setTerminationError(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to terminate vacancy. Please try again."
            );
        } finally {
            setTerminating(false);
        }
    };
    // LOADING SCREEN
    // =====================================================
    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <p className="animate-pulse font-medium text-gray-500">
                    Loading vacancy data...
                </p>
            </div>
        );
    }
    // =====================================================
    // MAIN COMPONENT
    // =====================================================
    return (
        <div className="mx-auto min-h-screen w-full max-w-7xl space-y-6  py-6">
            {/* METRIC CARDS */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.title}
                            className={`cursor-pointer rounded-xl border-t-4 ${card.color} bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`${card.bg} rounded-xl p-3`}>
                                    <Icon
                                        size={24}
                                        className={card.iconColor}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-bold text-gray-800">
                                        {card.value}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {card.title}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* FILTERS */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="Open">Open</option>
                            <option value="Close">Close</option>
                            <option value="Assessment">Assessment</option>
                            <option value="Terminated">Terminated</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Office / Unit
                        </label>
                        <select
                            value={officeFilter}
                            onChange={(e) =>
                                setOfficeFilter(e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500"
                        >
                            <option value="">All Offices</option>
                            {[...new Set(
                                vacancies
                                    .map((v) => v.office_unit)
                                    .filter(Boolean)
                            )]
                                .sort()
                                .map((office) => (
                                    <option
                                        key={office}
                                        value={office}
                                    >
                                        {office}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="flex items-end gap-3 lg:col-span-2 lg:justify-end">
                        <button
                            type="button"
                            onClick={handleApplyFilters}
                            className="flex items-center justify-center gap-2 rounded-lg bg-[#1b4584] px-8 py-3 text-white transition hover:bg-[#17386d]"
                        >
                            <Filter size={18} />
                            Filter
                        </button>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="rounded-lg border border-gray-300 px-5 py-3 text-gray-600 transition hover:bg-gray-50"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>
            {/* VACANCY TABLE */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="bg-[#1b4584] px-6 py-4">
                    <h2 className="font-semibold text-white">
                        Vacancy Postings
                    </h2>
                </div>
                {/* SEARCH AND ENTRIES */}
                <div className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                            Show
                        </span>
                        <select
                            value={entriesPerPage}
                            onChange={(e) => {
                                setEntriesPerPage(
                                    Number(e.target.value)
                                );
                                setCurrentPage(1);
                            }}
                            className="rounded border bg-white px-3 py-2"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-gray-500">
                            entries
                        </span>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search
                            size={18}
                            className="absolute left-3 top-3 text-gray-400"
                        />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleApplyFilters();
                                }
                            }}
                            placeholder="Search position titles..."
                            className="w-full rounded-full border py-2 pl-10 pr-4 outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
                {/* TABLE CONTENT */}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 text-sm uppercase text-gray-600">
                            <tr>
                                <th className="px-6 py-4 text-left">#</th>
                                <th className="px-6 py-4 text-left">Vacancy ID</th>
                                <th className="px-6 py-4 text-left">Position Title</th>
                                <th className="px-6 py-4 text-left">Office / Unit</th>
                                <th className="px-6 py-4 text-left">Posting Date</th>
                                <th className="px-6 py-4 text-left">Deadline</th>
                                <th className="px-6 py-4 text-center">Slots</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {paginatedVacancies.length > 0 ? (
                                paginatedVacancies.map((item, index) => {
                                    const vacancyId =
                                        item.vacancy_id || item.id;
                                    return (
                                        <tr
                                            key={vacancyId || index}
                                            className="transition-colors hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-400">
                                                {startIndex + index + 1}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                {vacancyId || "N/A"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">
                                                    {item.position_title ||
                                                        item.plantilla_position ||
                                                        "N/A"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    SG-{item.salary_grade || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {item.office_unit || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {item.application_posted
                                                    ? new Date(
                                                        item.application_posted
                                                    ).toLocaleDateString()
                                                    : "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {item.application_deadline
                                                    ? new Date(
                                                        item.application_deadline
                                                    ).toLocaleDateString()
                                                    : "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-700">
                                                {item.number_of_vacancies ?? 0}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                        normalizeStatus(item.status) === "open"
                                                            ? "bg-green-100 text-green-700"
                                                            : isClosedStatus(item.status)
                                                              ? "bg-amber-100 text-amber-800"
                                                              : normalizeStatus(item.status) === "assessment"
                                                                ? "bg-purple-100 text-purple-700"
                                                                : normalizeStatus(item.status) === "terminated"
                                                                  ? "bg-gray-200 text-gray-800"
                                                                  : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {item.status || "Open"}
                                                </span>
                                            </td>
                                            {/* ACTIONS: RESTORE ONLY FOR ARCHIVED VACANCIES */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {item.is_archived === true ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRestoreClick(item)}
                                                            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                                                            title="Restore archived vacancy"
                                                        >
                                                            <RotateCcw size={15} />
                                                            Restore
                                                        </button>
                                                    ) : (
                                                        <>
                                                            {normalizeStatus(item.status) === "open" && (
                                                                <button
                                                                    type="button"
                                                                    disabled
                                                                    className="inline-flex cursor-not-allowed items-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500"
                                                                    title="This vacancy is still accepting applications"
                                                                >
                                                                    <Briefcase size={15} />
                                                                    On Application Process
                                                                </button>
                                                            )}

                                                            {isClosedStatus(item.status) && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleEditClick(item)}
                                                                        className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                                                        title="Extend application deadline"
                                                                    >
                                                                        <Pencil size={15} />
                                                                        Extend
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleTerminateClick(item)}
                                                                        className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                                                                        title="Terminate closed vacancy"
                                                                    >
                                                                        <XCircle size={15} />
                                                                        Terminate
                                                                    </button>
                                                                </>
                                                            )}

                                                            {normalizeStatus(item.status) === "assessment" && (
                                                                <button
                                                                    type="button"
                                                                    disabled
                                                                    className="inline-flex cursor-not-allowed items-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500"
                                                                    title="This vacancy is being assessed"
                                                                >
                                                                    <Briefcase size={15} />
                                                                    On Process
                                                                </button>
                                                            )}

                                                            {normalizeStatus(item.status) === "terminated" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedMemoVacancy(item);
                                                                        setShowMemoModal(true);
                                                                    }}
                                                                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                                                    title="View termination memo"
                                                                >
                                                                    <Eye size={15} />
                                                                    View Memo
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-6 py-12 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Briefcase
                                                size={40}
                                                className="text-gray-300"
                                            />
                                            <p className="font-medium text-gray-500">
                                                No vacancies found.
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                Try changing your search or filters.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* PAGINATION */}
                <div className="flex flex-col items-center justify-between gap-4 border-t p-5 sm:flex-row">
                    <p className="text-sm text-gray-500">
                        Showing{" "}
                        {filteredVacancies.length === 0
                            ? 0
                            : startIndex + 1}
                        {" "}to{" "}
                        {Math.min(
                            startIndex + entriesPerPage,
                            filteredVacancies.length
                        )}
                        {" "}of{" "}
                        {filteredVacancies.length} entries
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.max(1, prev - 1)
                                )
                            }
                            className="rounded-lg border px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <span className="rounded-lg bg-[#1b4584] px-4 py-2 text-sm font-semibold text-white">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={currentPage >= totalPages}
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(totalPages, prev + 1)
                                )
                            }
                            className="rounded-lg border px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
            {/* ============================================= */}
            {/* EDIT VACANCY MODAL */}
            {/* ============================================= */}
            {showEditModal && selectedEditVacancy && (
                <EditVacancyModal
                    isOpen={showEditModal}
                    vacancy={selectedEditVacancy}
                    onClose={handleCloseEditModal}
                    onUpdated={handleVacancyUpdated}
                />
            )}
            {/* ============================================= */}
            {/* ARCHIVE CONFIRMATION MODAL */}
            {/* ============================================= */}
            {showArchiveModal && selectedVacancy && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={handleCloseArchiveModal}
                >
                    <div
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-5 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                    <Archive
                                        size={24}
                                        className="text-red-600"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Archive Vacancy
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Confirm your action
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseArchiveModal}
                                disabled={archiving}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="mb-4 text-sm leading-6 text-gray-600">
                            Are you sure you want to archive this vacancy?
                        </p>
                        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Vacancy ID
                            </p>
                            <p className="mb-3 font-mono text-sm font-semibold text-gray-800">
                                {selectedVacancy.vacancy_id ||
                                    selectedVacancy.id ||
                                    "N/A"}
                            </p>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Position
                            </p>
                            <p className="font-semibold text-gray-900">
                                {selectedVacancy.position_title ||
                                    selectedVacancy.plantilla_position ||
                                    "N/A"}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                {selectedVacancy.office_unit ||
                                    "No office specified"}
                            </p>
                        </div>
                        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-800">
                            Archiving will remove this vacancy from the active
                            vacancy listings. Its records should remain in the
                            database for historical reference.
                        </div>
                        {archiveError && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {archiveError}
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCloseArchiveModal}
                                disabled={archiving}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmArchive}
                                disabled={archiving}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Archive size={16} />
                                {archiving
                                    ? "Archiving..."
                                    : "Yes, Archive"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ============================================= */}
            {/* RESTORE CONFIRMATION MODAL */}
            {/* ============================================= */}
            {showRestoreModal && selectedRestoreVacancy && (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
                    onClick={handleCloseRestoreModal}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="restore-vacancy-title"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-5 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                    <RotateCcw size={24} className="text-green-700" />
                                </div>
                                <div>
                                    <h2 id="restore-vacancy-title" className="text-lg font-bold text-gray-900">
                                        Restore Vacancy
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Confirm before restoring.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseRestoreModal}
                                disabled={restoring}
                                aria-label="Close restore modal"
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="mb-4 text-sm leading-6 text-gray-600">
                            Are you sure you want to restore this archived vacancy?
                        </p>

                        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Vacancy ID
                            </p>
                            <p className="mb-3 font-mono text-sm font-semibold text-gray-800">
                                {selectedRestoreVacancy.vacancy_id || selectedRestoreVacancy.id || "N/A"}
                            </p>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Position
                            </p>
                            <p className="font-semibold text-gray-900">
                                {selectedRestoreVacancy.position_title || selectedRestoreVacancy.plantilla_position || "N/A"}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                {selectedRestoreVacancy.office_unit || "No office specified"}
                            </p>
                        </div>

                        <p className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                            The vacancy will return to the active vacancy listings while keeping its existing status.
                        </p>

                        {restoreError && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {restoreError}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCloseRestoreModal}
                                disabled={restoring}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmRestore}
                                disabled={restoring}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <RotateCcw size={16} />
                                {restoring ? "Restoring..." : "Confirm Restore"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================= */}
            {/* TERMINATION MEMO MODAL */}
            {/* ============================================= */}
            {terminatingVacancyId !== null && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
                    onClick={() => {
                        if (terminating) return;
                        setTerminatingVacancyId(null);
                        setTerminationReason("");
                        setTerminationError("");
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="termination-memo-title"
                        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                                    <XCircle size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <h2 id="termination-memo-title" className="text-lg font-bold text-gray-900">
                                        Termination Memo
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Provide the memo explaining why this vacancy is being terminated.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label="Close termination memo"
                                disabled={terminating}
                                onClick={() => {
                                    setTerminatingVacancyId(null);
                                    setTerminationReason("");
                                    setTerminationError("");
                                }}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Vacancy ID
                            </p>
                            <p className="mt-1 font-mono text-sm font-semibold text-gray-800">
                                {vacancies.find((vacancy) => String(vacancy.vacancy_id || vacancy.id) === String(terminatingVacancyId))?.vacancy_id || terminatingVacancyId}
                            </p>
                            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                                Position
                            </p>
                            <p className="mt-1 font-semibold text-gray-900">
                                {vacancies.find((vacancy) => String(vacancy.vacancy_id || vacancy.id) === String(terminatingVacancyId))?.position_title ||
                                    vacancies.find((vacancy) => String(vacancy.vacancy_id || vacancy.id) === String(terminatingVacancyId))?.plantilla_position ||
                                    "N/A"}
                            </p>
                        </div>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                const vacancy = vacancies.find(
                                    (item) => String(item.vacancy_id || item.id) === String(terminatingVacancyId)
                                );
                                if (vacancy) handleSubmitTermination(vacancy);
                            }}
                        >
                            <label htmlFor="termination-reason" className="mb-2 block text-sm font-semibold text-gray-700">
                                Memo / Reason for Termination <span className="text-red-600">*</span>
                            </label>
                            <textarea
                                id="termination-reason"
                                value={terminationReason}
                                onChange={(event) => {
                                    setTerminationReason(event.target.value);
                                    setTerminationError("");
                                }}
                                required
                                maxLength={500}
                                disabled={terminating}
                                rows={4}
                                placeholder="Enter the memo or reason for termination..."
                                className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                            />
                            <p className="mt-1 text-right text-xs text-gray-400">
                                {terminationReason.length}/500 characters
                            </p>
                            {terminationError && (
                                <p className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {terminationError}
                                </p>
                            )}
                            <p className="mt-3 text-xs leading-5 text-gray-500">
                                Submitting this memo will set the vacancy status to Terminated, save the memo, and stop new applications. Existing applicants can continue through recruitment.
                            </p>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={terminating}
                                    onClick={() => {
                                        setTerminatingVacancyId(null);
                                        setTerminationReason("");
                                        setTerminationError("");
                                    }}
                                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={terminating || !terminationReason.trim()}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <XCircle size={16} />
                                    {terminating ? "Submitting..." : "Submit Memo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================= */}
            {/* VIEW TERMINATION MEMO MODAL */}
            {/* ============================================= */}
            {showMemoModal && selectedMemoVacancy && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
                    onClick={() => {
                        setShowMemoModal(false);
                        setSelectedMemoVacancy(null);
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="view-termination-memo-title"
                        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                                    <Eye size={24} className="text-gray-700" />
                                </div>
                                <div>
                                    <h2
                                        id="view-termination-memo-title"
                                        className="text-lg font-bold text-gray-900"
                                    >
                                        Termination Memo
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {selectedMemoVacancy.position_title ||
                                            selectedMemoVacancy.plantilla_position ||
                                            "Vacancy"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label="Close memo"
                                onClick={() => {
                                    setShowMemoModal(false);
                                    setSelectedMemoVacancy(null);
                                }}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Vacancy ID
                            </p>
                            <p className="mt-1 font-mono text-sm font-semibold text-gray-800">
                                {selectedMemoVacancy.vacancy_id ||
                                    selectedMemoVacancy.id ||
                                    "N/A"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Memo / Reason for Termination
                            </p>
                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                                {selectedMemoVacancy.memo ||
                                    selectedMemoVacancy.termination_memo ||
                                    selectedMemoVacancy.latest_memo ||
                                    "No memo was returned for this vacancy. Make sure the getVacancies API includes the latest memo from vacancies_remarks."}
                            </p>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowMemoModal(false);
                                    setSelectedMemoVacancy(null);
                                }}
                                className="rounded-lg bg-[#1b4584] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17386d]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
