import React, { useEffect, useState } from "react";

import PostVacancyForm from "./PostVacancyForm";
import PostQualificationsForm from "./PostQualificationsForm";
import PostRemarksForm from "./PostRemarksForm";

import PostVacancyModal from "./PostVacancyModal";

import { updateVacancy } from "../../api/VacancyApi";

export default function EditVacancyModal({
    isOpen,
    vacancy,
    onClose,
    onUpdated
}) {
    const [modalState, setModalState] = useState("confirm");
    const [modalMessage, setModalMessage] = useState("");
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [masterForm, setMasterForm] = useState({
        vacancy: {
            vacancy_id: "",
            position_id: "",
            plantilla_position: "",
            office_unit: "",
            number_of_vacancies: "",
            place_of_assignment: "",
            application_posted: "",
            application_deadline: "",
            category: "",
            status: "Open"
        },
        qualifications: {
            education_requirement: "",
            training_requirement: "",
            experience_requirement: "",
            eligibility_requirement: ""
        },
        remarks: {
            remarks: ""
        }
    });

    // =========================================================
    // LOAD SELECTED VACANCY INTO FORM
    // =========================================================

    useEffect(() => {
        if (!isOpen || !vacancy) return;

        setMasterForm({
            vacancy: {
                vacancy_id: vacancy.vacancy_id || "",
                position_id: vacancy.position_id || "",
                plantilla_position: vacancy.plantilla_position || "",
                office_unit: vacancy.office_unit || "",
                number_of_vacancies:
                    vacancy.number_of_vacancies ?? "",
                place_of_assignment:
                    vacancy.place_of_assignment || "",
                application_posted:
                    vacancy.application_posted
                        ? String(vacancy.application_posted).split("T")[0]
                        : "",
                application_deadline:
                    vacancy.application_deadline
                        ? String(vacancy.application_deadline).split("T")[0]
                        : "",
                category: vacancy.category || "",
                status: vacancy.status || "Open"
            },

            qualifications: {
                education_requirement:
                    vacancy.education_requirement || "",
                training_requirement:
                    vacancy.training_requirement || "",
                experience_requirement:
                    vacancy.experience_requirement || "",
                eligibility_requirement:
                    vacancy.eligibility_requirement || ""
            },

            remarks: {
                remarks: vacancy.remark_text || ""
            }
        });

        setIsConfirmOpen(false);
        setModalState("confirm");
        setModalMessage("");
    }, [isOpen, vacancy]);

    // =========================================================
    // HANDLE FORM CHANGES
    // =========================================================

    const handleSectionChange = (section, e) => {
        const { name, value } = e.target;

        setMasterForm(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [name]: value
            }
        }));
    };

    // =========================================================
    // VALIDATE BEFORE CONFIRMATION
    // =========================================================

    const handlePreSubmitCheck = (e) => {
        e.preventDefault();

        const {
            position_id,
            plantilla_position,
            office_unit,
            number_of_vacancies,
            place_of_assignment,
            application_posted,
            application_deadline
        } = masterForm.vacancy;

        if (
            !position_id ||
            !plantilla_position?.trim() ||
            !office_unit?.trim() ||
            !place_of_assignment?.trim() ||
            !number_of_vacancies ||
            Number(number_of_vacancies) <= 0 ||
            !application_posted ||
            !application_deadline
        ) {
            setModalState("error");
            setModalMessage(
                "Please complete all required vacancy information."
            );
            setIsConfirmOpen(true);
            return;
        }

        const {
            education_requirement,
            training_requirement,
            experience_requirement,
            eligibility_requirement
        } = masterForm.qualifications;

        if (
            !education_requirement?.trim() ||
            !training_requirement?.trim() ||
            !experience_requirement?.trim() ||
            !eligibility_requirement?.trim()
        ) {
            setModalState("error");
            setModalMessage(
                "Qualifications cannot be empty. Please enter the requirements or specify 'None required'."
            );
            setIsConfirmOpen(true);
            return;
        }

        if (
            new Date(application_deadline) <
            new Date(application_posted)
        ) {
            setModalState("error");
            setModalMessage(
                "Application deadline cannot be before the posted date."
            );
            setIsConfirmOpen(true);
            return;
        }

        setModalState("confirm");
        setModalMessage(
            "Are you sure you want to save the changes to this vacancy?"
        );
        setIsConfirmOpen(true);
    };

    // =========================================================
    // SUBMIT UPDATE
    // =========================================================

    const handleUpdateVacancy = async () => {
        if (!masterForm.vacancy.vacancy_id) {
            setModalState("error");
            setModalMessage("Vacancy ID is missing.");
            return;
        }

        setLoading(true);

        const {
            position_id,
            plantilla_position,
            office_unit,
            number_of_vacancies,
            place_of_assignment,
            application_posted,
            application_deadline
        } = masterForm.vacancy;

        const {
            education_requirement,
            training_requirement,
            experience_requirement,
            eligibility_requirement
        } = masterForm.qualifications;

        const payload = {
            position_id,
            plantilla_position,
            office_unit,
            number_of_vacancies: parseInt(
                number_of_vacancies,
                10
            ),
            place_of_assignment,
            application_posted,
            application_deadline,

            education_requirement,
            training_requirement,
            experience_requirement,
            eligibility_requirement,

            remark_text: masterForm.remarks.remarks
        };

        try {
            const response = await updateVacancy(
                masterForm.vacancy.vacancy_id,
                payload
            );

            setModalState("success");
            setModalMessage(
                response.message ||
                "Vacancy successfully updated."
            );

        } catch (error) {
            console.error("Update vacancy error:", error);

            setModalState("error");
            setModalMessage(
                error.response?.data?.error ||
                "An error occurred while updating the vacancy."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // CLOSE CONFIRMATION / RESULT
    // =========================================================

    const handleConfirmModalClose = () => {
        if (loading) return;

        const wasSuccessful = modalState === "success";

        setIsConfirmOpen(false);

        if (wasSuccessful) {
            if (onUpdated) {
                onUpdated();
            }

            if (onClose) {
                onClose();
            }
        }
    };

    // =========================================================
    // MODAL CLOSE
    // =========================================================

    const handleClose = () => {
        if (loading) return;

        setIsConfirmOpen(false);

        if (onClose) {
            onClose();
        }
    };

    if (!isOpen || !vacancy) return null;

    return (
        <>
            {/* =================================================
                EDIT VACANCY MODAL
            ================================================= */}

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">

                <div className="relative flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                    {/* HEADER */}

                    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">

                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                Edit Vacancy
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Update vacancy information and qualifications.
                            </p>

                            <span className="mt-2 inline-block rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {masterForm.vacancy.vacancy_id}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-2xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
                        >
                            &times;
                        </button>

                    </div>

                    {/* BODY */}

                    <form
                        onSubmit={handlePreSubmitCheck}
                        className="flex-1 overflow-y-auto p-5 sm:p-6"
                    >

                        <div className="grid gap-6 lg:grid-cols-3">

                            {/* VACANCY INFORMATION */}

                            <div className="lg:col-span-2">
                                <PostVacancyForm
                                    formData={masterForm.vacancy}
                                    onChange={(e) =>
                                        handleSectionChange(
                                            "vacancy",
                                            e
                                        )
                                    }
                                />
                            </div>

                            {/* QUALIFICATIONS AND REMARKS */}

                            <div className="space-y-6 lg:col-span-1">

                                <PostQualificationsForm
                                    formData={masterForm.qualifications}
                                    onChange={(e) =>
                                        handleSectionChange(
                                            "qualifications",
                                            e
                                        )
                                    }
                                />

                                <PostRemarksForm
                                    formData={masterForm.remarks}
                                    onChange={(e) =>
                                        handleSectionChange(
                                            "remarks",
                                            e
                                        )
                                    }
                                />

                            </div>

                        </div>

                        {/* FOOTER */}

                        <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-gray-200 pt-5 sm:flex-row">

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-lg bg-[#1b4584] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16386b] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Save Changes
                            </button>

                        </div>

                    </form>

                </div>

            </div>

            {/* =================================================
                CONFIRMATION / SUCCESS / ERROR MODAL
            ================================================= */}

            <PostVacancyModal
                isOpen={isConfirmOpen}
                modalState={modalState}
                message={modalMessage}
                onClose={handleConfirmModalClose}
                onConfirm={handleUpdateVacancy}
                loading={loading}
            />
        </>
    );
}