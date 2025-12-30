import { Router } from "express";
import { query } from "../db";

const router = Router();

router.post("/correct-expense", async (req, res) => {
    const { expense_id, corrected_category } = req.body;

    if (!expense_id || !corrected_category) {
        return res.status(400).json({ error: "Invalid input" });
    }

    try {
        // 1. Update expense category
        await query(
            "UPDATE expenses SET category = $1 WHERE id = $2",
            [corrected_category, expense_id]
        );

        // 2. Store correction memory
        // Note: SELECT from expenses ensures we get the correct user_id for the record
        await query(
            `
        INSERT INTO user_corrections (user_id, expense_id, corrected_data)
        SELECT user_id, id, $1
        FROM expenses
        WHERE id = $2
        `,
            [{ corrected_category }, expense_id]
        );

        return res.json({ success: true });
    } catch (err) {
        console.error("Error correcting expense:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
