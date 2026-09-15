import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function EvaluationSection({ title, icon: Icon, isPass, children }) {
  return (
    <div className="rounded-3xl bg-white shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#1E3E74] flex items-center gap-2">
          {Icon && <Icon size={22} />} {title}
        </h2>
        {isPass ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full shadow-sm">
            <CheckCircle size={14} /> Pass
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 font-bold text-xs rounded-full shadow-sm">
            <XCircle size={14} /> Fail
          </span>
        )}
      </div>
      {children}
    </div>
  );
}