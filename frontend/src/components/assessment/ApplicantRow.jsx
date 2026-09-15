import React from "react";

export default function ApplicantRow({
  item,
  applicantDetails,
  criteria,
  scores,
  submittedRank,
  onScoreChange,
  onAssess,
  isSubmitting,
}) {
  const applicantId = item?.applicant_id || item?.job_applications_id || "";
  
  const applicantName =
    `${item?.first_name || ""} ${item?.middle_name || ""} ${item?.last_name || ""}`
      .replace(/\s+/g, " ")
      .trim() || "Unnamed Applicant";

  const getInitialScreeningScore = (criterionName) => {
    const details = applicantDetails[applicantId] || item;
    const name = criterionName?.toUpperCase();

    if (name === "EDUCATION") {
      return Number(
        details?.education_points ??
          details?.education?.points ??
          details?.initial_screening?.education?.points ??
          0
      );
    }
    if (name === "TRAINING") {
      return Number(
        details?.training_points ??
          details?.training?.points ??
          details?.initial_screening?.training?.points ??
          0
      );
    }
    if (name === "EXPERIENCE") {
      return Number(
        details?.experience_points ??
          details?.experience?.points ??
          details?.initial_screening?.experience?.points ??
          0
      );
    }
    return 0;
  };

  const getInitialScreeningQualification = (criterionName) => {
    const details = applicantDetails[applicantId] || item;
    const name = criterionName?.toUpperCase();

    if (name === "EDUCATION") {
      return (
        details?.education_qualification ||
        details?.education?.qualification ||
        details?.initial_screening?.education?.qualification ||
        ""
      );
    }
    if (name === "TRAINING") {
      return (
        details?.training_qualification ||
        details?.training?.qualification ||
        details?.initial_screening?.training?.qualification ||
        ""
      );
    }
    if (name === "EXPERIENCE") {
      return (
        details?.experience_qualification ||
        details?.experience?.qualification ||
        details?.initial_screening?.experience?.qualification ||
        ""
      );
    }
    return "";
  };

  const assessmentTotal = criteria
    .filter((c) => c.type === "dropdown" || c.type === "text")
    .reduce((sum, c) => sum + Number(scores[c.id] || 0), 0);

  const combinedTotal =
    getInitialScreeningScore("Education") +
    getInitialScreeningScore("Training") +
    getInitialScreeningScore("Experience") +
    assessmentTotal;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50">
      {/* Name */}
      <td className="sticky left-0 z-10 bg-white px-4 py-4 font-medium text-gray-900 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
        {applicantName}
      </td>

      {/* Dynamic Criteria Columns */}
      {criteria.map((criterion) => {
        if (criterion.type === "initial") {
          const pts = getInitialScreeningScore(criterion.name);
          const qual = getInitialScreeningQualification(criterion.name);
          return (
            <td key={criterion.id} className="px-4 py-4 text-center text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{pts}</span>
              {qual && <span className="block text-xs text-gray-400">{qual}</span>}
            </td>
          );
        }

        if (criterion.type === "text") {
          return (
            <td key={criterion.id} className="px-4 py-4 min-w-[180px]">
              <input
                type="text"
                inputMode="decimal"
                value={scores[criterion.id] ?? ""}
                onChange={(e) =>
                  onScoreChange(applicantId, criterion.id, e.target.value)
                }
                placeholder="Enter score"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </td>
          );
        }

        return (
          <td key={criterion.id} className="px-4 py-4 min-w-[180px]">
            <select
              value={scores[criterion.id] ?? ""}
              onChange={(e) => onScoreChange(applicantId, criterion.id, e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select Score</option>
              {criterion.options?.map((opt) => (
                <option key={opt.optionId || opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </td>
        );
      })}

      {/* Assessment Subtotal */}
      <td className="px-4 py-4 text-center text-sm font-semibold text-blue-600">
        {assessmentTotal}
      </td>

      {/* Combined Grand Total */}
      <td className="px-4 py-4 text-center text-sm font-bold text-gray-900">
        {combinedTotal}
      </td>

      {/* Submission status */}
      <td className="px-4 py-4 text-center text-sm font-semibold">
        {submittedRank ? (
          <span className="text-green-700">Rank #{submittedRank}</span>
        ) : (
          <span className="text-gray-400">Pending</span>
        )}
      </td>

      {/* Action */}
      <td className="px-4 py-4 text-right">
        <button
          onClick={() => onAssess(item)}
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Score"}
        </button>
      </td>
    </tr>
  );
}