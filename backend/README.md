# Backend Setup Instructions

## Prerequisites

1. **Install PostgreSQL**
   - Download from: https://www.postgresql.org/download/windows/
   - During installation, remember the password you set for the `postgres` user
   - Default port: 5432

## Database Setup

### Option 1: Using psql command line
```bash
# Open psql as postgres user
psql -U postgres

# Run the init.sql script
\i C:/Users/Shiva/.gemini/antigravity/scratch/tem/backend/init.sql
```

### Option 2: Manual setup
```bash
# Create database
psql -U postgres -c "CREATE DATABASE tem;"

# Run initialization script
psql -U postgres -d tem -f init.sql
```

## Environment Configuration

Update the `.env` file with your PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tem
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

## Running the Backend

```bash
# Development mode (with auto-reload)
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

### POST /parse-expense
Parse expense text and save to database.

**Request:**
```json
{
  "text": "800 dollars restaurant bill",
  "userId": "00000000-0000-0000-0000-000000000001"
}
```

**Response:**
```json
{
  "amount": 800,
  "category": "Food",
  "description": "800 dollars restaurant bill",
  "expenseId": "uuid"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Database Tables

### users
- `id` (UUID, Primary Key)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### expenses
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `amount` (Decimal)
- `category` (String)
- `description` (Text)
- `date` (Timestamp)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### user_corrections
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `expense_id` (UUID, Foreign Key → expenses)
- `original_text` (Text)
- `corrected_data` (JSONB)
- `created_at` (Timestamp)
