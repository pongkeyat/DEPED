import React from 'react';
import { PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';

const ELIGIBILITY_OPTIONS = [
  "CAREER SERVICE PROFESSIONAL",
  "CAREER SERVICE SUBPROFESSIONAL",
  "RA 1080 (BOARD/BAR)",
  "HONOR GRADUATE",
  "SKILLS TEST/PRACTICAL EXAM",
  "OTHERS",
];

const emptyEntry = () => ({
  id: (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `entry_${Date.now()}_${Math.random().toString(16).slice(2)}`,
  eligibility_type: "",
  rating: "",
  date_of_exam: "",
  place_of_exam: "",
  license_number: "",
});

export default function CivilServiceEligibilityForm({ data, onChange }) {

  let safeData = data;

  if (!Array.isArray(safeData)) {
    if (safeData && typeof safeData === "object") {
      console.warn(
        "[CivilServiceEligibilityForm] `data` prop is an object, not an array. " +
        "Update the parent to use array-based state (see integration example)."
      );
      const hasContent = Object.values(safeData).some((v) => v !== "" && v != null);
      safeData = hasContent ? [{ ...emptyEntry(), ...safeData }] : [];
    } else {
      safeData = [];
    }
  }

  const safeOnChange = typeof onChange === "function"
    ? onChange
    : (next) => {
        console.error(
          "[CivilServiceEligibilityForm] No `onChange` function was passed. Update dropped:",
          next
        );
      };

  const normalizedEntries = safeData.map((entry, index) => ({
    ...entry,
    id:
      entry?.id ||
      `eligibility-${index}-${entry?.eligibility_type || "new"}-${entry?.license_number || "none"}`
  }));

  const handleAddEligibility = () => {
    safeOnChange([...normalizedEntries, emptyEntry()]);
  };

  const handleRemove = (id) => {
    safeOnChange(normalizedEntries.filter((entry) => entry.id !== id));
  };

  const handleFieldChange = (id, field, value) => {
    safeOnChange(
      normalizedEntries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden font-sans">
      
      {/* Top Banner Header */}
      <div className="bg-[#1e4a8a] p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center bg-white/20 text-white font-semibold text-xs w-5 h-5 rounded-full">
            5
          </span>
          <h3 className="text-base font-semibold tracking-wide">Civil Service Eligibility</h3>
        </div>
      </div>

      {/* Subheader Action Bar */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 text-[#1e4a8a] font-medium text-sm">
          Eligibility Records <span className="text-red-500">*</span>
        </div>
        <button
          type="button"
          onClick={handleAddEligibility}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-600 rounded-lg text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
        >
          <span className="text-base font-bold leading-none">+</span> Add Eligibility
        </button>
      </div>

      {/* Content Body */}
      <div className="p-6 space-y-6 bg-[#fcfdfd]">
        {normalizedEntries.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl py-12 flex flex-col items-center justify-center text-center bg-gray-50/40">
            <CheckCircle2 size={24} className="text-gray-300 mb-2" />
            <p className="text-xs md:text-sm text-gray-500">
              Click "Add Eligibility" to add civil service eligibility
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {normalizedEntries.map((entry) => (
              <div
                key={entry.id || `eligibility-${entry.eligibility_type || "new"}-${Math.random()}`}
                className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-4 relative"
              >
                {/* Unified 12-Column Grid Matching Education Form Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Eligibility Type */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Eligibility Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={entry.eligibility_type || ""}
                      onChange={(e) =>
                        handleFieldChange(entry.id, "eligibility_type", e.target.value)
                      }
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="">-- Select Eligibility --</option>
                      {ELIGIBILITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rating */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">Rating</label>
                    <input
                      type="number"
                      step="0.01"
                      value={entry.rating || ""}
                      placeholder="e.g. 81.25"
                      onChange={(e) => handleFieldChange(entry.id, "rating", e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                  </div>

                  {/* Date of Exam */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">Date of Exam</label>
                    <input
                      type="date"
                      value={entry.date_of_exam || ""}
                      onChange={(e) => handleFieldChange(entry.id, "date_of_exam", e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                  </div>

                  {/* Place of Exam */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">Place of Exam</label>
                    <input
                      type="text"
                      value={entry.place_of_exam || ""}
                      placeholder="City/Province"
                      onChange={(e) => handleFieldChange(entry.id, "place_of_exam", e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Second Row: License Number & Delete Action */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-11 space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">License Number</label>
                    <input
                      type="text"
                      value={entry.license_number || ""}
                      placeholder="—"
                      onChange={(e) => handleFieldChange(entry.id, "license_number", e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div className="md:col-span-1 flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemove(entry.id)}
                      className="p-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors h-10 w-full flex items-center justify-center"
                      aria-label="Remove eligibility"
                    >
                      <Trash2 size={16} className="mx-auto" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}