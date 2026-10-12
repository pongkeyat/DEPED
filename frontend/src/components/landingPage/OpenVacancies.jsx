import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getVacancies } from "../../api/VacancyApi";
import { getPositions } from "../../api/PositionsApi";

import {
  X,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  GraduationCap,
  BookOpen,
  Clock,
  ShieldCheck,
  Users,
  FileText,
  PhilippinePeso,
  ClipboardList,
  Info,
  CheckCircle,
  MapPin,
  ArrowRight
} from "lucide-react";

export default function OpenVacancies({
  searchTerm = "",
  setSearchTerm,
  onApplyClick,
}) {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedOffice, setSelectedOffice] = useState("All Offices");
  const [selectedJob, setSelectedJob] = useState(null);

  // =====================================================
  // FETCH VACANCIES AND POSITIONS
  // =====================================================

  useEffect(() => {
    const fetchVacanciesData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [response, positionsResponse] = await Promise.all([
          getVacancies(),
          getPositions(),
        ]);

        const rawData = Array.isArray(response)
          ? response
          : response?.data?.results || response?.data || [];

        const positions = Array.isArray(positionsResponse)
          ? positionsResponse
          : positionsResponse?.data?.results || positionsResponse?.data || [];

        // Map vacancy foreign key to positions.position_id.
        const mappedJobs = rawData.map((job) => {
          const vacancyPositionId =
            job.position_id || job.positionId || job.position;

          const position = positions.find(
            (position) =>
              String(position.position_id || position.id) ===
              String(vacancyPositionId)
          );

          const positionTitle =
            job.position_title ||
            position?.position_title ||
            position?.title ||
            "Position unavailable";

          return {
            ...job,

            // Vacancy information
            id: job.vacancy_id,
            vacancyCode: job.vacancy_id,
            position_id: vacancyPositionId,

            // Position information from FK relationship
            title: positionTitle,

            positionDetails: position || {},

            // Office and compensation
            office: job.office_unit || "Not specified",
            salaryGrade: job.salary_grade ?? "Not specified",

            // Qualification standards
            education:
              job.education_requirement || "Not specified",

            training:
              job.training_requirement || "Not specified",

            experience:
              job.experience_requirement || "Not specified",

            eligibility:
              job.eligibility_requirement || "Not specified",

            // Vacancy details
            slots: job.number_of_vacancies ?? 1,
            applicationsCount: job.applications_count || job.total_applications || 15,
            status: job.status || "Open",

            postingDate: job.application_posted,
            deadline: job.application_deadline,

            remarksText:
              job.remark_text ||
              "No additional instructions provided.",

            // Preserve the original vacancy database record
            vacancyDetails: job,
          };
        });

        setJobs(mappedJobs);
      } catch (err) {
        console.error("Error loading vacancies:", err);
        setError("Failed to load open job vacancies.");
      } finally {
        setLoading(false);
      }
    };

    fetchVacanciesData();
  }, []);

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "Not specified";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatLabel = (key) => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "Not specified";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (Array.isArray(value)) {
      return value.length
        ? value
            .map((item) =>
              typeof item === "object"
                ? JSON.stringify(item)
                : String(item)
            )
            .join(", ")
        : "None";
    }

    if (typeof value === "object") {
      return Object.entries(value)
        .map(
          ([key, val]) =>
            `${formatLabel(key)}: ${formatValue(val)}`
        )
        .join("\n");
    }

    return String(value);
  };

  const formatSalaryGrade = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "Not specified";
    }

    const grade = String(value);

    return /^SG-/i.test(grade)
      ? grade.toUpperCase()
      : `SG-${grade}`;
  };

  const isJobOpen = (deadlineDate) => {
    if (!deadlineDate) return true; // Keep open if no explicit deadline date set

    const deadline = new Date(deadlineDate);

    if (Number.isNaN(deadline.getTime())) {
      return true;
    }

    // Keep the vacancy open until the end of the deadline date
    deadline.setHours(23, 59, 59, 999);

    return deadline >= new Date();
  };

  // =====================================================
  // FILTER VACANCIES
  // =====================================================

  const filteredJobs = jobs.filter((job) => {
    const matchesOffice =
      selectedOffice === "All Offices" ||
      job.office === selectedOffice;

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      job.title?.toLowerCase().includes(search) ||
      job.vacancyCode?.toLowerCase().includes(search) ||
      job.office?.toLowerCase().includes(search);

    const status = job.status?.toLowerCase();

    const isOpen =
      (status === "open" || status === "active" || !status) &&
      isJobOpen(job.deadline);

    return matchesOffice && matchesSearch && isOpen;
  });

  // =====================================================
  // APPLY TO VACANCY
  // =====================================================

  const handleApply = (job) => {
    setSelectedJob(null);

    if (onApplyClick) {
      onApplyClick(job);
    } else {
      navigate("/apply", {
        state: {
          job,
        },
      });
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
        <p className="text-gray-500 font-medium">
          Loading open vacancies...
        </p>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-xl border border-red-200">
        <p className="text-red-600 font-medium">
          {error}
        </p>
      </div>
    );
  }

  // =====================================================
  // MAIN COMPONENT
  // =====================================================

  return (
    <div className="w-full">

      {/* PAGE HEADER */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-[#1e3a67]">
            Open Vacancies
          </h2>

          <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
            {filteredJobs.length}
          </span>
        </div>

      </div>

      {/* OFFICE FILTER BUTTONS */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          "All Offices",
          "General Services Section",
          "Schools Division Office",
        ].map((office) => (
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

      {/* VACANCY CARDS */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <BriefcaseBusiness
            size={40}
            className="mx-auto text-gray-300 mb-3"
          />

          <p className="text-gray-500 font-medium">
            No open vacancies found matching your search query.
          </p>

          <button
            onClick={() => {
              if (setSearchTerm) setSearchTerm("");
              setSelectedOffice("All Offices");
            }}
            className="mt-3 text-[#1e3a67] text-sm font-semibold underline"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="flex flex-row flex-wrap md:flex-nowrap gap-5 w-full overflow-x-auto pb-4">

          {filteredJobs.map((job) => (
            <JobCard 
              key={job.id} 
              job={job} 
              formatSalaryGrade={formatSalaryGrade}
              setSelectedJob={setSelectedJob}
              handleApply={handleApply}
            />
          ))}

        </div>
      )}

      {/* =====================================================
          VACANCY DETAILS MODAL
      ===================================================== */}

      {selectedJob && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >

            {/* MODAL HEADER */}
            <div className="bg-[#1e3a67] text-white px-6 py-5 flex items-start justify-between">

              <div className="flex gap-3">
                <div className="bg-white/10 p-3 rounded-xl h-fit">
                  <BriefcaseBusiness size={25} />
                </div>

                <div>
                  <h2 className="text-xl md:text-2xl font-bold">
                    {selectedJob.title}
                  </h2>

                  <p className="text-blue-200 text-sm mt-1">
                    Vacancy ID: {selectedJob.vacancyCode}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-green-500/20 text-green-100 border border-green-400/30 px-3 py-1 rounded-full text-xs font-semibold">
                      {selectedJob.status}
                    </span>

                    <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-semibold">
                      {selectedJob.slots} Slot(s)
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                aria-label="Close vacancy details"
              >
                <X size={24} />
              </button>

            </div>

            {/* MODAL BODY */}
            <div className="overflow-y-auto p-6 space-y-7">

              {/* BASIC VACANCY INFORMATION */}
              <section>
                <h3 className="text-lg font-bold text-[#1e3a67] mb-4 flex items-center gap-2">
                  <Info size={20} />
                  Vacancy Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <DetailItem
                    icon={<BriefcaseBusiness size={18} />}
                    label="Position Title"
                    value={selectedJob.title}
                  />

                  <DetailItem
                    icon={<Building2 size={18} />}
                    label="Office / Unit"
                    value={selectedJob.office}
                  />

                  <DetailItem
                    icon={<ClipboardList size={18} />}
                    label="Plantilla Position"
                    value={selectedJob.plantilla_position || "Not specified"}
                  />

                  <DetailItem
                    icon={<PhilippinePeso size={18} />}
                    label="Salary Grade"
                    value={formatSalaryGrade(
                      selectedJob.salaryGrade
                    )}
                  />

                  <DetailItem
                    icon={<Users size={18} />}
                    label="Number of Vacancies"
                    value={selectedJob.slots}
                  />

                  <DetailItem
                    icon={<CalendarDays size={18} />}
                    label="Application Posting Date"
                    value={formatDate(
                      selectedJob.postingDate
                    )}
                  />

                  <DetailItem
                    icon={<Clock size={18} />}
                    label="Application Deadline"
                    value={formatDate(
                      selectedJob.deadline
                    )}
                  />

                  <DetailItem
                    icon={<MapPin size={18} />}
                    label="Place of Assignment"
                    value={
                      selectedJob.place_of_assignment ||
                      selectedJob.assignment ||
                      selectedJob.office_unit ||
                      "Not specified"
                    }
                  />

                  <DetailItem
                    icon={<ClipboardList size={18} />}
                    label="Plantilla Item Number"
                    value={
                      selectedJob.plantilla_item_number ||
                      selectedJob.item_number ||
                      "Not specified"
                    }
                  />

                </div>
              </section>

              {/* QUALIFICATION STANDARDS */}
              <section>
                <h3 className="text-lg font-bold text-[#1e3a67] mb-4 flex items-center gap-2">
                  <ClipboardList size={20} />
                  Qualification Standards
                </h3>

                <div className="space-y-3">

                  <QualificationItem
                    icon={<GraduationCap size={20} />}
                    label="Education"
                    value={selectedJob.education}
                  />

                  <QualificationItem
                    icon={<BookOpen size={20} />}
                    label="Training"
                    value={selectedJob.training}
                  />

                  <QualificationItem
                    icon={<BriefcaseBusiness size={20} />}
                    label="Experience"
                    value={selectedJob.experience}
                  />

                  <QualificationItem
                    icon={<ShieldCheck size={20} />}
                    label="Eligibility"
                    value={selectedJob.eligibility}
                  />

                </div>
              </section>

              {/* REMARKS */}
              <section>
                <h3 className="text-lg font-bold text-[#1e3a67] mb-4 flex items-center gap-2">
                  <FileText size={20} />
                  Additional Instructions / Remarks
                </h3>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {formatValue(selectedJob.remarksText)}
                  </p>
                </div>
              </section>

            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-5 py-2.5 rounded-lg border text-gray-600 font-medium hover:bg-gray-100 transition"
              >
                Close
              </button>
              <button
                onClick={() => handleApply(selectedJob)}
                className="px-6 py-2.5 rounded-lg bg-[#1e3a67] hover:bg-[#15294a] text-white font-semibold transition flex items-center gap-2"
              >
                Apply Now
                <ArrowRight size={16} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// =====================================================
// INDIVIDUAL JOB CARD COMPONENT (WITH TIMER)
// =====================================================

function JobCard({ job, formatSalaryGrade, setSelectedJob, handleApply }) {
  const [timeLeft, setTimeLeft] = useState("7 days");

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!job.deadline) {
        setTimeLeft("7 days");
        return;
      }

      const target = new Date(job.deadline);
      target.setHours(23, 59, 59, 999);

      const diff = target - new Date();

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days >= 1) {
        setTimeLeft(`${days} day${days > 1 ? "s" : ""}`);
      } else {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        const h = String(hours).padStart(2, "0");
        const m = String(minutes).padStart(2, "0");
        const s = String(seconds).padStart(2, "0");

        setTimeLeft(`${h}:${m}:${s}`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [job.deadline]);

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col justify-between w-full md:w-[350px] shrink-0">
      <div>
        {/* CARD HEADER */}
        <div className="bg-[#1e3a67] text-white p-4">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-base leading-tight">
              {job.title}
            </h3>

            <span className="bg-amber-500 text-xs px-2 py-0.5 rounded font-bold text-slate-900 whitespace-nowrap">
              {formatSalaryGrade(job.salaryGrade)}
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-2">
            {job.office}
          </p>

          <p className="text-xs text-slate-300 mt-1">
            {job.vacancyCode}
          </p>
        </div>

        {/* QUALIFICATION STANDARDS */}
        <div className="p-4">
          <h4 className="text-xs font-bold text-gray-400 mb-3 tracking-wider">
            QUALIFICATION STANDARDS
          </h4>

          <ul className="space-y-2 text-sm text-gray-600 mb-4">
            <li className="border-b pb-1.5 flex gap-2">
              <GraduationCap
                size={17}
                className="shrink-0 text-[#1e3a67]"
              />
              <span className="text-xs leading-snug">{job.education}</span>
            </li>

            <li className="border-b pb-1.5 flex gap-2">
              <BookOpen
                size={17}
                className="shrink-0 text-[#1e3a67]"
              />
              <span className="text-xs">{job.training}</span>
            </li>

            <li className="border-b pb-1.5 flex gap-2">
              <BriefcaseBusiness
                size={17}
                className="shrink-0 text-[#1e3a67]"
              />
              <span className="text-xs">{job.experience}</span>
            </li>

            <li className="border-b pb-1.5 flex gap-2">
              <ShieldCheck
                size={17}
                className="shrink-0 text-[#1e3a67]"
              />
              <span className="text-xs">{job.eligibility}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* CARD FOOTER */}
      <div className="p-4 pt-0">
        <div className="flex justify-between items-center text-xs mb-3 border-t pt-3">
          <div className="flex items-center gap-2">
            <span className="bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
              Open
            </span>
            {/* RED COUNTDOWN DISPLAY */}
            <span className="text-red-600 text-[11px] font-bold tracking-wide">
              Ends in: {timeLeft}
            </span>
          </div>

          <span className="text-gray-400 text-right text-xs">
            {job.slots} Slot(s)
          </span>
        </div>

        {/* LINKED NAVY BLUE MORE / APPLY BUTTON */}
        <div>
          <button
            type="button"
            onClick={() => setSelectedJob(job)}
            className="w-full bg-[#1e3a67] hover:bg-[#15294a] text-white border border-[#1e3a67] py-2.5 rounded-full text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Info size={14} className="text-white" />
            More
          </button>
        </div>

        {/* LINKED APPLICATION COUNT DISPLAY */}
        <button
          type="button"
          onClick={() => setSelectedJob(job)}
          className="w-full text-center text-[11px] text-gray-500 hover:text-[#1e3a67] mt-2.5 font-medium transition cursor-pointer flex items-center justify-center gap-1"
        >
          <span>Applications received to date:</span>
          <span className="font-semibold text-gray-800 underline">
            {job.applicationsCount}
          </span>
        </button>
      </div>
    </div>
  );
}

// =====================================================
// REUSABLE DETAIL ITEM
// =====================================================

function DetailItem({ icon, label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="text-sm text-gray-800 font-medium whitespace-pre-line break-words">
        {value === null ||
        value === undefined ||
        value === ""
          ? "Not specified"
          : String(value)}
      </p>
    </div>
  );
}

// =====================================================
// REUSABLE QUALIFICATION ITEM
// =====================================================

function QualificationItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
      <div className="bg-blue-50 text-[#1e3a67] p-3 rounded-xl">
        {icon}
      </div>

      <div className="flex-1">
        <p className="text-xs uppercase tracking-wide font-bold text-gray-400 mb-1">
          {label}
        </p>

        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {value || "Not specified"}
        </p>
      </div>
    </div>
  );
}