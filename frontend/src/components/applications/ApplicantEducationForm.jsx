import React from 'react';

export default function ApplicantEducationForm({
    data,
    onChange
}) {

    const educationList =
        Array.isArray(data?.educationList)
            ? data.educationList
            : [
                {
                    level: '',
                    school_name: '',
                    degree_course: '',
                    honors_awards: '',
                    units: ''
                }
            ];


    // ============================================================
    // HANDLE INPUT
    // ============================================================

    const handleInputChange = (
        index,
        fieldName,
        value
    ) => {

        const updatedList =
            [...educationList];

        updatedList[index] = {
            ...updatedList[index],
            [fieldName]: value
        };

        onChange(
            'educationList',
            updatedList
        );
    };


    // ============================================================
    // ADD EDUCATION
    // ============================================================

    const handleAddEducation = () => {

        const updatedList = [
            ...educationList,

            {
                level: '',
                school_name: '',
                degree_course: '',
                honors_awards: '',
                units: ''
            }
        ];

        onChange(
            'educationList',
            updatedList
        );
    };


    // ============================================================
    // REMOVE EDUCATION
    // ============================================================

    const handleRemoveEducation = (
        indexToRemove
    ) => {

        if (educationList.length <= 1) {
            return;
        }

        const updatedList =
            educationList.filter(
                (_, index) =>
                    index !== indexToRemove
            );

        onChange(
            'educationList',
            updatedList
        );
    };


    // ============================================================
    // CHECK IF UNITS ARE REQUIRED
    // ============================================================

    const requiresUnits = (level) => {

        return (
            level === "MASTER'S DEGREE" ||
            level === "DOCTORATE DEGREE"
        );
    };


    return (

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden font-sans">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="bg-[#1e4a8a] p-4 text-white flex items-center justify-between">

                <div className="flex items-center gap-3">

                    <span className="flex items-center justify-center bg-white/20 text-white font-semibold text-xs w-5 h-5 rounded-full">
                        3
                    </span>

                    <h3 className="text-base font-semibold tracking-wide">
                        Background Information
                    </h3>

                </div>

            </div>


            {/* ==================================================
                SECTION HEADER
            ================================================== */}

            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-white">

                <div className="flex items-center gap-2 text-[#1e4a8a] font-medium text-sm">
                    Highest Educational Attainment
                </div>


                <button
                    type="button"
                    onClick={handleAddEducation}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-600 rounded-lg text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
                >

                    <span className="text-base font-bold leading-none">
                        +
                    </span>

                    Add Education

                </button>

            </div>


            {/* ==================================================
                EDUCATION LIST
            ================================================== */}

            <div className="p-6 space-y-6 bg-[#fcfdfd]">

                {educationList.map(
                    (edu, index) => (

                        <div
                            key={index}
                            className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-4 relative"
                        >

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">


                                {/* ==================================
                                    LEVEL
                                ================================== */}

                                <div className="md:col-span-3 space-y-1">

                                    <label className="block text-xs font-semibold text-gray-700">

                                        Level

                                        <span className="text-red-500">
                                            *
                                        </span>

                                    </label>


                                    <select
                                        value={
                                            edu.level || ''
                                        }

                                        onChange={(e) =>
                                            handleInputChange(
                                                index,
                                                'level',
                                                e.target.value
                                            )
                                        }

                                        className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                                    >

                                        <option value="">
                                            -- Select Educational Level --
                                        </option>

                                        <option value="ELEMENTARY">
                                            ELEMENTARY
                                        </option>

                                        <option value="SECONDARY">
                                            SECONDARY / HIGH SCHOOL
                                        </option>

                                        <option value="VOCATIONAL">
                                            VOCATIONAL / TECHNICAL
                                        </option>

                                        <option value="BACHELOR'S DEGREE">
                                            BACHELOR'S DEGREE
                                        </option>

                                        <option value="MASTER'S DEGREE">
                                            MASTER'S DEGREE
                                        </option>

                                        <option value="DOCTORATE DEGREE">
                                            DOCTORATE DEGREE
                                        </option>

                                    </select>

                                </div>


                                {/* ==================================
                                    SCHOOL
                                ================================== */}

                                <div className="md:col-span-4 space-y-1">

                                    <label className="block text-xs font-semibold text-gray-700">

                                        School/University

                                        <span className="text-red-500">
                                            *
                                        </span>

                                    </label>


                                    <input
                                        type="text"

                                        value={
                                            edu.school_name || ''
                                        }

                                        onChange={(e) =>
                                            handleInputChange(
                                                index,
                                                'school_name',
                                                e.target.value
                                            )
                                        }

                                        className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"

                                        placeholder="Enter school/university"
                                    />

                                </div>


                                {/* ==================================
                                    DEGREE
                                ================================== */}

                                <div
                                    className={
                                        requiresUnits(edu.level)
                                            ? "md:col-span-3 space-y-1"
                                            : "md:col-span-4 space-y-1"
                                    }
                                >

                                    <label className="block text-xs font-semibold text-gray-700">
                                        Degree / Course
                                    </label>


                                    <input
                                        type="text"

                                        value={
                                            edu.degree_course || ''
                                        }

                                        onChange={(e) =>
                                            handleInputChange(
                                                index,
                                                'degree_course',
                                                e.target.value
                                            )
                                        }

                                        className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"

                                        placeholder="Enter degree/course"
                                    />

                                </div>


                                {/* ==================================
                                    UNITS
                                    ONLY FOR MASTER'S / DOCTORATE
                                ================================== */}

                                {requiresUnits(edu.level) && (

                                    <div className="md:col-span-2 space-y-1">

                                        <label className="block text-xs font-semibold text-gray-700">
                                            Units Earned
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"

                                            value={
                                                edu.units ?? ''
                                            }

                                            onChange={(e) =>
                                                handleInputChange(
                                                    index,
                                                    'units',
                                                    e.target.value
                                                )
                                            }

                                            className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"

                                            placeholder="Units"
                                        />

                                    </div>

                                )}


                                {/* ==================================
                                    DELETE
                                ================================== */}

                                <div
                                    className={
                                        requiresUnits(edu.level)
                                            ? "md:col-span-0 flex items-end justify-end"
                                            : "md:col-span-1 flex items-end justify-end"
                                    }
                                >

                                    {educationList.length > 1 && (

                                        <button
                                            type="button"

                                            onClick={() =>
                                                handleRemoveEducation(
                                                    index
                                                )
                                            }

                                            className="p-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors h-10 w-full"

                                            title="Remove education"
                                        >

                                            <svg
                                                className="w-4 h-4 mx-auto"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >

                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />

                                            </svg>

                                        </button>

                                    )}

                                </div>


                                {/* ==================================
                                    HONORS
                                ================================== */}

                                <div className="md:col-span-11 space-y-1">

                                    <label className="block text-xs font-semibold text-gray-700">
                                        Honors / Awards Received
                                    </label>


                                    <input
                                        type="text"

                                        value={
                                            edu.honors_awards || ''
                                        }

                                        onChange={(e) =>
                                            handleInputChange(
                                                index,
                                                'honors_awards',
                                                e.target.value
                                            )
                                        }

                                        className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"

                                        placeholder="Enter honors or awards"
                                    />

                                </div>

                            </div>

                        </div>

                    )
                )}

            </div>

        </div>

    );
}