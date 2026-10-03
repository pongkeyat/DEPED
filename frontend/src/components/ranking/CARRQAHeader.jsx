import { ArrowLeft, Printer, RefreshCw, Award } from "lucide-react";

const CARRQAHeader = ({
    onBack,
    onPrint,
    onRefresh,
    loading = false,
}) => {
    return (
        <div className="relative mb-6 flex min-h-[88px] flex-col gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            {/* Left Accent Bar */}
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

            {/* =====================================================
                LEFT SECTION: ICON + TITLE & DESCRIPTION
            ===================================================== */}
            <div className="flex items-center gap-4 pl-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3E74]">
                    <Award size={24} className="stroke-[2.2]" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#1E3E74]">
                        CAR-RQA Applicant Ranking
                    </h1>

                    <p className="mt-0.5 text-sm text-gray-500">
                        Comparative Assessment Result - Registry of Qualified Applicants
                    </p>
                </div>
            </div>

            {/* =====================================================
                ACTION BUTTONS
            ===================================================== */}
            <div className="flex flex-wrap items-center gap-3 pl-3 sm:pl-0">

                {/* BACK */}
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-[#1E3E74] cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                )}

                {/* REFRESH */}
                {onRefresh && (
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-[#1E3E74] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw
                            size={16}
                            className={`text-gray-500 ${
                                loading ? "animate-spin text-[#1E3E74]" : ""
                            }`}
                        />
                        Refresh
                    </button>
                )}

                {/* PRINT */}
                {onPrint && (
                    <button
                        type="button"
                        onClick={onPrint}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#1E3E74] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17325e] cursor-pointer"
                    >
                        <Printer size={16} />
                        Print CAR-RQA
                    </button>
                )}

            </div>

        </div>
    );
};

export default CARRQAHeader;