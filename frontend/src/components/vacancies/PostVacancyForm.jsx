import React, { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { getPositions } from "../../api/PositionsApi";

// =========================================================
// POSITION CATEGORIES
// =========================================================
const categories = [
    "Teaching Positions",
    "School Administration Positions",
    "Related Teaching Positions",
    "Non-Teaching Positions",
];

// =========================================================
// CATEGORY NORMALIZATION
// =========================================================
const categoryAliases = {
    teaching: "teaching positions",
    "teaching positions": "teaching positions",

    "school administration":
        "school administration positions",

    "school administration positions":
        "school administration positions",

    "related teaching":
        "related teaching positions",

    "related teaching positions":
        "related teaching positions",

    "non-teaching":
        "non-teaching positions",

    "non teaching":
        "non-teaching positions",

    "non-teaching positions":
        "non-teaching positions",

    "non teaching positions":
        "non-teaching positions",
};

const normalizeCategory = (category) => {
    const normalized = String(category || "")
        .trim()
        .toLowerCase();

    return (
        categoryAliases[normalized] ||
        normalized
    );
};

// =========================================================
// COMPONENT
// =========================================================
export default function PostVacancyForm({
    formData,
    onChange,
}) {
    const [positions, setPositions] = useState([]);
    const [loadingPositions, setLoadingPositions] =
        useState(true);

    // =========================================================
    // TODAY
    // =========================================================
    const todayStr = new Date()
        .toISOString()
        .split("T")[0];

    // =========================================================
    // FETCH POSITIONS
    // =========================================================
    useEffect(() => {
        let mounted = true;

        const fetchPositionsData = async () => {
            try {
                setLoadingPositions(true);

                /*
                 * Get ALL positions here.
                 *
                 * We filter them on the frontend based
                 * on the category toggle.
                 *
                 * This also makes sure that the selected
                 * position contains:
                 *
                 * education
                 * training
                 * experience
                 * eligibility
                 */
                const response = await getPositions(
                    "",
                    1000
                );

                console.log(
                    "POSITIONS API RESPONSE:",
                    response
                );

                let positionsList = [];

                if (Array.isArray(response)) {
                    positionsList = response;
                } else if (
                    Array.isArray(response?.data)
                ) {
                    positionsList = response.data;
                } else if (
                    Array.isArray(
                        response?.data?.data
                    )
                ) {
                    positionsList =
                        response.data.data;
                } else if (
                    Array.isArray(
                        response?.data?.positions
                    )
                ) {
                    positionsList =
                        response.data.positions;
                } else if (
                    Array.isArray(
                        response?.positions
                    )
                ) {
                    positionsList =
                        response.positions;
                }

                console.log(
                    "PROCESSED POSITIONS:",
                    positionsList
                );

                if (mounted) {
                    setPositions(positionsList);
                }
            } catch (error) {
                console.error(
                    "Failed to load positions:",
                    error
                );

                if (mounted) {
                    setPositions([]);
                }
            } finally {
                if (mounted) {
                    setLoadingPositions(false);
                }
            }
        };

        fetchPositionsData();

        return () => {
            mounted = false;
        };
    }, []);

    // =========================================================
    // AUTO SET APPLICATION POSTED DATE
    // =========================================================
    useEffect(() => {
        if (!formData?.application_posted) {
            onChange({
                target: {
                    name: "application_posted",
                    value: todayStr,
                },
            });
        }
    }, []);

    // =========================================================
    // FILTER POSITIONS BY CATEGORY
    // =========================================================
    const filteredPositions = useMemo(() => {
        if (!formData?.category) {
            return [];
        }

        const selectedCategory =
            normalizeCategory(
                formData.category
            );

        return positions.filter((position) => {
            const positionCategory =
                position.category ||
                position.job_category ||
                "";

            return (
                normalizeCategory(
                    positionCategory
                ) === selectedCategory
            );
        });
    }, [
        positions,
        formData?.category,
    ]);

    // =========================================================
    // HANDLE CATEGORY TOGGLE
    // =========================================================
 const handleCategoryChange = (category) => {
    console.log("CATEGORY SELECTED:", category);

    // Update category
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

        // No position selected
        if (!selectedId) {
            onChange({
                target: {
                    name: "position_id",
                    value: "",
                },
            });

            onChange({
                target: {
                    name: "salary_grade",
                    value: "",
                },
            });

            return;
        }

        // =====================================================
        // FIND POSITION
        // =====================================================
        const selectedPos = positions.find(
            (position) => {
                const id =
                    position.position_id ??
                    position.id;

                return (
                    String(id) ===
                    String(selectedId)
                );
            }
        );

        console.log(
            "SELECTED POSITION:",
            selectedPos
        );

        if (!selectedPos) {
            console.error(
                "Selected position was not found:",
                selectedId
            );

            return;
        }

        // =====================================================
        // POSITION ID
        // =====================================================
        const positionId =
            selectedPos.position_id ??
            selectedPos.id ??
            selectedId;

        onChange({
            target: {
                name: "position_id",
                value: positionId,
            },
        });

        // =====================================================
        // SALARY GRADE
        // =====================================================
        let salaryGrade =
            selectedPos.salary_grade ??
            selectedPos.sg ??
            "";

        if (
            salaryGrade !== "" &&
            !String(salaryGrade)
                .toUpperCase()
                .startsWith("SG-")
        ) {
            salaryGrade =
                `SG-${salaryGrade}`;
        }

        onChange({
            target: {
                name: "salary_grade",
                value: salaryGrade,
            },
        });

        // =====================================================
        // CATEGORY
        // =====================================================
        const positionCategory =
            selectedPos.category ||
            selectedPos.job_category ||
            "";

        /*
         * Normally this should already match the
         * selected category toggle.
         *
         * Only update it if the API returned a
         * different category.
         */
        if (
            positionCategory &&
            normalizeCategory(
                positionCategory
            ) !==
                normalizeCategory(
                    formData.category
                )
        ) {
            onChange({
                target: {
                    name: "category",
                    value: positionCategory,
                },
            });
        }

        // =====================================================
        // QUALIFICATIONS
        // =====================================================
        /*
         * IMPORTANT:
         *
         * These are copied from Position Management.
         *
         * They are NOT read-only.
         *
         * After they are populated, the user can
         * edit them in PostQualificationsForm.
         */

        onChange({
            target: {
                name: "education_requirement",
                value:
                    selectedPos.education ||
                    "",
            },
        });

        onChange({
            target: {
                name: "training_requirement",
                value:
                    selectedPos.training ||
                    "",
            },
        });

        onChange({
            target: {
                name: "experience_requirement",
                value:
                    selectedPos.experience ||
                    "",
            },
        });

        onChange({
            target: {
                name: "eligibility_requirement",
                value:
                    selectedPos.eligibility ||
                    "",
            },
        });
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

                <span>
                    Vacancy Information
                </span>
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
                        {categories.map(
                            (category) => {
                                const isSelected =
                                    normalizeCategory(
                                        formData?.category
                                    ) ===
                                    normalizeCategory(
                                        category
                                    );

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
                            }
                        )}
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
                            formData?.position_id ||
                            ""
                        }
                        onChange={
                            handlePositionSelect
                        }
                        disabled={
                            loadingPositions ||
                            !formData?.category
                        }
                        className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584] disabled:bg-gray-100"
                    >
                        <option value="">
                            {loadingPositions
                                ? "Loading positions..."
                                : !formData?.category
                                ? "Select a category first"
                                : filteredPositions.length ===
                                  0
                                ? "No positions available"
                                : "Select Position"}
                        </option>

                        {filteredPositions.map(
                            (pos) => {
                                const id =
                                    pos.position_id ??
                                    pos.id;

                                const title =
                                    pos.position_title ||
                                    pos.plantilla_position ||
                                    "";

                                return (
                                    <option
                                        key={id}
                                        value={id}
                                    >
                                        {title}
                                    </option>
                                );
                            }
                        )}
                    </select>

                    {formData?.category &&
                        !loadingPositions &&
                        filteredPositions.length ===
                            0 && (
                            <p className="mt-1 text-xs text-red-500">
                                No positions found for
                                this category.
                            </p>
                        )}
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
                            formData?.plantilla_position ||
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
                            formData?.place_of_assignment ||
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

                    {/* SALARY GRADE */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Salary Grade
                        </label>

                        <input
                            type="text"
                            name="salary_grade"
                            value={
                                formData?.salary_grade ||
                                ""
                            }
                            readOnly
                            placeholder="Automatically set from position"
                            className="w-full cursor-not-allowed rounded-lg border bg-gray-100 p-3 text-gray-700 outline-none"
                        />

                        <p className="mt-1 text-xs text-gray-500">
                            Automatically populated
                            from the selected position.
                        </p>
                    </div>

                    {/* NUMBER OF VACANCIES */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Number of Vacancy
                        </label>

                        <input
                            type="number"
                            name="number_of_vacancies"
                            placeholder="e.g. 2"
                            value={
                                formData?.number_of_vacancies ||
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
                            formData?.office_unit ||
                            ""
                        }
                        onChange={onChange}
                        className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                {/* =================================================
                    DATES
                ================================================= */}
                <div className="grid gap-4 md:grid-cols-2">

                    {/* APPLICATION POSTED DATE */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Application Posted Date
                        </label>

                        <input
                            type="date"
                            name="application_posted"
                            value={
                                formData?.application_posted ||
                                ""
                            }
                            onChange={onChange}
                            min={todayStr}
                            className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                        />
                    </div>

                    {/* APPLICATION DEADLINE */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Application Deadline
                        </label>

                        <input
                            type="date"
                            name="application_deadline"
                            value={
                                formData?.application_deadline ||
                                ""
                            }
                            onChange={onChange}
                            min={
                                formData?.application_posted
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