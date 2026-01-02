/**
 * Trial Expired Banner
 * 
 * Minimal, soft banner shown when trial is expired.
 * Follows the app's dark philosophy: understated, elegant, not intrusive.
 * 
 * Features:
 * - Subtle gray appearance
 * - Simple upgrade prompt
 * - Replaces input bar when trial is expired
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { typography } from "../theme/typography";

export function TrialExpiredBanner() {
    const router = useRouter();

    const handleUpgrade = () => {
        router.push("/user");
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.message}>Trial ended</Text>
                <Pressable onPress={handleUpgrade}>
                    <Text style={styles.upgradeLink}>Upgrade to continue tracking</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        paddingTop: 16,
    },
    content: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    message: {
        color: '#444',
        fontSize: 14,
        marginBottom: 8,
        ...typography.light,
    },
    upgradeLink: {
        color: '#666',
        fontSize: 14,
        textDecorationLine: 'underline',
        ...typography.regular,
    },
});
