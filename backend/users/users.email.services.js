import transporters from "../config/emailTransporters.js";

const transporter = transporters.userAccounts;

// 1. Updated with your exact DEPED template structure
export const AccountCreatedEmail = async (email, password) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "DEPED Recruitment System Account",
        html: `
            <h2>Account</h2>

            <p>Dear ${email} ,</p>

            <p>Your Email: ${email}</p>

            <p>Your Password: ${password}</p>

            <br>
            <strong>Admin</strong>
        `,
    };

    return transporter.sendMail(mailOptions);
};