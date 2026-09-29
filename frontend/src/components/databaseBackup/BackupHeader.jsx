import {
    Database,
    Plus,
    RefreshCw
} from "lucide-react";

const BackupHeader = ({
    onCreateBackup,
    creating
}) => {
    return (
        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <Database
                        size={25}
                        className="text-blue-600"
                    />
                </div>

                <div>
                    <h1 className="text-xl font-semibold text-gray-800">
                        Database Backup & Restore
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Create and restore backups of the system database.
                    </p>
                </div>

            </div>

            <button
                type="button"
                onClick={onCreateBackup}
                disabled={creating}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {creating ? (
                    <>
                        <RefreshCw
                            size={18}
                            className="animate-spin"
                        />

                        Creating...
                    </>
                ) : (
                    <>
                        <Plus size={18} />

                        Create Backup
                    </>
                )}
            </button>

        </div>
    );
};

export default BackupHeader;