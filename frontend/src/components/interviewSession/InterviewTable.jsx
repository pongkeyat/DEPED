import React from "react";
import {
    MapPin,
    Calendar,
    UserCheck,
    Users,
    Tag
} from "lucide-react";

export default function AssessmentTable({
    data,
    onSelectSession
}) {

    if (!data || data.length === 0) {

        return (
            <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-xs font-medium text-slate-400">
                No active scheduled assessment records found.
            </div>
        );

    }


    // ============================================================
    // PARSE PANELISTS
    // ============================================================

    const parsePanelists = (value) => {

        if (!value) return [];

        if (Array.isArray(value)) {

            return value
                .map(v => String(v).trim())
                .filter(Boolean);

        }


        if (typeof value === "string") {

            const cleaned =
                value.replace(
                    /[{}\[\]"']/g,
                    ""
                ).trim();


            return cleaned
                .split(",")
                .map(name => name.trim())
                .filter(Boolean);

        }


        return [
            String(value)
        ];

    };


    // ============================================================
    // FORMAT DATE
    // ============================================================

    const formatDate = (dateString) => {

        if (!dateString) return "--";

        const date =
            new Date(dateString);


        if (isNaN(date.getTime())) {
            return dateString;
        }


        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

    };


    return (

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">

            <table className="w-full text-left text-xs border-collapse">

                <thead>

                    <tr className="bg-[#1b4584] px-6 py-4">

                        <th className="py-3 px-4 w-12 text-center font-semibold text-white">
                            #
                        </th>

                        <th className="py-3 px-4 font-semibold text-white">
                            Assessment Session
                        </th>

                        <th className="py-3 px-4 font-semibold text-white">
                            Date
                        </th>

                        <th className="py-3 px-4 font-semibold text-white">
                            Vacancy
                        </th>

                        <th className="py-3 px-4 font-semibold text-white">
                            Applicants
                        </th>

                        <th className="py-3 px-4 font-semibold text-white">
                            Venue
                        </th>

                        <th className="py-3 px-4 font-semibold text-white">
                            Panel Members
                        </th>

                        <th className="py-3 px-4 font-semibold text-white">
                            Remarks
                        </th>

                    </tr>

                </thead>


                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">

                    {data.map((session, index) => {

                        const panelists =
                            parsePanelists(
                                session.conducted_by
                            );


                        const applicants =
                            Array.isArray(
                                session.applicants
                            )
                                ? session.applicants
                                : [];


                        return (

                            <tr
                                key={
                                    session.assessment_session_id ||
                                    `session-${index}`
                                }
                                onClick={() => {

                                    if (onSelectSession) {

                                        onSelectSession(
                                            session
                                        );

                                    }

                                }}
                                className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                            >

                                {/* INDEX */}

                                <td className="py-3.5 px-4 font-medium text-slate-400 text-center">

                                    {index + 1}

                                </td>


                                {/* SESSION ID */}

                                <td className="py-3.5 px-4">

                                    <div className="font-bold text-slate-800">

                                        {session.assessment_session_id}

                                    </div>

                                    <div className="text-[10px] text-slate-400 mt-1">

                                        {session.status || "Scheduled"}

                                    </div>

                                </td>


                                {/* DATE */}

                                <td className="py-3.5 px-4 whitespace-nowrap">

                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">

                                        <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />

                                        <span>
                                            {formatDate(
                                                session.session_date
                                            )}
                                        </span>

                                    </div>

                                </td>


                                {/* VACANCY */}

                                <td className="py-3.5 px-4">

                                    <div className="font-bold text-slate-800 text-xs">

                                        {session.position_title || "--"}

                                    </div>

                                    <div className="mt-1 flex items-center gap-1">

                                        <Tag className="w-3 h-3 text-slate-400" />

                                        <span className="text-[10px] text-slate-500">

                                            {session.vacancy_id || "--"}

                                        </span>

                                    </div>

                                </td>


                                {/* APPLICANTS */}

                                <td className="py-3.5 px-4">

                                    <div className="flex items-center gap-2">

                                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700">

                                            <Users className="w-3.5 h-3.5" />

                                        </div>

                                        <div>

                                            <div className="font-bold text-slate-800">

                                                {session.applicant_count || 0}

                                            </div>

                                            <div className="text-[10px] text-slate-400">

                                                Applicant
                                                {Number(
                                                    session.applicant_count
                                                ) === 1
                                                    ? ""
                                                    : "s"}

                                            </div>

                                        </div>

                                    </div>

                                </td>


                                {/* VENUE */}

                                <td className="py-3.5 px-4 text-slate-600 font-medium">

                                    <div className="flex items-center gap-1.5">

                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                                        <span>
                                            {session.venue || "--"}
                                        </span>

                                    </div>

                                </td>


                                {/* PANELISTS */}

                                <td className="py-3.5 px-4 max-w-[220px]">

                                    {panelists.length > 0 ? (

                                        <div className="flex flex-wrap gap-1">

                                            {panelists.map(
                                                (name, idx) => (

                                                    <span
                                                        key={`${session.assessment_session_id}-panel-${idx}`}
                                                        className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full"
                                                    >

                                                        <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />

                                                        {name}

                                                    </span>

                                                )
                                            )}

                                        </div>

                                    ) : (

                                        <span className="text-slate-400 italic">
                                            --
                                        </span>

                                    )}

                                </td>


                                {/* REMARKS */}

                                <td
                                    className="py-3.5 px-4 text-slate-500 italic text-[11px] max-w-[200px] truncate"
                                    title={session.remarks}
                                >

                                    {session.remarks || "--"}

                                </td>

                            </tr>

                        );

                    })}

                </tbody>

            </table>

        </div>

    );

}