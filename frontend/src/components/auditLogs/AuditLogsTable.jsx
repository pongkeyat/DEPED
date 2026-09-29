
import {
    Eye,
    ClipboardList,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Clock
} from "lucide-react";

const AuditLogsTable = ({
    logs,
    loading,
    pagination,
    onPageChange,
    onViewDetails
}) => {
    const {
        page = 1,
        limit = 20,
        total = 0,
        totalPages = 0
    } = pagination || {};

    const formatDate = (date) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "—";
        }

        return parsedDate.toLocaleString("en-PH", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    const getActionStyle = (action) => {
        const styles = {
            CREATE: "bg-green-50 text-green-700 border-green-200",
            UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
            DELETE: "bg-red-50 text-red-700 border-red-200",
            ARCHIVE: "bg-orange-50 text-orange-700 border-orange-200",
            RESTORE: "bg-purple-50 text-purple-700 border-purple-200",
            LOGIN: "bg-indigo-50 text-indigo-700 border-indigo-200",
            LOGOUT: "bg-gray-100 text-gray-700 border-gray-200",
            BACKUP: "bg-cyan-50 text-cyan-700 border-cyan-200",
            VIEW: "bg-gray-50 text-gray-700 border-gray-200",
            SUBMIT: "bg-teal-50 text-teal-700 border-teal-200"
        };

        return styles[action] ||
            "bg-gray-100 text-gray-700 border-gray-200";
    };

    const getStatusStyle = (status) => {
        if (status === "SUCCESS") {
            return "bg-green-50 text-green-700 border-green-200";
        }

        if (status === "FAILED") {
            return "bg-red-50 text-red-700 border-red-200";
        }

        return "bg-gray-100 text-gray-600 border-gray-200";
    };

    const startRecord = total === 0
        ? 0
        : (page - 1) * limit + 1;

    const endRecord = Math.min(
        page * limit,
        total
    );

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

            {/* TABLE HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">

                <div className="flex items-center gap-2">
                    <ClipboardList
                        size={19}
                        className="text-gray-600"
                    />

                    <h2 className="font-semibold text-gray-800">
                        Activity History
                    </h2>
                </div>

                <span className="text-xs text-gray-500">
                    Showing {startRecord}–{endRecord} of {total}
                </span>
            </div>

            {/* LOADING */}
            {loading ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">

                    <Loader2
                        size={30}
                        className="animate-spin text-blue-600"
                    />

                    <p className="text-sm text-gray-500">
                        Loading audit logs...
                    </p>
                </div>
            ) : logs.length === 0 ? (

                /* EMPTY STATE */
                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                        <ClipboardList
                            size={26}
                            className="text-gray-400"
                        />
                    </div>

                    <h3 className="font-semibold text-gray-700">
                        No audit logs found
                    </h3>

                    <p className="mt-1 max-w-sm text-sm text-gray-500">
                        No activity records match your search or filters.
                    </p>
                </div>
            ) : (

                /* TABLE */
                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1050px] text-left text-sm">

                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-5 py-4 font-semibold">
                                    User
                                </th>

                                <th className="px-5 py-4 font-semibold">
                                    Action
                                </th>

                                <th className="px-5 py-4 font-semibold">
                                    Module
                                </th>

                                <th className="px-5 py-4 font-semibold">
                                    Description
                                </th>

                                <th className="px-5 py-4 font-semibold">
                                    Status
                                </th>

                                <th className="px-5 py-4 font-semibold">
                                    Date & Time
                                </th>

                                <th className="px-5 py-4 text-center font-semibold">
                                    Details
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">

                            {logs.map((log) => (
                                <tr
                                    key={log.audit_log_id}
                                    className="transition hover:bg-gray-50"
                                >

                                    {/* USER */}
                                    <td className="px-5 py-4">
                                        <p className="font-medium text-gray-800">
                                            {log.username || "System"}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                            {log.user_role || "—"}
                                        </p>
                                    </td>

                                    {/* ACTION */}
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${getActionStyle(log.action)}`}
                                        >
                                            {log.action || "—"}
                                        </span>
                                    </td>

                                    {/* MODULE */}
                                    <td className="px-5 py-4">
                                        <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                            {log.module || "—"}
                                        </span>
                                    </td>

                                    {/* DESCRIPTION */}
                                    <td className="max-w-[300px] px-5 py-4">
                                        <p className="line-clamp-2 text-gray-600">
                                            {log.description || "No description"}
                                        </p>

                                        {log.entity_id && (
                                            <p className="mt-1 text-xs text-gray-400">
                                                ID: {log.entity_id}
                                            </p>
                                        )}
                                    </td>

                                    {/* STATUS */}
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(log.status)}`}
                                        >
                                            {log.status || "—"}
                                        </span>
                                    </td>

                                    {/* DATE */}
                                    <td className="whitespace-nowrap px-5 py-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock
                                                size={14}
                                                className="shrink-0 text-gray-400"
                                            />

                                            <span className="text-xs">
                                                {formatDate(log.created_at)}
                                            </span>
                                        </div>
                                    </td>

                                    {/* DETAILS */}
                                    <td className="px-5 py-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onViewDetails(log)
                                            }
                                            title="View audit log details"
                                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                        >
                                            <Eye size={17} />
                                        </button>
                                    </td>

                                </tr>
                            ))}

                        </tbody>
                    </table>
                </div>
            )}

            {/* PAGINATION */}
            {!loading && total > 0 && (
                <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-xs text-gray-500">
                        Page {page} of {Math.max(totalPages, 1)}
                    </p>

                    <div className="flex items-center gap-2">

                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() =>
                                onPageChange(page - 1)
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() =>
                                onPageChange(page + 1)
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogsTable;