
import { Download, RotateCcw } from "lucide-react";

const BackupList = ({
    backups = [],
    loading,
    onRestore,
    onDownload,
    formatFileSize,
    formatDate,
}) => {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-1 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                        Available Backups
                    </h2>

                    <p className="text-sm text-gray-500">
                        Backups currently stored on the server.
                    </p>
                </div>

                <span className="text-sm text-gray-500">
                    {backups.length} {backups.length === 1 ? "backup" : "backups"}
                </span>
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-3 p-10 text-sm text-gray-500">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                    Loading backups...
                </div>
            ) : backups.length === 0 ? (
                <div className="px-5 py-12 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <svg
                            className="h-6 w-6 text-gray-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                        >
                            <rect
                                x="4"
                                y="3"
                                width="16"
                                height="18"
                                rx="2"
                            />

                            <path d="M8 7h8M8 11h8M8 15h5" />
                        </svg>
                    </div>

                    <h3 className="font-medium text-gray-800">
                        No backups found
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Create a backup to see it listed here.
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">
                                        Backup Filename
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        File Size
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        Created At
                                    </th>

                                    <th className="px-5 py-4 text-right font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {backups.map((backup) => (
                                    <tr
                                        key={backup.filename}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="max-w-sm break-all px-5 py-4 font-medium text-gray-800">
                                            <div className="flex items-start gap-3">
                                                <svg
                                                    className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.8"
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                                                    />
                                                    <path d="M14 3v5h5M8 13h8M8 17h8" />
                                                </svg>

                                                {backup.filename}
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                            {formatFileSize(backup.size)}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                            {formatDate(backup.created_at)}
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onDownload(backup)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                                >
                                                    <Download size={15} />
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onRestore(backup)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                                                >
                                                    <RotateCcw size={15} />
                                                    Restore
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="divide-y divide-gray-100 md:hidden">
                        {backups.map((backup) => (
                            <div
                                key={backup.filename}
                                className="space-y-3 p-4"
                            >
                                <p className="break-all text-sm font-semibold text-gray-800">
                                    {backup.filename}
                                </p>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            File Size
                                        </p>

                                        <p className="mt-1 text-gray-700">
                                            {formatFileSize(backup.size)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500">
                                            Created At
                                        </p>

                                        <p className="mt-1 text-gray-700">
                                            {formatDate(backup.created_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onDownload(backup)}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        <Download size={15} />
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRestore(backup)}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                                    >
                                        <RotateCcw size={15} />
                                        Restore
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
};

export default BackupList;
