import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { transcribeAudio } from "../services/whisper";
import { parseExpenseText } from "../services/llm";
import { query } from "../db";

const router = Router();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../../uploads/audio");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || ".m4a";
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
});

const upload = multer({ storage });

router.post("/parse-audio", upload.single("audio"), async (req, res) => {
    try {
        console.log("Audio Request Recieved");
        console.log("Body:", req.body);
        console.log("File:", req.file);

        const file = req.file;
        const { userId } = req.body;

        if (!file || !userId) {
            return res.status(400).json({ error: "Missing audio file or userId" });
        }

        // 1. Transcribe
        const text = await transcribeAudio(file.path);

        // 2. Parse
        const parsedData = await parseExpenseText(text);
        parsedData.source = "voice";

        // 3. Save to DB
        const savedExpenses = [];
        // Store relative path for frontend access e.g. /audio/filename.m4a
        // The static middleware routes /audio to uploads/audio
        const publicAudioPath = `/audio/${file.filename}`;

        for (const exp of parsedData.expenses) {
            const result = await query(
                `INSERT INTO expenses (user_id, amount, category, description, date, audio_path) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING id as expense_id`,
                [userId, exp.amount, exp.category, exp.title, exp.occurred_at, publicAudioPath]
            );

            savedExpenses.push({
                ...exp,
                expense_id: result.rows[0].expense_id,
                audio_url: publicAudioPath // For immediate frontend playback
            });
        }

        res.json({
            ...parsedData,
            expenses: savedExpenses
        });

    } catch (error) {
        console.error("Audio Processing Error:", error);
        res.status(500).json({ error: "Failed to process audio" });
    }
});

export default router;
