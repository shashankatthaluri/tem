/**
 * ⚠️ CORE PIPELINE FILE
 * Do NOT modify logic without explicit design approval.
 * UI-only changes must not touch behavior.
 */
import axios from "axios";
import { Platform } from "react-native";

export const API_BASE_URL = "http://192.168.1.110:3000";

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

export async function parseExpense(text: string, userId: string) {
    const response = await api.post("/parse-expense", {
        text,
        userId,
    });
    return response.data;
}

export const sendTextExpense = parseExpense;

export async function sendAudio(
    audioUri: string,
    userId: string
) {
    const formData = new FormData();

    if (Platform.OS === "web") {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        formData.append("audio", blob, "recording.m4a");
    } else {
        formData.append("audio", {
            uri: audioUri,
            name: "recording.m4a",
            type: "audio/m4a",
        } as any);
    }

    formData.append("userId", userId);

    const response = await api.post("/parse-audio", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
}

export async function correctExpense(expenseId: string, correctedCategory: string) {
    const response = await api.post("/correct-expense", {
        expense_id: expenseId,
        corrected_category: correctedCategory,
    });
    return response.data;
}

export async function getExpenses(userId: string, category?: string) {
    const response = await api.get("/expenses", {
        params: { user_id: userId, category }
    });
    return response.data;
}
