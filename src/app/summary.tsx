/**
 * Summary Screen
 * 
 * Expense breakdown view with pie chart.
 * - Shows expenses by category
 * - Inline month selector in header
 * - Tap slice to select, tap again to see history
 */

import { View, StyleSheet, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SummaryTopBar } from "../components/SummaryTopBar";
import { ExpensePieChart } from "../components/ExpensePieChart";
import { useExpenseStore } from "../store/expenseStore";
import { useState, useEffect } from "react";
import { typography } from "../theme/typography";

export default function SummaryScreen() {
    const { selectedMonth } = useExpenseStore();
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Reset selection when month changes
    useEffect(() => {
        setSelectedCategory(null);
    }, [selectedMonth]);

    const onSlicePress = (category: string) => {
        if (selectedCategory === category) {
            // Second tap - navigate to category history
            router.push({
                pathname: "/category-history",
                params: { category, month: selectedMonth },
            });
        } else {
            setSelectedCategory(category);
        }
    };

    return (
        <View style={styles.container}>
            <SummaryTopBar />

            <ExpensePieChart
                selectedCategory={selectedCategory}
                onSlicePress={onSlicePress}
                onDeselect={() => setSelectedCategory(null)}
            />

            <Text style={styles.hint}>Tap a slice to see details</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        paddingTop: 40,
    },
    hint: {
        color: "#fff",
        opacity: 0.25,
        fontSize: 12,
        textAlign: "center",
        marginBottom: 40,
        ...typography.light,
    },
});
