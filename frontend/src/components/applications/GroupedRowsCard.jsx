import React from "react";
import { CheckCircle2, Trash2 } from "lucide-react";

export const fieldLabel = "block text-xs font-semibold text-gray-700";
export const fieldInput =
  "w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

/**
 * Card layout shared by Steps 3, 5 and 6 (same structure as Step 4):
 *
 *   [ row card ]
 *   [ row card ]
 *   [ Shared value (typed once) ........ + Add Row   delete group ]
 *
 * groups: from buildGroups() -> [{ id, value, rows: [{ item, index }] }]
 * renderRow(item, index) returns the fields of ONE row.
 */
export default function GroupedRowsCard({
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
  rowLabel,
  minRows = 0, // e.g. 1 = the last remaining row can't be deleted
  onGroupChange,
  onAddGroup,
  onAddRow,
  onRemoveRow,
  onRemoveGroup,
  renderRow,
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
          groups.map((group, groupIndex) => (
            <div
              key={group.id}
              className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
            >
              {/* ROWS */}
              <div className="p-4 space-y-4">
                {group.rows.map(({ item, index }, rowNumber) => (
                  <div
                    key={`${group.id}-${rowNumber}`}
                    className="rounded-xl border border-gray-200 bg-[#fcfdfd] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1e4a8a]">
                        {rowLabel} #{rowNumber + 1}
                      </span>

                      {canRemoveRow && (
                        <button
                          type="button"
                          onClick={() => onRemoveRow(index)}
                          title="Remove this row"
                          aria-label="Remove this row"
                          className="h-8 w-8 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {renderRow(item, index)}
                  </div>
                ))}
              </div>

              {/* SHARED VALUE (typed once per group) */}
              <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 border-t border-gray-200">
                <div className="flex-1 min-w-[240px] space-y-1">
                  <label className={fieldLabel}>
                    {groupLabel} #{groupIndex + 1}
                    {groupRequired && <span className="text-red-500"> *</span>}
                  </label>

                  <input
                    type="text"
                    value={group.value}
                    onChange={(e) => onGroupChange(group.id, e.target.value)}
                    placeholder={groupPlaceholder}
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
                    title={`Remove this ${groupLabel} and all of its rows`}
                    aria-label="Remove group"
                    className="h-10 w-10 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}