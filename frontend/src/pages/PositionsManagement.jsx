import { useEffect, useState } from "react";
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import { getPositions } from "../api/PositionsApi";

const PositionsManagement = () => {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;

    // ==============================
    // FETCH POSITIONS
    // ==============================
    const fetchPositions = async () => {
        try {
            setLoading(true);

            const response = await getPositions();

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

    // ==============================
    // SEARCH
    // ==============================
    const filteredPositions = positions.filter((position) => {
        const value = search.toLowerCase();

        return (
            position.position_title
                ?.toLowerCase()
                .includes(value) ||
            String(position.salary_grade || "")
                .toLowerCase()
                .includes(value) ||
            position.category
                ?.toLowerCase()
                .includes(value) ||
            position.status
                ?.toLowerCase()
                .includes(value)
        );
    });

    // ==============================
    // PAGINATION
    // ==============================
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
    }, [search]);

    // ==============================
    // ACTIONS
    // ==============================
    const handleAdd = () => {
        console.log("Add Position");
    };

    const handleEdit = (position) => {
        console.log("Edit Position:", position);
    };

    const handleDelete = (position) => {
        console.log("Delete Position:", position);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">

            {/* =========================================
                HEADER
            ========================================= */}
            <div className="mb-6 flex items-center justify-between">

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Positions Management
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage non-teaching positions.
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

            {/* =========================================
                SEARCH
            ========================================= */}
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
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                </div>

            </div>

            {/* =========================================
                TABLE
            ========================================= */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full">

                        {/* TABLE HEADER */}
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

                        {/* TABLE BODY */}
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

                                                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                                    {
                                                        position.category
                                                    }
                                                </span>

                                            </td>

                                            {/* STATUS */}
                                            <td className="px-6 py-4">

                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
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
                                                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                                        title="Edit"
                                                    >
                                                        <Pencil
                                                            size={17}
                                                        />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                position
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2
                                                            size={17}
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

                {/* =========================================
                    PAGINATION
                ========================================= */}
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

        </div>
    );
};

export default PositionsManagement;