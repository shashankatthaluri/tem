import { create } from 'zustand';
import { ParsedExpenseItem } from '../types/expense';

interface ExpenseState {
    monthlyTotal: number;
    isNewUser: boolean;
    popupVisible: boolean;
    popupMode: "added" | "thanks" | "selecting";
    popupExpenses: ParsedExpenseItem[];
    monthContext: string;
    logsCount: number;

    setPopupVisible: (visible: boolean) => void;
    setPopupMode: (mode: "added" | "thanks" | "selecting") => void;
    setPopupExpenses: (expenses: ParsedExpenseItem[]) => void;
    onParsed: (response: any) => void;
    setMonthlyTotal: (total: number) => void;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
    monthlyTotal: 0,
    isNewUser: true,
    popupVisible: false,
    popupMode: "added",
    popupExpenses: [],
    monthContext: "current",
    logsCount: 0,

    setPopupVisible: (visible) => set({ popupVisible: visible }),
    setPopupMode: (mode) => set({ popupMode: mode }),
    setPopupExpenses: (expenses) => set({ popupExpenses: expenses }),
    setMonthlyTotal: (total) => set({ monthlyTotal: total }),

    onParsed: (response) => {
        const expenses = response.expenses || [];
        const added = expenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);

        const count = get().logsCount + 1;

        set((state) => ({
            monthlyTotal: state.monthlyTotal + added,
            popupExpenses: expenses,
            popupMode: "added",
            popupVisible: true,
            logsCount: count,
            isNewUser: count < 5
        }));
    }
}));
