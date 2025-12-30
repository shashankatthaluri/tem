import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

interface PaywallProps {
    visible: boolean;
    onClose: () => void;
}

export function Paywall({ visible, onClose }: PaywallProps) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Extend your trial</Text>
                    <Text style={styles.copy}>
                        If this has helped you, you can keep using it.
                    </Text>

                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>$4.99 / month</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.lifetimeButton]} onPress={onClose}>
                        <Text style={[styles.buttonText, styles.lifetimeText]}>$49 Early Supporter</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>Maybe later</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '85%',
        backgroundColor: '#111',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    copy: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    button: {
        width: '100%',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    lifetimeButton: {
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: '#555',
    },
    lifetimeText: {
        color: '#fff',
    },
    closeButton: {
        marginTop: 10,
        padding: 10,
    },
    closeText: {
        color: '#666',
    },
});
