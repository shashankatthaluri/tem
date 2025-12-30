import { query } from './db';

async function runMigration() {
    try {
        console.log("Adding audio_path column to expenses table...");
        await query(`
      ALTER TABLE expenses 
      ADD COLUMN IF NOT EXISTS audio_path TEXT;
    `);
        console.log("Migration successful.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

runMigration();
