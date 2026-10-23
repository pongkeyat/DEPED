import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
    Loader2,
    Search,
    Download,
    FileText
} from "lucide-react";

import {
    getApplicantSummaryReport
} from "../api/ReportApi";
import { getApplications } from "../api/ApplicationApi";
import { getVacancies } from "../api/VacancyApi";


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
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [error, setError] = useState("");

    // Added applicant list and vacancy filter; existing summary stays intact.
    const [applications, setApplications] = useState([]);
    const [vacancies, setVacancies] = useState([]);
    const [selectedVacancy, setSelectedVacancy] = useState("");
    const [applicantSearch, setApplicantSearch] = useState("");
    const [applicantsLoading, setApplicantsLoading] = useState(false);
    const [applicantsGenerating, setApplicantsGenerating] = useState(false);
    const [applicantsPdfGenerating, setApplicantsPdfGenerating] = useState(false);
    const [applicantError, setApplicantError] = useState("");


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

    const generateSummaryPdf = async () => {
        try {
            setGeneratingPdf(true);
            const response = await getApplicantSummaryReport();
            const data = response?.data;
            if (!data) {
                throw new Error("No report data available.");
            }

            const summaryRows = [
                ["Total Applicants", Number(data.total_applicants || 0)],
                ["PWD", Number(data.pwd || 0)],
                ["Solo Parent", Number(data.solo_parent || 0)],
                ["Indigenous Person (IP)", Number(data.indigenous_person || 0)],
                ["Married", Number(data.married || 0)],
                ["Single", Number(data.single || 0)],
                ["Qualified", Number(data.qualified || 0)],
                ["Disqualified", Number(data.disqualified || 0)]
            ];
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.setTextColor(30, 62, 116);
            doc.text("APPLICANT SUMMARY REPORT", 14, 20);
            doc.setFontSize(10);
            doc.setTextColor(90, 98, 110);
            doc.text("Recruitment Management and Evaluation System", 14, 27);
            doc.text(
                `Generated: ${new Date().toLocaleDateString("en-PH")}`,
                14,
                35
            );

            autoTable(doc, {
                startY: 43,
                head: [["Category", "Count"]],
                body: summaryRows,
                theme: "grid",
                styles: { fontSize: 10, cellPadding: 3 },
                headStyles: { fillColor: [30, 62, 116] },
                columnStyles: {
                    0: { cellWidth: 110 },
                    1: { cellWidth: 45, halign: "right" }
                }
            });

            const date = new Date().toISOString().split("T")[0];
            doc.save(`Applicant_Summary_Report_${date}.pdf`);
        } catch (error) {
            console.error("Error generating PDF report:", error);
            alert("Failed to generate PDF report.");
        } finally {
            setGeneratingPdf(false);
        }
    };


    const extractArray = (response, keys = []) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        for (const key of keys) {
            if (Array.isArray(response?.data?.[key])) return response.data[key];
            if (Array.isArray(response?.[key])) return response[key];
        }
        return [];
    };

    const fetchApplicantData = async () => {
        try {
            setApplicantsLoading(true);
            setApplicantError("");
            const [applicationResponse, vacancyResponse] = await Promise.all([
                getApplications(),
                getVacancies(),
            ]);
            setApplications(extractArray(applicationResponse, ["applications", "applicants", "results"]));
            setVacancies(extractArray(vacancyResponse, ["vacancies", "results"]));
        } catch (err) {
            console.error("Error fetching applicants/vacancies:", err);
            setApplicantError("Unable to load applicants or vacancies. Please check the API responses.");
            setApplications([]);
            setVacancies([]);
        } finally {
            setApplicantsLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
        fetchApplicantData();
    }, []);

    const normalizeId = (value) => String(value ?? "").trim();
    const getVacancyId = (vacancy) => vacancy.vacancy_id ?? vacancy.id ?? "";
    const getApplicationVacancyId = (application) =>
        application.vacancy_id ?? application.vacancy?.vacancy_id ?? "";
    const getApplicantName = (applicant) => {
        const fullName = [applicant.first_name, applicant.middle_name, applicant.last_name, applicant.suffix]
            .filter((value) => String(value || "").trim())
            .join(" ");
        return fullName || applicant.applicant_name || applicant.full_name || "N/A";
    };

    const selectedVacancyData = vacancies.find(
        (vacancy) => normalizeId(getVacancyId(vacancy)) === normalizeId(selectedVacancy)
    );

    const filteredApplicants = applications.filter((application) => {
        if (!selectedVacancy) return false;
        const matchesVacancy = normalizeId(getApplicationVacancyId(application)) === normalizeId(selectedVacancy);
        if (!matchesVacancy) return false;
        const query = applicantSearch.trim().toLowerCase();
        if (!query) return true;
        return [
            getApplicantName(application), application.applicant_id,
            application.job_applications_id, application.application_code,
            application.ticket, application.email_address, application.email,
            application.application_status, application.status,
        ].some((value) => String(value ?? "").toLowerCase().includes(query));
    });

    const generateApplicantsExcel = () => {
        try {
            setApplicantsGenerating(true);
            if (!selectedVacancy) {
                alert("Please select a vacancy first.");
                return;
            }
            if (!filteredApplicants.length) {
                alert("No applicants found for this vacancy and search.");
                return;
            }

            const positionTitle = selectedVacancyData?.position_title ||
                selectedVacancyData?.plantilla_position || "Selected Vacancy";
            const rows = filteredApplicants.map((application, index) => ({
                "No.": index + 1,
                "Applicant ID": application.applicant_id || "",
                "Application Code": application.application_code || application.applicationCode || "",
                "Ticket": application.ticket || "",
                "Application ID": application.job_applications_id || "",
                "Applicant Name": getApplicantName(application),
                "Email Address": application.email_address || application.email || "",
                "Vacancy ID": getApplicationVacancyId(application),
                "Position Title": application.position_title || positionTitle,
                "Salary Grade": application.salary_grade || selectedVacancyData?.salary_grade || "",
                "Category": application.category || selectedVacancyData?.category || "",
                "Application Status": application.application_status || application.status || "",
            }));

            const worksheetData = [
                ["APPLICANT LIST REPORT"],
                ["Recruitment Management and Evaluation System"],
                [],
                ["Selected Vacancy", positionTitle],
                ["Vacancy ID", selectedVacancy],
                ["Total Applicants", rows.length],
                [],
                Object.keys(rows[0]),
                ...rows.map((row) => Object.values(row)),
            ];
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            worksheet["!cols"] = [
                { wch: 8 }, { wch: 20 }, { wch: 22 }, { wch: 20 },
                { wch: 22 }, { wch: 32 }, { wch: 32 }, { wch: 22 },
                { wch: 32 }, { wch: 15 }, { wch: 24 }, { wch: 22 },
            ];
            worksheet["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
            ];
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Applicants");
            const date = new Date().toISOString().split("T")[0];
            const safeTitle = String(positionTitle).replace(/[\\/:*?"<>|]/g, "").trim().replace(/\s+/g, "_");
            XLSX.writeFile(workbook, `Applicants_${safeTitle}_${date}.xlsx`);
        } catch (err) {
            console.error("Error generating applicant Excel:", err);
            alert("Failed to generate the applicant Excel report.");
        } finally {
            setApplicantsGenerating(false);
        }
    };

    const generateApplicantsPdf = () => {
        try {
            setApplicantsPdfGenerating(true);
            if (!selectedVacancy || !filteredApplicants.length) {
                alert("Select a vacancy with applicants before generating the PDF.");
                return;
            }

            const positionTitle = selectedVacancyData?.position_title ||
                selectedVacancyData?.plantilla_position || "Selected Vacancy";
            const rows = filteredApplicants.map((application, index) => [
                index + 1,
                application.applicant_id || "",
                application.application_code || application.applicationCode || "",
                application.ticket || "",
                application.job_applications_id || "",
                getApplicantName(application),
                application.email_address || application.email || "",
                getApplicationVacancyId(application),
                application.position_title || positionTitle,
                application.salary_grade || selectedVacancyData?.salary_grade || "",
                application.category || selectedVacancyData?.category || "",
                application.application_status || application.status || "",
            ]);

            const doc = new jsPDF({
                orientation: "landscape",
                format: "a3"
            });
            doc.setFontSize(16);
            doc.setTextColor(30, 62, 116);
            doc.text("APPLICANT LIST REPORT", 14, 16);
            doc.setFontSize(9);
            doc.setTextColor(90, 98, 110);
            doc.text("Recruitment Management and Evaluation System", 14, 22);
            doc.text(`Vacancy: ${positionTitle}`, 14, 30);
            doc.text(`Vacancy ID: ${selectedVacancy}`, 14, 35);
            doc.text(`Matching Applicants: ${rows.length}`, 14, 40);

            autoTable(doc, {
                startY: 46,
                head: [[
                    "No.",
                    "Applicant ID",
                    "Application Code",
                    "Ticket",
                    "Application ID",
                    "Applicant Name",
                    "Email Address",
                    "Vacancy ID",
                    "Position Title",
                    "Salary Grade",
                    "Category",
                    "Application Status"
                ]],
                body: rows,
                theme: "grid",
                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                    overflow: "linebreak"
                },
                headStyles: {
                    fillColor: [30, 62, 116],
                    fontSize: 7
                },
                margin: { left: 14, right: 14 },
                didDrawPage: () => {
                    const pageCount = doc.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(120);
                    doc.text(
                        `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
                        doc.internal.pageSize.getWidth() - 14,
                        doc.internal.pageSize.getHeight() - 8,
                        { align: "right" }
                    );
                }
            });

            const date = new Date().toISOString().split("T")[0];
            const safeTitle = String(positionTitle)
                .replace(/[\\/:*?"<>|]/g, "")
                .trim()
                .replace(/\s+/g, "_");
            doc.save(`Applicants_${safeTitle}_${date}.pdf`);
        } catch (err) {
            console.error("Error generating applicant PDF:", err);
            alert("Failed to generate the applicant PDF report.");
        } finally {
            setApplicantsPdfGenerating(false);
        }
    };


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
                        onClick={() => { fetchReport(); fetchApplicantData(); }}
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

                    <button
                        type="button"
                        onClick={generateSummaryPdf}
                        disabled={loading || generatingPdf}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {generatingPdf ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <FileText className="h-3.5 w-3.5" />
                        )}
                        {generatingPdf ? "Generating..." : "Generate PDF"}
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
            {/* APPLICANTS BY VACANCY - ADDED, EXISTING SUMMARY KEPT */}
            {/* ================================================== */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5">
                    <h2 className="text-lg font-bold text-gray-900">Applicants by Vacancy</h2>
                    <p className="mt-1 text-sm text-gray-500">Select a vacancy to view only its applicants, then export the list to Excel or PDF.</p>
                </div>

                <div className="space-y-5 p-6">
                    {applicantError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {applicantError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="report-vacancy-filter" className="mb-2 block text-sm font-semibold text-gray-700">Vacancy</label>
                            <select
                                id="report-vacancy-filter"
                                value={selectedVacancy}
                                onChange={(event) => setSelectedVacancy(event.target.value)}
                                disabled={applicantsLoading}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#1E3E74] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            >
                                <option value="">Select a vacancy</option>
                                {vacancies.map((vacancy) => {
                                    const vacancyId = getVacancyId(vacancy);
                                    if (!vacancyId) return null;
                                    const title = vacancy.position_title || vacancy.plantilla_position || "Untitled Position";
                                    return (
                                        <option key={vacancyId} value={vacancyId}>
                                            {title}{vacancy.salary_grade ? ` | SG ${vacancy.salary_grade}` : ""} ({vacancyId})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="report-applicant-search" className="mb-2 block text-sm font-semibold text-gray-700">Search Applicants</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="report-applicant-search"
                                    value={applicantSearch}
                                    onChange={(event) => setApplicantSearch(event.target.value)}
                                    disabled={!selectedVacancy}
                                    placeholder="Search name, application code, email..."
                                    className="w-full rounded-xl border border-gray-300 py-3 pl-9 pr-4 text-sm outline-none focus:border-[#1E3E74] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">
                                {selectedVacancyData?.position_title || selectedVacancyData?.plantilla_position || (selectedVacancy ? "Selected Vacancy" : "No vacancy selected")}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {selectedVacancy ? `Vacancy ID: ${selectedVacancy} · ${filteredApplicants.length} matching applicant(s)` : "Choose a vacancy to show its applicants."}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={generateApplicantsExcel}
                                disabled={applicantsLoading || applicantsGenerating || applicantsPdfGenerating || !selectedVacancy || filteredApplicants.length === 0}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {applicantsGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                {applicantsGenerating ? "Generating..." : "Export Applicants (.xlsx)"}
                            </button>
                            <button
                                type="button"
                                onClick={generateApplicantsPdf}
                                disabled={applicantsLoading || applicantsPdfGenerating || applicantsGenerating || !selectedVacancy || filteredApplicants.length === 0}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {applicantsPdfGenerating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                                {applicantsPdfGenerating ? "Generating..." : "Export Applicants (.pdf)"}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Applicant</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Application Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Ticket</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {applicantsLoading ? (
                                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">Loading applicants...</td></tr>
                                ) : !selectedVacancy ? (
                                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">Select a vacancy to view applicants.</td></tr>
                                ) : filteredApplicants.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">No applicants found for this vacancy.</td></tr>
                                ) : filteredApplicants.map((applicant, index) => (
                                    <tr key={applicant.job_applications_id || applicant.applicant_id || index} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <p className="text-sm font-semibold text-gray-800">{getApplicantName(applicant)}</p>
                                            <p className="mt-1 text-xs text-gray-400">{applicant.applicant_id || "No applicant ID"}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{applicant.application_code || applicant.applicationCode || "—"}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{applicant.ticket || "—"}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{applicant.email_address || applicant.email || "—"}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{applicant.application_status || applicant.status || "Pending"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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