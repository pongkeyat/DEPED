import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const getTokenFromRequest = (req) => {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    return req.cookies?.token;
};

export const protect = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({ error: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const userEmail = decoded.email;

        let user;

        if (userId) {
            user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        } else if (userEmail) {
            user = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);
        } else {
            return res.status(401).json({ error: 'Not authorized, invalid token payload' });
        }

        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Not authorized, user not found' });
        }

        req.user = user.rows[0];
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ error: 'Not authorized, token failed' });
    }
};