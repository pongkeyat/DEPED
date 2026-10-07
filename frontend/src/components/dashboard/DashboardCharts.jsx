import { useState } from "react";

export default function DashboardCharts({
  applications = [],
  vacancies = [],
  loading = false,
}) {
  const [trendTooltip, setTrendTooltip] = useState(null);
  const [statusTooltip, setStatusTooltip] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // ============================================================
  // APPLICATION TREND - LAST 6 MONTHS
  // ============================================================

  const trendData = (() => {
    const today = new Date();

    const months = Array.from(
      { length: 6 },
      (_, index) => {
        const date = new Date(
          today.getFullYear(),
          today.getMonth() - 5 + index,
          1
        );

        return {
          key: `${date.getFullYear()}-${date.getMonth()}`,
          month: date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          count: 0,
          xPos: 90 + index * 92,
        };
      }
    );

    const monthIndexes = new Map(
      months.map((month, index) => [
        month.key,
        index,
      ])
    );

    applications.forEach((application) => {
      if (!application.date_received) return;

      const date = new Date(
        application.date_received
      );

      if (Number.isNaN(date.getTime())) return;

      const index = monthIndexes.get(
        `${date.getFullYear()}-${date.getMonth()}`
      );

      if (index !== undefined) {
        months[index].count += 1;
      }
    });

    const maxCount = Math.max(
      ...months.map((month) => month.count),
      1
    );

    const maxAxisValue = Math.max(
      4,
      Math.ceil(maxCount / 4) * 4
    );

    const chartTop = 15;
    const chartBottom = 190;

    return {
      months: months.map((month) => ({
        ...month,
        yPos:
          chartBottom -
          (month.count / maxAxisValue) *
            (chartBottom - chartTop),
      })),
      maxAxisValue,
      chartTop,
      chartBottom,
    };
  })();

  // ============================================================
  // APPLICATION STATUS DONUT
  // ============================================================

  const getStatusMetrics = () => {
    const baseline = {
      ranked: 0,
      forAssessment: 0,
      initialScreening: 0,
      qualified: 0,
      endorsed: 0,
      appointed: 0,
      disqualified: 0,
      other: 0,
    };

    applications.forEach((app) => {
      const status = String(
        app.application_status ||
          "Initial Screening"
      )
        .trim()
        .toLowerCase();

      const statusKey = {
        rank: "ranked",
        ranked: "ranked",
        "for assessment": "forAssessment",
        "initial screening": "initialScreening",
        "pending screening": "initialScreening",
        qualified: "qualified",
        endorsed: "endorsed",
        appointed: "appointed",
        "not qualified": "disqualified",
        disqualified: "disqualified",
      }[status];

      if (statusKey) {
        baseline[statusKey]++;
      } else {
        baseline.other++;
      }
    });

    const total = applications.length || 1;
    let currentOffset = 0;

    const statusConfig = [
      {
        key: "ranked",
        label: "Ranked",
        color: "#1d3b6a",
      },
      {
        key: "forAssessment",
        label: "For Assessment",
        color: "#3b82f6",
      },
      {
        key: "initialScreening",
        label: "Initial Screening",
        color: "#10b981",
      },
      {
        key: "qualified",
        label: "Qualified",
        color: "#f5a623",
      },
      {
        key: "endorsed",
        label: "Endorsed",
        color: "#dc3545",
      },
      {
        key: "appointed",
        label: "Appointed",
        color: "#8b5cf6",
      },
      {
        key: "disqualified",
        label: "Disqualified",
        color: "#ef4444",
      },
      {
        key: "other",
        label: "Other",
        color: "#94a3b8",
      },
    ];

    const chartSegments = statusConfig.map(
      (config) => {
        const count = baseline[config.key];

        const percentage =
          (count / total) * 100;

        const dashArray = `${percentage} ${
          100 - percentage
        }`;

        const offset = `-${currentOffset}`;

        const minPct = currentOffset;

        const maxPct =
          currentOffset + percentage;

        currentOffset += percentage;

        return {
          label: config.label,
          count,
          color: config.color,
          dashArray,
          offset,
          minPct,
          maxPct,
        };
      }
    );

    return {
      chartSegments,
    };
  };

  const {
    chartSegments: statusData,
  } = getStatusMetrics();

  // ============================================================
  // STATUS COLORS
  // ============================================================

  const getStatusColor = (status) => {
    switch (
      String(status || "")
        .trim()
        .toLowerCase()
    ) {
      case "for assessment":
        return "bg-blue-100 text-blue-700 border-blue-200";

      case "qualified":
        return "bg-green-100 text-green-700 border-green-200";

      case "rank":
      case "ranked":
        return "bg-purple-100 text-purple-700 border-purple-200";

      case "not qualified":
      case "disqualified":
        return "bg-red-100 text-red-700 border-red-200";

      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // ============================================================
  // STATUS LABEL
  // ============================================================

  const getStatusLabel = (status) => {
    const normalizedStatus = String(
      status || ""
    )
      .trim()
      .toLowerCase();

    if (normalizedStatus === "rank") {
      return "Ranked";
    }

    if (normalizedStatus === "not qualified") {
      return "Disqualified";
    }

    return status || "Initial Screening";
  };

  // ============================================================
  // RECENT APPLICATIONS
  // ============================================================

  const recentApplications = [...applications]
    .sort((first, second) => {
      const firstDate = new Date(
        first.date_received || 0
      ).getTime();

      const secondDate = new Date(
        second.date_received || 0
      ).getTime();

      return secondDate - firstDate;
    })
    .slice(0, 10)
    .map((app) => {
      const parsedDate = app.date_received
        ? new Date(app.date_received)
        : null;

      const formattedDate =
        parsedDate &&
        !Number.isNaN(
          parsedDate.getTime()
        )
          ? parsedDate.toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "2-digit",
                year: "numeric",
              }
            )
          : "N/A";

      return {
        code: `DEPED-APP-${app.job_applications_id}`,

        applicant:
          `${app.last_name || ""}, ${
            app.first_name || ""
          } ${app.middle_name || ""}`
            .trim()
            .toUpperCase(),

        position:
          app.position_title ||
          "Unassigned Position",

        sg: app.salary_grade
          ? `SG ${app.salary_grade}`
          : "N/A",

        date: formattedDate,

        status: getStatusLabel(
          app.application_status
        ),

        statusColor: getStatusColor(
          app.application_status
        ),
      };
    });

  // ============================================================
  // OPEN VACANCIES
  // ============================================================

  const openVacancies = vacancies
    .filter((vacancy) => {
      const status = String(
        vacancy.status || ""
      )
        .trim()
        .toLowerCase();

      const today = new Date();

      const todayKey = [
        today.getFullYear(),
        String(
          today.getMonth() + 1
        ).padStart(2, "0"),
        String(
          today.getDate()
        ).padStart(2, "0"),
      ].join("-");

      const deadlineKey =
        vacancy.application_deadline
          ? String(
              vacancy.application_deadline
            ).slice(0, 10)
          : "";

      return (
        (status === "active" ||
          status === "open") &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(
          deadlineKey
        ) ||
          deadlineKey >= todayKey)
      );
    })
    .slice(0, 2)
    .map((vacancy) => {
      const applicantCount =
        applications.filter(
          (application) =>
            String(
              application.vacancy_id || ""
            ).trim() ===
            String(
              vacancy.vacancy_id || ""
            ).trim()
        ).length;

      return {
        title:
          vacancy.position_title ||
          vacancy.plantilla_position ||
          "Vacancy",

        code: vacancy.vacancy_id,

        sg: vacancy.salary_grade
          ? `SG ${vacancy.salary_grade}`
          : "SG N/A",

        slots: `${
          vacancy.number_of_vacancies || 0
        } slot(s)`,

        department:
          vacancy.office_unit || "N/A",

        applicants: `${applicantCount} applicant(s)`,

        isActive: true,
      };
    });

  // ============================================================
  // STATUS DONUT TOOLTIP
  // ============================================================

  const handleMouseMove = (e) => {
    const bounds =
      e.currentTarget.getBoundingClientRect();

    const x =
      e.clientX - bounds.left;

    const y =
      e.clientY - bounds.top;

    setMousePos({
      x,
      y,
    });

    const centerX =
      bounds.width / 2;

    const centerY =
      bounds.height / 2;

    const dx = x - centerX;
    const dy = y - centerY;

    const distance = Math.sqrt(
      dx * dx + dy * dy
    );

    if (
      distance < 45 ||
      distance > 120
    ) {
      setStatusTooltip(null);
      return;
    }

    let angle =
      Math.atan2(dy, dx) *
      (180 / Math.PI);

    angle = angle + 90;

    if (angle < 0) {
      angle += 360;
    }

    const percent =
      (angle / 360) * 100;

    const activeSegment =
      statusData.find(
        (seg) =>
          percent >= seg.minPct &&
          percent <= seg.maxPct
      );

    if (
      activeSegment &&
      activeSegment.count > 0
    ) {
      setStatusTooltip(
        activeSegment
      );
    } else {
      setStatusTooltip(null);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="w-full text-center py-20 font-sans text-gray-500 font-semibold">
        Retrieving analytics data...
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="w-full flex flex-col gap-6">

      {/* ======================================================
          TOP SECTION
      ======================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ====================================================
            APPLICATION TREND
        ===================================================== */}

        <div className="lg:col-span-2 flex h-[410px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="bg-[#1e4e8c] px-5 py-3.5 flex items-center gap-2.5">

            <svg
              className="w-5 h-5 text-white opacity-95"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
              />
            </svg>

            <h3 className="text-white text-[15px] font-bold tracking-wide">
              Application Trend (Last 6 Months)
            </h3>

          </div>

          <div className="flex-1 p-6 flex flex-col justify-between relative">

            <div className="flex justify-center items-center gap-6 text-[12px] text-gray-500 font-medium mb-2">

              <div className="flex items-center gap-2">
                <span className="w-8 h-3.5 bg-[#dbe2ec] border-2 border-[#1e4e8c] rounded-xs" />
                <span>Applications</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-8 h-0.5 bg-[#f5a623] relative flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#f5a623] absolute" />
                </span>
                <span>Trend</span>
              </div>

            </div>

            <div className="w-full flex-1 relative px-2">

              {trendTooltip !== null &&
                trendData.months[
                  trendTooltip
                ] && (
                  <div
                    className="absolute z-10 bg-[#2d3139] text-white text-[12px] rounded-lg p-2 shadow-xl border border-gray-700 pointer-events-none"
                    style={{
                      left: `${
                        (trendData.months[
                          trendTooltip
                        ].xPos /
                          640) *
                        100
                      }%`,
                      top: `${
                        (trendData.months[
                          trendTooltip
                        ].yPos /
                          240) *
                          100 -
                        12
                      }%`,
                      transform:
                        "translate(-35%, -100%)",
                    }}
                  >

                    <div className="absolute bottom-[-5px] left-6 w-2.5 h-2.5 bg-[#2d3139] transform rotate-45 border-r border-b border-gray-700" />

                    <div className="font-bold border-b border-gray-600 pb-0.5 mb-1 px-1">
                      {
                        trendData.months[
                          trendTooltip
                        ].month
                      }
                    </div>

                    <div className="flex items-center gap-1.5 px-1 font-medium">

                      <span className="w-2.5 h-2.5 bg-[#3b82f6] rounded-xs inline-block" />

                      <span className="text-gray-300">
                        Applications:
                      </span>

                      <span className="font-bold">
                        {
                          trendData.months[
                            trendTooltip
                          ].count
                        }
                      </span>

                    </div>

                  </div>
                )}

              <svg
                className="w-full h-full"
                viewBox="0 0 640 240"
                preserveAspectRatio="xMidYMid meet"
              >

                {Array.from(
                  { length: 5 },
                  (_, index) => {
                    const val = Math.round(
                      trendData.maxAxisValue -
                        (trendData.maxAxisValue *
                          index) /
                          4
                    );

                    const yPos =
                      trendData.chartTop +
                      ((trendData.chartBottom -
                        trendData.chartTop) *
                        index) /
                        4;

                    return (
                      <g key={val}>

                        <text
                          x="42"
                          y={yPos + 4}
                          className="text-[11px] fill-gray-400 font-medium"
                          textAnchor="end"
                        >
                          {val}
                        </text>

                        <line
                          x1="38"
                          y1={yPos}
                          x2="620"
                          y2={yPos}
                          stroke="#f1f3f7"
                          strokeWidth="1.2"
                        />

                      </g>
                    );
                  }
                )}

                {trendData.months.map(
                  (month, index) => (
                    <g key={month.key}>

                      <rect
                        x={month.xPos - 28}
                        y={month.yPos}
                        width="56"
                        height={Math.max(
                          0,
                          trendData.chartBottom -
                            month.yPos
                        )}
                        fill="#dbe2ec"
                        stroke="#1e4e8c"
                        strokeWidth="2"
                        className="cursor-pointer transition-opacity hover:opacity-90"
                        onMouseEnter={() =>
                          setTrendTooltip(
                            index
                          )
                        }
                        onMouseLeave={() =>
                          setTrendTooltip(null)
                        }
                      />

                      {index > 0 && (
                        <line
                          x1={
                            trendData.months[
                              index - 1
                            ].xPos
                          }
                          y1={
                            trendData.months[
                              index - 1
                            ].yPos
                          }
                          x2={month.xPos}
                          y2={month.yPos}
                          stroke="#f5a623"
                          strokeWidth="2.2"
                        />
                      )}

                      <circle
                        cx={month.xPos}
                        cy={month.yPos}
                        r="5.5"
                        fill="#f5a623"
                        className="cursor-pointer"
                        onMouseEnter={() =>
                          setTrendTooltip(
                            index
                          )
                        }
                        onMouseLeave={() =>
                          setTrendTooltip(null)
                        }
                      />

                      <text
                        x={month.xPos}
                        y="212"
                        className="text-[11px] fill-gray-400 font-medium"
                        textAnchor="middle"
                      >
                        {month.month}
                      </text>

                    </g>
                  )
                )}

              </svg>

            </div>

          </div>

        </div>

        {/* ====================================================
            APPLICATION STATUS
        ===================================================== */}

        <div className="bg-white rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col h-[410px]">

          <div className="bg-[#1e4e8c] px-5 py-3.5 flex items-center gap-2.5">

            <svg
              className="w-5 h-5 text-white opacity-95"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"
              />
            </svg>

            <h3 className="text-white text-[15px] font-bold tracking-wide">
              Application Status
            </h3>

          </div>

          <div className="flex-1 p-4 flex flex-col items-center justify-between relative">

            <div
              className="w-full flex-1 relative flex items-center justify-center"
              onMouseMove={handleMouseMove}
              onMouseLeave={() =>
                setStatusTooltip(null)
              }
            >

              {statusTooltip &&
                statusTooltip.label && (
                  <div
                    className="absolute z-10 bg-[#2d3139] text-white text-[12px] rounded-lg p-2 shadow-xl border border-gray-700 pointer-events-none"
                    style={{
                      left: `${mousePos.x}px`,
                      top: `${mousePos.y}px`,
                      transform:
                        "translate(-20%, -115%)",
                    }}
                  >

                    <div className="absolute bottom-[-4px] left-4 w-2 h-2 bg-[#2d3139] transform rotate-45 border-r border-b border-gray-700" />

                    <div className="font-bold px-1">
                      {statusTooltip.label}
                    </div>

                    <div className="flex items-center gap-2 px-1 font-medium mt-0.5">

                      <span
                        className="w-2.5 h-2.5 rounded-xs inline-block"
                        style={{
                          backgroundColor:
                            statusTooltip.color,
                        }}
                      />

                      <span className="text-gray-300">
                        {statusTooltip.label}:
                      </span>

                      <span className="font-bold">
                        {
                          statusTooltip.count
                        }{" "}
                        application(s)
                      </span>

                    </div>

                  </div>
                )}

              <div className="w-56 h-56 relative flex items-center justify-center pointer-events-none">

                <svg
                  className="w-full h-full transform -rotate-90 scale-105"
                  viewBox="0 0 42 42"
                >

                  <circle
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke="#f1f3f7"
                    strokeWidth="7.2"
                  />

                  {statusData.map(
                    (seg, i) => (
                      <circle
                        key={i}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="7.5"
                        strokeDasharray={
                          seg.dashArray
                        }
                        strokeDashoffset={
                          seg.offset
                        }
                      />
                    )
                  )}

                </svg>

                {/* Center of donut */}
                <div className="absolute w-[124px] h-[124px] bg-white rounded-full shadow-inner flex flex-col items-center justify-center text-center">

                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Total
                  </span>

                  <div className="text-[22px] font-bold text-gray-700 mt-1">
                    {applications.length}
                  </div>

                  <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">
                    Applications
                  </span>

                </div>

              </div>

            </div>

            <div className="w-full grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] text-gray-500 font-semibold px-3 pt-3 border-t border-gray-50">

              {statusData.map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between"
                  >

                    <div className="flex items-center gap-2">

                      <span
                        className="w-2.5 h-2.5 rounded-xs inline-block"
                        style={{
                          backgroundColor:
                            item.color,
                        }}
                      />

                      <span className="text-gray-600">
                        {item.label}
                      </span>

                    </div>

                    <span className="text-gray-800 font-bold">
                      {item.count}
                    </span>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          BOTTOM SECTION
      ======================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ====================================================
            RECENT APPLICATIONS
        ===================================================== */}

        <div className="lg:col-span-2 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="bg-[#1e4e8c] px-5 py-3 flex items-center justify-between shrink-0">

            <div className="flex items-center gap-2.5">

              <svg
                className="w-5 h-5 text-white opacity-95"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>

              <h3 className="text-white text-[15px] font-bold tracking-wide">
                Recent Applications
              </h3>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left border-collapse">

              <thead>

                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70">

                  <th className="px-5 py-3">
                    Code
                  </th>

                  <th className="px-4 py-3">
                    Applicant
                  </th>

                  <th className="px-4 py-3">
                    Position
                  </th>

                  <th className="px-4 py-3">
                    Date
                  </th>

                  <th className="px-5 py-3 text-center">
                    Process Status
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-50 text-[13px] text-gray-700 font-medium">

                {recentApplications.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan="5"
                      className="px-5 py-8 text-center text-gray-400 font-semibold"
                    >
                      No recent records available
                    </td>

                  </tr>
                ) : (
                  recentApplications.map(
                    (app, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50/60 transition-colors"
                      >

                        <td className="px-5 py-3 text-[11px] font-semibold text-blue-600/80 tracking-tight">
                          {app.code}
                        </td>

                        <td className="px-4 py-3 font-bold text-gray-800">
                          {app.applicant}
                        </td>

                        <td className="px-4 py-3">

                          <div className="font-semibold text-gray-700">
                            {app.position}
                          </div>

                          <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                            {app.sg}
                          </div>

                        </td>

                        <td className="px-4 py-3 text-gray-500 font-semibold">
                          {app.date}
                        </td>

                        <td className="px-5 py-3 text-center">

                          <span
                            className={`inline-block px-3 py-1 text-[11px] font-bold rounded-full border ${app.statusColor}`}
                          >
                            {app.status}
                          </span>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* ====================================================
            OPEN VACANCIES
        ===================================================== */}

        <div className="bg-white rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col h-[320px]">

          <div className="bg-[#1e4e8c] px-5 py-3 flex items-center justify-between shrink-0">

            <div className="flex items-center gap-2.5">

              <svg
                className="w-5 h-5 text-white opacity-95"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 14.15v4.25c0 .414-.336.75-.75.75H4.5a.75.75 0 0 1-.75-.75V14.15M20.25 14.15a4.49 4.49 0 0 0-3.321-4.341l-2.454-.614a1.5 1.5 0 0 1-1.111-1.11L12.25 5.39a1.5 1.5 0 0 0-2.5 0l-.614 2.454a1.5 1.5 0 0 1-1.11 1.11l-2.454.614A4.49 4.49 0 0 0 3.75 14.15m16.5 0H3.75"
                />
              </svg>

              <h3 className="text-white text-[15px] font-bold tracking-wide">
                Open Vacancies
              </h3>

            </div>

          </div>

          <div className="flex-1 p-4 flex flex-col gap-4 divide-y divide-gray-100 overflow-y-auto custom-scrollbar">

            {openVacancies.length === 0 ? (
              <div className="text-center text-gray-400 py-10 text-[13px] font-semibold">
                No open vacancies active
              </div>
            ) : (
              openVacancies.map(
                (vacancy, index) => (
                  <div
                    key={index}
                    className={`flex flex-col justify-between relative ${
                      index > 0
                        ? "pt-4"
                        : ""
                    }`}
                  >

                    <div className="absolute top-[18px] right-1 flex flex-col items-end gap-1.5">

                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 border text-[10px] font-bold rounded-sm uppercase tracking-wider ${
                          vacancy.isActive
                            ? "border-green-200 text-green-600 bg-green-50"
                            : "border-red-200 text-red-600 bg-red-50"
                        }`}
                      >
                        {vacancy.isActive
                          ? "Open"
                          : "Closed"}
                      </span>

                      <span className="flex items-center gap-1 text-[11px] text-gray-400 font-semibold mt-1">

                        <svg
                          className="w-3.5 h-3.5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-2.533-3.076m-9.309 3.092a9.336 9.336 0 0 1-4.122-.952 4.125 4.125 0 0 0-2.533-3.076m4.14-3.329A4.488 4.488 0 0 0 5.25 9a4.488 4.488 0 0 0 1.685 3.525m11.95 0A4.488 4.488 0 0 0 18.75 9a4.488 4.488 0 0 0-1.685 3.525M12 12.75a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"
                          />
                        </svg>

                        {vacancy.applicants}

                      </span>

                    </div>

                    <div className="pr-24">

                      <h4 className="text-gray-800 font-bold text-[14px] leading-tight hover:text-blue-600 cursor-pointer transition-colors">
                        {vacancy.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400 font-semibold mt-1">

                        <span className="text-gray-400/90">
                          {vacancy.code}
                        </span>

                        <span className="text-gray-300">
                          •
                        </span>

                        <span>
                          {vacancy.sg}
                        </span>

                        <span className="text-gray-300">
                          •
                        </span>

                        <span className="text-gray-500 font-bold">
                          {vacancy.slots}
                        </span>

                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium mt-3.5">

                        <svg
                          className="w-3.5 h-3.5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21h10.5V3.75c0-.414-.336-.75-.75-.75H7.5a.75.75 0 0 0-.75.75V21Z"
                          />
                        </svg>

                        <span>
                          {vacancy.department}
                        </span>

                      </div>

                    </div>

                  </div>
                )
              )
            )}

          </div>

        </div>

      </div>

    </div>
  );
}