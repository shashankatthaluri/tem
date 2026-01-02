/**
 * User Profile Screen
 * 
 * Shows user info, subscription status, and actions.
 * 
 * Features:
 * - Trial status with countdown
 * - Upgrade options (monthly/lifetime)
 * - Export data
 * - Logout
 * 
 * CHANGES:
 * - Now uses userStore for real trial status from API
 * - Upgrade connects to backend
 */

import { View, Text, StyleSheet, Pressable, Alert, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { File, Directory, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import Svg, { Path as SvgPath } from "react-native-svg";
import { typography } from "../theme/typography";
import { Avatar } from "../components/Avatar";
import { API_BASE_URL } from "../services/api";
import { useUserStore } from "../store/userStore";
import { useExpenseStore } from "../store/expenseStore";


export default function UserScreen() {
    const router = useRouter();
    const { user, status, trialDaysLeft, isExpired, fetchStatus, upgrade, logout } = useUserStore();

    const [exporting, setExporting] = useState(false);
    const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);
    const [upgrading, setUpgrading] = useState(false);

    // Fetch status on mount
    useEffect(() => {
        fetchStatus();
    }, []);

    const handleUpgrade = async (type: 'monthly' | 'lifetime') => {
        setUpgrading(true);
        try {
            await upgrade(type);
            setShowUpgradeOptions(false);
            Alert.alert("Success", "Welcome to Tem Premium.");
        } catch (e) {
            Alert.alert("Error", "Failed to upgrade. Please try again.");
        } finally {
            setUpgrading(false);
        }
    };

    const handleLogout = async () => {
        // Clear expense data first
        useExpenseStore.getState().clearExpenses();
        await logout();
        router.replace("/auth");
    };

    async function handleExport() {
        if (exporting) return;

        setExporting(true);

        try {
            // 🌐 WEB — keep fetch-based download
            if (Platform.OS === "web") {
                const res = await fetch(
                    `${API_BASE_URL}/export/excel?user_id=${user?.id}`
                );

                if (!res.ok) {
                    throw new Error(`Server error: ${res.status}`);
                }

                const blob = await res.blob();

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `tem-expenses-${new Date()
                    .toISOString()
                    .slice(0, 7)}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
                return;
            }

            // 📱 MOBILE — Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert("Export Error", "Sharing is not available on this device.");
                return;
            }

            // Create cache directory for exports if it doesn't exist
            const exportDir = new Directory(Paths.cache, 'exports');
            if (!exportDir.exists) {
                exportDir.create();
            }

            // Download file using new Expo SDK 54 File API
            const downloadedFile = await File.downloadFileAsync(
                `${API_BASE_URL}/export/excel?user_id=${user?.id}`,
                exportDir,
                { idempotent: true } // Overwrite if exists
            );

            // Validate download was successful
            if (!downloadedFile.exists) {
                throw new Error('Download failed: file was not created');
            }

            // Share the file
            await Sharing.shareAsync(downloadedFile.uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Export Expenses',
            });

        } catch (e: any) {
            console.error("Export failed:", e);
            Alert.alert(
                "Export Failed",
                e?.message || "Could not export expenses. Please check your connection and try again."
            );
        } finally {
            setExporting(false);
        }
    }

    // Render subscription status
    const renderSubscriptionStatus = () => {
        if (status === 'trial' && !isExpired) {
            return (
                <>
                    <Text style={styles.statusText}>Trial: {trialDaysLeft} days left</Text>

                    {!showUpgradeOptions ? (
                        <Pressable onPress={() => setShowUpgradeOptions(true)}>
                            <Text style={styles.upgradeLink}>Upgrade to support Tem</Text>
                        </Pressable>
                    ) : (
                        <View style={styles.upgradeOptions}>
                            <Pressable
                                onPress={() => handleUpgrade('monthly')}
                                style={styles.optionRow}
                                disabled={upgrading}
                            >
                                <Text style={styles.optionTitle}>Monthly</Text>
                                <Text style={styles.optionPrice}>$4.99 / month</Text>
                                <Text style={styles.optionSub}>Cancel anytime</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => handleUpgrade('lifetime')}
                                style={[styles.optionRow, { marginTop: 20 }]}
                                disabled={upgrading}
                            >
                                <Text style={styles.optionTitle}>Early supporter</Text>
                                <Text style={styles.optionPrice}>$49 one-time</Text>
                                <Text style={styles.optionSub}>Lifetime access</Text>
                            </Pressable>
                        </View>
                    )}
                </>
            );
        }

        if (status === 'expired' || isExpired) {
            return (
                <>
                    <Text style={styles.statusText}>Trial ended</Text>
                    <Text style={styles.subText}>Upgrade to continue tracking expenses</Text>

                    <View style={styles.upgradeOptions}>
                        <Pressable
                            onPress={() => handleUpgrade('monthly')}
                            style={styles.optionRow}
                            disabled={upgrading}
                        >
                            <Text style={styles.optionTitle}>Monthly</Text>
                            <Text style={styles.optionPrice}>$4.99 / month</Text>
                            <Text style={styles.optionSub}>Cancel anytime</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => handleUpgrade('lifetime')}
                            style={[styles.optionRow, { marginTop: 20 }]}
                            disabled={upgrading}
                        >
                            <Text style={styles.optionTitle}>Early supporter</Text>
                            <Text style={styles.optionPrice}>$49 one-time</Text>
                            <Text style={styles.optionSub}>Lifetime access</Text>
                        </Pressable>
                    </View>
                </>
            );
        }

        if (status === 'monthly') {
            return (
                <>
                    <Text style={styles.statusText}>Subscription active</Text>
                    <Text style={styles.subText}>Cancel anytime</Text>
                    {!showUpgradeOptions && (
                        <Pressable onPress={() => setShowUpgradeOptions(true)}>
                            <Text style={[styles.upgradeLink, { marginTop: 12 }]}>Upgrade to lifetime</Text>
                        </Pressable>
                    )}
                    {showUpgradeOptions && (
                        <Pressable
                            onPress={() => handleUpgrade('lifetime')}
                            style={[styles.optionRow, { marginTop: 20 }]}
                            disabled={upgrading}
                        >
                            <Text style={styles.optionTitle}>Early supporter</Text>
                            <Text style={styles.optionPrice}>$49 one-time</Text>
                            <Text style={styles.optionSub}>Lifetime access</Text>
                        </Pressable>
                    )}
                    <Text style={styles.thanks}>Thanks for supporting Tem ♥</Text>
                </>
            );
        }

        if (status === 'lifetime') {
            return (
                <>
                    <Text style={styles.statusText}>Lifetime access</Text>
                    <Text style={styles.subText}>Early supporter</Text>
                    <Text style={styles.thanks}>Thanks for supporting Tem ♥</Text>
                </>
            );
        }

        return null;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </Pressable>
            </View>

            <View style={styles.identity}>
                <Avatar userId={user?.id || "00000000-0000-0000-0000-000000000001"} size={72} />
                <View style={{ height: 16 }} />
                <Text style={styles.name}>{user?.name || "User"}</Text>
                <Text style={styles.email}>{user?.email || ""}</Text>
            </View>

            <View style={styles.subscriptionSection}>
                {renderSubscriptionStatus()}
            </View>

            <View style={{ flex: 1 }} />

            <View style={styles.actions}>
                <Pressable onPress={handleExport} hitSlop={10} style={styles.exportBtn} disabled={exporting}>
                    {exporting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.exportText}>Export Data</Text>
                    )}
                </Pressable>
                <Pressable onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.actionText}>Log out</Text>
                </Pressable>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        paddingTop: 50,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
        alignItems: 'flex-start'
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    backText: {
        color: "#fff",
        fontSize: 24,
        ...typography.light,
    },
    identity: {
        alignItems: 'center',
        marginBottom: 48,
    },
    name: {
        color: "#fff",
        fontSize: 18,
        marginBottom: 4,
        ...typography.regular,
    },
    email: {
        color: "#666",
        fontSize: 14,
        ...typography.light,
        opacity: 0.5
    },
    subscriptionSection: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    statusText: {
        color: "#fff",
        fontSize: 16,
        marginBottom: 8,
        textAlign: 'center',
        ...typography.regular,
    },
    subText: {
        color: "#888",
        fontSize: 13,
        marginBottom: 4,
        textAlign: 'center',
        ...typography.light
    },
    upgradeLink: {
        color: "#fff",
        fontSize: 14,
        textDecorationLine: 'underline',
        opacity: 0.8,
        ...typography.regular
    },
    upgradeOptions: {
        marginTop: 24,
        width: '100%',
        alignItems: 'center'
    },
    optionRow: {
        alignItems: 'center',
    },
    optionTitle: {
        color: "#fff",
        fontSize: 15,
        marginBottom: 4,
        ...typography.regular
    },
    optionPrice: {
        color: "#ccc",
        fontSize: 14,
        marginBottom: 2,
        ...typography.regular
    },
    optionSub: {
        color: "#666",
        fontSize: 12,
        ...typography.light
    },
    thanks: {
        marginTop: 24,
        color: "#444",
        fontSize: 12,
        ...typography.light
    },
    actions: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20
    },
    exportBtn: {
        padding: 10,
    },
    exportText: {
        color: "#fff",
        fontSize: 15,
        opacity: 0.5,
        ...typography.light,
    },
    actionText: {
        color: "#fff",
        fontSize: 15,
        opacity: 0.5,
        ...typography.light
    },
    logoutBtn: {
        marginTop: 20,
    }
});
