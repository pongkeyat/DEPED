import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";
import dns from "dns";

// CRITICAL FIX: Forces Node.js to prioritize IPv4 over IPv6.
// This prevents the "connect ETIMEDOUT" network error with Gmail.
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// Verify SMTP connection when the server starts
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Nodemailer Error:", error);
    } else {
        console.log("✅ Mail server is ready.");
    }
});

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