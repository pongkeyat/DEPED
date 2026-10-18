
import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const normalizeStatus = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const getApplicationStatus = (app) =>
  app?.application_status ??
  app?.applicationStatus ??
  app?.process_status ??
  app?.processStatus ??
  app?.review_status ??
  app?.reviewStatus ??
  app?.status ??
  app?.stage ??
  "";

const getApplicationId = (app) =>
  app?.job_applications_id ??
  app?.application_id ??
  app?.applicationId ??
  app?.applicant_id ??
  app?.id ??
  null;

const getApplicantName = (app) => {
  const directName =
    app?.applicant_name ??
    app?.applicantName ??
    app?.full_name ??
    app?.fullName ??
    app?.name;

  if (String(directName ?? "").trim()) {
    return String(directName).trim();
  }

  const name = [
    app?.first_name ?? app?.firstName,
    app?.middle_name ?? app?.middleName,
    app?.last_name ?? app?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "Unknown Applicant";
};

const getPosition = (app) =>
  app?.position_title ??
  app?.positionTitle ??
  app?.position_name ??
  app?.position ??
  app?.job_title ??
  app?.jobTitle ??
  app?.vacancy_title ??
  "Position not specified";

const unwrapArray = (response) => {
  if (Array.isArray(response)) return response;

  const possibleData = [
    response?.data,
    response?.applications,
    response?.results,
    response?.data?.applications,
    response?.data?.results,
  ];

  return possibleData.find(Array.isArray) ?? [];
};

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

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const safeApplications = useMemo(
    () => unwrapArray(applications),
    [applications]
  );

  const safeVacancies = useMemo(
    () => unwrapArray(vacancies),
    [vacancies]
  );

  // Applications requiring HR review
  const pendingVerifications = useMemo(() => {
    return safeApplications.filter((app) => {
      const id = getApplicationId(app);
      const status = normalizeStatus(getApplicationStatus(app));

      return (
        id !== null &&
        id !== "" &&
        [
          "initial screening",
          "pending screening",
          "under review",
        ].includes(status)
      );
    });
  }, [safeApplications]);

  const metrics = useMemo(() => {
    const now = new Date();

    const todayKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const openVacancies = safeVacancies.filter((vacancy) => {
      const status = normalizeStatus(vacancy?.status);
      const deadlineKey = vacancy?.application_deadline
        ? String(vacancy.application_deadline).slice(0, 10)
        : "";

      return (
        ["open", "active"].includes(status) &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(deadlineKey) ||
          deadlineKey >= todayKey)
      );
    });

    const applicationsThisMonth = safeApplications.filter((app) => {
      const receivedDate =
        app?.date_received ??
        app?.application_date ??
        app?.created_at ??
        app?.date;

      if (!receivedDate) return false;

      const date = new Date(receivedDate);

      return (
        !Number.isNaN(date.getTime()) &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });

    const pendingScreening = safeApplications.filter((app) =>
      [
        "initial screening",
        "pending screening",
      ].includes(normalizeStatus(getApplicationStatus(app)))
    );

    const qualified = safeApplications.filter(
      (app) =>
        normalizeStatus(getApplicationStatus(app)) === "qualified"
    );

    const forAssessment = safeApplications.filter(
      (app) =>
        normalizeStatus(getApplicationStatus(app)) ===
        "for assessment"
    );

    return {
      vacanciesCount: openVacancies.length,
      monthCount: applicationsThisMonth.length,
      pendingCount: pendingScreening.length,
      qualifiedCount: qualified.length,
      assessmentCount: forAssessment.length,
      totalCount: safeApplications.length,
    };
  }, [safeApplications, safeVacancies]);

  const ReceiveApplication = () => {
    navigate("/receiveApplicant");
  };

  const PostVacancy = () => {
    navigate("/postVacancies");
  };

  const openApplication = (app) => {
    const applicationId = getApplicationId(app);

    if (applicationId === null || applicationId === "") return;

    setIsNotifOpen(false);

    navigate("/allApplications", {
      state: {
        selectedApplicationId: applicationId,
      },
    });
  };

  const openAllApplications = () => {
    setIsNotifOpen(false);
    navigate("/allApplications");
  };

  const statCards = [
    {
      title: "Open Vacancies",
      count: loading ? "..." : metrics.vacanciesCount,
      to: "/vacancyPosting",
      iconBg: "bg-[#e8edf5] text-[#113a70]",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V5Z" />
          <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5V11H3V8.5Z" />
          <path d="M3 12.5V15a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-2.5H3Z" />
        </svg>
      ),
    },
    {
      title: "Applications (This Month)",
      count: loading ? "..." : metrics.monthCount,
      to: "/allApplications",
      iconBg: "bg-[#eff6ff] text-[#3b82f6]",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      ),
    },
    {
      title: "Pending Screening",
      count: loading ? "..." : metrics.pendingCount,
      to: "/initialScreening",
      iconBg: "bg-[#fffbeb] text-[#f5a623]",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      title: "Qualified",
      count: loading ? "..." : metrics.qualifiedCount,
      to: "/initialEvaluationResults",
      iconBg: "bg-[#ecfdf5] text-[#10b981]",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      title: "For Assessment",
      count: loading ? "..." : metrics.assessmentCount,
      to: "/interviewSession",
      iconBg: "bg-[#faf5ff] text-[#8b5cf6]",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
        </svg>
      ),
    },
    {
      title: "Total Applications",
      count: loading ? "..." : metrics.totalCount,
      to: "/allApplications",
      iconBg: "bg-[#f0fdf4] text-[#059669]",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6 font-sans min-h-fit">
      {/* Header */}
      <div className="relative w-full min-h-[88px] overflow-visible rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74] rounded-l-2xl" />

        <div>
          <div className="flex items-center gap-2 text-[#113a70]">
            <svg className="w-5 h-5 text-[#1e3a6d]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
            </svg>
            <h2 className="text-[19px] font-bold tracking-tight">
              Dashboard
            </h2>
          </div>

          <p className="text-[12.5px] text-gray-400 mt-0.5">
            DepEd Regional Office 1 (Region 1)
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={ReceiveApplication}
            className="bg-[#f5a623] hover:bg-[#e0951a] text-white text-[12.5px] font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Receive Application
          </button>

          <button
            type="button"
            onClick={PostVacancy}
            className="bg-[#1e3a6d] hover:bg-[#152a50] text-white text-[12.5px] font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Post Vacancy
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="relative p-2.5 text-[#1e3a6d] bg-blue-50 hover:bg-[#1e3a6d] hover:text-white rounded-xl border border-blue-200 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
              aria-label={`Notifications: ${pendingVerifications.length} applications requiring review`}
              aria-expanded={isNotifOpen}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>

              {pendingVerifications.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white border-2 border-white shadow-sm">
                  {pendingVerifications.length > 99
                    ? "99+"
                    : pendingVerifications.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden text-left">
                <div className="px-5 py-4 bg-[#1b365d] text-white flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold tracking-wide uppercase">
                      Applications Requiring HR Review
                    </h3>
                    <p className="text-[11px] text-slate-200 mt-0.5">
                      Newly submitted applications awaiting review
                    </p>
                  </div>

                  <span className="text-xs font-bold bg-white text-[#1b365d] px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                    {pendingVerifications.length} Pending
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      Loading applications...
                    </div>
                  ) : pendingVerifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      <p className="font-bold text-[#1b365d]">
                        All caught up!
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        No applications are currently awaiting HR review.
                      </p>
                    </div>
                  ) : (
                    pendingVerifications.map((app) => {
                      const id = getApplicationId(app);

                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() => openApplication(app)}
                          className="w-full p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer group flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-[#1b365d]">
                              {getApplicantName(app)}
                            </p>

                            <p className="text-[11px] text-slate-500 font-medium">
                              {getPosition(app)}
                            </p>

                            <div className="pt-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-orange-800 bg-orange-50 border border-orange-100">
                                {getApplicationStatus(app)}
                              </span>
                            </div>
                          </div>

                          <span className="text-xs text-[#1b365d] font-semibold">
                            View
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={openAllApplications}
                    className="w-full text-center text-xs font-semibold text-[#1b365d] hover:underline cursor-pointer"
                  >
                    Show all applications
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {statCards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => navigate(card.to)}
            aria-label={`${card.title}: ${card.count}`}
            className="flex min-h-36 cursor-pointer flex-col gap-3.5 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a6d] focus-visible:ring-offset-2"
          >
            <div className="flex items-start justify-between w-full">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center ${card.iconBg}`}>
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
          </button>
        ))}
      </div>
    </div>
  );
}
