import React from "react";

export default function CriterionRow({
  criterion,
  currentScore,
  options = [],
  onOptionChange,
  onManualScoreChange,
}) {
  const id = criterion.assessment_criteria_id;
  const name = criterion.criterion_name?.toUpperCase();
  const isInitialScreening =
    name === "EDUCATION" || name === "TRAINING" || name === "EXPERIENCE";

  return (
    <tr className="border-t">
      <td className="px-6 py-4 font-medium">{criterion.criterion_name}</td>

      <td className="px-6 py-4">
        {isInitialScreening ? (
          <span className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-600">
            Auto-computed from Initial Screening
          </span>
        ) : criterion.is_manual ? (
          <input
            type="number"
            min="0"
            max={criterion.max_points}
            value={currentScore}
            onChange={(e) => onManualScoreChange(id, e.target.value)}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="Enter score"
          />
        ) : (
          <select
            value={currentScore?.assessment_option_id || ""}
            onChange={(e) => {
              const selected = options.find(
                (opt) => Number(opt.assessment_option_id) === Number(e.target.value)
              );
              onOptionChange(id, e.target.value, selected?.points || 0);
            }}
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="">-- Select --</option>
            {options.map((opt) => (
              <option key={opt.assessment_option_id} value={opt.assessment_option_id}>
                {opt.option_label}
              </option>
            ))}
          </select>
        )}
      </td>

      <td className="px-6 py-4 text-right font-semibold">
        {currentScore === "" || currentScore === undefined
          ? "--"
          : Number(typeof currentScore === "object" ? currentScore.score : currentScore).toFixed(2)}
        <span className="ml-1 text-xs font-normal text-gray-400">
          / {Number(criterion.max_points).toFixed(2)}
        </span>
      </td>
    </tr>
  );
}