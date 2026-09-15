import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; 
import pool from "../config/db.js";
import { AccountCreatedEmail } from "./users.email.services.js";

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

export const registerUsers = async (req, res) => {
    const { email, role } = req.body;

    if (!email || !role) {
        return res.status(400).json({ error: 'Email and role are required' });
    }

    const allowedRoles = ['hro', 'hrmpsb', 'admin'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role provided' });
    }

    try {
        const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userExist.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const specialChars = "!@#$%^&*()_+~|}{[]:;?><,./-=";
        const allChars = uppercase + lowercase + numbers + specialChars;

        let passwordArray = [];

        passwordArray.push(uppercase[crypto.randomInt(0, uppercase.length)]);
        passwordArray.push(lowercase[crypto.randomInt(0, lowercase.length)]);
        passwordArray.push(numbers[crypto.randomInt(0, numbers.length)]);
        passwordArray.push(specialChars[crypto.randomInt(0, specialChars.length)]);

        for (let i = 0; i < 8; i++) {
            passwordArray.push(allChars[crypto.randomInt(0, allChars.length)]);
        }

        for (let i = passwordArray.length - 1; i > 0; i--) {
            const j = crypto.randomInt(0, i + 1);
            [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
        }

        const generatedPassword = passwordArray.join('');
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        const newUser = await pool.query(
            'INSERT INTO users (email, password, role) VALUES ($1, $2, $3::character varying) RETURNING email, role, is_password_changed',
            [email, hashedPassword, role]
        );

        let emailStatus = 'SENT';

        try {
            await AccountCreatedEmail(email, generatedPassword);
        } catch (mailError) {
            console.error("❌ Mail delivery failed:", mailError);
            emailStatus = 'FAILED';
        }

        const token = generateToken(newUser.rows[0].email);
        res.cookie('token', token, cookieOptions);
        
        return res.status(201).json({ 
            token,
            user: {
                email: newUser.rows[0].email,
                role: newUser.rows[0].role,
                isPasswordChanged: newUser.rows[0].is_password_changed
            },
            message: emailStatus === 'SENT' 
                ? "User registered successfully and credentials emailed." 
                : "User registered, but welcome email failed to send."
        });

    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({ error: 'Internal server error' });
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
            'UPDATE users SET password = $1, is_password_changed = true WHERE email = $2 RETURNING email, is_password_changed',
            [hashedNewPassword, userEmail]
        );

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
    res.cookie('token', '', { ...cookieOptions, maxAge: 0 });
    res.json({message: 'Logged out successfully'});
}


export const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                email,
                role,
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