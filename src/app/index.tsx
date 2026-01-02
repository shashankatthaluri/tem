/**
 * App Entry Point
 * 
 * Checks authentication state and routes accordingly:
 * - If logged in → Load expenses, then show MainScreen
 * - If not logged in → Auth screen
 * 
 * Shows loading state while checking auth and loading data.
 * 
 * IMPORTANT: Uses userStore.checkAuth() to properly initialize
 * the store with user data from AsyncStorage, then loads expenses.
 */

import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useUserStore } from "../store/userStore";
import { useExpenseStore } from "../store/expenseStore";
import MainScreen from "./MainScreen";

export default function Index() {
    const router = useRouter();
    const { checkAuth, isLoading, isAuthenticated, user } = useUserStore();
    const { loadExpenses } = useExpenseStore();
    const [initialized, setInitialized] = useState(false);
    const [expensesLoaded, setExpensesLoaded] = useState(false);

    useEffect(() => {
        initializeAuth();
    }, []);

    // Load expenses when user is authenticated
    useEffect(() => {
        if (initialized && isAuthenticated && user?.id && !expensesLoaded) {
            loadExpenses(user.id).then(() => {
                setExpensesLoaded(true);
            });
        }
    }, [initialized, isAuthenticated, user]);

    const initializeAuth = async () => {
        await checkAuth();  // This loads user from AsyncStorage into the store
        setInitialized(true);
    };

    // Wait for auth check to complete
    if (!initialized || isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color="#fff" size="small" />
            </View>
        );
    }

    // If authenticated and user exists, show main screen (expenses load in background)
    if (isAuthenticated && user) {
        return <MainScreen />;
    }

    // Not logged in, redirect to auth
    useEffect(() => {
        if (initialized && !isAuthenticated) {
            router.replace("/auth");
        }
    }, [initialized, isAuthenticated]);

    // Show loading while redirecting
    return (
        <View style={styles.loading}>
            <ActivityIndicator color="#fff" size="small" />
        </View>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
    },
});
