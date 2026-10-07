import transporters from "../config/emailTransporters.js";

const transporter = transporters.assessmentTransporter;

const escapeHtml = (value) => {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

export const sendIndividualEvaluationSheetEmail = async ({
    email,
    firstName,
    lastName,
    positionTitle,
    applicationCode,
    salaryGrade,
    category,
    assessmentType,
    scores = [],
}) => {

    try {

        if (!email) {
            console.warn(
                "IES email skipped: applicant email is missing."
            );

            return;
        }

        const applicantName =
            `${firstName || ""} ${lastName || ""}`
                .trim() || "Applicant";


        const normalizedType =
            String(assessmentType || "")
                .trim()
                .toUpperCase();


        const isTeaching =
            normalizedType === "TEACHING";


        // ========================================================
        // HELPERS
        // ========================================================

        const normalize = (value) => {
            return String(value || "")
                .trim()
                .replace(/\s+/g, " ")
                .toUpperCase();
        };


        const formatScore = (value) => {

            const number =
                Number(value || 0);

            if (Number.isInteger(number)) {
                return String(number);
            }

            return number.toFixed(2);
        };


        const getScore = (criterionNames) => {

            const names =
                criterionNames.map(normalize);

            const row =
                scores.find((item) =>
                    names.includes(
                        normalize(
                            item.criterion_name
                        )
                    )
                );

            return row
                ? Number(row.score || 0)
                : 0;
        };


        const getOptionLabel = (criterionNames) => {

            const names =
                criterionNames.map(normalize);

            const row =
                scores.find((item) =>
                    names.includes(
                        normalize(
                            item.criterion_name
                        )
                    )
                );

            return (
                row?.option_label ||
                row?.remarks ||
                ""
            );
        };


        // ========================================================
        // BUILD TEACHING IES
        // ========================================================

        const teachingRows = [
            {
                criterion: "Education",
                weight: 10,
                score: getScore(["EDUCATION"]),
                details: getOptionLabel(["EDUCATION"]),
            },

            {
                criterion: "Training",
                weight: 10,
                score: getScore(["TRAINING"]),
                details: getOptionLabel(["TRAINING"]),
            },

            {
                criterion: "Experience",
                weight: 10,
                score: getScore(["EXPERIENCE"]),
                details: getOptionLabel(["EXPERIENCE"]),
            },

            {
                criterion: "PBET/LET/LEPT Rating",
                weight: 10,
                score: getScore([
                    "PBET/LET/LEPT RATING",
                    "LET",
                    "PBET",
                    "LEPT",
                ]),
                details: getOptionLabel([
                    "PBET/LET/LEPT RATING",
                    "LET",
                    "PBET",
                    "LEPT",
                ]),
            },

            {
                criterion:
                    "PPST Classroom Observable Indicators (Demonstrated Teaching using COT-RSP)",
                weight: 35,
                score: getScore([
                    "PPST CLASSROOM OBSERVABLE INDICATORS",
                    "PPST CLASSROOM OBSERVABLE INDICATORS (DEMONSTRATED TEACHING USING COT-RSP)",
                ]),
                details: getOptionLabel([
                    "PPST CLASSROOM OBSERVABLE INDICATORS",
                    "PPST CLASSROOM OBSERVABLE INDICATORS (DEMONSTRATED TEACHING USING COT-RSP)",
                ]),
            },

            {
                criterion:
                    "PPST Non-Classroom Observable Indicators (Teacher Reflection)",
                weight: 25,
                score: getScore([
                    "PPST NON-CLASSROOM OBSERVABLE INDICATORS",
                    "PPST NON-CLASSROOM OBSERVABLE INDICATORS (TEACHER REFLECTION)",
                ]),
                details: getOptionLabel([
                    "PPST NON-CLASSROOM OBSERVABLE INDICATORS",
                    "PPST NON-CLASSROOM OBSERVABLE INDICATORS (TEACHER REFLECTION)",
                ]),
            },
        ];


        // ========================================================
        // BUILD GENERAL IES
        // NON-TEACHING / RELATED TEACHING /
        // SCHOOL ADMINISTRATION
        // ========================================================

        const generalRows = scores.map((item) => ({
            criterion:
                item.criterion_name,

            weight:
                Number(item.max_points || 0),

            score:
                Number(item.score || 0),

            details:
                item.option_label ||
                item.remarks ||
                "",
        }));


        const rows =
            isTeaching
                ? teachingRows
                : generalRows;


        // ========================================================
        // TOTAL
        // ========================================================

        const totalScore =
            rows.reduce(
                (total, row) =>
                    total +
                    Number(row.score || 0),
                0
            );


        const totalWeight =
            rows.reduce(
                (total, row) =>
                    total +
                    Number(row.weight || 0),
                0
            );


        // ========================================================
        // TABLE ROWS
        // ========================================================

        const tableRows =
            rows.map((row) => {

                return `
                    <tr>

                        <td style="
                            border:1px solid #999;
                            padding:8px;
                            vertical-align:middle;
                            font-size:12px;
                            color:#333;
                        ">
                            ${escapeHtml(
                                row.criterion
                            )}
                        </td>

                        <td style="
                            border:1px solid #999;
                            padding:8px;
                            text-align:center;
                            vertical-align:middle;
                            font-size:12px;
                        ">
                            ${formatScore(
                                row.weight
                            )}
                        </td>

                        <td style="
                            border:1px solid #999;
                            padding:8px;
                            vertical-align:middle;
                            font-size:12px;
                        ">
                            ${
                                escapeHtml(
                                    row.details
                                ) || "&nbsp;"
                            }
                        </td>

                        <td style="
                            border:1px solid #999;
                            padding:8px;
                            text-align:center;
                            vertical-align:middle;
                            font-size:12px;
                        ">
                            ${formatScore(
                                row.score
                            )}
                            /
                            ${formatScore(
                                row.weight
                            )}
                        </td>

                        <td style="
                            border:1px solid #999;
                            padding:8px;
                            text-align:center;
                            vertical-align:middle;
                            font-size:12px;
                            font-weight:bold;
                        ">
                            ${formatScore(
                                row.score
                            )}
                        </td>

                    </tr>
                `;
            }).join("");


        // ========================================================
        // IES ANNEX
        // ========================================================

        const annex =
            isTeaching
                ? "Annex G-1"
                : "Annex G";


        // ========================================================
        // EMAIL
        // ========================================================

        const mailOptions = {

            from:
                `"DepEd La Union Schools Division Office" <${process.env.EMAIL}>`,

            to:
                email,

            subject:
                `Individual Evaluation Sheet (IES) - ${positionTitle || "Application"}`,

            html: `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
/>

<title>
    Individual Evaluation Sheet
</title>

</head>


<body style="
    margin:0;
    padding:0;
    background:#f4f4f4;
    font-family:Arial, Helvetica, sans-serif;
    color:#333;
">


<div style="
    width:100%;
    padding:25px 10px;
">


<div style="
    max-width:900px;
    margin:0 auto;
    background:#ffffff;
    border:1px solid #999;
    padding:25px;
">


<!-- =========================================================
     HEADER
========================================================= -->

<div style="
    text-align:right;
    font-size:12px;
    font-weight:bold;
    margin-bottom:15px;
">

    ${annex}

</div>


<div style="
    text-align:center;
    font-family:Georgia, serif;
    font-size:18px;
    font-weight:bold;
    margin-bottom:25px;
">

    INDIVIDUAL EVALUATION SHEET (IES)

</div>


<!-- =========================================================
     APPLICANT INFORMATION
========================================================= -->

<table
    width="100%"
    cellpadding="4"
    cellspacing="0"
    style="
        border-collapse:collapse;
        margin-bottom:20px;
        font-size:12px;
    "
>

<tr>

<td width="50%">
    <strong>Name of Applicant:</strong>
    ${escapeHtml(applicantName)}
</td>

<td width="50%">
    <strong>Application Code:</strong>
    ${escapeHtml(applicationCode)}
</td>

</tr>


<tr>

<td>
    <strong>Position Applied For:</strong>
    ${escapeHtml(positionTitle)}
</td>

<td>
    <strong>Category:</strong>
    ${escapeHtml(category)}
</td>

</tr>


<tr>

<td>
    <strong>
        ${
            isTeaching
                ? "Schools Division Office"
                : "Office"
        }:
    </strong>

    La Union Schools Division Office
</td>

<td>
    <strong>Job Group/SG-Level:</strong>
    ${escapeHtml(salaryGrade)}
</td>

</tr>

</table>


<!-- =========================================================
     IES TABLE
========================================================= -->

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="
        border-collapse:collapse;
        table-layout:fixed;
    "
>


<thead>

<tr style="
    background:#777;
    color:#fff;
    text-align:center;
    font-weight:bold;
    font-size:11px;
">

<th style="
    border:1px solid #555;
    padding:9px 5px;
    width:23%;
">
    Criteria
</th>

<th style="
    border:1px solid #555;
    padding:9px 5px;
    width:10%;
">
    Weight<br>
    Allocation
</th>

<th style="
    border:1px solid #555;
    padding:9px 5px;
    width:27%;
">
    Details of Applicant's<br>
    Qualifications
</th>

<th style="
    border:1px solid #555;
    padding:9px 5px;
    width:20%;
">
    Computation
</th>

<th style="
    border:1px solid #555;
    padding:9px 5px;
    width:10%;
">
    Actual<br>
    Score
</th>

</tr>

</thead>


<tbody>

${tableRows}


<!-- TOTAL -->

<tr style="
    background:#777;
    color:#fff;
    font-weight:bold;
">

<td
    colspan="1"
    style="
        border:1px solid #555;
        padding:9px;
        text-align:center;
    "
>
    TOTAL
</td>

<td style="
    border:1px solid #555;
    padding:9px;
    text-align:center;
">

    ${formatScore(
        isTeaching
            ? 100
            : totalWeight
    )}

</td>

<td style="
    border:1px solid #555;
    padding:9px;
">
</td>

<td style="
    border:1px solid #555;
    padding:9px;
">
</td>

<td style="
    border:1px solid #555;
    padding:9px;
    text-align:center;
">

    ${formatScore(totalScore)}

</td>

</tr>


</tbody>

</table>


<!-- =========================================================
     ATTESTATION
========================================================= -->

<div style="
    margin-top:25px;
    font-family:Georgia, serif;
    font-size:11px;
    line-height:1.6;
    text-align:justify;
">

<p>

I hereby attest to the conduct of the application and
assessment process in accordance with the applicable
guidelines; and acknowledge, upon discussion with the Human
Resource Merit Promotion and Selection Board (HRMPSB), the
results of the comparative assessment and the points given
to me based on my qualifications and submitted documentary
requirements for the position under the office where the
vacancy exists.

</p>


<p>

Furthermore, I hereby affix my signature in this Form to
attest to the objective and judicious conduct of the HRMPSB
evaluation through Open Ranking System.

</p>

</div>


<!-- =========================================================
     SIGNATURE
========================================================= -->

<table
    width="100%"
    cellpadding="5"
    cellspacing="0"
    style="
        margin-top:35px;
        font-family:Georgia, serif;
        font-size:11px;
    "
>

<tr>

<td width="50%">
    <strong>Attested:</strong>
</td>

<td width="50%" style="
    text-align:center;
">

    ______________________________

    <br>

    Name and Signature of Applicant

    <br>

    Date: ______________________

</td>

</tr>


<tr>

<td style="padding-top:25px;">

    ______________________________

    <br>

    HRMPSB Chair

</td>

<td></td>

</tr>

</table>


<!-- =========================================================
     FOOTER
========================================================= -->

<div style="
    margin-top:30px;
    padding-top:15px;
    border-top:1px solid #ddd;
    text-align:center;
    font-family:Arial, sans-serif;
    font-size:10px;
    color:#777;
">

    This is an automated Individual Evaluation Sheet
    notification from the DepEd Recruitment Management System.

</div>


</div>

</div>


</body>

</html>

            `,
        };


        const result =
            await transporter.sendMail(
                mailOptions
            );


        console.log(
            `IES email sent successfully to ${email}. Message ID: ${result.messageId}`
        );


        return result;


    } catch (error) {

        console.error(
            `Error sending IES email to ${email}:`,
            error
        );

        throw error;
    }
};