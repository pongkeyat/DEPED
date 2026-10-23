import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  FolderDown,
  FileText,
  ClipboardCheck,
  UserRoundCheck,
  User,
  CirclePlus,
  ContactRound,
  Database,
  MapPinPen,
  LampDesk,
  ChevronDown,
  ChevronRight,
  LayoutList,
  Signature
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const ROLES = {
  ADMIN: "admin",
  HRO: "hro",
  HRMPSB: "hrmpsb",
};

// ======================================================
// JWT HELPER
// ======================================================

const parseJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");

    return JSON.parse(
      atob(
        normalizedPayload.padEnd(
          Math.ceil(normalizedPayload.length / 4) * 4,
          "=",
        ),
      ),
    );
  } catch {
    return null;
  }
};

// ======================================================
// SIDEBAR
// ======================================================

export default function SideBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();

  const [isManagementOpen, setIsManagementOpen] = useState(() =>
    ["/positions", "/places-of-assignment", "/office-units"].includes(
      location.pathname,
    ),
  );

  const decodedToken = token ? parseJwt(token) : null;

  const rawRole =
    user?.role ||
    user?.user?.role ||
    user?.roleName ||
    user?.userRole ||
    decodedToken?.role ||
    decodedToken?.user?.role ||
    decodedToken?.roles?.[0] ||
    "";

  const userRole = typeof rawRole === "string" ? rawRole : "";

  const normalizedRole = userRole
    .toLowerCase()
    .replace(/^role_/, "")
    .replace(/\s+/g, "");

  const handleLogout = () => {
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  // ======================================================
  // MENU CONFIGURATION
  // ======================================================

  const menuSections = [
    {
      title: "VACANCY MANAGEMENT",
      roles: [ROLES.HRO],
      items: [
        {
          label: "Post New Vacancy",
          to: "/postVacancies",
          icon: PlusCircle,
        },
        {
          label: "Vacancy Postings",
          to: "/vacancyPosting",
          icon: Briefcase,
        },
        {
          label: "Management",
          icon: LayoutList,
          isDropdown: true,
          children: [
            {
              label: "Positions Management",
              to: "/positions",
              icon: Briefcase,
            },
            {
              label: "Places of Assignment",
              to: "/places-of-assignment",
              icon: MapPinPen,
            },
            {
              label: "Office Units",
              to: "/office-units",
              icon: LampDesk,
            },
          ],
        },
      ],
    },
    {
      title: "APPLICATIONS",
      roles: [ROLES.HRO],
      items: [
        {
          label: "Receive Application",
          to: "/receiveApplicant",
          icon: FolderDown,
        },
        {
          label: "All Applications",
          to: "/allApplications",
          icon: FileText,
        },
      ],
    },
    {
      title: "EVALUATION",
      roles: [ROLES.HRO],
      items: [
        {
          label: "Initial Evaluation",
          to: "/initialScreening",
          icon: ClipboardCheck,
        },
        {
          label: "Initial Evaluation Results",
          to: "/initialEvaluationResults",
          icon: UserRoundCheck,
        },
      ],
    },
    {
      title: "REPORTS",
      roles: [ROLES.HRO],
      items: [
        {
          label: "Applicant Summary Report",
          to: "/applicant-summary-report",
          icon: FileText,
        },
      ],
    },
    {
      title: "ASSESSMENT",
      roles: [ROLES.HRMPSB],
      items: [
        {
          label: "Assessment Session",
          to: "/interviewSession",
          icon: ClipboardCheck,
        },
        {
          label: "Scoring",
          to: "/Scoring",
          icon: CirclePlus,
        },
      ],

    },
    {
      title: "RANKING",
      roles: [ROLES.ADMIN, ROLES.HRMPSB],
      items: [
        {
          label: "Comparative Assessment Result",
          to: "/comparative-assessment-result",
          icon: User,
        },
        {
          label: "Comparative Assessment Result/RQA",
          to: "/carrqa",
          icon: User,
        },
      ],
    },
    {
          title: "SIGNATURE",
      roles: [ROLES.HRMPSB, ROLES.HRO],
      items: [
        {
          label: "Signature Management",
          to: "/signature-management",
          icon: Signature,
        },
      ],
    },
    {
      title: "ADMIN",
      roles: [ROLES.ADMIN],
      items: [
        {
          label: "User Management",
          to: "/users",
          icon: ContactRound,
        },
        {
          label: "Database Backup",
          to: "/database-backup",
          icon: Database,
        },
        {
          label: "Audit Logs",
          to: "/audit-logs",
          icon: FileText,
        },
      ],
    },
  ];

  // ======================================================
  // ROLE FILTERING
  // ======================================================

  const filteredSections = menuSections.filter(
    (section) =>
      normalizedRole === ROLES.ADMIN || section.roles.includes(normalizedRole),
  );

  // ======================================================
  // PROFILE DETAILS
  // ======================================================

  const getProfileDetails = () => {
    switch (normalizedRole) {
      case ROLES.ADMIN:
        return {
          title: "System Administrator",
          subtitle: "Super Administrator",
          avatar: "A",
        };

      case ROLES.HRO:
        return {
          title: "Human Resource Officer",
          subtitle: "HR Operations",
          avatar: "H",
        };

      case ROLES.HRMPSB:
        return {
          title: "HRMPSB Member",
          subtitle: "Selection Board",
          avatar: "B",
        };

      default:
        return {
          title: "System User",
          subtitle: "Authenticated Profile",
          avatar: "U",
        };
    }
  };

  const {
    title: displayTitle,
    subtitle: displaySubtitle,
    avatar: displayAvatar,
  } = getProfileDetails();

  // ======================================================
  // LINK STYLES
  // ======================================================

  const getLinkClass = (active) =>
    `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
      active
        ? "border-l-[3px] border-amber-500 bg-white/[0.08] font-semibold text-white"
        : "hover:bg-white/[0.03] hover:text-white"
    }`;

  const getIconClass = (active) =>
    `shrink-0 transition-colors ${
      active ? "text-amber-400" : "text-slate-400 group-hover:text-amber-400"
    }`;

  // ======================================================
  // RENDER SIDEBAR
  // ======================================================

  return (
    <nav className="flex h-screen select-none flex-col border-r border-white/5 bg-[#112244] font-sans text-slate-300">
      {/* BRAND HEADER */}
      <div className="flex shrink-0 items-center justify-center gap-3 border-b border-white/5 p-4">
        <div className="flex min-w-0 flex-col items-center">
          <span className="truncate text-[14px] font-bold tracking-wide text-white">
            Region 1
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            Ranking System v1.0.0
          </span>
        </div>
      </div>

      {/* USER PROFILE CARD */}
      <div className="mx-3 mb-2 mt-4 flex shrink-0 items-center gap-3 rounded-xl border border-white/[0.03] bg-white/[0.04] p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-slate-900 shadow-md">
          {displayAvatar}
        </div>

        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-semibold text-white">
            {displayTitle}
          </span>

          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <span className="inline-block h-3 w-3 rounded-full border border-emerald-500/50 bg-emerald-500/20 text-center text-[8px] leading-3 text-emerald-400">
              ✓
            </span>
            {displaySubtitle}
          </span>
        </div>
      </div>

      {/* INNER SCROLL AREA */}
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-3 [scrollbar-color:rgba(255,255,255,0.1)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-amber-500/40">
        {/* DASHBOARD */}
        <div>
          <Link
            to="/dashboard"
            className={getLinkClass(isActive("/dashboard"))}
          >
            <LayoutDashboard
              size={17}
              className={getIconClass(isActive("/dashboard"))}
            />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* ROLE-BASED MENU SECTIONS */}
        {filteredSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="mb-1 px-3 text-[10px] font-bold tracking-wider text-slate-500">
              {section.title}
            </div>

            {section.items.map((item) => {
              const IconComponent = item.icon;

              // MANAGEMENT DROPDOWN
              if (item.isDropdown) {
                const isChildActive = item.children.some((child) =>
                  isActive(child.to),
                );

                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        setIsManagementOpen((previous) => !previous)
                      }
                      aria-expanded={isManagementOpen}
                      className={`group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200 ${
                        isChildActive
                          ? "border-l-[3px] border-amber-500 bg-white/[0.08] font-semibold text-white"
                          : "hover:bg-white/[0.03] hover:text-white"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <IconComponent
                          size={17}
                          className={getIconClass(isChildActive)}
                        />
                        <span>{item.label}</span>
                      </span>

                      {isManagementOpen ? (
                        <ChevronDown
                          size={15}
                          className="shrink-0 text-slate-400"
                        />
                      ) : (
                        <ChevronRight
                          size={15}
                          className="shrink-0 text-slate-400"
                        />
                      )}
                    </button>

                    {isManagementOpen && (
                      <div className="ml-5 space-y-1 border-l border-white/10 pl-3">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.to);

                          return (
                            <Link
                              key={child.to}
                              to={child.to}
                              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] transition-all duration-200 ${
                                childActive
                                  ? "bg-white/[0.08] font-semibold text-white"
                                  : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                              }`}
                            >
                              <ChildIcon
                                size={15}
                                className={getIconClass(childActive)}
                              />
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // REGULAR MENU ITEM
              const active = isActive(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={getLinkClass(active)}
                >
                  <IconComponent size={17} className={getIconClass(active)} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
