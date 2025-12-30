import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getExpenses, API_BASE_URL } from '../services/api';
import { Audio } from 'expo-av';
import { ParsedExpenseItem } from '../types/expense';

type ExpenseWithAudio = ParsedExpenseItem & { audio_url?: string };

export default function HistoryScreen() {
    const [expenses, setExpenses] = useState<ExpenseWithAudio[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        loadExpenses();
        return () => {
            stopPlayback();
        };
    }, []);

    async function loadExpenses() {
        try {
            // Hardcoded userId for v1
            const data = await getExpenses("00000000-0000-0000-0000-000000000001");
            setExpenses(data.expenses);
        } catch (err) {
            console.error("Failed to load history", err);
        } finally {
            setLoading(false);
        }
    }

    async function stopPlayback() {
        if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }
        setPlayingId(null);
    }

    async function playAudio(url: string, id: string) {
        try {
            // If already playing this one, stop it
            if (playingId === id) {
                await stopPlayback();
                return;
            }

            // Stop any current playback
            await stopPlayback();

            // Load and play
            const fullUrl = `${API_BASE_URL}${url}`;
            console.log("Playing:", fullUrl);

            const { sound } = await Audio.Sound.createAsync(
                { uri: fullUrl },
                { shouldPlay: true }
            );

            soundRef.current = sound;
            setPlayingId(id);

            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingId(null);
                    sound.unloadAsync();
                    soundRef.current = null;
                }
            });

        } catch (err) {
            console.error("Playback failed", err);
            // Reset state if fail
            setPlayingId(null);
        }
    }

    const renderItem = ({ item }: { item: ExpenseWithAudio }) => {
        const date = item.occurred_at ? new Date(item.occurred_at).toLocaleDateString() : 'Unknown Date';
        const isPlaying = playingId === item.expense_id;

        return (
            <View style={styles.card}>
                <View style={styles.cardLeft}>
                    <Text style={styles.cardTitle}>{item.title || item.category}</Text>
                    <Text style={styles.cardDate}>{date}</Text>
                </View>

                <View style={styles.cardRight}>
                    <Text style={styles.amount}>${item.amount}</Text>

                    {item.audio_url && (
                        <TouchableOpacity
                            style={[styles.playButton, isPlaying && styles.playingButton]}
                            onPress={() => playAudio(item.audio_url!, item.expense_id)}
                        >
                            <Text style={styles.playIcon}>{isPlaying ? "■" : "▶"}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>History</Text>
            <FlatList
                data={expenses}
                keyExtractor={(item) => item.expense_id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Black background as per PRD
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    listContent: {
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    cardLeft: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    cardDate: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    cardRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amount: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
        marginRight: 16,
    },
    playButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playingButton: {
        backgroundColor: '#fff',
    },
    playIcon: {
        color: '#000', // Black icon
        fontSize: 12,
    },
});
