import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
    Users,
    UserRoundCheck,
    Heart,
    UserRound,
    Accessibility,
    UsersRound,
    UserRoundX,
    ClipboardList,
    FileSpreadsheet,
    RefreshCw,
    Loader2
} from "lucide-react";

import {
    getApplicantSummaryReport
} from "../api/ReportApi";


export default function ApplicantSummaryReport() {

    const [report, setReport] = useState({
        total_applicants: 0,
        pwd: 0,
        solo_parent: 0,
        indigenous_person: 0,
        married: 0,
        single: 0,
        qualified: 0,
        disqualified: 0
    });

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");


    // ============================================================
    // FETCH REPORT
    // ============================================================

    const fetchReport = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await getApplicantSummaryReport();

            if (
                response?.success &&
                response?.data
            ) {

                setReport({
                    total_applicants:
                        Number(
                            response.data.total_applicants || 0
                        ),

                    pwd:
                        Number(
                            response.data.pwd || 0
                        ),

                    solo_parent:
                        Number(
                            response.data.solo_parent || 0
                        ),

                    indigenous_person:
                        Number(
                            response.data.indigenous_person || 0
                        ),

                    married:
                        Number(
                            response.data.married || 0
                        ),

                    single:
                        Number(
                            response.data.single || 0
                        ),

                    qualified:
                        Number(
                            response.data.qualified || 0
                        ),

                    disqualified:
                        Number(
                            response.data.disqualified || 0
                        )
                });

            } else {

                throw new Error(
                    "Invalid report response."
                );

            }

        } catch (error) {

            console.error(
                "Error fetching applicant report:",
                error
            );

            setError(
                "Unable to load applicant report."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        fetchReport();

    }, []);


    // ============================================================
    // GENERATE EXCEL
    // ============================================================

    const generateExcel = async () => {

        try {

            setGenerating(true);

            // Get latest data before generating
            const response =
                await getApplicantSummaryReport();

            const data =
                response?.data;

            if (!data) {

                throw new Error(
                    "No report data available."
                );

            }


            // ====================================================
            // REPORT TITLE
            // ====================================================

            const worksheetData = [

                [
                    "APPLICANT SUMMARY REPORT"
                ],

                [
                    "Recruitment Management and Evaluation System"
                ],

                [
                    ""
                ],

                [
                    "Category",
                    "Count"
                ],

                [
                    "Total Applicants",
                    Number(
                        data.total_applicants || 0
                    )
                ],

                [
                    "PWD",
                    Number(
                        data.pwd || 0
                    )
                ],

                [
                    "Solo Parent",
                    Number(
                        data.solo_parent || 0
                    )
                ],

                [
                    "Indigenous Person (IP)",
                    Number(
                        data.indigenous_person || 0
                    )
                ],

                [
                    "Married",
                    Number(
                        data.married || 0
                    )
                ],

                [
                    "Single",
                    Number(
                        data.single || 0
                    )
                ],

                [
                    "Qualified",
                    Number(
                        data.qualified || 0
                    )
                ],

                [
                    "Disqualified",
                    Number(
                        data.disqualified || 0
                    )
                ]

            ];


            // ====================================================
            // CREATE WORKSHEET
            // ====================================================

            const worksheet =
                XLSX.utils.aoa_to_sheet(
                    worksheetData
                );


            // ====================================================
            // COLUMN WIDTH
            // ====================================================

            worksheet["!cols"] = [
                {
                    wch: 32
                },
                {
                    wch: 18
                }
            ];


            // ====================================================
            // MERGE TITLE CELLS
            // ====================================================

            worksheet["!merges"] = [
                {
                    s: {
                        r: 0,
                        c: 0
                    },
                    e: {
                        r: 0,
                        c: 1
                    }
                },

                {
                    s: {
                        r: 1,
                        c: 0
                    },
                    e: {
                        r: 1,
                        c: 1
                    }
                }
            ];


            // ====================================================
            // CREATE WORKBOOK
            // ====================================================

            const workbook =
                XLSX.utils.book_new();


            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Applicant Summary"
            );


            // ====================================================
            // FILE NAME
            // ====================================================

            const date =
                new Date()
                    .toISOString()
                    .split("T")[0];


            const fileName =
                `Applicant_Summary_Report_${date}.xlsx`;


            XLSX.writeFile(
                workbook,
                fileName
            );


        } catch (error) {

            console.error(
                "Error generating Excel report:",
                error
            );

            alert(
                "Failed to generate Excel report."
            );

        } finally {

            setGenerating(false);

        }

    };


    // ============================================================
    // REPORT CARD
    // ============================================================

    const ReportCard = ({
        title,
        value,
        icon: Icon,
        iconWrapper
    }) => {

        return (

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">

                <div className="flex items-center justify-between">

                    <div>

                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {title}
                        </p>

                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                            {loading
                                ? "--"
                                : value.toLocaleString()}
                        </p>

                    </div>


                    <div
                        className={`
                            flex h-10 w-10
                            items-center justify-center
                            rounded-lg
                            ${iconWrapper}
                        `}
                    >

                        <Icon className="h-5 w-5" />

                    </div>

                </div>

            </div>

        );

    };


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="space-y-6">

            {/* ================================================== */}
            {/* PAGE HEADER */}
            {/* ================================================== */}

            <div className="relative flex min-h-[88px] flex-col gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

                <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

                <div className="flex items-center gap-4 pl-3">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3E74]">
                        <ClipboardList size={24} className="stroke-[2.2]" />
                    </div>

                    <div>

                        <h1 className="text-2xl font-bold tracking-tight text-[#1E3E74]">
                            Applicant Reports
                        </h1>

                        <p className="mt-0.5 text-sm text-gray-500">
                            View applicant statistics and generate
                            recruitment reports.
                        </p>

                    </div>

                </div>


                <div className="flex flex-wrap items-center gap-2 pl-3 sm:pl-0">

                    <button
                        type="button"
                        onClick={fetchReport}
                        disabled={loading}
                        className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-4
                            py-2.5
                            text-sm
                            font-semibold
                            text-slate-600
                            shadow-sm
                            transition
                            hover:bg-slate-50
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >

                        <RefreshCw
                            className={`
                                h-3.5
                                w-3.5
                                ${loading
                                    ? "animate-spin"
                                    : ""}
                            `}
                        />

                        Refresh

                    </button>


                    <button
                        type="button"
                        onClick={generateExcel}
                        disabled={
                            loading ||
                            generating
                        }
                        className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            bg-emerald-600
                            px-4
                            py-2.5
                            text-sm
                            font-semibold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-emerald-700
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >

                        {generating ? (

                            <Loader2
                                className="
                                    h-3.5
                                    w-3.5
                                    animate-spin
                                "
                            />

                        ) : (

                            <FileSpreadsheet
                                className="
                                    h-3.5
                                    w-3.5
                                "
                            />

                        )}

                        {generating
                            ? "Generating..."
                            : "Generate Excel"}

                    </button>

                </div>

            </div>


            {/* ================================================== */}
            {/* ERROR */}
            {/* ================================================== */}

            {error && (

                <div className="
                    rounded-lg
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-xs
                    font-medium
                    text-red-600
                ">

                    {error}

                </div>

            )}


            {/* ================================================== */}
            {/* SUMMARY CARD */}
            {/* ================================================== */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 px-6 py-5">

                    <div>

                        <h2 className="text-lg font-bold text-gray-900">
                            Applicant Summary
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Overview of applicant demographics
                            and application results.
                        </p>

                    </div>

                </div>


                <div className="space-y-7 p-6">

                    {/* ================================================== */}
                    {/* DEMOGRAPHICS */}
                    {/* ================================================== */}

                    <div>

                        <div className="mb-3 flex items-center gap-2">

                            <div className="h-1 w-5 rounded-full bg-[#1E3E74]" />

                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Applicant Demographics
                            </h3>

                        </div>


                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

                            <ReportCard
                                title="Total Applicants"
                                value={
                                    report.total_applicants
                                }
                                icon={Users}
                                iconWrapper="
                                    bg-blue-50
                                    text-blue-600
                                "
                            />


                            <ReportCard
                                title="PWD"
                                value={
                                    report.pwd
                                }
                                icon={Accessibility}
                                iconWrapper="
                                    bg-purple-50
                                    text-purple-600
                                "
                            />

                            <ReportCard
                                title="Solo Parent"
                                value={report.solo_parent}
                                icon={Heart}
                                iconWrapper="bg-rose-50 text-rose-600"
                            />

                            <ReportCard
                                title="Indigenous Person (IP)"
                                value={report.indigenous_person}
                                icon={UsersRound}
                                iconWrapper="bg-teal-50 text-teal-600"
                            />

                            <ReportCard
                                title="Married"
                                value={
                                    report.married
                                }
                                icon={Heart}
                                iconWrapper="
                                    bg-rose-50
                                    text-rose-600
                                "
                            />


                            <ReportCard
                                title="Single"
                                value={
                                    report.single
                                }
                                icon={UserRound}
                                iconWrapper="
                                    bg-amber-50
                                    text-amber-600
                                "
                            />

                        </div>

                    </div>


                    {/* ================================================== */}
                    {/* APPLICATION RESULTS */}
                    {/* ================================================== */}

                    <div>

                        <div className="mb-3 flex items-center gap-2">

                            <div className="h-1 w-5 rounded-full bg-[#1E3E74]" />

                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Application Results
                            </h3>

                        </div>


                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            <ReportCard
                                title="Qualified"
                                value={
                                    report.qualified
                                }
                                icon={UserRoundCheck}
                                iconWrapper="
                                    bg-emerald-50
                                    text-emerald-600
                                "
                            />


                            <ReportCard
                                title="Disqualified"
                                value={
                                    report.disqualified
                                }
                                icon={UserRoundX}
                                iconWrapper="
                                    bg-red-50
                                    text-red-600
                                "
                            />

                        </div>

                    </div>

                </div>

            </div>


            {/* ================================================== */}
            {/* REPORT INFORMATION */}
            {/* ================================================== */}

            <div className="
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-5
                py-4
            ">

                <div className="flex items-start gap-3">

                    <div className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-white
                        border
                        border-slate-200
                    ">

                        <FileSpreadsheet
                            className="
                                h-4
                                w-4
                                text-slate-500
                            "
                        />

                    </div>


                    <div>

                        <p className="
                            text-xs
                            font-semibold
                            text-slate-700
                        ">
                            Excel Report
                        </p>

                        <p className="
                            mt-0.5
                            text-[11px]
                            leading-relaxed
                            text-slate-400
                        ">
                            Generate an Excel file containing
                            the current applicant demographic
                            and application result statistics.
                        </p>

                    </div>

                </div>

            </div>

        </div>

    );

}