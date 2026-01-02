/**
 * Summary Top Bar Component
 * 
 * Header for the summary screen with:
 * - Back button (left top)
 * - "Summary" title (centered)
 * - Month selector (below title, centered)
 * 
 * Design:
 * - Clean stacked layout
 * - Month selector centered below title
 * - Outside click closes dropdown
 */

import { View, Text, Pressable, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useExpenseStore } from "../store/expenseStore";
import { typography } from "../theme/typography";

export function SummaryTopBar() {
    const router = useRouter();
    const { selectedMonth, availableMonths, setSelectedMonth } = useExpenseStore();
    const [showPicker, setShowPicker] = useState(false);

    const handleMonthSelect = (month: string) => {
        setSelectedMonth(month);
        setShowPicker(false);
    };

    const closePicker = () => {
        setShowPicker(false);
    };

    return (
        <>
            {/* Invisible overlay to detect outside clicks */}
            {showPicker && (
                <TouchableWithoutFeedback onPress={closePicker}>
                    <View style={styles.overlay} />
                </TouchableWithoutFeedback>
            )}

            <View style={styles.container}>
                {/* Top row: Back button + Title */}
                <View style={styles.topRow}>
                    <Pressable onPress={() => router.back()} style={styles.back}>
                        <Text style={styles.backText}>←</Text>
                    </Pressable>

                    <Text style={styles.title}>Summary</Text>

                    {/* Empty view for balance */}
                    <View style={styles.placeholder} />
                </View>

                {/* Month selector - below title, centered */}
                <View style={styles.monthRow}>
                    <Pressable onPress={() => setShowPicker(!showPicker)} style={styles.monthBtn}>
                        <Text style={styles.monthText}>{selectedMonth} ▾</Text>
                    </Pressable>

                    {/* Inline dropdown */}
                    {showPicker && (
                        <View style={styles.dropdown}>
                            {availableMonths.map((month) => (
                                <Pressable
                                    key={month}
                                    onPress={() => handleMonthSelect(month)}
                                    style={[
                                        styles.dropdownItem,
                                        month === selectedMonth && styles.dropdownItemActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.dropdownText,
                                        month === selectedMonth && styles.dropdownTextActive
                                    ]}>
                                        {month}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
    },
    container: {
        paddingHorizontal: 16,
        paddingTop: 12,
        zIndex: 100,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: 44,
    },
    back: {
        padding: 8,
    },
    backText: {
        color: "#fff",
        fontSize: 20,
        ...typography.light,
    },
    title: {
        color: "#fff",
        fontSize: 18,
        ...typography.regular,
    },
    placeholder: {
        width: 36, // Same width as back button for balance
    },
    monthRow: {
        alignItems: "center",
        marginTop: 12,
        marginBottom: 8,
        position: 'relative',
    },
    monthBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    monthText: {
        color: "#888",
        fontSize: 14,
        ...typography.regular,
    },
    dropdown: {
        position: 'absolute',
        top: 40,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        paddingVertical: 4,
        minWidth: 120,
        zIndex: 200,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    dropdownItemActive: {
        backgroundColor: '#333',
    },
    dropdownText: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        ...typography.regular,
    },
    dropdownTextActive: {
        color: '#fff',
    },
});
