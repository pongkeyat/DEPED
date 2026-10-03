import React from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

const modalStyles = {
  confirm: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
    confirmClass: "bg-emerald-700 hover:bg-emerald-800",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
    confirmClass: "bg-emerald-700 hover:bg-emerald-800",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-500",
    confirmClass: "bg-amber-600 hover:bg-amber-700",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-600",
    confirmClass: "bg-red-600 hover:bg-red-700",
  },
};

export default function ActionModal({
  isOpen,
  type = "info",
  title,
  message,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  const style = modalStyles[type] || {
    icon: Info,
    iconClass: "text-blue-600",
    confirmClass: "bg-blue-700 hover:bg-blue-800",
  };
  const Icon = style.icon;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="action-modal-title"
        aria-describedby="action-modal-message"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <Icon size={28} className={`mt-0.5 shrink-0 ${style.iconClass}`} />
          <div className="min-w-0 flex-1">
            <h2 id="action-modal-title" className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            <p id="action-modal-message" className="mt-2 whitespace-pre-line text-sm text-slate-600">
              {message}
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {onConfirm && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm || onClose}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white ${style.confirmClass}`}
          >
            {onConfirm ? "Confirm" : "Close"}
          </button>
        </div>
      </section>
    </div>
  );
}
