interface ParsedExpense {
    amount: number;
    category: string;
    description: string;
}

const EXPENSE_CATEGORIES = [
    'Food',
    'Transport',
    'Entertainment',
    'Shopping',
    'Bills',
    'Healthcare',
    'Education',
    'Travel',
    'Misc'
];

export const parseExpenseText = async (text: string): Promise<ParsedExpense> => {
    try {
        // TODO: Integrate with actual LLM API (OpenAI, Anthropic, etc.)
        // For now, using simple parsing logic

        const parsed = simpleParser(text);

        // Validate the parsed result
        if (!isValidParsedExpense(parsed)) {
            return {
                amount: 0,
                category: 'Misc',
                description: text
            };
        }

        return parsed;
    } catch (error) {
        console.error('Error parsing expense:', error);
        // Fallback to Misc
        return {
            amount: 0,
            category: 'Misc',
            description: text
        };
    }
};

// Simple parser (placeholder for LLM integration)
const simpleParser = (text: string): ParsedExpense => {
    const lowerText = text.toLowerCase();

    // Extract amount
    const amountMatch = text.match(/(\d+(?:\.\d{2})?)\s*(?:dollars?|usd|\$|rupees?|inr|₹)?/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // Detect category
    let category = 'Misc';
    if (lowerText.includes('restaurant') || lowerText.includes('food') || lowerText.includes('lunch') || lowerText.includes('dinner')) {
        category = 'Food';
    } else if (lowerText.includes('uber') || lowerText.includes('taxi') || lowerText.includes('transport')) {
        category = 'Transport';
    } else if (lowerText.includes('movie') || lowerText.includes('entertainment')) {
        category = 'Entertainment';
    } else if (lowerText.includes('shopping') || lowerText.includes('clothes')) {
        category = 'Shopping';
    } else if (lowerText.includes('bill') || lowerText.includes('electricity') || lowerText.includes('water')) {
        category = 'Bills';
    }

    return {
        amount,
        category,
        description: text
    };
};

// Validation function
const isValidParsedExpense = (parsed: ParsedExpense): boolean => {
    if (typeof parsed.amount !== 'number' || parsed.amount < 0) {
        return false;
    }

    if (!parsed.category || typeof parsed.category !== 'string') {
        return false;
    }

    if (!EXPENSE_CATEGORIES.includes(parsed.category)) {
        return false;
    }

    if (!parsed.description || typeof parsed.description !== 'string') {
        return false;
    }

    return true;
};
