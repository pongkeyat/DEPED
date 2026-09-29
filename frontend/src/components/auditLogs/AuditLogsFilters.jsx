
import {
    Search,
    Filter,
    X
} from "lucide-react";

const AuditLogsFilters = ({
    filters,
    onFilterChange,
    onClear
}) => {
    const inputClass =
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

    const labelClass =
        "mb-1.5 block text-xs font-semibold text-gray-600";

    const hasFilters = Object.values(filters).some(
        (value) => value !== ""
    );

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Filter
                        size={18}
                        className="text-gray-600"
                    />

                    <h2 className="font-semibold text-gray-800">
                        Filter Audit Logs
                    </h2>
                </div>

                {hasFilters && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                        <X size={15} />
                        Clear filters
                    </button>
                )}
            </div>

            {/* SEARCH */}
            <div className="mb-5">
                <label className={labelClass}>
                    Search
                </label>

                <div className="relative">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) =>
                            onFilterChange(
                                "search",
                                e.target.value
                            )
                        }
                        placeholder="Search username, action, description, or record ID..."
                        className={`${inputClass} pl-10`}
                    />
                </div>
            </div>

            {/* FILTER GRID */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

                {/* ACTION */}
                <div>
                    <label className={labelClass}>
                        Action
                    </label>

                    <select
                        value={filters.action}
                        onChange={(e) =>
                            onFilterChange(
                                "action",
                                e.target.value
                            )
                        }
                        className={inputClass}
                    >
                        <option value="">All Actions</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                        <option value="ARCHIVE">Archive</option>
                        <option value="RESTORE">Restore</option>
                        <option value="LOGIN">Login</option>
                        <option value="LOGOUT">Logout</option>
                        <option value="VIEW">View</option>
                        <option value="SUBMIT">Submit</option>
                        <option value="BACKUP">Backup</option>
                    </select>
                </div>

                {/* MODULE */}
                <div>
                    <label className={labelClass}>
                        Module
                    </label>

                    <select
                        value={filters.module}
                        onChange={(e) =>
                            onFilterChange(
                                "module",
                                e.target.value
                            )
                        }
                        className={inputClass}
                    >
                        <option value="">All Modules</option>
                        <option value="AUTH">Authentication</option>
                        <option value="VACANCY">Vacancies</option>
                        <option value="APPLICATION">Applications</option>
                        <option value="POSITION">Positions</option>
                        <option value="SCREENING">Initial Screening</option>
                        <option value="ASSESSMENT">Assessment</option>
                        <option value="RANKING">Ranking</option>
                        <option value="PANELIST">Panelists</option>
                        <option value="DATABASE">Database</option>
                        <option value="USER">Users</option>
                    </select>
                </div>

                {/* ROLE */}
                <div>
                    <label className={labelClass}>
                        User Role
                    </label>

                    <select
                        value={filters.user_role}
                        onChange={(e) =>
                            onFilterChange(
                                "user_role",
                                e.target.value
                            )
                        }
                        className={inputClass}
                    >
                        <option value="">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="HRO">HRO</option>
                        <option value="HRMPSB">HRMPSB</option>
                    </select>
                </div>

                {/* STATUS */}
                <div>
                    <label className={labelClass}>
                        Status
                    </label>

                    <select
                        value={filters.status}
                        onChange={(e) =>
                            onFilterChange(
                                "status",
                                e.target.value
                            )
                        }
                        className={inputClass}
                    >
                        <option value="">All Statuses</option>
                        <option value="SUCCESS">Success</option>
                        <option value="FAILED">Failed</option>
                    </select>
                </div>

                {/* DATE FROM */}
                <div>
                    <label className={labelClass}>
                        Date From
                    </label>

                    <input
                        type="date"
                        value={filters.date_from}
                        onChange={(e) =>
                            onFilterChange(
                                "date_from",
                                e.target.value
                            )
                        }
                        className={inputClass}
                    />
                </div>

                {/* DATE TO */}
                <div>
                    <label className={labelClass}>
                        Date To
                    </label>

                    <input
                        type="date"
                        min={filters.date_from || undefined}
                        value={filters.date_to}
                        onChange={(e) =>
                            onFilterChange(
                                "date_to",
                                e.target.value
                            )
                        }
                        className={inputClass}
                    />
                </div>

            </div>
        </div>
    );
};

export default AuditLogsFilters;