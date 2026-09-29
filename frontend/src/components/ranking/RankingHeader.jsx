import {
  ArrowLeft,
  Printer,
  RefreshCw,
} from "lucide-react";

export default function RankingHeader({
  onBack,
  onPrint,
}) {
  return (
    <div className="print:hidden mb-6 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

      {/* =====================================================
          LEFT SIDE
      ===================================================== */}

      <div>
        <h1 className="text-xl font-bold text-[#1E3E74]">
          Applicant Ranking
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View qualified applicants ranked according to
          their overall evaluation scores.
        </p>
      </div>

      {/* =====================================================
          RIGHT SIDE
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

        {/* PRINT */}
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E3E74] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17325e]"
          >
            <Printer size={17} />
            Print Ranking
          </button>
        )}

      </div>
    </div>
  );
}