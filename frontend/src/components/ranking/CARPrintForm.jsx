import React from "react";

export default function CARPrintForm({
  vacancy,
  ranking = [],
}) {
  const formatScore = (value) => {
    const number = Number(value || 0);

    return Number.isInteger(number)
      ? number
      : number.toFixed(2);
  };

  return (
    <div className="hidden print:block bg-white text-black">
      <div className="w-full px-6 py-4 font-serif text-[9px]">

        {/* =========================================================
            OUTER BORDER
        ========================================================= */}
        <div className="border border-black px-3 py-2">

          {/* =======================================================
              TITLE
          ======================================================= */}
          <div className="relative">

            <div className="absolute right-0 top-0 text-[8px] italic">
              Annex I
            </div>

            <div className="text-center">
              <h1 className="text-[14px] font-bold">
                COMPARATIVE ASSESSMENT RESULT (CAR)
              </h1>
            </div>

            {/* =====================================================
                VACANCY INFORMATION
            ===================================================== */}
            <div className="mt-2 flex justify-between gap-8">

              <div className="w-1/2">
                <div className="flex">
                  <span className="font-bold">Position:</span>

                  <span className="ml-2 min-w-[250px] border-b border-black">
                    {vacancy?.position_title || ""}
                  </span>
                </div>

                <div className="mt-1 flex">
                  <span className="font-bold">
                    Office/Bureau/Service/Unit where the vacancy exists:
                  </span>

                  <span className="ml-2 flex-1 border-b border-black">
                    {vacancy?.office ||
                      vacancy?.office_name ||
                      vacancy?.unit ||
                      ""}
                  </span>
                </div>
              </div>

              <div className="w-[35%]">
                <div className="flex">
                  <span className="font-bold whitespace-nowrap">
                    Plantilla Item Number:
                  </span>

                  <span className="ml-2 flex-1 border-b border-black">
                    {vacancy?.plantilla_item_number ||
                      vacancy?.item_number ||
                      ""}
                  </span>
                </div>

                <div className="mt-1 flex">
                  <span className="font-bold whitespace-nowrap">
                    Date of Final Deliberation:
                  </span>

                  <span className="ml-2 flex-1 border-b border-black">
                    {vacancy?.final_deliberation_date || ""}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* =======================================================
              MAIN TABLE
          ======================================================= */}
          <div className="mt-3 overflow-hidden">

            <table className="w-full table-fixed border-collapse border border-black text-center">

              <thead>

                {/* Main header */}
                <tr className="font-bold">

                  <th
                    rowSpan="2"
                    className="w-[10%] border border-black px-1 py-2"
                  >
                    Name of Applicant
                  </th>

                  <th
                    rowSpan="2"
                    className="w-[8%] border border-black px-1 py-2"
                  >
                    Application Code
                  </th>

                  <th
                    colSpan="9"
                    className="border border-black px-1 py-1"
                  >
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
                    className="border border-black px-1 py-1"
                  >
                    For Background
                    <br />
                    Investigation
                    <br />
                    (Y/N)
                  </th>

                  <th
                    rowSpan="2"
                    className="w-[8%] border border-black px-1 py-1"
                  >
                    For
                    <br />
                    Appointment
                    <div className="mt-1 text-[7px] font-normal italic">
                      (F, S, or C?)
                    </div>
                    <div className="mt-1 text-[6px] font-normal">
                      (Please write the position
                      <br />
                      title of the applicant)
                    </div>
                  </th>

                  <th
                    rowSpan="2"
                    className="w-[8%] border border-black px-1 py-1"
                  >
                    For probation
                    <div className="mt-1 text-[6px] font-normal italic">
                      Please identify period of
                      <br />
                      probation, 6 months or 1
                      <br />
                      year in accordance with
                      <br />
                      Section 9 of the
                      <br />
                      DO 9, s. 2022
                    </div>
                  </th>

                </tr>

                {/* Assessment headers */}
                <tr className="font-bold">

                  <th className="border border-black px-1 py-2">
                    Education
                  </th>

                  <th className="border border-black px-1 py-2">
                    Training
                  </th>

                  <th className="border border-black px-1 py-2">
                    Experience
                  </th>

                  <th className="border border-black px-1 py-2">
                    Performance
                  </th>

                  <th className="border border-black px-1 py-1">
                    Outstanding
                    <br />
                    Accomplishments
                  </th>

                  <th className="border border-black px-1 py-1">
                    Application
                    <br />
                    of Education
                  </th>

                  <th className="border border-black px-1 py-1">
                    Application
                    <br />
                    of L&D
                  </th>

                  <th className="border border-black px-1 py-2">
                    Potential
                  </th>

                  <th className="border border-black px-1 py-2">
                    Total
                  </th>

                  <th className="border border-black px-1 py-2">
                    Yes
                  </th>

                  <th className="border border-black px-1 py-2">
                    No
                  </th>

                </tr>

              </thead>

              <tbody>

                {ranking.slice(0, 5).map((applicant, index) => {

                  const education =
                    Number(
                      applicant.education_score ??
                      applicant.education ??
                      0
                    );

                  const training =
                    Number(
                      applicant.training_score ??
                      applicant.training ??
                      0
                    );

                  const experience =
                    Number(
                      applicant.experience_score ??
                      applicant.experience ??
                      0
                    );

                  const performance =
                    Number(
                      applicant.performance_score ??
                      applicant.performance ??
                      0
                    );

                  const accomplishments =
                    Number(
                      applicant.outstanding_accomplishments_score ??
                      applicant.outstanding_accomplishments ??
                      0
                    );

                  const applicationEducation =
                    Number(
                      applicant.application_of_education_score ??
                      applicant.application_of_education ??
                      0
                    );

                  const applicationLD =
                    Number(
                      applicant.application_of_learning_development_score ??
                      applicant.application_of_learning_and_development ??
                      applicant.application_of_ld ??
                      0
                    );

                  const potential =
                    Number(
                      applicant.potential_score ??
                      applicant.potential ??
                      0
                    );

                  const total =
                    Number(
                      applicant.overall_score ??
                      applicant.total_score ??
                      applicant.total ??
                      education +
                        training +
                        experience +
                        performance +
                        accomplishments +
                        applicationEducation +
                        applicationLD +
                        potential
                    );

                  return (
                    <tr
                      key={
                        applicant.applicant_id ||
                        applicant.job_applications_id ||
                        index
                      }
                      className="h-[24px]"
                    >

                      {/* Applicant */}
                      <td className="border border-black px-1 text-left">
                        <span className="mr-1">
                          {index + 1}
                        </span>

                        {applicant.applicant_name ||
                          applicant.full_name ||
                          applicant.name ||
                          ""}
                      </td>

                      {/* Application Code */}
                      <td className="border border-black px-1">
                        {applicant.application_code ||
                          applicant.application_id ||
                          applicant.job_applications_id ||
                          ""}
                      </td>

                      {/* Education */}
                      <td className="border border-black px-1">
                        {formatScore(education)}
                      </td>

                      {/* Training */}
                      <td className="border border-black px-1">
                        {formatScore(training)}
                      </td>

                      {/* Experience */}
                      <td className="border border-black px-1">
                        {formatScore(experience)}
                      </td>

                      {/* Performance */}
                      <td className="border border-black px-1">
                        {formatScore(performance)}
                      </td>

                      {/* Outstanding */}
                      <td className="border border-black px-1">
                        {formatScore(accomplishments)}
                      </td>

                      {/* Application Education */}
                      <td className="border border-black px-1">
                        {formatScore(applicationEducation)}
                      </td>

                      {/* Application L&D */}
                      <td className="border border-black px-1">
                        {formatScore(applicationLD)}
                      </td>

                      {/* Potential */}
                      <td className="border border-black px-1">
                        {formatScore(potential)}
                      </td>

                      {/* Total */}
                      <td className="border border-black px-1 font-bold">
                        {formatScore(total)}
                      </td>

                      {/* Remarks */}
                      <td className="border border-black px-1">
                        {applicant.remarks || ""}
                      </td>

                      {/* Background Investigation YES */}
                      <td className="border border-black px-1">
                        {applicant.background_investigation === true ||
                        applicant.background_investigation === "Yes"
                          ? "✓"
                          : ""}
                      </td>

                      {/* Background Investigation NO */}
                      <td className="border border-black px-1">
                        {applicant.background_investigation === false ||
                        applicant.background_investigation === "No"
                          ? "✓"
                          : ""}
                      </td>

                      {/* Appointment */}
                      <td className="border border-black px-1">
                        {applicant.appointment || ""}
                      </td>

                      {/* Probation */}
                      <td className="border border-black px-1">
                        {applicant.probation || ""}
                      </td>

                    </tr>
                  );
                })}

                {/* Empty rows */}
                {Array.from({
                  length: Math.max(0, 5 - ranking.length),
                }).map((_, index) => (
                  <tr
                    key={`empty-${index}`}
                    className="h-[24px]"
                  >
                    <td className="border border-black">
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
                    <td className="border border-black"></td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          {/* =======================================================
              SIGNATURE SECTION
          ======================================================= */}
          <div className="mt-5 flex justify-between gap-8">

            {/* HMRPSB */}
            <div className="w-[65%]">

              <div className="font-bold">
                Prepared by the HMRPSB
              </div>

              <div className="italic">
                (All members should affix signature)
              </div>

              <div className="mt-8 grid grid-cols-5 gap-4 text-center">

                {[
                  "Name and Position\nHMRPSB Member",
                  "Name and Position\nHMRPSB Member",
                  "Name and Position\nHMRPSB Chairperson",
                  "Name and Position\nHMRPSB Member",
                  "Name and Position\nHMRPSB Member",
                ].map((label, index) => (
                  <div key={index}>
                    <div className="mx-auto mb-1 w-full border-b border-black"></div>

                    <div className="whitespace-pre-line text-[8px] leading-tight">
                      {label}
                    </div>
                  </div>
                ))}

              </div>

            </div>

            {/* Appointing Authority */}
            <div className="w-[25%]">

              <div className="text-center font-bold">
                Appointment conferred by:
              </div>

              <div className="mt-12 text-center">

                <div className="border-b border-black"></div>

                <div className="mt-1 text-[8px] leading-tight">
                  Name and Position
                  <br />
                  Appointing Authority
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}