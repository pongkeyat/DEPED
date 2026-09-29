import React from "react";
import {
  FaMapMarkerAlt,
  FaBuilding,
  FaClock,
  FaEnvelope,
} from "react-icons/fa";
import ImportantReminders from "./ImportanceReminders";

// Make sure to pass 'jobs' into HeroContent alongside your search props
export default function HeroContent({ searchTerm, setSearchTerm, jobs = [] }) {
  const quickTags = ["Administrative", "Utility", "Driver"];
  const steps = [
    "Prepare Documents",
    "Submit Application",
    "Wait for Evaluation",
    "Attend Interview",
    "Receive Appointment",
  ];

  // Dynamic Statistics derived from the fetched jobs data
  const openPositionsCount = jobs.length;
  
  const totalSlots = jobs.reduce((sum, job) => sum + (job.slots || 0), 0);
  
  const uniqueOfficesCount = new Set(
    jobs.map((job) => job.office?.trim()).filter(Boolean)
  ).size;

  const handleVacanciesClick = (e) => {
    e.preventDefault();
    const element = document.getElementById("vacancies");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="w-full flex flex-col xl:flex-row items-start justify-between gap-12 px-6 md:px-16 bg-gradient-to-b from-[#1e3c72] via-[#112244] to-[#0d1b2a] text-white font-sans relative overflow-hidden py-12 md:py-16 border-b border-white/5">
      
      {/* LEFT SIDE: MAIN SEARCH AND CTAs */}
      <div className="max-w-xl w-full ">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-1 rounded-full text-xs font-medium mb-5">
          📢 Now Accepting Applications
        </div>

        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1 leading-tight">
          Career Opportunities
        </h2>

        <h3 className="text-4xl md:text-5xl font-extrabold text-amber-500 tracking-tight mb-5 leading-tight">
          at REGIONAL OFFICE 1
        </h3>

        <p className="text-gray-400 text-sm max-w-lg mb-6 leading-relaxed">
          Explore available non-teaching positions at the DepEd Regional Office 1 (Ilocos Region). Applications must be submitted personally at the HR Office.
        </p>

        {/* SEARCH COMPONENT BOX */}
   

        {/* STATS COUNT (Now Dynamic) */}

      </div>

      {/* RIGHT SIDE: UNIFIED WRAPPER FOR CARDS AND REMINDERS */}
      <div className="flex flex-col gap-4 w-full xl:max-w-2xl shrink-0">
        
        {/* TOP ROW: HOW TO APPLY & WHERE TO SUBMIT */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          
          {/* 1. HOW TO APPLY PANEL */}
          <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-[#1e3c72]/50 border-b border-white/10 p-3">
              <h3 className="font-bold text-xs tracking-wide text-amber-500 uppercase flex items-center gap-2">
                📋 How to Apply
              </h3>
            </div>

            <div className="p-4 space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2.5 items-start relative">
                  {index !== steps.length - 1 && (
                    <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-white/10" />
                  )}
                  
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm">
                    {index + 1}
                  </div>

                  <div className="pt-0.5">
                    <h4 className="font-semibold text-[11px] text-white leading-tight">
                      {step}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-none">
                      Complete this step to proceed.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. WHERE TO SUBMIT PANEL */}
          <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-[#1e3c72]/50 border-b border-white/10 p-3 flex items-center gap-2">
              <FaMapMarkerAlt className="text-amber-500 text-xs" />
              <h3 className="font-bold text-xs tracking-wide text-amber-500 uppercase">
                Where to Submit
              </h3>
            </div>

            <div className="p-4 space-y-3.5">
              <div className="flex gap-2.5 items-start">
                <FaBuilding className="text-amber-500 text-xs mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-[11px] text-white leading-none">
                    HR Management Office
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                    Regional Office 1 <br />
                    San Fernando City, La Union
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <FaClock className="text-amber-500 text-xs mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-[11px] text-white leading-none">
                    Office Hours
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                    Monday to Friday <br />
                    8:00 AM – 5:00 PM <br />
                    <span className="text-[9px] text-gray-500">(Except Holidays)</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <FaEnvelope className="text-amber-500 text-xs mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-[11px] text-white leading-none">
                    Contact HR
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-1 break-all leading-tight">
                    hrmo@depedlaunion.ph <br />
                    (072) XXX-XXXX
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM ROW: IMPORTANT REMINDERS */}
        <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="bg-[#1e3c72]/50 border-b border-white/10 p-3">
            <h3 className="font-bold text-xs tracking-wide text-amber-400 uppercase flex items-center gap-2">
              ⚠️ Important Reminders
            </h3>
          </div>
          
          <div className="p-4 text-[11px]">
            <ImportantReminders />
          </div>
        </div>

      </div>
    </main>
  );
}