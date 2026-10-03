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
        <div className="relative mb-6 flex flex-col gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            {/* Left Accent Bar */}
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

            <div className="flex items-center gap-4 pl-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3E74]">
                    <Database
                        size={24}
                        className="stroke-[2.2]"
                    />
                </div>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#1E3E74]">
                        Database Backup & Restore
                    </h1>

                    <p className="mt-0.5 text-sm text-gray-500">
                        Create and restore backups of the system database.
                    </p>
                </div>
            </div>

            <div className="pl-3 sm:pl-0">
                <button
                    type="button"
                    onClick={onCreateBackup}
                    disabled={creating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3E74] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17325e] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
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
                            <Plus size={18} className="stroke-[2.5]" />
                            Create Backup
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default BackupHeader;