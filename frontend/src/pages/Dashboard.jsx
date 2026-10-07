import { useEffect, useMemo, useState } from "react";
import DashboardCards from "../components/dashboard/DashboardCards";
import DashboardCharts from "../components/dashboard/DashboardCharts";
import RecruitmentProcessOverview from "../components/dashboard/RecruitmentProcessOverview";
import { getApplications } from "../api/ApplicationApi";
import { getVacancies } from "../api/VacancyApi";

const getArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.applications)) return response.applications;
  return [];
};

const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function DashBoard() {
  const [applications, setApplications] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filterError, setFilterError] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedDateRange, setAppliedDateRange] = useState({
    from: "",
    to: "",
  });

  useEffect(() => {
    let isCurrent = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      setLoadError("");

      const [applicationsResult, vacanciesResult] =
        await Promise.allSettled([
          getApplications(),
          getVacancies({ limit: 1000, page: 1 }),
        ]);

      if (!isCurrent) return;

      if (applicationsResult.status === "fulfilled") {
        setApplications(getArray(applicationsResult.value));
      } else {
        console.error(
          "Error loading dashboard applications:",
          applicationsResult.reason
        );
        setLoadError("Applications could not be loaded.");
      }

      if (vacanciesResult.status === "fulfilled") {
        setVacancies(getArray(vacanciesResult.value));
      } else {
        console.error(
          "Error loading dashboard vacancies:",
          vacanciesResult.reason
        );
        setLoadError((current) =>
          current
            ? `${current} Vacancies could not be loaded.`
            : "Vacancies could not be loaded."
        );
      }

      setLoading(false);
    };

    fetchDashboardData();

    return () => {
      isCurrent = false;
    };
  }, []);

  const filteredApplications = useMemo(
    () =>
      applications.filter((application) => {
        if (!appliedDateRange.from && !appliedDateRange.to) return true;

        const receivedDate = toDateKey(application.date_received);
        if (!receivedDate) return false;

        return (
          (!appliedDateRange.from ||
            receivedDate >= appliedDateRange.from) &&
          (!appliedDateRange.to || receivedDate <= appliedDateRange.to)
        );
      }),
    [applications, appliedDateRange]
  );

  const applyDateFilter = () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setFilterError("The start date must be on or before the end date.");
      return;
    }

    setFilterError("");
    setAppliedDateRange({ from: dateFrom, to: dateTo });
  };

  return (
    <div className="min-h-screen flex flex-col gap-6 p-6 pb-16">
      {(loadError || filterError) && (
        <p
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {[loadError, filterError].filter(Boolean).join(" ")}
        </p>
      )}

      <DashboardCards
        applications={filteredApplications}
        vacancies={vacancies}
        loading={loading}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApplyDateFilter={applyDateFilter}
      />
      <DashboardCharts
        applications={filteredApplications}
        vacancies={vacancies}
        loading={loading}
      />
      <RecruitmentProcessOverview />
    </div>
  );
}
