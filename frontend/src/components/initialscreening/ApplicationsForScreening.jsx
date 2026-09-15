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

  const navigate = useNavigate();

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await getApplications();
      const data = response?.data || response;

      if (Array.isArray(data)) {
        // ONLY get applications with actual initial_screening status
        const initialScreeningOnly = data.filter((app) => {
          const status = String(app.application_status || "")
            .trim()
            .toLowerCase();

          return status === "initial screening";
        });

        setApplications(initialScreeningOnly);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  useEffect(() => {
    const filtered = applications.filter((app) => {
      const fullName = `${app.first_name || ""} ${
        app.last_name || ""
      }`.toLowerCase();

      const matchesSearch =
        fullName.includes(search.toLowerCase()) ||
        (app.position_title || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const status = (
        app.application_status || "Initial Screening"
      ).toLowerCase();

      let matchesStatus = true;

      if (statusFilter === "Initial Screening") {
        matchesStatus =
          status === "initial screening" || status === "initial_screening";
      } else if (statusFilter === "Qualified") {
        matchesStatus =
          status === "qualified" ||
          status === "initial_screening_qualified";
      } else if (statusFilter === "Disqualified") {
        matchesStatus =
          status === "disqualified" ||
          status === "initial_screening_disqualified";
      }

      return matchesSearch && matchesStatus;
    });

    setFilteredApplications(filtered);
  }, [applications, search, statusFilter]);

  // Connected function to navigate on "Evaluate" button click
  const handleViewApplication = (application) => {
    const routeId =
      application?.job_applications_id ||
      application?.applicant_id ||
      application?.id;

    if (!routeId) {
      console.warn("Application ID is missing.");
      return;
    }

    console.log("Opening Applicant for Evaluation:", routeId);
    navigate(`/applicants/${routeId}/evaluation`);
  };

  return (
    <div className="min-h-screen p-6 bg-[#edf2f8]">
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row items-center">
        <input
          type="text"
          placeholder="Search by applicant or position..."
          className="w-full md:w-80 rounded-xl border bg-white p-3 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="rounded-xl border bg-white p-3 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Screening Records</option>
          <option value="Initial Screening">Pending Review</option>
          <option value="Qualified">Screening Passed</option>
          <option value="Disqualified">Screening Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl bg-white shadow">
        <table className="min-w-full">
          <thead className="bg-[#1E3E74] text-white">
            <tr>
              <th className="px-5 py-4 text-left">Application ID</th>
              <th className="px-5 py-4 text-left">Applicant ID</th>
              <th className="px-5 py-4 text-left">Applicant Name</th>
              <th className="px-5 py-4 text-left">Position</th>
              <th className="px-5 py-4 text-left">Date Applied</th>
              <th className="px-5 py-4 text-center">Status</th>
              <th className="px-5 py-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="py-10 text-center text-slate-500 font-medium">
                  Loading applications...
                </td>
              </tr>
            ) : filteredApplications.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-10 text-center text-slate-500 font-medium">
                  No applicants found.
                </td>
              </tr>
            ) : (
              filteredApplications.map((app, index) => {
                const targetId =
                  app.job_applications_id || app.applicant_id || app.id || index;

                return (
                  <tr
                    key={targetId}
                    className="border-b hover:bg-slate-50 transition-colors"
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
                      <div className="text-xs text-gray-500">
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
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyles(
                          app.application_status
                        )}`}
                      >
                        {app.application_status || "Initial Screening"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleViewApplication(app)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#1E3E74] px-4 py-2 text-sm font-semibold text-white hover:bg-[#17325e] transition-colors"
                        title="Evaluate Applicant"
                      >
                        <Eye size={16} />
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
  );
}