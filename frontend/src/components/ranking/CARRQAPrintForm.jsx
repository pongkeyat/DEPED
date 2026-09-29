import React from "react";

const CARRQAPrintForm = ({
    vacancy,
    ranking = [],
}) => {

    const formatScore = (value) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "";
        }

        const number = Number(value);

        if (Number.isNaN(number)) {
            return value;
        }

        return Number.isInteger(number)
            ? number
            : number.toFixed(2);
    };

    const getApplicantName = (applicant) => {
        return (
            applicant.applicant_name ||
            applicant.full_name ||
            applicant.name ||
            ""
        );
    };

    const getApplicationCode = (applicant) => {
        return (
            applicant.application_code ||
            applicant.application_id ||
            applicant.job_applications_id ||
            ""
        );
    };

    const getEducation = (applicant) => {
        return (
            applicant.education?.points ??
            applicant.education_points ??
            applicant.education_score ??
            ""
        );
    };

    const getTraining = (applicant) => {
        return (
            applicant.training?.points ??
            applicant.training_points ??
            applicant.training_score ??
            ""
        );
    };

    const getExperience = (applicant) => {
        return (
            applicant.experience?.points ??
            applicant.experience_points ??
            applicant.experience_score ??
            ""
        );
    };

    /*
    |--------------------------------------------------------------------------
    | PBET / LET / LEPT
    |--------------------------------------------------------------------------
    */

    const getLET = (applicant) => {
        return (
            applicant.pbet_let_lept_rating ??
            applicant.pbet_let_lept ??
            applicant.let_rating ??
            applicant.lept_rating ??
            applicant.eligibility_rating ??
            ""
        );
    };

    /*
    |--------------------------------------------------------------------------
    | PPST COIs
    |--------------------------------------------------------------------------
    */

    const getCOI = (applicant) => {
        return (
            applicant.ppst_coi_score ??
            applicant.coi_score ??
            applicant.classroom_observation_score ??
            applicant.cois_score ??
            ""
        );
    };

    /*
    |--------------------------------------------------------------------------
    | PPST NCOIs
    |--------------------------------------------------------------------------
    */

    const getNCOI = (applicant) => {
        return (
            applicant.ppst_ncoi_score ??
            applicant.ncoi_score ??
            applicant.teacher_reflection_score ??
            applicant.ncois_score ??
            ""
        );
    };

    /*
    |--------------------------------------------------------------------------
    | TOTAL
    |--------------------------------------------------------------------------
    */

    const getTotal = (applicant) => {
        return (
            applicant.combined_total ??
            applicant.overall_score ??
            applicant.total_score ??
            applicant.total ??
            ""
        );
    };

    return (
        <div className="hidden print:block bg-white text-black">

            <div className="w-full px-6 py-5 font-serif text-[9px]">

                {/* =========================================================
                    OUTER BORDER
                ========================================================= */}

                <div className="border border-black px-3 py-2">

                    {/* =====================================================
                        HEADER
                    ===================================================== */}

                    <div className="relative">

                        {/* Annex */}
                        <div className="absolute right-0 top-0 text-[8px] font-bold italic">
                            Annex I-1
                        </div>

                        {/* Title */}
                        <div className="text-center">
                            <h1 className="text-[13px] font-bold">
                                COMPARATIVE ASSESSMENT RESULT -
                                REGISTRY OF QUALIFIED APPLICANTS
                                (CAR-RQA)
                            </h1>
                        </div>

                        {/* Vacancy Information */}
                        <div className="mt-3 grid grid-cols-2 gap-8">

                            {/* LEFT */}
                            <div>

                                <div className="flex items-end">
                                    <span className="font-bold">
                                        Position:
                                    </span>

                                    <span className="ml-2 flex-1 border-b border-black px-1">
                                        {vacancy?.position_title || ""}
                                    </span>
                                </div>

                                <div className="mt-2 flex items-end">
                                    <span className="font-bold whitespace-nowrap">
                                        Schools Division Office:
                                    </span>

                                    <span className="ml-2 flex-1 border-b border-black px-1">
                                        {vacancy?.schools_division_office ||
                                            vacancy?.division_office ||
                                            vacancy?.office ||
                                            "La Union Schools Division Office"}
                                    </span>
                                </div>

                            </div>

                            {/* RIGHT */}
                            <div>

                                <div className="flex items-end">
                                    <span className="font-bold whitespace-nowrap">
                                        Date of Final Deliberation:
                                    </span>

                                    <span className="ml-2 flex-1 border-b border-black px-1">
                                        {vacancy?.final_deliberation_date || ""}
                                    </span>
                                </div>

                            </div>

                        </div>

                    </div>

                    {/* =====================================================
                        MAIN CAR-RQA TABLE
                    ===================================================== */}

                    <div className="mt-3">

                        <table className="w-full table-fixed border-collapse border border-black text-center">

                            <thead>

                                {/* =================================================
                                    FIRST HEADER ROW
                                ================================================= */}

                                <tr className="font-bold">

                                    <th
                                        rowSpan="2"
                                        className="w-[11%] border border-black px-1 py-2"
                                    >
                                        Name of Applicant
                                    </th>

                                    <th
                                        rowSpan="2"
                                        className="w-[9%] border border-black px-1 py-2"
                                    >
                                        Application Code
                                    </th>

                                    <th
                                        colSpan="8"
                                        className="border border-black px-1 py-1"
                                    >
                                        COMPARATIVE ASSESSMENT RESULTS
                                    </th>

                                    <th
                                        rowSpan="2"
                                        className="w-[6%] border border-black px-1 py-2"
                                    >
                                        Remarks
                                    </th>

                                    <th
                                        colSpan="2"
                                        className="w-[9%] border border-black px-1 py-1"
                                    >
                                        For Background
                                        <br />
                                        Investigation
                                        <br />
                                        (Y/N)
                                    </th>

                                    <th
                                        rowSpan="2"
                                        className="w-[9%] border border-black px-1 py-1"
                                    >
                                        For Appointment

                                        <div className="mt-1 text-[6px] font-normal italic">
                                            (To filled-out by the
                                            <br />
                                            Appointing
                                            <br />
                                            Officer/Authority;
                                            <br />
                                            Please write the position
                                            <br />
                                            name of the applicant)
                                        </div>
                                    </th>

                                    <th
                                        rowSpan="2"
                                        className="w-[8%] border border-black px-1 py-1"
                                    >
                                        Status of
                                        <br />
                                        Appointment

                                        <div className="mt-1 text-[6px] font-normal italic">
                                            (Based on availability of
                                            <br />
                                            PBET/LET/LEPT)
                                        </div>
                                    </th>

                                </tr>

                                {/* =================================================
                                    SECOND HEADER ROW
                                ================================================= */}

                                <tr className="font-bold">

                                    <th className="border border-black px-1 py-2">
                                        Education
                                        <br />
                                        (10 pts)
                                    </th>

                                    <th className="border border-black px-1 py-2">
                                        Training
                                        <br />
                                        (10 pts)
                                    </th>

                                    <th className="border border-black px-1 py-2">
                                        Experience
                                        <br />
                                        (10 pts)
                                    </th>

                                    <th className="border border-black px-1 py-1">
                                        PBET/LET/
                                        <br />
                                        LEPT Rating
                                        <br />
                                        (10 pts)
                                    </th>

                                    <th className="border border-black px-1 py-1">
                                        PPST COIs
                                        <br />
                                        (Classroom
                                        <br />
                                        Observation)
                                        <br />
                                        (35 pts)
                                    </th>

                                    <th className="border border-black px-1 py-1">
                                        PPST NCOIs
                                        <br />
                                        (Teacher
                                        <br />
                                        Reflection)
                                        <br />
                                        (25 pts)
                                    </th>

                                    <th className="border border-black px-1 py-2">
                                        Total
                                        <br />
                                        (100 pts)
                                    </th>

                                    {/* Extra spacer/header cell to align colspan */}
                                    <th className="border border-black px-1 py-2"></th>

                                    <th className="border border-black px-1 py-2">
                                        Yes
                                    </th>

                                    <th className="border border-black px-1 py-2">
                                        No
                                    </th>

                                </tr>

                            </thead>

                            {/* =====================================================
                                APPLICANTS
                            ===================================================== */}

                            <tbody>

                                {ranking.slice(0, 5).map(
                                    (applicant, index) => {

                                        return (
                                            <tr
                                                key={
                                                    applicant.applicant_id ||
                                                    applicant.job_applications_id ||
                                                    index
                                                }
                                                className="h-[24px]"
                                            >

                                                {/* NAME */}
                                                <td className="border border-black px-1 text-left">

                                                    <span className="mr-1">
                                                        {index + 1}
                                                    </span>

                                                    {getApplicantName(
                                                        applicant
                                                    )}

                                                </td>

                                                {/* APPLICATION CODE */}
                                                <td className="border border-black px-1">
                                                    {getApplicationCode(
                                                        applicant
                                                    )}
                                                </td>

                                                {/* EDUCATION */}
                                                <td className="border border-black px-1">
                                                    {formatScore(
                                                        getEducation(
                                                            applicant
                                                        )
                                                    )}
                                                </td>

                                                {/* TRAINING */}
                                                <td className="border border-black px-1">
                                                    {formatScore(
                                                        getTraining(
                                                            applicant
                                                        )
                                                    )}
                                                </td>

                                                {/* EXPERIENCE */}
                                                <td className="border border-black px-1">
                                                    {formatScore(
                                                        getExperience(
                                                            applicant
                                                        )
                                                    )}
                                                </td>

                                                {/* LET */}
                                                <td className="border border-black px-1">
                                                    {formatScore(
                                                        getLET(
                                                            applicant
                                                        )
                                                    )}
                                                </td>

                                                {/* COI */}
                                                <td className="border border-black px-1">
                                                    {formatScore(
                                                        getCOI(
                                                            applicant
                                                        )
                                                    )}
                                                </td>

                                                {/* NCOI */}
                                                <td className="border border-black px-1">
                                                    {formatScore(
                                                        getNCOI(
                                                            applicant
                                                        )
                                                    )}
                                                </td>

                                                {/* TOTAL */}
                                                <td className="border border-black px-1 font-bold">
                                                    {formatScore(
                                                        getTotal(
                                                            applicant
                                                        )
                                                    )}
                                                </td>

                                                {/* REMARKS */}
                                                <td className="border border-black px-1">
                                                    {applicant.remarks || ""}
                                                </td>

                                                {/* BACKGROUND YES */}
                                                <td className="border border-black px-1">
                                                    {applicant.background_investigation ===
                                                        true ||
                                                    applicant.background_investigation ===
                                                        "Yes"
                                                        ? "✓"
                                                        : ""}
                                                </td>

                                                {/* BACKGROUND NO */}
                                                <td className="border border-black px-1">
                                                    {applicant.background_investigation ===
                                                        false ||
                                                    applicant.background_investigation ===
                                                        "No"
                                                        ? "✓"
                                                        : ""}
                                                </td>

                                                {/* APPOINTMENT */}
                                                <td className="border border-black px-1">
                                                    {applicant.appointment ||
                                                        ""}
                                                </td>

                                                {/* STATUS */}
                                                <td className="border border-black px-1">
                                                    {applicant.appointment_status ||
                                                        applicant.status_of_appointment ||
                                                        ""}
                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                                {/* =================================================
                                    EMPTY ROWS
                                ================================================= */}

                                {Array.from({
                                    length: Math.max(
                                        0,
                                        5 - ranking.length
                                    ),
                                }).map((_, index) => (

                                    <tr
                                        key={`empty-${index}`}
                                        className="h-[24px]"
                                    >

                                        <td className="border border-black px-1">
                                            {ranking.length +
                                                index +
                                                1}
                                        </td>

                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                    {/* =====================================================
                        SIGNATURE SECTION
                    ===================================================== */}

                    <div className="mt-5 flex justify-between gap-8">

                        {/* =================================================
                            HMRPSB
                        ================================================= */}

                        <div className="w-[65%]">

                            <div className="font-bold">
                                Prepared by the HMRPSB
                            </div>

                            <div className="italic">
                                (All members should affix signature)
                            </div>

                            <div className="mt-9 grid grid-cols-5 gap-5 text-center">

                                {[
                                    "Name and Position\nHMRPSB Member",
                                    "Name and Position\nHMRPSB Member",
                                    "Name and Position\nHMRPSB Chairperson",
                                    "Name and Position\nHMRPSB Member",
                                    "Name and Position\nHMRPSB Member",
                                ].map((label, index) => (

                                    <div key={index}>

                                        <div className="mx-auto mb-1 border-b border-black"></div>

                                        <div className="whitespace-pre-line text-[8px] leading-tight">
                                            {label}
                                        </div>

                                    </div>

                                ))}

                            </div>

                        </div>

                        {/* =================================================
                            APPOINTING AUTHORITY
                        ================================================= */}

                        <div className="w-[25%]">

                            <div className="text-center font-bold">
                                Appointment conferred by:
                            </div>

                            <div className="mt-12 text-center">

                                <div className="border-b border-black"></div>

                                <div className="mt-1 text-[8px] leading-tight">
                                    Name and Position
                                    <br />
                                    Appointing Authority
                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default CARRQAPrintForm;