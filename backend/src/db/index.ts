import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'tem',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const initDB = async () => {
  try {
    // Create users table with subscription tracking and auth
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        name VARCHAR(255),
        auth_provider VARCHAR(20) DEFAULT 'email',
        apple_user_id VARCHAR(255),
        subscription_status VARCHAR(20) DEFAULT 'trial',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add missing columns if they don't exist (for existing databases)
    // This is needed because CREATE TABLE IF NOT EXISTS doesn't add new columns
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_user_id VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial';
    `).catch(() => { }); // Ignore errors if columns already exist

    // Create expenses table
    await query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        audio_path TEXT,
        date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create user_corrections table
    await query(`
      CREATE TABLE IF NOT EXISTS user_corrections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
        original_text TEXT,
        corrected_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default pool;
