/**
 * Category Correction Route
 * 
 * Handles user corrections when LLM predicts wrong category.
 * Records corrections for future model training.
 * 
 * CHANGES:
 * - Enhanced to store original_text and predicted_category for training data
 * - corrected_data now includes full context for fine-tuning
 */

import { Router } from "express";
import { query } from "../db";

const router = Router();

router.post("/correct-expense", async (req, res) => {
    const {
        expense_id,
        corrected_category,
        original_text,      // NEW: The text user spoke/typed
        predicted_category  // NEW: What LLM predicted
    } = req.body;

    if (!expense_id || !corrected_category) {
        return res.status(400).json({ error: "Invalid input" });
    }

    try {
        // 1. Update expense category in database
        await query(
            "UPDATE expenses SET category = $1 WHERE id = $2",
            [corrected_category, expense_id]
        );

        // 2. Store correction for model training
        // This data can be exported later to fine-tune the LLM
        const trainingData = {
            predicted_category: predicted_category || null,
            corrected_category,
            timestamp: new Date().toISOString()
        };

        await query(
            `
            INSERT INTO user_corrections (user_id, expense_id, original_text, corrected_data)
            SELECT user_id, id, $1, $2
            FROM expenses
            WHERE id = $3
            `,
            [original_text || null, trainingData, expense_id]
        );

        console.log(`[Correction] Stored for training: "${original_text}" → ${predicted_category} ➜ ${corrected_category}`);

        return res.json({ success: true });
    } catch (err) {
        console.error("Error correcting expense:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /corrections
 * 
 * Export all corrections for model training.
 * Returns data in a format suitable for fine-tuning.
 */
router.get("/corrections", async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                uc.id,
                uc.original_text,
                uc.corrected_data,
                uc.created_at,
                e.description
            FROM user_corrections uc
            LEFT JOIN expenses e ON uc.expense_id = e.id
            ORDER BY uc.created_at DESC
        `);

        // Format for training
        const trainingData = result.rows.map(row => ({
            id: row.id,
            input_text: row.original_text || row.description,
            predicted_category: row.corrected_data?.predicted_category,
            correct_category: row.corrected_data?.corrected_category,
            timestamp: row.created_at
        })).filter(r => r.input_text && r.correct_category);

        return res.json({
            total: trainingData.length,
            corrections: trainingData
        });
    } catch (err) {
        console.error("Error fetching corrections:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
