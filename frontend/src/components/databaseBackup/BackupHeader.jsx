
import { DatabaseBackup, FolderOpen, LoaderCircle, ShieldCheck } from "lucide-react";

const BackupHeader = ({
    onCreateBackup,
    onBrowseRestore,
    creating,
    restoring,
}) => {
    return (
        <div className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

            <div className="flex items-center gap-4 pl-2">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3E74]">
                    <DatabaseBackup size={24} strokeWidth={2.2} />
                </div>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#1E3E74]">
                        Database Backup
                    </h1>
                    <p className="mt-0.5 text-sm text-gray-500">
                        Create a downloadable backup or restore from a PostgreSQL .dump file.
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-600">
                        <ShieldCheck size={15} className="text-emerald-600" />
                        A safety backup is created before each restore.
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 pl-2 sm:flex-row sm:pl-0">
                <button
                    type="button"
                    onClick={onBrowseRestore}
                    disabled={creating || restoring}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#1E3E74] hover:bg-blue-50 hover:text-[#1E3E74] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {restoring ? (
                        <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                        <FolderOpen size={17} />
                    )}
                    Browse Backup File
                </button>

                <button
                    type="button"
                    onClick={onCreateBackup}
                    disabled={creating || restoring}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3E74] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17325e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {creating ? (
                        <>
                            <LoaderCircle size={17} className="animate-spin" />
                            Creating Backup...
                        </>
                    ) : (
                        <>
                            <DatabaseBackup size={17} />
                            Create & Save Backup
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default BackupHeader;
