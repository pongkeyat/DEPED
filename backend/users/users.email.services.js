import transporters from "../config/emailTransporters.js";

const transporter = transporters.userAccounts;

export const AccountCreatedEmail = async (email, password) => {
    if (!email) {
        throw new Error("Recipient email is required.");
    }

    if (!password) {
        throw new Error("Generated password is required.");
    }

    if (!transporter) {
        throw new Error(
            "User account email transporter is not configured."
        );
    }

    const mailOptions = {
        from: {
            name: "DEPED Recruitment System",
            address: process.env.EMAIL,
        },
        to: email,
        subject: "DEPED Recruitment System Account",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #1E3E74;">
                    DEPED Recruitment System
                </h2>

                <p>Dear User,</p>

                <p>
                    Your account has been successfully created for the
                    DEPED Recruitment System.
                </p>

                <p>
                    <strong>Email:</strong> ${email}
                </p>

                <p>
                    <strong>Temporary Password:</strong> ${password}
                </p>

                <p>
                    Please log in using the credentials above and change
                    your password after your first login.
                </p>

                <br>

                <p>
                    Regards,<br>
                    <strong>Admin</strong><br>
                    DEPED Recruitment System
                </p>
            </div>
        `,
    };

    try {
        const result = await transporter.sendMail(mailOptions);

        console.log("========== ACCOUNT EMAIL ==========");
        console.log("To:", email);
        console.log("Message ID:", result.messageId);
        console.log("Accepted:", result.accepted);
        console.log("Rejected:", result.rejected);
        console.log("Response:", result.response);
        console.log("===================================");

        const wasAccepted = result.accepted?.some(
            (recipient) =>
                String(recipient).trim().toLowerCase() ===
                String(email).trim().toLowerCase()
        );

        if (!wasAccepted) {
            throw new Error(
                `SMTP did not accept the email for ${email}.`
            );
        }

        return result;
    } catch (error) {
        console.error(
            "ACCOUNT EMAIL ERROR:",
            error
        );

        throw error;
    }
};



export const ForgotPasswordEmail = async (email, resetLink) => {
    const mailOptions = {
        from: `"DepEd Recruitment System" <${process.env.USER_ACCOUNTS_EMAIL}>`,
        to: email,
        subject: "Password Reset Request",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>Password Reset Request</h2>

                <p>Hello,</p>

                <p>
                    We received a request to reset the password for your
                    DepEd Recruitment System account.
                </p>

                <p>
                    Click the button below to create a new password:
                </p>

                <div style="margin: 30px 0;">
                    <a
                        href="${resetLink}"
                        style="
                            background:#1d4ed8;
                            color:white;
                            padding:12px 20px;
                            text-decoration:none;
                            border-radius:6px;
                            display:inline-block;
                        "
                    >
                        Reset Password
                    </a>
                </div>

                <p>
                    This password reset link will expire in
                    <strong>30 minutes</strong>.
                </p>

                <p>
                    If you did not request a password reset, you can safely
                    ignore this email.
                </p>

                <p>
                    Regards,<br>
                    DepEd Recruitment System
                </p>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};