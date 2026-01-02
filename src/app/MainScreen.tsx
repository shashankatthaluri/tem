/**
 * Main Screen
 * 
 * Primary expense entry screen with:
 * - Avatar button (top left)
 * - Monthly total (center, tappable to go to summary)
 * - Input bar (bottom, for text/voice entry) OR Trial expired banner
 * - Confirmation popup (appears after adding expense)
 * 
 * Trial System:
 * - Checks trial status on mount
 * - If expired, shows TrialExpiredBanner instead of InputBar
 * - User can still tap to view summary/history (read-only)
 * 
 * ⚠️ CORE PIPELINE FILE
 * Do NOT modify logic without explicit design approval.
 */

import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import * as Haptics from "expo-haptics";
import { AvatarButton } from "../components/AvatarButton";
import { MonthlyTotal } from "../components/MonthlyTotal";
import { MonthContextLabel } from "../components/MonthContextLabel";
import { InputBar } from "../components/InputBar";
import { TrialExpiredBanner } from "../components/TrialExpiredBanner";
import { ConfirmationPopup } from "../components/ConfirmationPopup";
import { useExpenseStore } from "../store/expenseStore";
import { useUserStore } from "../store/userStore";

export default function MainScreen() {
    const router = useRouter();

    // Expense state
    const {
        popupVisible,
        popupMode,
        popupExpenses,
        monthContext,
        editingIndex,
        handleItemPress,
        handleCategorySelect
    } = useExpenseStore();

    // User/trial state
    const { canAddExpenses, fetchStatus } = useUserStore();

    // Check trial status on mount
    useEffect(() => {
        fetchStatus();
    }, []);

    const handleTotalPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        router.push("/summary");
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <AvatarButton />

            <View style={styles.center}>
                {monthContext !== "current" && (
                    <MonthContextLabel label={monthContext} />
                )}
                <Pressable onPress={handleTotalPress}>
                    <MonthlyTotal />
                </Pressable>
            </View>

            {/* Show InputBar if trial active, TrialExpiredBanner if expired */}
            {canAddExpenses ? <InputBar /> : <TrialExpiredBanner />}

            <ConfirmationPopup
                visible={popupVisible}
                mode={popupMode}
                expenses={popupExpenses}
                onItemPress={handleItemPress}
                onCategorySelect={handleCategorySelect}
                selectedCategory={editingIndex !== null ? popupExpenses[editingIndex]?.category : undefined}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
