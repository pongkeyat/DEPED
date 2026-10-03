import { useEffect, useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Users,
} from "lucide-react";

import { getPanelists } from "../api/panelistApi";

const PanelistManagement = () => {
    const [panelists, setPanelists] = useState([]);
    const [loading, setLoading] = useState(true);

    // ==========================================
    // GET PANELISTS
    // ==========================================
    const fetchPanelists = async () => {
        try {
            setLoading(true);

            const response = await getPanelists();

            console.log("Panelists API Response:", response);

            setPanelists(response?.data || []);
        } catch (error) {
            console.error("Error fetching panelists:", error);
            setPanelists([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPanelists();
    }, []);

    // ==========================================
    // ADD
    // ==========================================
    const handleAdd = () => {
        console.log("Add Panelist");
    };

    // ==========================================
    // EDIT
    // ==========================================
    const handleEdit = (panelist) => {
        console.log("Edit Panelist:", panelist);
    };

    // ==========================================
    // DELETE
    // ==========================================
    const handleDelete = (panelist) => {
        console.log("Delete Panelist:", panelist);
    };

    return (
        <div className="min-h-screen p-6 flex flex-col gap-6">

            {/* =========================================
                HEADER
            ========================================= */}
            <div className="relative flex min-h-[88px] flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center">
                {/* Left Accent Bar */}
                <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

                {/* LEFT SIDE: Icon + Title & Description */}
                <div className="flex items-center gap-4 pl-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3E74]">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1E3E74]">
                            Panelist Management
                        </h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Manage panelists for the evaluation process.
                        </p>
                    </div>
                </div>

                {/* RIGHT SIDE: Action Button */}
                <div className="flex flex-wrap items-center gap-3 pl-3 sm:pl-0">
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#1E3E74] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17325e] cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" /> Add Panelist
                    </button>
                </div>
            </div>

            {/* =========================================
                TABLE
            ========================================= */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full">

                        {/* =================================
                            TABLE HEADER
                        ================================. */}
                        <thead className="border-b border-gray-200 bg-gray-50">

                            <tr>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    #
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    First Name
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Middle Name
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Last Name
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Position
                                </th>

                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        {/* =================================
                            TABLE BODY
                        ================================= */}
                        <tbody className="divide-y divide-gray-100">

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-sm text-gray-500"
                                    >
                                        Loading panelists...
                                    </td>

                                </tr>

                            ) : panelists.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-sm text-gray-500"
                                    >
                                        No panelists found.
                                    </td>

                                </tr>

                            ) : (

                                panelists.slice(0, 5).map(
                                    (panelist, index) => (

                                        <tr
                                            key={
                                                panelist.panelist_id ||
                                                index
                                            }
                                            className="transition hover:bg-gray-50"
                                        >

                                            {/* NUMBER */}
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {index + 1}
                                            </td>

                                            {/* FIRST NAME */}
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {panelist.first_name ||
                                                    "—"}
                                            </td>

                                            {/* MIDDLE NAME */}
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {panelist.middle_name ||
                                                    "—"}
                                            </td>

                                            {/* LAST NAME */}
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {panelist.last_name ||
                                                    "—"}
                                            </td>

                                            {/* POSITION */}
                                            <td className="px-6 py-4">

                                                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                                    {panelist.position ||
                                                        "—"}
                                                </span>

                                            </td>

                                            {/* ACTIONS */}
                                            <td className="px-6 py-4">

                                                <div className="flex justify-end gap-2">

                                                    <button
                                                        onClick={() =>
                                                            handleEdit(
                                                                panelist
                                                            )
                                                        }
                                                        title="Edit Panelist"
                                                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                                    >
                                                        <Pencil
                                                            size={17}
                                                        />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                panelist
                                                            )
                                                        }
                                                        title="Delete Panelist"
                                                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
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
                    FOOTER
                ========================================= */}
                <div className="border-t border-gray-200 px-6 py-4">

                    <p className="text-sm text-gray-500">
                        Total Panelists:{" "}
                        <span className="font-semibold text-gray-900">
                            {panelists.length}
                        </span>
                    </p>

                </div>

            </div>

        </div>
    );
};

export default PanelistManagement;