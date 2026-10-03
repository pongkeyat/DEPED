import React from "react";
import { Award } from "lucide-react";

export default function ApplicantHeader({ applicant }) {
  return (
    <div className="relative mb-6 flex min-h-[88px] flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center">
      {/* Left Blue Accent Bar - Cleanly clipped by parent overflow-hidden */}
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

      {/* Title & Description Section */}
      <div className="flex items-start gap-4 pl-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3E74]">
          <Award size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1E3E74]">
            Assessment Scoring
          </h1>
          <p className="text-sm text-gray-500">
            Evaluate and score applicant assessment performance metrics.
          </p>
        </div>
      </div>

      {/* Applicant Meta Details Grid / Badges */}
      <div className="flex flex-wrap items-center gap-6 pl-3 sm:pl-0">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400">Applicant ID</p>
          <p className="text-sm font-semibold text-gray-700">{applicant?.applicant_id || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400">Position</p>
          <p className="text-sm font-semibold text-gray-700">{applicant?.position_title || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400">Salary Grade</p>
          <p className="text-sm font-semibold text-gray-700">{applicant?.salary_grade || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400">Initial Screening</p>
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-700">
            QUALIFIED
          </span>
        </div>
      </div>
    </div>
  );
}