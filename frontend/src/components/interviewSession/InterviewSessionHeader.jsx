import React, { useState } from "react";
import { Plus } from "lucide-react";
import InterviewSessionModal from "./InterviewSessionModal";

export default function InterviewSessionHeader({ onSaveSession, isSaving }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden shadow-sm">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0f2c59]" />
        <div className="pl-3">
          <h1 className="text-xl font-bold text-[#0f2c59] tracking-tight">
            Assessment Sessions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Schedule and manage HRMPSB assessment sessions for qualified applicants
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenModal}
          className="bg-[#0f2c59] hover:bg-[#0a1f3f] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Create Session
        </button>
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