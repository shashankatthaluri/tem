import { Router } from "express";
import { parseExpenseText } from "../services/llm";
import { query } from "../db";

const router = Router();

router.post("/parse-expense", async (req, res) => {
    try {
        const { text, userId } = req.body;

        if (!text || !userId) {
            return res.status(400).json({ error: "Missing text or userId" });
        }

        // 1. Parsing
        const parsedData = await parseExpenseText(text);
        parsedData.source = "text";

        // 2. Saving to DB
        // We'll iterate through expenses and save them
        const savedExpenses = [];

        for (const exp of parsedData.expenses) {
            const result = await query(
                `INSERT INTO expenses (user_id, amount, category, description, date) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING id as expense_id`,
                [userId, exp.amount, exp.category, exp.title, exp.occurred_at]
            );

            savedExpenses.push({
                ...exp,
                expense_id: result.rows[0].expense_id
            });
        }

        // 3. Response
        res.json({
            ...parsedData,
            expenses: savedExpenses
        });

    } catch (error) {
        console.error("Parse Error:", error);
        res.status(500).json({ error: "Failed to parse expense" });
    }
});

export default router;
