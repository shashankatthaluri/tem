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

export async function parseExpenseText(text: string, userId?: string): Promise<ParseResult> {
    console.log("Mock Parsing:", text);

    const amount = Math.floor(Math.random() * 100) + 10;
    const categories = ['Food', 'Transport', 'Misc', 'Shopping'];
    const category = categories[Math.floor(Math.random() * categories.length)];

    return {
        source: 'mock',
        raw_text: text,
        expenses: [
            {
                amount: amount,
                currency: "USD",
                category: category,
                title: "Mock Item",
                occurred_at: new Date().toISOString()
            }
        ],
        month_context: 'current'
    };
}
