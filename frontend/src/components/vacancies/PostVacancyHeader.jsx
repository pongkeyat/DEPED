import React from "react";
import { ArrowLeft, Briefcase, PlusCircle } from "lucide-react";

export default function VacancyHeader ({ isPosting, onBack, onPostVacancy }) {
    return (
        <div className="mb-5 rounded-xl bg-white p-6 shadow-sm flex items-center justify-between">
            
            {isPosting ? (
                <div>
                    <div className="flex items-center gap-2 text-2xl font-bold text-[#1b4584]">
                        <PlusCircle size={24} />
                        Post New Vacancy
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Create a vacancy announcement for a non-teaching position
                    </p>
                </div>
            ) : (
                // View 2: Main dashboard management view
                <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-md bg-blue-100 p-2">
                        <Briefcase size={20} className="text-[#1b4584]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#17386d]">
                            Vacancy Postings
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage vacancy announcements and publication
                        </p>
                    </div>
                </div>
            )}

            {/* CONDITIONAL RIGHT SIDE: ACTION BUTTON */}
            {isPosting ? (
                // Back button displayed when inside the form page
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                    <ArrowLeft size={16} />
                    Back to Vacancies
                </button>
            ) : (
                // Blue CTA button displayed on the dashboard list view
                <button
                    type="button"
                    onClick={onPostVacancy}
                    className="flex items-center gap-2 rounded-lg bg-[#1b4584] px-5 py-3 text-sm font-medium text-white hover:bg-[#17386d] transition"
                >
                    <PlusCircle size={18} />
                    Post New Vacancy
                </button>
            )}

        </div>
    );
}