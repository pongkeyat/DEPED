import transporters from "../config/emailTransporters.js";

const transporter = transporters.initialEvaluation;


/* ============================================================
   HELPER FUNCTIONS
============================================================ */

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


const formatDate = (value) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};


const formatList = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
        return "None indicated.";
    }

    return items
        .filter(Boolean)
        .map((item) => `<div style="margin-bottom:4px;">• ${escapeHtml(item)}</div>`)
        .join("");
};


const formatRequirement = (value) => {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return "Not specified.";
    }

    return escapeHtml(value);
};


/* ============================================================
   APPLICATION RECEIVED EMAIL
============================================================ */

export const sendApplicationReceivedEmail = async (
    email,
    firstName,
    lastName,
    ticket = null
) => {

    try {

        const mailOptions = {

            from: process.env.EMAIL,

            to: email,

            subject: "Application Received – DepEd Recruitment",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 700px;
                    margin: auto;
                    color: #222;
                    line-height: 1.6;
                ">

                    <h2 style="margin-bottom: 20px;">
                        Application Received
                    </h2>

                    <p>
                        Dear ${escapeHtml(firstName)} ${escapeHtml(lastName)},
                    </p>

                    <p>
                        We are pleased to inform you that your application
                        has been successfully received.
                    </p>

                    ${
                        ticket
                            ? `
                                <p>
                                    Your application ticket is:
                                    <strong>${escapeHtml(ticket)}</strong>
                                </p>
                            `
                            : ""
                    }

                    <p>
                        Please keep this information for your reference.
                        You will be notified regarding the succeeding stages
                        of the recruitment process.
                    </p>

                    <p>
                        Thank you.
                    </p>

                    <p>
                        <strong>
                            Human Resource Management Office
                        </strong><br>
                        DepEd Schools Division Office
                    </p>

                </div>
            `,
        };


        const info =
            await transporter.sendMail(mailOptions);


        console.log(
            `✅ Application received email sent to ${email}`
        );


        return {
            success: true,
            messageId: info.messageId,
            email,
        };

    } catch (error) {

        console.error(
            `❌ Failed to send application received email to ${email}:`,
            error
        );

        return {
            success: false,
            email,
            error: error.message,
        };
    }
};


/* ============================================================
   QUALIFIED INITIAL EVALUATION EMAIL
============================================================ */

export const sendQualifiedInitialEvaluationEmail = async ({
    email,
    firstName,
    lastName,
    residentialAddress,
    positionTitle,
    qualificationStandards,
    applicantQualifications,
    evaluationDetails,
    initialEvaluationDate,
    applicationCode,
    hrmoName = "Human Resource Management Officer",
}) => {

    try {

        const qualificationRows =
            qualificationStandards
                .map(
                    (item) => `
                        <tr>
                            <td style="
                                border:1px solid #999;
                                padding:8px;
                                vertical-align:top;
                                font-weight:bold;
                            ">
                                ${escapeHtml(item.criterion)}
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:8px;
                                vertical-align:top;
                            ">
                                ${formatRequirement(item.requirement)}
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:8px;
                                vertical-align:top;
                            ">
                                ${formatList(item.actual)}
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:8px;
                                vertical-align:top;
                            ">
                                ${escapeHtml(item.remarks || "Qualified")}
                            </td>
                        </tr>
                    `
                )
                .join("");


        const mailOptions = {

            from: process.env.EMAIL,

            to: email,

            subject:
                `Initial Evaluation Result – Qualified – ${positionTitle}`,

            html: `

                <div style="
                    font-family: Arial, Helvetica, sans-serif;
                    color:#222;
                    max-width:850px;
                    margin:0 auto;
                    line-height:1.6;
                ">

                    <p style="text-align:right;">
                        ${formatDate(initialEvaluationDate)}
                    </p>


                    <p>
                        <strong>
                            ${escapeHtml(firstName)}
                            ${escapeHtml(lastName)}
                        </strong><br>

                        ${escapeHtml(residentialAddress || "")}
                    </p>


                    <p>
                        Dear ${escapeHtml(firstName)} ${escapeHtml(lastName)},
                    </p>


                    <p>
                        <strong>
                            CONGRATULATIONS!
                        </strong>
                    </p>


                    <p>
                        We are pleased to inform you that based on the
                        initial evaluation of your submitted application
                        documents, your qualifications were found to be
                        substantial vis-à-vis the CSC-approved
                        Qualification Standards for the position you
                        applied for.
                    </p>


                    <table style="
                        width:100%;
                        border-collapse:collapse;
                        margin:20px 0;
                    ">

                        <tr>
                            <td style="
                                width:220px;
                                border:1px solid #999;
                                padding:8px;
                                font-weight:bold;
                            ">
                                Position Applied For
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:8px;
                            ">
                                ${escapeHtml(positionTitle)}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                border:1px solid #999;
                                padding:8px;
                                font-weight:bold;
                            ">
                                Initial Evaluation Date
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:8px;
                            ">
                                ${formatDate(initialEvaluationDate)}
                            </td>
                        </tr>

                    </table>


                    <h3>
                        CSC-Approved Qualification Standards
                    </h3>


                    <table style="
                        width:100%;
                        border-collapse:collapse;
                        margin-bottom:25px;
                    ">

                        <thead>

                            <tr>

                                <th style="
                                    border:1px solid #999;
                                    padding:8px;
                                    text-align:left;
                                ">
                                    Criterion
                                </th>

                                <th style="
                                    border:1px solid #999;
                                    padding:8px;
                                    text-align:left;
                                ">
                                    Requirement
                                </th>

                                <th style="
                                    border:1px solid #999;
                                    padding:8px;
                                    text-align:left;
                                ">
                                    Applicant's Actual Qualification
                                </th>

                                <th style="
                                    border:1px solid #999;
                                    padding:8px;
                                    text-align:left;
                                ">
                                    Remarks
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${qualificationRows}

                        </tbody>

                    </table>


                    <h3>
                        Evaluation Details
                    </h3>


                    <div style="
                        border:1px solid #ccc;
                        padding:15px;
                        margin-bottom:20px;
                    ">

                        ${evaluationDetails
                            .map(
                                (item) => `
                                    <p style="margin:8px 0;">
                                        <strong>
                                            ${escapeHtml(item.criterion)}
                                        </strong><br>

                                        Requirement:
                                        ${formatRequirement(item.requirement)}
                                        <br>

                                        Actual Qualification:
                                        ${formatList(item.actual)}

                                        <br>

                                        Remarks:
                                        ${escapeHtml(
                                            item.remarks || "Qualified"
                                        )}
                                    </p>
                                `
                            )
                            .join("")}

                    </div>


                    <div style="
                        border:2px solid #222;
                        padding:18px;
                        margin:25px 0;
                    ">

                        <p style="
                            margin:0 0 8px 0;
                            font-weight:bold;
                        ">
                            Assigned Application Code
                        </p>

                        <p style="
                            margin:0;
                            font-size:24px;
                            font-weight:bold;
                            letter-spacing:2px;
                        ">
                            ${escapeHtml(applicationCode)}
                        </p>

                    </div>


                    <p>
                        Your application has therefore qualified for the
                        next stage of the recruitment and selection
                        process.
                    </p>


                    <p>
                        Please take note of your assigned Application Code
                        and use it in succeeding recruitment-related
                        transactions and announcements.
                    </p>


                    <p>
                        Should you have questions or require clarification
                        regarding your application, you may contact the
                        Human Resource Management Office.
                    </p>


                    <p style="margin-top:35px;">
                        Very truly yours,
                    </p>


                    <p>
                        <strong>
                            ${escapeHtml(hrmoName)}
                        </strong><br>

                        Human Resource Management Office<br>
                        DepEd Schools Division Office
                    </p>

                </div>
            `,
        };


        const info =
            await transporter.sendMail(mailOptions);


        console.log(
            `✅ Qualified initial evaluation email sent to ${email}`
        );


        return {
            success: true,
            messageId: info.messageId,
            email,
            applicationCode,
        };

    } catch (error) {

        console.error(
            `❌ Failed to send qualified evaluation email to ${email}:`,
            error
        );

        return {
            success: false,
            email,
            error: error.message,
        };
    }
};


/* ============================================================
   NOT QUALIFIED INITIAL EVALUATION EMAIL
============================================================ */

export const sendNotQualifiedInitialEvaluationEmail = async ({
    email,
    firstName,
    lastName,
    residentialAddress,
    positionTitle,
    qualificationStandards,
    applicantQualifications,
    evaluationDetails,
    initialEvaluationDate,
    hrmoName = "Human Resource Management Officer",
}) => {

    try {

        const qualificationRows =
            qualificationStandards
                .map(
                    (item) => `
                        <tr>

                            <td style="
                                border:1px solid #999;
                                padding:8px;
                                vertical-align:top;
                                font-weight:bold;
                            ">
                                ${escapeHtml(item.criterion)}
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:8px;
                                vertical-align:top;
                            ">
                                ${formatRequirement(item.requirement)}
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:8px;
                                vertical-align:top;
                            ">
                                ${formatList(item.actual)}
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:8px;
                                vertical-align:top;
                            ">
                                ${escapeHtml(
                                    item.remarks || "Did not meet requirement"
                                )}
                            </td>

                        </tr>
                    `
                )
                .join("");


        const mailOptions = {

            from: process.env.EMAIL,

            to: email,

            subject:
                `Initial Evaluation Result – Not Qualified – ${positionTitle}`,

            html: `

                <div style="
                    font-family: Arial, Helvetica, sans-serif;
                    color:#222;
                    max-width:850px;
                    margin:0 auto;
                    line-height:1.6;
                ">

                    <p style="text-align:right;">
                        ${formatDate(initialEvaluationDate)}
                    </p>


                    <p>
                        <strong>
                            ${escapeHtml(firstName)}
                            ${escapeHtml(lastName)}
                        </strong><br>

                        ${escapeHtml(residentialAddress || "")}
                    </p>


                    <p>
                        Dear ${escapeHtml(firstName)} ${escapeHtml(lastName)},
                    </p>


                    <p>
                        We regret to inform you that based on the initial
                        evaluation of your submitted application documents,
                        your qualifications did not meet the minimum
                        CSC-approved Qualification Standards for the
                        position applied for.
                    </p>


                    <table style="
                        width:100%;
                        border-collapse:collapse;
                        margin:20px 0;
                    ">

                        <tr>

                            <td style="
                                width:220px;
                                border:1px solid #999;
                                padding:8px;
                                font-weight:bold;
                            ">
                                Position Applied For
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:8px;
                            ">
                                ${escapeHtml(positionTitle)}
                            </td>

                        </tr>

                        <tr>

                            <td style="
                                border:1px solid #999;
                                padding:8px;
                                font-weight:bold;
                            ">
                                Initial Evaluation Date
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:8px;
                            ">
                                ${formatDate(initialEvaluationDate)}
                            </td>

                        </tr>

                    </table>


                    <h3>
                        CSC-Approved Qualification Standards
                    </h3>


                    <table style="
                        width:100%;
                        border-collapse:collapse;
                        margin-bottom:25px;
                    ">

                        <thead>

                            <tr>

                                <th style="
                                    border:1px solid #999;
                                    padding:8px;
                                    text-align:left;
                                ">
                                    Criterion
                                </th>

                                <th style="
                                    border:1px solid #999;
                                    padding:8px;
                                    text-align:left;
                                ">
                                    Requirement
                                </th>

                                <th style="
                                    border:1px solid #999;
                                    padding:8px;
                                    text-align:left;
                                ">
                                    Applicant's Actual Qualification
                                </th>

                                <th style="
                                    border:1px solid #999;
                                    padding:8px;
                                    text-align:left;
                                ">
                                    Remarks
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${qualificationRows}

                        </tbody>

                    </table>


                    <h3>
                        Evaluation Details
                    </h3>


                    <div style="
                        border:1px solid #ccc;
                        padding:15px;
                        margin-bottom:20px;
                    ">

                        ${evaluationDetails
                            .map(
                                (item) => `
                                    <p style="margin:8px 0;">

                                        <strong>
                                            ${escapeHtml(item.criterion)}
                                        </strong>
                                        <br>

                                        Requirement:
                                        ${formatRequirement(item.requirement)}
                                        <br>

                                        Actual Qualification:
                                        ${formatList(item.actual)}

                                        <br>

                                        Remarks:
                                        ${escapeHtml(
                                            item.remarks ||
                                            "Did not meet requirement"
                                        )}

                                    </p>
                                `
                            )
                            .join("")}

                    </div>


                    <p>
                        We encourage you to continue developing your
                        qualifications and to apply for future vacancies
                        for which you may meet the prescribed
                        Qualification Standards.
                    </p>


                    <p>
                        The result of the initial evaluation is provided
                        for transparency and information regarding your
                        application.
                    </p>


                    <p style="margin-top:35px;">
                        Very truly yours,
                    </p>


                    <p>
                        <strong>
                            ${escapeHtml(hrmoName)}
                        </strong><br>

                        Human Resource Management Office<br>
                        DepEd Schools Division Office
                    </p>

                </div>
            `,
        };


        const info =
            await transporter.sendMail(mailOptions);


        console.log(
            `✅ Not-qualified initial evaluation email sent to ${email}`
        );


        return {
            success: true,
            messageId: info.messageId,
            email,
        };

    } catch (error) {

        console.error(
            `❌ Failed to send not-qualified evaluation email to ${email}:`,
            error
        );

        return {
            success: false,
            email,
            error: error.message,
        };
    }
};


// ============================================================
// INDIVIDUAL EVALUATION SHEET (IES) EMAIL
// ============================================================

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