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
        <div className="print:hidden relative flex min-h-[88px] items-center justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />

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

        </div>
    );
}