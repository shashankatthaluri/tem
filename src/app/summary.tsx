import { View, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { SummaryTopBar } from "../components/SummaryTopBar";
import { ExpensePieChart } from "../components/ExpensePieChart";
import { MonthSelectorSheet } from "../components/MonthSelectorSheet";
import { useExpenseStore } from "../store/expenseStore";
import { useState, useEffect } from "react";
import { typography } from "../theme/typography";

export default function SummaryScreen() {
    const { selectedMonth } = useExpenseStore();
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        setSelectedCategory(null);
    }, [selectedMonth]);

    const onSlicePress = (category: string) => {
        if (selectedCategory === category) {
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
            <ExpensePieChart selectedCategory={selectedCategory} onSlicePress={onSlicePress} />

            <Text style={styles.hint}>Tap a slice to see details</Text>

            <MonthSelectorSheet />
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
        opacity: 0.3,
        fontSize: 12,
        textAlign: "center",
        marginBottom: 40,
        ...typography.light,
    },
});
