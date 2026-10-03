
import { useCallback, useEffect, useState } from "react";

import { getAuditLogs, getAuditLogById} from "../api/auditLogsApi";

import AuditLogsHeader from "../components/auditLogs/AuditLogsHeader";
import AuditLogsFilters from "../components/auditLogs/AuditLogsFilters";
import AuditLogsTable from "../components/auditLogs/AuditLogsTable";
import AuditLogDetailsModal from "../components/auditLogs/AuditLogDetailsModal";

const AuditLogs = () => {
    // =====================================================
    // STATE
    // =====================================================

    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    const [filters, setFilters] = useState({
        search: "",
        action: "",
        module: "",
        user_role: "",
        status: "",
        date_from: "",
        date_to: ""
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedLog, setSelectedLog] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");

    // =====================================================
    // FETCH AUDIT LOGS
    // =====================================================

    const loadAuditLogs = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const result = await getAuditLogs({
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            });

            setLogs(result.logs || []);

            setPagination((previous) => ({
                ...previous,
                ...(result.pagination || {})
            }));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to retrieve audit logs."
            );
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page, pagination.limit]);

    useEffect(() => {
        loadAuditLogs();
    }, [loadAuditLogs]);

    // =====================================================
    // FILTER CHANGE
    // =====================================================

    const handleFilterChange = (name, value) => {
        setFilters((previous) => ({
            ...previous,
            [name]: value
        }));

        setPagination((previous) => ({
            ...previous,
            page: 1
        }));
    };

    // =====================================================
    // CLEAR FILTERS
    // =====================================================

    const handleClearFilters = () => {
        setFilters({
            search: "",
            action: "",
            module: "",
            user_role: "",
            status: "",
            date_from: "",
            date_to: ""
        });

        setPagination((previous) => ({
            ...previous,
            page: 1
        }));
    };

    // =====================================================
    // PAGINATION
    // =====================================================

    const handlePageChange = (page) => {
        setPagination((previous) => ({
            ...previous,
            page
        }));
    };

    // =====================================================
    // VIEW AUDIT LOG DETAILS
    // =====================================================

    const handleViewDetails = async (log) => {
        setSelectedLog(null);
        setDetailsError("");
        setDetailsLoading(true);

        try {
            const result = await getAuditLogById(
                log.audit_log_id
            );

            setSelectedLog(result.log || log);
        } catch (err) {
            setDetailsError(
                err.response?.data?.message ||
                "Failed to retrieve audit log details."
            );

            // Fall back to the row data if details cannot be fetched.
            setSelectedLog(log);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleCloseDetails = () => {
        setSelectedLog(null);
        setDetailsError("");
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="min-h-screen p-6">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* HEADER */}
                <AuditLogsHeader
                    total={pagination.total}
                    onRefresh={loadAuditLogs}
                    loading={loading}
                />

                {/* FILTERS */}
                <AuditLogsFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClear={handleClearFilters}
                />

                {/* ERROR */}
                {error && (
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-sm text-red-700">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={loadAuditLogs}
                            className="shrink-0 text-sm font-semibold text-red-700 hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* TABLE */}
                <AuditLogsTable
                    logs={logs}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onViewDetails={handleViewDetails}
                />

            </div>

            {/* DETAILS MODAL */}
            {(selectedLog || detailsLoading) && (
                <AuditLogDetailsModal
                    log={selectedLog}
                    loading={detailsLoading}
                    error={detailsError}
                    onClose={handleCloseDetails}
                />
            )}
        </div>
    );
};

export default AuditLogs;