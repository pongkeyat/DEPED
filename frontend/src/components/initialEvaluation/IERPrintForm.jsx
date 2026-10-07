const safe = (value, fallback = "N/A") => {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return fallback;
  }

  return value;
};

const getValue = (source, ...keys) => {
  for (const key of keys) {
    const value = source?.[key];

    if (
      value !== null &&
      value !== undefined &&
      !(typeof value === "string" && value.trim() === "")
    ) {
      return value;
    }
  }

  return null;
};

const getFullName = (applicant) => {
  const lastName =
    getValue(
      applicant,
      "last_name",
      "surname",
      "family_name",
      "lastName"
    ) || "";

  const firstName =
    getValue(
      applicant,
      "first_name",
      "given_name",
      "firstName"
    ) || "";

  const middleName =
    getValue(
      applicant,
      "middle_name",
      "middle_name_initial",
      "middle_initial",
      "middleName"
    ) || "";

  const fullName =
    getValue(applicant, "full_name", "name") || "";

  if (fullName) {
    return fullName;
  }

  const parts = [
    lastName,
    `${firstName} ${middleName}`.trim(),
  ].filter(Boolean);

  if (parts.length === 0) {
    return "N/A";
  }

  return parts.join(", ").replace(
    /,\s*,/g,
    ","
  );
};

const getApplicationCode = (applicant) => {
  const code = getValue(
    applicant,
    "application_code",
    "applicationCode",
    "job_applications_id",
    "jobApplicationsId",
    "application_id",
    "applicationId",
    "applicant_id",
    "applicantId",
    "id"
  );

  return code !== null && code !== undefined
    ? String(code)
    : "N/A";
};

const getStatus = (applicant) => {
  const rawStatus =
    getValue(
      applicant,
      "application_status",
      "applicationStatus",
      "status"
    ) || "";

  const status = String(rawStatus)
    .trim()
    .toLowerCase();

  if (
    [
      "qualified",
      "passed",
      "eligible",
    ].includes(status)
  ) {
    return "Qualified";
  }

  if (
    [
      "unqualified",
      "disqualified",
      "rejected",
      "not_qualified",
      "not qualified",
      "failed",
    ].includes(status)
  ) {
    return "Disqualified";
  }

  return rawStatus || "N/A";
};

export default function IERPrintForm({
  vacancy,
  applicants = [],
}) {
  const position =
    getValue(
      vacancy,
      "position_title",
      "positionTitle",
      "title",
      "job_title",
      "jobTitle"
    ) || "N/A";

  const salaryGrade =
    getValue(
      vacancy,
      "salary_grade",
      "salaryGrade",
      "sg"
    ) || "N/A";

  const monthlySalary =
    getValue(
      vacancy,
      "monthly_salary",
      "monthlySalary",
      "salary"
    );

  const educationRequirement =
    getValue(
      vacancy,
      "education_requirement",
      "educationRequirement",
      "education",
      "education_qualification",
      "educationQualification"
    ) || "N/A";

  const trainingRequirement =
    getValue(
      vacancy,
      "training_requirement",
      "trainingRequirement",
      "training",
      "training_qualification",
      "trainingQualification"
    ) || "N/A";

  const experienceRequirement =
    getValue(
      vacancy,
      "experience_requirement",
      "experienceRequirement",
      "experience",
      "experience_qualification",
      "experienceQualification"
    ) || "N/A";

  const eligibilityRequirement =
    getValue(
      vacancy,
      "eligibility_requirement",
      "eligibilityRequirement",
      "eligibility",
      "eligibility_qualification",
      "eligibilityQualification"
    ) || "N/A";

  const numericMonthlySalary =
    monthlySalary !== null &&
    monthlySalary !== undefined &&
    monthlySalary !== ""
      ? Number(monthlySalary)
      : null;

  return (
    <div className="hidden print:block print:w-full print:bg-white print:text-black">

      {/* ======================================================
          ANNEX D HEADER
      ====================================================== */}

      <div className="relative mb-3 text-center">

        <div className="text-[13px] font-bold">
          INITIAL EVALUATION RESULT (IER)
        </div>

        <div className="absolute right-0 top-0 text-[10px] font-bold">
          Annex D
        </div>

      </div>

      {/* ======================================================
          POSITION INFORMATION
      ====================================================== */}

      <div className="mb-3 text-[8px] leading-tight">

        <div className="flex gap-2">
          <span className="w-[135px] font-semibold">
            Position:
          </span>

          <span className="flex-1 border-b border-black">
            {safe(position)}
          </span>
        </div>

        <div className="mt-1 flex gap-2">
          <span className="w-[135px] font-semibold">
            Salary Grade and Monthly Salary:
          </span>

          <span className="flex-1 border-b border-black">
            SG {safe(salaryGrade)}

            {numericMonthlySalary !== null &&
            !Number.isNaN(numericMonthlySalary)
              ? ` - ₱${numericMonthlySalary.toLocaleString()}`
              : ""}
          </span>
        </div>

        <div className="mt-2 font-semibold">
          Qualification Standards:
        </div>

        {/* EDUCATION */}
        <div className="ml-5 mt-1 flex gap-2">
          <span className="w-[65px]">
            Education
          </span>

          <span className="flex-1 border-b border-black">
            {safe(educationRequirement)}
          </span>
        </div>

        {/* TRAINING */}
        <div className="ml-5 flex gap-2">
          <span className="w-[65px]">
            Training
          </span>

          <span className="flex-1 border-b border-black">
            {safe(trainingRequirement)}
          </span>
        </div>

        {/* EXPERIENCE */}
        <div className="ml-5 flex gap-2">
          <span className="w-[65px]">
            Experience
          </span>

          <span className="flex-1 border-b border-black">
            {safe(experienceRequirement)}
          </span>
        </div>

        {/* ELIGIBILITY */}
        <div className="ml-5 flex gap-2">
          <span className="w-[65px]">
            Eligibility
          </span>

          <span className="flex-1 border-b border-black">
            {safe(eligibilityRequirement)}
          </span>
        </div>

      </div>

      {/* ======================================================
          IER TABLE
      ====================================================== */}

      <table className="w-full table-fixed border-collapse text-[5.5px] leading-tight">

        <thead>

          {/* FIRST HEADER ROW */}
          <tr>

            <th
              rowSpan="2"
              className="w-[2.5%] border border-black px-1 py-1"
            >
              No.
            </th>

            <th
              rowSpan="2"
              className="w-[5%] border border-black px-1 py-1"
            >
              Application
              <br />
              Code
            </th>

            <th
              rowSpan="2"
              className="w-[8%] border border-black px-1 py-1"
            >
              Names of
              <br />
              Applicant
            </th>

            <th
              rowSpan="2"
              className="w-[7%] border border-black px-1 py-1"
            >
              Address
            </th>

            <th
              rowSpan="2"
              className="w-[3%] border border-black px-1 py-1"
            >
              Age
            </th>

            <th
              rowSpan="2"
              className="w-[3%] border border-black px-1 py-1"
            >
              Sex
            </th>

            <th
              rowSpan="2"
              className="w-[4%] border border-black px-1 py-1"
            >
              Civil
              <br />
              Status
            </th>

            <th
              rowSpan="2"
              className="w-[5%] border border-black px-1 py-1"
            >
              Religion
            </th>

            <th
              rowSpan="2"
              className="w-[5%] border border-black px-1 py-1"
            >
              Disability
            </th>

            <th
              rowSpan="2"
              className="w-[5%] border border-black px-1 py-1"
            >
              Ethnic
              <br />
              Group
            </th>

            <th
              rowSpan="2"
              className="w-[7%] border border-black px-1 py-1"
            >
              Email
              <br />
              Address
            </th>

            <th
              rowSpan="2"
              className="w-[6%] border border-black px-1 py-1"
            >
              Contact
              <br />
              No.
            </th>

            <th
              rowSpan="2"
              className="w-[6%] border border-black px-1 py-1"
            >
              Education
            </th>

            <th
              colSpan="2"
              className="border border-black px-1 py-1"
            >
              Training
            </th>

            <th
              colSpan="2"
              className="border border-black px-1 py-1"
            >
              Experience
            </th>

            <th
              rowSpan="2"
              className="w-[6%] border border-black px-1 py-1"
            >
              Eligibility
            </th>

            <th
              rowSpan="2"
              className="w-[7%] border border-black px-1 py-1"
            >
              Remarks
              <br />
              (Qualified or
              <br />
              Disqualified)
            </th>

          </tr>

          {/* SECOND HEADER ROW */}
          <tr>

            <th className="w-[6%] border border-black px-1 py-1">
              Title
            </th>

            <th className="w-[3.5%] border border-black px-1 py-1">
              Hours
            </th>

            <th className="w-[6%] border border-black px-1 py-1">
              Details
            </th>

            <th className="w-[3.5%] border border-black px-1 py-1">
              Years
            </th>

          </tr>

        </thead>

        {/* ====================================================
            APPLICANTS
        ==================================================== */}

        <tbody>

          {applicants.length === 0 ? (

            <tr>
              <td
                colSpan="19"
                className="border border-black px-2 py-5 text-center"
              >
                No applicants found.
              </td>
            </tr>

          ) : (

            applicants.map(
              (applicant, index) => {

                const status =
                  getStatus(applicant);

                return (
                  <tr
                    key={
                      applicant.applicant_id ||
                      applicant.job_applications_id ||
                      index
                    }
                    className="break-inside-avoid"
                  >

                    {/* NO */}
                    <td className="border border-black px-1 py-2 text-center">
                      {index + 1}
                    </td>

                    {/* APPLICATION CODE */}
                    <td className="border border-black px-1 py-2 text-center">
                      {getApplicationCode(
                        applicant
                      )}
                    </td>

                    {/* NAME */}
                    <td className="border border-black px-1 py-2">
                      {getFullName(applicant)}
                    </td>

                    {/* ADDRESS */}
                    <td className="border border-black px-1 py-2">
                      {safe(
                        applicant.address ||
                          applicant.home_address
                      )}
                    </td>

                    {/* AGE */}
                    <td className="border border-black px-1 py-2 text-center">
                      {safe(applicant.age)}
                    </td>

                    {/* SEX */}
                    <td className="border border-black px-1 py-2 text-center">
                      {safe(applicant.sex)}
                    </td>

                    {/* CIVIL STATUS */}
                    <td className="border border-black px-1 py-2">
                      {safe(
                        applicant.civil_status
                      )}
                    </td>

                    {/* RELIGION */}
                    <td className="border border-black px-1 py-2">
                      {safe(
                        applicant.religion
                      )}
                    </td>

                    {/* DISABILITY */}
                    <td className="border border-black px-1 py-2">
                      {safe(
                        applicant.disability
                      )}
                    </td>

                    {/* ETHNIC GROUP */}
                    <td className="border border-black px-1 py-2">
                      {safe(
                        applicant.ethnic_group
                      )}
                    </td>

                    {/* EMAIL */}
                    <td className="border border-black px-1 py-2 break-all">
                      {safe(
                        applicant.email_address ||
                          applicant.email
                      )}
                    </td>

                    {/* CONTACT */}
                    <td className="border border-black px-1 py-2">
                      {safe(
                        applicant.contact_number ||
                          applicant.contact_no ||
                          applicant.phone
                      )}
                    </td>

                    {/* EDUCATION */}
                    <td className="border border-black px-1 py-2">
                      {safe(
                        applicant.education ||
                          applicant.education_level
                      )}
                    </td>

                    {/* TRAINING TITLE */}
                    <td className="border border-black px-1 py-2">
                      {safe(
                        applicant.training_title ||
                          applicant.training
                      )}
                    </td>

                    {/* TRAINING HOURS */}
                    <td className="border border-black px-1 py-2 text-center">
                      {safe(
                        applicant.training_hours
                      )}
                    </td>

                    {/* EXPERIENCE DETAILS */}
                    <td className="border border-black px-1 py-2">
                      {safe(
                        applicant.experience_details ||
                          applicant.experience
                      )}
                    </td>

                    {/* EXPERIENCE YEARS */}
                    <td className="border border-black px-1 py-2 text-center">
                      {safe(
                        applicant.experience_years ||
                          applicant.years_experience
                      )}
                    </td>

                    {/* ELIGIBILITY */}
                    <td className="border border-black px-1 py-2">
                      {safe(
                        applicant.eligibility
                      )}
                    </td>

                    {/* REMARKS */}
                    <td className="border border-black px-1 py-2 text-center font-semibold">
                      {status}
                    </td>

                  </tr>
                );
              }
            )
          )}

        </tbody>

      </table>

      {/* ======================================================
          CERTIFICATION
      ====================================================== */}

      <div className="mt-8 flex justify-end">

        <div className="w-[32%] text-center text-[8px]">

          <div className="mb-6">
            Prepared and certified correctly by:
          </div>

          <div className="border-b border-black">
            &nbsp;
          </div>

          <div className="mt-1 text-[7px]">
            (Name and signature)
          </div>

          <div className="mt-1 font-semibold">
            Human Resource Management Officer
          </div>

          <div className="mt-1">
            Date: __________________
          </div>

        </div>

      </div>

      {/* ======================================================
          NOTES
      ====================================================== */}

      <div className="mt-8 w-[75%] text-[6px] leading-tight">

        <div className="font-bold">
          Notes and Instructions for the HRMO:
        </div>

        <div>
          a) For the purpose of posting the IER,
          columns D to M shall be concealed in
          accordance with RA No. 10173 (Data
          Privacy Act). The only information that
          shall be made public are the applicant
          codes, qualifications of the applicants
          in terms of Education, Training,
          Experience, Eligibility, and Remarks.
        </div>

        <div className="mt-1">
          b) If the information does not apply to
          the applicant, please input N/A.
        </div>

      </div>

    </div>
  );
}