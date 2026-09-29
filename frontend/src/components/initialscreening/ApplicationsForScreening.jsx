import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { getApplications } from "../../api/ApplicationApi";

const getStatusStyles = (status) => {
  switch (status) {
    case "Initial Screening":
      return "bg-orange-100 text-orange-700";

    case "Qualified":
      return "bg-emerald-100 text-emerald-700";

    case "Disqualified":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function ApplicationsForScreening() {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // VACANCY FILTER
  const [vacancyFilter, setVacancyFilter] = useState("All");

  const navigate = useNavigate();

  // ============================================================
  // FETCH APPLICATIONS
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await getApplications();

        const payload =
          response?.data?.data ??
          response?.data ??
          response ??
          [];

        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.rows)
          ? payload.rows
          : Array.isArray(payload?.applications)
          ? payload.applications
          : Array.isArray(payload?.results)
          ? payload.results
          : [];

        const initialScreeningOnly = rows.filter((app) => {
          const status = String(
            app?.application_status ??
              app?.status ??
              app?.hr_remarks?.application_status ??
              ""
          )
            .trim()
            .toLowerCase();

          return [
            "initial screening",
            "pending screening",
            "screening"
          ].includes(status);
        });

        setApplications(initialScreeningOnly);
      } catch (error) {
        console.error(
          "Error fetching initial screening applications:",
          error
        );

        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============================================================
  // CREATE UNIQUE VACANCY LIST
  // ============================================================
  const vacancyOptions = [
    ...new Map(
      applications
        .filter((app) => app.vacancy_id)
        .map((app) => [
          app.vacancy_id,
          {
            vacancy_id: app.vacancy_id,
            position_title: app.position_title,
            salary_grade: app.salary_grade,
          },
        ])
    ).values(),
  ];

  // ============================================================
  // SEARCH + VACANCY + STATUS FILTER
  // ============================================================
  useEffect(() => {
    const filtered = applications.filter((app) => {
      // --------------------------------------------------------
      // SEARCH
      // --------------------------------------------------------
      const fullName = `${app.first_name || ""} ${
        app.last_name || ""
      }`.toLowerCase();

      const searchValue = search
        .trim()
        .toLowerCase();

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

      // --------------------------------------------------------
      // VACANCY FILTER
      // --------------------------------------------------------
      const matchesVacancy =
        vacancyFilter === "All" ||
        String(app.vacancy_id) ===
          String(vacancyFilter);

      // --------------------------------------------------------
      // STATUS FILTER
      // --------------------------------------------------------
      const status = String(
        app.application_status || ""
      )
        .trim()
        .toLowerCase();

      let matchesStatus = true;

      if (statusFilter === "Initial Screening") {
        matchesStatus =
          status === "initial screening";
      } else if (statusFilter === "Qualified") {
        matchesStatus =
          status === "qualified" ||
          status ===
            "initial_screening_qualified";
      } else if (statusFilter === "Disqualified") {
        matchesStatus =
          status === "disqualified" ||
          status ===
            "initial_screening_disqualified";
      }

      return (
        matchesSearch &&
        matchesVacancy &&
        matchesStatus
      );
    });

    setFilteredApplications(filtered);
  }, [
    applications,
    search,
    vacancyFilter,
    statusFilter,
  ]);

  // ============================================================
  // VIEW APPLICATION
  // ============================================================
  const handleViewApplication = (application) => {
    const routeId =
      application?.job_applications_id ||
      application?.applicant_id ||
      application?.id;

    if (!routeId) {
      console.warn(
        "Application ID is missing."
      );
      return;
    }

    console.log(
      "Opening Applicant for Evaluation:",
      routeId
    );

    navigate(
      `/applicants/${routeId}/evaluation`
    );
  };

  // ============================================================
  // RESET FILTERS
  // ============================================================
  const handleResetFilters = () => {
    setSearch("");
    setVacancyFilter("All");
    setStatusFilter("All");
  };

  return (
    <div className="min-h-screen p-6 bg-[#edf2f8]">

      {/* ======================================================
          FILTERS
      ====================================================== */}
{/* ======================================================
    FILTERS CONTAINER
====================================================== */}
<div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

  {/* FILTER HEADER */}
  <div className="mb-4">
    <h2 className="text-lg font-bold text-[#1E3E74]">
      Filter Applications
    </h2>
  </div>

  {/* FILTER INPUTS */}
  <div className="flex flex-col gap-4 md:flex-row md:items-center">


    {/* VACANCY FILTER */}
    <select
      className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 md:w-80"
      value={vacancyFilter}
      onChange={(e) => setVacancyFilter(e.target.value)}
    >
      <option value="All">All Vacancies</option>

      {vacancyOptions.map((vacancy) => (
        <option
          key={vacancy.vacancy_id}
          value={vacancy.vacancy_id}
        >
          {vacancy.position_title || "Unknown Position"} (
          {vacancy.vacancy_id})
        </option>
      ))}
    </select>

    {/* RESET */}
    <button
      type="button"
      onClick={handleResetFilters}
      className="w-full rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 md:w-auto"
    >
      Reset Filters
    </button>

  </div>
</div>



      {/* ======================================================
          TABLE
      ====================================================== */}
      <div className="overflow-hidden rounded-3xl bg-white shadow">

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-[#1E3E74] text-white">

              <tr>

                <th className="px-5 py-4 text-left">
                  Application ID
                </th>

                <th className="px-5 py-4 text-left">
                  Applicant ID
                </th>

                <th className="px-5 py-4 text-left">
                  Applicant Name
                </th>

                <th className="px-5 py-4 text-left">
                  Position
                </th>

                <th className="px-5 py-4 text-left">
                  Date Applied
                </th>

                <th className="px-5 py-4 text-center">
                  Status
                </th>

                <th className="px-5 py-4 text-center">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {/* LOADING */}
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

                /* NO RESULTS */
                <tr>

                  <td
                    colSpan="7"
                    className="py-10 text-center text-slate-500 font-medium"
                  >
                    No applicants found.
                  </td>

                </tr>

              ) : (

                /* APPLICATIONS */
                filteredApplications.map(
                  (app, index) => {

                    const targetId =
                      app.job_applications_id ||
                      app.applicant_id ||
                      app.id ||
                      index;

                    return (
                      <tr
                        key={targetId}
                        className="border-b hover:bg-slate-50 transition-colors"
                      >

                        {/* APPLICATION ID */}
                        <td className="px-5 py-4 font-medium text-slate-700">
                          {app.job_applications_id ||
                            "N/A"}
                        </td>

                        {/* APPLICANT ID */}
                        <td className="px-5 py-4 font-semibold text-[#1E3E74]">
                          {app.applicant_id ||
                            "N/A"}
                        </td>

                        {/* APPLICANT NAME */}
                        <td className="px-5 py-4">

                          <div className="font-semibold text-slate-800">
                            {app.last_name ||
                            app.first_name
                              ? `${app.last_name || ""}, ${
                                  app.first_name ||
                                  ""
                                }`
                              : "Unknown"}
                          </div>

                          <div className="text-xs text-gray-500">
                            {app.email_address ||
                              app.email ||
                              ""}
                          </div>

                        </td>

                        {/* POSITION */}
                        <td className="px-5 py-4 text-slate-600">
                          {app.position_title ||
                            "N/A"}
                        </td>

                        {/* DATE */}
                        <td className="px-5 py-4 text-slate-600">
                          {app.date_received ||
                            "N/A"}
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4 text-center">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyles(
                              app.application_status
                            )}`}
                          >
                            {app.application_status ||
                              "Initial Screening"}
                          </span>

                        </td>

                        {/* ACTION */}
                        <td className="px-5 py-4 text-center">

                          <button
                            onClick={() =>
                              handleViewApplication(
                                app
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-[#1E3E74] px-4 py-2 text-sm font-semibold text-white hover:bg-[#17325e] transition-colors"
                            title="Evaluate Applicant"
                          >
                            <Eye size={16} />
                            Evaluate
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}