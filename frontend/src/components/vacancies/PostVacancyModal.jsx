import React from "react";
import { AlertCircle, CheckCircle2, HelpCircle, X } from "lucide-react";

export default function PostVacancyModal({ 
    isOpen, 
    modalState, // 'confirm' | 'success' | 'error'
    message, 
    onClose, 
    onConfirm, 
    loading 
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                
                {/* Confirmation State */}
                {modalState === "confirm" && (
                    <div className="p-6 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#1b4584] mb-4">
                            <HelpCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Post This Vacancy?</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to publish this vacancy? Review all details before submitting.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={loading}
                                className="flex-1 rounded-xl bg-[#1b4584] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16386b] transition flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                        Posting...
                                    </>
                                ) : (
                                    "Yes, Post It"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Success State */}
                {modalState === "success" && (
                    <div className="p-6 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            {message || "Vacancy posted successfully!"}
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition"
                        >
                            Done
                        </button>
                    </div>
                )}

                {/* Error State */}
                {modalState === "error" && (
                    <div className="p-6 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Submission Failed</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            {message || "An error occurred while saving details."}
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition"
                        >
                            Try Again
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}