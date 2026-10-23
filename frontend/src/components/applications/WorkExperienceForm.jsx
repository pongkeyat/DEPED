import React, { useEffect } from "react";
import GroupedRowsTable, { tableInput } from "./GroupedRowsCard";

import {
  buildGroups,
  setGroupValue,
  addGroupRow,
  addRowToGroup,
  removeRowAt,
  removeGroupById,
} from "../../utils/groupRows";
import { getToday, isFutureDate } from "../../utils/dateUtils";

const makeRow = (groupId, companyOffice = "") => ({
  group_id: groupId,
  position_title: "",
  company_office: companyOffice,
  date_from: "",
  date_to: "",
  monthly_salary: "",
  appointment_status: "",
  is_govt_service: null,
  is_internal: null,
});

const normalizeCategory = (category) =>
  String(category ?? "")
    .trim()
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");

const isClassificationCategory = (category) => {
  const normalized = normalizeCategory(category);
  if (!normalized) return false;

  // Show classification for non-teaching, school administration,
  // teaching, and related teaching categories.
  return (
    normalized.includes("NON_TEACH") ||
    normalized.includes("SCHOOL_ADMIN") ||
    normalized.includes("TEACH") ||
    normalized.includes("TEACHER")
  );
};

const toBoolOrNull = (value) =>
  value === "true" ? true : value === "false" ? false : null;

export default function WorkExperienceForm({ data, onChange, category }) {
  const list = Array.isArray(data) ? data : [];
  const showApplicantClassification = isClassificationCategory(category);

  const emit = (next) => {
    if (typeof onChange === "function") onChange(next);
  };

  const updateRow = (index, patch) =>
    emit(list.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  // Date To cannot be earlier than Date From.
  const handleDateFromChange = (index, value) => {
    if (isFutureDate(value)) return; // cannot pick a date after today
    const row = list[index];
    const dateTo = row.date_to && value && row.date_to < value ? "" : row.date_to;
    updateRow(index, { date_from: value, date_to: dateTo });
  };

  const handleDateToChange = (index, value) => {
    const row = list[index];
    if (isFutureDate(value)) return; // cannot pick a date after today
    if (row.date_from && value && value < row.date_from) return;
    updateRow(index, { date_to: value });
  };

  const handleGovernmentChange = (index, value) => {
    // Internal applicants are always in government service (locked to Yes)
    if (list[index]?.is_internal === true) return;
    updateRow(index, { is_govt_service: toBoolOrNull(value) });
  };

  // Keep saved/restored rows consistent: Internal => Government Service Yes
  useEffect(() => {
    if (list.some((r) => r.is_internal === true && r.is_govt_service !== true)) {
      emit(
        list.map((r) =>
          r.is_internal === true && r.is_govt_service !== true
            ? { ...r, is_govt_service: true }
            : r
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  // Internal applicants are already in government service, so
  // "Internal Applicant" automatically sets Government Service to Yes.
  // The user can still change it afterwards. External / Not Specified
  // leave the Government Service answer untouched.
  const handleInternalChange = (index, value) => {
    const is_internal = toBoolOrNull(value);

    updateRow(index, {
      is_internal,
      ...(is_internal === true ? { is_govt_service: true } : {}),
    });
  };

  const groups = buildGroups(list, "company_office");

  // Compact stacked radio group for table cells
  const radioGroup = (name, options, onSelect, lockedValue = null) => (
    <div className="flex flex-col gap-1.5 py-1">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.checked}
            disabled={lockedValue !== null && option.value !== lockedValue}
            onChange={(e) => onSelect(e.target.value)}
            className="h-4 w-4 accent-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
          />
          <span
            className={
              lockedValue !== null && option.value !== lockedValue
                ? "text-gray-400"
                : ""
            }
          >
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );

  const columns = [
    {
      key: "position_title",
      label: "Position Title",
      required: true,
      className: "w-52",
      render: (entry, index) => (
        <input
          type="text"
          value={entry.position_title || ""}
          onChange={(e) => updateRow(index, { position_title: e.target.value })}
          placeholder="ADMINISTRATIVE OFFICER"
          className={tableInput}
        />
      ),
    },
    {
      key: "date_from",
      label: "Date From",
      className: "w-40",
      render: (entry, index) => (
        <input
          type="date"
          value={entry.date_from || ""}
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
      render: (entry, index) => (
        <input
          type="date"
          value={entry.date_to || ""}
          min={entry.date_from || undefined}
          max={getToday()}
          onChange={(e) => handleDateToChange(index, e.target.value)}
          className={tableInput}
        />
      ),
    },
    {
      key: "monthly_salary",
      label: "Monthly Salary",
      className: "w-36",
      render: (entry, index) => (
        <input
          type="number"
          min="0"
          value={entry.monthly_salary ?? ""}
          onChange={(e) => updateRow(index, { monthly_salary: e.target.value })}
          placeholder="30000"
          className={tableInput}
        />
      ),
    },
    {
      key: "appointment_status",
      label: "Appointment Status",
      className: "w-48",
      render: (entry, index) => (
        <select
          value={entry.appointment_status || ""}
          onChange={(e) =>
            updateRow(index, { appointment_status: e.target.value })
          }
          className={tableInput}
        >
          <option value="">Select status...</option>
          <option value="Permanent">Permanent</option>
          <option value="Contract of Service">Contract of Service</option>
          <option value="Regular">Regular</option>
        </select>
      ),
    },
    {
      key: "is_internal",
      label: "Applicant Classification",
      className: "w-44",
      hidden: !showApplicantClassification,
      render: (entry, index) =>
        radioGroup(
          `internal_${index}`,
          [
            { label: "Internal Applicant", value: "true", checked: entry.is_internal === true },
            { label: "External Applicant", value: "false", checked: entry.is_internal === false },
            { label: "Not Specified", value: "null", checked: entry.is_internal == null },
          ],
          (value) => handleInternalChange(index, value)
        ),
    },
    {
      key: "is_govt_service",
      label: "Government Service?",
      className: "w-40",
      render: (entry, index) =>
        radioGroup(
          `government_${index}`,
          [
            {
              label: "Yes",
              value: "true",
              checked: entry.is_internal === true || entry.is_govt_service === true,
            },
            {
              label: "No",
              value: "false",
              checked: entry.is_internal !== true && entry.is_govt_service === false,
            },
            {
              label: "Not Specified",
              value: "null",
              checked: entry.is_internal !== true && entry.is_govt_service == null,
            },
          ],
          (value) => handleGovernmentChange(index, value),
          // Internal Applicant => only "Yes" can be selected
          entry.is_internal === true ? "true" : null
        ),
    },
  ];

  return (
    <GroupedRowsTable
      number={6}
      title="Work Experience"
      subheader="Employment & Service Records"
      subheaderRequired
      addLabel="Add Experience"
      emptyText='Click "Add Company / Office" to add employment history'
      groups={groups}
      groupLabel="Company / Office Name"
      groupPlaceholder="DEPARTMENT OF HEALTH"
      columns={columns}
      minTableWidth="min-w-[1150px]"
      onGroupChange={(groupId, value) =>
        emit(setGroupValue(list, groupId, "company_office", value))
      }
      onAddGroup={() => emit(addGroupRow(list, makeRow))}
      onAddRow={(groupId) =>
        emit(addRowToGroup(list, groupId, "company_office", makeRow))
      }
      onRemoveRow={(index) => emit(removeRowAt(list, index))}
      onRemoveGroup={(groupId) => emit(removeGroupById(list, groupId))}
    />
  );
}