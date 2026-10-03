import React, { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import InterviewSessionModal from "./InterviewSessionModal";

export default function InterviewSessionHeader({ onSaveSession, isSaving }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div>
      {/* Taller container matching the reference header height & padding */}
      <div className="relative flex min-h-[88px] flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center">
        {/* Left Accent Bar */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

        {/* LEFT SIDE: Icon + Title & Description */}
        <div className="flex items-center gap-4 pl-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1E3E74]">
            <CalendarDays size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E3E74]">
              Assessment Sessions
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Schedule and manage HRMPSB assessment sessions for qualified applicants
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Action Button */}
        <div className="flex flex-wrap items-center gap-3 pl-3 sm:pl-0">
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1E3E74] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17325e] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Create Session
          </button>
        </div>
      </div>

      {/* Create Session Modal */}
      <InterviewSessionModal
        showModal={isModalOpen}
        onClose={handleCloseModal}
        onSave={onSaveSession}
        isSaving={isSaving}
      />
    </div>
  );
}