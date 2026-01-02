/**
 * Confirmation Popup
 * 
 * Shows expense confirmation with three modes:
 * - "added": Shows added expenses with checkboxes
 * - "selecting": Category selection grid
 * - "thanks": Confirmation message
 * 
 * Design:
 * - Single expense: Pill shape (high border radius)
 * - Multiple expenses: Rounded card (lower border radius)
 * - Scrollable when content exceeds max height
 * 
 * ⚠️ CORE PIPELINE FILE
 * Do NOT modify logic without explicit design approval.
 */
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

    // Dynamic border radius based on content
    // Single item or thanks = pill (high radius)
    // Multiple items or category list = rounded card (lower radius)
    const isCompact = (mode === "added" && expenses.length <= 1) || mode === "thanks";
    const borderRadius = isCompact ? 28 : 20;

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                    borderRadius,
                },
            ]}
        >
            <View pointerEvents="auto" style={styles.content}>
                {mode === "added" && (
                    <>
                        <Text style={styles.title}>Added</Text>
                        <ScrollView
                            style={styles.scrollList}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {expenses.map((e, i) => (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => onItemPress?.(i)}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.row,
                                        i === expenses.length - 1 && styles.lastRow
                                    ]}
                                >
                                    <View style={styles.checkboxSelected}>
                                        <View style={styles.checkboxInner} />
                                    </View>
                                    <View style={styles.itemContent}>
                                        <Text style={styles.item} numberOfLines={1}>
                                            ${parseFloat(e.amount.toString()).toLocaleString()} · {e.category}
                                        </Text>
                                        {e.title && e.title !== 'Mock Item' && (
                                            <Text style={styles.itemTitle} numberOfLines={1}>
                                                {e.title}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        {expenses.length > 1 && (
                            <Text style={styles.tapHint}>Tap to change category</Text>
                        )}
                    </>
                )}

                {mode === "selecting" && (
                    <>
                        <Text style={styles.title}>Correct Category</Text>
                        <ScrollView
                            style={styles.categoryList}
                            nestedScrollEnabled
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {CATEGORIES.map((cat, i) => {
                                const isSelected = cat === selectedCategory;
                                return (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => onCategorySelect?.(cat)}
                                        style={[
                                            styles.row,
                                            i === CATEGORIES.length - 1 && styles.lastRow
                                        ]}
                                    >
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
                    <Text style={styles.thanks}>Thanks — I'll remember this.</Text>
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
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
        zIndex: 1000,
        minWidth: 220,
        maxWidth: "88%",
        overflow: "hidden",
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    title: {
        color: "#000",
        marginBottom: 10,
        opacity: 0.45,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: 10,
        ...typography.medium,
    },
    scrollList: {
        maxHeight: 180,
    },
    categoryList: {
        maxHeight: 220,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    lastRow: {
        borderBottomWidth: 0,
    },
    item: {
        fontSize: 15,
        color: "#000",
        ...typography.regular,
        marginLeft: 12,
    },
    itemContent: {
        marginLeft: 12,
        flex: 1,
    },
    itemTitle: {
        fontSize: 12,
        color: "#888",
        marginTop: 2,
        ...typography.light,
    },
    selectedText: {
        ...typography.medium,
    },
    thanks: {
        fontSize: 15,
        color: "#000",
        textAlign: 'center',
        paddingVertical: 4,
        ...typography.regular,
    },
    tapHint: {
        fontSize: 11,
        color: "#999",
        textAlign: 'center',
        marginTop: 8,
        ...typography.light,
    },
    // Checkbox Styling
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#bbb',
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
});
