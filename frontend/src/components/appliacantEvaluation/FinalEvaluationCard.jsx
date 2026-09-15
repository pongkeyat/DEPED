import React from "react";
import { ShieldCheck, CheckCircle, XCircle, UserCheck, UserX } from "lucide-react";

export default function FinalEvaluationCard({ overallPass, remarks, actionLoading, onHandleAction }) {
  return (
    <div className="rounded-3xl bg-blue-50/50 border border-blue-100 shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1E3E74] flex items-center gap-2">
          <ShieldCheck size={20} /> Final Evaluation & Notes
        </h2>
        {overallPass ? (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-full shadow">
            <CheckCircle size={15} /> OVERALL: PASS
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-full shadow">
            <XCircle size={15} /> OVERALL: FAIL
          </span>
        )}
      </div>

      {remarks && (
        <p className="text-slate-600 text-sm whitespace-pre-wrap border-t border-blue-100/60 pt-3">
          {remarks}
        </p>
      )}

      <div className="pt-3 border-t border-blue-100/60 flex flex-col">
        <button
          onClick={onHandleAction}
          disabled={actionLoading}
          className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold text-sm shadow-sm transition-all duration-200 ${
            overallPass 
              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200" 
              : "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200"
          }`}
        >
          {overallPass ? (
            <>
              <UserCheck size={18} /> Mark as Qualified
            </>
          ) : (
            <>
              <UserX size={18} /> Mark as Disqualified
            </>
          )}
        </button>
      </div>
    </div>
  );
}