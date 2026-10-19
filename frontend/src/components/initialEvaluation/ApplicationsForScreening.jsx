import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  FileText,
  Clock,
} from "lucide-react";
import { getApplications } from "../../api/ApplicationApi";
import { getVacancies, updateVacancyStatus } from "../../api/VacancyApi";

// ------------------------------------------------------------
// LEFT CARD: Semi-Circle Gauge (Evaluated Applicants)
// ------------------------------------------------------------
const SemiCircleGauge = ({ value, percentage }) => {
  const radius = 38;
  const strokeWidth = 9;
  const circumference = Math.PI * radius; // Half circle length
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative my-1">
      <div className="relative flex items-center justify-center w-36 h-28">
        <svg className="w-full h-full" viewBox="0 0 100 65">
          {/* Background Track Arc */}
          <path
            d="M 12 52 A 38 38 0 0 1 88 52"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active Progress Arc */}
          <path
            d="M 12 52 A 38 38 0 0 1 88 52"
            fill="none"
            stroke="#1E3E74"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Big Number lowered so it is fully visible inside the arc */}
        <div className="absolute top-12 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
            {value}
          </span>
          <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
            EVALUATED
          </span>
        </div>
      </div>

      <span className="text-xs font-semibold text-slate-400 mt-1">
        {percentage}% of total completed
      </span>
    </div>
  );
};

// ------------------------------------------------------------
// RIGHT CARD: Donut Ring Gauge (Pending Applicants)
// ------------------------------------------------------------
const DonutRingGauge = ({ value, percentage }) => {
  const radius = 34;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center justify-center relative my-1">
      <div className="relative flex items-center justify-center w-28 h-28">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-slate-800">
            {value}
          </span>
          <span className="text-[10px] font-bold text-blue-600">
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

const getStatusStyles = (status) => {
  switch (String(status).toLowerCase()) {
    case "initial screening":
    case "pending screening":
      return "bg-amber-100 text-amber-700";
    case "qualified":
    case "initial_screening_qualified":
      return "bg-emerald-100 text-emerald-700";
    case "disqualified":
    case "initial_screening_disqualified":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const normalizeVacancyId = (value) => String(value ?? "").trim().toUpperCase();

const getApplicationVacancyId = (application) =>
  application?.vacancy_id ??
  application?.job_application?.vacancy_id ??
  application?.job_applications?.vacancy_id;

const getNormalizedStatus = (app) =>
  String(
    app?.application_status ??
      app?.hr_remarks_final_notes?.application_status ??
      app?.hr_remarks_final_notes_status ??
      app?.hr_remarks?.application_status ??
      app?.status ??
      ""
  )
    .trim()
    .toLowerCase();

const isPendingStatus = (status) =>
  [
    "initial screening",
    "initial_screening",
    "pending screening",
    "screening",
  ].includes(status);

const isInitialScreening = (app) =>
  isPendingStatus(getNormalizedStatus(app));

const getNormalizedVacancyStatus = (vacancy) => {
  const rawStatus = [
    vacancy?.status,
    vacancy?.vacancy_status,
    vacancy?.current_status,
    vacancy?.vacancyStatus,
  ].find((value) => String(value ?? "").trim() !== "");

  return String(rawStatus ?? "").trim().toLowerCase();
};

export default function ApplicationsForScreening() {
  const [applications, setApplications] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const navigate = useNavigate();

  // Fetch applications and vacancies independently of VacancyEvaluationContext.
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setFetchError("");

        const [applicationsResponse, vacanciesResponse] = await Promise.all([
          getApplications(),
          getVacancies({ limit: 100, page: 1 }),
        ]);

        const applicationPayload =
          applicationsResponse?.data?.data ??
          applicationsResponse?.data ??
          applicationsResponse;

        const applicationRows = Array.isArray(applicationPayload)
          ? applicationPayload
          : applicationPayload?.rows ??
            applicationPayload?.applications ??
            applicationPayload?.results ??
            [];

        let vacancyRows = Array.isArray(vacanciesResponse?.data)
          ? vacanciesResponse.data
          : Array.isArray(vacanciesResponse)
            ? vacanciesResponse
            : [];

        const totalPages = Math.max(
          1,
          Number(vacanciesResponse?.pagination?.totalPages) || 1,
        );
        if (totalPages > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
              getVacancies({ limit: 100, page: index + 2 }),
            ),
          );
          vacancyRows = [
            ...vacancyRows,
            ...remainingPages.flatMap((page) =>
              Array.isArray(page?.data) ? page.data : [],
            ),
          ];
        }

        if (isMounted) {
          setApplications(Array.isArray(applicationRows) ? applicationRows : []);
          setVacancies(vacancyRows);
        }
      } catch (error) {
        console.error("Error fetching applications or vacancies:", error);
        if (isMounted) {
          setApplications([]);
          setVacancies([]);
          setFetchError(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to load applications and vacancies."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Automatically move terminated vacancies to Assessment when no applicants
  // linked to them remain pending Initial Screening.
  const transitionedVacancies = useRef(new Set());
  const transitioningVacancies = useRef(new Set());

  useEffect(() => {
    if (loading || fetchError || !vacancies.length) return;

    const eligibleVacanciesWithoutPendingScreening = vacancies.filter(
      (vacancy) =>
        getNormalizedVacancyStatus(vacancy) === "terminated" &&
        !applications.some(
          (application) =>
            normalizeVacancyId(getApplicationVacancyId(application)) ===
              normalizeVacancyId(vacancy.vacancy_id ?? vacancy.id) &&
            isInitialScreening(application),
        ),
    );

    eligibleVacanciesWithoutPendingScreening.forEach((vacancy) => {
      const vacancyId = vacancy.vacancy_id ?? vacancy.id;
      const normalizedId = normalizeVacancyId(vacancyId);

      if (
        !vacancyId ||
        transitionedVacancies.current.has(normalizedId) ||
        transitioningVacancies.current.has(normalizedId)
      ) {
        return;
      }

      transitioningVacancies.current.add(normalizedId);

      updateVacancyStatus(vacancyId, "Assessment")
        .then((result) => {
          transitionedVacancies.current.add(normalizedId);
          const updatedStatus =
            result?.currentStatus || result?.data?.status || "Assessment";

          setVacancies((current) =>
            current.map((item) =>
              normalizeVacancyId(item.vacancy_id ?? item.id) === normalizedId
                ? {
                    ...item,
                    status: updatedStatus,
                    vacancy_status: updatedStatus,
                  }
                : item,
            ),
          );

          setActionMessage(
            result?.message ||
              `Vacancy ${vacancyId} automatically moved to ${updatedStatus} because no applicants remain pending Initial Screening.`,
          );
          setActionError("");
        })
        .catch((error) => {
          console.error(
            `Unable to automatically move vacancy ${vacancyId} to Assessment:`,
            error,
          );
          setActionError(
            error?.response?.data?.error ||
              error?.response?.data?.message ||
              error?.message ||
              `Unable to automatically move vacancy ${vacancyId} to Assessment.`,
          );
        })
        .finally(() => {
          transitioningVacancies.current.delete(normalizedId);
        });
    });
  }, [loading, fetchError, vacancies, applications]);

  // Only explicit completed screening outcomes count as evaluated.
  // Missing or unknown statuses must not be counted as evaluated.
  const isEvaluatedStatus = (status) =>
    [
      "qualified",
      "disqualified",
      "unqualified",
      "not qualified",
      "not_qualified",
      "initial_screening_qualified",
      "initial_screening_disqualified",
      "initial screening complete",
      "initial_screening_complete",
    ].includes(status);

  const eligibleVacancies = useMemo(
    () =>
      vacancies.filter(
        (vacancy) => getNormalizedVacancyStatus(vacancy) === "terminated",
      ),
    [vacancies]
  );

  const eligibleVacancyIds = useMemo(
    () =>
      new Set(
        eligibleVacancies.map((vacancy) =>
          normalizeVacancyId(vacancy.vacancy_id ?? vacancy.id)
        )
      ),
    [eligibleVacancies]
  );

  // Keep pending screening applications linked to an eligible vacancy.
  const eligibleApplications = useMemo(
    () =>
      applications.filter(
        (app) =>
          getApplicationVacancyId(app) &&
          eligibleVacancyIds.has(
            normalizeVacancyId(getApplicationVacancyId(app))
          )
      ),
    [applications, eligibleVacancyIds]
  );

  // ------------------------------------------------------------
  // METRICS CALCULATIONS
  // ------------------------------------------------------------
  const screeningMetrics = useMemo(() => {
    // Count actual applications, not vacancy records.
    const vacancyApplications = eligibleApplications.filter((app) => {
      if (
        selectedVacancyId === "All" ||
        selectedVacancyId === "All Closed Vacancies" ||
        !selectedVacancyId
      ) {
        return true;
      }
      return (
        normalizeVacancyId(getApplicationVacancyId(app)) ===
        normalizeVacancyId(selectedVacancyId)
      );
    });

    const pending = vacancyApplications.filter((app) =>
      isPendingStatus(getNormalizedStatus(app))
    ).length;

    const evaluated = vacancyApplications.filter((app) =>
      isEvaluatedStatus(getNormalizedStatus(app))
    ).length;
    const total = pending + evaluated;

    const evaluatedPercent =
      total > 0 ? Math.round((evaluated / total) * 100) : 0;
    const pendingPercent =
      total > 0 ? Math.round((pending / total) * 100) : 0;

    return { total, evaluated, pending, evaluatedPercent, pendingPercent };
  }, [eligibleApplications, selectedVacancyId]);

  // Dynamic status check (turns green when pending count is 0)
  const isComplete = !loading && !fetchError && screeningMetrics.pending === 0;

  const initialScreeningApps = useMemo(
    () => eligibleApplications.filter(isInitialScreening),
    [eligibleApplications]
  );

  const vacancyOptions = eligibleVacancies;


  const filteredApplications = useMemo(
    () =>
      initialScreeningApps.filter((app) => {
        const fullName = `${app.first_name || ""} ${
          app.last_name || ""
        }`.toLowerCase();

        const searchValue = search.trim().toLowerCase();

        const matchesSearch =
          fullName.includes(searchValue) ||
          String(app.applicant_id || "")
            .toLowerCase()
            .includes(searchValue) ||
          String(app.job_applications_id || "")
            .toLowerCase()
            .includes(searchValue) ||
          String(app.position_title || "")
            .toLowerCase()
            .includes(searchValue);

        const matchesVacancy =
          selectedVacancyId === "All" ||
          selectedVacancyId === "All Closed Vacancies" ||
          normalizeVacancyId(getApplicationVacancyId(app)) ===
            normalizeVacancyId(selectedVacancyId);

        return matchesSearch && matchesVacancy;
      }),
    [initialScreeningApps, search, selectedVacancyId]
  );

  const handleViewApplication = (application) => {
    const routeId =
      application?.job_applications_id ||
      application?.applicant_id ||
      application?.id;

    if (!routeId) return;

    navigate(`/applicants/${routeId}/evaluation`);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedVacancyId("All");
  };

  return (
    <div className="relative w-full space-y-6">

      {/* ------------------------------------------------------------ */}
      {/* ALERT BANNER (TURNS GREEN WHEN ALL EVALUATED) */}
      {/* ------------------------------------------------------------ */}
      <div
        className={`rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${
          isComplete
            ? "border-emerald-200/80 bg-emerald-50/90"
            : "border-amber-200/80 bg-[#FFFBEB]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <div>
              <h3
                className={`font-bold text-base ${
                  isComplete ? "text-emerald-950" : "text-amber-950"
                }`}
              >
                {isComplete
                  ? selectedVacancyId === "All"
                    ? "All Vacancies Initial Screening Complete"
                    : "Vacancy Initial Screening Complete"
                  : "Initial Screening Required"}
              </h3>
              <p
                className={`text-xs ${
                  isComplete ? "text-emerald-900/80" : "text-amber-900/80"
                }`}
              >
                {isComplete
                  ? "All applicants for this vacancy have been evaluated. Subsequent procedures are unlocked."
                  : "Select a vacancy or evaluate all applicants across vacancies to unlock subsequent assessment modules."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {isComplete ? (
              <Unlock className="h-3.5 w-3.5 text-emerald-700" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-amber-700" />
            )}
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                isComplete
                  ? "bg-emerald-100/90 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isComplete
                ? "Unlocked"
                : `${screeningMetrics.pending} Pending Applicants`}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* 3-CARD DASHBOARD STATS SECTION */}
      {/* ------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* LEFT CARD: Evaluated Applicants */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Evaluated Applicants</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>

          <SemiCircleGauge
            value={screeningMetrics.evaluated}
            percentage={screeningMetrics.evaluatedPercent}
          />
        </div>

        {/* MIDDLE CARD: Total Applicants */}
        <div className="bg-gradient-to-br from-[#1E3E74] to-[#142C54] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[190px]">
          <div className="flex items-center justify-between w-full text-xs font-medium text-blue-200/80 uppercase tracking-wider">
            <span>Total Applicants</span>
            <FileText className="w-4 h-4 text-blue-300/60" />
          </div>

          <div className="my-auto py-2">
            <span className="text-5xl font-extrabold tracking-tight block drop-shadow-sm">
              {screeningMetrics.total}
            </span>
            <span className="text-xs text-blue-200/90 font-medium mt-1 block">
              Applicants in Initial Screening
            </span>
          </div>

          <div className="w-full text-[11px] text-blue-200/60 border-t border-blue-400/20 pt-2">
            {selectedVacancyId === "All" ? "All Vacancies" : `Vacancy: ${selectedVacancyId}`}
          </div>
        </div>

        {/* RIGHT CARD: Pending Applicants */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Needs Evaluation</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <DonutRingGauge
            value={screeningMetrics.pending}
            percentage={screeningMetrics.pendingPercent}
          />

          <div className="text-center text-xs text-slate-400 font-medium">
            Pending Review
          </div>
        </div>

      </div>

      {/* FILTER SECTION */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <h2 className="text-lg font-bold text-[#1E3E74] mb-4">
          Filter Applications
        </h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            className="w-full sm:w-64 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={selectedVacancyId}
            onChange={(e) => setSelectedVacancyId(e.target.value)}
          >
            <option value="All">All Vacancies</option>
            {vacancyOptions.map((vacancy) => (
              <option key={vacancy.vacancy_id} value={vacancy.vacancy_id}>
                {vacancy.position_title || "Unknown Position"} (
                {vacancy.vacancy_id})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {(actionMessage || actionError) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            actionError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {actionError || actionMessage}
        </div>
      )}


      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {/* APPLICANTS TABLE */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xs border border-slate-200/80">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#1E3E74] text-white text-sm font-semibold">
              <tr>
                <th className="px-5 py-3.5 text-left">Application ID</th>
                <th className="px-5 py-3.5 text-left">Applicant ID</th>
                <th className="px-5 py-3.5 text-left">Applicant Name</th>
                <th className="px-5 py-3.5 text-left">Position</th>
                <th className="px-5 py-3.5 text-left">Date Applied</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/60 text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="py-10 text-center text-slate-500 font-medium"
                  >
                    Loading applications...
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="py-10 text-center text-slate-500 font-medium"
                  >
                    {fetchError
                      ? fetchError
                      : screeningMetrics.total === 0
                        ? "No applicants found for the selected vacancy status."
                        : isComplete
                          ? "All applicants for this vacancy have been evaluated!"
                          : "No unevaluated applicants found matching criteria."}
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app, index) => {
                  const targetId =
                    app.job_applications_id ||
                    app.applicant_id ||
                    app.id ||
                    index;

                  return (
                    <tr
                      key={targetId}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {app.job_applications_id || "N/A"}
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#1E3E74]">
                        {app.applicant_id || "N/A"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {app.last_name || app.first_name
                            ? `${app.last_name || ""}, ${app.first_name || ""}`
                            : "Unknown"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {app.email_address || app.email || ""}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {app.position_title || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {app.date_received || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyles(
                            getNormalizedStatus(app)
                          )}`}
                        >
                          {app.application_status ??
                            app.hr_remarks_final_notes?.application_status ??
                            app.hr_remarks_final_notes_status ??
                            app.hr_remarks?.application_status ??
                            app.status ??
                            "Initial Screening"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleViewApplication(app)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#1E3E74] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#17325e] transition-colors"
                          title="Evaluate Applicant"
                        >
                          <Eye size={14} />
                          Evaluate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}