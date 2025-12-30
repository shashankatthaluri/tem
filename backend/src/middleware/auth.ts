import { Request, Response, NextFunction } from 'express';
import { query } from '../db';

export async function checkSubscription(req: Request, res: Response, next: NextFunction) {
    try {
        // Extract userId from various places (MVP style)
        const userId = req.body.userId || req.query.user_id || req.body.user_id;

        if (!userId) {
            // If we can't identify user, we can't gate them. 
            // For strictness, fail, but for now pass or fail?
            // Let's assume endpoints needing auth will fail on their own missing param.
            // We only gate if we see a user.
            return next();
        }

        const result = await query(
            `SELECT trial_ends_at FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const { trial_ends_at } = result.rows[0];

        // Check if expired
        if (!trial_ends_at || new Date() > new Date(trial_ends_at)) {
            return res.status(402).json({ error: "Payment Required: Trial Expired" });
        }

        next();
    } catch (err) {
        console.error("Subscription check failed:", err);
        // Fail closed or open? Fail closed.
        return res.status(500).json({ error: "Auth Error" });
    }
}
