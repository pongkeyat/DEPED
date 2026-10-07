import { ClipboardCheck, UserCheck, UserX } from "lucide-react";

export default function InitialEvaluationHeader() {
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
              Initial Evaluation
            </h1>

            <p className="text-base text-gray-500 mt-1">
              Screen applications against minimum qualifications and documentary
              requirements per DO 007, s. 2023
            </p>
          </div>
        </div>

        {/* Right Section */}
     
      </div>
    </div>
  );
}