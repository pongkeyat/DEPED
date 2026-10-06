import React, { useEffect, useState } from "react";
import { Briefcase, Clock3 } from "lucide-react";
import { getVacancies } from "../../api/VacancyApi";
import { getPositions } from "../../api/PositionsApi";

function Applications({ formData, onChange, submissionType }) {
  const [vacancies, setVacancies] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const determinedSubmissionType = submissionType;

  const fallbackForm = {
    vacancy_id: "",
    dateReceived: new Date().toISOString().split("T")[0],
    timeReceived: new Date().toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    receivedBy: "Human Resources Officer",
    submissionType: determinedSubmissionType,
  };

  const form = formData ?? fallbackForm;

  // ============================================================
  // Automatically update submission type
  // ============================================================
  useEffect(() => {
    if (
      onChange &&
      form.submissionType !== determinedSubmissionType
    ) {
      onChange("submissionType", determinedSubmissionType);
    }
  }, [determinedSubmissionType, form.submissionType, onChange]);

  const handleLocalChange = (name, value) => {
    if (onChange) {
      onChange(name, value);
    }
  };

  // ============================================================
  // Fetch Vacancies and Positions
  // ============================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        const [vacancyResponse, positionResponse] = await Promise.all([
          getVacancies(),
          getPositions(),
        ]);

        // Safely extract vacancies
        const rawVacancies = Array.isArray(vacancyResponse)
          ? vacancyResponse
          : vacancyResponse?.data?.results ||
            vacancyResponse?.data ||
            [];

        // Safely extract positions
        const positionList = Array.isArray(positionResponse)
          ? positionResponse
          : positionResponse?.data?.results ||
            positionResponse?.data ||
            [];

        // Only show Open vacancies
        const openVacancies = rawVacancies.filter(
          (v) => String(v.status).toLowerCase() === "open"
        );

        setVacancies(openVacancies);
        setPositions(positionList);
      } catch (err) {
        console.error(
          "Failed to load vacancies/positions:",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="rounded-[20px] bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-[#1e407a] px-6 py-4 rounded-t-[20px] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white font-bold text-sm">
            1
          </div>

          <Briefcase size={20} />

          <h2 className="text-lg font-semibold">
            Vacancy / Position Applied For
          </h2>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">

        {/* First Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Vacancy */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Select Vacancy Posting{" "}
              <span className="text-red-500">*</span>
            </label>

            <select
              value={form.vacancy_id}
              required
              onChange={(e) =>
                handleLocalChange(
                  "vacancy_id",
                  e.target.value
                )
              }
              className="w-full h-11 rounded-lg border border-gray-300 bg-gray-50 px-4 text-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            >
              <option value="">
                {loading
                  ? "Loading vacancies..."
                  : vacancies.length === 0
                  ? "No open vacancies available"
                  : "-- Select Position / Vacancy --"}
              </option>

              {!loading &&
                vacancies.map((v, index) => {
                  const vacancyId =
                    v.vacancy_id ||
                    v.id ||
                    index;

                  const vPositionKey =
                    v.position_id ||
                    v.positionId ||
                    v.position;

                  const position = positions.find(
                    (p) =>
                      String(
                        p.position_id || p.id
                      ) === String(vPositionKey)
                  );

                  const title =
                    position?.position_title ||
                    position?.title ||
                    v.position_title ||
                    v.title ||
                    v.position_name ||
                    `Vacancy #${vacancyId}`;

                  return (
                    <option
                      key={vacancyId}
                      value={vacancyId}
                    >
                      {title}
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Date Received */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Date Received{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              type="date"
              value={form.dateReceived}
              onChange={(e) =>
                handleLocalChange(
                  "dateReceived",
                  e.target.value
                )
              }
              className="w-full h-11 rounded-lg border border-gray-300 bg-gray-50 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

          {/* Time Received */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Time Received{" "}
              <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type="text"
                readOnly
                value={form.timeReceived}
                className="w-full h-11 rounded-lg border border-gray-300 bg-gray-50 px-4 text-sm"
              />

              <Clock3
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          {/* Received By */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Received By
            </label>

            <input
              type="text"
              readOnly
              value={form.receivedBy}
              className="w-full h-11 rounded-lg border border-gray-200 bg-gray-100 px-4 text-sm text-gray-500"
            />
          </div>

          {/* Submission Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Submission Type
            </label>

            <input
              type="text"
              readOnly
              value={determinedSubmissionType}
              className="w-full h-11 rounded-lg border border-gray-200 bg-gray-100 px-4 text-sm text-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Applications;