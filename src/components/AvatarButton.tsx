import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Avatar } from "./Avatar";

export function AvatarButton() {
    const router = useRouter();

    return (
        <Pressable style={styles.wrap} onPress={() => router.push("/user")}>
            <Avatar userId="00000000-0000-0000-0000-000000000001" size={32} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    }
});
