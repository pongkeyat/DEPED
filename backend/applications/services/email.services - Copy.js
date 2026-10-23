import transporters, {
    createEmailSender,
} from "../../config/emailTransporters.js";

const transporter = transporters.applications;


// ============================================================
// APPLICATION RECEIVED EMAIL
// ============================================================

export const sendApplicationReceivedEmail = async (
    email,
    firstName,
    lastName,
    ticket
) => {

    const mailOptions = {

        from: createEmailSender(),

        to: email,

        subject: "Application Received",

        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 650px;
                margin: 0 auto;
                padding: 30px;
                color: #333;
            ">

                <h2 style="
                    color: #1f4e79;
                    margin-bottom: 20px;
                ">
                    Application Received
                </h2>


                <p>
                    Dear
                    <strong>
                        ${firstName} ${lastName}
                    </strong>,
                </p>


                <p>
                    Thank you for submitting your application.
                </p>


                <p>
                    Your application has been received
                    successfully by the Human Resource Office.
                </p>

                <p>
                    ⚠️ TAKE NOTE! Please submit all required documents before or on the application deadline. Complete submission of the document 
                    requirements is necessary to proceed to the next step of the application process.
                </p>


                <div style="
                    background-color: #f5f7fa;
                    border: 1px solid #d9dee5;
                    padding: 20px;
                    margin: 25px 0;
                    border-radius: 8px;
                ">

                    <p style="margin: 8px 0;">
                        <strong>
                            Application Ticket:
                        </strong>

                        ${ticket}
                    </p>

                </div>


                <p>
                    Please keep your
                    <strong>Application Ticket</strong>
                    for future reference and
                    application status inquiries.
                </p>


                <p>
                    You will receive another email
                    whenever your application status changes.
                </p>


                <br>


                <p>
                    Thank you.
                </p>


                <p>
                    <strong>
                        Human Resource Office
                    </strong>
                </p>

            </div>
        `,
    };


    return transporter.sendMail(
        mailOptions
    );
};



export const sendApplicationReviewEmail = async ({
    hrEmails,
    applicantName,
    applicationCode,
    positionTitle,
    category,
}) => {
    try {
        const recipients = Array.isArray(hrEmails)
            ? hrEmails.filter(Boolean)
            : [hrEmails].filter(Boolean);

        if (recipients.length === 0) {
            console.warn(
                "Application review email skipped: no HR email provided."
            );
            return null;
        }

        const escapeHtml = (value) =>
            String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        const frontendUrl = (
            process.env.FRONTEND_URL || "http://localhost:5173"
        ).replace(/\/+$/, "");

        const mailOptions = {
            from: createEmailSender(),
            to: recipients,
            subject: `Application Review Required - ${applicantName}`,
            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 24px;
                    color: #333;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                ">
                    <h2 style="color: #174a36;">
                        Application Review Required
                    </h2>

                    <p>Dear Human Resource Personnel,</p>

                    <p>
                        A new application has been submitted and requires
                        your review.
                    </p>

                    <table style="
                        width: 100%;
                        border-collapse: collapse;
                    ">
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <strong>Applicant Name</strong>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                ${escapeHtml(applicantName)}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <strong>Application Code</strong>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                ${escapeHtml(applicationCode || "Pending")}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <strong>Position</strong>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                ${escapeHtml(positionTitle)}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <strong>Category</strong>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                ${escapeHtml(category)}
                            </td>
                        </tr>
                    </table>

                    <p style="margin-top: 24px;">
                        Please sign in to the Recruitment Management System
                        to review the applicant's information and documents.
                    </p>

                    <p style="text-align: center; margin: 28px 0;">
                        <a href="${escapeHtml(frontendUrl)}"
                           style="
                               background: #174a36;
                               color: white;
                               padding: 12px 22px;
                               text-decoration: none;
                               border-radius: 5px;
                               display: inline-block;
                           ">
                            Open Recruitment System
                        </a>
                    </p>

                    <p>
                        Thank you,<br>
                        <strong>DepEd Recruitment Management System</strong>
                    </p>
                </div>
            `,
        };

        const result = await transporter.sendMail(mailOptions);

        console.log(
            `Application review notification sent for ${applicantName}.`
        );

        return result;
    } catch (error) {
        console.error(
            "Error sending application review email:",
            error
        );

        throw error;
    }
};