import { useEffect, useState } from "react";
import {
  FileText,
  Hourglass,
  UserCheck,
  UserX,
} from "lucide-react";
import { getApplications } from "../../api/ApplicationApi";

export default function ScreeningStats() {
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

  // Statistics
  const totalApplications = applications.length;

  const initialScreening = applications.filter((app) => {
    const status = (app.application_status || "").toLowerCase();
    return status === "initial screening";
  }).length;

  const qualified = applications.filter(
    (app) => app.application_status === "Qualified"
  ).length;

  const disqualified = applications.filter(
    (app) => app.application_status === "Disqualified"
  ).length;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-28 rounded-2xl bg-white shadow-sm animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {/* Total */}
      <div className="bg-white rounded-2xl shadow-sm border-t-4 border-blue-700 p-6 hover:shadow-md transition">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50">
            <FileText className="w-7 h-7 text-blue-700" />
          </div>

          <div>
            <h2 className="text-4xl font-bold text-slate-800">
              {totalApplications}
            </h2>
            <p className="text-gray-500">Total Applications</p>
          </div>
        </div>
      </div>

      {/* Pending */}
      <div className="bg-white rounded-2xl shadow-sm border-t-4 border-amber-500 p-6 hover:shadow-md transition">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50">
            <Hourglass className="w-7 h-7 text-amber-500" />
          </div>

          <div>
            <h2 className="text-4xl font-bold text-slate-800">
              {initialScreening}
            </h2>
            <p className="text-gray-500">Initial Screening</p>
          </div>
        </div>
      </div>

      {/* Qualified */}
      <div className="bg-white rounded-2xl shadow-sm border-t-4 border-green-500 p-6 hover:shadow-md transition">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-50">
            <UserCheck className="w-7 h-7 text-green-600" />
          </div>

          <div>
            <h2 className="text-4xl font-bold text-slate-800">
              {qualified}
            </h2>
            <p className="text-gray-500">Qualified</p>
          </div>
        </div>
      </div>

      {/* Disqualified */}
      <div className="bg-white rounded-2xl shadow-sm border-t-4 border-red-500 p-6 hover:shadow-md transition">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-50">
            <UserX className="w-7 h-7 text-red-600" />
          </div>

          <div>
            <h2 className="text-4xl font-bold text-slate-800">
              {disqualified}
            </h2>
            <p className="text-gray-500">Disqualified</p>
          </div>
        </div>
      </div>
    </div>
  );
}