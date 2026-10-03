import React from "react";
import { ArrowLeft, UserPlus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LandingpageApplicationHeader({ isApplying, onBack, onNavigateLanding }) {
    const navigate = useNavigate();
    
    const handleLandingPageClick = () => {
    navigate("/");
  };

    return (
        <div className="relative mb-5 flex min-h-[88px] items-center justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />
            
            {isApplying ? (
                <div>
                    <div className="flex items-center gap-2 text-2xl font-bold text-[#1b4584]">
                        <UserPlus size={24} />
                        Submit Application
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Complete your application form and upload requirements
                    </p>
                </div>
            ) : (
                // View 2: Main dashboard/listing view
                <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-md bg-blue-100 p-2">
                        <FileText size={20} className="text-[#1b4584]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#17386d]">
                            Job Application Portal
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            View available positions and submit your credentials
                        </p>
                    </div>
                </div>
            )}

            {/* CONDITIONAL RIGHT SIDE: ACTION BUTTON */}
            {isApplying ? (
                // Back button displayed when inside the application form
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                    <ArrowLeft size={16} />
                    Back to Listings
                </button>
            ) : (
                // CTA button to navigate to landing page / application view
                <button
                    type="button"
                    onClick={handleLandingPageClick}
                    className="flex items-center gap-2 rounded-lg bg-[#1b4584] px-5 py-3 text-sm font-medium text-white hover:bg-[#17386d] transition"
                >
                    <UserPlus size={18} />
                    Back to Vacancies
                </button>
            )}

        </div>
    );
}