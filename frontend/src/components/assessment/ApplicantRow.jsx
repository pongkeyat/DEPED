import React from "react";

export default function ApplicantRow({
  item,
  applicantDetails,
  criteria,
  scores,
  submittedRank,
  onScoreChange,
  onAssess,
  isSubmitting,
}) {
  const applicantId =
    item?.applicant_id ||
    item?.job_applications_id ||
    "";

  const details =
    applicantDetails?.[applicantId] || item || {};


  // ============================================================
  // HELPERS
  // ============================================================

  const normalize = (value) =>
    String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ");


  // ============================================================
  // GET APPLICANT NAME
  // ============================================================

  const applicantName =
    `${details?.first_name || item?.first_name || ""} ${
      details?.middle_name || item?.middle_name || ""
    } ${details?.last_name || item?.last_name || ""} ${
      details?.suffix || item?.suffix || ""
    }`
      .replace(/\s+/g, " ")
      .trim() || "Unnamed Applicant";

  // Application code displayed in the second table column.
  const applicationCode =
    details?.application_code ||
    item?.application_code ||
    details?.applicationCode ||
    item?.applicationCode ||
    details?.application_id ||
    item?.application_id ||
    details?.job_applications_id ||
    item?.job_applications_id ||
    "—";


  // ============================================================
  // GET POSITION / CATEGORY
  // ============================================================

  const positionTitle = normalize(
    details?.position_title ||
      item?.position_title ||
      details?.position ||
      item?.position ||
      details?.vacancy?.position_title ||
      item?.vacancy?.position_title
  );


  const category = normalize(
    details?.category ||
      item?.category ||
      details?.position_category ||
      item?.position_category ||
      details?.vacancy_category ||
      item?.vacancy_category ||
      details?.vacancy?.category ||
      item?.vacancy?.category
  );


  // ============================================================
  // GET EXPLICIT ASSESSMENT TYPE
  // ============================================================

  const explicitAssessmentType = normalize(
    details?.assessment_type ||
      item?.assessment_type ||
      details?.assessmentType ||
      item?.assessmentType ||
      details?.vacancy?.assessment_type ||
      item?.vacancy?.assessment_type
  );


  // ============================================================
  // DETERMINE ASSESSMENT TYPE
  // ============================================================

  const assessmentType =
    explicitAssessmentType === "RELATED-TEACHING"
      ? "RELATED_TEACHING"
      : explicitAssessmentType ||
        (
          category === "RELATED TEACHING" ||
          category === "RELATED-TEACHING" ||
          category === "RELATED_TEACHING" ||
          category === "RELATED TEACHING POSITIONS"
        )
          ? "RELATED_TEACHING"
          : category === "TEACHING" ||
            category === "TEACHING POSITIONS"
          ? "TEACHING"
          : category === "SCHOOL ADMINISTRATION" ||
            category === "SCHOOL ADMINISTRATION POSITION" ||
            category === "SCHOOL ADMINISTRATION POSITIONS"
          ? "SCHOOL_ADMINISTRATION"
          : category === "NON-TEACHING" ||
            category === "NON TEACHING" ||
            category === "NON-TEACHING POSITIONS" ||
            category === "NON TEACHING POSITIONS"
          ? "NON_TEACHING"
          : "";


  // ============================================================
  // CATEGORY FLAGS
  // ============================================================

  const isRelatedTeaching =
    assessmentType === "RELATED_TEACHING" ||
    category === "RELATED TEACHING" ||
    category === "RELATED-TEACHING" ||
    category === "RELATED_TEACHING" ||
    category.includes("RELATED TEACHING") ||
    category.includes("RELATED-TEACHING");


  /*
   * IMPORTANT:
   *
   * Related Teaching must be checked before Teaching
   * because "RELATED TEACHING" contains "TEACHING".
   */

  const isSchoolAdministration =
    !isRelatedTeaching &&
    (
      assessmentType === "SCHOOL_ADMINISTRATION" ||
      category === "SCHOOL ADMINISTRATION" ||
      category === "SCHOOL ADMINISTRATION POSITION" ||
      category === "SCHOOL ADMINISTRATION POSITIONS" ||
      category.includes("SCHOOL ADMINISTRATION") ||
      category.includes("SCHOOL ADMIN")
    );


  const isTeaching =
    !isRelatedTeaching &&
    !isSchoolAdministration &&
    (
      assessmentType === "TEACHING" ||
      category === "TEACHING" ||
      category === "TEACHING POSITIONS" ||
      positionTitle === "TEACHER I" ||
      positionTitle === "TEACHER 1"
    );


  /*
   * These two categories use a 100-point integrated
   * assessment where Education, Training and Experience
   * are already included in the assessment.
   */

  const is100PointIntegratedAssessment =
    isRelatedTeaching ||
    isSchoolAdministration;


  // ============================================================
  // DISPLAY CATEGORY
  // ============================================================

  const applicantCategory =
    isRelatedTeaching
      ? "Related Teaching"
      : isSchoolAdministration
      ? "School Administration"
      : isTeaching
      ? "Teaching"
      : "Non-Teaching";


  // ============================================================
  // INITIAL SCREENING / ETE SCORE
  // ============================================================

  const getInitialScreeningScore = (
    criterionName
  ) => {
    const name =
      normalize(criterionName);


    if (
      name === "EDUCATION"
    ) {

      return Number(
        details?.education_points ??
          details?.education?.points ??
          details?.initial_screening?.education?.points ??
          0
      );

    }


    if (
      name === "TRAINING"
    ) {

      return Number(
        details?.training_points ??
          details?.training?.points ??
          details?.initial_screening?.training?.points ??
          0
      );

    }


    if (
      name === "EXPERIENCE"
    ) {

      return Number(
        details?.experience_points ??
          details?.experience?.points ??
          details?.initial_screening?.experience?.points ??
          0
      );

    }


    return 0;
  };


  // ============================================================
  // INITIAL SCREENING QUALIFICATION
  // ============================================================

  const getInitialScreeningQualification = (
    criterionName
  ) => {

    const name =
      normalize(criterionName);


    if (
      name === "EDUCATION"
    ) {

      return (
        details?.education_qualification ||
        details?.education?.qualification ||
        details?.initial_screening?.education?.qualification ||
        ""
      );

    }


    if (
      name === "TRAINING"
    ) {

      return (
        details?.training_qualification ||
        details?.training?.qualification ||
        details?.initial_screening?.training?.qualification ||
        ""
      );

    }


    if (
      name === "EXPERIENCE"
    ) {

      return (
        details?.experience_qualification ||
        details?.experience?.qualification ||
        details?.initial_screening?.experience?.qualification ||
        ""
      );

    }


    return "";
  };


  // ============================================================
  // ETE POINTS
  // ============================================================

  const educationPoints =
    getInitialScreeningScore(
      "Education"
    );


  const trainingPoints =
    getInitialScreeningScore(
      "Training"
    );


  const experiencePoints =
    getInitialScreeningScore(
      "Experience"
    );


  const initialScreeningTotal =
    educationPoints +
    trainingPoints +
    experiencePoints;


  // ============================================================
  // NON-ETE ASSESSMENT TOTAL
  // ============================================================
  //
  // For Related Teaching and School Administration:
  //
  // Education
  // Training
  // Experience
  //
  // are already supplied by Initial Screening.
  //
  // Therefore they must NOT be counted as editable
  // assessment scores.
  //
  // ============================================================

  const nonETEAssessmentTotal =
    criteria
      .filter((criterion) => {

        if (
          criterion.type !== "dropdown" &&
          criterion.type !== "text"
        ) {
          return false;
        }


        const name =
          normalize(
            criterion.name
          );


        if (
          is100PointIntegratedAssessment &&
          (
            name === "EDUCATION" ||
            name === "TRAINING" ||
            name === "EXPERIENCE"
          )
        ) {

          return false;
        }


        return true;

      })
      .reduce(
        (
          sum,
          criterion
        ) =>
          sum +
          Number(
            scores?.[criterion.id] || 0
          ),
        0
      );


  // ============================================================
  // ASSESSMENT TOTAL
  // ============================================================

  const assessmentTotal =
    is100PointIntegratedAssessment

      ? initialScreeningTotal +
        nonETEAssessmentTotal

      : criteria
          .filter(
            (criterion) =>
              criterion.type === "dropdown" ||
              criterion.type === "text"
          )
          .reduce(
            (
              sum,
              criterion
            ) =>
              sum +
              Number(
                scores?.[criterion.id] || 0
              ),
            0
          );


  // ============================================================
  // MAXIMUM SCORES
  // ============================================================

  const dynamicAssessmentMax =
    criteria
      .filter(
        (criterion) =>
          criterion.type === "dropdown" ||
          criterion.type === "text"
      )
      .reduce(
        (
          sum,
          criterion
        ) =>
          sum +
          Number(
            criterion.max || 0
          ),
        0
      );


  /*
   * Related Teaching and School Administration
   * are both 100-point integrated assessments.
   */

  const assessmentMax =
    is100PointIntegratedAssessment

      ? 100

      : dynamicAssessmentMax || 70;


  // ============================================================
  // COMBINED / GRAND TOTAL
  // ============================================================

  /*
   * Related Teaching:
   * School Administration:
   *
   * The 100-point assessment already contains
   * Education + Training + Experience.
   *
   * Therefore:
   *
   * combinedTotal = assessmentTotal
   *
   * Do NOT add initialScreeningTotal again.
   */

  const combinedTotal =
    is100PointIntegratedAssessment

      ? assessmentTotal

      : initialScreeningTotal +
        assessmentTotal;


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50">

      {/* ======================================================
          NAME + CATEGORY
      ====================================================== */}

      <td className="sticky left-0 z-10 min-w-[240px] bg-white px-4 py-4 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">

        <div className="font-medium text-gray-900">
          {applicantName}
        </div>


        <div className="mt-1 text-xs font-medium text-blue-600">
          {applicantCategory}
        </div>


        <div className="text-xs text-gray-400">
          {positionTitle || "No Position"}
        </div>

      </td>

      {/* ======================================================
          DYNAMIC CRITERIA
      ====================================================== */}

      {criteria.map(
        (criterion) => {

          const criterionName =
            normalize(
              criterion.name
            );


          // ====================================================
          // INITIAL SCREENING / ETE
          // ====================================================

          if (
            criterion.type ===
            "initial"
          ) {

            const pts =
              getInitialScreeningScore(
                criterion.name
              );


            const qual =
              getInitialScreeningQualification(
                criterion.name
              );


            return (
              <td
                key={criterion.id}
                className={`
                  min-w-[160px]
                  px-4
                  py-4
                  text-center
                  text-sm
                  ${
                    is100PointIntegratedAssessment
                      ? "bg-blue-50/40 text-gray-700"
                      : "text-gray-600"
                  }
                `}
              >

                <span className="font-semibold text-gray-900">
                  {pts}
                </span>


                {qual && (
                  <span className="block text-xs text-gray-400">
                    {qual}
                  </span>
                )}


                {is100PointIntegratedAssessment && (
                  <span className="mt-1 block text-[10px] font-medium text-blue-500">
                    Included in 100-point assessment
                  </span>
                )}

              </td>
            );
          }


          // ====================================================
          // ETE FROM ASSESSMENT CRITERIA
          // ====================================================
          //
          // For Related Teaching and School Administration,
          // Education / Training / Experience are read-only.
          //
          // Their values come from Initial Screening.
          //
          // ====================================================

          if (
            is100PointIntegratedAssessment &&
            (
              criterionName === "EDUCATION" ||
              criterionName === "TRAINING" ||
              criterionName === "EXPERIENCE"
            )
          ) {

            const pts =
              getInitialScreeningScore(
                criterion.name
              );


            return (
              <td
                key={criterion.id}
                className="min-w-[180px] bg-blue-50/40 px-4 py-4 text-center"
              >

                <div className="font-semibold text-gray-900">
                  {pts}
                </div>


                <div className="mt-1 text-[10px] font-medium text-blue-500">
                  From Initial Screening
                </div>


                <div className="mt-1 text-xs text-gray-400">
                  Max: {criterion.max}
                </div>

              </td>
            );
          }


          // ====================================================
          // MANUAL / TEXT SCORE
          // ====================================================

          if (
            criterion.type ===
            "text"
          ) {

            return (
              <td
                key={criterion.id}
                className="min-w-[180px] px-4 py-4"
              >

                <input
                  type="number"
                  min="0"
                  max={criterion.max}
                  step="0.01"
                  value={
                    scores?.[criterion.id] ??
                    ""
                  }
                  onChange={(e) =>
                    onScoreChange(
                      applicantId,
                      criterion.id,
                      e.target.value
                    )
                  }
                  placeholder={`0 - ${criterion.max}`}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />


                {criterion.max !== undefined && (
                  <div className="mt-1 text-xs text-gray-400">
                    Maximum: {criterion.max}
                  </div>
                )}

              </td>
            );
          }


          // ====================================================
          // DROPDOWN SCORE
          // ====================================================

          return (
            <td
              key={criterion.id}
              className="min-w-[180px] px-4 py-4"
            >

              <select
                value={
                  scores?.[criterion.id] ??
                  ""
                }
                onChange={(e) =>
                  onScoreChange(
                    applicantId,
                    criterion.id,
                    e.target.value
                  )
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >

                <option value="">
                  Select Score
                </option>


                {criterion.options?.map(
                  (opt) => (
                    <option
                      key={
                        opt.optionId ||
                        opt.value
                      }
                      value={opt.value}
                    >
                      {opt.label}
                    </option>
                  )
                )}

              </select>


              {criterion.max !== undefined && (
                <div className="mt-1 text-xs text-gray-400">
                  Maximum: {criterion.max}
                </div>
              )}

            </td>
          );

        }
      )}


      {/* TOTAL */}
      <td className="min-w-[120px] border border-gray-300 px-3 py-3 text-center align-middle">
        <div className="font-bold text-gray-900">
          {combinedTotal}
        </div>
        <div className="text-xs font-normal text-gray-500">/ 100</div>

        <button
          onClick={() => onAssess(item)}
          disabled={isSubmitting}
          className="mt-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Score"}
        </button>
      </td>

    </tr>
  );
}