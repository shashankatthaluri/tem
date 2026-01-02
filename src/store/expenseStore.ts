/**
 * Expense Store
 * 
 * Central state management for expense tracking.
 * 
 * CHANGES:
 * - Refactored to track expenses per month (monthlyData structure)
 * - Expenses reset to 0 for new months
 * - Added selectors for month-specific data
 * 
 * ⚠️ CORE PIPELINE FILE
 * Do NOT modify logic without explicit design approval.
 */
import { create } from 'zustand';
import { ParsedExpenseItem } from '../types/expense';
import { correctExpense } from '../services/api';

// ============================================================================
// Month Helpers
// ============================================================================

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Get current month in short format (e.g., "Jan 2026")
 */
function getCurrentMonthShort(): string {
    const now = new Date();
    return `${SHORT_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Get list of recent months (current + past 5 months)
 */
function getRecentMonths(): string[] {
    const months: string[] = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`);
    }

    return months;
}

// ============================================================================
// Types
// ============================================================================

interface MonthData {
    total: number;
    categories: Record<string, number>;
}

interface ExpenseState {
    // Per-month expense data
    monthlyData: Record<string, MonthData>;
    currentMonth: string;

    // UI State
    isNewUser: boolean;
    popupVisible: boolean;
    popupMode: "added" | "thanks" | "selecting";
    popupExpenses: ParsedExpenseItem[];
    monthContext: string;
    logsCount: number;
    editingIndex: number | null;

    // Summary Screen State
    selectedMonth: string;
    availableMonths: string[];
    monthSelectorOpen: boolean;

    // Actions
    onParsed: (response: any) => void;
    setMonthlyTotal: (total: number) => void;
    loadExpenses: (userId: string) => Promise<void>;  // Load from API

    // Interaction Actions
    handleItemPress: (index: number) => void;
    handleCategorySelect: (category: string) => Promise<void>;
    dismissPopup: () => void;

    // Summary Actions
    openMonthSelector: () => void;
    closeMonthSelector: () => void;
    setSelectedMonth: (month: string) => void;

    // Reset action (for logout)
    clearExpenses: () => void;
}

let dismissTimer: NodeJS.Timeout;

const currentMonth = getCurrentMonthShort();

export const useExpenseStore = create<ExpenseState>((set, get) => ({
    // Initialize with empty data for current month
    monthlyData: {
        [currentMonth]: { total: 0, categories: {} }
    },
    currentMonth,

    isNewUser: true,
    popupVisible: false,
    popupMode: "added",
    popupExpenses: [],
    monthContext: "current",
    logsCount: 0,
    editingIndex: null,

    // Summary State
    selectedMonth: currentMonth,
    availableMonths: getRecentMonths(),
    monthSelectorOpen: false,

    setMonthlyTotal: (total) => {
        const month = get().currentMonth;
        set((state) => ({
            monthlyData: {
                ...state.monthlyData,
                [month]: {
                    ...state.monthlyData[month],
                    total
                }
            }
        }));
    },

    // Load expenses from API and populate store
    loadExpenses: async (userId) => {
        try {
            const { getExpenses } = await import('../services/api');
            const data = await getExpenses(userId);
            const expenses = data.expenses || [];

            if (expenses.length === 0) {
                // No expenses, reset to empty
                set({
                    monthlyData: {
                        [currentMonth]: { total: 0, categories: {} }
                    },
                    isNewUser: true,
                    logsCount: 0,
                });
                return;
            }

            // Group expenses by month and calculate totals
            const monthlyData: Record<string, { total: number; categories: Record<string, number> }> = {};

            expenses.forEach((e: any) => {
                // Parse the date to get month
                const expenseDate = new Date(e.occurred_at);
                const monthKey = `${SHORT_MONTHS[expenseDate.getMonth()]} ${expenseDate.getFullYear()}`;

                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { total: 0, categories: {} };
                }

                const amount = parseFloat(e.amount) || 0;
                const category = e.category || 'Misc';

                monthlyData[monthKey].total += amount;
                monthlyData[monthKey].categories[category] =
                    (monthlyData[monthKey].categories[category] || 0) + amount;
            });

            // Ensure current month exists
            if (!monthlyData[currentMonth]) {
                monthlyData[currentMonth] = { total: 0, categories: {} };
            }

            set({
                monthlyData,
                isNewUser: expenses.length < 5,
                logsCount: expenses.length,
            });

            console.log('Loaded expenses:', expenses.length, 'Monthly data:', Object.keys(monthlyData));
        } catch (error) {
            console.error('Failed to load expenses:', error);
        }
    },

    dismissPopup: () => set({ popupVisible: false }),

    openMonthSelector: () => set({ monthSelectorOpen: true }),
    closeMonthSelector: () => set({ monthSelectorOpen: false }),
    setSelectedMonth: (month) => set({ selectedMonth: month }),

    onParsed: (response) => {
        // Handle response being array or object with expenses
        const rawExpenses = Array.isArray(response) ? response : (response.expenses || []);
        const rawText = response.raw_text || '';  // Original text from voice/keyboard

        // Enhance expenses with original category for training
        const expenses = rawExpenses.map((e: any) => ({
            ...e,
            original_category: e.category,  // Store LLM prediction for training
            original_text: rawText || e.title  // Store input text for training
        }));

        const added = expenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);
        const count = get().logsCount + 1;
        const month = get().currentMonth;

        // Get or create month data
        const currentMonthData = get().monthlyData[month] || { total: 0, categories: {} };
        const newCategories = { ...currentMonthData.categories };

        // Update category totals for current month
        expenses.forEach((e: any) => {
            const cat = e.category || 'Misc';
            newCategories[cat] = (newCategories[cat] || 0) + parseFloat(e.amount);
        });

        const newTotal = currentMonthData.total + added;

        if (dismissTimer) clearTimeout(dismissTimer);

        set((state) => ({
            monthlyData: {
                ...state.monthlyData,
                [month]: {
                    total: newTotal,
                    categories: newCategories
                }
            },
            popupExpenses: expenses,
            popupMode: "added",
            popupVisible: true,
            logsCount: count,
            isNewUser: count < 5,
            editingIndex: null,
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

        // Store original category before changing (for training)
        const originalCategory = expense.original_category || expense.category;
        const originalText = expense.original_text || expense.title;

        expense.category = category;
        newExpenses[editingIndex] = expense;

        set({
            popupExpenses: newExpenses,
            popupMode: "thanks"
        });

        try {
            // Send correction with training data
            await correctExpense(
                expense.expense_id,
                category,
                originalText,      // What user typed/spoke
                originalCategory   // What LLM predicted
            );
        } catch (e) { console.error(e); }

        if (dismissTimer) clearTimeout(dismissTimer);
        dismissTimer = setTimeout(() => {
            set({ popupVisible: false });
        }, 1800);
    },

    // Reset all expense data (used on logout)
    clearExpenses: () => {
        const month = getCurrentMonthShort();
        set({
            monthlyData: {
                [month]: { total: 0, categories: {} }
            },
            currentMonth: month,
            popupVisible: false,
            popupExpenses: [],
            logsCount: 0,
            editingIndex: null,
            selectedMonth: month,
        });
    }
}));

// ============================================================================
// Selectors (for derived state)
// ============================================================================

// Stable fallback references to prevent infinite re-renders
const EMPTY_CATEGORIES: Record<string, number> = {};

/**
 * Get monthly total for the selected month
 */
export function useMonthlyTotal(): number {
    return useExpenseStore((state) => {
        const data = state.monthlyData[state.selectedMonth];
        return data?.total ?? 0;
    });
}

/**
 * Get category totals for the selected month
 * Uses stable fallback reference to prevent infinite re-renders
 */
export function useCategoryTotals(): Record<string, number> {
    return useExpenseStore((state) => {
        const data = state.monthlyData[state.selectedMonth];
        // IMPORTANT: Return stable reference, not new object
        return data?.categories ?? EMPTY_CATEGORIES;
    });
}

/**
 * Get monthly total for the current month (for main screen)
 */
export function useCurrentMonthTotal(): number {
    return useExpenseStore((state) => {
        const data = state.monthlyData[state.currentMonth];
        return data?.total ?? 0;
    });
}

