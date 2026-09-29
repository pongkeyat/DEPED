
import {
    ClipboardList,
    RefreshCw,
    ShieldCheck
} from "lucide-react";

const AuditLogsHeader = ({
    total = 0,
    onRefresh,
    loading
}) => {
    return (
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <ClipboardList
                        size={25}
                        className="text-blue-600"
                    />
                </div>

                <div>
                    <h1 className="text-xl font-bold text-gray-800">
                        Audit Logs
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Monitor user activities and system events.
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                        <ShieldCheck
                            size={15}
                            className="text-green-600"
                        />

                        <span className="text-xs text-gray-500">
                            {total.toLocaleString()} total records
                        </span>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                />

                Refresh
            </button>
        </div>
    );
};

export default AuditLogsHeader;