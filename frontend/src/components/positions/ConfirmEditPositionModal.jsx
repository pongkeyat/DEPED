import React from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmEditPositionModal = ({
    position,
    saving,
    onCancel,
    onConfirm,
}) => {
    if (!position) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">

                {/* HEADER */}
                <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                        <AlertTriangle
                            size={20}
                            className="text-blue-600"
                        />
                    </div>

                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            Confirm Position Update
                        </h2>

                        <p className="text-xs text-gray-500">
                            Please review before submitting.
                        </p>
                    </div>
                </div>

                {/* BODY */}
                <div className="px-5 py-4">

                    <p className="text-sm text-gray-600">
                        Are you sure you want to update this position?
                    </p>

                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">

                        <div className="space-y-2 text-sm">

                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500">
                                    Position
                                </span>

                                <span className="text-right font-semibold text-gray-900">
                                    {position.position_title}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500">
                                    Salary Grade
                                </span>

                                <span className="font-medium text-gray-900">
                                    SG {position.salary_grade}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500">
                                    Category
                                </span>

                                <span className="font-medium text-gray-900">
                                    {position.category}
                                </span>
                            </div>

                        </div>

                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                        The changes will be saved once you click
                        <span className="font-semibold text-gray-700">
                            {" "}Confirm Update
                        </span>.
                    </p>

                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={saving}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? "Updating..." : "Confirm Update"}
                    </button>

                </div>

            </div>
        </div>
    );
};

export default ConfirmEditPositionModal;