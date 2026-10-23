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
import { getToday, isFutureDate } from "../../utils/dateUtils";

// "SKILLS TEST/PRACTICAL EXAM" and "OTHERS" were removed
const ELIGIBILITY_OPTIONS = [
  "CAREER SERVICE PROFESSIONAL",
  "CAREER SERVICE SUBPROFESSIONAL",
  "RA 1080 (BOARD/BAR)",
  "PD 907",
];

// Eligibilities that do NOT use these fields. Add a type here to hide
// Rating / License Number for it.
const NO_RATING = ["PD 907"];
const NO_LICENSE = ["PD 907"];

const needsRating = (entry) => !NO_RATING.includes(entry.eligibility_type);
const needsLicense = (entry) => !NO_LICENSE.includes(entry.eligibility_type);

const NotApplicable = () => (
  <span className="block py-2 text-center text-gray-300">—</span>
);

const makeRow = (groupId, placeOfExam = "") => ({
  group_id: groupId,
  eligibility_type: "",
  rating: "",
  date_of_exam: "",
  place_of_exam: placeOfExam,
  license_number: "",
});

// PD 907 asks for the date of graduation instead of the date of exam.
// The stored field is still `date_of_exam`, so the backend does not change.
const isPD907 = (entry) => entry.eligibility_type === "PD 907";

export default function CivilServiceEligibilityForm({ data, onChange }) {
  const list = Array.isArray(data) ? data : [];

  const emit = (next) => {
    if (typeof onChange === "function") onChange(next);
  };

  const updateRow = (index, patch) =>
    emit(list.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const groups = buildGroups(list, "place_of_exam");

  const columns = [
    {
      key: "eligibility_type",
      label: "Eligibility Type",
      required: true,
      className: "w-72",
      render: (entry, index) => (
        <select
          value={entry.eligibility_type || ""}
          onChange={(e) => {
            const eligibility_type = e.target.value;
            updateRow(index, {
              eligibility_type,
              // Clear values the chosen eligibility does not use
              ...(NO_RATING.includes(eligibility_type) ? { rating: "" } : {}),
              ...(NO_LICENSE.includes(eligibility_type)
                ? { license_number: "" }
                : {}),
            });
          }}
          className={tableInput}
        >
          <option value="">-- Select Eligibility --</option>
          {ELIGIBILITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      className: "w-32",
      // Hidden when every row in this table is an eligibility without rating
      hidden: (rows) => !rows.some(needsRating),
      render: (entry, index) =>
        !needsRating(entry) ? (
          <NotApplicable />
        ) : (
        <input
          type="number"
          step="0.01"
          value={entry.rating || ""}
          placeholder="e.g. 81.25"
          onChange={(e) => updateRow(index, { rating: e.target.value })}
          className={tableInput}
        />
        ),
    },
    {
      key: "date_of_exam",
      // Header says "Date of Exam" normally and "Date of Graduation" when
      // every row in the table is PD 907. Mixed rows get a caption per row.
      label: (rows) => {
        const pd = rows.filter(isPD907).length;
        if (pd === 0) return "Date of Exam";
        if (pd === rows.length) return "Date of Graduation";
        return "Date of Exam / Graduation";
      },
      className: "w-52",
      render: (entry, index, rows) => (
        <div>
          <input
            type="date"
            value={entry.date_of_exam || ""}
            max={getToday()}
            onChange={(e) => {
              // Cannot pick a date after today
              if (isFutureDate(e.target.value)) return;
              updateRow(index, { date_of_exam: e.target.value });
            }}
            className={tableInput}
          />
          {rows.some(isPD907) && !rows.every(isPD907) && (
            <p className="mt-1 text-[11px] leading-tight text-gray-500">
              {isPD907(entry) ? "Date of Graduation" : "Date of Exam"}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "license_number",
      label: "License Number",
      className: "w-48",
      hidden: (rows) => !rows.some(needsLicense),
      render: (entry, index) =>
        !needsLicense(entry) ? (
          <NotApplicable />
        ) : (
        <input
          type="text"
          value={entry.license_number || ""}
          placeholder="—"
          onChange={(e) => updateRow(index, { license_number: e.target.value })}
          className={tableInput}
        />
        ),
    },
  ];

  return (
    <GroupedRowsTable
      number={5}
      title="Civil Service Eligibility"
      subheader="Eligibility Records"
      subheaderRequired
      addLabel="Add Eligibility"
      emptyText='Click "Add Place of Exam" to add civil service eligibility'
      groups={groups}
      // PD 907 is a school-based eligibility, so the shared field asks for the
      // school instead of the place of exam. Other types stay "Place of Exam".
      groupLabel={(rows) => {
        const pd = rows.filter(isPD907).length;
        if (pd === 0) return "Place of Exam";
        if (pd === rows.length) return "School / University";
        return "Place of Exam / School";
      }}
      groupPlaceholder={(rows) =>
        rows.length > 0 && rows.every(isPD907)
          ? "Name of school / university"
          : rows.some(isPD907)
            ? "City/Province or school"
            : "City/Province"
      }
      columns={columns}
      minTableWidth="min-w-[520px]"
      onGroupChange={(groupId, value) =>
        emit(setGroupValue(list, groupId, "place_of_exam", value))
      }
      onAddGroup={() => emit(addGroupRow(list, makeRow))}
      onAddRow={(groupId) =>
        emit(addRowToGroup(list, groupId, "place_of_exam", makeRow))
      }
      onRemoveRow={(index) => emit(removeRowAt(list, index))}
      onRemoveGroup={(groupId) => emit(removeGroupById(list, groupId))}
    />
  );
}