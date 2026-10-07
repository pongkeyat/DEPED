import { Plus } from "lucide-react";

const ConfirmCreatePositionModal = ({
    position,
    saving,
    onCancel,
    onConfirm,
}) => {
    if (!position) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Plus size={22} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                    Add Position
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                    Are you sure you want to add this position?
                </p>
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Position</span>
                            <span className="text-right font-semibold text-gray-900">
                                {position.position_title}
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Salary Grade</span>
                            <span className="font-semibold text-gray-900">
                                SG {position.salary_grade}
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Category</span>
                            <span className="text-right font-semibold text-gray-900">
                                {position.category}
                            </span>
                        </div>
                    </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                    Please verify the position details before confirming. This will add the position to the system.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={saving}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Adding..." : "Confirm Add"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmCreatePositionModal;
