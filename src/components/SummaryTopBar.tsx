import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useExpenseStore } from "../store/expenseStore";
import { typography } from "../theme/typography";

export function SummaryTopBar() {
    const router = useRouter();
    const { selectedMonth, openMonthSelector } = useExpenseStore();

    return (
        <View style={styles.wrap}>
            <Pressable onPress={() => router.back()} style={styles.back}>
                <Text style={styles.backText}>←</Text>
            </Pressable>

            <Text style={styles.title}>Summary</Text>

            <Pressable onPress={openMonthSelector}>
                <Text style={styles.month}>{selectedMonth} ▾</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        height: 56,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 12,
    },
    back: {
        padding: 8
    },
    backText: {
        color: "#fff",
        fontSize: 24,
        ...typography.light,
    },
    title: {
        color: "#aaa",
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 1,
        ...typography.regular,
    },
    month: {
        color: "#fff",
        fontSize: 14,
        ...typography.medium,
    },
});
