import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Hourglass, UserCheck, Trophy, Eye, UserPlus, Filter
} from "lucide-react";
import { getApplications } from "../api/ApplicationApi";
import { getVacancies } from "../api/VacancyApi";

const getStatusStyles = (status) => {
  switch (status) {
    case "Initial Screening": return "bg-orange-100 text-orange-700";
    case "For Assessment": return "bg-violet-100 text-violet-700";
    case "Ranked": return "bg-teal-100 text-teal-700";
    case "Complete": return "bg-emerald-100 text-emerald-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const normalizeVacancyId = (id) => String(id ?? "").trim();

export default function AllApplication() {
  const [applications, setApplications] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch vacancies on load
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

  // Fetch applications on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getApplications();
        const data = response && response.data ? response.data : response;
        setApplications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Map vacancies by ID for fast lookup
  const vacancyStatusMap = useMemo(() => {
    const map = new Map();
    vacancies.forEach((v) => {
      const id = normalizeVacancyId(v.vacancy_id || v.id);
      map.set(id, v.status);
    });
    return map;
  }, [vacancies]);

  // Filter and transform status
  const activeApplications = useMemo(() => {
    return applications
      .filter((app) => {
        const isActive = app.application_status !== "Qualified" && app.application_status !== "Disqualified";
        const matchesVacancy = selectedVacancy
          ? normalizeVacancyId(app.vacancy_id) === normalizeVacancyId(selectedVacancy)
          : true;
        return isActive && matchesVacancy;
      })
      .map((app) => {
        const vacStatus = vacancyStatusMap.get(normalizeVacancyId(app.vacancy_id));
        const isVacancyClosed = String(vacStatus).toLowerCase() === "closed";
        const rawStatus = app.application_status;

        // ONLY change to "Initial Screening" if the vacancy is Closed AND the applicant status is "Complete"
        let displayStatus = rawStatus;
        if (isVacancyClosed && String(rawStatus).toLowerCase() === "complete") {
          displayStatus = "Initial Screening";
        }

        return {
          ...app,
          application_status: displayStatus,
        };
      })
      .reverse(); // Newest first
  }, [applications, selectedVacancy, vacancyStatusMap]);

  const stats = [
    { title: "Active Total", value: activeApplications.length, icon: ClipboardList, color: "border-[#1E3E74]", bg: "bg-slate-100", iconColor: "text-[#1E3E74]" },
    { title: "Initial Screening", value: activeApplications.filter(a => a.application_status === 'Initial Screening').length, icon: Hourglass, color: "border-orange-400", bg: "bg-orange-50", iconColor: "text-orange-500" },
    { title: "For Assessment", value: activeApplications.filter(a => a.application_status === 'For Assessment').length, icon: UserCheck, color: "border-violet-500", bg: "bg-violet-50", iconColor: "text-violet-500" },
    { title: "Complete", value: activeApplications.filter(a => a.application_status === 'Complete').length, icon: Trophy, color: "border-teal-500", bg: "bg-teal-50", iconColor: "text-teal-500" },
  ];

  const handleViewApplication = (id) => {
    if (!id) return;
    navigate(`/applicants/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#edf2f8] p-6">
      {/* Header */}
      <div className="rounded-3xl bg-white shadow p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <ClipboardList className="text-[#1E3E74]" size={34} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#1E3E74]">Active Applications</h1>
            <p className="text-slate-500">Monitoring pending and in-progress applications</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/receiveApplicant")}
          className="flex items-center gap-2 rounded-xl bg-[#1E3E74] px-6 py-3 font-semibold text-white hover:bg-[#17325e] transition-colors"
        >
          <UserPlus size={20} /> Receive Walk-In Application
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-white p-4 shadow mb-6 flex flex-wrap items-center justify-between gap-4 border border-slate-100">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <Filter size={18} className="text-[#1E3E74]" />
          <span>Filter Applications:</span>
        </div>
        <div className="w-full sm:w-80">
          <select
            value={selectedVacancy}
            onChange={(e) => setSelectedVacancy(e.target.value)}
            className="w-full h-11 bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-xl px-3 outline-none focus:border-[#1E3E74] focus:ring-1 focus:ring-[#1E3E74] transition-all"
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
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 mb-8">
        {stats.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className={`rounded-3xl border-t-4 ${item.color} bg-white p-6 shadow`}>
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg}`}>
                  <Icon size={28} className={item.iconColor} />
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-slate-800">{item.value}</h2>
                  <p className="font-medium text-slate-500">{item.title}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Section */}
      <div className="rounded-3xl bg-white shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-[#1E3E74] text-white">
            <tr>
              <th className="px-5 py-4 text-left">Vacancy ID</th>
              <th className="px-5 py-4 text-left">Applicant Name</th>
              <th className="px-5 py-4 text-left">Position</th>
              <th className="px-5 py-4 text-left">Date Applied</th>
              <th className="px-5 py-4 text-center">Status</th>
              <th className="px-5 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-500 font-medium">Loading applications...</td>
              </tr>
            ) : activeApplications.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-500 font-medium">No active applications found.</td>
              </tr>
            ) : (
              activeApplications.map((app, idx) => {
                const targetId = app.job_applications_id || app.applicant_id || app.application_id || app.id;
                return (
                  <tr 
                    key={targetId || idx} 
                    onClick={() => handleViewApplication(targetId)}
                    className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-[#1E3E74]">{app.vacancy_id}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {app.last_name && app.first_name ? `${app.last_name}, ${app.first_name}` : "Unknown"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{app.position_title || "N/A"}</td>
                    <td className="px-5 py-4 text-slate-600">{app.date_received || "N/A"}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block rounded-full px-4 py-1 text-sm font-semibold ${getStatusStyles(app.application_status)}`}>
                        {app.application_status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleViewApplication(targetId)}
                        className="inline-flex items-center justify-center p-2 rounded-xl bg-blue-50 text-[#1E3E74] hover:bg-blue-100 transition-colors"
                        title="View Application Details"
                      >
                        <Eye size={18} className="mr-1" /> View
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