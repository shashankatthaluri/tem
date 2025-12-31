import { Slot, SplashScreen } from 'expo-router';
import { useFonts, Inter_300Light, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
    const [fontsLoaded] = useFonts({
        Inter_300Light,
        Inter_400Regular,
        Inter_500Medium,
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <View style={styles.container}>
            <Slot />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
});
