import React from "react";

export default function ScoreSummary({
  initialScreeningTotal,
  assessmentTotal,
  combinedTotal,
  submitting,
  onSubmit,
}) {
  return (
    <div className="mt-6 ml-auto max-w-sm rounded-xl bg-white p-6 shadow-sm">
      <div className="flex justify-between py-2">
        <span>Initial Screening</span>
        <strong>{initialScreeningTotal.toFixed(2)}</strong>
      </div>

      <div className="flex justify-between py-2">
        <span>Assessment</span>
        <strong>{assessmentTotal.toFixed(2)}</strong>
      </div>

      <div className="my-2 border-t" />

      <div className="flex justify-between text-lg font-bold">
        <span>Combined Total</span>
        <span>{combinedTotal.toFixed(2)}</span>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Assessment"}
      </button>
    </div>
  );
}