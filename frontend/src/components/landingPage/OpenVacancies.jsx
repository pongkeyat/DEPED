import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getVacancies } from "../../api/VacancyApi";
import { getPositions } from "../../api/PositionsApi";

export default function OpenVacancies({ searchTerm = "", setSearchTerm, onApplyClick }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState("All Offices");

  useEffect(() => {
    const fetchVacanciesData = async () => {
      try {
        setLoading(true);
        const [response, positionsResponse] = await Promise.all([
          getVacancies(),
          getPositions(),
        ]);
        const rawData = response?.data || [];
        const positions = positionsResponse?.data || [];
        
        const mappedJobs = rawData.map((job) => ({
          id: job.vacancy_id,
          vacancyCode: job.vacancy_id,
          title: positions.find(
            (position) => String(position.position_id) === String(job.position_id)
          )?.position_title || job.plantilla_position || "Position unavailable",
          office: job.office_unit,
          salaryGrade: job.salary_grade || "SG-1",
          education: job.education_requirement || "None Required",
          training: job.training_requirement || "None Required",
          experience: job.experience_requirement || "None Required",
          eligibility: job.eligibility_requirement || "None Required",
          slots: job.number_of_vacancies || 1,
          status: job.status || "Open",
          postingDate: job.application_posted,
          deadline: job.application_deadline,
          remarksText: job.remark_text || "No additional instructions provided.",
        }));

        setJobs(mappedJobs);
        setError(null);
      } catch (err) {
        console.error("Error loading vacancies:", err);
        setError("Failed to load open job vacancies.");
      } finally {
        setLoading(false);
      }
    };

    fetchVacanciesData();
  }, []);

  // Helper utility to check if a job deadline has not passed
  const isJobOpen = (deadlineDate) => {
    if (!deadlineDate) return false;
    return new Date(deadlineDate) >= new Date();
  };

  // Filter jobs to only show open vacancies matching search criteria
  const filteredJobs = jobs.filter((job) => {
    const matchesOffice = selectedOffice === "All Offices" || job.office === selectedOffice;
    const matchesSearch = 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.vacancyCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check both backend status and deadline date
    const isOpen = (job.status?.toLowerCase() === "open" || job.status?.toLowerCase() === "active") && isJobOpen(job.deadline);

    return matchesOffice && matchesSearch && isOpen;
  });

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
        <p className="text-gray-500 font-medium">Loading open vacancies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-xl border border-red-200">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Vacancy Title Block */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-[#1e3a67]">Open Vacancies</h2>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
            {filteredJobs.length}
          </span>
        </div>
        <p className="text-gray-500 text-sm mt-1">Non-Teaching Positions • Region I RO1</p>
      </div>

      {/* Filter Buttons Tab Row */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {["All Offices", "General Services Section", "Schools Division Office"].map((office) => (
          <button
            key={office}
            onClick={() => setSelectedOffice(office)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedOffice === office
                ? "bg-[#1e3a67] text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {office}
          </button>
        ))}
      </div>

      {/* Grid/Flex List */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 font-medium">No open vacancies found matching your search query.</p>
          <button 
            onClick={() => { if(setSearchTerm) setSearchTerm(""); setSelectedOffice("All Offices"); }}
            className="mt-3 text-[#1e3a67] text-sm font-semibold underline"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="flex flex-row flex-wrap md:flex-nowrap gap-5 w-full overflow-x-auto pb-4">
          {filteredJobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col justify-between w-full md:w-[350px] shrink-0"
            >
              <div>
                <div className="bg-[#1e3a67] text-white p-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-base leading-tight">{job.title}</h3>
                    <span className="bg-amber-500 text-xs px-2 py-0.5 rounded font-bold text-slate-900 whitespace-nowrap">
                      {job.salaryGrade}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">{job.office}</p>
                  <p className="text-xs text-slate-300 mt-1">{job.vacancyCode}</p>
                </div>

                <div className="p-4">
                  <h4 className="text-xs font-bold text-gray-400 mb-3 tracking-wider">QUALIFICATION STANDARDS</h4>
                  <ul className="space-y-2 text-sm text-gray-600 mb-4">
                    <li className="border-b pb-1.5">🎓 {job.education}</li>
                    <li className="border-b pb-1.5">📚 {job.training}</li>
                    <li className="border-b pb-1.5">💼 {job.experience}</li>
                    <li className="border-b pb-1.5">🛡️ {job.eligibility}</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 pt-0">
                <div className="flex justify-between items-center text-xs mb-3 border-t pt-3">
                  <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">Open</span>
                  <span className="text-gray-400 text-right">
                    {job.slots} Slot(s)
                  </span>
                </div>

                <button
                  onClick={() => navigate('/apply', { state: { job } })}
                  className="w-full bg-[#1e3a67] hover:bg-[#15294a] text-white py-2 rounded-md text-sm font-medium transition flex items-center justify-center"
                >
                  Apply Now 
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}