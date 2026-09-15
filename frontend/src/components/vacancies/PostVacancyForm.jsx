import React, { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { getPositions } from "../../api/PositionsApi";

const salaryGrades = Array.from(
    { length: 20 },
    (_, i) => `SG-${i + 1}`
);

// Four position categories
const categories = [
    "Teaching Positions",
    "School Administration Positions",
    "Related Teaching Positions",
    "Non-Teaching Positions",
];

const categoryAliases = {
    "teaching": "teaching positions",
    "teaching positions": "teaching positions",
    "school administration": "school administration positions",
    "school administration positions": "school administration positions",
    "related teaching": "related teaching positions",
    "related teaching positions": "related teaching positions",
    "non-teaching": "non-teaching positions",
    "non-teaching positions": "non-teaching positions",
};

const normalizeCategory = (category) =>
    categoryAliases[category.trim().toLowerCase()] ||
    category.trim().toLowerCase();

export default function PostVacancyForm({ formData, onChange }) {
    const [positions, setPositions] = useState([]);
    const [loadingPositions, setLoadingPositions] = useState(true);

    // Today's date
    const todayStr = new Date().toISOString().split("T")[0];

    // =========================================================
    // FETCH POSITIONS
    // =========================================================
    useEffect(() => {
        // Automatically set application posted date
        if (!formData.application_posted) {
            onChange({
                target: {
                    name: "application_posted",
                    value: todayStr,
                },
            });
        }

        const fetchPositionsData = async () => {
            try {
                const response = await getPositions(
                    formData.category,
                    1000
                );

                const positionsList = Array.isArray(response)
                    ? response
                    : response?.data || [];

                setPositions(positionsList);
            } catch (error) {
                console.error(
                    "Failed to load positions:",
                    error
                );
            } finally {
                setLoadingPositions(false);
            }
        };

        fetchPositionsData();
    }, [formData.category]);

    // =========================================================
    // FILTER POSITIONS BY CATEGORY
    // =========================================================
    const filteredPositions = useMemo(() => {
        if (!formData.category) {
            return [];
        }

        return positions.filter((position) => {
            const positionCategory =
                position.category ||
                position.job_category ||
                "";

            return normalizeCategory(positionCategory) ===
                normalizeCategory(formData.category);
        });
    }, [positions, formData.category]);

    // =========================================================
    // HANDLE CATEGORY TOGGLE
    // =========================================================
    const handleCategoryChange = (category) => {
        // Change category
        onChange({
            target: {
                name: "category",
                value: category,
            },
        });

        // Clear selected position
        onChange({
            target: {
                name: "position_id",
                value: "",
            },
        });

        // Clear salary grade
        onChange({
            target: {
                name: "salary_grade",
                value: "",
            },
        });
    };

    // =========================================================
    // HANDLE POSITION SELECTION
    // =========================================================
    const handlePositionSelect = (e) => {
        const selectedId = e.target.value;

        const selectedPos = positions.find(
            (p) =>
                String(p.position_id || p.id) ===
                String(selectedId)
        );

        if (selectedPos) {
            // -------------------------------------------------
            // POSITION ID
            // -------------------------------------------------
            onChange({
                target: {
                    name: "position_id",
                    value:
                        selectedPos.position_id ||
                        selectedPos.id ||
                        selectedId,
                },
            });

            // -------------------------------------------------
            // SALARY GRADE
            // -------------------------------------------------
            let formattedSalaryGrade =
                selectedPos.salary_grade ||
                selectedPos.sg ||
                "";

            if (
                formattedSalaryGrade &&
                !formattedSalaryGrade
                    .toString()
                    .startsWith("SG-")
            ) {
                formattedSalaryGrade =
                    `SG-${formattedSalaryGrade}`;
            }

            onChange({
                target: {
                    name: "salary_grade",
                    value: formattedSalaryGrade,
                },
            });

            // -------------------------------------------------
            // CATEGORY
            // -------------------------------------------------
            const positionCategory =
                selectedPos.category ||
                selectedPos.job_category ||
                "";

            if (
                positionCategory &&
                positionCategory !== formData.category
            ) {
                onChange({
                    target: {
                        name: "category",
                        value: positionCategory,
                    },
                });
            }
        } else {
            // Reset position
            onChange({
                target: {
                    name: "position_id",
                    value: "",
                },
            });

            // Reset salary grade
            onChange({
                target: {
                    name: "salary_grade",
                    value: "",
                },
            });
        }
    };

    // =========================================================
    // RENDER
    // =========================================================
    return (
        <div className="overflow-hidden rounded-xl bg-white shadow lg:col-span-2">

            {/* =====================================================
                HEADER
            ===================================================== */}
            <div className="flex items-center gap-2 bg-[#1b4584] p-3 text-white">
                <Info size={16} />
                <span>Vacancy Information</span>
            </div>

            <div className="space-y-4 p-5">

                {/* =================================================
                    CATEGORY TOGGLE
                ================================================= */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Position Category
                    </label>

                    <div className="flex flex-wrap gap-2">

                        {categories.map((category) => {
                            const isSelected =
                                formData.category ===
                                category;

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() =>
                                        handleCategoryChange(
                                            category
                                        )
                                    }
                                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                                        isSelected
                                            ? "border-[#1b4584] bg-[#1b4584] text-white shadow-sm"
                                            : "border-gray-300 bg-white text-gray-600 hover:border-[#1b4584] hover:bg-blue-50"
                                    }`}
                                >
                                    {category}
                                </button>
                            );
                        })}

                    </div>
                </div>

                {/* =================================================
                    POSITION TITLE
                ================================================= */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Select Position Title
                    </label>

                    <select
                        name="position_id"
                        value={
                            formData.position_id || ""
                        }
                        onChange={handlePositionSelect}
                        disabled={
                            loadingPositions ||
                            !formData.category
                        }
                        className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584] disabled:bg-gray-100"
                    >
                        <option value="">
                            {loadingPositions
                                ? "Loading positions..."
                                : !formData.category
                                ? "Select a category first"
                                : filteredPositions.length === 0
                                ? "No positions available"
                                : "Select Position"}
                        </option>

                        {filteredPositions.map((pos) => {
                            const id =
                                pos.position_id ||
                                pos.id;

                            const title =
                                pos.position_title ||
                                pos.plantilla_position;

                            return (
                                <option
                                    key={id}
                                    value={id}
                                >
                                    {title}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* =================================================
                    PLANTILLA POSITION
                ================================================= */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Plantilla Position Item / Title
                    </label>

                    <input
                        type="text"
                        name="plantilla_position"
                        placeholder="e.g. Administrative Assistant I"
                        value={
                            formData.plantilla_position ||
                            ""
                        }
                        onChange={onChange}
                        className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                {/* =================================================
                    PLACE OF ASSIGNMENT
                ================================================= */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Place of Assignment
                    </label>

                    <input
                        type="text"
                        name="place_of_assignment"
                        placeholder="e.g. Administrative"
                        value={
                            formData.place_of_assignment ||
                            ""
                        }
                        onChange={onChange}
                        className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                {/* =================================================
                    SALARY GRADE + NUMBER OF VACANCIES
                ================================================= */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    {/* Salary Grade */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Salary Grade
                        </label>

                        <select
                            name="salary_grade"
                            value={
                                formData.salary_grade ||
                                ""
                            }
                            onChange={onChange}
                            className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                        >
                            <option value="">
                                Select Salary Grade
                            </option>

                            {salaryGrades.map((grade) => (
                                <option
                                    key={grade}
                                    value={grade}
                                >
                                    {grade}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Number of Vacancy */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Number of Vacancy
                        </label>

                        <input
                            type="number"
                            name="number_of_vacancies"
                            placeholder="e.g. 2"
                            value={
                                formData.number_of_vacancies ||
                                ""
                            }
                            onChange={onChange}
                            min="1"
                            className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                        />
                    </div>

                </div>

                {/* =================================================
                    OFFICE / UNIT
                ================================================= */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Office / Unit Assignment
                    </label>

                    <input
                        type="text"
                        name="office_unit"
                        placeholder="e.g. Human Resource Management Office"
                        value={
                            formData.office_unit || ""
                        }
                        onChange={onChange}
                        className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                {/* =================================================
                    DATES
                ================================================= */}
                <div className="grid gap-4 md:grid-cols-2">

                    {/* Application Posted Date */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Application Posted Date
                        </label>

                        <input
                            type="date"
                            name="application_posted"
                            value={
                                formData.application_posted ||
                                ""
                            }
                            onChange={onChange}
                            min={todayStr}
                            className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                        />
                    </div>

                    {/* Application Deadline */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Application Deadline
                        </label>

                        <input
                            type="date"
                            name="application_deadline"
                            value={
                                formData.application_deadline ||
                                ""
                            }
                            onChange={onChange}
                            min={
                                formData.application_posted
                                    ? new Date(
                                          new Date(
                                              formData.application_posted
                                          ).getTime() +
                                              10 *
                                                  24 *
                                                  60 *
                                                  60 *
                                                  1000
                                      )
                                          .toISOString()
                                          .split("T")[0]
                                    : todayStr
                            }
                            className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                        />
                    </div>

                </div>

            </div>
        </div>
    );
}