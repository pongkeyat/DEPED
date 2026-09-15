import { User, Search } from "lucide-react";

function ApplicantHeader() {
  return (
    <div className="bg-[#183B74] text-white rounded-t-2xl px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-semibold">
          2
        </div>

        <div className="flex items-center gap-2">
          <User size={18} />
          <h2 className="text-xl font-semibold">
            Applicant Information
          </h2>
        </div>
      </div>

      <button className="bg-white text-black rounded-lg px-5 py-2 flex items-center gap-2 hover:bg-gray-100">
        <Search size={18} />
        Search Existing Applicant
      </button>
    </div>
  );
}

export default ApplicantHeader;