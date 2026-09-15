import React from "react";
import { ClipboardCheck } from "lucide-react";

export default function HRRemarksForm({ data, onChange, isLoggedIn = true }) {
  // Determine initial status: if not logged in or status is not set, default to "under_review"
  const currentStatus = !isLoggedIn || !data?.application_status 
    ? "under_review" 
    : data.application_status;

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden font-sans">
      {/* Header Banner Section */}
      <div className="bg-[#1e4a8a] p-5 pb-4 text-white flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {/* Section Number Badge */}
          <span className="flex items-center justify-center bg-white/20 text-white font-semibold text-sm w-6 h-6 rounded-full">
            5
          </span>
          {/* Header Icon */}
          <ClipboardCheck className="w-5 h-5 text-white/90" />
          <h3 className="text-xl font-medium tracking-wide">HR Remarks & Evaluation</h3>
        </div>
      </div>
      
      {/* Subheader / Instruction Bar */}
      <div className="bg-[#163664] px-5 py-2 text-white/90 text-sm border-t border-white/10">
        Internal evaluation notes and baseline status for this initial application intake.
      </div>

      {/* Form Content Body */}
      <div className="p-6 bg-[#fcfdfd] space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Application Status Selection */}
          <div className="space-y-1.5 md:col-span-1">
            <label className="block text-[15px] font-medium text-gray-800">
              Initial Application Status
            </label>
            <div className="relative">
              <select
                name="application_status"
                value={currentStatus}
                onChange={handleChange}
                className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-700 appearance-none shadow-sm"
              >
                <option value="">-- Select Status --</option>
                <option value="Complete">Complete</option>
                <option value="Incomplete">Incomplete</option>
                <option value="under_review">Under Review</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
            {!isLoggedIn && (
              <p className="text-xs text-amber-600 mt-1">
                * Defaulted to Under Review (User not logged in)
              </p>
            )}
          </div>

          {/* HR Evaluation Remarks Notes */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-[15px] font-medium text-gray-800">
              Evaluation Notes / Remarks
            </label>
            <textarea
              name="hr_remarks_notes"
              value={data?.hr_remarks_notes || ""}
              onChange={handleChange}
              placeholder="Add internal verification notes, document discrepancies, or screening observations..."
              rows={4}
              className="w-full p-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl text-sm bg-[#fcfcfc] text-gray-700 placeholder-gray-400 shadow-sm transition-all resize-y"
            />
          </div>

        </div>
      </div>
    </div>
  );
}