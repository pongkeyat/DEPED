import {
    Database,
    RotateCcw,
    FileArchive,
    Loader2
} from "lucide-react";

const BackupList = ({
    backups,
    loading,
    onRestore,
    formatFileSize,
    formatDate
}) => {

    if (loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white">

                <div className="flex flex-col items-center gap-3 text-gray-500">

                    <Loader2
                        size={30}
                        className="animate-spin text-blue-600"
                    />

                    <p className="text-sm">
                        Loading backups...
                    </p>

                </div>

            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

            {/* TABLE HEADER */}

            <div className="border-b border-gray-200 px-6 py-4">

                <div className="flex items-center gap-2">

                    <Database
                        size={19}
                        className="text-gray-600"
                    />

                    <h2 className="font-semibold text-gray-800">
                        Available Backups
                    </h2>

                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {backups.length}
                    </span>

                </div>

            </div>

            {/* EMPTY STATE */}

            {backups.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">

                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">

                        <FileArchive
                            size={26}
                            className="text-gray-400"
                        />

                    </div>

                    <h3 className="font-medium text-gray-700">
                        No backups found
                    </h3>

                    <p className="mt-1 max-w-md text-sm text-gray-500">
                        Create a database backup to protect your system data.
                    </p>

                </div>
            ) : (

                /* TABLE */

                <div className="overflow-x-auto">

                    <table className="w-full text-left text-sm">

                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                            <tr>

                                <th className="px-6 py-3 font-medium">
                                    Backup File
                                </th>

                                <th className="px-6 py-3 font-medium">
                                    Size
                                </th>

                                <th className="px-6 py-3 font-medium">
                                    Created
                                </th>

                                <th className="px-6 py-3 text-right font-medium">
                                    Action
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-100">

                            {backups.map((backup) => (

                                <tr
                                    key={backup.filename}
                                    className="transition hover:bg-gray-50"
                                >

                                    {/* FILE */}

                                    <td className="px-6 py-4">

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">

                                                <FileArchive
                                                    size={18}
                                                    className="text-blue-600"
                                                />

                                            </div>

                                            <div className="min-w-0">

                                                <p className="truncate font-medium text-gray-800">
                                                    {backup.filename}
                                                </p>

                                                <p className="text-xs text-gray-400">
                                                    PostgreSQL custom-format backup
                                                </p>

                                            </div>

                                        </div>

                                    </td>

                                    {/* SIZE */}

                                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">

                                        {formatFileSize(
                                            backup.size
                                        )}

                                    </td>

                                    {/* DATE */}

                                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">

                                        {formatDate(
                                            backup.created_at
                                        )}

                                    </td>

                                    {/* ACTION */}

                                    <td className="px-6 py-4 text-right">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onRestore(backup)
                                            }
                                            className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 transition hover:bg-orange-100"
                                        >

                                            <RotateCcw size={15} />

                                            Restore

                                        </button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>
            )}

        </div>
    );
};

export default BackupList;