import React from "react";
import GroupedRowsCard, {
  fieldLabel,
  fieldInput,
} from "./GroupedRowsCard";

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
  units: "",
  graduation_status: "",
});

// Units and graduation status are only asked for Master's / Doctorate.
const requiresUnits = (level) =>
  level === "MASTER'S DEGREE" || level === "DOCTORATE DEGREE";

export default function ApplicantEducationForm({ data, onChange }) {
  const list = Array.isArray(data?.educationList)
    ? data.educationList
    : [];

  const emit = (next) => onChange("educationList", next);

  const updateRow = (index, patch) =>
    emit(
      list.map((row, i) =>
        i === index ? { ...row, ...patch } : row
      )
    );

  const groups = buildGroups(list, "school_name");

  return (
    <GroupedRowsCard
      number={3}
      title="Background Information"
      subheader="Highest Educational Attainment"
      addLabel="Add Education"
      emptyText='Click "Add School/University" to add your education'
      groups={groups}
      groupLabel="School / University"
      groupPlaceholder="Enter school/university"
      groupRequired
      rowLabel="Education"
      minRows={1}
      onGroupChange={(groupId, value) =>
        emit(setGroupValue(list, groupId, "school_name", value))
      }
      onAddGroup={() => emit(addGroupRow(list, makeRow))}
      onAddRow={(groupId) =>
        emit(addRowToGroup(list, groupId, "school_name", makeRow))
      }
      onRemoveRow={(index) => emit(removeRowAt(list, index))}
      onRemoveGroup={(groupId) =>
        emit(removeGroupById(list, groupId)
        )
      }
      renderRow={(edu, index) => (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* EDUCATIONAL LEVEL */}
          <div className="md:col-span-3 space-y-1">
            <label className={fieldLabel}>
              Level<span className="text-red-500">*</span>
            </label>

            <select
              required
              value={edu.level || ""}
              onChange={(e) => {
                const level = e.target.value;

                updateRow(index, {
                  level,
                  graduation_status: requiresUnits(level)
                    ? edu.graduation_status || ""
                    : "",
                  units: requiresUnits(level) ? edu.units || "" : "",
                });
              }}
              className={fieldInput}
            >
              <option value="">-- Select Educational Level --</option>
              <option value="ELEMENTARY">ELEMENTARY</option>
              <option value="SECONDARY">
                SECONDARY / HIGH SCHOOL
              </option>
              <option value="VOCATIONAL">
                VOCATIONAL / TECHNICAL
              </option>
              <option value="BACHELOR'S DEGREE">
                BACHELOR'S DEGREE
              </option>
              <option value="MASTER'S DEGREE">
                MASTER'S DEGREE
              </option>
              <option value="DOCTORATE DEGREE">
                DOCTORATE DEGREE
              </option>
            </select>
          </div>

          {/* DEGREE / COURSE */}
          <div className="md:col-span-4 space-y-1">
            <label className={fieldLabel}>Degree / Course</label>

            <input
              type="text"
              value={edu.degree_course || ""}
              onChange={(e) =>
                updateRow(index, {
                  degree_course: e.target.value,
                })
              }
              placeholder="Enter degree/course"
              className={fieldInput}
            />
          </div>

          {/* HONORS / AWARDS */}
          <div
            className={
              requiresUnits(edu.level)
                ? "md:col-span-3 space-y-1"
                : "md:col-span-5 space-y-1"
            }
          >
            <label className={fieldLabel}>
              Honors / Awards Received
            </label>

            <input
              type="text"
              value={edu.honors_awards || ""}
              onChange={(e) =>
                updateRow(index, {
                  honors_awards: e.target.value,
                })
              }
              placeholder="Enter honors or awards"
              className={fieldInput}
            />
          </div>

          {/* UNITS — MASTER'S / DOCTORATE ONLY */}
          {requiresUnits(edu.level) && (
            <>
              <div className="md:col-span-2 space-y-1">
                <label className={fieldLabel}>
                  Units Earned
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={edu.units ?? ""}
                  onChange={(e) =>
                    updateRow(index, {
                      units: e.target.value,
                    })
                  }
                  placeholder="Units"
                  className={fieldInput}
                />
              </div>

              {/* GRADUATION STATUS */}
              <div className="md:col-span-4 space-y-1">
                <label className={fieldLabel}>
                  Graduation Status
                  <span className="text-red-500">*</span>
                </label>

                <select
                  required
                  value={edu.graduation_status || ""}
                  onChange={(e) =>
                    updateRow(index, {
                      graduation_status: e.target.value,
                    })
                  }
                  className={fieldInput}
                >
                  <option value="">
                    -- Select Status --
                  </option>
                  <option value="Graduated">
                    Graduated
                  </option>
                  <option value="Ongoing">
                    Ongoing
                  </option>
                </select>
              </div>
            </>
          )}
        </div>
      )}
    />
  );
}
