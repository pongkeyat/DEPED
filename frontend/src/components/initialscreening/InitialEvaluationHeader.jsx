import { Users, ArrowLeft, ClipboardCheck } from "lucide-react";

export default function InitialEvaluationHeader({
  onBack,
  onProceed,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6">
        {/* Left */}
        <div className="flex items-start gap-4">
          {/* Blue Accent */}
          <div className="w-1 self-stretch rounded-full bg-[#1E3A6D]" />

          <div>
            <div className="flex items-center gap-2">
              <Users size={20} className="text-green-600" />
              <h1 className="text-3xl font-bold text-[#1E3A6D]">
                Initial evaluation Results
              </h1>
            </div>

            <p className="mt-1 text-gray-500 text-sm">
              Applicants who passed and Failed the initial screening and are eligible and not for
              HRMPSB assessment
            </p>
          </div>
        </div>

        {/* Right Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} />
            Back to Screening
          </button>

          <button
            onClick={onProceed}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#1E3A6D] text-white font-medium hover:bg-[#16335e] transition"
          >
            <ClipboardCheck size={18} />
            Proceed to Assessment
          </button>
        </div>
      </div>
    </div>
  );
}