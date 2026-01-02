/**
 * Authentication Routes
 * 
 * Handles all authentication methods:
 * - Email/Password
 * - Google Sign In
 * - Apple Sign In
 * 
 * Endpoints:
 * - POST /auth/register - Create new user with email/password
 * - POST /auth/login - Authenticate with email/password
 * - POST /auth/google - Authenticate with Google
 * - POST /auth/apple - Authenticate with Apple
 */

import { Router } from "express";
import { query } from "../db";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// ============================================================================
// Email/Password Auth
// ============================================================================

/**
 * Register a new user
 * 
 * Body: { email, password, name }
 * Returns: { user: { id, email, name } }
 */
router.post("/auth/register", async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    try {
        // Check if email already exists
        const existing = await query(
            "SELECT id FROM users WHERE email = $1",
            [email.toLowerCase()]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "Email already registered" });
        }

        // Create new user
        const userId = uuidv4();
        await query(
            `INSERT INTO users (id, email, password, name, subscription_status) 
             VALUES ($1, $2, $3, $4, 'trial')`,
            [userId, email.toLowerCase(), password, name || "User"]
        );

        return res.status(201).json({
            user: {
                id: userId,
                email: email.toLowerCase(),
                name: name || "User"
            }
        });
    } catch (err) {
        console.error("Registration error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * Login existing user
 * 
 * Body: { email, password }
 * Returns: { user: { id, email, name } }
 */
router.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    // Allow social auth users (password can be empty)
    if (!email) {
        return res.status(400).json({ error: "Email required" });
    }

    try {
        const result = await query(
            "SELECT id, email, name, password, auth_provider FROM users WHERE email = $1",
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = result.rows[0];

        // For social auth users, skip password check
        if (user.auth_provider && user.auth_provider !== 'email') {
            return res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            });
        }

        // Password check for email users (in production, use bcrypt)
        if (user.password !== password) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        return res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// ============================================================================
// Google Auth
// ============================================================================

/**
 * Google Sign In
 * 
 * Body: { accessToken }
 * 
 * Flow:
 * 1. Frontend gets access token from Google
 * 2. Backend verifies token and gets user info
 * 3. Create or find user, return session
 */
router.post("/auth/google", async (req, res) => {
    const { accessToken } = req.body;

    if (!accessToken) {
        return res.status(400).json({ error: "Access token required" });
    }

    try {
        // Verify token with Google and get user info
        const googleResponse = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
        );

        if (!googleResponse.ok) {
            return res.status(401).json({ error: "Invalid Google token" });
        }

        const googleUser = await googleResponse.json();
        const { email, name, picture } = googleUser;

        if (!email) {
            return res.status(400).json({ error: "Email not available from Google" });
        }

        // Check if user exists
        const existing = await query(
            "SELECT id, email, name FROM users WHERE email = $1",
            [email.toLowerCase()]
        );

        let user;

        if (existing.rows.length > 0) {
            // User exists, return them
            user = existing.rows[0];
        } else {
            // Create new user
            const userId = uuidv4();
            await query(
                `INSERT INTO users (id, email, name, auth_provider, subscription_status) 
                 VALUES ($1, $2, $3, 'google', 'trial')`,
                [userId, email.toLowerCase(), name || "User"]
            );
            user = { id: userId, email: email.toLowerCase(), name: name || "User" };
        }

        return res.json({ user });
    } catch (err) {
        console.error("Google auth error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// ============================================================================
// Apple Auth
// ============================================================================

/**
 * Apple Sign In
 * 
 * Body: { identityToken, fullName, email }
 * 
 * Note: Apple only provides name/email on FIRST sign-in.
 * Subsequent sign-ins only have identityToken.
 */
router.post("/auth/apple", async (req, res) => {
    const { identityToken, fullName, email } = req.body;

    if (!identityToken) {
        return res.status(400).json({ error: "Identity token required" });
    }

    try {
        // Decode identity token to get user info
        // In production, verify token with Apple's public key
        const parts = identityToken.split('.');
        if (parts.length !== 3) {
            return res.status(401).json({ error: "Invalid Apple token" });
        }

        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        const appleEmail = email || payload.email;
        const appleUserId = payload.sub; // Apple's user ID

        if (!appleEmail) {
            return res.status(400).json({ error: "Email not available from Apple" });
        }

        // Build name from fullName object
        const userName = fullName
            ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() || "User"
            : "User";

        // Check if user exists
        const existing = await query(
            "SELECT id, email, name FROM users WHERE email = $1",
            [appleEmail.toLowerCase()]
        );

        let user;

        if (existing.rows.length > 0) {
            user = existing.rows[0];
        } else {
            // Create new user
            const userId = uuidv4();
            await query(
                `INSERT INTO users (id, email, name, auth_provider, apple_user_id, subscription_status) 
                 VALUES ($1, $2, $3, 'apple', $4, 'trial')`,
                [userId, appleEmail.toLowerCase(), userName, appleUserId]
            );
            user = { id: userId, email: appleEmail.toLowerCase(), name: userName };
        }

        return res.json({ user });
    } catch (err) {
        console.error("Apple auth error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
