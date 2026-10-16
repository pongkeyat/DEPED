
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
    initialEvaluationScores = {},
}) => {
    try {
        if (!email) {
            console.warn(
                "IES email skipped: applicant email is missing."
            );
            return;
        }

        const applicantName =
            `${firstName || ""} ${lastName || ""}`.trim() ||
            "Applicant";

        const normalizedType = String(assessmentType || "")
            .trim()
            .toUpperCase();

        const isTeaching = normalizedType === "TEACHING";

        // ========================================================
        // HELPERS
        // ========================================================

        const normalize = (value) =>
            String(value || "")
                .trim()
                .replace(/\s+/g, " ")
                .toUpperCase();

        const formatScore = (value) => {
            const number = Number(value || 0);

            return Number.isInteger(number)
                ? String(number)
                : number.toFixed(2);
        };

        const findScores = (criterionNames) => {
            const names = criterionNames.map(normalize);

            return scores.filter((item) =>
                names.includes(normalize(item.criterion_name))
            );
        };

        const getScore = (criterionNames) => {
            const matchingScores = findScores(criterionNames)
                .filter(
                    (item) =>
                        item.score !== null &&
                        item.score !== undefined &&
                        item.score !== "" &&
                        Number.isFinite(Number(item.score))
                )
                .map((item) => Number(item.score));

            if (matchingScores.length === 0) {
                return 0;
            }

            const average =
                matchingScores.reduce((total, score) => total + score, 0) /
                matchingScores.length;

            return Number(average.toFixed(2));
        };

        const getOptionLabel = (criterionNames) => {
            const row = findScores(criterionNames)[0];

            return row?.option_label || row?.remarks || "";
        };

        // ========================================================
        // TEACHING IES
        // Keep the existing Teaching criteria and weights.
        // ETE is already included here.
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
        // ETE DEFINITIONS FOR ALL OTHER CATEGORIES
        // ========================================================

        const eteDefinitions = [
            {
                label: "Education",
                aliases: ["EDUCATION"],
                scoreKey: "education_points",
            },
            {
                label: "Training",
                aliases: ["TRAINING"],
                scoreKey: "training_points",
            },
            {
                label: "Experience",
                aliases: ["EXPERIENCE", "WORK EXPERIENCE"],
                scoreKey: "experience_points",
            },
        ];

        // Always include ETE first for non-teaching categories.
        const eteRows = eteDefinitions.map(
            ({ label, aliases, scoreKey }) => {
                const item = findScores(aliases)[0];
                const initialEvaluationScore =
                    initialEvaluationScores[scoreKey];

                return {
                    criterion: label,
                    weight: Number(item?.max_points || 0),
                    score:
                        initialEvaluationScore !== null &&
                        initialEvaluationScore !== undefined
                            ? scoreKey === "experience_points" &&
                              normalizedType === "SCHOOL_ADMINISTRATION"
                                ? Math.min(
                                    Number(initialEvaluationScore),
                                    10
                                )
                                : Number(initialEvaluationScore)
                            : getScore(aliases),
                    details: item?.option_label || item?.remarks || "",
                };
            }
        );

        // Prevent ETE criteria from appearing twice.
        const eteNames = eteDefinitions.flatMap(({ aliases }) =>
            aliases.map(normalize)
        );

        // Preserve every other criterion returned by the backend.
        const otherRows = scores
            .filter(
                (item) =>
                    !eteNames.includes(normalize(item.criterion_name))
            )
            .map((item) => ({
                criterion: item.criterion_name,
                weight: Number(item.max_points || 0),
                score: Number(item.score || 0),
                details: item.option_label || item.remarks || "",
            }));

        // ETE + the remaining criteria for every non-teaching category.
        const generalRows = [...eteRows, ...otherRows];

        // Teaching keeps its existing criteria and weights.
        const rows = isTeaching ? teachingRows : generalRows;

        // ========================================================
        // TOTAL
        // ========================================================

        const totalScore = rows.reduce(
            (total, row) => total + Number(row.score || 0),
            0
        );

        const totalWeight = rows.reduce(
            (total, row) => total + Number(row.weight || 0),
            0
        );

        // ========================================================
        // TABLE ROWS
        // ========================================================

        const tableRows = rows
            .map(
                (row) => `
                    <tr>
                        <td style="
                            border:1px solid #999;
                            padding:8px;
                            vertical-align:middle;
                            font-size:12px;
                            color:#333;
                        ">
                            ${escapeHtml(row.criterion)}
                        </td>

                        <td style="
                            border:1px solid #999;
                            padding:8px;
                            text-align:center;
                            vertical-align:middle;
                            font-size:12px;
                        ">
                            ${formatScore(row.weight)}
                        </td>

                        <td style="
                            border:1px solid #999;
                            padding:8px;
                            vertical-align:middle;
                            font-size:12px;
                        ">
                            ${escapeHtml(row.details) || "&nbsp;"}
                        </td>

                        <td style="
                            border:1px solid #999;
                            padding:8px;
                            text-align:center;
                            vertical-align:middle;
                            font-size:12px;
                        ">
                            ${formatScore(row.score)}
                            /
                            ${formatScore(row.weight)}
                        </td>

                        <td style="
                            border:1px solid #999;
                            padding:8px;
                            text-align:center;
                            vertical-align:middle;
                            font-size:12px;
                            font-weight:bold;
                        ">
                            ${formatScore(row.score)}
                        </td>
                    </tr>
                `
            )
            .join("");

        // ========================================================
        // IES ANNEX
        // ========================================================

        const annex = isTeaching ? "Annex G-1" : "Annex G";

        // ========================================================
        // EMAIL
        // ========================================================

        const mailOptions = {
            from: `"DepEd La Union Schools Division Office" <${process.env.EMAIL}>`,
            to: email,
            subject: `Individual Evaluation Sheet (IES) - ${
                positionTitle || "Application"
            }`,

            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    />
    <title>Individual Evaluation Sheet</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f4f4;
    font-family:Arial, Helvetica, sans-serif;
    color:#333;
">
    <div style="width:100%;padding:25px 10px;">
        <div style="
            max-width:900px;
            margin:0 auto;
            background:#ffffff;
            border:1px solid #999;
            padding:25px;
        ">

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

            <table width="100%" cellpadding="4" cellspacing="0" style="
                border-collapse:collapse;
                margin-bottom:20px;
                font-size:12px;
            ">
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
                            ${isTeaching ? "Schools Division Office" : "Office"}:
                        </strong>
                        La Union Schools Division Office
                    </td>
                    <td>
                        <strong>Job Group/SG-Level:</strong>
                        ${escapeHtml(salaryGrade)}
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="
                border-collapse:collapse;
                table-layout:fixed;
            ">
                <thead>
                    <tr style="
                        background:#777;
                        color:#fff;
                        text-align:center;
                        font-weight:bold;
                        font-size:11px;
                    ">
                        <th style="border:1px solid #555;padding:9px 5px;width:23%;">
                            Criteria
                        </th>
                        <th style="border:1px solid #555;padding:9px 5px;width:10%;">
                            Weight<br>Allocation
                        </th>
                        <th style="border:1px solid #555;padding:9px 5px;width:27%;">
                            Details of Applicant's<br>Qualifications
                        </th>
                        <th style="border:1px solid #555;padding:9px 5px;width:20%;">
                            Computation
                        </th>
                        <th style="border:1px solid #555;padding:9px 5px;width:10%;">
                            Actual<br>Score
                        </th>
                    </tr>
                </thead>

                <tbody>
                    ${tableRows}

                    <tr style="
                        background:#777;
                        color:#fff;
                        font-weight:bold;
                    ">
                        <td style="
                            border:1px solid #555;
                            padding:9px;
                            text-align:center;
                        ">
                            TOTAL
                        </td>

                        <td style="
                            border:1px solid #555;
                            padding:9px;
                            text-align:center;
                        ">
                            ${formatScore(isTeaching ? 100 : totalWeight)}
                        </td>

                        <td style="border:1px solid #555;padding:9px;"></td>
                        <td style="border:1px solid #555;padding:9px;"></td>

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
                    guidelines; and acknowledge, upon discussion with the
                    Human Resource Merit Promotion and Selection Board
                    (HRMPSB), the results of the comparative assessment and
                    the points given to me based on my qualifications and
                    submitted documentary requirements for the position
                    under the office where the vacancy exists.
                </p>

                <p>
                    Furthermore, I hereby affix my signature in this Form
                    to attest to the objective and judicious conduct of the
                    HRMPSB evaluation through Open Ranking System.
                </p>
            </div>

            <table width="100%" cellpadding="5" cellspacing="0" style="
                margin-top:35px;
                font-family:Georgia, serif;
                font-size:11px;
            ">
                <tr>
                    <td width="50%">
                        <strong>Attested:</strong>
                    </td>
                    <td width="50%" style="text-align:center;">
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

        const result = await transporter.sendMail(mailOptions);

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
