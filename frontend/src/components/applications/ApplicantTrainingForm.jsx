import React from "react";
import GroupedRowsTable, { tableInput } from "./GroupedRowsCard";

import {
  buildGroups,
  setGroupValue,
  addGroupRow,
  addRowToGroup,
  removeRowAt,
  removeGroupById,
} from "../../utils/groupRows";
import { getToday } from "../../utils/dateUtils";

// ==========================================
// RULES
// ==========================================
// Date To can be any date on or after Date From (no limit on number of days).
// Hours can never be more than (number of days) x 8 for the chosen dates.
// Hours are filled in automatically: Full day = 8 hrs/day, Half day = 4 hrs/day.
// The applicant can still lower the number afterwards (e.g. 6 hrs).
const HOURS_PER_DAY = 8;
const HALF_DAY_HOURS = 4;

const DAY_TYPES = {
  FULL: { label: "Full day (8 hrs)", hoursPerDay: HOURS_PER_DAY },
  HALF: { label: "Half day (4 hrs)", hoursPerDay: HALF_DAY_HOURS },
};

const getHoursPerDay = (dayType) =>
  (DAY_TYPES[dayType] || DAY_TYPES.FULL).hoursPerDay;

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

// May 18 -> May 20 = 2 days = 16 hrs max. null = no limit yet (dates incomplete).
const getMaxHours = (dateFrom, dateTo) => {
  const days = getDayCount(dateFrom, dateTo);
  return days === null ? null : days * HOURS_PER_DAY;
};

// Automatic hours = number of days x hours per day.
//   Oct 1 -> Oct 2 (1 day)   Full = 8,  Half = 4
//   10 days                  Full = 80, Half = 40
// null until both dates are filled in.
const getAutoHours = (dateFrom, dateTo, dayType) => {
  const days = getDayCount(dateFrom, dateTo);
  return days === null ? null : days * getHoursPerDay(dayType);
};

// Anything from 0 up to the max is allowed; above the max is pulled down to it.
const clampHours = (hours, dateFrom, dateTo) => {
  const n = Number.parseInt(hours, 10);
  if (Number.isNaN(n) || n < 0) return 0;

  const max = getMaxHours(dateFrom, dateTo);
  return max === null ? n : Math.min(n, max);
};

const makeRow = (groupId, conductedBy = "") => ({
  group_id: groupId,
  training_title: "",
  date_from: "",
  date_to: "",
  hours_attended: 0,
  day_type: "FULL", // form-only: removed before sending to the API
  training_type: "",
  conducted_by: conductedBy,
});

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
export default function ApplicantTrainingForm({ trainings = [], onChange }) {
  const emit = (list) => onChange("trainings", list);

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

    // Cannot pick a date after today
    if (value && value > getToday()) return;

    // Date To can't be earlier than Date From
    let dateTo = t.date_to || "";
    if (value && dateTo && dateTo < value) dateTo = "";

    const auto = getAutoHours(value, dateTo, t.day_type);

    updateRow(index, {
      date_from: value,
      date_to: dateTo,
      hours_attended:
        auto ?? clampHours(t.hours_attended, value, dateTo),
    });
  };

  const handleDateToChange = (index, value) => {
    const t = trainings[index];

    if (t.date_from && value && value < t.date_from) return;
    if (value && value > getToday()) return;

    const auto = getAutoHours(t.date_from, value, t.day_type);

    updateRow(index, {
      date_to: value,
      hours_attended:
        auto ?? clampHours(t.hours_attended, t.date_from, value),
    });
  };

  // Full / Half day: recompute the hours when both dates are already set
  const handleDayTypeChange = (index, dayType) => {
    const t = trainings[index];
    const auto = getAutoHours(t.date_from, t.date_to, dayType);

    updateRow(index, {
      day_type: dayType,
      hours_attended: auto ?? t.hours_attended,
    });
  };

  const groups = buildGroups(trainings, "conducted_by");

  const columns = [
    {
      key: "training_title",
      label: "Training / Seminar Title",
      required: true,
      className: "w-64",
      render: (item, index) => (
        <input
          type="text"
          value={item.training_title || ""}
          onChange={(e) => updateRow(index, { training_title: e.target.value })}
          className={tableInput}
          required
        />
      ),
    },
    {
      key: "date_from",
      label: "Date From",
      className: "w-40",
      render: (item, index) => (
        <input
          type="date"
          value={item.date_from || ""}
          max={getToday()}
          onChange={(e) => handleDateFromChange(index, e.target.value)}
          className={tableInput}
        />
      ),
    },
    {
      key: "date_to",
      label: "Date To",
      className: "w-40",
      render: (item, index) => (
        <input
          type="date"
          value={item.date_to || ""}
          min={item.date_from || undefined}
          max={getToday()}
          onChange={(e) => handleDateToChange(index, e.target.value)}
          className={tableInput}
        />
      ),
    },
    {
      key: "day_type",
      label: "Day Type",
      className: "w-36",
      render: (item, index) => (
        <select
          value={item.day_type || "FULL"}
          onChange={(e) => handleDayTypeChange(index, e.target.value)}
          className={tableInput}
          title="Full day = 8 hours per day, Half day = 4 hours per day"
        >
          <option value="FULL">{DAY_TYPES.FULL.label}</option>
          <option value="HALF">{DAY_TYPES.HALF.label}</option>
        </select>
      ),
    },
    {
      key: "hours_attended",
      label: "Hours",
      className: "w-28",
      render: (item, index) => {
        const maxHours = getMaxHours(item.date_from, item.date_to);

        return (
          <div>
            <input
              type="number"
              value={item.hours_attended ?? 0}
              onChange={(e) => handleHoursChange(index, e.target.value)}
              min="0"
              max={maxHours ?? undefined}
              title={
                maxHours === null
                  ? "Select Date From and Date To to set the hour limit"
                  : `Maximum ${maxHours} hours for the selected dates`
              }
              className={tableInput}
            />

            {maxHours !== null && (
              <p className="mt-1 text-[11px] leading-tight text-blue-600">
                Auto: {getDayCount(item.date_from, item.date_to)} day
                {getDayCount(item.date_from, item.date_to) > 1 ? "s" : ""} x{" "}
                {getHoursPerDay(item.day_type)} hrs. Max {maxHours} hrs.
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "training_type",
      label: "Type",
      className: "w-40",
      render: (item, index) => (
        <select
          value={item.training_type || ""}
          onChange={(e) => updateRow(index, { training_type: e.target.value })}
          className={tableInput}
        >
          <option value="">-- Type --</option>
          <option value="TECHNICAL">Technical</option>
          <option value="MANAGERIAL">Managerial</option>
        </select>
      ),
    },
  ];

  return (
    <GroupedRowsTable
      number={4}
      title="Relevant Trainings / Seminars"
      subheader="Training History & Seminars Attended"
      addLabel="Add Training"
      emptyText="No trainings added yet"
      groups={groups}
      groupLabel="Conducted By"
      groupPlaceholder="Organization / place where the trainings were conducted"
      columns={columns}
      minTableWidth="min-w-[980px]"
      onGroupChange={(groupId, value) =>
        emit(setGroupValue(trainings, groupId, "conducted_by", value))
      }
      onAddGroup={() => emit(addGroupRow(trainings, makeRow))}
      onAddRow={(groupId) =>
        emit(addRowToGroup(trainings, groupId, "conducted_by", makeRow))
      }
      onRemoveRow={(index) => emit(removeRowAt(trainings, index))}
      onRemoveGroup={(groupId) => emit(removeGroupById(trainings, groupId))}
    />
  );
}