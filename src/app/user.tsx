import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { typography } from "../theme/typography";
import { Avatar } from "../components/Avatar";

type SubscriptionStatus = "trial" | "monthly" | "lifetime";

interface UserSubscription {
    status: SubscriptionStatus;
    trialDaysLeft?: number;
    nextBillingDate?: string;
    isEarlySupporter?: boolean;
}

export default function UserScreen() {
    const router = useRouter();

    const [subscription, setSubscription] = useState<UserSubscription>({
        status: "trial",
        trialDaysLeft: 12,
    });

    const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);

    const handleUpgrade = (type: 'monthly' | 'lifetime') => {
        setSubscription({
            status: type,
            nextBillingDate: type === 'monthly' ? "Oct 14" : undefined,
            isEarlySupporter: type === 'lifetime'
        });
        setShowUpgradeOptions(false);
        Alert.alert("Success", "Welcome to Tem Premium.");
    };

    const handleLogout = () => {
        router.replace("/");
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </Pressable>
            </View>

            <View style={styles.identity}>
                <Avatar userId="00000000-0000-0000-0000-000000000001" size={72} />
                <View style={{ height: 16 }} />
                <Text style={styles.name}>Shiva</Text>
                <Text style={styles.email}>shiva@example.com</Text>
            </View>

            <View style={styles.subscriptionSection}>
                {subscription.status === "trial" && (
                    <>
                        <Text style={styles.statusText}>Trial: {subscription.trialDaysLeft} days left</Text>

                        {!showUpgradeOptions ? (
                            <Pressable onPress={() => setShowUpgradeOptions(true)}>
                                <Text style={styles.upgradeLink}>Upgrade to support Tem</Text>
                            </Pressable>
                        ) : (
                            <View style={styles.upgradeOptions}>
                                <Pressable onPress={() => handleUpgrade('monthly')} style={styles.optionRow}>
                                    <Text style={styles.optionTitle}>Monthly</Text>
                                    <Text style={styles.optionPrice}>$4.99 / month</Text>
                                    <Text style={styles.optionSub}>Cancel anytime</Text>
                                </Pressable>

                                <Pressable onPress={() => handleUpgrade('lifetime')} style={[styles.optionRow, { marginTop: 20 }]}>
                                    <Text style={styles.optionTitle}>Early supporter</Text>
                                    <Text style={styles.optionPrice}>$49 one-time</Text>
                                    <Text style={styles.optionSub}>Lifetime access</Text>
                                </Pressable>
                            </View>
                        )}
                    </>
                )}

                {subscription.status === "monthly" && (
                    <>
                        <Text style={styles.statusText}>Subscription active</Text>
                        <Text style={styles.subText}>Next billing: {subscription.nextBillingDate}</Text>
                        <Text style={styles.subText}>Cancel anytime</Text>
                        {!showUpgradeOptions && (
                            <Pressable onPress={() => setShowUpgradeOptions(true)}>
                                <Text style={[styles.upgradeLink, { marginTop: 12 }]}>Upgrade to lifetime</Text>
                            </Pressable>
                        )}
                        {showUpgradeOptions && (
                            <Pressable onPress={() => handleUpgrade('lifetime')} style={[styles.optionRow, { marginTop: 20 }]}>
                                <Text style={styles.optionTitle}>Early supporter</Text>
                                <Text style={styles.optionPrice}>$49 one-time</Text>
                                <Text style={styles.optionSub}>Lifetime access</Text>
                            </Pressable>
                        )}
                        <Text style={styles.thanks}>Thanks for supporting Tem ♥</Text>
                    </>
                )}

                {subscription.status === "lifetime" && (
                    <>
                        <Text style={styles.statusText}>Lifetime access</Text>
                        <Text style={styles.subText}>Early supporter</Text>
                        <Text style={styles.thanks}>Thanks for supporting Tem ♥</Text>
                    </>
                )}
            </View>

            <View style={{ flex: 1 }} />

            <View style={styles.actions}>
                <Pressable onPress={() => Alert.alert("Export")}>
                    <Text style={styles.actionText}>Export data</Text>
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
    },
    actionText: {
        color: "#fff",
        fontSize: 15,
        opacity: 0.9,
        ...typography.regular
    },
    logoutBtn: {
        marginTop: 24,
    }
});
