export interface ParsedExpenseItem {
    amount: number;
    currency: string;
    category: string;
    title: string;
    occurred_at?: string;
    expense_id: string;
}

export interface ParseResponse {
    source: 'voice' | 'text';
    raw_text: string;
    expenses: ParsedExpenseItem[];
    month_context: string;
}
