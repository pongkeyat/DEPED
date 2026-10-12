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
});

export default function WorkExperienceForm({ data, onChange }) {
  const list = Array.isArray(data) ? data : [];

  const emit = (next) => {
    if (typeof onChange === "function") onChange(next);
  };

  const updateRow = (index, patch) =>
    emit(list.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  // Date To can't be earlier than Date From
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

  const groups = buildGroups(list, "company_office");

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
      onAddRow={(groupId) =>
        emit(addRowToGroup(list, groupId, "company_office", makeRow))
      }
      onRemoveRow={(index) => emit(removeRowAt(list, index))}
      onRemoveGroup={(groupId) => emit(removeGroupById(list, groupId))}
      renderRow={(entry, index) => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* POSITION TITLE */}
            <div className="md:col-span-3 space-y-1">
              <label className={fieldLabel}>
                Position Title<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={entry.position_title || ""}
                onChange={(e) =>
                  updateRow(index, { position_title: e.target.value })
                }
                placeholder="ADMINISTRATIVE OFFICER"
                className={fieldInput}
              />
            </div>

            {/* DATE FROM */}
            <div className="md:col-span-2 space-y-1">
              <label className={fieldLabel}>Date From</label>
              <input
                type="date"
                value={entry.date_from || ""}
                onChange={(e) => handleDateFromChange(index, e.target.value)}
                className={fieldInput}
              />
            </div>

            {/* DATE TO */}
            <div className="md:col-span-2 space-y-1">
              <label className={fieldLabel}>Date To</label>
              <input
                type="date"
                value={entry.date_to || ""}
                min={entry.date_from || undefined}
                onChange={(e) => handleDateToChange(index, e.target.value)}
                className={fieldInput}
              />
            </div>

            {/* MONTHLY SALARY */}
            <div className="md:col-span-2 space-y-1">
              <label className={fieldLabel}>Monthly Salary</label>
              <input
                type="number"
                value={entry.monthly_salary || ""}
                onChange={(e) =>
                  updateRow(index, { monthly_salary: e.target.value })
                }
                placeholder="30000"
                className={fieldInput}
              />
            </div>

            {/* APPOINTMENT STATUS */}
            <div className="md:col-span-3 space-y-1">
              <label className={fieldLabel}>Appointment Status</label>
              <select
                value={entry.appointment_status || ""}
                onChange={(e) =>
                  updateRow(index, { appointment_status: e.target.value })
                }
                className={fieldInput}
              >
                <option value="" disabled>
                  Select status...
                </option>
                <option value="Permanent">Permanent</option>
                <option value="Contract of Service">Contract of Service</option>
                <option value="Regular">Regular</option>
              </select>
            </div>
          </div>

          {/* GOVERNMENT SERVICE */}
          <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-3.5 space-y-2">
            <p className="text-xs font-semibold text-gray-700">
              Is this item part of Government Service?
            </p>

            <div className="flex gap-6">
              {[
                { label: "Yes", value: "true", checked: entry.is_govt_service === true },
                { label: "No", value: "false", checked: entry.is_govt_service === false },
                { label: "Not Specified", value: "null", checked: entry.is_govt_service === null },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`is_govt_service_${index}`}
                    value={option.value}
                    checked={option.checked}
                    onChange={(e) => handleRadioChange(index, e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  );
}