
const RestoreConfirmModal = ({
    backup,
    restoring,
    onCancel,
    onConfirm,
}) => {
    if (!backup) return null;

    const isUploadedFile = backup.source === "upload";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !restoring
                ) {
                    onCancel();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="restore-modal-title"
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    <svg
                        className="h-6 w-6 text-amber-700"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"
                        />
                    </svg>
                </div>

                <h2
                    id="restore-modal-title"
                    className="text-xl font-bold text-gray-900"
                >
                    Confirm Database Restore
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                    Are you sure you want to restore this database backup?
                    The operation may replace existing database objects
                    and data.
                </p>

                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {isUploadedFile
                            ? "Selected Local File"
                            : "Server Backup"}
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-gray-800">
                        {backup.filename}
                    </p>

                    {backup.size != null && (
                        <p className="mt-1 text-xs text-gray-500">
                            {(backup.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    )}
                </div>

                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-800">
                        A safety backup of the current database will be
                        attempted before restoration.
                    </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={restoring}
                        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={restoring}
                        className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {restoring
                            ? "Restoring Database..."
                            : "Confirm Restore"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestoreConfirmModal;
