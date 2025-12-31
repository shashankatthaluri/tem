import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { AvatarButton } from "../components/AvatarButton";
import { MonthlyTotal } from "../components/MonthlyTotal";
import { MonthContextLabel } from "../components/MonthContextLabel";
import { InputBar } from "../components/InputBar";
import { ConfirmationPopup } from "../components/ConfirmationPopup";
import { useExpenseStore } from "../store/expenseStore";

export default function MainScreen() {
    const router = useRouter();
    const {
        popupVisible,
        popupMode,
        popupExpenses,
        monthContext,
        editingIndex,
        handleItemPress,
        handleCategorySelect
    } = useExpenseStore();

    const handleTotalPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        router.push("/summary");
    };

    return (
        <View style={styles.container}>
            <AvatarButton />

            <View style={styles.center}>
                {monthContext !== "current" && (
                    <MonthContextLabel label={monthContext} />
                )}
                <Pressable onPress={handleTotalPress}>
                    <MonthlyTotal />
                </Pressable>
            </View>

            <InputBar />

            <ConfirmationPopup
                visible={popupVisible}
                mode={popupMode}
                expenses={popupExpenses}
                onItemPress={handleItemPress}
                onCategorySelect={handleCategorySelect}
                selectedCategory={editingIndex !== null ? popupExpenses[editingIndex]?.category : undefined}
            />
        </View>
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
