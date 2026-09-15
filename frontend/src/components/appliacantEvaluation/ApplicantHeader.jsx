import React from "react";
import { User, Phone, Mail, MapPin } from "lucide-react";

export default function ApplicantHeader({ applicant }) {
  if (!applicant) return null;

  const fullName = applicant.full_name || `${applicant.first_name || ""} ${applicant.last_name || ""}`.trim() || "N/A";
  const appliedPosition = applicant.position_applied || applicant.applied_position || "Not Specified";
  const mobileNumber = applicant.contact_number || applicant.mobile_number || "N/A";
  const emailAddress = applicant.email || "N/A";
  const residentialAddress = applicant.address || applicant.residential_address || "N/A";

  return (
    <div className="mb-8 rounded-3xl bg-white p-6 shadow-md border border-slate-100">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E3E74]/10 text-[#1E3E74]">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{fullName}</h1>
            <p className="text-[#1E3E74] font-semibold text-sm mt-0.5">
              Applied Position: <span className="text-slate-700 font-bold">{appliedPosition}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-[#1E3E74] shrink-0" />
            <span className="truncate">{mobileNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-[#1E3E74] shrink-0" />
            <span className="truncate">{emailAddress}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[#1E3E74] shrink-0" />
            <span className="truncate">{residentialAddress}</span>
          </div>
        </div>
      </div>
    </div>
  );
}