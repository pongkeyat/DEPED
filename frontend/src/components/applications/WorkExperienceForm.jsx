import React from "react";
import { CheckCircle2, Trash2 } from "lucide-react";

const emptyEntry = () => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `work_${Date.now()}_${Math.random().toString(16).slice(2)}`,

  position_title: "",
  company_office: "",
  date_from: "",
  date_to: "",
  monthly_salary: "",
  appointment_status: "",
  is_govt_service: null,
});

export default function WorkExperienceForm({ data, onChange }) {
  // ============================================================
  // NORMALIZE DATA
  // ============================================================
  let safeData = data;

  if (!Array.isArray(safeData)) {
    if (safeData && typeof safeData === "object") {
      const hasContent = Object.values(safeData).some(
        (v) => v !== "" && v != null
      );

      safeData = hasContent
        ? [{ ...emptyEntry(), ...safeData }]
        : [];
    } else {
      safeData = [];
    }
  }

  // Ensure every entry has an ID
  safeData = safeData.map((entry) =>
    entry.id
      ? entry
      : {
          ...emptyEntry(),
          ...entry,
        }
  );

  // ============================================================
  // SAFE ON CHANGE
  // ============================================================
  const safeOnChange =
    typeof onChange === "function"
      ? onChange
      : (next) => {
          console.error(
            "[WorkExperienceForm] No `onChange` function was passed. Update dropped:",
            next
          );
        };

  // ============================================================
  // ADD WORK EXPERIENCE
  // ============================================================
  const handleAddWork = () => {
    safeOnChange([...safeData, emptyEntry()]);
  };

  // ============================================================
  // REMOVE WORK EXPERIENCE
  // ============================================================
  const handleRemove = (id) => {
    safeOnChange(
      safeData.filter((entry) => entry.id !== id)
    );
  };

  // ============================================================
  // HANDLE FIELD CHANGE
  // ============================================================
  const handleFieldChange = (id, field, value) => {
    safeOnChange(
      safeData.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              [field]: value,
            }
          : entry
      )
    );
  };

  // ============================================================
  // HANDLE DATE FROM
  // ============================================================
  const handleDateFromChange = (id, value) => {
    safeOnChange(
      safeData.map((entry) => {
        if (entry.id !== id) {
          return entry;
        }

        let dateTo = entry.date_to || "";

        // If Date To is earlier than the new Date From,
        // clear Date To.
        if (dateTo && value && dateTo < value) {
          dateTo = "";
        }

        return {
          ...entry,
          date_from: value,
          date_to: dateTo,
        };
      })
    );
  };

  // ============================================================
  // HANDLE DATE TO
  // ============================================================
  const handleDateToChange = (id, value) => {
    const entry = safeData.find(
      (item) => item.id === id
    );

    if (!entry) return;

    // Prevent Date To from being earlier than Date From
    if (
      entry.date_from &&
      value &&
      value < entry.date_from
    ) {
      return;
    }

    handleFieldChange(
      id,
      "date_to",
      value
    );
  };

  // ============================================================
  // HANDLE GOVERNMENT SERVICE RADIO
  // ============================================================
  const handleRadioChange = (id, value) => {
    const finalValue =
      value === "true"
        ? true
        : value === "false"
        ? false
        : null;

    handleFieldChange(
      id,
      "is_govt_service",
      finalValue
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden font-sans">

      {/* ======================================================
          TOP BANNER HEADER
      ====================================================== */}
      <div className="bg-[#1e4a8a] p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">

          <span className="flex items-center justify-center bg-white/20 text-white font-semibold text-xs w-5 h-5 rounded-full">
            6
          </span>

          <h3 className="text-base font-semibold tracking-wide">
            Work Experience
          </h3>

        </div>
      </div>

      {/* ======================================================
          SUBHEADER ACTION BAR
      ====================================================== */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-white">

        <div className="flex items-center gap-2 text-[#1e4a8a] font-medium text-sm">
          Employment & Service Records
          <span className="text-red-500">*</span>
        </div>

        <button
          type="button"
          onClick={handleAddWork}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-600 rounded-lg text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
        >
          <span className="text-base font-bold leading-none">
            +
          </span>

          Add Work Experience
        </button>

      </div>

      {/* ======================================================
          CONTENT BODY
      ====================================================== */}
      <div className="p-6 space-y-6 bg-[#fcfdfd]">

        {safeData.length === 0 ? (

          <div className="border border-dashed border-gray-200 rounded-xl py-12 flex flex-col items-center justify-center text-center bg-gray-50/40">

            <CheckCircle2
              size={24}
              className="text-gray-300 mb-2"
            />

            <p className="text-xs md:text-sm text-gray-500">
              Click "Add Work Experience" to add employment history
            </p>

          </div>

        ) : (

          <div className="space-y-6">

            {safeData.map((entry, index) => (

              <div
                key={entry.id}
                className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-4 relative"
              >

                {/* ==================================================
                    ENTRY INDEX
                ================================================== */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">

                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Experience #{index + 1}
                  </span>

                </div>

                {/* ==================================================
                    ROW 1
                ================================================== */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                  {/* POSITION TITLE */}
                  <div className="md:col-span-6 space-y-1">

                    <label className="block text-xs font-semibold text-gray-700">
                      Position Title
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      value={
                        entry.position_title || ""
                      }
                      onChange={(e) =>
                        handleFieldChange(
                          entry.id,
                          "position_title",
                          e.target.value
                        )
                      }
                      placeholder="ADMINISTRATIVE OFFICER"
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>

                  {/* COMPANY / OFFICE */}
                  <div className="md:col-span-6 space-y-1">

                    <label className="block text-xs font-semibold text-gray-700">
                      Company / Office Name
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      value={
                        entry.company_office || ""
                      }
                      onChange={(e) =>
                        handleFieldChange(
                          entry.id,
                          "company_office",
                          e.target.value
                        )
                      }
                      placeholder="DEPARTMENT OF HEALTH"
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>

                </div>

                {/* ==================================================
                    ROW 2
                ================================================== */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                  {/* DATE FROM */}
                  <div className="md:col-span-3 space-y-1">

                    <label className="block text-xs font-semibold text-gray-700">
                      Date From
                    </label>

                    <input
                      type="date"
                      value={
                        entry.date_from || ""
                      }
                      onChange={(e) =>
                        handleDateFromChange(
                          entry.id,
                          e.target.value
                        )
                      }
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>

                  {/* DATE TO */}
                  <div className="md:col-span-3 space-y-1">

                    <label className="block text-xs font-semibold text-gray-700">
                      Date To
                    </label>

                    <input
                      type="date"
                      value={
                        entry.date_to || ""
                      }
                      min={
                        entry.date_from || undefined
                      }
                      onChange={(e) =>
                        handleDateToChange(
                          entry.id,
                          e.target.value
                        )
                      }
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>

                  {/* MONTHLY SALARY */}
                  <div className="md:col-span-3 space-y-1">

                    <label className="block text-xs font-semibold text-gray-700">
                      Monthly Salary
                    </label>

                    <input
                      type="number"
                      value={
                        entry.monthly_salary || ""
                      }
                      onChange={(e) =>
                        handleFieldChange(
                          entry.id,
                          "monthly_salary",
                          e.target.value
                        )
                      }
                      placeholder="30000"
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>

                  {/* APPOINTMENT STATUS */}
                  <div className="md:col-span-3 space-y-1">

                    <label className="block text-xs font-semibold text-gray-700">
                      Appointment Status
                    </label>

                    <select
                      value={
                        entry.appointment_status || ""
                      }
                      onChange={(e) =>
                        handleFieldChange(
                          entry.id,
                          "appointment_status",
                          e.target.value
                        )
                      }
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >

                      <option
                        value=""
                        disabled
                      >
                        Select status...
                      </option>

                      <option value="Permanent">
                        Permanent
                      </option>

                      <option value="Contract of Service">
                        Contract of Service
                      </option>

                      <option value="Regular">
                        Regular
                      </option>

                    </select>

                  </div>

                </div>

                {/* ==================================================
                    ROW 3
                ================================================== */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

                  {/* GOVERNMENT SERVICE */}
                  <div className="md:col-span-11 bg-gray-50/70 border border-gray-200 rounded-xl p-3.5 space-y-2">

                    <p className="text-xs font-semibold text-gray-700">
                      Is this item part of Government Service?
                    </p>

                    <div className="flex gap-6">

                      {/* YES */}
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">

                        <input
                          type="radio"
                          name={`is_govt_service_${entry.id}`}
                          value="true"
                          checked={
                            entry.is_govt_service === true
                          }
                          onChange={(e) =>
                            handleRadioChange(
                              entry.id,
                              e.target.value
                            )
                          }
                          className="text-blue-600 focus:ring-blue-500"
                        />

                        Yes

                      </label>

                      {/* NO */}
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">

                        <input
                          type="radio"
                          name={`is_govt_service_${entry.id}`}
                          value="false"
                          checked={
                            entry.is_govt_service === false
                          }
                          onChange={(e) =>
                            handleRadioChange(
                              entry.id,
                              e.target.value
                            )
                          }
                          className="text-blue-600 focus:ring-blue-500"
                        />

                        No

                      </label>

                      {/* NOT SPECIFIED */}
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">

                        <input
                          type="radio"
                          name={`is_govt_service_${entry.id}`}
                          value="null"
                          checked={
                            entry.is_govt_service === null
                          }
                          onChange={(e) =>
                            handleRadioChange(
                              entry.id,
                              e.target.value
                            )
                          }
                          className="text-blue-600 focus:ring-blue-500"
                        />

                        Not Specified

                      </label>

                    </div>

                  </div>

                  {/* DELETE */}
                  <div className="md:col-span-1 flex items-end justify-end">

                    <button
                      type="button"
                      onClick={() =>
                        handleRemove(entry.id)
                      }
                      className="p-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors h-10 w-full flex items-center justify-center"
                      aria-label="Remove work experience"
                    >

                      <Trash2
                        size={16}
                        className="mx-auto"
                      />

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