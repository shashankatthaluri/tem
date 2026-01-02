import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface AudioWaveformProps {
    isPlaying: boolean;
    color?: string;
    barCount?: number;
}

export function AudioWaveform({
    isPlaying,
    color = '#666666',
    barCount = 4
}: AudioWaveformProps) {
    // Create animated values for each bar (opacity-based for calm feel)
    const animatedValues = useRef(
        Array.from({ length: barCount }, () => new Animated.Value(0.4))
    ).current;

    useEffect(() => {
        if (isPlaying) {
            // Gentle opacity pulse for each bar
            const animations = animatedValues.map((anim, index) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 400 + (index * 100), // Slow, staggered
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim, {
                            toValue: 0.4,
                            duration: 400 + (index * 100),
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ])
                );
            });

            animations.forEach((anim, index) => {
                setTimeout(() => {
                    anim.start();
                }, index * 120);
            });

            return () => {
                animations.forEach(anim => anim.stop());
            };
        } else {
            animatedValues.forEach(anim => {
                Animated.timing(anim, {
                    toValue: 0.4,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            });
        }
    }, [isPlaying]);

    return (
        <View style={styles.container}>
            {animatedValues.map((anim, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.bar,
                        { backgroundColor: color },
                        { opacity: anim }
                    ]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 16,
        gap: 3,
    },
    bar: {
        width: 2,
        height: 12,
        borderRadius: 1,
    },
});
