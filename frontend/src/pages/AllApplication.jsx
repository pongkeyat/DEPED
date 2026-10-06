import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Hourglass, Trophy, Eye, UserPlus, Filter, Briefcase, RotateCcw
} from "lucide-react";
import { getApplications } from "../api/ApplicationApi";
import { getVacancies } from "../api/VacancyApi";

const getStatusStyles = (status) => {
  switch (status) {
    case "Initial Screening": return "bg-orange-100 text-orange-700";
    case "Complete": return "bg-violet-100 text-violet-700";
    case "Incomplete": return "bg-emerald-100 text-emerald-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const normalizeVacancyId = (id) => String(id ?? "").trim();

export default function AllApplication() {
  const [applications, setApplications] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
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
      map.set(id, { status: v.status, title: v.position_title || v.title || v.job_title });
    });
    return map;
  }, [vacancies]);

  // First pass: Filter applications by open vacancies and dropdown vacancy selection
  const baseFilteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const vacId = normalizeVacancyId(app.vacancy_id);
      const vacInfo = vacancyStatusMap.get(vacId);
      const isOpen = vacInfo && String(vacInfo.status).toLowerCase() === "open";
      
      const matchesSelectedVacancy = selectedVacancy
        ? vacId === normalizeVacancyId(selectedVacancy)
        : true;

      return isOpen && matchesSelectedVacancy;
    });
  }, [applications, vacancyStatusMap, selectedVacancy]);

  // Second pass: Apply card status filter for the table display
  const filteredApplications = useMemo(() => {
    if (selectedStatusFilter === "all") return baseFilteredApplications;
    return baseFilteredApplications.filter(
      (app) => app.application_status === selectedStatusFilter
    );
  }, [baseFilteredApplications, selectedStatusFilter]);

  const stats = [
    { 
      id: "all",
      title: "Total Applications", 
      value: baseFilteredApplications.length, 
      icon: ClipboardList, 
      topBarColor: "bg-[#1E3E74]", 
      iconBg: "bg-blue-50", 
      iconColor: "text-[#1E3E74]" 
    },
    { 
      id: "Complete",
      title: "Complete", 
      value: baseFilteredApplications.filter(a => a.application_status === 'complete').length, 
      icon: Trophy, 
      topBarColor: "bg-teal-500", 
      iconBg: "bg-teal-50", 
      iconColor: "text-teal-500" 
    },
    { 
      id: "Incomplete",
      title: "Incomplete", 
      value: baseFilteredApplications.filter(a => a.application_status === 'incomplete').length, 
      icon: UserPlus, 
      topBarColor: "bg-emerald-500", 
      iconBg: "bg-emerald-50", 
      iconColor: "text-emerald-500" 
    }
  ];

  const handleViewApplication = (id) => {
    if (!id) return;
    navigate(`/applicants/${id}`);
  };

  const handleResetFilters = () => {
    setSelectedVacancy("");
    setSelectedStatusFilter("all");
  };

  return (
    <div className="min-h-screen px-6 py-6">
      {/* Main Centered Container matching layout width */}
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="relative flex min-h-[88px] flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />
          <div className="flex items-center gap-4">
            <ClipboardList className="text-[#1E3E74]" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-[#1E3E74]">Application Status</h1>
              <p className="text-slate-500 text-sm mt-0.5">Overview of current applicant statuses for open vacancies</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/receiveApplicant")}
            className="flex items-center gap-2 rounded-xl bg-[#1E3E74] px-6 py-3 font-semibold text-white hover:bg-[#17325e] transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus size={20} /> Receive Walk-In Application
          </button>
        </div>

        {/* Clickable Interactive Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {stats.map((card) => {
            const IconComp = card.icon;
            const isSelected = selectedStatusFilter === card.id;
            return (
              <div 
                key={card.id} 
                onClick={() => setSelectedStatusFilter(card.id)}
                className={`relative flex items-center gap-4 rounded-2xl border bg-white p-5 pt-6 shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  isSelected ? "border-[#1E3E74] ring-2 ring-[#1E3E74]/20 bg-blue-50/20" : "border-gray-200"
                }`}
              >
                {/* Slim / Subtle Absolute Top Accent Bar */}
                <div className={`absolute top-0 inset-x-0 h-1 ${card.topBarColor}`} />

                {/* Soft Icon Container */}
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
                  <IconComp className="w-6 h-6 stroke-[2.2]" />
                </div>

                {/* Value and Label Stack */}
                <div className="flex-1 min-w-0">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded-md" />
                  ) : (
                    <span className="text-2xl font-black text-gray-800 leading-none tracking-tight block">
                      {card.value}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-gray-500 block mt-1 truncate">
                    {card.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

                {/* Modern Filter Card */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

          <div className="flex items-center gap-2.5 pl-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1E3E74]">
              <Filter size={16} className="stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold tracking-tight text-[#1E3E74]">
              Filter Applications
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 pl-3">
            {/* Vacancy Dropdown */}
            <div className="relative w-full sm:w-[320px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Briefcase size={16} />
              </div>
              <select
                value={selectedVacancy}
                onChange={(e) => setSelectedVacancy(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-gray-700 shadow-sm transition focus:border-[#1E3E74] focus:outline-none focus:ring-2 focus:ring-[#1E3E74]/20 cursor-pointer"
              >
                <option value="">All Open Vacancies</option>
                {vacancies
                  .filter((v) => String(v.status).toLowerCase() === "open")
                  .map((vacancy) => {
                    const id = normalizeVacancyId(vacancy.vacancy_id || vacancy.id);
                    const title = vacancy.position_title || vacancy.title || vacancy.job_title;
                    return (
                      <option key={id} value={id}>
                        {title ? `${title} (ID: ${id})` : `Vacancy #${id}`}
                      </option>
                    );
                  })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Reset Filters Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E3E74] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17325e] cursor-pointer"
            >
              <RotateCcw size={15} />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-[#1b4584] px-6 py-4">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-white">Applicant Name</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Position</th>
                <th className="px-6 py-4 text-center font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-center font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-slate-500 font-medium">Loading applications...</td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-slate-500 font-medium">No applications found.</td>
                </tr>
              ) : (
                filteredApplications.map((app, idx) => {
                  const targetId = app.job_applications_id || app.applicant_id || app.application_id || app.id;
                  return (
                    <tr 
                      key={targetId || idx} 
                      onClick={() => handleViewApplication(targetId)}
                      className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {app.last_name && app.first_name ? `${app.last_name}, ${app.first_name}` : "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{app.position_title || "N/A"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block rounded-full px-4 py-1 text-sm font-semibold ${getStatusStyles(app.application_status)}`}>
                          {app.application_status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewApplication(targetId)}
                          className="inline-flex items-center justify-center p-2 rounded-xl bg-blue-50 text-[#1E3E74] hover:bg-blue-100 transition-colors cursor-pointer"
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
    </div>
  );
}