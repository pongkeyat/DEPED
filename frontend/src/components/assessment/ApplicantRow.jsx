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
  const applicantId =
    item?.applicant_id ||
    item?.job_applications_id ||
    "";

  const details = applicantDetails?.[applicantId] || item || {};

  // ============================================================
  // GET APPLICANT NAME
  // ============================================================
  const applicantName =
    `${details?.first_name || item?.first_name || ""} ${
      details?.middle_name || item?.middle_name || ""
    } ${details?.last_name || item?.last_name || ""}`
      .replace(/\s+/g, " ")
      .trim() || "Unnamed Applicant";

  // ============================================================
  // DETERMINE CATEGORY
  // ============================================================
  const positionTitle = String(
    details?.position_title ||
      item?.position_title ||
      details?.position ||
      item?.position ||
      details?.vacancy?.position_title ||
      item?.vacancy?.position_title ||
      ""
  )
    .trim()
    .toUpperCase();

  const category = String(
    details?.category ||
      item?.category ||
      details?.position_category ||
      item?.position_category ||
      details?.vacancy_category ||
      item?.vacancy_category ||
      details?.vacancy?.category ||
      item?.vacancy?.category ||
      ""
  )
    .trim()
    .toUpperCase();

  // Teacher I is identified either by position title
  // or by a category containing TEACH.
  const isTeacherI =
    positionTitle === "TEACHER I" ||
    category.includes("TEACH");

  const applicantCategory = isTeacherI
    ? "Teaching"
    : "Non-Teaching";

  // ============================================================
  // INITIAL SCREENING SCORE
  // ============================================================
  const getInitialScreeningScore = (criterionName) => {
    const name = String(criterionName || "")
      .trim()
      .toUpperCase();

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

  // ============================================================
  // INITIAL SCREENING QUALIFICATION
  // ============================================================
  const getInitialScreeningQualification = (criterionName) => {
    const name = String(criterionName || "")
      .trim()
      .toUpperCase();

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

  // ============================================================
  // INITIAL SCREENING TOTAL
  // ============================================================
  const initialScreeningTotal =
    getInitialScreeningScore("Education") +
    getInitialScreeningScore("Training") +
    getInitialScreeningScore("Experience");

  // ============================================================
  // ASSESSMENT TOTAL
  // Only dropdown/text criteria are actual assessment criteria.
  // ============================================================
  const assessmentTotal = criteria
    .filter(
      (criterion) =>
        criterion.type === "dropdown" ||
        criterion.type === "text"
    )
    .reduce(
      (sum, criterion) =>
        sum + Number(scores?.[criterion.id] || 0),
      0
    );

  // ============================================================
  // GRAND TOTAL
  // ============================================================
  const combinedTotal =
    initialScreeningTotal + assessmentTotal;

  // ============================================================
  // MAXIMUM ASSESSMENT SCORE
  // ============================================================
  const assessmentMax = 70;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50">

      {/* ======================================================
          NAME + CATEGORY
      ====================================================== */}
      <td className="sticky left-0 z-10 min-w-[240px] bg-white px-4 py-4 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">

        <div className="font-medium text-gray-900">
          {applicantName}
        </div>

        <div className="mt-1 text-xs font-medium text-blue-600">
          {applicantCategory}
        </div>

        <div className="text-xs text-gray-400">
          {positionTitle || "No Position"}
        </div>

      </td>

      {/* ======================================================
          DYNAMIC CRITERIA
      ====================================================== */}
      {criteria.map((criterion) => {

        // ------------------------------------------------------
        // INITIAL SCREENING
        // ------------------------------------------------------
        if (criterion.type === "initial") {
          const pts = getInitialScreeningScore(
            criterion.name
          );

          const qual =
            getInitialScreeningQualification(
              criterion.name
            );

          return (
            <td
              key={criterion.id}
              className="min-w-[160px] px-4 py-4 text-center text-sm text-gray-600"
            >
              <span className="font-semibold text-gray-900">
                {pts}
              </span>

              {qual && (
                <span className="block text-xs text-gray-400">
                  {qual}
                </span>
              )}
            </td>
          );
        }

        // ------------------------------------------------------
        // MANUAL / TEXT SCORE
        // ------------------------------------------------------
        if (criterion.type === "text") {
          return (
            <td
              key={criterion.id}
              className="min-w-[180px] px-4 py-4"
            >
              <input
                type="number"
                min="0"
                max={criterion.max}
                step="0.01"
                value={scores?.[criterion.id] ?? ""}
                onChange={(e) =>
                  onScoreChange(
                    applicantId,
                    criterion.id,
                    e.target.value
                  )
                }
                placeholder={`0 - ${criterion.max}`}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />

              {criterion.max !== undefined && (
                <div className="mt-1 text-xs text-gray-400">
                  Maximum: {criterion.max}
                </div>
              )}
            </td>
          );
        }

        // ------------------------------------------------------
        // DROPDOWN SCORE
        // ------------------------------------------------------
        return (
          <td
            key={criterion.id}
            className="min-w-[180px] px-4 py-4"
          >
            <select
              value={scores?.[criterion.id] ?? ""}
              onChange={(e) =>
                onScoreChange(
                  applicantId,
                  criterion.id,
                  e.target.value
                )
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">
                Select Score
              </option>

              {criterion.options?.map((opt) => (
                <option
                  key={
                    opt.optionId ||
                    opt.value
                  }
                  value={opt.value}
                >
                  {opt.label}
                </option>
              ))}
            </select>

            {criterion.max !== undefined && (
              <div className="mt-1 text-xs text-gray-400">
                Maximum: {criterion.max}
              </div>
            )}
          </td>
        );
      })}

      {/* ======================================================
          INITIAL SCREENING TOTAL
      ====================================================== */}
      <td className="min-w-[120px] bg-gray-50 px-4 py-4 text-center text-sm font-semibold text-gray-700">
        {initialScreeningTotal}
        <span className="block text-xs font-normal text-gray-400">
          / 30
        </span>
      </td>

      {/* ======================================================
          ASSESSMENT TOTAL
      ====================================================== */}
      <td className="min-w-[120px] px-4 py-4 text-center text-sm font-semibold text-blue-600">
        {assessmentTotal}
        <span className="block text-xs font-normal text-gray-400">
          / {assessmentMax}
        </span>
      </td>

      {/* ======================================================
          GRAND TOTAL
      ====================================================== */}
      <td className="min-w-[130px] px-4 py-4 text-center text-sm font-bold text-gray-900">
        {combinedTotal}
        <span className="block text-xs font-normal text-gray-400">
          / 100
        </span>
      </td>

      {/* ======================================================
          SUBMISSION STATUS
      ====================================================== */}
      <td className="min-w-[120px] px-4 py-4 text-center text-sm font-semibold">
        {submittedRank ? (
          <span className="text-green-700">
            Rank #{submittedRank}
          </span>
        ) : (
          <span className="text-gray-400">
            Pending
          </span>
        )}
      </td>

      {/* ======================================================
          ACTION
      ====================================================== */}
      <td className="min-w-[140px] px-4 py-4 text-right">
        <button
          onClick={() => onAssess(item)}
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Submitting..."
            : "Submit Score"}
        </button>
      </td>
    </tr>
  );
}