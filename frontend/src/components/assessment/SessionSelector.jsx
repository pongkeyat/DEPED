import React from "react";

export default function SessionSelector({
    sessions,
    selectedSession,
    onSelectSession,
}) {

    // The interview-sessions endpoint already contains only scheduled applicants.
    const qualifiedSessions = Array.isArray(sessions) ? sessions : [];

    return (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-gray-900">
                Assessment Session
            </h2>

            <p className="mt-1 mb-4 text-sm text-gray-500">
                Choose the scheduled assessment session.
            </p>

            <select
                value={selectedSession}
                onChange={(e) =>
                    onSelectSession(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >

                <option value="">
                    Select an assessment session
                </option>

                {qualifiedSessions.map((session) => (

                    <option
                        key={session.session_id}
                        value={session.session_id}
                    >

                        {session.session_date ||
                            "No Date"}

                        {" - "}

                        {session.venue ||
                            "No Venue"}

                        {" - "}

                        {session.position_title ||
                            `Vacancy ${session.vacancy_id}`}

                    </option>

                ))}

            </select>

            {qualifiedSessions.length === 0 && (
                <p className="mt-3 text-sm text-gray-500">
                    No assessment sessions with qualified
                    applicants are available.
                </p>
            )}

        </div>
    );
}