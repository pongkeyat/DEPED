import React, { useState, useEffect } from "react";
import { getApplications } from "../../api/ApplicationApi";

export default function DashboardCharts() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendTooltip, setTrendTooltip] = useState(null);
  const [statusTooltip, setStatusTooltip] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const normalizeApplications = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    if (Array.isArray(response.rows)) return response.rows;
    if (Array.isArray(response.applications)) return response.applications;
    return [];
  };

  // 1. Fetch live database data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getApplications();
        setApplications(normalizeApplications(response));
      } catch (error) {
        console.error("Error loading main dashboard data:", error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Dynamically calculate trends (grouped by month/year)
  const getTrendMetrics = () => {
    const counts = { apr: 0, may: 0 };
    applications.forEach(app => {
      if (!app.date_received) return;
      const date = new Date(app.date_received);
      const month = date.getMonth();
      const year = date.getFullYear();

      if (year === 2026 && month === 3) counts.apr++; // April
      if (year === 2026 && month === 4) counts.may++; // May
    });

    const maxVal = 14; 
    const getChartY = (count) => 15 + (8 - 1.5 - ((count / maxVal) * 5)) * 25; 

    return {
      apr: { month: "Apr 2026", count: counts.apr, xPos: 175, yPos: getChartY(counts.apr) },
      may: { month: "May 2026", count: counts.may, xPos: 465, yPos: getChartY(counts.may) }
    };
  };

  const trendData = getTrendMetrics();

  // 3. Dynamic Application Status Donut & Document State Calculation
  const getStatusMetrics = () => {
    const baseline = {
      "Ranked": 0,
      "For Assessment": 0,
      "Initial Screening": 0,
      "Qualified": 0,
      "Endorsed": 0,
      "Appointed": 0
    };

    let completeCount = 0;
    let incompleteCount = 0;

    applications.forEach(app => {
      const status = app.application_status || "Initial Screening";
      if (baseline[status] !== undefined) {
        baseline[status]++;
      }

      if (app.document_status === "Complete" || app.is_complete === true) {
        completeCount++;
      } else if (app.document_status === "Incomplete" || app.is_complete === false) {
        incompleteCount++;
      }
    });

    const total = applications.length || 1;
    let currentOffset = 0;

    const statusConfig = [
      { key: "Ranked", label: "Ranked", color: "#1d3b6a" },
      { key: "For Assessment", label: "For Assessment", color: "#3b82f6" },
      { key: "Initial Screening", label: "Initial Screening", color: "#10b981" },
      { key: "Qualified", label: "Qualified", color: "#f5a623" },
      { key: "Endorsed", label: "Endorsed", color: "#dc3545" },
      { key: "Appointed", label: "Appointed", color: "#8b5cf6" },
    ];

    const chartSegments = statusConfig.map(config => {
      const count = baseline[config.key];
      const percentage = Math.round((count / total) * 100);
      const dashArray = `${percentage} 100`;
      const offset = `-${currentOffset}`;
      const minPct = currentOffset;
      const maxPct = currentOffset + percentage;
      
      currentOffset += percentage;

      return {
        label: config.label === "Initial Screening" ? "Screening" : config.label,
        count,
        color: config.color,
        dashArray,
        offset,
        minPct,
        maxPct
      };
    });

    return {
      chartSegments,
      metaCounts: {
        complete: completeCount,
        incomplete: incompleteCount
      }
    };
  };

  const { chartSegments: statusData, metaCounts } = getStatusMetrics();

  // 4. Transform dynamic applications into table presentation data
  const getStatusColor = (status) => {
    switch(status) {
      case "For Assessment": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Qualified": return "bg-green-100 text-green-700 border-green-200";
      case "Ranked": return "bg-purple-100 text-purple-700 border-purple-200";
      case "Complete": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Incomplete": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // STRICTLY LIMITED TO 10 ROWS
  const recentApplications = applications.slice(0, 10).map(app => {
    const formattedDate = app.date_received 
      ? new Date(app.date_received).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      : "N/A";

    return {
      code: `DEPED-APP-${app.job_applications_id}`,
      applicant: `${app.last_name || ""}, ${app.first_name || ""} ${app.middle_name || ""}`.toUpperCase(),
      position: app.position_title || "Unassigned Position",
      sg: "N/A", 
      date: formattedDate,
      status: app.application_status || "Initial Screening",
      statusColor: getStatusColor(app.application_status),
      docStatus: app.document_status || "Incomplete" 
    };
  });

  // 5. Aggregate unique vacancies based on fetched data listings
  const getOpenVacancies = () => {
    const vacancyMap = {};
    applications.forEach(app => {
      if (!app.vacancy_id) return;
      if (!vacancyMap[app.vacancy_id]) {
        // Fallback checks for active state fields from your backend API model
        const statusField = app.vacancy_status?.toLowerCase() || "";
        const isActiveVacancy = statusField === "active" || statusField === "open" || app.is_active === true || app.is_active === 1;

        vacancyMap[app.vacancy_id] = {
          title: app.position_title || "Vacancy Title",
          code: `VCY-${app.vacancy_id}`,
          sg: "SG Level",
          slots: "1 slot(s)",
          department: app.office_unit || "General Unit",
          isActive: isActiveVacancy, // Dynamic value passed to template render loop
          applicantCount: 0
        };
      }
      vacancyMap[app.vacancy_id].applicantCount++;
    });

    return Object.values(vacancyMap).slice(0, 2).map(v => ({
      ...v,
      applicants: `${v.applicantCount} applicant(s)`
    }));
  };

  const openVacancies = getOpenVacancies();

  const handleMouseMove = (e) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top; 
    setMousePos({ x, y });

    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 45 || distance > 120) {
      setStatusTooltip(null);
      return;
    }

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = angle + 90; 
    if (angle < 0) angle += 360;
    const percent = (angle / 360) * 100;

    const activeSegment = statusData.find((seg) => percent >= seg.minPct && percent <= seg.maxPct);
    if (activeSegment && activeSegment.count > 0) setStatusTooltip(activeSegment);
    else setStatusTooltip(null);
  };

  if (loading) {
    return (
      <div className="w-full text-center py-20 font-sans text-gray-500 font-semibold">
        Retrieving analytics data...
      </div>
    );
  }

  return (
    <div className="w-full px-6 pb-24 mb-6 bg-[#f4f7fc] flex flex-col gap-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
        {/* Trend Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col h-[410px]">
          <div className="bg-[#1e4e8c] px-5 py-3.5 flex items-center gap-2.5">
            <svg className="w-5 h-5 text-white opacity-95" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
            <h3 className="text-white text-[15px] font-bold tracking-wide">Application Trend (Last 6 Months)</h3>
          </div>
          <div className="flex-1 p-6 flex flex-col justify-between relative">
            <div className="flex justify-center items-center gap-6 text-[12px] text-gray-500 font-medium mb-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-3.5 bg-[#dbe2ec] border-2 border-[#1e4e8c] rounded-xs"></span>
                <span>Applications</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-0.5 bg-[#f5a623] relative flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#f5a623] absolute"></span>
                </span>
                <span>Trend</span>
              </div>
            </div>
            <div className="w-full flex-1 relative px-2">
              {trendTooltip && (
                <div className="absolute z-10 bg-[#2d3139] text-white text-[12px] rounded-lg p-2 shadow-xl border border-gray-700 pointer-events-none" style={{ left: `${(trendData[trendTooltip].xPos / 640) * 100}%`, top: `${(trendData[trendTooltip].yPos / 240) * 100 - 12}%`, transform: 'translate(-35%, -100%)' }}>
                  <div className="absolute bottom-[-5px] left-6 w-2.5 h-2.5 bg-[#2d3139] transform rotate-45 border-r border-b border-gray-700"></div>
                  <div className="font-bold border-b border-gray-600 pb-0.5 mb-1 px-1">{trendData[trendTooltip].month}</div>
                  <div className="flex items-center gap-1.5 px-1 font-medium">
                    <span className="w-2.5 h-2.5 bg-[#3b82f6] rounded-xs inline-block"></span>
                    <span className="text-gray-300">Applications:</span>
                    <span className="font-bold">{trendData[trendTooltip].count}</span>
                  </div>
                </div>
              )}
              <svg className="w-full h-full" viewBox="0 0 640 240" preserveAspectRatio="xMidYMid meet">
                {[14, 12, 10, 8, 6, 4, 2, 0].map((val, i) => {
                  const yPos = 15 + i * 25;
                  return (
                    <g key={val}>
                      <text x="25" y={val === 0 ? yPos : yPos + 4} className="text-[11px] fill-gray-400 font-medium" textAnchor="end">{val}</text>
                      <line x1="38" y1={yPos} x2="620" y2={yPos} stroke="#f1f3f7" strokeWidth="1.2" />
                    </g>
                  );
                })}
                <rect x="70" y={trendData.apr.yPos} width="210" height={Math.max(0, 190 - trendData.apr.yPos)} fill="#dbe2ec" stroke="#1e4e8c" strokeWidth="2" className="cursor-pointer transition-opacity hover:opacity-90" onMouseEnter={() => setTrendTooltip("apr")} onMouseLeave={() => setTrendTooltip(null)} />
                <rect x="360" y={trendData.may.yPos} width="210" height={Math.max(0, 190 - trendData.may.yPos)} fill="#dbe2ec" stroke="#1e4e8c" strokeWidth="2" className="cursor-pointer transition-opacity hover:opacity-90" onMouseEnter={() => setTrendTooltip("may")} onMouseLeave={() => setTrendTooltip(null)} />
                <line x1="175" y1={trendData.apr.yPos} x2="465" y2={trendData.may.yPos} stroke="#f5a623" strokeWidth="2.2" />
                <circle cx="175" cy={trendData.apr.yPos} r="5.5" fill="#f5a623" className="cursor-pointer" onMouseEnter={() => setTrendTooltip("apr")} onMouseLeave={() => setTrendTooltip(null)} />
                <circle cx="465" cy={trendData.may.yPos} r="5.5" fill="#f5a623" className="cursor-pointer" onMouseEnter={() => setTrendTooltip("may")} onMouseLeave={() => setTrendTooltip(null)} />
                <text x="175" y="212" className="text-[11px] fill-gray-400 font-medium" textAnchor="middle">Apr 2026</text>
                <text x="465" y="212" className="text-[11px] fill-gray-400 font-medium" textAnchor="middle">May 2026</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Status Distribution Area */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col h-[410px]">
          <div className="bg-[#1e4e8c] px-5 py-3.5 flex items-center gap-2.5">
            <svg className="w-5 h-5 text-white opacity-95" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
            </svg>
            <h3 className="text-white text-[15px] font-bold tracking-wide">Application Status</h3>
          </div>
          <div className="flex-1 p-4 flex flex-col items-center justify-between relative">
            <div className="w-full flex-1 relative flex items-center justify-center" onMouseMove={handleMouseMove} onMouseLeave={() => setStatusTooltip(null)}>
              {statusTooltip && statusTooltip.label && (
                <div className="absolute z-10 bg-[#2d3139] text-white text-[12px] rounded-lg p-2 shadow-xl border border-gray-700 pointer-events-none" style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px`, transform: 'translate(-20%, -115%)' }}>
                  <div className="absolute bottom-[-4px] left-4 w-2 h-2 bg-[#2d3139] transform rotate-45 border-r border-b border-gray-700"></div>
                  <div className="font-bold px-1">{statusTooltip.label}</div>
                  <div className="flex items-center gap-2 px-1 font-medium mt-0.5">
                    <span className="w-2.5 h-2.5 rounded-xs inline-block" style={{ backgroundColor: statusTooltip.color }}></span>
                    <span className="text-gray-300">{statusTooltip.label}:</span>
                    <span className="font-bold">{statusTooltip.count} application(s)</span>
                  </div>
                </div>
              )}
              <div className="w-56 h-56 relative flex items-center justify-center pointer-events-none">
                <svg className="w-full h-full transform -rotate-90 scale-105" viewBox="0 0 42 42">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f3f7" strokeWidth="7.2" />
                  {statusData.map((seg, i) => (
                    <circle key={i} cx="21" cy="21" r="15.915" fill="transparent" stroke={seg.color} strokeWidth="7.5" strokeDasharray={seg.dashArray} strokeDashoffset={seg.offset} />
                  ))}
                </svg>
                <div className="absolute w-[124px] h-[124px] bg-white rounded-full shadow-inner flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Verified</span>
                  <div className="text-[11px] font-bold text-gray-700 mt-0.5">
                    <span className="text-emerald-600">{metaCounts.complete} C</span>
                    <span className="text-gray-300 mx-1">/</span>
                    <span className="text-amber-600">{metaCounts.incomplete} I</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] text-gray-500 font-semibold px-3 pt-3 border-t border-gray-50">
              {statusData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs inline-block" style={{ backgroundColor: item.color }}></span>
                    <span className="text-gray-600">{item.label}</span>
                  </div>
                  <span className="text-gray-800 font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Recent Applications Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col">
          <div className="bg-[#1e4e8c] px-5 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-white opacity-95" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <h3 className="text-white text-[15px] font-bold tracking-wide">Recent Applications</h3>
            </div>
            <button className="bg-white text-[#1e4e8c] hover:bg-gray-50 font-bold text-[12px] px-3 py-1 rounded-md transition-colors shadow-sm">View All</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-center">Docs Status</th>
                  <th className="px-5 py-3 text-center">Process Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-[13px] text-gray-700 font-medium">
                {recentApplications.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-gray-400 font-semibold">No recent records available</td>
                  </tr>
                ) : (
                  recentApplications.map((app, index) => (
                    <tr key={index} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 text-[11px] font-semibold text-blue-600/80 tracking-tight">{app.code}</td>
                      <td className="px-4 py-3 font-bold text-gray-800">{app.applicant}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-700">{app.position}</div>
                        <div className="text-[11px] text-gray-400 font-medium mt-0.5">{app.sg}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-semibold">{app.date}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${getStatusColor(app.docStatus)}`}>
                          {app.docStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-block px-3 py-1 text-[11px] font-bold rounded-full border ${app.statusColor}`}>{app.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Open Vacancies Column */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col h-[320px]">
          <div className="bg-[#1e4e8c] px-5 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-white opacity-95" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .414-.336.75-.75.75H4.5a.75.75 0 0 1-.75-.75V14.15M20.25 14.15a4.49 4.49 0 0 0-3.321-4.341l-2.454-.614a1.5 1.5 0 0 1-1.111-1.11L12.25 5.39a1.5 1.5 0 0 0-2.5 0l-.614 2.454a1.5 1.5 0 0 1-1.11 1.11l-2.454.614A4.49 4.49 0 0 0 3.75 14.15m16.5 0H3.75" />
              </svg>
              <h3 className="text-white text-[15px] font-bold tracking-wide">Open Vacancies</h3>
            </div>
            <button className="bg-white text-[#1e4e8c] hover:bg-gray-50 font-bold text-[12px] px-3 py-1 rounded-md transition-colors shadow-sm">View All</button>
          </div>

          <div className="flex-1 p-4 flex flex-col gap-4 divide-y divide-gray-100 overflow-y-auto custom-scrollbar">
            {openVacancies.length === 0 ? (
              <div className="text-center text-gray-400 py-10 text-[13px] font-semibold">No open vacancies active</div>
            ) : (
              openVacancies.map((vacancy, index) => (
                <div key={index} className={`flex flex-col justify-between relative ${index > 0 ? "pt-4" : ""}`}>
                  <div className="absolute top-[18px] right-1 flex flex-col items-end gap-1.5">
                    {/* Dynamic Badge Block Evaluation */}
                    <span className={`flex items-center gap-1 px-2 py-0.5 border text-[10px] font-bold rounded-sm uppercase tracking-wider ${
                      vacancy.isActive 
                        ? "border-green-200 text-green-600 bg-green-50" 
                        : "border-red-200 text-red-600 bg-red-50"
                    }`}>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 font-semibold mt-1">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-2.533-3.076m-9.309 3.092a9.336 9.336 0 0 1-4.122-.952 4.125 4.125 0 0 1-2.533-3.076m4.14-3.329A4.488 4.488 0 0 0 5.25 9a4.488 4.488 0 0 0 1.685 3.525m11.95 0A4.488 4.488 0 0 0 18.75 9a4.488 4.488 0 0 0-1.685 3.525M12 12.75a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" /></svg>
                      {vacancy.applicants}
                    </span>
                  </div>

                  <div className="pr-24">
                    <h4 className="text-gray-800 font-bold text-[14px] leading-tight hover:text-blue-600 cursor-pointer transition-colors">{vacancy.title}</h4>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400 font-semibold mt-1">
                      <span className="text-gray-400/90">{vacancy.code}</span>
                      <span className="text-gray-300">•</span>
                      <span>{vacancy.sg}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500 font-bold">{vacancy.slots}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium mt-3.5">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21h10.5V3.75c0-.414-.336-.75-.75-.75H7.5a.75.75 0 0 0-.75.75V21Z" /></svg>
                      <span>{vacancy.department}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}