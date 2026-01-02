import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { getExpenses, API_BASE_URL } from "../services/api";
import { ParsedExpenseItem } from "../types/expense";
import { Audio } from "expo-av";
import { typography } from "../theme/typography";
import { formatTimestamp } from "../utils/formatTimestamp";
import { AudioWaveform } from "../components/AudioWaveform";
import { useUserStore } from "../store/userStore";

type ExpenseWithAudio = ParsedExpenseItem & { audio_url?: string };

export default function CategoryHistoryScreen() {
    const router = useRouter();
    const { category, month } = useLocalSearchParams<{ category: string, month: string }>();
    const { user } = useUserStore();
    const [expenses, setExpenses] = useState<ExpenseWithAudio[]>([]);
    const [allExpenses, setAllExpenses] = useState<ExpenseWithAudio[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const userId = user?.id || "00000000-0000-0000-0000-000000000001";
                const data = await getExpenses(userId);
                const all = data.expenses || [];

                // Filter by category AND month
                const filtered = all.filter((e: any) => {
                    // Must match category
                    if (e.category !== category) return false;

                    // Filter by month if provided
                    if (month) {
                        // month param is in format "2026-01" from ISO date
                        const expenseDate = new Date(e.occurred_at);
                        const expenseMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
                        if (expenseMonth !== month) return false;
                    }

                    return true;
                });

                // Also filter allExpenses by month for correct totals
                const allFiltered = month ? all.filter((e: any) => {
                    const expenseDate = new Date(e.occurred_at);
                    const expenseMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
                    return expenseMonth === month;
                }) : all;

                setAllExpenses(allFiltered);
                setExpenses(filtered);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        load();

        return () => {
            if (soundRef.current) soundRef.current.unloadAsync();
        };
    }, [category, month]);

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

    const categoryTotal = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
    const grandTotal = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

    const renderItem = ({ item }: { item: ExpenseWithAudio }) => {
        const isPlaying = playingId === item.expense_id;
        const dateStr = formatTimestamp(item.occurred_at);

        return (
            <View style={styles.card}>
                {/* Top row: title | date/time | play button */}
                <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.description || item.title || "Expense"}
                    </Text>

                    <View style={styles.cardRight}>
                        <Text style={styles.timestamp}>{dateStr}</Text>
                        {item.audio_url && (
                            <Pressable
                                onPress={() => togglePlayback(item.audio_url!, item.expense_id)}
                                style={[styles.playBtn, isPlaying && styles.playBtnActive]}
                            >
                                {isPlaying ? (
                                    <AudioWaveform isPlaying={true} color="#666666" barCount={4} />
                                ) : (
                                    <Text style={styles.playIcon}>▶</Text>
                                )}
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Center: Amount (bold, prominent) */}
                <Text style={styles.amount}>
                    ${parseFloat(item.amount.toString()).toLocaleString()}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
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

            {/* Totals side by side */}
            <View style={styles.totalsRow}>
                <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>All expenses</Text>
                    <Text style={styles.totalValueMuted}>${grandTotal.toLocaleString()}</Text>
                </View>
                <View style={styles.totalDivider} />
                <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>{category}</Text>
                    <Text style={styles.totalValue}>${categoryTotal.toLocaleString()}</Text>
                </View>
            </View>

            {/* Expense list */}
            {loading ? <ActivityIndicator color="#fff" style={{ marginTop: 40 }} /> : (
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
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No expenses in this category</Text>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        paddingTop: 50,
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
        color: "#555",
        fontSize: 12,
        marginTop: 2,
        ...typography.light,
    },

    // Totals row (side by side)
    totalsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        paddingHorizontal: 24,
    },
    totalBox: {
        flex: 1,
        alignItems: 'center',
    },
    totalLabel: {
        color: "#555",
        fontSize: 11,
        marginBottom: 4,
        ...typography.light,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    totalValue: {
        color: "#fff",
        fontSize: 28,
        ...typography.medium,
    },
    totalValueMuted: {
        color: "#666",
        fontSize: 22,
        ...typography.regular,
    },
    totalDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#222',
        marginHorizontal: 20,
    },

    // List
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    emptyText: {
        color: "#444",
        fontSize: 14,
        textAlign: 'center',
        marginTop: 40,
        ...typography.light,
    },

    // Card layout
    card: {
        backgroundColor: '#0A0A0A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1A1A1A',
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        color: "#888",
        fontSize: 14,
        flex: 1,
        marginRight: 12,
        ...typography.regular,
    },
    cardRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timestamp: {
        color: "#555",
        fontSize: 11,
        marginRight: 10,
        ...typography.light,
    },
    playBtn: {
        width: 28,
        height: 28,
        backgroundColor: 'rgba(100, 100, 100, 0.15)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playBtnActive: {
        width: 48,
        backgroundColor: 'rgba(100, 100, 100, 0.25)',
    },
    playIcon: {
        color: '#666666',
        fontSize: 9,
    },

    // Amount (center, prominent)
    amount: {
        color: "#fff",
        fontSize: 20,
        textAlign: 'center',
        ...typography.medium,
    },
});
