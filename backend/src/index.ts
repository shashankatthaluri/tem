import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Override system env vars with .env file values (MUST be before other imports that use env vars)
dotenv.config({ override: true });

import parseRouter from './routes/parse';
import parseAudioRouter from './routes/parseAudio';
import correctionRouter from './routes/correct';
import expensesRouter from './routes/expenses';
import exportRouter from './routes/export';
import userRouter from './routes/user';
import authRouter from './routes/auth';
import { initDB } from './db';
import path from 'path';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(limiter);
app.use(cors());
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, '../uploads/audio')));

// Routes
app.use('/', parseRouter);
app.use('/', parseAudioRouter);
app.use('/', correctionRouter);
app.use('/', expensesRouter);
app.use('/', exportRouter);
app.use('/', userRouter);
app.use('/', authRouter);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Initialize database and start server
const startServer = async () => {
    try {
        await initDB();
        console.log('Database initialized');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
