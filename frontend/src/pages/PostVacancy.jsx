import React, { useState } from "react";
import VacancyHeader from "../components/vacancies/PostVacancyHeader";
import PostVacancyForm from "../components/vacancies/PostVacancyForm";
import PostQualificationsForm from "../components/vacancies/PostQualificationsForm";
import PostRemarksForm from "../components/vacancies/PostRemarksForm";
import PostVacancyModal from "../components/vacancies/PostVacancyModal"; // Import the modal

// Single transactional API Call
import { postVacancies } from "../api/VacancyApi";

export default function PostVacancy({ onBack }) {
    const isBelowMinimum = false; 

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalState, setModalState] = useState("confirm"); // 'confirm' | 'success' | 'error'
    const [modalMessage, setModalMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Master Form State with aligned property names
    const [masterForm, setMasterForm] = useState({
        vacancy: {
            position_id: "", 
            plantilla_position: "", 
            office_unit: "",
            number_of_vacancies: "",
            place_of_assignment: "",
            application_posted: "",
            application_deadline: "",
            category: "",
            status: "Open",
        },
        qualifications: {
            education_requirement: "",
            training_requirement: "",
            experience_requirement: "",
            eligibility_requirement: "",
        },
        remarks: {
            remarks: ""
        }
    });

    const handleSectionChange = (section, e) => {
        const { name, value } = e.target;
        setMasterForm((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [name]: value
            }
        }));
    };

    // Triggered when user clicks "Post Vacancy" button
    const handlePreSubmitCheck = (e) => {
        e.preventDefault();

        const { 
            position_id, 
            plantilla_position, 
            office_unit, 
            number_of_vacancies, 
            application_posted, 
            place_of_assignment,
            application_deadline,
            category,
        } = masterForm.vacancy;

        // 1. Vacancy Validations
        if (!position_id || !plantilla_position || !office_unit || !number_of_vacancies || !application_posted || !application_deadline || !category || !place_of_assignment) {
            setModalState("error");
            setModalMessage("Please fill out all mandatory fields in the Vacancy Information section.");
            setIsModalOpen(true);
            return;
        }

        // 2. Qualifications Validation
        const { education_requirement, training_requirement, experience_requirement, eligibility_requirement } = masterForm.qualifications;
        if (!education_requirement.trim() || !training_requirement.trim() || !experience_requirement.trim() || !eligibility_requirement.trim()) {
            setModalState("error");
            setModalMessage("Qualifications cannot be empty. Please type 'None required' or 'Must be college graduate' explicitly.");
            setIsModalOpen(true);
            return;
        }

        // Open Confirmation Modal if validations pass
        setModalState("confirm");
        setIsModalOpen(true);
    };

    // Triggered when user clicks "Yes, Post It" inside confirmation modal
    const handleMasterSubmit = async () => {
        setLoading(true);

        const { 
            position_id, 
            plantilla_position, 
            office_unit, 
            number_of_vacancies, 
            application_posted, 
            application_deadline,
            place_of_assignment,
            category,
        } = masterForm.vacancy;

        const { education_requirement, training_requirement, experience_requirement, eligibility_requirement } = masterForm.qualifications;

        const payload = {
            position_id,
            plantilla_position,
            office_unit,
            number_of_vacancies: parseInt(number_of_vacancies, 10),
            application_posted,
            application_deadline,
            place_of_assignment,
            category,
            education_requirement,
            training_requirement,
            experience_requirement,
            eligibility_requirement,
            remark_text: masterForm.remarks.remarks
        };

        try {
            console.log("Posting complete vacancy package...", payload);
            const response = await postVacancies(payload);
            
            setModalState("success");
            setModalMessage(response.message || "Vacancy posted successfully!");
        } catch (error) {
            console.error("Submission failed:", error);
            const serverMessage = error.response?.data?.error || "An error occurred while saving details.";
            setModalState("error");
            setModalMessage(serverMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle closing the modal depending on current status
    const handleModalClose = () => {
        setIsModalOpen(false);
        if (modalState === "success" && onBack) {
            onBack();
        }
    };

    return (
        <div className="min-h-screen p-6 max-w-7xl mx-auto">
            <VacancyHeader isPosting={true} onBack={onBack} />

            {/* Main Layout Grid */}
            <div className="grid gap-6 lg:grid-cols-3 mt-6">
                
                {/* Left Side: Main Form */}
                <div className="lg:col-span-2">
                    <PostVacancyForm 
                        formData={masterForm.vacancy} 
                        onChange={(e) => handleSectionChange("vacancy", e)} 
                    />
                </div>

                {/* Right Side: Sidebar Components */}
                <div className="lg:col-span-1 space-y-6">
                    <PostQualificationsForm 
                        formData={masterForm.qualifications} 
                        onChange={(e) => handleSectionChange("qualifications", e)} 
                    />
                    <PostRemarksForm 
                        formData={masterForm.remarks} 
                        onChange={(e) => handleSectionChange("remarks", e)} 
                    />
                </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="mt-8 flex justify-end gap-3 pt-5">
                <button 
                    type="button"
                    onClick={onBack}
                    className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    onClick={handlePreSubmitCheck}
                    disabled={isBelowMinimum}
                    className={`rounded-lg px-6 py-2 text-sm font-medium text-white transition ${
                        isBelowMinimum
                            ? "cursor-not-allowed bg-gray-400"
                            : "bg-[#1b4584] hover:bg-[#16386b]"
                    }`}
                >
                    Post Vacancy
                </button>
            </div>

            {/* Reusable Modal Component */}
            <PostVacancyModal 
                isOpen={isModalOpen}
                modalState={modalState}
                message={modalMessage}
                onClose={handleModalClose}
                onConfirm={handleMasterSubmit}
                loading={loading}
            />
        </div>
    );
}