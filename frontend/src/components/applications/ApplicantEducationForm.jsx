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

const makeRow = (groupId, schoolName = "") => ({
  group_id: groupId,
  level: "",
  school_name: schoolName,
  degree_course: "",
  honors_awards: "",
  date_of_recognition: "",
  date_of_graduation: "",
  units: "",
  graduation_status: "",
});

// Master's and Doctorate require graduation status and units.
const requiresUnits = (level) =>
  level === "MASTER'S DEGREE" || level === "DOCTORATE DEGREE";

// Elementary and Secondary use date of recognition.
const requiresRecognitionDate = (level) =>
  level === "ELEMENTARY" || level === "SECONDARY";

// Vocational and Bachelor's use date of graduation.
const requiresGraduationDate = (level) =>
  level === "VOCATIONAL" || level === "BACHELOR'S DEGREE";

export default function ApplicantEducationForm({ data, onChange }) {
  const list = Array.isArray(data?.educationList) ? data.educationList : [];

  const emit = (next) => onChange("educationList", next);

  const updateRow = (index, patch) =>
    emit(list.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const groups = buildGroups(list, "school_name");

  const columns = [
    {
      key: "level",
      label: "Level",
      required: true,
      className: "w-44",
      render: (edu, index) => (
        <select
          required
          value={edu.level || ""}
          onChange={(e) => {
            const level = e.target.value;
            const needsUnits = requiresUnits(level);

            updateRow(index, {
              level,
              graduation_status: needsUnits
                ? edu.graduation_status || ""
                : "",
              units: needsUnits ? edu.units ?? "" : "",
            });
          }}
          className={tableInput}
        >
          <option value="">-- Select Level --</option>
          <option value="ELEMENTARY">ELEMENTARY</option>
          <option value="SECONDARY">SECONDARY / HIGH SCHOOL</option>
          <option value="VOCATIONAL">VOCATIONAL / TECHNICAL</option>
          <option value="BACHELOR'S DEGREE">BACHELOR'S DEGREE</option>
          <option value="MASTER'S DEGREE">MASTER'S DEGREE</option>
          <option value="DOCTORATE DEGREE">DOCTORATE DEGREE</option>
        </select>
      ),
    },
    {
      key: "degree_course",
      label: "Degree / Course",
      className: "w-44",
      render: (edu, index) => (
        <input
          type="text"
          value={edu.degree_course || ""}
          onChange={(e) =>
            updateRow(index, { degree_course: e.target.value })
          }
          placeholder="Enter degree/course"
          className={tableInput}
        />
      ),
    },
    {
      key: "honors_awards",
      label: "Honors / Awards",
      className: "w-40",
      render: (edu, index) => (
        <input
          type="text"
          value={edu.honors_awards || ""}
          onChange={(e) =>
            updateRow(index, { honors_awards: e.target.value })
          }
          placeholder="Enter honors or awards"
          className={tableInput}
        />
      ),
    },
    {
      key: "education_date",
      label: "Date of Recognition / Graduation",
      className: "w-52",
      hidden: (rows) =>
        !rows.some(
          (row) =>
            requiresRecognitionDate(row.level) ||
            requiresGraduationDate(row.level)
        ),
      render: (edu, index) => {
        if (requiresRecognitionDate(edu.level)) {
          return (
            <input
              type="date"
              value={edu.date_of_recognition || ""}
              onChange={(e) =>
                updateRow(index, {
                  date_of_recognition: e.target.value,
                })
              }
              aria-label="Date of recognition"
              className={tableInput}
            />
          );
        }

        if (requiresGraduationDate(edu.level)) {
          return (
            <input
              type="date"
              value={edu.date_of_graduation || ""}
              onChange={(e) =>
                updateRow(index, {
                  date_of_graduation: e.target.value,
                })
              }
              aria-label="Date of graduation"
              className={tableInput}
            />
          );
        }

        return (
          <span className="block py-2 text-center text-gray-300">
            —
          </span>
        );
      },
    },
    {
      key: "graduation_status",
      label: "Graduation Status",
      className: "w-44",
      hidden: (rows) => !rows.some((row) => requiresUnits(row.level)),
      render: (edu, index) =>
        requiresUnits(edu.level) ? (
          <select
            required
            value={edu.graduation_status || ""}
            onChange={(e) => {
              const status = e.target.value;

              updateRow(index, {
                graduation_status: status,
                // Default to 48 when Graduated, but preserve an
                // existing user-entered value when switching back.
                units:
                  status === "Graduated"
                    ? edu.units === "" ||
                      edu.units === null ||
                      edu.units === undefined
                      ? "48"
                      : edu.units
                    : edu.units ?? "",
              });
            }}
            className={tableInput}
          >
            <option value="">-- Select Status --</option>
            <option value="Graduated">Graduated</option>
            <option value="Ongoing">Ongoing</option>
          </select>
        ) : (
          <span className="block py-2 text-center text-gray-300">
            —
          </span>
        ),
    },
    {
      key: "units",
      label: "Units Earned",
      className: "w-36",
      hidden: (rows) => !rows.some((row) => requiresUnits(row.level)),
      render: (edu, index) => {
        if (!requiresUnits(edu.level)) {
          return (
            <span className="block py-2 text-center text-gray-300">
              —
            </span>
          );
        }

        return (
          <input
            type="number"
            min="0"
            step="0.01"
            required={
              edu.graduation_status === "Graduated" ||
              edu.graduation_status === "Ongoing"
            }
            value={edu.units ?? ""}
            onChange={(e) =>
              updateRow(index, { units: e.target.value })
            }
            placeholder="Units"
            className={tableInput}
          />
        );
      },
    },
  ];

  return (
    <GroupedRowsTable
      number={3}
      title="Background Information"
      subheader="Highest Educational Attainment"
      addLabel="Add Education"
      emptyText='Click "Add School/University" to add your education'
      groups={groups}
      groupLabel="School / University"
      groupPlaceholder="Enter school/university"
      groupRequired
      minRows={1}
      columns={columns}
      minTableWidth="min-w-[640px]"
      onGroupChange={(groupId, value) =>
        emit(setGroupValue(list, groupId, "school_name", value))
      }
      onAddGroup={() => emit(addGroupRow(list, makeRow))}
      onAddRow={(groupId) =>
        emit(addRowToGroup(list, groupId, "school_name", makeRow))
      }
      onRemoveRow={(index) => emit(removeRowAt(list, index))}
      onRemoveGroup={(groupId) => emit(removeGroupById(list, groupId))}
    />
  );
}
