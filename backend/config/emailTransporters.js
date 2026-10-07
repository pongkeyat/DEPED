import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
import nodemailer from "nodemailer";
import tls from "tls";

dns.setDefaultResultOrder("ipv4first");

const port = Number(process.env.SMTP_PORT || 587);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid port number.");
}

if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
    throw new Error("EMAIL and EMAIL_PASSWORD must be configured to send email.");
}

const trustedCAs = [
    ...tls.getCACertificates("default"),
    ...tls.getCACertificates("system"),
];

const createTransporter = () => nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
        ca: trustedCAs,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
});

const verifyTransporter = (name, transporter) => {
    transporter.verify()
        .then(() => {
            console.log(`✅ Mail server is ready (${name}).`);
        })
        .catch((error) => {
            console.error(`❌ Mail server verification failed (${name}):`, error);
        });
};

const transporters = {
    applications: createTransporter(),
    initialEvaluation: createTransporter(),
    assessmentTransporter: createTransporter(),
    interviewSession: createTransporter(),
    userAccounts: createTransporter(),
    vacancies: createTransporter(),
};

for (const [name, transporter] of Object.entries(transporters)) {
    verifyTransporter(name, transporter);
}

export default transporters;
