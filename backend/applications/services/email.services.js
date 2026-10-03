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

// Optional: Verify SMTP connection when the server starts
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Nodemailer Error:", error);
    } else {
        console.log("✅ Mail server is ready.");
    }
});

export const sendApplicationReceivedEmail = async (
    email,
    firstName,
    lastName
) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Application Received",
        html: `
            <h2>Application Received</h2>

            <p>Dear ${firstName} ${lastName},</p>

            <p>Thank you for submitting your application.</p>

            <p>Your application has been received successfully.</p>

            <p>
                You will receive another email whenever your application status changes.
            </p>

            <br>

            <strong>Human Resource Office</strong>
        `,
    };

    return transporter.sendMail(mailOptions);
};