import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';

import crypto from 'crypto'; 

import pool from "../config/db.js";

import { createAuditLog } from "../auditLogs/auditLogs.service.js";

import { AccountCreatedEmail,  ForgotPasswordEmail, } from "./users.email.services.js";



const cookieOptions = {

    httpOnly: true,

    secure: process.env.NODE_ENV === 'production',

    sameSite: 'strict',

    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days

}



const generateToken = (email) => {

    return jwt.sign({ email }, process.env.JWT_SECRET, {

        expiresIn: '7d'

    })

}



const getAuditContext = (req, userRecord = null) => {

    const currentUser = userRecord || req.user || null;



    return {

        user_id: currentUser?.id ?? null,

        username: currentUser?.email || currentUser?.username || req.body?.email || "SYSTEM",

        user_role: currentUser?.role || null,

        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null,

        user_agent: req.get('user-agent') || null

    };

};



export const registerUsers = async (req, res) => {
    try {
        const first_name = String(req.body.first_name || "").trim();
        const last_name = String(req.body.last_name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const role = String(req.body.role || "").trim();

        if (!first_name || !last_name || !email || !role) {
            return res.status(400).json({
                success: false,
                message: "First name, last name, email, and role are required.",
            });
        }

        // ========================================================
        // CHECK IF EMAIL ALREADY EXISTS
        // ========================================================
        const existingUser = await pool.query(
            `
            SELECT id, email, is_archived
            FROM users
            WHERE LOWER(email) = LOWER($1)
            LIMIT 1
            `,
            [email]
        );

        if (existingUser.rows.length > 0) {
            const existing = existingUser.rows[0];

            if (existing.is_archived) {
                return res.status(400).json({
                    success: false,
                    message: "This email belongs to an archived user.",
                });
            }

            return res.status(409).json({
                success: false,
                message: "A user with this email already exists.",
            });
        }

        // ========================================================
        // GENERATE PASSWORD
        // First 3 letters of first name
        // + First 3 letters of last name
        // + 2 random numbers
        // + 1 special character
        // ========================================================
        const numbers = "0123456789";
        const specialChars = "!@#$%^&*";

        const firstNamePart = first_name
            .replace(/[^a-zA-Z]/g, "")
            .slice(0, 3)
            .toLowerCase();

        const lastNamePart = last_name
            .replace(/[^a-zA-Z]/g, "")
            .slice(0, 3)
            .toLowerCase();

        // Make sure the name parts are not empty
        if (!firstNamePart || !lastNamePart) {
            return res.status(400).json({
                success: false,
                message:
                    "First name and last name must contain at least one valid letter.",
            });
        }

        let randomNumbers = "";

        for (let i = 0; i < 2; i++) {
            randomNumbers += numbers[
                crypto.randomInt(0, numbers.length)
            ];
        }

        const randomSpecialChar =
            specialChars[
                crypto.randomInt(0, specialChars.length)
            ];

        // Capitalize first character of each name part
        const formattedFirstName =
            firstNamePart.charAt(0).toUpperCase() +
            firstNamePart.slice(1);

        const formattedLastName =
            lastNamePart.charAt(0).toUpperCase() +
            lastNamePart.slice(1);

        const generatedPassword =
            `${formattedFirstName}${formattedLastName}${randomNumbers}${randomSpecialChar}`;

        // ========================================================
        // HASH PASSWORD
        // ========================================================
        const hashedPassword = await bcrypt.hash(
            generatedPassword,
            10
        );

        // ========================================================
        // CREATE USER
        // ========================================================
        const insertQuery = `
            INSERT INTO users (
                first_name,
                last_name,
                email,
                password,
                role,
                is_password_changed,
                is_archived
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING
                id,
                first_name,
                last_name,
                email,
                role,
                is_password_changed,
                is_archived
        `;

        const values = [
            first_name,
            last_name,
            email,
            hashedPassword,
            role,
            false,
            false,
        ];

        const result = await pool.query(insertQuery, values);

        const newUser = result.rows[0];

        // ========================================================
        // SEND ACCOUNT EMAIL
        // ========================================================
        let emailStatus = "PENDING";
        let emailAccepted = false;

        try {
            const mailResult = await AccountCreatedEmail(
                email,
                generatedPassword
            );

            console.info("User account email accepted by SMTP:", {
                messageId: mailResult.messageId,
                acceptedCount: mailResult.accepted?.length || 0,
                rejectedCount: mailResult.rejected?.length || 0,
                response: mailResult.response,
            });

            emailStatus = "ACCEPTED";
            emailAccepted = true;
        } catch (mailError) {
            emailStatus = "FAILED";

            console.error("❌ Mail delivery failed:", mailError);

            // Do not delete the account.
            // The account is already created, but email delivery failed.
        }

        // ========================================================
        // RESPONSE
        // ========================================================
        return res.status(201).json({
            success: true,
            message: emailAccepted
                ? "User account created successfully. The mail server accepted the credentials email, but inbox delivery is not confirmed."
                : "User account created successfully, but the account email could not be sent.",
            user: newUser,
            emailStatus,
            emailAccepted,
        });
    } catch (error) {
        console.error("❌ Register user error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create user account.",
            error: error.message,
        });
    }
};



export const loginUsers = async (req, res) => {

    const { email, password } = req.body;



    if (!email || !password) {

        return res.status(400).json({ error: 'Email and password are required' });

    }



    try {

        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);



        if (user.rows.length === 0) {

            return res.status(400).json({ error: 'Invalid credentials' });

        }



        const userData = user.rows[0];

        const isMatch = await bcrypt.compare(password, userData.password);



        if (!isMatch) {

            return res.status(400).json({ error: 'Invalid credentials' });

        }



        const token = generateToken(userData.email);

        res.cookie('token', token, cookieOptions);



        try {

            await createAuditLog({

                user_id: userData.id,

                username: userData.email,

                user_role: userData.role,

                action: 'LOGIN',

                module: 'AUTH',

                description: 'User logged in successfully.',

                entity_type: 'users',

                entity_id: userData.id,

                ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null,

                user_agent: req.get('user-agent') || null,

                metadata: {

                    email: userData.email,

                    role: userData.role

                },

                status: 'SUCCESS'

            });

        } catch (auditError) {

            console.error('Failed to save login audit log:', auditError);

        }



        return res.status(200).json({ 

            token,

            user: {

                email: userData.email, 

                role: userData.role,

                isPasswordChanged: userData.is_password_changed

            }

        });



    } catch (error) {

        console.error('Error during login:', error);

        return res.status(500).json({ error: 'Internal server error' });

    }

};



export const updatePasswords = async (req, res) => {

    const { newPassword } = req.body;

    const userEmail = req.user?.email;



    if (!userEmail) {

        return res.status(401).json({ error: 'Unauthorized Access' });

    }



    if (!newPassword) {

        return res.status(400).json({ error: 'New password is required' });

    }



    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;

    if (!passwordRegex.test(newPassword)) {

        return res.status(400).json({ 

            error: 'Password must contain at least one number and one special character' 

        });

    }



    try {

        // 1. Fetch current database profile record to verify history string

        const userQuery = await pool.query('SELECT password FROM users WHERE email = $1', [userEmail]);



        if (userQuery.rows.length === 0) {

            return res.status(404).json({ error: 'User account not found' });

        }



        // 2. Prevent reuse of the generated temporary password string

        const isSameAsGenerated = await bcrypt.compare(newPassword, userQuery.rows[0].password);

        if (isSameAsGenerated) {

            return res.status(400).json({ 

                error: 'Your new password cannot be identical to the system-generated temporary password.' 

            });

        }



        // 3. Process safe update

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const updateResult = await pool.query(

            'UPDATE users SET password = $1, is_password_changed = true WHERE email = $2 RETURNING id, email, role, is_password_changed',

            [hashedNewPassword, userEmail]

        );



        try {

            await createAuditLog({

                user_id: updateResult.rows[0].id,

                username: updateResult.rows[0].email,

                user_role: updateResult.rows[0].role,

                action: 'UPDATE',

                module: 'USER_MANAGEMENT',

                description: 'Password updated successfully.',

                entity_type: 'users',

                entity_id: updateResult.rows[0].id,

                ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null,

                user_agent: req.get('user-agent') || null,

                metadata: {

                    password_change: true,

                    email: updateResult.rows[0].email

                },

                status: 'SUCCESS'

            });

        } catch (auditError) {

            console.error('Failed to save password-change audit log:', auditError);

        }



        return res.status(200).json({ 

            message: "Password changed successfully.",

            isPasswordChanged: updateResult.rows[0].is_password_changed

        });



    } catch (error) {

        console.error('Error during password update:', error);

        return res.status(500).json({ error: 'Internal server error' });

    }

};



export const getUserProfiles = async (req,res) => {

    res.json({user: req.user});

}



export const logoutUsers = async (req, res) => {

    const currentUser = req.user || null;

    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');



    let loggedUser = currentUser;



    if (!loggedUser && token) {

        try {

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await pool.query('SELECT * FROM users WHERE email = $1', [decoded.email]);



            if (user.rows[0]) {

                loggedUser = user.rows[0];

            }

        } catch (error) {

            console.error('Failed to resolve logout user:', error);

        }

    }



    if (loggedUser) {

        try {

            await createAuditLog({

                user_id: loggedUser.id,

                username: loggedUser.email,

                user_role: loggedUser.role,

                action: 'LOGOUT',

                module: 'AUTH',

                description: 'User logged out successfully.',

                entity_type: 'users',

                entity_id: loggedUser.id,

                ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null,

                user_agent: req.get('user-agent') || null,

                metadata: {

                    email: loggedUser.email,

                    role: loggedUser.role

                },

                status: 'SUCCESS'

            });

        } catch (auditError) {

            console.error('Failed to save logout audit log:', auditError);

        }

    }



    res.cookie('token', '', { ...cookieOptions, maxAge: 0 });

    res.json({message: 'Logged out successfully'});

}





export const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                first_name,
                last_name,
                email,
                role,
                is_archived,
                is_password_changed
            FROM users
            ORDER BY id DESC
        `);

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching users:", error);

        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

// ============================================================
// PUT /api/users/:id
// Update User First Name, Last Name, Email, and Role
// ============================================================
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, role } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, error: "User ID is required." });
    }

    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !role) {
        return res.status(400).json({
            success: false,
            error: "First name, last name, email, and role are required."
        });
    }

    const allowedRoles = ["hro", "hrmpsb", "admin"];
    const normalizedRole = String(role).trim().toLowerCase();

    if (!allowedRoles.includes(normalizedRole)) {
        return res.status(400).json({ success: false, error: "Invalid role provided." });
    }

    try {
        const existingUser = await pool.query(
            "SELECT id, first_name, last_name, email, role FROM users WHERE id = $1",
            [id]
        );

        if (existingUser.rows.length === 0) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        const duplicateEmail = await pool.query(
            "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2",
            [email.trim(), id]
        );

        if (duplicateEmail.rows.length > 0) {
            return res.status(409).json({ success: false, error: "Email is already in use." });
        }

        const updated = await pool.query(
            `UPDATE users
             SET first_name = $1, last_name = $2, email = $3, role = $4
             WHERE id = $5 AND is_archived = FALSE
             RETURNING id, first_name, last_name, email, role, is_password_changed, is_archived`,
            [first_name.trim(), last_name.trim(), email.trim(), normalizedRole, id]
        );

        if (updated.rows.length === 0) {
            return res.status(409).json({ success: false, error: "Archived users cannot be edited." });
        }

        try {
            await createAuditLog({
                ...getAuditContext(req, updated.rows[0]),
                action: "UPDATE",
                module: "USER_MANAGEMENT",
                description: "User account updated successfully.",
                entity_type: "users",
                entity_id: updated.rows[0].id,
                metadata: {
                    previous_first_name: existingUser.rows[0].first_name,
                    previous_last_name: existingUser.rows[0].last_name,
                    previous_email: existingUser.rows[0].email,
                    previous_role: existingUser.rows[0].role,
                    first_name: updated.rows[0].first_name,
                    last_name: updated.rows[0].last_name,
                    email: updated.rows[0].email,
                    role: updated.rows[0].role
                },
                status: "SUCCESS"
            });
        } catch (auditError) {
            console.error("Failed to save user-update audit log:", auditError);
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully.",
            data: updated.rows[0]
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ success: false, error: "Internal server error." });
    }
};


// ============================================================
// PATCH /api/users/:id/archive
// Archive User (Soft Delete)
// ============================================================
export const archiveUser = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, error: "User ID is required." });
    }

    try {
        const result = await pool.query(
            `UPDATE users
             SET is_archived = TRUE
             WHERE id = $1 AND is_archived = FALSE
             RETURNING id, first_name, last_name, email, role, is_archived`,
            [id]
        );

        if (result.rows.length === 0) {
            const existingUser = await pool.query(
                "SELECT id, is_archived FROM users WHERE id = $1",
                [id]
            );

            if (existingUser.rows.length === 0) {
                return res.status(404).json({ success: false, error: "User not found." });
            }

            return res.status(409).json({ success: false, error: "User is already archived." });
        }

        try {
            await createAuditLog({
                ...getAuditContext(req, result.rows[0]),
                action: "ARCHIVE",
                module: "USER_MANAGEMENT",
                description: "User account archived successfully.",
                entity_type: "users",
                entity_id: result.rows[0].id,
                metadata: {
                    first_name: result.rows[0].first_name,
                    last_name: result.rows[0].last_name,
                    email: result.rows[0].email,
                    role: result.rows[0].role,
                    is_archived: true
                },
                status: "SUCCESS"
            });
        } catch (auditError) {
            console.error("Failed to save user-archive audit log:", auditError);
        }

        return res.status(200).json({
            success: true,
            message: "User archived successfully.",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error archiving user:", error);
        return res.status(500).json({ success: false, error: "Internal server error." });
    }
};




export const forgotPassword = async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email address is required.",
        });
    }

    try {
        const userResult = await pool.query(
            `
            SELECT id, first_name, last_name, email, is_archived
            FROM users
            WHERE LOWER(email) = LOWER($1)
            LIMIT 1
            `,
            [email]
        );

        /*
         * Always return the same response whether the account exists
         * or not. This prevents email/account enumeration.
         */
        if (userResult.rows.length === 0) {
            return res.status(200).json({
                success: true,
                message:
                    "If an account with that email exists, a password reset link has been sent.",
            });
        }

        const user = userResult.rows[0];

        // Do not allow archived accounts to reset passwords
        if (user.is_archived) {
            return res.status(200).json({
                success: true,
                message:
                    "If an account with that email exists, a password reset link has been sent.",
            });
        }

        // Generate secure random token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash token before storing it
        const hashedResetToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Token expires after 30 minutes
        const resetExpires = new Date(Date.now() + 30 * 60 * 1000);

        await pool.query(
            `
            UPDATE users
            SET
                reset_password_token = $1,
                reset_password_expires = $2
            WHERE id = $3
            `,
            [
                hashedResetToken,
                resetExpires,
                user.id,
            ]
        );

        /*
         * IMPORTANT:
         * Change this to your actual Vite frontend URL.
         */
        const frontendUrl =
            process.env.FRONTEND_URL || "http://localhost:5173";

        const resetLink =
            `${frontendUrl}/reset-password?token=${resetToken}`;

        try {
            await ForgotPasswordEmail(
                user.email,
                resetLink
            );
        } catch (emailError) {
            console.error(
                "❌ Forgot password email failed:",
                emailError
            );

            /*
             * Clear the token if the email could not be sent.
             */
            await pool.query(
                `
                UPDATE users
                SET
                    reset_password_token = NULL,
                    reset_password_expires = NULL
                WHERE id = $1
                `,
                [user.id]
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to send the password reset email. Please try again later.",
            });
        }

        // Audit log
        try {
            await createAuditLog({
                user_id: user.id,
                username: user.email,
                user_role: null,
                action: "REQUEST_PASSWORD_RESET",
                module: "AUTH",
                description: "Password reset link requested.",
                entity_type: "users",
                entity_id: user.id,
                ip_address:
                    req.ip ||
                    req.headers["x-forwarded-for"]
                        ?.split(",")[0]
                        ?.trim() ||
                    null,
                user_agent: req.get("user-agent") || null,
                metadata: {
                    email: user.email,
                },
                status: "SUCCESS",
            });
        } catch (auditError) {
            console.error(
                "Failed to save forgot-password audit log:",
                auditError
            );
        }

        return res.status(200).json({
            success: true,
            message:
                "If an account with that email exists, a password reset link has been sent.",
        });

    } catch (error) {
        console.error("❌ Forgot password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to process password reset request.",
        });
    }
};



export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Reset token and new password are required.",
        });
    }

    // Password validation
    const passwordRegex =
        /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;

    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            success: false,
            message:
                "Password must contain at least one number and one special character.",
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            success: false,
            message:
                "Password must be at least 8 characters long.",
        });
    }

    try {
        // Hash token received from frontend
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Find valid, non-expired token
        const userResult = await pool.query(
            `
            SELECT
                id,
                email,
                role,
                password,
                is_archived
            FROM users
            WHERE
                reset_password_token = $1
                AND reset_password_expires > NOW()
            LIMIT 1
            `,
            [hashedToken]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "The password reset link is invalid or has expired.",
            });
        }

        const user = userResult.rows[0];

        if (user.is_archived) {
            return res.status(400).json({
                success: false,
                message:
                    "This user account is archived.",
            });
        }

        // Prevent using the current password
        const isSamePassword = await bcrypt.compare(
            newPassword,
            user.password
        );

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Your new password cannot be the same as your current password.",
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        // Update password and invalidate reset token
        const updateResult = await pool.query(
            `
            UPDATE users
            SET
                password = $1,
                is_password_changed = TRUE,
                reset_password_token = NULL,
                reset_password_expires = NULL
            WHERE id = $2
            RETURNING
                id,
                email,
                role,
                is_password_changed
            `,
            [
                hashedPassword,
                user.id,
            ]
        );

        // Audit log
        try {
            await createAuditLog({
                user_id: updateResult.rows[0].id,
                username: updateResult.rows[0].email,
                user_role: updateResult.rows[0].role,
                action: "RESET_PASSWORD",
                module: "AUTH",
                description:
                    "Password was successfully reset using a password reset link.",
                entity_type: "users",
                entity_id: updateResult.rows[0].id,
                ip_address:
                    req.ip ||
                    req.headers["x-forwarded-for"]
                        ?.split(",")[0]
                        ?.trim() ||
                    null,
                user_agent: req.get("user-agent") || null,
                metadata: {
                    email: updateResult.rows[0].email,
                    password_reset: true,
                },
                status: "SUCCESS",
            });
        } catch (auditError) {
            console.error(
                "Failed to save password reset audit log:",
                auditError
            );
        }

        return res.status(200).json({
            success: true,
            message:
                "Password reset successfully. You can now log in with your new password.",
        });

    } catch (error) {
        console.error("❌ Reset password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to reset password.",
        });
    }
};