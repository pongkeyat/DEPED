import transporters from "../config/emailTransporters.js";

const transporter = transporters.interviewSession;



// ============================================================
// ASSESSMENT / INTERVIEW SESSION EMAIL
// ============================================================

export const sendAssessmentInvitationEmail = async ({
    email,
    firstName,
    lastName,
    positionTitle,
    applicationCode,
    sessionDate,
    sessionTime,
    venue,
}) => {
    try {
        if (!email) {
            throw new Error(
                "Assessment invitation email cannot be sent: applicant email is missing."
            );
        }

        if (!process.env.EMAIL) {
            throw new Error(
                "Assessment invitation email cannot be sent: EMAIL is not configured."
            );
        }

        const applicantName =
            `${firstName || ""} ${lastName || ""}`.trim() ||
            "Applicant";

        const formattedDate = sessionDate
            ? new Date(sessionDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
              })
            : "To be announced";

        const formattedTime = sessionTime || "To be announced";

        const mailOptions = {
            from: {
                name: "DepEd La Union Schools Division Office",
                address: process.env.EMAIL,
            },
            to: email,
            subject: "Assessment/Interview Schedule – DepEd Recruitment",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

                    <style>
                        body {
                            margin: 0;
                            padding: 0;
                            background-color: #f4f7fb;
                            font-family: Arial, Helvetica, sans-serif;
                            color: #334155;
                        }

                        .wrapper {
                            width: 100%;
                            padding: 30px 15px;
                        }

                        .container {
                            max-width: 650px;
                            margin: 0 auto;
                            background: #ffffff;
                            border-radius: 14px;
                            overflow: hidden;
                            box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
                        }

                        .header {
                            background: #1E3E74;
                            padding: 28px 30px;
                            text-align: center;
                            color: #ffffff;
                        }

                        .header h1 {
                            margin: 0;
                            font-size: 22px;
                        }

                        .content {
                            padding: 30px;
                        }

                        .content p {
                            font-size: 14px;
                            line-height: 1.7;
                            margin: 0 0 15px;
                        }

                        .details {
                            margin: 25px 0;
                            border: 1px solid #e2e8f0;
                            border-radius: 12px;
                            overflow: hidden;
                        }

                        .details-title {
                            background: #f8fafc;
                            padding: 14px 18px;
                            font-weight: bold;
                            color: #1E3E74;
                            border-bottom: 1px solid #e2e8f0;
                        }

                        .row {
                            display: flex;
                            border-bottom: 1px solid #e2e8f0;
                        }

                        .row:last-child {
                            border-bottom: none;
                        }

                        .label {
                            width: 42%;
                            padding: 12px 18px;
                            font-weight: bold;
                            font-size: 13px;
                            color: #64748b;
                            background: #f8fafc;
                        }

                        .value {
                            width: 58%;
                            padding: 12px 18px;
                            font-size: 13px;
                            color: #334155;
                        }

                        .notice {
                            margin-top: 20px;
                            padding: 16px;
                            background: #eff6ff;
                            border-left: 4px solid #1E3E74;
                            border-radius: 8px;
                            font-size: 13px;
                            line-height: 1.6;
                        }

                        .footer {
                            padding: 20px 30px;
                            background: #f8fafc;
                            text-align: center;
                            font-size: 12px;
                            color: #64748b;
                        }
                    </style>
                </head>

                <body>
                    <div class="wrapper">
                        <div class="container">

                            <div class="header">
                                <h1>Assessment / Interview Schedule</h1>
                            </div>

                            <div class="content">

                                <p>
                                    Dear <strong>${applicantName}</strong>,
                                </p>

                                <p>
                                    Congratulations! You have successfully
                                    qualified for the next stage of the
                                    recruitment and selection process.
                                </p>

                                <p>
                                    You are hereby invited to attend the
                                    scheduled assessment/interview for the
                                    position you applied for.
                                </p>

                                <div class="details">

                                    <div class="details-title">
                                        Assessment / Interview Details
                                    </div>

                                    <div class="row">
                                        <div class="label">
                                            Position
                                        </div>

                                        <div class="value">
                                            ${positionTitle || "N/A"}
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="label">
                                            Application Code
                                        </div>

                                        <div class="value">
                                            <strong>
                                                ${applicationCode || "N/A"}
                                            </strong>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="label">
                                            Date
                                        </div>

                                        <div class="value">
                                            ${formattedDate}
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="label">
                                            Time
                                        </div>

                                        <div class="value">
                                            ${formattedTime}
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="label">
                                            Venue
                                        </div>

                                        <div class="value">
                                            ${venue || "To be announced"}
                                        </div>
                                    </div>

                                </div>

                                <div class="notice">
                                    Please arrive at the venue before the
                                    scheduled time and bring the necessary
                                    documents and identification required
                                    for the assessment/interview.
                                </div>

                                <p style="margin-top: 25px;">
                                    We look forward to your participation in
                                    the recruitment and selection process.
                                </p>

                                <p>
                                    Thank you.
                                </p>

                                <p>
                                    <strong>
                                        Human Resource Management Office
                                    </strong>
                                    <br />
                                    DepEd La Union Schools Division Office
                                </p>

                            </div>

                            <div class="footer">
                                This is an automated notification from the
                                DepEd Recruitment Management System.
                                <br />
                                Please do not reply directly to this email.
                            </div>

                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        const result = await transporter.sendMail(mailOptions);

        const wasAccepted = result.accepted?.some(
            (recipient) =>
                String(recipient).trim().toLowerCase() ===
                String(email).trim().toLowerCase()
        );

        if (!wasAccepted) {
            throw new Error(
                `SMTP did not accept the assessment invitation for ${email}.`
            );
        }

        console.log(
            `Assessment invitation email accepted by SMTP for ${email}. Message ID: ${result.messageId}`
        );

        return result;
    } catch (error) {
        console.error(
            `Error sending assessment invitation email to ${email}:`,
            error
        );

        throw error;
    }
};