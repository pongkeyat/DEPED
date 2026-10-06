import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  PlusCircle, 
  FolderDown, 
  FileText, 
  ClipboardCheck, 
  UserRoundCheck, 
  UserRoundX, 
  User,
  CalendarCheck ,
  CirclePlus,
  ContactRound,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';



const ROLES = {
  ADMIN: 'admin',
  HRO: 'hro',
  HRMPSB: 'hrmpsb'
};

// Simple client-side JWT parser utility to read payload role safely
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export default function SideBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();

  const decodedToken = token ? parseJwt(token) : null;

  const rawRole =
    user?.role ||
    user?.user?.role ||
    user?.roleName ||
    user?.userRole ||
    decodedToken?.role ||
    decodedToken?.user?.role ||
    decodedToken?.roles?.[0] ||
    '';

  const userRole = typeof rawRole === 'string' ? rawRole : '';

  const handleLogout = () => {
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const menuSections = [
    {
      title: "VACANCY MANAGEMENT",
      roles: [ROLES.HRO], 
      items: [
        { label: "Post New Vacancy", to: "/postVacancies", icon: PlusCircle },
        { label: "Vacancy Postings", to: "/vacancyPosting", icon: Briefcase },
        { label: "Positions Management", to: "/positions", icon: Briefcase },
     
      ]
    },    
    {
      title: "APPLICATIONS",
      roles: [ROLES.HRO], 
      items: [
        { label: "Receive Application", to: "/receiveApplicant", icon: FolderDown },
        { label: "All Applications", to: "/allApplications", icon: FileText },

      ]
    },
    {
      title: "EVALUATION",
      roles: [ROLES.HRO], 
      items: [
        { label: "Initial Evaluation", to: "/initialScreening", icon: ClipboardCheck },
        { label: "Initial Evaluation Results", to: "/initialEvaluationResults", icon: UserRoundCheck },
    
      ]
    },
        {
      title: "Reports",
      roles: [ROLES.HRO], 
      items: [
        { label: "Applicant Summary Report", to: "/applicant-summary-report", icon: FileText },
       
    
      ]
    },
        {
      title: "ASSESSMENT",
      roles: [ROLES.HRMPSB], 
      items: [
        { label: "Assessment Session", to: "/interviewSession", icon: ClipboardCheck },
        { label: "Scoring", to: "/Scoring", icon: CirclePlus },

      ]
    },
    {
      title: "Ranking",
      roles: [ROLES.ADMIN, ROLES.HRMPSB], 
      items: [
        { label: "Comparative Assessment Result", to: "/comparative-assessment-result", icon: User },
        { label: "Comparative Assessment Result/RQA", to: "/carrqa", icon: User },
      ]
    },
        {
      title: "ADMIN",
      roles: [ROLES.ADMIN], 
      items: [
        { label: "User Management", to: "/users", icon: ContactRound },
        { label: "Database Backup", to: "/database-backup", icon: Database },
        { label: "Audit Logs", to: "/audit-logs", icon: FileText },
      ]
    },

  ];




  const currentRoleNormalized = userRole ? userRole.toLowerCase() : '';
  const normalizedRole = currentRoleNormalized.replace(/^role_/, '').replace(/\s+/g, '');

  const filteredSections = menuSections.filter(section =>
    normalizedRole === ROLES.ADMIN || section.roles.includes(normalizedRole)
  );

  const getProfileDetails = () => {
    switch(normalizedRole) {
      case ROLES.ADMIN:
        return { title: "System Administrator", subtitle: "Super Administrator", avatar: "A" };
      case ROLES.HRO:
        return { title: "Human Resource Officer", subtitle: "HR Operations", avatar: "H" };
      case ROLES.HRMPSB:
        return { title: "HRMPSB Member", subtitle: "Selection Board", avatar: "B" };
      default:
        return { title: "System User", subtitle: "Authenticated Profile", avatar: "U" };
    }
  };

  const { title: displayTitle, subtitle: displaySubtitle, avatar: displayAvatar } = getProfileDetails();

  return (
    <nav className="flex flex-col h-screen bg-[#112244] text-slate-300 border-r border-white/5 font-sans select-none">
      
      {/* BRAND HEADER */}
  <div className="flex items-center justify-center gap-3 p-4 border-b border-white/5 flex-shrink-0">
    <div className="flex flex-col items-center min-w-0">
      <span className="text-[14px] font-bold text-white tracking-wide truncate">Region 1</span>
      <span className="text-[11px] text-slate-400 font-medium">Ranking System v1.0.0</span>
    </div>
  </div>

      {/* USER PROFILE CARD */}
      <div className="p-3 mx-3 mt-4 mb-2 rounded-xl bg-white/[0.04] border border-white/[0.03] flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-bold text-sm shadow-md flex-shrink-0">
          {displayAvatar}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-semibold text-white truncate">{displayTitle}</span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-[8px] text-emerald-400 text-center leading-3">✓</span> 
            {displaySubtitle}
          </span>
        </div>
      </div>

      {/* INNER SCROLL AREA */}
     {/* INNER SCROLL AREA */}
<div className="flex-1 px-3 py-3 space-y-5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-amber-500/40 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
        <div>
          <Link
            to="/dashboard"
            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
              isActive('/dashboard') 
                ? 'bg-white/[0.08] text-white font-semibold border-l-[3px] border-amber-500' 
                : 'hover:bg-white/[0.03] hover:text-white'
            }`}
          >
            <LayoutDashboard size={17} className={`transition-colors ${isActive('/dashboard') ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Dynamic RBAC Sections */}
        {filteredSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold tracking-wider text-slate-500 mb-1">
              {section.title}
            </div>
            {section.items.map((item, itemIdx) => {
              const IconComponent = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={itemIdx}
                  to={item.to}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    active 
                      ? 'bg-white/[0.08] text-white font-semibold border-l-[3px] border-amber-500' 
                      : 'hover:bg-white/[0.03] hover:text-white'
                  }`}
                >
                  <IconComponent size={17} className={`transition-colors ${active ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
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