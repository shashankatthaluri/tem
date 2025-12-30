import { Text, StyleSheet } from "react-native";

export function MonthContextLabel({ label }: { label: string }) {
    return <Text style={styles.label}>{label}</Text>;
}

const styles = StyleSheet.create({
    label: {
        color: "#888",
        fontSize: 12,
        marginBottom: 6,
    },
});
