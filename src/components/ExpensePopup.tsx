import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { correctExpense } from "../services/api";

type Expense = {
    amount: number;
    currency: string;
    category: string;
    expense_id: string; // Needed for correction
};

const CATEGORIES = [
    'Food', 'Transport', 'Entertainment', 'Shopping',
    'Bills', 'Healthcare', 'Education', 'Travel', 'Misc'
];

interface Props {
    expenses: Expense[];
    onInteractionStart?: () => void; // To cancel auto-dismiss in parent
    onFinish?: () => void; // To close popup after correction
}

export function ExpensePopup({ expenses, onInteractionStart, onFinish }: Props) {
    const [items, setItems] = useState(expenses);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleCategoryPress = (index: number) => {
        onInteractionStart?.();
        setEditingIndex(index);
    };

    const handleSelectCategory = async (newCategory: string) => {
        if (editingIndex === null) return;

        const expense = items[editingIndex];
        // Optimistic Update
        const updatedItems = [...items];
        updatedItems[editingIndex] = { ...expense, category: newCategory };
        setItems(updatedItems);
        setEditingIndex(null);
        setFeedback("Thanks — I’ll remember this");

        // Clear feedback after 2s and close
        setTimeout(() => {
            setFeedback(null);
            onFinish?.();
        }, 2000);

        // Backend Call
        try {
            await correctExpense(expense.expense_id, newCategory);
        } catch (err) {
            console.error("Correction failed", err);
            // Revert if needed, but for now we trust optimistic
        }
    };

    if (feedback) {
        return (
            <View style={styles.container}>
                <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
        );
    }

    // If selecting category
    if (editingIndex !== null) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Select Category</Text>
                <ScrollView style={styles.listContainer}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={styles.categoryItem}
                            onPress={() => handleSelectCategory(cat)}
                        >
                            <Text style={styles.categoryText}>
                                {cat === items[editingIndex].category ? "✓ " : "  "} {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    }

    // Default View
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Expenses added</Text>

            {items.map((e, idx) => (
                <TouchableOpacity key={idx} onPress={() => handleCategoryPress(idx)}>
                    <Text style={styles.item}>
                        ✓ {e.currency} {e.amount} → <Text style={styles.categoryHighlight}>{e.category}</Text>
                    </Text>
                </TouchableOpacity>
            ))}
            <Text style={styles.hint}>(Tap to correct)</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 90,
        alignSelf: "center",
        backgroundColor: "#111",
        padding: 16,
        borderRadius: 12,
        minWidth: 250,
    },
    title: {
        color: "#fff",
        fontWeight: "600",
        marginBottom: 8,
    },
    item: {
        color: "#ddd",
        marginTop: 8,
        fontSize: 14,
    },
    categoryHighlight: {
        color: "#4da6ff", // Light blue to indicate interaction
        fontWeight: "bold",
    },
    hint: {
        color: "#666",
        fontSize: 10,
        marginTop: 8,
        textAlign: "right",
    },
    // Feedback
    feedbackText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "500",
    },
    // Category List
    listContainer: {
        maxHeight: 200,
    },
    categoryItem: {
        paddingVertical: 8,
    },
    categoryText: {
        color: "#ddd",
        fontSize: 14,
    },
});
