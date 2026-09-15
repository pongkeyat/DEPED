import React from 'react';
import {
  Network,
  Megaphone,
  Gauge,
  FileCheck,
  MailCheck,
  Binary,
  Users2,
  FileBarChart2,
  SendHorizontal,
  Contact2,
  Volume2,
  CheckCircle2
} from 'lucide-react';

const steps = [
  { id: 1, name: "1. Vacancy Posting", icon: Megaphone, color: "border-blue-800 bg-slate-50", iconColor: "text-blue-800" },
  { id: 2, name: "2. Walk-In Submission", icon: Gauge, color: "border-blue-500 bg-blue-50/40", iconColor: "text-blue-500" },
  { id: 3, name: "3. Initial Evaluation", icon: FileCheck, color: "border-amber-400 bg-amber-50/30", iconColor: "text-amber-500" },
  { id: 4, name: "4. Initial Evaluation Results", icon: MailCheck, color: "border-purple-400 bg-purple-50/30", iconColor: "text-purple-500" },
  { id: 5, name: "5. Assessment/Scoring", icon: Binary, color: "border-pink-400 bg-pink-50/30", iconColor: "text-pink-500" },
  { id: 6, name: "6. CAR Preparation", icon: Users2, color: "border-cyan-400 bg-cyan-50/30", iconColor: "text-cyan-500" },
 


];

export default function RecruitmentProcessOverview() {
  return (
    /* Tinanggal ang full-page background, wrapper padding, at min-h-screen */
    <div className="w-full"> 
      <div className="w-full bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
  
        {/* Header section ng banner */}
        <div className="bg-[#1b4482] text-white px-5 py-4 flex items-center gap-2.5 font-semibold text-[15px] tracking-wide shadow-sm">
          <Network className="w-4 h-4 stroke-[2.5]" />
          <span>Recruitment Process Overview (DO 007, s. 2023)</span>
        </div>

        {/* Content grid na babagay sa lapad ng Recent Applications dashboard card */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 text-[13px] font-semibold text-slate-700">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 px-3 py-3.5 rounded-xl border-l-[3px] border border-y-slate-100 border-r-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 w-full min-h-[56px] ${step.color}`}
              >
                <Icon className={`w-4 h-4 stroke-[2.5] flex-shrink-0 ${step.iconColor}`} />
                <span className="leading-tight tracking-tight break-words">{step.name}</span>
              </div>
            );
          })}
        </div>
        
      </div>
    </div>
  );
}