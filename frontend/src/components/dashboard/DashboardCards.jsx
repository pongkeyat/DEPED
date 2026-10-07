import { useNavigate } from "react-router-dom";

export default function DashboardCards({
  applications = [],
  vacancies = [],
  loading = false,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApplyDateFilter,
}) {
  const navigate = useNavigate();

  const ReceiveApplication = () => {
    navigate("/receiveApplicant");
  };

  const PostVacancy = () => {
    navigate("/postVacancies");
  };

  // 2. Compute dynamic metrics from live database data
  const getCounts = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const openVacancies = vacancies.filter((vacancy) => {
      const status = String(vacancy.status || "").trim().toLowerCase();
      const deadlineKey = vacancy.application_deadline
        ? String(vacancy.application_deadline).slice(0, 10)
        : "";

      return (
        (status === "active" || status === "open") &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(deadlineKey) ||
          deadlineKey >= todayKey)
      );
    });

    // Filter applications received this month/year
    const applicationsThisMonth = applications.filter(app => {
      if (!app.date_received) return false;
      const d = new Date(app.date_received);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Match your custom status mappings from your database strings
    const pendingScreening = applications.filter(
      app => ["initial screening", "pending screening"].includes(
        String(app.application_status || "").trim().toLowerCase()
      )
    );

    const qualified = applications.filter(
      app => String(app.application_status || "").trim().toLowerCase() === "qualified"
    );

    const forAssessment = applications.filter(
      app => String(app.application_status || "").trim().toLowerCase() === "for assessment"
    );

    return {
      vacanciesCount: openVacancies.length,
      monthCount: applicationsThisMonth.length,
      pendingCount: pendingScreening.length,
      qualifiedCount: qualified.length,
      assessmentCount: forAssessment.length,
      totalCount: applications.length,
    };
  };

  const metrics = getCounts();

  const statCards = [
    { 
      title: "Open Vacancies", 
      count: loading ? "..." : metrics.vacanciesCount, 
      color: "border-[#113a70]", 
      iconBg: "bg-[#e8edf5] text-[#113a70]",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V5Z" />
          <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5V11H3V8.5Z" />
          <path d="M3 12.5V15a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-2.5H3Z" />
        </svg>
      )
    },
    { 
      title: "Applications (This Month)", 
      count: loading ? "..." : metrics.monthCount, 
      color: "border-[#3b82f6]", 
      iconBg: "bg-[#eff6ff] text-[#3b82f6]",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      )
    },
    { 
      title: "Pending Screening", 
      count: loading ? "..." : metrics.pendingCount, 
      label: "Screen", 
      color: "border-[#f5a623]", 
      iconBg: "bg-[#fffbeb] text-[#f5a623]",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      )
    },
    { 
      title: "Qualified", 
      count: loading ? "..." : metrics.qualifiedCount, 
      color: "border-[#10b981]", 
      iconBg: "bg-[#ecfdf5] text-[#10b981]",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      )
    },
    { 
      title: "For Assessment", 
      count: loading ? "..." : metrics.assessmentCount, 
      color: "border-[#8b5cf6]", 
      iconBg: "bg-[#faf5ff] text-[#8b5cf6]",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
        </svg>
      )
    },
    { 
      title: "Total Applications", 
      count: loading ? "..." : metrics.totalCount, 
      color: "border-[#059669]", 
      iconBg: "bg-[#f0fdf4] text-[#059669]",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      )
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6 font-sans min-h-fit">
      
      {/* Upper Navigation / Title Row */}
      <div className="relative w-full min-h-[88px] overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />
        <div>
          <div className="flex items-center gap-2 text-[#113a70]">
            <svg className="w-5 h-5 text-[#1e3a6d]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
            </svg>
            <h2 className="text-[19px] font-bold tracking-tight">Dashboard</h2>
          </div>
          <p className="text-[12.5px] text-gray-400 mt-0.5">
            DepEd Regional Office 1 (Region 1) 
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={ReceiveApplication} className="bg-[#f5a623] hover:bg-[#e0951a] text-white text-[12.5px] font-bold px-3.5 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Receive Application
          </button>
          <button onClick={PostVacancy} className="bg-[#1e3a6d] hover:bg-[#152a50] text-white text-[12.5px] font-bold px-3.5 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Post Vacancy
          </button>
        </div>
      </div>



      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="flex min-h-36 flex-col gap-3.5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between w-full">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center text-[#1E3E74]">
                {card.icon}
              </div>
            </div>

            <div className="flex flex-col mt-0.5">
              <span className="text-[30px] font-bold text-[#1a1c1e] leading-none tracking-tight">
                {card.count}
              </span>
              <h4 className="text-[13px] font-semibold text-gray-400 tracking-tight mt-1 leading-snug">
                {card.title}
              </h4>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}