-- Create database
CREATE DATABASE tem;

-- Connect to the database
\c tem;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_corrections table
CREATE TABLE IF NOT EXISTS user_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  original_text TEXT,
  corrected_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create a test user for development
INSERT INTO users (id) VALUES ('00000000-0000-0000-0000-000000000001');
