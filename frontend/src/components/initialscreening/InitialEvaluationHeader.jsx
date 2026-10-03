import { ClipboardCheck } from "lucide-react";

export default function InitialScreeningHeader() {
  return (
    <div className="relative flex min-h-[88px] flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center">
      {/* Left Accent Bar */}
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

      {/* LEFT SIDE: Icon + Title & Description */}
      <div className="flex items-center gap-4 pl-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3E74]">
          <ClipboardCheck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E3E74]">
            Initial Screening
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Screen applications against minimum qualifications and documentary
            requirements per DO 007, s. 2023
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Placeholder for consistency */}
      <div className="flex flex-wrap items-center gap-3 pl-3 sm:pl-0"></div>
    </div>
  );
}