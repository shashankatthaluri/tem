/**
 * Auth Screen
 * 
 * Minimal login/signup screen following our dark, elegant philosophy.
 * 
 * Features:
 * - Email/Password auth
 * - Google Sign In (placeholder for now)
 * - Apple Sign In
 * 
 * Design:
 * - Dark background with clear vertical rhythm
 * - Simple text inputs with bottom borders
 * - Subtle gray text, white for active elements
 * - Social buttons with native feel
 * - ScrollView to handle keyboard without pushing content off screen
 */

import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView, Platform } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { typography } from "../theme/typography";
import { api } from "../services/api";
import { useUserStore } from "../store/userStore";

type AuthMode = "login" | "signup";

export default function AuthScreen() {
    const router = useRouter();
    const { login, register, setUser } = useUserStore();

    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);

    // Check if Apple auth is available (iOS only)
    const [appleAvailable, setAppleAvailable] = useState(false);

    useEffect(() => {
        AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }, []);

    // ========================================
    // Email/Password Auth
    // ========================================

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Required", "Please enter email and password");
            return;
        }

        if (mode === "signup" && !name.trim()) {
            Alert.alert("Required", "Please enter your name");
            return;
        }

        setLoading(true);

        try {
            if (mode === "login") {
                await login(email, password);
            } else {
                await register(email, password, name);
            }
            router.replace("/");
        } catch (error: any) {
            const message = error.response?.data?.error || "Something went wrong";
            Alert.alert("Error", message);
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // Apple Sign In
    // ========================================

    const handleAppleSignIn = async () => {
        setAppleLoading(true);
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            // Send identity token to backend
            const response = await api.post("/auth/apple", {
                identityToken: credential.identityToken,
                fullName: credential.fullName,
                email: credential.email,
            });

            // Store user and navigate
            const user = response.data.user;
            await setUser(user);
            router.replace("/");
        } catch (error: any) {
            if (error.code !== 'ERR_CANCELED') {
                Alert.alert("Error", "Apple sign in failed. Please try again.");
            }
        } finally {
            setAppleLoading(false);
        }
    };

    // ========================================
    // Google Sign In (placeholder)
    // ========================================

    const handleGoogleSignIn = () => {
        Alert.alert("Coming Soon", "Google Sign In will be available soon.");
    };

    const toggleMode = () => {
        setMode(mode === "login" ? "signup" : "login");
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
        >
            {/* App name */}
            <Text style={styles.appName}>tem</Text>
            <Text style={styles.tagline}>speak your expenses</Text>

            {/* Form */}
            <View style={styles.form}>
                {mode === "signup" && (
                    <TextInput
                        style={styles.input}
                        placeholder="Name"
                        placeholderTextColor="#444"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                )}

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#444"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#444"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {/* Submit button */}
                <Pressable
                    onPress={handleSubmit}
                    style={styles.submitBtn}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" size="small" />
                    ) : (
                        <Text style={styles.submitText}>
                            {mode === "login" ? "Login" : "Sign up"}
                        </Text>
                    )}
                </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
            </View>

            {/* Social auth buttons */}
            <View style={styles.socialButtons}>
                {/* Google Sign In */}
                <Pressable
                    onPress={handleGoogleSignIn}
                    style={styles.socialBtn}
                >
                    <Text style={styles.socialText}>Continue with Google</Text>
                </Pressable>

                {/* Apple Sign In (iOS only) */}
                {appleAvailable && (
                    <Pressable
                        onPress={handleAppleSignIn}
                        style={[styles.socialBtn, styles.appleBtn]}
                        disabled={appleLoading}
                    >
                        {appleLoading ? (
                            <ActivityIndicator color="#000" size="small" />
                        ) : (
                            <Text style={styles.appleText}>Continue with Apple</Text>
                        )}
                    </Pressable>
                )}
            </View>

            {/* Toggle mode */}
            <Pressable onPress={toggleMode} style={styles.toggleBtn}>
                <Text style={styles.toggleText}>
                    {mode === "login"
                        ? "New here? Create account"
                        : "Already have an account? Sign in"
                    }
                </Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    appName: {
        color: "#fff",
        fontSize: 48,
        textAlign: "center",
        marginBottom: 4,
        ...typography.light,
        letterSpacing: 4,
    },
    tagline: {
        color: "#444",
        fontSize: 14,
        textAlign: "center",
        marginBottom: 48,
        ...typography.light,
    },
    form: {
        width: "100%",
    },
    input: {
        color: "#fff",
        fontSize: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#222",
        marginBottom: 20,
        ...typography.regular,
    },
    submitBtn: {
        backgroundColor: "#F5F5F0",
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: "center",
        marginTop: 8,
    },
    submitText: {
        color: "#000",
        fontSize: 16,
        ...typography.medium,
    },

    // Divider
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 28,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#222",
    },
    dividerText: {
        color: "#444",
        fontSize: 13,
        marginHorizontal: 16,
        ...typography.light,
    },

    // Social buttons
    socialButtons: {
        gap: 12,
    },
    socialBtn: {
        borderWidth: 1,
        borderColor: "#333",
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: "center",
    },
    socialText: {
        color: "#888",
        fontSize: 15,
        ...typography.regular,
    },
    appleBtn: {
        backgroundColor: "#fff",
        borderColor: "#fff",
    },
    appleText: {
        color: "#000",
        fontSize: 15,
        ...typography.medium,
    },

    // Toggle
    toggleBtn: {
        marginTop: 32,
        alignItems: "center",
    },
    toggleText: {
        color: "#555",
        fontSize: 14,
        ...typography.regular,
    },
});
