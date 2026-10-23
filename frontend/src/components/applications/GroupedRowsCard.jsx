import React from "react";
import { CheckCircle2, Trash2 } from "lucide-react";

export const fieldLabel = "block text-xs font-semibold text-gray-700";
export const fieldInput =
  "w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

// Compact input used inside table cells
export const tableInput =
  "w-full h-9 px-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

/**
 * Table layout shared by Steps 3, 4, 5 and 6.
 *
 *   | #  | Column | Column | ... | action |
 *   | 1  | input  | input  | ... | trash  |
 *   [ Shared value (typed once) ...... + Add Row   delete group ]
 *
 * groups:  from buildGroups() -> [{ id, value, rows: [{ item, index }] }]
 * columns: [{ key, label, required?, className?, render(item, index) }]
 *          Return null from `hidden` to hide a column: { hidden: true }.
 */
export default function GroupedRowsTable({
  number,
  title,
  subheader,
  subheaderRequired = false,
  addLabel,
  emptyText,
  groups,
  groupLabel,
  groupPlaceholder = "",
  groupRequired = false,
  minRows = 0, // e.g. 1 = the last remaining row can't be deleted
  columns,
  minTableWidth = "min-w-[860px]",
  onGroupChange,
  onAddGroup,
  onAddRow,
  onRemoveRow,
  onRemoveGroup,
}) {
  const totalRows = groups.reduce((sum, g) => sum + g.rows.length, 0);
  const canRemoveRow = totalRows > minRows;
  const canRemoveGroup = minRows === 0 || groups.length > 1;

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden font-sans">
      {/* HEADER */}
      <div className="bg-[#1e4a8a] p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center bg-white/20 text-white font-semibold text-xs w-5 h-5 rounded-full">
            {number}
          </span>
          <h3 className="text-base font-semibold tracking-wide">{title}</h3>
        </div>
      </div>

      {/* SUBHEADER ACTION BAR */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 text-[#1e4a8a] font-medium text-sm">
          {subheader}
          {subheaderRequired && <span className="text-red-500">*</span>}
        </div>

        <button
          type="button"
          onClick={onAddGroup}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-600 rounded-lg text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
        >
          <span className="text-base font-bold leading-none">+</span>
          {addLabel}
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-6 bg-[#fcfdfd]">
        {groups.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl py-12 flex flex-col items-center justify-center text-center bg-gray-50/40">
            <CheckCircle2 size={24} className="text-gray-300 mb-2" />
            <p className="text-xs md:text-sm text-gray-500">{emptyText}</p>
          </div>
        ) : (
          groups.map((group, groupIndex) => {
            const groupItems = group.rows.map((r) => r.item);
            // groupLabel / groupPlaceholder can be text or a function of this group's rows
            const label =
              typeof groupLabel === "function" ? groupLabel(groupItems) : groupLabel;
            const placeholder =
              typeof groupPlaceholder === "function"
                ? groupPlaceholder(groupItems)
                : groupPlaceholder;
            // `hidden` can be true/false, or a function of this group's rows
            const visibleColumns = columns.filter((c) =>
              typeof c.hidden === "function" ? !c.hidden(groupItems) : !c.hidden
            );

            return (
            <div
              key={group.id}
              className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
            >
              {/* TABLE */}
              <div className="overflow-x-auto">
                <table className={`w-full border-collapse ${minTableWidth}`}>
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200">
                      <th className="w-10 px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                        #
                      </th>

                      {visibleColumns.map((col) => (
                        <th
                          key={col.key}
                          className={`px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 ${
                            col.className || ""
                          }`}
                        >
                          {typeof col.label === "function"
                            ? col.label(group.rows.map((r) => r.item))
                            : col.label}
                          {col.required && (
                            <span className="text-red-500"> *</span>
                          )}
                        </th>
                      ))}

                      <th className="w-12 px-2 py-2.5" />
                    </tr>
                  </thead>

                  <tbody>
                    {group.rows.map(({ item, index }, rowNumber) => (
                      <tr
                        key={`${group.id}-${rowNumber}`}
                        className="border-b border-gray-100 last:border-b-0 align-top"
                      >
                        <td className="px-3 py-3 text-center text-xs font-semibold text-[#1e4a8a]">
                          {rowNumber + 1}
                        </td>

                        {visibleColumns.map((col) => (
                          <td key={col.key} className="px-2 py-2.5">
                            {col.render(item, index, group.rows.map((r) => r.item))}
                          </td>
                        ))}

                        <td className="px-2 py-2.5 text-center">
                          {canRemoveRow && (
                            <button
                              type="button"
                              onClick={() => onRemoveRow(index)}
                              title="Remove this row"
                              aria-label="Remove this row"
                              className="h-9 w-9 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors inline-flex items-center justify-center"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SHARED VALUE (typed once per group) */}
              <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 border-t border-gray-200">
                <div className="flex-1 min-w-[240px] space-y-1">
                  <label className={fieldLabel}>
                    {label} #{groupIndex + 1}
                    {groupRequired && <span className="text-red-500"> *</span>}
                  </label>

                  <input
                    type="text"
                    value={group.value}
                    onChange={(e) => onGroupChange(group.id, e.target.value)}
                    placeholder={placeholder}
                    required={groupRequired}
                    className={fieldInput}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => onAddRow(group.id)}
                  className="h-10 flex items-center gap-1.5 px-3 border border-blue-600 rounded-lg text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
                >
                  <span className="text-base font-bold leading-none">+</span>
                  Add Row
                </button>

                {canRemoveGroup && (
                  <button
                    type="button"
                    onClick={() => onRemoveGroup(group.id)}
                    title={`Remove this ${label} and all of its rows`}
                    aria-label="Remove group"
                    className="h-10 w-10 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}