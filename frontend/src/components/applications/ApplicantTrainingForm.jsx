import React from "react";

// ==========================================
// RULES
// ==========================================
// Date To can be any date on or after Date From (no limit on number of days).
// Hours can never be more than (number of days) x 24 for the chosen dates.
const HOURS_PER_DAY = 24;

// ==========================================
// HELPERS
// ==========================================
// Number of days between the two dates (May 18 -> May 20 = 2 days).
// A training that starts and ends on the same date counts as 1 day.
// Returns null until BOTH dates are filled in.
const getDayCount = (dateFrom, dateTo) => {
  if (!dateFrom || !dateTo) return null;

  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T00:00:00`);
  const days = Math.round((to - from) / 86400000);

  if (Number.isNaN(days) || days < 0) return null;
  return Math.max(days, 1);
};

// May 18 -> May 20 = 2 days = 48 hrs max. null = no limit yet (dates incomplete).
const getMaxHours = (dateFrom, dateTo) => {
  const days = getDayCount(dateFrom, dateTo);
  return days === null ? null : days * HOURS_PER_DAY;
};

// Anything from 0 up to the max is allowed; above the max is pulled down to it.
const clampHours = (hours, dateFrom, dateTo) => {
  const n = Number.parseInt(hours, 10);
  if (Number.isNaN(n) || n < 0) return 0;

  const max = getMaxHours(dateFrom, dateTo);
  return max === null ? n : Math.min(n, max);
};

const makeGroupId = () =>
  `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

// Rows saved before grouping existed have no group_id: each is its own group.
const rowGroupId = (training, index) => training.group_id ?? `legacy-${index}`;

const emptyRow = (groupId, conductedBy = "") => ({
  group_id: groupId,
  training_title: "",
  date_from: "",
  date_to: "",
  hours_attended: 0,
  training_type: "",
  conducted_by: conductedBy,
});

const labelClass = "block text-xs font-semibold text-gray-700";
const inputClass =
  "w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white";

// ==========================================
// 1. MAIN APPLICANT FORM (PARENT COMPONENT, demo)
// ==========================================
export function MainApplicantForm() {
  const [formData, setFormData] = React.useState({ trainings: [] });

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full space-y-4">
      <ApplicantTrainingForm
        trainings={formData.trainings}
        onChange={handleFormChange}
      />
    </div>
  );
}

// ==========================================
// 2. TRAINING FORM (CHILD COMPONENT)
//
// Data stays a FLAT list (`trainings`), one entry per training row, each with
// its own `conducted_by`. Rows that share a `group_id` are shown under ONE
// "Conducted By" field, so it is typed once instead of for every training.
// ==========================================
export default function ApplicantTrainingForm({
  trainings = [],
  onChange,
}) {
  // ------------------------------------------------------------
  // Build groups for display (keeps original indexes for updates)
  // ------------------------------------------------------------
  const groups = [];
  const groupMap = new Map();

  trainings.forEach((training, index) => {
    const id = rowGroupId(training, index);

    if (!groupMap.has(id)) {
      const group = { id, conducted_by: training.conducted_by || "", rows: [] };
      groupMap.set(id, group);
      groups.push(group);
    }

    groupMap.get(id).rows.push({ training, index });
  });

  const emit = (list) => onChange("trainings", list);

  // Legacy rows get a real id the first time their group is edited
  const realId = (groupId) =>
    groupId.startsWith("legacy-") ? makeGroupId() : groupId;

  // ------------------------------------------------------------
  // Row updates
  // ------------------------------------------------------------
  const updateRow = (index, patch) => {
    const updated = [...trainings];
    updated[index] = { ...updated[index], ...patch };
    emit(updated);
  };

  const handleHoursChange = (index, rawValue) => {
    const t = trainings[index];
    updateRow(index, {
      hours_attended: clampHours(rawValue, t.date_from, t.date_to),
    });
  };

  const handleDateFromChange = (index, value) => {
    const t = trainings[index];

    // Date To can't be earlier than Date From
    let dateTo = t.date_to || "";
    if (value && dateTo && dateTo < value) dateTo = "";

    updateRow(index, {
      date_from: value,
      date_to: dateTo,
      hours_attended: clampHours(t.hours_attended, value, dateTo),
    });
  };

  const handleDateToChange = (index, value) => {
    const t = trainings[index];

    if (t.date_from && value && value < t.date_from) return;

    updateRow(index, {
      date_to: value,
      hours_attended: clampHours(t.hours_attended, t.date_from, value),
    });
  };

  // ------------------------------------------------------------
  // Group updates
  // ------------------------------------------------------------
  const handleConductedByChange = (groupId, value) => {
    const id = realId(groupId);

    emit(
      trainings.map((t, i) =>
        rowGroupId(t, i) === groupId
          ? { ...t, group_id: id, conducted_by: value }
          : t
      )
    );
  };

  // New "Conducted By" block with its first row
  const addGroup = () => {
    emit([...trainings, emptyRow(makeGroupId())]);
  };

  // New row inside an existing block: Conducted By is reused, not retyped
  const addRow = (groupId) => {
    const id = realId(groupId);

    const updated = trainings.map((t, i) =>
      rowGroupId(t, i) === groupId ? { ...t, group_id: id } : t
    );

    let lastIndex = -1;
    updated.forEach((t, i) => {
      if (t.group_id === id) lastIndex = i;
    });

    const conductedBy = groupMap.get(groupId)?.conducted_by || "";
    updated.splice(lastIndex + 1, 0, emptyRow(id, conductedBy));

    emit(updated);
  };

  const removeRow = (index) => {
    emit(trainings.filter((_, i) => i !== index));
  };

  const removeGroup = (groupId) => {
    emit(trainings.filter((t, i) => rowGroupId(t, i) !== groupId));
  };

  const TrashIcon = () => (
    <svg
      className="w-4 h-4 mx-auto"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden font-sans">

      {/* HEADER PANEL */}
      <div className="bg-[#1e4a8a] p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center bg-white/20 text-white font-semibold text-xs w-5 h-5 rounded-full">
            4
          </span>

          <h3 className="text-base font-semibold tracking-wide">
            Relevant Trainings / Seminars
          </h3>
        </div>
      </div>

      {/* SUBHEADER ACTION BAR */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 text-[#1e4a8a] font-medium text-sm">
          Training History & Seminars Attended
        </div>

        <button
          type="button"
          onClick={addGroup}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-600 rounded-lg text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
        >
          <span className="text-base font-bold leading-none">+</span>
          Add Training
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-6 bg-[#fcfdfd]">

        {groups.length === 0 ? (

          <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2 border border-dashed border-gray-200 rounded-xl bg-gray-50/40">
            <svg
              className="w-10 h-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>

            <p className="text-xs md:text-sm text-gray-500">
              No trainings added yet
            </p>
          </div>

        ) : (

          groups.map((group, groupIndex) => (
            <div
              key={group.id}
              className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
            >

              {/* TRAINING ROWS (cards, same look as the other steps) */}
              <div className="p-4 space-y-4">
                {group.rows.map(({ training: item, index }, rowNumber) => {
                  const maxHours = getMaxHours(item.date_from, item.date_to);
                  const days = maxHours === null ? null : maxHours / HOURS_PER_DAY;

                  return (
                    <div
                      key={`${group.id}-${rowNumber}`}
                      className="rounded-xl border border-gray-200 bg-[#fcfdfd] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#1e4a8a]">
                          Training #{rowNumber + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          title="Remove this row"
                          className="h-8 w-8 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                        >
                          <TrashIcon />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4 space-y-1">
                          <label className={labelClass}>
                            Training / Seminar Title{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.training_title || ""}
                            onChange={(e) =>
                              updateRow(index, { training_title: e.target.value })
                            }
                            className={inputClass}
                            required
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className={labelClass}>Date From</label>
                          <input
                            type="date"
                            value={item.date_from || ""}
                            onChange={(e) =>
                              handleDateFromChange(index, e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className={labelClass}>Date To</label>
                          <input
                            type="date"
                            value={item.date_to || ""}
                            min={item.date_from || undefined}
                            onChange={(e) =>
                              handleDateToChange(index, e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>

                        <div className="md:col-span-1 space-y-1">
                          <label className={labelClass}>Hours</label>
                          <input
                            type="number"
                            value={item.hours_attended ?? 0}
                            onChange={(e) =>
                              handleHoursChange(index, e.target.value)
                            }
                            min="0"
                            max={maxHours ?? undefined}
                            title={
                              maxHours === null
                                ? "Select Date From and Date To to set the hour limit"
                                : `Maximum ${maxHours} hours for the selected dates`
                            }
                            className={inputClass}
                          />
                        </div>

                        <div className="md:col-span-3 space-y-1">
                          <label className={labelClass}>Type</label>
                          <select
                            value={item.training_type || ""}
                            onChange={(e) =>
                              updateRow(index, { training_type: e.target.value })
                            }
                            className={inputClass}
                          >
                            <option value="">-- Type --</option>
                            <option value="TECHNICAL">Technical</option>
                            <option value="MANAGERIAL">Managerial</option>
                          </select>
                        </div>
                      </div>

                      {maxHours !== null && (
                        <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                          Maximum hours for these dates:{" "}
                          <strong>{maxHours} hrs</strong> ({days} day
                          {days > 1 ? "s" : ""} x {HOURS_PER_DAY} hrs). You may
                          enter any number up to this limit.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* CONDUCTED BY (typed once per group) */}
              <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 border-t border-gray-200">

                <div className="flex-1 min-w-[240px] space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Conducted By #{groupIndex + 1}
                  </label>

                  <input
                    type="text"
                    value={group.conducted_by}
                    onChange={(e) =>
                      handleConductedByChange(group.id, e.target.value)
                    }
                    placeholder="Organization / place where the trainings were conducted"
                    className={inputClass}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => addRow(group.id)}
                  className="h-10 flex items-center gap-1.5 px-3 border border-blue-600 rounded-lg text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
                >
                  <span className="text-base font-bold leading-none">+</span>
                  Add Row
                </button>

                <button
                  type="button"
                  onClick={() => removeGroup(group.id)}
                  title="Remove this Conducted By and all of its rows"
                  className="h-10 w-10 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                >
                  <TrashIcon />
                </button>

              </div>

            </div>
          ))

        )}

      </div>
    </div>
  );
}