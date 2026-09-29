
import {
    X,
    ClipboardList,
    User,
    Clock,
    Globe,
    FileText,
    Database,
    ShieldCheck,
    Loader2
} from "lucide-react";

const AuditLogDetailsModal = ({
    log,
    loading,
    error,
    onClose
}) => {
    const formatDate = (date) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "—";
        }

        return parsedDate.toLocaleString("en-PH", {
            year: "numeric",
            month: "long",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    };

    const detailItem = (label, value) => (
        <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {label}
            </p>

            <p className="break-words text-sm text-gray-800">
                {value || "—"}
            </p>
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="audit-details-title"
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                            <ClipboardList
                                size={21}
                                className="text-blue-600"
                            />
                        </div>

                        <div>
                            <h2
                                id="audit-details-title"
                                className="font-semibold text-gray-800"
                            >
                                Audit Log Details
                            </h2>

                            <p className="text-xs text-gray-500">
                                Record #{log?.audit_log_id || ""}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">

                    {loading ? (
                        <div className="flex min-h-[250px] flex-col items-center justify-center gap-3">
                            <Loader2
                                size={30}
                                className="animate-spin text-blue-600"
                            />

                            <p className="text-sm text-gray-500">
                                Loading audit details...
                            </p>
                        </div>
                    ) : !log ? (
                        <div className="py-12 text-center text-sm text-gray-500">
                            Audit log details are unavailable.
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {error && (
                                <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                                    {error}
                                </div>
                            )}

                            {/* ACTIVITY SUMMARY */}
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <ShieldCheck
                                        size={18}
                                        className="text-blue-600"
                                    />

                                    <h3 className="font-semibold text-gray-800">
                                        Activity Summary
                                    </h3>
                                </div>

                                <p className="text-sm leading-6 text-gray-700">
                                    {log.description || "No description provided."}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                        {log.action || "UNKNOWN"}
                                    </span>

                                    <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                                        {log.module || "UNKNOWN"}
                                    </span>

                                    <span
                                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                            log.status === "SUCCESS"
                                                ? "border-green-200 bg-green-50 text-green-700"
                                                : "border-red-200 bg-red-50 text-red-700"
                                        }`}
                                    >
                                        {log.status || "UNKNOWN"}
                                    </span>
                                </div>
                            </div>

                            {/* USER INFORMATION */}
                            <section>
                                <div className="mb-4 flex items-center gap-2">
                                    <User
                                        size={18}
                                        className="text-gray-500"
                                    />

                                    <h3 className="font-semibold text-gray-800">
                                        User Information
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    {detailItem(
                                        "Username",
                                        log.username
                                    )}

                                    {detailItem(
                                        "User ID",
                                        log.user_id
                                    )}

                                    {detailItem(
                                        "Role",
                                        log.user_role
                                    )}
                                </div>
                            </section>

                            <div className="border-t border-gray-100" />

                            {/* RECORD INFORMATION */}
                            <section>
                                <div className="mb-4 flex items-center gap-2">
                                    <Database
                                        size={18}
                                        className="text-gray-500"
                                    />

                                    <h3 className="font-semibold text-gray-800">
                                        Affected Record
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    {detailItem(
                                        "Entity Type",
                                        log.entity_type
                                    )}

                                    {detailItem(
                                        "Entity ID",
                                        log.entity_id
                                    )}
                                </div>
                            </section>

                            <div className="border-t border-gray-100" />

                            {/* REQUEST INFORMATION */}
                            <section>
                                <div className="mb-4 flex items-center gap-2">
                                    <Globe
                                        size={18}
                                        className="text-gray-500"
                                    />

                                    <h3 className="font-semibold text-gray-800">
                                        Request Information
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    {detailItem(
                                        "IP Address",
                                        log.ip_address
                                    )}

                                    {detailItem(
                                        "Date & Time",
                                        formatDate(log.created_at)
                                    )}

                                    <div className="sm:col-span-2">
                                        {detailItem(
                                            "User Agent",
                                            log.user_agent
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* METADATA */}
                            <section>
                                <div className="mb-3 flex items-center gap-2">
                                    <FileText
                                        size={18}
                                        className="text-gray-500"
                                    />

                                    <h3 className="font-semibold text-gray-800">
                                        Additional Metadata
                                    </h3>
                                </div>

                                <pre className="max-h-64 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs leading-5 text-gray-700">
                                    {JSON.stringify(
                                        log.metadata || {},
                                        null,
                                        2
                                    )}
                                </pre>
                            </section>

                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Clock size={14} />
                                Audit record ID: {log.audit_log_id}
                            </div>

                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-900"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogDetailsModal;