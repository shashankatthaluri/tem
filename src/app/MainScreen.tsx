import { View, StyleSheet } from "react-native";
import { AvatarButton } from "../components/AvatarButton";
import { MonthlyTotal } from "../components/MonthlyTotal";
import { MonthContextLabel } from "../components/MonthContextLabel";
import { InputBar } from "../components/InputBar";
import { ConfirmationPopup } from "../components/ConfirmationPopup";
import { useExpenseStore } from "../store/expenseStore";
import { useEffect, useState } from "react";
import { correctExpense } from "../services/api";

export default function MainScreen() {
    const {
        popupVisible,
        popupMode,
        popupExpenses,
        monthContext,
        setPopupVisible,
        setPopupMode,
        setPopupExpenses,
    } = useExpenseStore();

    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Auto Dismiss Logic
    useEffect(() => {
        // Logic: If added (3500ms), if thanks (1800ms), if selecting (no timer)
        let timer: NodeJS.Timeout;

        if (popupVisible) {
            if (popupMode === 'added') {
                timer = setTimeout(() => setPopupVisible(false), 3500);
            } else if (popupMode === 'thanks') {
                timer = setTimeout(() => setPopupVisible(false), 1800);
            }
        }
        return () => clearTimeout(timer);
    }, [popupVisible, popupMode]);

    // Interaction Handlers
    const handleItemPress = (index: number) => {
        setEditingIndex(index);
        setPopupMode("selecting");
    };

    const handleCategorySelect = async (category: string) => {
        if (editingIndex === null) return;

        // Optimistic Store Update
        const newExpenses = [...popupExpenses];
        if (newExpenses[editingIndex]) {
            const exp = { ...newExpenses[editingIndex] };
            exp.category = category;
            newExpenses[editingIndex] = exp;
            setPopupExpenses(newExpenses);

            setPopupMode("thanks"); // Triggers auto dismiss via effect

            // API
            try {
                await correctExpense(exp.expense_id, category);
            } catch (e) { console.error(e); }
        }
    };

    return (
        <View style={styles.container}>
            <AvatarButton />

            <View style={styles.center}>
                {monthContext !== "current" && (
                    <MonthContextLabel label={monthContext} />
                )}
                <MonthlyTotal />
            </View>

            <InputBar />

            <ConfirmationPopup
                visible={popupVisible}
                mode={popupMode}
                expenses={popupExpenses}
                onItemPress={handleItemPress}
                onCategorySelect={handleCategorySelect}
                selectedCategory={editingIndex !== null ? popupExpenses[editingIndex]?.category : undefined}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
