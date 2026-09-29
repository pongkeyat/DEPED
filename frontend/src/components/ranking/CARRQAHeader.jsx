import { ArrowLeft, Printer, RefreshCw } from "lucide-react";

const CARRQAHeader = ({
    onBack,
    onPrint,
    onRefresh,
    loading = false,
}) => {
    return (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

            {/* =====================================================
                TITLE
            ===================================================== */}

            <div>
                <h1 className="text-xl font-bold text-[#1E3E74]">
                    CAR-RQA Applicant Ranking
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Comparative Assessment Result - Registry of
                    Qualified Applicants
                </p>
            </div>

            {/* =====================================================
                ACTION BUTTONS
            ===================================================== */}

            <div className="flex flex-wrap items-center gap-3">

                {/* BACK */}
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                    <ArrowLeft size={17} />
                    Back
                </button>

                {/* REFRESH */}
                {onRefresh && (
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            size={17}
                            className={
                                loading
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>
                )}

                {/* PRINT */}
                {onPrint && (
                    <button
                        type="button"
                        onClick={onPrint}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#1E3E74] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17325e]"
                    >
                        <Printer size={17} />
                        Print CAR-RQA
                    </button>
                )}

            </div>

        </div>
    );
};

export default CARRQAHeader;