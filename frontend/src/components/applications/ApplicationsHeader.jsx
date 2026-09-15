import { useNavigate } from "react-router-dom";
import { Briefcase, List, Printer } from "lucide-react";

export default function WalkInApplicationHeader() {
    const navigate = useNavigate();

    const handleAllApplications = () => {
        navigate("/applications"); // adjust to your actual "All Applications" route
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="print:hidden bg-white rounded-2xl border-l-[6px] border-blue-900 shadow-sm px-6 py-4 flex items-center justify-between">

            {/* Left */}
            <div className="flex items-center gap-3">
                <Briefcase size={22} className="text-blue-900" />
                <div>
                    <h1 className="text-xl font-bold text-blue-900">
                        Receive Walk-In Application
                    </h1>
                    <p className="text-sm text-slate-500">
                        Record and log application documents submitted personally at the HR Office
                    </p>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                <button
                    onClick={handleAllApplications}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm transition"
                >
                    <List size={16} />
                    All Applications
                </button>

                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-sm transition"
                >
                    <Printer size={16} />
                    Print Form
                </button>
            </div>

        </div>
    );
}