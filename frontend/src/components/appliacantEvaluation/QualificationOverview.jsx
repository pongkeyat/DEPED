import React from "react";
import { GraduationCap, Briefcase, Award, FileCheck } from "lucide-react";

export default function QualificationOverview({ education, experience, training, eligibility }) {
  const cards = [
    { label: "Education", value: education, icon: GraduationCap, color: "border-blue-500 bg-blue-50 text-blue-600" },
    { label: "Experience", value: experience, icon: Briefcase, color: "border-emerald-500 bg-emerald-50 text-emerald-600" },
    { label: "Training", value: training, icon: Award, color: "border-amber-500 bg-amber-50 text-amber-600" },
    { label: "Eligibility", value: eligibility, icon: FileCheck, color: "border-violet-500 bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-[#1E3E74] mb-4">Qualification Standards Overview</h2>
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`rounded-3xl border-t-4 ${card.color.split(" ")[0]} bg-white p-6 shadow`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.color.split(" ").slice(1).join(" ")}`}>
                  <Icon size={26} />
                </div>
                <div className="w-full min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide truncate">{card.label}</p>
                  <h2 className="text-sm font-bold text-slate-800 mt-1 line-clamp-3">{card.value}</h2>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}