import { Router } from "express";
import { query } from "../db";

const router = Router();

router.get("/expenses", async (req, res) => {
    try {
        const { user_id, category } = req.query;

        if (!user_id) {
            return res.status(400).json({ error: "Missing user_id" });
        }

        let sql = `
      SELECT id as expense_id, description as title, amount, category, date as occurred_at, audio_path 
      FROM expenses 
      WHERE user_id = $1
    `;
        const params: any[] = [user_id];

        if (category) {
            sql += ` AND category = $2`;
            params.push(category);
        }

        sql += ` ORDER BY date DESC`;

        const result = await query(sql, params);

        // Calculate total
        const total = result.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0);
        const displayCategory = category ? category : "All Expenses";

        return res.json({
            category: displayCategory,
            total,
            expenses: result.rows.map(row => ({
                ...row,
                amount: parseFloat(row.amount), // ensure number
                // Prefix audio_url with server host if needed, or relative is fine if frontend handles it. 
                // Stored as /audio/xyz.m4a. Frontend needs base URL.
                audio_url: row.audio_path
            }))
        });
    } catch (err) {
        console.error("Error fetching expenses:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
