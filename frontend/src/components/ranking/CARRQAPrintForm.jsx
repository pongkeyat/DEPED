import getAssessmentCriterionScore from "../../utils/getAssessmentCriterionScore";

const CARRQAPrintForm = ({ vacancy, ranking = [], hrmpsbMembers = [] }) => {
  const formatScore = (value) => {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return value;
    }

    return Number.isInteger(number) ? number : number.toFixed(2);
  };

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-PH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const getApplicantName = (applicant) => {
    return (
      applicant.applicant_name || applicant.full_name || applicant.name || ""
    );
  };

  const getApplicationCode = (applicant) => {
    return (
      applicant.application_code ||
      applicant.application_id ||
      applicant.job_applications_id ||
      ""
    );
  };

  const getEducation = (applicant) => {
    return (
      applicant.education?.points ??
      applicant.education_points ??
      applicant.education_score ??
      ""
    );
  };

  const getTraining = (applicant) => {
    return (
      applicant.training?.points ??
      applicant.training_points ??
      applicant.training_score ??
      ""
    );
  };

  const getExperience = (applicant) => {
    return (
      applicant.experience?.points ??
      applicant.experience_points ??
      applicant.experience_score ??
      ""
    );
  };

  /*
    |--------------------------------------------------------------------------
    | PBET / LET / LEPT
    |--------------------------------------------------------------------------
    */

  const getLET = (applicant) => {
    return (
      applicant.pbet_let_lept_rating ??
      applicant.pbet_let_lept ??
      applicant.let_rating ??
      applicant.lept_rating ??
      applicant.eligibility_rating ??
      getAssessmentCriterionScore(applicant, "PBET/LET/LEPT Rating") ??
      ""
    );
  };

  /*
    |--------------------------------------------------------------------------
    | PPST COIs
    |--------------------------------------------------------------------------
    */

  const getCOI = (applicant) => {
    return (
      applicant.ppst_coi_score ??
      applicant.coi_score ??
      applicant.classroom_observation_score ??
      applicant.cois_score ??
      getAssessmentCriterionScore(applicant, "PPST COIs") ??
      ""
    );
  };

  /*
    |--------------------------------------------------------------------------
    | PPST NCOIs
    |--------------------------------------------------------------------------
    */

  const getNCOI = (applicant) => {
    return (
      applicant.ppst_ncoi_score ??
      applicant.ncoi_score ??
      applicant.teacher_reflection_score ??
      applicant.ncois_score ??
      getAssessmentCriterionScore(applicant, "PPST NCOIs") ??
      ""
    );
  };

  /*
    |--------------------------------------------------------------------------
    | TOTAL
    |--------------------------------------------------------------------------
    */

  const getTotal = (applicant) => {
    return (
      applicant.combined_total ??
      applicant.overall_score ??
      applicant.total_score ??
      applicant.total ??
      ""
    );
  };

  return (
    <>
      <style>{`
        @page {
          size: landscape;
          margin: 0;
        }

        @media print {
          html,
          body,
          #root {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>
      <div className="hidden print:block bg-white text-black">
      <div className="w-full px-2 py-2 font-serif text-[9px]">
        {/* =========================================================
                    OUTER BORDER
                ========================================================= */}

        <div className="border border-black px-3 py-2">
          {/* =====================================================
                        HEADER
                    ===================================================== */}

          <div className="relative">
            {/* Annex */}
            <div className="absolute right-0 top-0 text-[8px] font-bold italic">
              Annex I-1
            </div>

            {/* Title */}
            <div className="text-center">
              <h1 className="text-[13px] font-bold">
                COMPARATIVE ASSESSMENT RESULT - REGISTRY OF QUALIFIED APPLICANTS
                (CAR-RQA)
              </h1>
            </div>

            {/* Vacancy Information */}
            <div className="mt-2 grid grid-cols-2 gap-8">
              {/* LEFT */}
              <div>
                <div className="flex items-end">
                  <span className="font-bold">Position:</span>

                  <span className="ml-2 flex-1 border-b border-black px-1">
                    {vacancy?.position_title || ""}
                  </span>
                </div>

                <div className="mt-2 flex items-end">
                  <span className="font-bold whitespace-nowrap">
                    Office/Bureau/Service/Unit:
                  </span>

                  <span className="ml-2 flex-1 border-b border-black px-1">
                    {vacancy?.office_unit ||
                      vacancy?.schools_division_office ||
                      vacancy?.division_office ||
                      vacancy?.office ||
                      ""}
                  </span>
                </div>
              </div>

              {/* RIGHT */}
              <div>
                <div className="flex items-end">
                  <span className="font-bold whitespace-nowrap">
                    Plantilla Item Number:
                  </span>

                  <span className="ml-2 flex-1 border-b border-black px-1">
                    {vacancy?.plantilla_position ||
                      vacancy?.plantilla_item_number ||
                      vacancy?.item_number ||
                      ""}
                  </span>
                </div>
                <div className="mt-2 flex items-end">
                  <span className="font-bold whitespace-nowrap">
                    Date Posted:
                  </span>
                  <span className="ml-2 flex-1 border-b border-black px-1">
                    {formatDate(vacancy?.application_posted)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
                        MAIN CAR-RQA TABLE
                    ===================================================== */}

          <div className="mt-3">
            <table className="w-full table-fixed border-collapse border border-black text-center">
              <thead>
                {/* =================================================
                                    FIRST HEADER ROW
                                ================================================= */}

                <tr className="font-bold">
                  <th
                    rowSpan="2"
                    className="w-[11%] border border-black px-1 py-2"
                  >
                    Name of Applicant
                  </th>

                  <th
                    rowSpan="2"
                    className="w-[9%] border border-black px-1 py-2"
                  >
                    Application Code
                  </th>

                  <th colSpan="8" className="border border-black px-1 py-1">
                    COMPARATIVE ASSESSMENT RESULTS
                  </th>

                  <th
                    rowSpan="2"
                    className="w-[6%] border border-black px-1 py-2"
                  >
                    Remarks
                  </th>

                  <th
                    colSpan="2"
                    className="w-[9%] border border-black px-1 py-1"
                  >
                    For Background
                    <br />
                    Investigation
                    <br />
                    (Y/N)
                  </th>

                  <th
                    rowSpan="2"
                    className="w-[9%] border border-black px-1 py-1"
                  >
                    For Appointment
                    <div className="mt-1 text-[6px] font-normal italic">
                      (To filled-out by the
                      <br />
                      Appointing
                      <br />
                      Officer/Authority;
                      <br />
                      Please write the position
                      <br />
                      name of the applicant)
                    </div>
                  </th>

                  <th
                    rowSpan="2"
                    className="w-[8%] border border-black px-1 py-1"
                  >
                    Status of
                    <br />
                    Appointment
                    <div className="mt-1 text-[6px] font-normal italic">
                      (Based on availability of
                      <br />
                      PBET/LET/LEPT)
                    </div>
                  </th>
                </tr>

                {/* =================================================
                                    SECOND HEADER ROW
                                ================================================= */}

                <tr className="font-bold">
                  <th className="border border-black px-1 py-2 text-[7px]">
                    Education
                    <br />
                    (10 pts)
                  </th>

                  <th className="border border-black px-1 py-2 text-[7px]">
                    Training
                    <br />
                    (10 pts)
                  </th>

                  <th className="border border-black px-1 py-2 text-[7px]">
                    Experience
                    <br />
                    (10 pts)
                  </th>

                  <th className="border border-black px-1 py-1 text-[7px]">
                    PBET/LET/
                    <br />
                    LEPT Rating
                    <br />
                    (10 pts)
                  </th>

                  <th className="border border-black px-1 py-1 text-[7px]">
                    PPST COIs
                    <br />
                    (Classroom
                    <br />
                    Observation)
                    <br />
                    (35 pts)
                  </th>

                  <th className="border border-black px-1 py-1 text-[7px]">
                    PPST NCOIs
                    <br />
                    (Teacher
                    <br />
                    Reflection)
                    <br />
                    (25 pts)
                  </th>

                  <th className="border border-black px-1 py-2 text-[7px]">
                    Total
                    <br />
                    (100 pts)
                  </th>

                  {/* Extra spacer/header cell to align colspan */}
                  <th className="border border-black px-1 py-2"></th>

                  <th className="border border-black px-1 py-2">Yes</th>

                  <th className="border border-black px-1 py-2">No</th>
                </tr>
              </thead>

              {/* =====================================================
                                APPLICANTS
                            ===================================================== */}

              <tbody>
                {ranking.slice(0, 5).map((applicant, index) => {
                  return (
                    <tr
                      key={
                        applicant.applicant_id ||
                        applicant.job_applications_id ||
                        index
                      }
                      className="h-[24px]"
                    >
                      {/* NAME */}
                      <td className="border border-black px-1 text-left">
                        <span className="mr-1">{index + 1}</span>

                        {getApplicantName(applicant)}
                      </td>

                      {/* APPLICATION CODE */}
                      <td className="border border-black px-1">
                        {getApplicationCode(applicant)}
                      </td>

                      {/* EDUCATION */}
                      <td className="border border-black px-1">
                        {formatScore(getEducation(applicant))}
                      </td>

                      {/* TRAINING */}
                      <td className="border border-black px-1">
                        {formatScore(getTraining(applicant))}
                      </td>

                      {/* EXPERIENCE */}
                      <td className="border border-black px-1">
                        {formatScore(getExperience(applicant))}
                      </td>

                      {/* LET */}
                      <td className="border border-black px-1">
                        {formatScore(getLET(applicant))}
                      </td>

                      {/* COI */}
                      <td className="border border-black px-1">
                        {formatScore(getCOI(applicant))}
                      </td>

                      {/* NCOI */}
                      <td className="border border-black px-1">
                        {formatScore(getNCOI(applicant))}
                      </td>

                      {/* TOTAL */}
                      <td className="border border-black px-1 font-bold">
                        {formatScore(getTotal(applicant))}
                      </td>

                      {/* REMARKS */}
                      <td className="border border-black px-1">
                        {applicant.remarks || ""}
                      </td>

                      {/* BACKGROUND YES */}
                      <td className="border border-black px-1">
                        {applicant.background_investigation === true ||
                        applicant.background_investigation === "Yes"
                          ? "✓"
                          : ""}
                      </td>

                      {/* BACKGROUND NO */}
                      <td className="border border-black px-1">
                        {applicant.background_investigation === false ||
                        applicant.background_investigation === "No"
                          ? "✓"
                          : ""}
                      </td>

                      {/* APPOINTMENT */}
                      <td className="border border-black px-1">
                        {applicant.appointment || ""}
                      </td>

                      {/* STATUS */}
                      <td className="border border-black px-1">
                        {applicant.appointment_status ||
                          applicant.status_of_appointment ||
                          ""}
                      </td>
                    </tr>
                  );
                })}

                {/* =================================================
                                    EMPTY ROWS
                                ================================================= */}

                {Array.from({
                  length: Math.max(0, 5 - ranking.length),
                }).map((_, index) => (
                  <tr key={`empty-${index}`} className="h-[24px]">
                    <td className="border border-black px-1">
                      {ranking.length + index + 1}
                    </td>

                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* =====================================================
                        SIGNATURE SECTION
                    ===================================================== */}

          <div className="mt-5">
            {/* =================================================
                            HMRPSB
                        ================================================= */}

            <div className="w-full">
              <div className="font-bold">Prepared by the HMRPSB</div>

              <div className="italic">(All members should affix signature)</div>

              <div className="mt-9 grid grid-cols-5 gap-5 text-center">
                {hrmpsbMembers.slice(0, 5).map((member, index) => {
                  const fullName =
                    member.full_name ||
                    [member.first_name, member.middle_name, member.last_name]
                      .filter(Boolean)
                      .join(" ") ||
                    member.name ||
                    "";

                  const assignedPosition =
                    member.assignment ||
                    member.member_position ||
                    member.signature_position ||
                    member.position ||
                    "HRMPSB Member";

                  return (
                    <div
                      key={member.id || member.user_id || member.email || index}
                    >
                      <div className="mx-auto mb-1 min-h-[18px] border-b border-black"></div>
                      <div className="text-[8px] font-bold leading-tight">
                        {fullName}
                      </div>
                      <div className="mt-0.5 text-[8px] leading-tight">
                        {assignedPosition}
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default CARRQAPrintForm;
