import React from "react";

const RELATED_TEACHING_PERFORMANCE_MAX = 20;

export default function ApplicantRow({
  item,
  applicantDetails,
  criteria,
  scores,
  submittedRank,
  onScoreChange,
  onAssess,
  isSubmitting,
  isSubmitted,
  submissionStatusReady,
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

  const getApplicantType = (...applicants) => {
    const parseInternalFlag = (value) => {
      if (typeof value === "boolean") {
        return value;
      }

      if (typeof value === "string") {
        const normalizedValue = value.trim().toLowerCase();

        if (normalizedValue === "true") return true;
        if (normalizedValue === "false") return false;
      }

      return null;
    };

    for (const applicant of applicants) {
      const explicitType =
        applicant?.applicant_type || applicant?.applicantType;

      if (typeof explicitType === "string") {
        const normalizedType = explicitType.trim().toLowerCase();
        if (normalizedType === "internal") return "Internal";
        if (normalizedType === "external") return "External";
      }

      const directFlag = parseInternalFlag(
        applicant?.is_internal ?? applicant?.isInternal
      );

      if (directFlag !== null) {
        return directFlag ? "Internal" : "External";
      }

      const workExperiences =
        applicant?.work_experience_list ||
        applicant?.workExperienceList ||
        applicant?.work_experiences ||
        [];
      const workFlags = Array.isArray(workExperiences)
        ? workExperiences.map((work) =>
            parseInternalFlag(work?.is_internal ?? work?.isInternal)
          )
        : [];

      if (workFlags.length > 0 && workFlags.every((flag) => flag !== null)) {
        return workFlags.some(Boolean) ? "Internal" : "External";
      }
    }

    return "Not specified";
  };

  const applicantType = getApplicantType(details, item);

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
    item?.category ||
      item?.position_category ||
      item?.vacancy_category ||
      item?.vacancy?.category ||
      details?.category ||
      details?.position_category ||
      details?.vacancy_category ||
      details?.vacancy?.category
  );


  // ============================================================
  // GET EXPLICIT ASSESSMENT TYPE
  // ============================================================

  const explicitAssessmentType = normalize(
    item?.assessment_type ||
      item?.assessmentType ||
      item?.vacancy?.assessment_type ||
      details?.assessment_type ||
      details?.assessmentType ||
      details?.vacancy?.assessment_type
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

  const performanceCategory = normalize(
    details?.category ||
      details?.position_category ||
      details?.vacancy_category ||
      item?.category ||
      item?.position_category ||
      item?.vacancy_category
  )
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
  const eligiblePerformanceCategories = new Set([
    "NON TEACHING",
    "NON TEACHING POSITION",
    "NON TEACHING POSITIONS",
    "SCHOOL ADMINISTRATION",
    "SCHOOL ADMINISTRATION POSITION",
    "SCHOOL ADMINISTRATION POSITIONS",
    "RELATED TEACHING",
    "RELATED TEACHING POSITION",
    "RELATED TEACHING POSITIONS",
  ]);
  const performanceOptionId = Number(
    details?.performance_assessment_option_id
  );
  const performancePoints = Number(
    details?.performance_points
  );
  const hasInitialPerformance =
    eligiblePerformanceCategories.has(performanceCategory) &&
    Number.isInteger(performanceOptionId) &&
    performanceOptionId > 0 &&
    details?.performance_points !== null &&
    details?.performance_points !== undefined &&
    Number.isFinite(performancePoints);


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

  const getCriterionScore = (criterion, score) => {
    const selected = Number(score || 0);

    if (normalize(criterion.name) !== "PERFORMANCE") {
      return selected;
    }

    if (
      ["RELATED_TEACHING", "SCHOOL_ADMINISTRATION", "NON_TEACHING"].includes(
        assessmentType
      ) &&
      selected > 5
    ) {
      return selected;
    }

    return assessmentType === "RELATED_TEACHING"
      ? (selected / 5) * RELATED_TEACHING_PERFORMANCE_MAX
      : (selected / 5) * Number(criterion.max || 0);
  };


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

      }      )
      .reduce(
        (
          sum,
          criterion
        ) => {
          if (
            normalize(criterion.name) === "PERFORMANCE" &&
            hasInitialPerformance
          ) {
            return sum + performancePoints;
          }

          return sum + getCriterionScore(
            criterion,
            scores?.[criterion.id]
          );
        },
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
            ) => {
              if (
                normalize(criterion.name) === "PERFORMANCE" &&
                hasInitialPerformance
              ) {
                return sum + performancePoints;
              }

              return sum + Number(
                scores?.[criterion.id] || 0
              );
            },
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

        <div className="mt-1 text-xs text-gray-400">
          {positionTitle || "No Position"}
        </div>

        <div className="mt-2">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              applicantType === "Internal"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : applicantType === "External"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
          >
            {applicantType}
          </span>
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



              </td>
            );
          }

          if (
            criterionName === "PERFORMANCE" &&
            hasInitialPerformance
          ) {
            return (
              <td
                key={criterion.id}
                className="min-w-[180px] bg-blue-50/40 px-4 py-4 text-center"
              >
                <div className="font-semibold text-gray-900">
                  {performancePoints}
                </div>
                <div className="mt-1 text-[10px] font-medium text-blue-500">
                  From Initial Evaluation
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
            const manualScore =
              scores?.[criterion.id];
            const manualScoreNumber =
              manualScore === "" ||
              manualScore === undefined ||
              manualScore === null
                ? null
                : Number(manualScore);
            const manualScoreOutOfRange =
              manualScoreNumber !== null &&
              (
                !Number.isFinite(manualScoreNumber) ||
                manualScoreNumber < 0 ||
                manualScoreNumber > Number(criterion.max)
              );

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
                    manualScore ?? ""
                  }
                  aria-invalid={manualScoreOutOfRange}
                  onChange={(e) =>
                    onScoreChange(
                      applicantId,
                      criterion.id,
                      e.target.value
                    )
                  }
                  placeholder={`0 - ${criterion.max}`}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 ${
                    manualScoreOutOfRange
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                />



                {manualScoreOutOfRange && (
                  <div className="mt-1 text-xs text-red-600">
                    Enter a score from 0 to {criterion.max}. This value cannot be submitted.
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
          type="button"
          onClick={() => onAssess(item)}
          disabled={
            isSubmitting ||
            isSubmitted ||
            !submissionStatusReady
          }
          className="mt-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Submitting..."
            : isSubmitted
            ? "Score Submitted"
            : submissionStatusReady
            ? "Submit Score"
            : "Checking Status..."}
        </button>
      </td>

    </tr>
  );
}