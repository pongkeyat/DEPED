import {
    AlertTriangle,
    X,
    RotateCcw,
    Loader2
} from "lucide-react";

const RestoreConfirmModal = ({
    backup,
    restoring,
    onCancel,
    onConfirm
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

                    <h2 className="font-semibold text-gray-800">
                        Confirm Database Restore
                    </h2>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={restoring}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* CONTENT */}

                <div className="px-6 py-5">

                    <div className="mb-4 flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">

                        <AlertTriangle
                            size={21}
                            className="mt-0.5 shrink-0 text-orange-600"
                        />

                        <div>

                            <p className="font-medium text-orange-800">
                                Warning
                            </p>

                            <p className="mt-1 text-sm leading-5 text-orange-700">
                                Restoring this backup will replace the
                                current database with the selected backup.
                            </p>

                        </div>

                    </div>

                    <p className="text-sm text-gray-600">
                        You are about to restore:
                    </p>

                    <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3">

                        <p className="break-all text-sm font-medium text-gray-800">
                            {backup.filename}
                        </p>

                    </div>

                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">

                        <p className="text-xs leading-5 text-green-700">
                            A safety backup of the current database will
                            automatically be created before restoration.
                        </p>

                    </div>

                </div>

                {/* FOOTER */}

                <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={restoring}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={restoring}
                        className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                        {restoring ? (
                            <>
                                <Loader2
                                    size={17}
                                    className="animate-spin"
                                />

                                Restoring...
                            </>
                        ) : (
                            <>
                                <RotateCcw size={17} />

                                Restore Database
                            </>
                        )}

                    </button>

                </div>

            </div>

        </div>
    );
};

export default RestoreConfirmModal;