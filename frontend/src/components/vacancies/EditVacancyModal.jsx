import React, { useEffect, useState } from "react";

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
            application_deadline: ""
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
                application_deadline:
                    vacancy.application_deadline
                        ? String(vacancy.application_deadline).split("T")[0]
                        : ""
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

        const { application_deadline } = masterForm.vacancy;

        if (!application_deadline) {
            setModalState("error");
            setModalMessage(
                "Please provide the application deadline."
            );
            setIsConfirmOpen(true);
            return;
        }

        // Optional validation against original posted date if available
        const postedDateStr = vacancy.application_posted
            ? String(vacancy.application_posted).split("T")[0]
            : null;

        if (postedDateStr && new Date(application_deadline) < new Date(postedDateStr)) {
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
    // SUBMIT UPDATE (Only sends application_deadline)
    // =========================================================

    const handleUpdateVacancy = async () => {
        if (!masterForm.vacancy.vacancy_id) {
            setModalState("error");
            setModalMessage("Vacancy ID is missing.");
            return;
        }

        setLoading(true);

        const payload = {
            application_deadline: masterForm.vacancy.application_deadline
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
            ================================================ */}

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">

                <div className="relative flex max-h-[95vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                    {/* HEADER */}

                    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">

                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                Edit Application Deadline
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Update the application deadline for this vacancy.
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

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Application Deadline
                                </label>
                                <input
                                    type="date"
                                    name="application_deadline"
                                    value={masterForm.vacancy.application_deadline}
                                    onChange={(e) => handleSectionChange("vacancy", e)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
            ================================================ */}

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