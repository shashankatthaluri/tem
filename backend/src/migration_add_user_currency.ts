import { query } from "./db";

async function run() {
    try {
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD'`);
        console.log("Migration: Added currency to users");
    } catch (e) { console.error(e); }
}
run();
