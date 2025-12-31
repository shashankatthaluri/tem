import { View, StyleSheet } from "react-native";
import { hashString } from "../utils/hash";
import Avatar01 from "../assets/avatars/avatar-01.svg";
import Avatar02 from "../assets/avatars/avatar-02.svg";
import Avatar03 from "../assets/avatars/avatar-03.svg";
import Avatar04 from "../assets/avatars/avatar-04.svg";

const AVATARS = [Avatar01, Avatar02, Avatar03, Avatar04];

interface AvatarProps {
    userId: string;
    size?: number;
}

export function Avatar({ userId, size = 32 }: AvatarProps) {
    const index = hashString(userId) % AVATARS.length;
    const AvatarSvg = AVATARS[index];

    return (
        <View
            style={[
                styles.container,
                { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' },
            ]}
        >
            <AvatarSvg width="100%" height="100%" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#000",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
});
