import React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export default function ActionModal({ 
  isOpen, 
  type = "confirm", // "confirm" or "error"
  title, 
  message, 
  onConfirm, 
  onClose 
}) {
  if (!isOpen) return null;

  const isError = type === "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header Icon & Close button */}
        <div className="flex justify-between items-center mb-4">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
            isError ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"
          }`}>
            {isError ? <AlertCircle size={22} /> : <CheckCircle2 size={22} />}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>

        {/* Actions / Buttons */}
        {isError ? (
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#1E3E74] py-2.5 font-semibold text-white hover:bg-[#17325e] transition-colors shadow-md"
          >
            Close
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              No
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 transition-colors shadow-md"
            >
              Yes, Confirm
            </button>
          </div>
        )}

      </div>
    </div>
  );
}