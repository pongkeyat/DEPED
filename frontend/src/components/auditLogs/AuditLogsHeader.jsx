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
        <div className="relative flex min-h-[88px] flex-col gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            {/* Left Accent Bar */}
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

            <div className="flex items-center gap-4 pl-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3E74]">
                    <ClipboardList
                        size={24}
                        className="stroke-[2.2]"
                    />
                </div>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#1E3E74]">
                        Audit Logs
                    </h1>

                    <p className="mt-0.5 text-sm text-gray-500">
                        Monitor user activities and system events.
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                        <ShieldCheck
                            size={16}
                            className="text-emerald-600"
                        />

                        <span className="text-xs font-medium text-gray-600">
                            <strong className="text-gray-900">{total.toLocaleString()}</strong> total records tracked
                        </span>
                    </div>
                </div>
            </div>

            <div className="pl-3 sm:pl-0">
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-[#1E3E74] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                    <RefreshCw
                        size={16}
                        className={`text-gray-500 ${loading ? "animate-spin text-[#1E3E74]" : ""}`}
                    />
                    Refresh Logs
                </button>
            </div>
        </div>
    );
};

export default AuditLogsHeader;