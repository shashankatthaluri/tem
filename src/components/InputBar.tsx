/**
 * InputBar Component
 * 
 * Primary input for expense entry with two modes:
 * 1. Voice: Hold mic to speak, records audio and sends to server
 * 2. Text: Type and press Enter
 * 
 * Uses audio recording which works in Expo Go.
 * 
 * ⚠️ CORE PIPELINE FILE
 * Do NOT modify logic without explicit design approval.
 */

import { View, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, Animated, Easing } from "react-native";
import { useState, useRef, useEffect } from "react";
import { sendTextExpense, sendAudio } from "../services/api";
import { useExpenseStore } from "../store/expenseStore";
import { useUserStore } from "../store/userStore";
import { startRecording, stopRecording } from "../services/audio";

// ============================================================================
// Component
// ============================================================================

export function InputBar() {
    const [text, setText] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const { onParsed } = useExpenseStore();
    const { user } = useUserStore();

    // Get user ID from store
    const userId = user?.id || "00000000-0000-0000-0000-000000000001";

    // Pulse animation for recording
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isRecording) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording, pulseAnim]);

    // Track if recording has actually started to prevent race conditions
    const recordingStarted = useRef(false);

    // ========================================================================
    // Text Submit
    // ========================================================================

    const submit = async () => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            const res = await sendTextExpense(text, userId);
            setText("");
            onParsed(res.expenses || res);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to process expense. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ========================================================================
    // Voice Recording
    // ========================================================================

    const handleMicIn = async () => {
        if (loading || recordingStarted.current) return;

        try {
            recordingStarted.current = true;
            await startRecording();
            setIsRecording(true);
        } catch (e) {
            console.error("Recording start error:", e);
            recordingStarted.current = false;
            Alert.alert("Microphone Error", "Could not start recording. Please check microphone permissions.");
        }
    };

    const handleMicOut = async () => {
        // Only process if recording was actually started
        if (!recordingStarted.current) return;

        recordingStarted.current = false;
        setIsRecording(false);
        setLoading(true);

        try {
            const uri = await stopRecording();
            if (uri) {
                const res = await sendAudio(uri, userId);
                onParsed(res.expenses || res);
            }
        } catch (e) {
            console.error("Recording process error:", e);
            Alert.alert("Error", "Failed to process audio. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <View style={styles.container}>
            <View style={styles.inputWrap}>
                <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder={isRecording ? "Listening…" : "Type or hold mic..."}
                    placeholderTextColor="#666"
                    style={styles.input}
                    onSubmitEditing={submit}
                    editable={!loading && !isRecording}
                />

                <Pressable
                    onPressIn={handleMicIn}
                    onPressOut={handleMicOut}
                    style={[styles.mic, isRecording && styles.micRecording]}
                    disabled={loading}
                >
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        {loading ? (
                            <ActivityIndicator color="#666" />
                        ) : (
                            <View style={[styles.micDot, isRecording && styles.micDotRecording]} />
                        )}
                    </Animated.View>
                </Pressable>
            </View>
        </View>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        padding: 12
    },
    inputWrap: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    input: {
        flex: 1,
        color: "#fff",
        fontSize: 15,
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    mic: {
        marginLeft: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    micDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#666",
    },
    micRecording: {
        borderColor: "rgba(255, 255, 255, 0.4)",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
    micDotRecording: {
        backgroundColor: "#aaa",
    },
});
