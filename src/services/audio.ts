/**
 * ⚠️ CORE PIPELINE FILE
 * Do NOT modify logic without explicit design approval.
 * UI-only changes must not touch behavior.
 */
import { Audio } from "expo-av";
import { Platform } from "react-native";

let recording: Audio.Recording | null = null;

export async function startRecording() {
    try {
        console.log("Requesting permissions...");
        const perm = await Audio.requestPermissionsAsync();
        console.log("Permission status:", perm.status);

        if (perm.status !== 'granted') {
            throw new Error('Microphone permission not granted details: ' + JSON.stringify(perm));
        }

        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
        });

        console.log("Starting recording setup...");
        recording = new Audio.Recording();

        // Web Compatibility: specific presets are required or safer
        const options = Platform.OS === 'web'
            ? Audio.RecordingOptionsPresets.HIGH_QUALITY // standard HIGH_QUALITY maps to good defaults on web usually
            : Audio.RecordingOptionsPresets.HIGH_QUALITY;

        try {
            await recording.prepareToRecordAsync(options);
            await recording.startAsync();
            console.log("Recording started");
        } catch (err) {
            console.error("Recording start error:", err);
            // Retry with basic options if High Quality fails (common on some browsers/devices)
            if (Platform.OS === 'web') {
                console.log("Retrying with default web options...");
                recording = new Audio.Recording();
                // Empty options or basic could work better
                await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
                await recording.startAsync();
                console.log("Recording started (fallback)");
            } else {
                throw err;
            }
        }
    } catch (err) {
        console.error("Failed to start recording (internal):", err);
        throw err;
    }
}

export async function stopRecording(): Promise<string | null> {
    if (!recording) return null;

    try {
        console.log("Stopping recording...");
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log("Recording stopped, URI:", uri);
        recording = null;
        return uri;
    } catch (error) {
        console.error("Failed to stop recording", error);
        recording = null;
        return null;
    }
}
