import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

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
