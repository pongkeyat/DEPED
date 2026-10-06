import transporters from "../../config/emailTransporters.js";

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

        from: process.env.EMAIL,

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