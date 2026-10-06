import React, { useEffect, useState } from "react";

import VacancyHeader from "../components/vacancies/PostVacancyHeader";
import PostVacancyForm from "../components/vacancies/PostVacancyForm";
import PostQualificationsForm from "../components/vacancies/PostQualificationsForm";
import PostRemarksForm from "../components/vacancies/PostRemarksForm";
import PostVacancyModal from "../components/vacancies/PostVacancyModal";

// API
import { postVacancies } from "../api/VacancyApi";
import { getPositions } from "../api/PositionsApi";

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

// =====================================================
// COMPONENT
// =====================================================

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

    const [masterForm, setMasterForm] =
        useState(initialFormState);

    // =====================================================
    // POSITIONS
    // =====================================================

    const [positions, setPositions] = useState([]);
    const [positionsLoading, setPositionsLoading] =
        useState(true);

    // =====================================================
    // FETCH POSITIONS
    // =====================================================

    useEffect(() => {
        const fetchPositions = async () => {
            try {
                setPositionsLoading(true);

                const response = await getPositions(
                    "",
                    1000,
                    1
                );

                console.log(
                    "POSITIONS API RESPONSE:",
                    response
                );

                /*
                 * Your Position Management currently uses:
                 *
                 * response?.data
                 *
                 * so we support that first.
                 */

                let data = [];

                if (Array.isArray(response)) {
                    data = response;
                } else if (Array.isArray(response?.data)) {
                    data = response.data;
                } else if (
                    Array.isArray(response?.data?.data)
                ) {
                    data = response.data.data;
                } else if (
                    Array.isArray(response?.data?.positions)
                ) {
                    data = response.data.positions;
                } else if (
                    Array.isArray(response?.positions)
                ) {
                    data = response.positions;
                }

                console.log(
                    "PROCESSED POSITIONS:",
                    data
                );

                setPositions(data);
            } catch (error) {
                console.error(
                    "ERROR FETCHING POSITIONS:",
                    error
                );

                setPositions([]);
            } finally {
                setPositionsLoading(false);
            }
        };

        fetchPositions();
    }, []);

    // =====================================================
    // HANDLE FORM CHANGES
    // =====================================================

    const handleSectionChange = (section, e) => {
        const { name, value } = e.target;

        // =================================================
        // POSITION SELECTED
        // =================================================

        if (
            section === "vacancy" &&
            name === "position_id"
        ) {
            console.log(
                "SELECTED POSITION ID:",
                value
            );

            // ---------------------------------------------
            // Empty position
            // ---------------------------------------------

            if (!value) {
                setMasterForm((prev) => ({
                    ...prev,

                    vacancy: {
                        ...prev.vacancy,
                        position_id: "",
                    },

                    qualifications: {
                        education_requirement: "",
                        training_requirement: "",
                        experience_requirement: "",
                        eligibility_requirement: "",
                    },
                }));

                return;
            }

            // ---------------------------------------------
            // Find selected position
            // ---------------------------------------------

            const selectedPosition = positions.find(
                (position) =>
                    String(position.position_id) ===
                    String(value)
            );

            console.log(
                "SELECTED POSITION:",
                selectedPosition
            );

            // ---------------------------------------------
            // Position not found
            // ---------------------------------------------

            if (!selectedPosition) {
                console.warn(
                    "Position was not found in positions:",
                    value
                );

                setMasterForm((prev) => ({
                    ...prev,

                    vacancy: {
                        ...prev.vacancy,
                        position_id: value,
                        category: "",
                    },

                    qualifications: {
                        education_requirement: "",
                        training_requirement: "",
                        experience_requirement: "",
                        eligibility_requirement: "",
                    },
                }));

                return;
            }

            // ---------------------------------------------
            // POSITION FOUND
            // ---------------------------------------------

            setMasterForm((prev) => ({
                ...prev,

                vacancy: {
                    ...prev.vacancy,

                    position_id:
                        selectedPosition.position_id,

                    category:
                        selectedPosition.category ||
                        "",
                },

                qualifications: {
                    education_requirement:
                        selectedPosition.education ||
                        "",

                    training_requirement:
                        selectedPosition.training ||
                        "",

                    experience_requirement:
                        selectedPosition.experience ||
                        "",

                    eligibility_requirement:
                        selectedPosition.eligibility ||
                        "",
                },
            }));

            return;
        }

        // =================================================
        // NORMAL FIELD CHANGE
        // =================================================

        setMasterForm((prev) => ({
            ...prev,

            [section]: {
                ...prev[section],
                [name]: value,
            },
        }));
    };

    // =====================================================
    // RESET
    // =====================================================

    const resetForm = () => {
        setMasterForm({
            vacancy: {
                ...initialFormState.vacancy,
            },

            qualifications: {
                ...initialFormState.qualifications,
            },

            remarks: {
                ...initialFormState.remarks,
            },
        });
    };

    // =====================================================
    // PRE-SUBMIT
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
            application_deadline,
            category,
            place_of_assignment,
        } = masterForm.vacancy;

        // =================================================
        // VACANCY VALIDATION
        // =================================================

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

        // =================================================
        // QUALIFICATION VALIDATION
        // =================================================

        /*
         * Qualifications come from Position Management.
         *
         * We still verify that the selected position has
         * qualification values before posting.
         */

        const {
            education_requirement,
            training_requirement,
            experience_requirement,
            eligibility_requirement,
        } = masterForm.qualifications;

        if (
            !education_requirement?.trim() ||
            !training_requirement?.trim() ||
            !experience_requirement?.trim() ||
            !eligibility_requirement?.trim()
        ) {
            setModalState("error");

            setModalMessage(
                "The selected position does not have complete qualification requirements in Position Management."
            );

            setIsModalOpen(true);

            return;
        }

        // =================================================
        // CONFIRMATION
        // =================================================

        setModalState("confirm");
        setModalMessage("");
        setIsModalOpen(true);
    };

    // =====================================================
    // SUBMIT
    // =====================================================

    const handleMasterSubmit = async () => {
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

        // =================================================
        // PAYLOAD
        // =================================================

        const payload = {
            position_id,

            plantilla_position,

            office_unit,

            number_of_vacancies:
                parseInt(number_of_vacancies, 10),

            application_posted,

            application_deadline,

            place_of_assignment,

            category,

            education_requirement,

            training_requirement,

            experience_requirement,

            eligibility_requirement,

            remark_text:
                masterForm.remarks.remarks,
        };

        try {
            console.log(
                "POST VACANCY PAYLOAD:",
                payload
            );

            const response =
                await postVacancies(payload);

            console.log(
                "POST VACANCY RESPONSE:",
                response
            );

            // Reset
            resetForm();

            // Success
            setModalState("success");

            setModalMessage(
                response?.message ||
                    response?.data?.message ||
                    "Vacancy posted successfully!"
            );
        } catch (error) {
            console.error(
                "SUBMISSION ERROR:",
                error
            );

            const serverMessage =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                "An error occurred while saving details.";

            setModalState("error");
            setModalMessage(serverMessage);
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // MODAL CLOSE
    // =====================================================

    const handleModalClose = () => {
        if (loading) return;

        setIsModalOpen(false);

        if (
            modalState === "success" &&
            onBack
        ) {
            onBack();
        }
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="min-h-screen p-6 max-w-7xl mx-auto">

            {/* HEADER */}

            <VacancyHeader
                isPosting={true}
                onBack={onBack}
            />

            {/* MAIN GRID */}

            <div className="grid gap-6 lg:grid-cols-3 mt-6">

                {/* =================================================
                    VACANCY INFORMATION
                ================================================= */}

                <div className="lg:col-span-2">

                    <PostVacancyForm
                        formData={masterForm.vacancy}
                        onChange={(e) =>
                            handleSectionChange(
                                "vacancy",
                                e
                            )
                        }

                        positions={positions}

                        positionsLoading={
                            positionsLoading
                        }
                    />

                </div>

                {/* =================================================
                    QUALIFICATIONS + REMARKS
                ================================================= */}

                <div className="lg:col-span-1 space-y-6">

                <PostQualificationsForm
                    formData={masterForm.qualifications}
                    onChange={(e) => handleSectionChange("qualifications", e)}
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

            {/* =================================================
                ACTION BUTTONS
            ================================================= */}

            <div className="mt-8 flex justify-end gap-3 pt-5">

                <button
                    type="button"
                    onClick={onBack}
                    disabled={loading}
                    className="
                        rounded-lg
                        border
                        border-gray-300
                        px-5
                        py-2
                        text-sm
                        font-medium
                        text-gray-700
                        hover:bg-gray-50
                        transition
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                >
                    Cancel
                </button>

                <button
                    type="button"
                    onClick={handlePreSubmitCheck}
                    disabled={
                        isBelowMinimum ||
                        loading ||
                        positionsLoading
                    }
                    className={`
                        rounded-lg
                        px-6
                        py-2
                        text-sm
                        font-medium
                        text-white
                        transition

                        ${
                            isBelowMinimum ||
                            loading ||
                            positionsLoading
                                ? "cursor-not-allowed bg-gray-400"
                                : "bg-[#1b4584] hover:bg-[#16386b]"
                        }
                    `}
                >
                    {loading
                        ? "Submitting..."
                        : positionsLoading
                        ? "Loading positions..."
                        : "Post Vacancy"}
                </button>
            </div>

            {/* =================================================
                MODAL
            ================================================= */}

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