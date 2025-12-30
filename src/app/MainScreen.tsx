import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { parseExpense } from "../services/api";

async function handleTest() {
    try {
        const result = await parseExpense(
            "800 dollars restaurant bill",
            "00000000-0000-0000-0000-000000000001"
        );
        console.log("Parsed expense:", result);
    } catch (err) {
        console.error(err);
    }
}

export default function MainScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Main Screen</Text>
            <Button title="Test Parse Expense" onPress={handleTest} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
});
