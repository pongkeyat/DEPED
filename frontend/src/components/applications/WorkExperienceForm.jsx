import React from "react";
import GroupedRowsCard, { fieldLabel, fieldInput } from "./GroupedRowsCard";
import {
  buildGroups,
  setGroupValue,
  addGroupRow,
  addRowToGroup,
  removeRowAt,
  removeGroupById,
} from "../../utils/groupRows";

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
    const row = list[index];
    const dateTo = row.date_to && value && row.date_to < value ? "" : row.date_to;
    updateRow(index, { date_from: value, date_to: dateTo });
  };

  const handleDateToChange = (index, value) => {
    const row = list[index];
    if (row.date_from && value && value < row.date_from) return;
    updateRow(index, { date_to: value });
  };

  const handleRadioChange = (index, value) =>
    updateRow(index, {
      is_govt_service: value === "true" ? true : value === "false" ? false : null,
    });

  const handleInternalChange = (index, value) =>
    updateRow(index, {
      is_internal: value === "true" ? true : value === "false" ? false : null,
    });

  const groups = buildGroups(list, "company_office");

  const radioOptions = (index, type, value) => {
    const options =
      type === "internal"
        ? [
            { label: "Internal Applicant", value: "true", checked: value === true },
            { label: "External Applicant", value: "false", checked: value === false },
            { label: "Not Specified", value: "null", checked: value == null },
          ]
        : [
            { label: "Yes", value: "true", checked: value === true },
            { label: "No", value: "false", checked: value === false },
            { label: "Not Specified", value: "null", checked: value == null },
          ];

    return (
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700"
          >
            <input
              type="radio"
              name={`${type}_${index}`}
              value={option.value}
              checked={option.checked}
              onChange={(e) => {
                if (type === "internal") handleInternalChange(index, e.target.value);
                else handleRadioChange(index, e.target.value);
              }}
              className="h-4 w-4 accent-blue-600 focus:ring-blue-500"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <GroupedRowsCard
      number={6}
      title="Work Experience"
      subheader="Employment & Service Records"
      subheaderRequired
      addLabel="Add Experience"
      emptyText='Click "Add Company / Office" to add employment history'
      groups={groups}
      groupLabel="Company / Office Name"
      groupPlaceholder="DEPARTMENT OF HEALTH"
      rowLabel="Position"
      onGroupChange={(groupId, value) =>
        emit(setGroupValue(list, groupId, "company_office", value))
      }
      onAddGroup={() => emit(addGroupRow(list, makeRow))}
      onAddRow={(groupId) => emit(addRowToGroup(list, groupId, "company_office", makeRow))}
      onRemoveRow={(index) => emit(removeRowAt(list, index))}
      onRemoveGroup={(groupId) => emit(removeGroupById(list, groupId))}
      renderRow={(entry, index) => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="space-y-1 md:col-span-3">
              <label className={fieldLabel}>
                Position Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={entry.position_title || ""}
                onChange={(e) => updateRow(index, { position_title: e.target.value })}
                placeholder="ADMINISTRATIVE OFFICER"
                className={fieldInput}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className={fieldLabel}>Date From</label>
              <input
                type="date"
                value={entry.date_from || ""}
                onChange={(e) => handleDateFromChange(index, e.target.value)}
                className={fieldInput}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className={fieldLabel}>Date To</label>
              <input
                type="date"
                value={entry.date_to || ""}
                min={entry.date_from || undefined}
                onChange={(e) => handleDateToChange(index, e.target.value)}
                className={fieldInput}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className={fieldLabel}>Monthly Salary</label>
              <input
                type="number"
                min="0"
                value={entry.monthly_salary ?? ""}
                onChange={(e) => updateRow(index, { monthly_salary: e.target.value })}
                placeholder="30000"
                className={fieldInput}
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className={fieldLabel}>Appointment Status</label>
              <select
                value={entry.appointment_status || ""}
                onChange={(e) => updateRow(index, { appointment_status: e.target.value })}
                className={fieldInput}
              >
                <option value="">Select status...</option>
                <option value="Permanent">Permanent</option>
                <option value="Contract of Service">Contract of Service</option>
                <option value="Regular">Regular</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
            {showApplicantClassification && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Applicant Classification</p>
                {radioOptions(index, "internal", entry.is_internal)}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">
                Is this item part of Government Service?
              </p>
              {radioOptions(index, "government", entry.is_govt_service)}
            </div>
          </div>
        </div>
      )}
    />
  );
}
