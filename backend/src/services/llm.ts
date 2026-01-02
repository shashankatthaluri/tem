import Groq from 'groq-sdk';

export interface ParsedExpense {
    amount: number;
    currency: string;
    category: string;
    title: string;
    occurred_at: string;
}

export interface ParseResult {
    source: string;
    raw_text: string;
    expenses: ParsedExpense[];
    month_context: string;
}

// Lazy initialization of Groq client (to ensure env vars are loaded)
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
    if (!groqClient) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY environment variable is not set');
        }
        console.log('Initializing Groq client with API key:', apiKey.substring(0, 10) + '...');
        groqClient = new Groq({ apiKey });
    }
    return groqClient;
}

// Valid categories for expense parsing
const VALID_CATEGORIES = [
    'Food', 'Transport', 'Shopping', 'Bills',
    'Entertainment', 'Health', 'Education', 'Travel', 'Misc'
];

// System prompt for expense parsing
const SYSTEM_PROMPT = `You are an expense parser. Extract expense information from natural language input.

RULES:
1. Extract amount, currency, category, and a brief title
2. If multiple expenses mentioned, return them all
3. Default currency is USD if not specified
4. Default category is "Misc" if unclear
5. Title should be 2-4 words describing the expense

CATEGORIES (use exactly these):
${VALID_CATEGORIES.join(', ')}

RESPOND ONLY with valid JSON in this exact format:
{
  "expenses": [
    {
      "amount": 50,
      "currency": "USD",
      "category": "Transport",
      "title": "Uber ride"
    }
  ],
  "month_context": "current"
}

If input mentions a past date like "yesterday" or "last week", still use month_context: "current".
If input mentions a different month like "September rent", use month_context: "September".`;

export async function parseExpenseText(text: string, userId?: string): Promise<ParseResult> {
    console.log("Parsing with Groq LLM:", text);

    try {
        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: text
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.1, // Low temperature for consistent parsing
            max_tokens: 500,
            response_format: { type: "json_object" }
        });

        const responseText = completion.choices[0]?.message?.content || '';
        console.log("Groq response:", responseText);

        // Parse the JSON response
        const parsed = JSON.parse(responseText);

        // Validate and sanitize the response
        const expenses: ParsedExpense[] = (parsed.expenses || []).map((exp: any) => ({
            amount: typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount) || 0,
            currency: exp.currency || 'USD',
            category: VALID_CATEGORIES.includes(exp.category) ? exp.category : 'Misc',
            title: exp.title || 'Expense',
            occurred_at: new Date().toISOString()
        }));

        // If no expenses found, create a fallback
        if (expenses.length === 0) {
            expenses.push({
                amount: 0,
                currency: 'USD',
                category: 'Misc',
                title: 'Unknown expense',
                occurred_at: new Date().toISOString()
            });
        }

        return {
            source: 'groq-llm',
            raw_text: text,
            expenses,
            month_context: parsed.month_context || 'current'
        };

    } catch (error: any) {
        console.error("Groq parsing error:", error);

        // Fallback: Try to extract amount with regex
        const amountMatch = text.match(/(\d+(?:\.\d{2})?)/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

        return {
            source: 'fallback',
            raw_text: text,
            expenses: [{
                amount,
                currency: 'USD',
                category: 'Misc',
                title: text.slice(0, 30),
                occurred_at: new Date().toISOString()
            }],
            month_context: 'current'
        };
    }
}
