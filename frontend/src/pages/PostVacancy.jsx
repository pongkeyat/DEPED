
import React, { useState } from "react";
import VacancyHeader from "../components/vacancies/PostVacancyHeader";
import PostVacancyForm from "../components/vacancies/PostVacancyForm";
import PostQualificationsForm from "../components/vacancies/PostQualificationsForm";
import PostRemarksForm from "../components/vacancies/PostRemarksForm";
import PostVacancyModal from "../components/vacancies/PostVacancyModal";

// Single transactional API Call
import { postVacancies } from "../api/VacancyApi";

// =====================================================
// INITIAL FORM STATE
// =====================================================

const initialFormState = {
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
        remarks: "",
    },
};

export default function PostVacancy({ onBack }) {
    const isBelowMinimum = false;

    // =====================================================
    // MODAL STATES
    // =====================================================

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalState, setModalState] = useState("confirm");
    const [modalMessage, setModalMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // =====================================================
    // MASTER FORM STATE
    // =====================================================

    const [masterForm, setMasterForm] = useState(initialFormState);

    // =====================================================
    // HANDLE FORM INPUT CHANGES
    // =====================================================

    const handleSectionChange = (section, e) => {
        const { name, value } = e.target;

        setMasterForm((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [name]: value,
            },
        }));
    };

    // =====================================================
    // RESET ALL FORM INPUTS
    // =====================================================

    const resetForm = () => {
        setMasterForm({
            vacancy: { ...initialFormState.vacancy },
            qualifications: { ...initialFormState.qualifications },
            remarks: { ...initialFormState.remarks },
        });
    };

    // =====================================================
    // PRE-SUBMIT VALIDATION
    // Triggered when user clicks "Post Vacancy"
    // =====================================================

    const handlePreSubmitCheck = (e) => {
        e.preventDefault();

        if (loading) return;

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

        // 1. Vacancy validations

        if (
            !position_id ||
            !plantilla_position ||
            !office_unit ||
            !number_of_vacancies ||
            !application_posted ||
            !application_deadline ||
            !category ||
            !place_of_assignment
        ) {
            setModalState("error");
            setModalMessage(
                "Please fill out all mandatory fields in the Vacancy Information section."
            );
            setIsModalOpen(true);
            return;
        }

        // 2. Qualifications validation

        const {
            education_requirement,
            training_requirement,
            experience_requirement,
            eligibility_requirement,
        } = masterForm.qualifications;

        if (
            !education_requirement.trim() ||
            !training_requirement.trim() ||
            !experience_requirement.trim() ||
            !eligibility_requirement.trim()
        ) {
            setModalState("error");
            setModalMessage(
                "Qualifications cannot be empty. Please type 'None required' or 'Must be college graduate' explicitly."
            );
            setIsModalOpen(true);
            return;
        }

        // 3. Open confirmation modal

        setModalState("confirm");
        setModalMessage("");
        setIsModalOpen(true);
    };

    // =====================================================
    // SUBMIT COMPLETE VACANCY PACKAGE
    // Triggered by "Yes, Post It" in confirmation modal
    // =====================================================

    const handleMasterSubmit = async () => {
        // Prevent duplicate submissions

        if (loading) return;

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

        const {
            education_requirement,
            training_requirement,
            experience_requirement,
            eligibility_requirement,
        } = masterForm.qualifications;

        // Prepare API payload

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

            remark_text: masterForm.remarks.remarks,
        };

        try {
            console.log(
                "Posting complete vacancy package...",
                payload
            );

            const response = await postVacancies(payload);

            // =============================================
            // SUCCESS: CLEAR ALL FORM INPUTS
            // =============================================

            resetForm();

            // Show success modal

            setModalState("success");

            setModalMessage(
                response?.message ||
                "Vacancy posted successfully!"
            );

        } catch (error) {
            console.error("Submission failed:", error);

            const serverMessage =
                error.response?.data?.error ||
                "An error occurred while saving details.";

            // =============================================
            // ERROR: KEEP FORM DATA
            // =============================================

            setModalState("error");
            setModalMessage(serverMessage);

        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // HANDLE MODAL CLOSE
    // =====================================================

    const handleModalClose = () => {
        if (loading) return;

        setIsModalOpen(false);

        // Navigate back only after successful submission

        if (modalState === "success" && onBack) {
            onBack();
        }
    };

    // =====================================================
    // MAIN COMPONENT
    // =====================================================

    return (
        <div className="min-h-screen p-6 max-w-7xl mx-auto">

            {/* PAGE HEADER */}

            <VacancyHeader
                isPosting={true}
                onBack={onBack}
            />

            {/* MAIN LAYOUT GRID */}

            <div className="grid gap-6 lg:grid-cols-3 mt-6">

                {/* LEFT SIDE: VACANCY INFORMATION */}

                <div className="lg:col-span-2">
                    <PostVacancyForm
                        formData={masterForm.vacancy}
                        onChange={(e) =>
                            handleSectionChange("vacancy", e)
                        }
                    />
                </div>

                {/* RIGHT SIDE: QUALIFICATIONS AND REMARKS */}

                <div className="lg:col-span-1 space-y-6">

                    <PostQualificationsForm
                        formData={masterForm.qualifications}
                        onChange={(e) =>
                            handleSectionChange("qualifications", e)
                        }
                    />

                    <PostRemarksForm
                        formData={masterForm.remarks}
                        onChange={(e) =>
                            handleSectionChange("remarks", e)
                        }
                    />

                </div>
            </div>

            {/* BOTTOM FORM ACTIONS */}

            <div className="mt-8 flex justify-end gap-3 pt-5">

                {/* CANCEL BUTTON */}

                <button
                    type="button"
                    onClick={onBack}
                    disabled={loading}
                    className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Cancel
                </button>

                {/* POST VACANCY BUTTON */}

                <button
                    type="button"
                    onClick={handlePreSubmitCheck}
                    disabled={isBelowMinimum || loading}
                    className={`rounded-lg px-6 py-2 text-sm font-medium text-white transition ${
                        isBelowMinimum || loading
                            ? "cursor-not-allowed bg-gray-400"
                            : "bg-[#1b4584] hover:bg-[#16386b]"
                    }`}
                >
                    {loading ? "Submitting..." : "Post Vacancy"}
                </button>

            </div>

            {/* REUSABLE CONFIRMATION / SUCCESS / ERROR MODAL */}

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