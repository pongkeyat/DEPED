import { ClipboardCheck, Printer } from "lucide-react";

export default function InitialEvaluationResultsHeader() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative w-full min-h-[88px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

      <div className="flex min-h-[88px] items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-5">
          <div className="p-3 bg-blue-50 rounded-xl">
            <ClipboardCheck className="w-8 h-8 text-blue-900" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-blue-900 tracking-tight">
              Initial Evaluation Results
            </h1>

            <p className="text-base text-gray-500 mt-1">
              Screen applications against minimum qualifications and
              documentary requirements per DO 007, s. 2023
            </p>
          </div>
        </div>

        {/* Right Section */}
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-xl bg-[#1E3E74] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#16315d] active:scale-[0.98]"
        >
          <Printer className="h-5 w-5" />
          IER FORM
        </button>
      </div>
    </div>
  );
}