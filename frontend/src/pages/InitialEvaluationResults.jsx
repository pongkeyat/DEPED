import {
  useState,
  useEffect,
  useMemo,
} from "react";

import { useNavigate } from "react-router-dom";

import { Eye } from "lucide-react";

import { getApplications } from "../api/ApplicationApi";
import { getVacancies } from "../api/VacancyApi";

import InitialEvaluationHeader from "../components/initialscreening/InitialEvaluationHeader";

import IERPrintForm from "../components/initialscreening/IERPrintForm";

const getStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case "qualified":
      return "bg-emerald-100 text-emerald-700";

    case "unqualified":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
};

const normalizeVacancyId = (id) =>
  String(id ?? "").trim();

export default function InitialEvaluationResults() {
  const [allApplications, setAllApplications] =
    useState([]);

  const [vacancies, setVacancies] =
    useState([]);

  const [selectedVacancy, setSelectedVacancy] =
    useState("");

  const [showUnqualified, setShowUnqualified] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const navigate = useNavigate();

  // ============================================================
  // LOAD CLOSED VACANCIES
  // ============================================================

  useEffect(() => {
    const loadVacancies = async () => {
      try {
        const response = await getVacancies();

        const data =
          response?.data || response;

        if (Array.isArray(data)) {

          const closedVacancies =
            data.filter((vacancy) => {
              const status = String(
                vacancy.status || ""
              )
                .trim()
                .toLowerCase();

              return status === "closed";
            });

          setVacancies(
            closedVacancies
          );

        } else {
          setVacancies([]);
        }

      } catch (error) {

        console.error(
          "Failed to load vacancies:",
          error
        );

        setVacancies([]);

      }
    };

    loadVacancies();
  }, []);

  // ============================================================
  // LOAD APPLICATIONS
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    const fetchApplications = async () => {
      try {

        setLoading(true);

        const response =
          await getApplications();

        const data =
          response?.data || response;

        if (!isMounted) return;

        if (Array.isArray(data)) {
          setAllApplications(data);
        } else {
          setAllApplications([]);
        }

      } catch (error) {

        console.error(
          "Error fetching applications:",
          error
        );

        if (isMounted) {
          setAllApplications([]);
        }

      } finally {

        if (isMounted) {
          setLoading(false);
        }

      }
    };

    fetchApplications();

    return () => {
      isMounted = false;
    };

  }, []);

  // ============================================================
  // SELECTED VACANCY
  // ============================================================

  const selectedVacancyData = useMemo(() => {

    if (!selectedVacancy) {
      return null;
    }

    return vacancies.find(
      (vacancy) =>
        normalizeVacancyId(
          vacancy.vacancy_id ||
            vacancy.id
        ) ===
        normalizeVacancyId(
          selectedVacancy
        )
    );

  }, [
    vacancies,
    selectedVacancy,
  ]);

  // ============================================================
  // FILTER APPLICANTS
  // ============================================================

  const filteredApplications = useMemo(() => {

    const targetStatus =
      showUnqualified
        ? "unqualified"
        : "qualified";

    // ----------------------------------------------------------
    // STATUS FILTER
    // ----------------------------------------------------------

    let filtered =
      allApplications.filter(
        (app) =>
          String(
            app.application_status || ""
          )
            .trim()
            .toLowerCase() ===
          targetStatus
      );

    // ----------------------------------------------------------
    // VACANCY FILTER
    // ----------------------------------------------------------

    if (selectedVacancy) {

      const selectedId =
        normalizeVacancyId(
          selectedVacancy
        );

      filtered =
        filtered.filter((app) => {

          const applicantVacancyId =
            normalizeVacancyId(
              app.vacancy_id
            );

          return (
            applicantVacancyId ===
            selectedId
          );

        });
    }

    // ----------------------------------------------------------
    // DEDUPLICATE
    // ----------------------------------------------------------

    const uniqueApplicants =
      new Map();

    filtered.forEach((app) => {

      const applicantId =
        app.applicant_id ||
        app.application_id ||
        app.id;

      if (
        applicantId &&
        !uniqueApplicants.has(
          applicantId
        )
      ) {
        uniqueApplicants.set(
          applicantId,
          app
        );
      }

    });

    return Array.from(
      uniqueApplicants.values()
    );

  }, [
    allApplications,
    selectedVacancy,
    showUnqualified,
  ]);

  // ============================================================
  // VIEW APPLICANT
  // ============================================================

  const handleViewApplication = (
    id
  ) => {

    if (!id) return;

    navigate(
      `/applicants/${id}`
    );
  };

  // ============================================================
  // TARGET STATUS
  // ============================================================

  const targetStatus =
    showUnqualified
      ? "unqualified"
      : "qualified";

  // ============================================================
  // PRINT
  // ============================================================

  const handlePrint = () => {

    if (!selectedVacancy) {

      alert(
        "Please select a closed vacancy before printing the IER."
      );

      return;
    }

    if (
      filteredApplications.length === 0
    ) {

      alert(
        `There are no ${targetStatus} applicants for the selected vacancy.`
      );

      return;
    }

    window.print();
  };

  return (
    <div className="min-h-screen p-6">

      {/* ======================================================
          SCREEN HEADER
          ====================================================== */}

      <div className="print:hidden">

        <InitialEvaluationHeader
          onBack={() =>
            navigate(
              "/applications-screening"
            )
          }

          onProceed={() =>
            navigate("/assessment")
          }

          onPrint={handlePrint}
        />

      </div>

      {/* ======================================================
          SCREEN CONTENT
          ====================================================== */}

      <div className="print:hidden">

        {/* FILTERS */}
        <div className="mt-6 flex flex-wrap items-end gap-4">

          {/* VACANCY */}
          <div className="w-full sm:max-w-sm">

            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Filter by Closed Vacancy
            </label>

            <select
              value={selectedVacancy}
              onChange={(e) =>
                setSelectedVacancy(
                  e.target.value
                )
              }
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >

              <option value="">
                All Closed Vacancies
              </option>

              {vacancies.map(
                (vacancy) => {

                  const id =
                    normalizeVacancyId(
                      vacancy.vacancy_id ||
                        vacancy.id
                    );

                  const title =
                    vacancy.position_title ||
                    vacancy.title ||
                    vacancy.job_title ||
                    "Unknown Position";

                  return (
                    <option
                      key={id}
                      value={id}
                    >
                      {title}{" "}
                      (ID: {id})
                    </option>
                  );
                }
              )}

            </select>

          </div>

          {/* SELECTED VACANCY */}
          {selectedVacancyData && (
            <div className="flex h-11 items-center rounded-lg bg-blue-50 px-4 text-sm text-blue-800">

              <span className="font-semibold">
                Selected:
              </span>

              <span className="ml-1">
                {selectedVacancyData.position_title ||
                  selectedVacancyData.title ||
                  "Unknown Position"}
              </span>

            </div>
          )}

          {/* UNQUALIFIED */}
          <button
            type="button"
            onClick={() =>
              setShowUnqualified(
                !showUnqualified
              )
            }
            className={`h-11 rounded-lg border px-5 text-sm font-semibold transition ${
              showUnqualified
                ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {showUnqualified
              ? "Showing Unqualified"
              : "View Unqualified Pool"}
          </button>

        </div>

        {/* RESULT COUNT */}
        <div className="mt-4 text-sm text-gray-600">

          Showing{" "}

          <span className="font-bold text-[#1E3E74]">
            {filteredApplications.length}
          </span>{" "}

          {targetStatus} applicant
          {filteredApplications.length !== 1
            ? "s"
            : ""}

          {selectedVacancy &&
            " for the selected vacancy."}

        </div>

        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-gray-50 text-gray-700">

                <tr>

                  <th className="px-5 py-4 text-left">
                    Vacancy ID
                  </th>

                  <th className="px-5 py-4 text-left">
                    Applicant ID
                  </th>

                  <th className="px-5 py-4 text-left">
                    Applicant Name
                  </th>

                  <th className="px-5 py-4 text-left">
                    Position
                  </th>

                  <th className="px-5 py-4 text-left">
                    Date Applied
                  </th>

                  <th className="px-5 py-4 text-center">
                    Status
                  </th>

                  <th className="px-5 py-4 text-center">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="py-10 text-center text-slate-500"
                    >
                      Loading applicants...
                    </td>

                  </tr>

                ) : filteredApplications.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="py-10 text-center text-slate-500"
                    >
                      No {targetStatus} applicants
                      found
                      {selectedVacancy
                        ? " for this vacancy."
                        : "."}
                    </td>

                  </tr>

                ) : (

                  filteredApplications.map(
                    (app, index) => {

                      const targetId =
                        app.applicant_id ||
                        app.application_id ||
                        app.id;

                      return (

                        <tr
                          key={`${targetId}-${index}`}
                          className="border-b transition-colors hover:bg-slate-50"
                        >

                          <td className="px-5 py-4 font-medium text-[#1E3E74]">
                            {app.vacancy_id ||
                              "N/A"}
                          </td>

                          <td className="px-5 py-4 font-medium text-gray-700">
                            {app.applicant_id ||
                              "N/A"}
                          </td>

                          <td className="px-5 py-4 font-semibold">
                            {app.last_name &&
                            app.first_name
                              ? `${app.last_name}, ${app.first_name}`
                              : "Unknown Applicant"}
                          </td>

                          <td className="px-5 py-4">
                            {app.position_title ||
                              "N/A"}
                          </td>

                          <td className="px-5 py-4">
                            {app.date_received ||
                              "N/A"}
                          </td>

                          <td className="px-5 py-4 text-center">

                            <span
                              className={`rounded-full px-4 py-1 text-sm font-semibold capitalize ${getStatusStyles(
                                app.application_status
                              )}`}
                            >
                              {app.application_status ||
                                "Pending"}
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <div className="flex justify-center">

                              <button
                                type="button"
                                onClick={() =>
                                  handleViewApplication(
                                    targetId
                                  )
                                }
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors ${
                                  showUnqualified
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-blue-600 hover:bg-blue-700"
                                }`}
                              >

                                <Eye size={18} />

                                View

                              </button>

                            </div>

                          </td>

                        </tr>

                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* ======================================================
          PRINT VERSION
          ====================================================== */}

      <IERPrintForm
        vacancy={selectedVacancyData}
        applicants={filteredApplications}
      />

    </div>
  );
}