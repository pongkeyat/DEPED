import { useState, useEffect, useMemo } from "react"; 
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { getApplications } from "../api/ApplicationApi";
import { getVacancies } from "../api/VacancyApi";
import InitialEvaluationHeader from "../components/initialscreening/InitialEvaluationHeader";

const getStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case "qualified":
      return "bg-emerald-100 text-emerald-700";
    case "unqualified":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const normalizeVacancyId = (id) => String(id ?? "").trim();

export default function InitialEvaluationResults() {
  const [allApplications, setAllApplications] = useState([]); 
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState("");
  const [showUnqualified, setShowUnqualified] = useState(false); 
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  console.log("🏗️ [Qualified View] Render cycle triggered.");

  // Load Vacancies Effect
  useEffect(() => {
    const loadVacancies = async () => {
      try {
        const response = await getVacancies();
        setVacancies(response?.data || []);
      } catch (err) {
        console.error("Failed to load vacancies:", err);
      } finally {
        setLoading(false);
      }
    };
    loadVacancies();
  }, []);

  // Load Applications Effect
  useEffect(() => {
    let isMounted = true;
    console.log("📡 [Qualified View] Mounting component. Triggering API fetch...");

    const fetchData = async () => {
      try {
        const response = await getApplications();
        const data = response?.data || response;

        if (!isMounted) return;

        if (Array.isArray(data)) {
          setAllApplications(data);
        } else {
          setAllApplications([]);
        }
      } catch (error) {
        console.error("❌ Error fetching applications data pool:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      console.log("🧼 [Qualified View] Component unmounted / cleaned up.");
    };
  }, []);

  const handleViewApplication = (id) => {
    navigate(`/applicants/${id}`);
  };

  // Process data: Apply status filter, vacancy filter, and DEDUPLICATE users
  const filteredApplications = useMemo(() => {
    const targetStatus = showUnqualified ? "unqualified" : "qualified";
    
    // 1. Filter by Status
    const statusFiltered = allApplications.filter(
      (app) => app.application_status?.toLowerCase() === targetStatus
    );

    // 2. Filter by Vacancy
    const vacancyFiltered = selectedVacancy
      ? statusFiltered.filter(
          (app) => normalizeVacancyId(app.vacancy_id) === normalizeVacancyId(selectedVacancy)
        )
      : statusFiltered;

    // 3. DEDUPLICATE: Ensure each applicant/user appears exactly once
    const uniqueMap = new Map();
    vacancyFiltered.forEach((app) => {
      const uniqueUserId = app.applicant_id || app.application_id || app.id;
      
      if (uniqueUserId && !uniqueMap.has(uniqueUserId)) {
        uniqueMap.set(uniqueUserId, app);
      }
    });

    return Array.from(uniqueMap.values());
  }, [allApplications, showUnqualified, selectedVacancy]);

  const targetStatus = showUnqualified ? "unqualified" : "qualified";

  return (
    <div className="min-h-screen bg-[#edf2f8] p-6">
      <InitialEvaluationHeader
        onBack={() => navigate("/applications-screening")}
        onProceed={() => navigate("/assessment")}
      />

      {/* Controls Container */}
      <div className="mt-6 flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100 width-screen">
        <div className="w-full sm:max-w-xs">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Filter by Vacancy
          </label>
          <select
            value={selectedVacancy}
            onChange={(e) => setSelectedVacancy(e.target.value)}
            className="w-full h-11 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg px-3 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All Vacancies</option>
            {vacancies.map((vacancy) => {
              const id = normalizeVacancyId(vacancy.vacancy_id || vacancy.id);
              const title = vacancy.position_title || vacancy.title || vacancy.job_title;
              return (
                <option key={id} value={id}>
                  {title ? `${title} (ID: ${id})` : `Vacancy #${id}`}
                </option>
              );
            })}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowUnqualified(!showUnqualified)}
          className={`h-11 px-5 rounded-lg text-sm font-semibold transition-colors duration-200 border ${
            showUnqualified 
              ? "bg-red-600 border-red-600 text-white hover:bg-red-700" 
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {showUnqualified ? "Showing Unqualified" : "View Unqualified Pool"}
        </button>
      </div>

      <div className="mt-6 rounded-3xl bg-white shadow overflow-hidden">
        <table className="min-w-full">
          <thead className={showUnqualified ? "bg-red-950 text-white" : "bg-[#1E3E74] text-white"}>
            <tr>
              <th className="px-5 py-4 text-left">Vacancy ID</th>
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
                <td colSpan="6" className="py-10 text-center text-slate-500">
                  Loading applicants...
                </td>
              </tr>
            ) : filteredApplications.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-500">
                  No {targetStatus} applicants found for this selection.
                </td>
              </tr>
            ) : (
              filteredApplications.map((app, index) => {
                const targetId =
                  app.applicant_id ||
                  app.application_id ||
                  app.id;

                return (
                  <tr
                    key={`${targetId}-${index}`}
                    className="border-b hover:bg-slate-50"
                  >
                    <td className={`px-5 py-4 font-medium ${showUnqualified ? "text-red-900" : "text-[#1E3E74]"}`}>
                      {app.vacancy_id}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {app.last_name && app.first_name 
                        ? `${app.last_name}, ${app.first_name}`
                        : "Unknown Applicant"}
                    </td>

                    <td className="px-5 py-4">
                      {app.position_title || "N/A"}
                    </td>

                    <td className="px-5 py-4">
                      {app.date_received || "N/A"}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`rounded-full px-4 py-1 text-sm font-semibold capitalize ${getStatusStyles(
                          app.application_status
                        )}`}
                      >
                        {app.application_status || "Pending"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleViewApplication(targetId)}
                          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors ${
                            showUnqualified 
                              ? "bg-red-600 hover:bg-red-700" 
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          <Eye size={18} />
                          View
                        </button>
                      </div>
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