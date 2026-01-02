/**
 * User Routes
 * 
 * Handles user profile and trial status endpoints.
 * 
 * Endpoints:
 * - GET /user/:id/status - Get user trial/subscription status
 */

import { Router } from "express";
import { query } from "../db";

const router = Router();

// Trial period in days
const TRIAL_DAYS = 14;

/**
 * Get user trial/subscription status
 * 
 * Returns:
 * - status: 'trial' | 'expired' | 'monthly' | 'lifetime'
 * - trialDaysLeft: number (only if in trial)
 * - isExpired: boolean
 * - canAddExpenses: boolean
 */
router.get("/user/:id/status", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await query(
            "SELECT id, subscription_status, created_at FROM users WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = result.rows[0];
        const subscriptionStatus = user.subscription_status || 'trial';
        const createdAt = new Date(user.created_at);
        const now = new Date();

        // Calculate days since registration
        const daysSinceRegistration = Math.floor(
            (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determine trial status
        const trialDaysLeft = Math.max(0, TRIAL_DAYS - daysSinceRegistration);
        const isTrialExpired = trialDaysLeft === 0 && subscriptionStatus === 'trial';

        // User can add expenses if:
        // - In active trial (days left > 0)
        // - OR has monthly/lifetime subscription
        const canAddExpenses =
            (subscriptionStatus === 'trial' && trialDaysLeft > 0) ||
            subscriptionStatus === 'monthly' ||
            subscriptionStatus === 'lifetime';

        return res.json({
            status: isTrialExpired ? 'expired' : subscriptionStatus,
            trialDaysLeft: subscriptionStatus === 'trial' ? trialDaysLeft : undefined,
            isExpired: isTrialExpired,
            canAddExpenses,
            registeredAt: user.created_at
        });
    } catch (err) {
        console.error("Error fetching user status:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * Update user subscription status
 * 
 * Used when user upgrades to monthly/lifetime
 */
router.post("/user/:id/upgrade", async (req, res) => {
    const { id } = req.params;
    const { subscription } = req.body;

    if (!['monthly', 'lifetime'].includes(subscription)) {
        return res.status(400).json({ error: "Invalid subscription type" });
    }

    try {
        await query(
            "UPDATE users SET subscription_status = $1, updated_at = NOW() WHERE id = $2",
            [subscription, id]
        );

        return res.json({ success: true, subscription });
    } catch (err) {
        console.error("Error upgrading user:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
