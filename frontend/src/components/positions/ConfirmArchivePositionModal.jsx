import { Archive } from "lucide-react";

const ConfirmArchivePositionModal = ({
    position,
    archiving,
    onCancel,
    onConfirm,
}) => {
    if (!position) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Archive size={22} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                    Archive Position
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                    Are you sure you want to archive{" "}
                    <span className="font-semibold text-gray-900">
                        {position.position_title}
                    </span>
                    ? This position will be marked as archived and will remain in the database for historical records.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={archiving}
                        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={archiving}
                        className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {archiving ? "Archiving..." : "Confirm Archive"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmArchivePositionModal;
