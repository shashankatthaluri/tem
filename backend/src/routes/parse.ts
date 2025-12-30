import { Router, Request, Response } from 'express';
import { parseExpenseText } from '../services/llm';
import { query } from '../db';

const router = Router();

interface ParseExpenseRequest {
    text: string;
    userId: string;
}

interface ParseExpenseResponse {
    amount: number;
    category: string;
    description: string;
    expenseId?: string;
}

router.post('/parse-expense', async (req: Request, res: Response): Promise<void> => {
    try {
        const { text, userId }: ParseExpenseRequest = req.body;

        // Validate input
        if (!text || typeof text !== 'string') {
            res.status(400).json({ error: 'Invalid text input' });
            return;
        }

        if (!userId || typeof userId !== 'string') {
            res.status(400).json({ error: 'Invalid userId' });
            return;
        }

        // Parse the expense using LLM
        const parsed = await parseExpenseText(text);

        // Validate parsed result before saving
        if (!isValidExpense(parsed)) {
            // Fallback to Misc if validation fails
            parsed.category = 'Misc';
        }

        // Save to database
        const result = await query(
            `INSERT INTO expenses (user_id, amount, category, description) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, amount, category, description`,
            [userId, parsed.amount, parsed.category, parsed.description]
        );

        const expense = result.rows[0];

        const response: ParseExpenseResponse = {
            amount: parseFloat(expense.amount),
            category: expense.category,
            description: expense.description,
            expenseId: expense.id
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error in /parse-expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Validation helper
const isValidExpense = (expense: any): boolean => {
    if (typeof expense.amount !== 'number' || expense.amount < 0) {
        return false;
    }
    if (!expense.category || typeof expense.category !== 'string') {
        return false;
    }
    if (!expense.description || typeof expense.description !== 'string') {
        return false;
    }
    return true;
};

export default router;
