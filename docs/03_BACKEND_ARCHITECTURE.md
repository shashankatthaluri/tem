# TEM — Backend Architecture

> Server structure, API design, and database implementation.

---

## Architecture Philosophy

The backend follows a **simple, pragmatic architecture**:
- RESTful API design
- Single responsibility per route file
- Direct database queries (no ORM complexity)
- Stateless authentication ready

---

## Server Structure

```
backend/
├── src/
│   ├── index.ts              # Express entry point
│   ├── db/
│   │   └── index.ts          # PostgreSQL connection & init
│   ├── routes/
│   │   ├── parse.ts          # POST /parse-expense
│   │   ├── parseAudio.ts     # POST /parse-audio
│   │   ├── expenses.ts       # GET /expenses
│   │   ├── correct.ts        # POST /correct-expense
│   │   └── export.ts         # GET /export/excel
│   ├── services/
│   │   ├── whisper.ts        # Speech-to-Text service
│   │   └── llm.ts            # Text parsing service
│   └── middleware/
│       └── auth.ts           # Subscription check middleware
├── uploads/
│   └── audio/                # Stored voice recordings
├── package.json
└── .env                      # Environment configuration
```

---

## Entry Point (index.ts)

```typescript
// Key configuration
const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

// Middleware stack
app.use(limiter);           // Rate limiting first
app.use(cors());            // CORS for mobile/web access
app.use(express.json());    // JSON body parsing
app.use('/audio', express.static(path.join(__dirname, '../uploads/audio')));

// Routes
app.use('/', parseRouter);       // Text parsing
app.use('/', parseAudioRouter);  // Audio parsing
app.use('/', correctionRouter);  // Category corrections
app.use('/', expensesRouter);    // History retrieval
app.use('/', exportRouter);      // Excel export
```

---

## Route Details

### POST `/parse-expense`
**Purpose**: Parse plain text expense input.

**Request**:
```json
{
    "text": "800 dollars restaurant bill",
    "userId": "uuid-here"
}
```

**Response**:
```json
{
    "source": "text",
    "raw_text": "800 dollars restaurant bill",
    "expenses": [
        {
            "expense_id": "generated-uuid",
            "amount": 800,
            "currency": "USD",
            "category": "Food",
            "title": "Restaurant",
            "occurred_at": "2025-01-02T10:30:00.000Z"
        }
    ],
    "month_context": "current"
}
```

**Flow**:
1. Validate input
2. Call LLM service for parsing
3. Insert each expense into database
4. Return complete response with expense IDs

---

### POST `/parse-audio`
**Purpose**: Parse voice input (audio file).

**Request**: `multipart/form-data`
- `audio`: Audio file (.m4a)
- `userId`: User identifier

**Response**: Same format as `/parse-expense` with added `audio_url`.

**Flow**:
1. Receive audio file via Multer
2. Save to `uploads/audio/`
3. Call Whisper service for transcription
4. Call LLM service for parsing
5. Insert to database with audio path
6. Return response with audio URL

---

### GET `/expenses`
**Purpose**: Retrieve expense history.

**Query Parameters**:
- `user_id` (required): User identifier
- `category` (optional): Filter by category

**Response**:
```json
{
    "category": "All Expenses",
    "total": 12400,
    "expenses": [
        {
            "expense_id": "uuid",
            "title": "Restaurant",
            "amount": 800,
            "category": "Food",
            "occurred_at": "2025-01-02T10:30:00.000Z",
            "audio_url": "/audio/audio-123456.m4a"
        }
    ]
}
```

---

### POST `/correct-expense`
**Purpose**: Update expense category and log correction for learning.

**Request**:
```json
{
    "expense_id": "uuid",
    "corrected_category": "Transport"
}
```

**Response**:
```json
{
    "success": true
}
```

**Flow**:
1. Update expense category in database
2. Insert correction record for future AI training
3. Return success

---

### GET `/export/excel`
**Purpose**: Generate and download Excel export.

**Query Parameters**:
- `user_id` (required): User identifier

**Response**: Binary Excel file (`.xlsx`)

**Excel Structure**:
- **Left columns**: Date, Time, Category, Title, Amount, Currency
- **Right columns**: Monthly summary with category breakdowns

---

## Database Layer

### Connection (db/index.ts)

```typescript
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'tem',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
```

### Schema Initialization

Tables are created automatically on server start via `initDB()`:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_ends_at TIMESTAMP,
    currency VARCHAR(3),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Expenses table
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

-- User corrections for learning
CREATE TABLE IF NOT EXISTS user_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    original_text TEXT,
    corrected_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Authentication Middleware

### Trial Check (middleware/auth.ts)

```typescript
export async function checkSubscription(req, res, next) {
    const userId = req.body.userId || req.query.user_id;
    
    if (!userId) return next(); // Can't check without user
    
    const result = await query(
        `SELECT trial_ends_at FROM users WHERE id = $1`,
        [userId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
    }
    
    const { trial_ends_at } = result.rows[0];
    
    if (!trial_ends_at || new Date() > new Date(trial_ends_at)) {
        return res.status(402).json({ error: "Payment Required: Trial Expired" });
    }
    
    next();
}
```

**Note**: Currently not applied to routes (MVP phase). Ready for integration.

---

## File Storage

### Audio Files

- **Location**: `backend/uploads/audio/`
- **Naming**: `audio-{timestamp}-{random}.m4a`
- **Access**: Static files served via `/audio/:filename`
- **Cleanup**: Not implemented (v1.1 consideration)

---

## Security Considerations

### Current Implementation
- ✅ Rate limiting (100 req/15min)
- ✅ CORS enabled
- ✅ Environment variables for secrets

### Future Improvements
- 🔲 JWT authentication
- 🔲 Request validation/sanitization
- 🔲 Audio file size limits
- 🔲 HTTPS enforcement
- 🔲 API key rotation

---

## Error Handling

Standard HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (missing parameters) |
| 402 | Payment Required (trial expired) |
| 404 | Not Found (user not found) |
| 500 | Internal Server Error |

All errors return JSON:
```json
{
    "error": "Human-readable message"
}
```

---

## Development Notes

### Running Locally

```bash
cd backend
npm install
npm run dev
```

### Database Setup

```bash
# Create PostgreSQL database
createdb tem

# Server will auto-initialize tables on first run
```

### Testing Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Parse text expense
curl -X POST http://localhost:3000/parse-expense \
    -H "Content-Type: application/json" \
    -d '{"text": "50 dollars coffee", "userId": "uuid-here"}'
```
