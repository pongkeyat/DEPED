import transporters from "../config/emailTransporters.js";

const transporter = transporters.vacancies;

// ============================================================
// INITIAL SCREENING EMAIL
// ============================================================

export const sendInitialScreeningEmail = async (
    email,
    firstName,
    lastName,
    ticket
) => {

    try {

        const mailOptions = {

            from: process.env.EMAIL,

            to: email,

            subject: "Application Update – Initial Screening",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                ">

                    <h2 style="
                        color: #1f2937;
                    ">
                        Application Status Update
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
                        Please be informed that the vacancy you applied for
                        is now <strong>closed</strong>.
                    </p>

                    <p>
                        Your application is currently under
                        <strong>Initial Screening</strong>.
                    </p>

                    <p>
                        Your submitted documents will be evaluated based on
                        the qualification requirements of the position.
                    </p>

                    <p>
                        Please wait for further announcements regarding the
                        next step of the recruitment process.
                    </p>

                    <div style="
                        margin: 20px 0;
                        padding: 15px;
                        background-color: #f3f4f6;
                        border-left: 4px solid #2563eb;
                    ">

                        <p style="margin: 0;">
                            <strong>Application Ticket:</strong>
                            ${ticket}
                        </p>

                    </div>

                    <p>
                        Thank you.
                    </p>

                    <p style="
                        color: #6b7280;
                        font-size: 13px;
                    ">
                        This is an automated email from the
                        DepEd Recruitment Management System.
                        Please do not reply to this email.
                    </p>

                </div>
            `
        };

        // ========================================================
        // ACTUALLY SEND THE EMAIL
        // ========================================================

        const info = await transporter.sendMail(mailOptions);

        console.log(
            `✅ Initial screening email sent to ${email}`
        );

        return {
            success: true,
            messageId: info.messageId,
            email,
        };

    } catch (error) {

        console.error(
            `❌ Failed to send initial screening email to ${email}:`,
            error
        );

        return {
            success: false,
            email,
            error: error.message,
        };
    }
};