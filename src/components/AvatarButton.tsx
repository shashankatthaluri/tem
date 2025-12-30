import { Pressable, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export function AvatarButton() {
    const router = useRouter();

    return (
        <Pressable style={styles.wrap} onPress={() => router.push("/UserScreen")}>
            <View style={styles.avatar} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: "absolute",
        top: 50, // Adjusted from 12 to 50 for Status Bar (simulated SafeArea) or keep 12 and let Main wrapper handle it? 
        // The prompt says "top: 12, left: 12". "Main Screen scaffold" wrapping logic might not include SafeArea.
        // I will stick to "top: 12" as requested but verify MainScreen has SafeArea. 
        // But "MainScreen" container is just { flex: 1, backgroundColor: #000 }.
        // I'll stick to 12.
        top: 12,
        left: 12,
        zIndex: 10,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#222",
    },
});
