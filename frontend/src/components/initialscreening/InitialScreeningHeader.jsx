import { ClipboardCheck, UserCheck, UserX } from "lucide-react";

export default function InitialScreeningHeader() {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-3">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Blue Accent */}
          <div className="w-1 h-10 bg-blue-900 rounded-full"></div>

          <ClipboardCheck className="w-5 h-5 text-blue-900" />

          <div>
            <h1 className="text-lg font-bold text-blue-900">
              Initial Screening
            </h1>

            <p className="text-xs text-gray-500">
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