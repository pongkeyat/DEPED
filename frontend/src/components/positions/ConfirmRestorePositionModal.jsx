
import { RotateCcw, X, AlertCircle } from "lucide-react";

const ConfirmRestorePositionModal = ({
    position,
    restoring = false,
    onCancel,
    onConfirm,
}) => {
    if (!position) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Confirm Restore
                    </h2>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={restoring}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                        aria-label="Close confirmation"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                            <RotateCcw size={23} />
                        </div>

                        <div>
                            <p className="font-medium text-gray-900">
                                Restore this position?
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                {position.position_title}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0 text-amber-600"
                        />

                        <p className="text-sm leading-relaxed text-amber-800">
                            This position will be changed from Archived to
                            Active and will become available for normal
                            position management again.
                        </p>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={restoring}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={restoring}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RotateCcw size={16} />
                        {restoring ? "Restoring..." : "Confirm Restore"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmRestorePositionModal;
