import { useEffect, useState } from "react";
import { FileText, ArrowLeft, Printer } from "lucide-react";
import { getApplications } from "../../api/ApplicationApi"

export default function ApplicationHeader() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getApplications();

                if (response && response.data) {
                    setApplications(response.data);
                } else if (Array.isArray(response)) {
                    setApplications(response);
                } else {
                    console.error("Data is not in expected array format:", response);
                    setApplications([]);
                }
            } catch (error) {
                console.error("Error fetching applications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Change this if you are getting a specific application
    const app = applications[0];

    return (
        <div className="bg-slate-100 p-3">
            <div className="bg-white rounded-2xl border-l-[6px] border-blue-900 shadow-sm px-6 py-4 flex items-center justify-between">

                {/* Left */}
                <div className="flex items-center gap-3">

                    <FileText
                        size={24}
                        className="text-blue-900"
                    />

                    <div>
                        <h1 className="text-2xl font-bold text-blue-900">
                            Application Details
                        </h1>

                        <div className="flex items-center gap-3 mt-1 text-sm">

                            <span className="font-semibold text-blue-600">
                                {loading
                                    ? "Loading..."
                                    : app?.applicant_id || "LUSDO-APP-202605-0002"}
                            </span>

                            <span className="text-slate-400">—</span>

                            <span className="text-slate-600">
                                {loading
                                    ? "Loading Applicant..."
                                    : `${app?.last_name || ""}, ${app?.first_name || ""}`}
                            </span>

                        </div>
                    </div>

                </div>

                {/* Right */}
                <div className="flex items-center gap-2">

                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm transition">
                        <ArrowLeft size={16} />
                        Back to List
                    </button>

                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-sm transition">
                        <Printer size={16} />
                        Print
                    </button>

                </div>

            </div>
        </div>
    );
}