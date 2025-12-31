import { View, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useState } from "react";
import { sendTextExpense, sendAudio } from "../services/api";
import { useExpenseStore } from "../store/expenseStore";
import { startRecording, stopRecording } from "../services/audio";

const USER_ID = "00000000-0000-0000-0000-000000000001";

export function InputBar() {
    const [text, setText] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const { onParsed } = useExpenseStore();

    const submit = async () => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            const res = await sendTextExpense(text, USER_ID);
            setText("");
            // API returns { expenses: [...] } object, so we extract expenses
            onParsed(res.expenses || res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleMicIn = async () => {
        try {
            await startRecording();
            setIsRecording(true);
        } catch (e) {
            console.error(e);
        }
    };

    const handleMicOut = async () => {
        if (!isRecording) return;
        setIsRecording(false);
        setLoading(true);
        try {
            const uri = await stopRecording();
            if (uri) {
                const res = await sendAudio(uri, USER_ID);
                // API returns { expenses: [...] } object, so we extract expenses
                onParsed(res.expenses || res);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputWrap}>
                <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder={isRecording ? "Listening…" : "Ask anything"}
                    placeholderTextColor="#666"
                    style={styles.input}
                    onSubmitEditing={submit}
                    editable={!loading && !isRecording}
                />

                <Pressable
                    onPressIn={handleMicIn}
                    onPressOut={handleMicOut}
                    style={styles.mic}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#666" />
                    ) : (
                        <View style={styles.micDot} />
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 12 },
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
});
