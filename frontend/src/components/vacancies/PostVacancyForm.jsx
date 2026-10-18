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
// PLACES OF ASSIGNMENT
// =========================================================

const placesOfAssignment = [
    "Regional Office 1",
    "SDO Ilocos Norte",
    "SDO Ilocos Sur",
    "SDO La Union",
    "SDO Pangasinan I (Lingayen)",
    "SDO Pangasinan II (Binalonan)",
    "SDO Alaminos City",
    "SDO Batac City",
    "SDO Candon City",
    "SDO Dagupan City",
    "SDO Laoag City",
    "SDO San Carlos City",
    "SDO San Fernando City",
    "SDO Urdaneta City",
    "SDO Vigan City",
];

const PLANTILLA_ITEM_PREFIX = "OSEC-DECSB-";

const officeUnits = [
    "Human Resource Management Office",
    "Office of the Schools Division Superintendent",
    "Office of the Regional Director",
    "Curriculum and Learning Management Division (CLMD)",
    "Education Support and Services Division (ESSD)",
    "Field Technical Assistance Division (FTAD)",
    "Quality Assurance Division (QAD)",
    "Policy, Planning and Research Division (PPRD)",
    "Human Resource Development Division (HRDD)",
    "Administrative Division (AD)",
    "Finance Division (FD)",
    "School Division Office (SDO)",
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

    return categoryAliases[normalized] || normalized;
};

// =========================================================
// COMPONENT
// =========================================================

export default function PostVacancyForm({
    formData,
    onChange,
    showValidationErrors = false,
}) {
    const [positions, setPositions] = useState([]);
    const [loadingPositions, setLoadingPositions] =
        useState(true);
    const isMissing = (value) =>
        showValidationErrors && !String(value ?? "").trim();
    const missingFieldClass =
        "border-red-500 ring-1 ring-red-500";
    const missingFieldMessage = (value) =>
        isMissing(value) ? (
            <p className="mt-1 text-xs text-red-600">
                This field is required.
            </p>
        ) : null;
    const plantillaItemParts = String(
        formData?.plantilla_position || ""
    ).startsWith(PLANTILLA_ITEM_PREFIX)
        ? String(formData.plantilla_position)
              .slice(PLANTILLA_ITEM_PREFIX.length)
              .split("-")
        : [];
    const plantillaPositionCode = plantillaItemParts[0] || "";
    const plantillaSerialNumber = plantillaItemParts[1] || "";
    const plantillaYear = plantillaItemParts[2] || "";
    const isPlantillaPositionMissing =
        showValidationErrors &&
        (!plantillaPositionCode.trim() ||
            !plantillaSerialNumber.trim() ||
            !plantillaYear.trim());
    const handlePlantillaItemPartChange = (partIndex, value) => {
        const nextParts = [
            plantillaPositionCode,
            plantillaSerialNumber,
            plantillaYear,
        ];
        nextParts[partIndex] =
            partIndex === 0
                ? value.replace(/-/g, "").trim()
                : value.replace(/\D/g, "");
        onChange({
            target: {
                name: "plantilla_position",
                value: `${PLANTILLA_ITEM_PREFIX}${nextParts.join("-")}`,
            },
        });
    };

    // =========================================================
    // TODAY
    // =========================================================

    const todayStr = new Date()
        .toISOString()
        .split("T")[0];

    // =========================================================
    // ADD WORKING DAYS
    // EXCLUDES SATURDAY AND SUNDAY
    // =========================================================

    const addWorkingDays = (dateString, days) => {
        const date = new Date(`${dateString}T00:00:00`);

        let addedDays = 0;

        while (addedDays < days) {
            date.setDate(date.getDate() + 1);

            const day = date.getDay();

            // Sunday = 0
            // Saturday = 6
            // Monday-Friday = working days
            if (day !== 0 && day !== 6) {
                addedDays++;
            }
        }

        return date.toISOString().split("T")[0];
    };

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
                normalizeCategory(positionCategory) ===
                selectedCategory
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
        console.log(
            "CATEGORY SELECTED:",
            category
        );

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
    // AUTO-SELECT THE ONLY TEACHING POSITION
    // =========================================================

    useEffect(() => {
        const isTeachingCategory =
            normalizeCategory(formData?.category) ===
            normalizeCategory("Teaching Positions");

        if (
            !loadingPositions &&
            isTeachingCategory &&
            filteredPositions.length === 1
        ) {
            const onlyPosition = filteredPositions[0];
            const onlyPositionId =
                onlyPosition.position_id ?? onlyPosition.id;

            if (
                onlyPositionId &&
                String(formData?.position_id || "") !==
                    String(onlyPositionId)
            ) {
                handlePositionSelect({
                    target: { value: String(onlyPositionId) },
                });
            }
        }
    }, [
        loadingPositions,
        formData?.category,
        formData?.position_id,
        filteredPositions,
    ]);

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="overflow-hidden rounded-xl bg-white shadow lg:col-span-2">

            {/* =================================================
                HEADER
            ================================================= */}

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

                    <div
                        className={`flex flex-wrap gap-2 rounded-md ${
                            isMissing(formData?.category)
                                ? "ring-1 ring-red-500"
                                : ""
                        }`}
                    >
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
                    {missingFieldMessage(formData?.category)}
                </div>

                {/* =================================================
                    POSITION TITLE
                ================================================= */}

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Select Position Title
                    </label>

                    {normalizeCategory(formData?.category) ===
                        normalizeCategory("Teaching Positions") &&
                    filteredPositions.length === 1 ? (
                        <input
                            type="text"
                            value={
                                filteredPositions[0].position_title ||
                                filteredPositions[0].plantilla_position ||
                                "Teaching Position"
                            }
                            readOnly
                            aria-label="Selected teaching position"
                            className={`w-full rounded-lg border p-3 bg-gray-100 text-gray-700 outline-none ${
                                isMissing(formData?.position_id)
                                    ? missingFieldClass
                                    : ""
                            }`}
                        />
                    ) : (
                        <select
                            name="position_id"
                            value={formData?.position_id || ""}
                            onChange={handlePositionSelect}
                            disabled={
                                loadingPositions ||
                                !formData?.category
                            }
                            className={`w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584] disabled:bg-gray-100 ${
                                isMissing(formData?.position_id)
                                    ? missingFieldClass
                                    : ""
                            }`}
                        >
                            <option value="">
                                {loadingPositions
                                    ? "Loading positions..."
                                    : !formData?.category
                                    ? "Select a category first"
                                    : filteredPositions.length === 0
                                    ? "No positions available"
                                    : "Select Position"}
                            </option>

                            {filteredPositions.map((pos) => {
                                const id = pos.position_id ?? pos.id;
                                const title =
                                    pos.position_title ||
                                    pos.plantilla_position ||
                                    "";

                                return (
                                    <option key={id} value={id}>
                                        {title}
                                    </option>
                                );
                            })}
                        </select>
                    )}
                    {missingFieldMessage(formData?.position_id)}

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
                        Plantilla Position Item Number
                    </label>

                    <div className="grid grid-cols-[1fr_1fr_auto_1fr_auto_1fr] items-center gap-2">
                        <input
                            type="text"
                            aria-label="Plantilla item prefix"
                            value={PLANTILLA_ITEM_PREFIX}
                            readOnly
                            className="min-w-0 rounded-lg border border-gray-300 bg-gray-100 p-3 text-gray-700 outline-none"
                        />
                        <input
                            type="text"
                            aria-label="Position code"
                            placeholder="Position Code"
                            value={plantillaPositionCode}
                            onChange={(event) =>
                                handlePlantillaItemPartChange(
                                    0,
                                    event.target.value
                                )
                            }
                            maxLength={5}
                            className={`min-w-0 rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584] ${
                                isPlantillaPositionMissing &&
                                !plantillaPositionCode.trim()
                                    ? missingFieldClass
                                    : ""
                            }`}
                        />
                        <span aria-hidden="true" className="font-medium text-gray-500">-</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            aria-label="Unique item or serial number"
                            placeholder="Item No."
                            value={plantillaSerialNumber}
                            onChange={(event) =>
                                handlePlantillaItemPartChange(
                                    1,
                                    event.target.value
                                )
                            }
                            maxLength={5}
                            className={`min-w-0 rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584] ${
                                isPlantillaPositionMissing &&
                                !plantillaSerialNumber.trim()
                                    ? missingFieldClass
                                    : ""
                            }`}
                        />
                        <span aria-hidden="true" className="font-medium text-gray-500">-</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            aria-label="Item number year"
                            placeholder="Year"
                            value={plantillaYear}
                            onChange={(event) =>
                                handlePlantillaItemPartChange(
                                    2,
                                    event.target.value
                                )
                            }
                            maxLength={4}
                            className={`min-w-0 rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584] ${
                                isPlantillaPositionMissing &&
                                !plantillaYear.trim()
                                    ? missingFieldClass
                                    : ""
                            }`}
                        />
                    </div>
                    {isPlantillaPositionMissing && (
                        <p className="mt-1 text-xs text-red-600">
                            Enter the position code, unique item number, and year.
                        </p>
                    )}
                </div>

                {/* =================================================
                    PLACE OF ASSIGNMENT
                ================================================= */}

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Place of Assignment
                    </label>

                    <select
                        name="place_of_assignment"
                        value={
                            formData?.place_of_assignment ||
                            ""
                        }
                        onChange={onChange}
                        className={`w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584] ${
                            isMissing(formData?.place_of_assignment)
                                ? missingFieldClass
                                : ""
                        }`}
                    >
                        <option value="">
                            Select Place of Assignment
                        </option>
                        {placesOfAssignment.map((place) => (
                            <option key={place} value={place}>
                                {place}
                            </option>
                        ))}
                    </select>
                    {missingFieldMessage(formData?.place_of_assignment)}
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
                            className={`w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584] ${
                                isMissing(formData?.number_of_vacancies) ||
                                Number(formData?.number_of_vacancies) <= 0
                                    ? showValidationErrors
                                        ? missingFieldClass
                                        : ""
                                    : ""
                            }`}
                        />
                        {isMissing(formData?.number_of_vacancies) ||
                        (showValidationErrors &&
                            Number(formData?.number_of_vacancies) <= 0) ? (
                            <p className="mt-1 text-xs text-red-600">
                                Enter a number greater than zero.
                            </p>
                        ) : null}
                    </div>
                </div>

                {/* =================================================
                    OFFICE / UNIT
                ================================================= */}

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Office / Unit Assignment
                    </label>

                    <select
                        name="office_unit"
                        value={
                            formData?.office_unit ||
                            ""
                        }
                        onChange={onChange}
                        className={`w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584] bg-white ${
                            isMissing(formData?.office_unit)
                                ? missingFieldClass
                                : ""
                        }`}
                    >
                        <option value="">
                            Select Office / Unit
                        </option>

                        {officeUnits.map((office) => (
                            <option
                                key={office}
                                value={office}
                            >
                                {office}
                            </option>
                        ))}
                    </select>
                    {missingFieldMessage(formData?.office_unit)}
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
                            className={`w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584] ${
                                isMissing(formData?.application_posted)
                                    ? missingFieldClass
                                    : ""
                            }`}
                        />
                        {missingFieldMessage(formData?.application_posted)}
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
                                    ? addWorkingDays(
                                          formData.application_posted,
                                          10
                                      )
                                    : todayStr
                            }
                            className={`w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584] ${
                                isMissing(formData?.application_deadline)
                                    ? missingFieldClass
                                    : ""
                            }`}
                        />
                        {missingFieldMessage(formData?.application_deadline)}
                    </div>
                </div>
            </div>
        </div>
    );
}