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

// "SKILLS TEST/PRACTICAL EXAM" and "OTHERS" were removed
const ELIGIBILITY_OPTIONS = [
  "CAREER SERVICE PROFESSIONAL",
  "CAREER SERVICE SUBPROFESSIONAL",
  "RA 1080 (BOARD/BAR)",
  "PD 907",
];

const makeRow = (groupId, placeOfExam = "") => ({
  group_id: groupId,
  eligibility_type: "",
  rating: "",
  date_of_exam: "",
  place_of_exam: placeOfExam,
  license_number: "",
});

export default function CivilServiceEligibilityForm({ data, onChange }) {
  const list = Array.isArray(data) ? data : [];

  const emit = (next) => {
    if (typeof onChange === "function") onChange(next);
  };

  const updateRow = (index, patch) =>
    emit(list.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const groups = buildGroups(list, "place_of_exam");

  return (
    <GroupedRowsCard
      number={5}
      title="Civil Service Eligibility"
      subheader="Eligibility Records"
      subheaderRequired
      addLabel="Add Eligibility"
      emptyText='Click "Add Place of Exam" to add civil service eligibility'
      groups={groups}
      groupLabel="Place of Exam"
      groupPlaceholder="City/Province"
      rowLabel="Eligibility"
      onGroupChange={(groupId, value) =>
        emit(setGroupValue(list, groupId, "place_of_exam", value))
      }
      onAddGroup={() => emit(addGroupRow(list, makeRow))}
      onAddRow={(groupId) =>
        emit(addRowToGroup(list, groupId, "place_of_exam", makeRow))
      }
      onRemoveRow={(index) => emit(removeRowAt(list, index))}
      onRemoveGroup={(groupId) => emit(removeGroupById(list, groupId))}
      renderRow={(entry, index) => (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* ELIGIBILITY TYPE */}
          <div className="md:col-span-4 space-y-1">
            <label className={fieldLabel}>
              Eligibility Type <span className="text-red-500">*</span>
            </label>
            <select
              value={entry.eligibility_type || ""}
              onChange={(e) =>
                updateRow(index, { eligibility_type: e.target.value })
              }
              className={fieldInput}
            >
              <option value="">-- Select Eligibility --</option>
              {ELIGIBILITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* RATING */}
          <div className="md:col-span-2 space-y-1">
            <label className={fieldLabel}>Rating</label>
            <input
              type="number"
              step="0.01"
              value={entry.rating || ""}
              placeholder="e.g. 81.25"
              onChange={(e) => updateRow(index, { rating: e.target.value })}
              className={fieldInput}
            />
          </div>

          {/* DATE OF EXAM */}
          <div className="md:col-span-3 space-y-1">
            <label className={fieldLabel}>Date of Exam</label>
            <input
              type="date"
              value={entry.date_of_exam || ""}
              onChange={(e) =>
                updateRow(index, { date_of_exam: e.target.value })
              }
              className={fieldInput}
            />
          </div>

          {/* LICENSE NUMBER */}
          <div className="md:col-span-3 space-y-1">
            <label className={fieldLabel}>License Number</label>
            <input
              type="text"
              value={entry.license_number || ""}
              placeholder="—"
              onChange={(e) =>
                updateRow(index, { license_number: e.target.value })
              }
              className={fieldInput}
            />
          </div>
        </div>
      )}
    />
  );
}