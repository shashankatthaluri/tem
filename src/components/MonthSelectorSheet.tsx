import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { useExpenseStore } from "../store/expenseStore";

export function MonthSelectorSheet() {
    const {
        monthSelectorOpen,
        closeMonthSelector,
        availableMonths,
        setSelectedMonth,
    } = useExpenseStore();

    return (
        <Modal visible={monthSelectorOpen} transparent animationType="slide">
            <Pressable style={styles.overlay} onPress={closeMonthSelector}>
                <View style={styles.sheet}>
                    {availableMonths.map((m) => (
                        <Pressable
                            key={m}
                            onPress={() => {
                                setSelectedMonth(m);
                                closeMonthSelector();
                            }}
                        >
                            <Text style={styles.month}>{m}</Text>
                        </Pressable>
                    ))}
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    sheet: {
        backgroundColor: "#111",
        padding: 24,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 40,
    },
    month: {
        color: "#fff",
        fontSize: 16,
        paddingVertical: 16,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#222'
    },
});
