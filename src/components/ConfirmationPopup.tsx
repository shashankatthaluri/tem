import { Animated, StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useEffect, useRef, useState } from "react";
import React from 'react';
import { ParsedExpenseItem } from "../types/expense";
import { typography } from "../theme/typography";

interface ConfirmationPopupProps {
    visible: boolean;
    expenses: ParsedExpenseItem[];
    mode: "added" | "thanks" | "selecting";
    onItemPress?: (index: number) => void;
    onCategorySelect?: (category: string) => void;
    selectedCategory?: string;
}

const CATEGORIES = [
    'Food', 'Transport', 'Entertainment', 'Shopping',
    'Bills', 'Healthcare', 'Education', 'Travel', 'Misc'
];

export function ConfirmationPopup({ visible, expenses, mode, onItemPress, onCategorySelect, selectedCategory }: ConfirmationPopupProps) {
    const translateY = useRef(new Animated.Value(-20)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const [shouldRender, setShouldRender] = useState(visible);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 220,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: -10,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished) setShouldRender(false);
            });
        }
    }, [visible]);

    if (!shouldRender) return null;

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            <View pointerEvents="auto">
                {mode === "added" && (
                    <>
                        <Text style={styles.title}>Expenses added</Text>
                        {expenses.map((e, i) => (
                            <TouchableOpacity key={i} onPress={() => onItemPress?.(i)} activeOpacity={0.7} style={styles.row}>
                                <View style={styles.checkboxSelected}>
                                    <View style={styles.checkboxInner} />
                                </View>
                                <Text style={styles.item}>
                                    {parseFloat(e.amount.toString()).toLocaleString()} → {e.category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {mode === "selecting" && (
                    <>
                        <Text style={styles.title}>Correct Category</Text>
                        <ScrollView style={styles.scrollList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                            {CATEGORIES.map((cat) => {
                                const isSelected = cat === selectedCategory;
                                return (
                                    <TouchableOpacity key={cat} onPress={() => onCategorySelect?.(cat)} style={styles.row}>
                                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                            {isSelected && <View style={styles.checkboxInner} />}
                                        </View>
                                        <Text style={[styles.item, isSelected && styles.selectedText]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </>
                )}

                {mode === "thanks" && (
                    <Text style={styles.thanks}>Thanks — I’ll remember this.</Text>
                )}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 20,
        marginTop: 40,
        alignSelf: "center",
        backgroundColor: "#F5F5F0",
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 50,
        maxWidth: "85%",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 1000,
        maxHeight: 300,
    },
    title: {
        color: "#000",
        marginBottom: 8,
        opacity: 0.5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: 10,
        ...typography.regular // Assuming regular per theme consistency, though previous was fontWeight 600
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    item: {
        fontSize: 15,
        color: "#000",
        marginLeft: 12,
        ...typography.regular
    },
    selectedText: {
        // fontWeight handled by fontFamily if using regular vs medium
        ...typography.medium
    },
    thanks: {
        fontSize: 14,
        color: "#000",
        textAlign: 'center',
        ...typography.regular
    },
    // Checkbox Styling
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#999',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#000',
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxInner: {
        width: 8,
        height: 8,
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    scrollList: {
        maxHeight: 200,
    },
});
