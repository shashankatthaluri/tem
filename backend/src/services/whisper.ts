import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy",
});

export async function transcribeAudio(filePath: string): Promise<string> {
    // MOCK MODE: Return static text immediately
    return "Mock transcription: 50 dollars for food";

    /* Original Logic 
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error("File not found: " + filePath);
        }

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
            language: "en",
        });

        return transcription.text;
    } catch (error) {
        console.error("Whisper Error:", error);
        throw error;
    }
    */
}
