export interface ParsedExpenseItem {
    amount: number;
    currency: string;
    category: string;
    title: string;
    occurred_at?: string;
    expense_id: string;
    // For model training (when user corrects category)
    original_text?: string;      // The text user spoke/typed
    original_category?: string;  // What LLM predicted before correction
}

export interface ParseResponse {
    source: 'voice' | 'text';
    raw_text: string;
    expenses: ParsedExpenseItem[];
    month_context: string;
}
