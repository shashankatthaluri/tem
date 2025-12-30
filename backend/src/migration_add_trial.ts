import { query } from './db';

async function runMigration() {
    try {
        console.log("Adding trial_ends_at column to users table...");
        await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
    `);

        // Set default trial for existing users (e.g., 14 days from created_at or now)
        // For simplicity, let's give existing users 14 days from NOW if null.
        await query(`
        UPDATE users 
        SET trial_ends_at = NOW() + INTERVAL '14 days' 
        WHERE trial_ends_at IS NULL;
    `);

        console.log("Migration successful.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

runMigration();
