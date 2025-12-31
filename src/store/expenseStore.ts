import { create } from 'zustand';
import { ParsedExpenseItem } from '../types/expense';
import { correctExpense } from '../services/api';

interface ExpenseState {
    monthlyTotal: number;
    isNewUser: boolean;
    popupVisible: boolean;
    popupMode: "added" | "thanks" | "selecting";
    popupExpenses: ParsedExpenseItem[];
    monthContext: string;
    logsCount: number;
    editingIndex: number | null;

    // Summary Screen State
    categoryTotals: Record<string, number>;
    selectedMonth: string;
    availableMonths: string[];
    monthSelectorOpen: boolean;

    // Actions
    onParsed: (response: any) => void;
    setMonthlyTotal: (total: number) => void;

    // Interaction Actions
    handleItemPress: (index: number) => void;
    handleCategorySelect: (category: string) => Promise<void>;
    dismissPopup: () => void;

    // Summary Actions
    openMonthSelector: () => void;
    closeMonthSelector: () => void;
    setSelectedMonth: (month: string) => void;
}

let dismissTimer: NodeJS.Timeout;

export const useExpenseStore = create<ExpenseState>((set, get) => ({
    monthlyTotal: 0,
    isNewUser: true,
    popupVisible: false,
    popupMode: "added",
    popupExpenses: [],
    monthContext: "current",
    logsCount: 0,
    editingIndex: null,

    // Summary Defaults
    categoryTotals: { 'Food': 4200, 'Transport': 1200, 'Shopping': 3000 },
    selectedMonth: "September",
    availableMonths: ["September", "October", "November"],
    monthSelectorOpen: false,

    setMonthlyTotal: (total) => set({ monthlyTotal: total }),
    dismissPopup: () => set({ popupVisible: false }),

    openMonthSelector: () => set({ monthSelectorOpen: true }),
    closeMonthSelector: () => set({ monthSelectorOpen: false }),
    setSelectedMonth: (month) => set({ selectedMonth: month }),

    onParsed: (response) => {
        // Handle response being array or object with expenses
        const expenses = Array.isArray(response) ? response : (response.expenses || []);

        const added = expenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);
        const count = get().logsCount + 1;

        // Update Totals Logic
        const currentTotals = { ...get().categoryTotals };
        expenses.forEach((e: any) => {
            const cat = e.category || 'Misc';
            currentTotals[cat] = (currentTotals[cat] || 0) + parseFloat(e.amount);
        });

        if (dismissTimer) clearTimeout(dismissTimer);

        // FIX: First-add guard for session-based total
        const currentTotal = get().monthlyTotal;
        const newMonthlyTotal = currentTotal === 0 ? added : currentTotal + added;

        set((state) => ({
            monthlyTotal: newMonthlyTotal,
            popupExpenses: expenses,
            popupMode: "added",
            popupVisible: true,
            logsCount: count,
            isNewUser: count < 5,
            editingIndex: null,
            categoryTotals: currentTotals
        }));

        dismissTimer = setTimeout(() => {
            set({ popupVisible: false });
        }, 3500);
    },

    handleItemPress: (index) => {
        if (dismissTimer) clearTimeout(dismissTimer);
        set({ editingIndex: index, popupMode: "selecting" });
    },

    handleCategorySelect: async (category) => {
        const { editingIndex, popupExpenses } = get();
        if (editingIndex === null) return;

        const newExpenses = [...popupExpenses];
        const expense = { ...newExpenses[editingIndex] };

        expense.category = category;
        newExpenses[editingIndex] = expense;

        set({
            popupExpenses: newExpenses,
            popupMode: "thanks"
        });

        try {
            await correctExpense(expense.expense_id, category);
        } catch (e) { console.error(e); }

        if (dismissTimer) clearTimeout(dismissTimer);
        dismissTimer = setTimeout(() => {
            set({ popupVisible: false });
        }, 1800);
    }
}));
