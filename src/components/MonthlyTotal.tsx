import { Text, StyleSheet } from "react-native";
import { useExpenseStore } from "../store/expenseStore";
import { typography } from "../theme/typography";

export function MonthlyTotal() {
    const { monthlyTotal, isNewUser } = useExpenseStore();

    return (
        <>
            <Text style={styles.total}>{monthlyTotal.toLocaleString()}</Text>
            <Text style={styles.sub}>
                {isNewUser ? "Speak your expenses. We track it." : "Total this month"}
            </Text>
        </>
    );
}

const styles = StyleSheet.create({
    total: {
        color: "#fff",
        fontSize: 48,
        ...typography.medium,
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    sub: {
        marginTop: 8,
        color: "#aaa",
        fontSize: 13,
        ...typography.light,
        textAlign: 'center',
    },
});
