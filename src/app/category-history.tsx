import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { getExpenses, API_BASE_URL } from "../services/api";
import { ParsedExpenseItem } from "../types/expense";
import { Audio } from "expo-av";
import { typography } from "../theme/typography";
import { formatTimestamp } from "../utils/formatTimestamp";

type ExpenseWithAudio = ParsedExpenseItem & { audio_url?: string };

export default function CategoryHistoryScreen() {
    const router = useRouter();
    const { category, month } = useLocalSearchParams<{ category: string, month: string }>();
    const [expenses, setExpenses] = useState<ExpenseWithAudio[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const data = await getExpenses("00000000-0000-0000-0000-000000000001");
                const all = data.expenses || [];
                const filtered = all.filter((e: any) => e.category === category);
                setExpenses(filtered);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        load();

        return () => {
            if (soundRef.current) soundRef.current.unloadAsync();
        };
    }, [category]);

    const togglePlayback = async (url: string, id: string) => {
        if (playingId === id) {
            if (soundRef.current) await soundRef.current.stopAsync();
            setPlayingId(null);
        } else {
            if (soundRef.current) await soundRef.current.unloadAsync();
            try {
                const fullUrl = `${API_BASE_URL}${url}`;
                const { sound } = await Audio.Sound.createAsync({ uri: fullUrl }, { shouldPlay: true });
                soundRef.current = sound;
                setPlayingId(id);
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setPlayingId(null);
                    }
                });
            } catch (e) { console.error(e); }
        }
    };

    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

    const renderItem = ({ item }: { item: ExpenseWithAudio }) => {
        const isPlaying = playingId === item.expense_id;
        const dateStr = formatTimestamp(item.occurred_at);

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{item.description || item.title || "Expense"}</Text>

                    <View style={styles.cardRight}>
                        <Text style={styles.timestamp}>{dateStr}</Text>
                        {item.audio_url && (
                            <Pressable onPress={() => togglePlayback(item.audio_url!, item.expense_id)} style={styles.playBtn}>
                                <Text style={styles.playIcon}>{isPlaying ? "■" : "▶"}</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                <Text style={styles.amount}>
                    {parseFloat(item.amount.toString()).toLocaleString()}
                </Text>

                {isPlaying && (
                    <View style={styles.waveformPlaceholder}>
                        <View style={styles.waveBar} /><View style={styles.waveBar} /><View style={styles.waveBar} />
                        <Text style={styles.playingText}>Playing audio...</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </Pressable>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerCategory}>{category}</Text>
                    <Text style={styles.headerMonth}>{month}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.totalWrap}>
                <Text style={styles.totalText}>
                    {total.toLocaleString()}
                </Text>
            </View>

            {loading ? <ActivityIndicator color="#fff" /> : (
                <FlatList
                    data={expenses}
                    keyExtractor={item => item.expense_id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onScroll={() => {
                        if (playingId && soundRef.current) {
                            soundRef.current.stopAsync();
                            setPlayingId(null);
                        }
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 24,
        justifyContent: 'space-between'
    },
    backBtn: {
        padding: 8,
    },
    backText: {
        color: "#fff",
        fontSize: 24,
        ...typography.light,
    },
    headerTitles: {
        alignItems: 'center',
    },
    headerCategory: {
        color: "#fff",
        fontSize: 16,
        ...typography.regular,
    },
    headerMonth: {
        color: "#666",
        fontSize: 12,
        marginTop: 2,
        ...typography.light,
    },
    totalWrap: {
        alignItems: 'center',
        marginBottom: 32,
    },
    totalText: {
        color: "#fff",
        fontSize: 36,
        ...typography.medium,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    card: {
        marginBottom: 24,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        color: "#fff",
        fontSize: 15,
        ...typography.regular,
    },
    cardRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timestamp: {
        color: "#666",
        fontSize: 12,
        marginRight: 12,
        ...typography.light,
    },
    playBtn: {
        width: 24,
        height: 24,
        backgroundColor: 'rgba(255, 68, 68, 0.2)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        color: '#ff4444',
        fontSize: 10,
        fontWeight: 'bold',
    },
    amount: {
        color: "#fff",
        fontSize: 18,
        ...typography.medium,
        marginTop: 4,
    },
    waveformPlaceholder: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: 0.8
    },
    playingText: {
        color: '#ff4444',
        fontSize: 12,
        marginLeft: 8,
        ...typography.regular
    },
    waveBar: {
        width: 3,
        height: 12,
        backgroundColor: '#ff4444',
        marginRight: 3,
        borderRadius: 2
    }
});
