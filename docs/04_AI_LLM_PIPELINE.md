# TEM — AI/LLM Pipeline

> Voice processing, expense parsing, and the learning system.

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           INTELLIGENCE PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐ │
│   │  Voice   │───▶│   Whisper    │───▶│   GPT-4o     │───▶│ Database │ │
│   │  Input   │    │   (STT)      │    │   (Parser)   │    │   Save   │ │
│   └──────────┘    └──────────────┘    └──────────────┘    └──────────┘ │
│        │                                                                  │
│        │          ┌──────────────────────────────────────────────────┐   │
│        └─────────▶│ Direct text input (skip Whisper)                │   │
│                   └──────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Principle

> **Frontend never:**
> - Transcribes audio
> - Calls LLMs
> - Stores API keys

All intelligence processing happens exclusively on the backend.

---

## Speech-to-Text (Whisper)

### Service Location
`backend/src/services/whisper.ts`

### Production Implementation (Commented)
```typescript
export async function transcribeAudio(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
        throw new Error("File not found: " + filePath);
    }

    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
        language: "en",
    });

    return transcription.text;
}
```

### Current Mock Implementation
```typescript
export async function transcribeAudio(filePath: string): Promise<string> {
    // MOCK MODE: Return static text immediately
    return "Mock transcription: 50 dollars for food";
}
```

### Why Mocked?
- Saves API costs during development
- Faster iteration on UI/UX
- Audio files still saved to database (real behavior)
- Easy switch to production by uncommenting

---

## Text Parsing (GPT-4o)

### Service Location
`backend/src/services/llm.ts`

### Response Format (Canonical)
```typescript
interface ParseResult {
    source: string;           // "voice" or "text"
    raw_text: string;         // Original input
    expenses: ParsedExpense[];
    month_context: string;    // "current" or specific month
}

interface ParsedExpense {
    amount: number;
    currency: string;         // "USD"
    category: string;         // One of 9 categories
    title: string;            // Extracted description
    occurred_at: string;      // ISO timestamp
}
```

### Current Mock Implementation
```typescript
export async function parseExpenseText(text: string): Promise<ParseResult> {
    const amount = Math.floor(Math.random() * 100) + 10;
    const categories = ['Food', 'Transport', 'Misc', 'Shopping'];
    const category = categories[Math.floor(Math.random() * categories.length)];

    return {
        source: 'mock',
        raw_text: text,
        expenses: [{
            amount: amount,
            currency: "USD",
            category: category,
            title: "Mock Item",
            occurred_at: new Date().toISOString()
        }],
        month_context: 'current'
    };
}
```

### Production Implementation (To Build)
```typescript
const systemPrompt = `
You are an expense parser. Extract expense information from natural language.
Return JSON with this exact format:
{
    "expenses": [
        {
            "amount": number,
            "currency": "USD",
            "category": "Food|Transport|Shopping|Bills|Entertainment|Health|Education|Travel|Misc",
            "title": "brief description",
            "occurred_at": "ISO timestamp or null"
        }
    ],
    "month_context": "current" or "September" etc
}
`;

export async function parseExpenseText(text: string, userId?: string): Promise<ParseResult> {
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
        ],
        response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
}
```

---

## Category System

### Fixed Categories (v1)

| Category | Examples |
|----------|----------|
| **Food** | Restaurant, groceries, coffee |
| **Transport** | Uber, gas, bus ticket |
| **Shopping** | Clothes, electronics, Amazon |
| **Bills** | Electricity, phone, rent |
| **Entertainment** | Netflix, movies, games |
| **Health** | Medicine, doctor, gym |
| **Education** | Books, courses, tuition |
| **Travel** | Hotels, flights, vacation |
| **Misc** | Everything else (fallback) |

### Fallback Behavior
- Unknown categories → `Misc`
- Ambiguous items → `Misc`
- User can always correct after

---

## Learning System

### Correction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       CORRECTION LOOP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. User speaks: "50 dollars uber"                             │
│              ↓                                                   │
│   2. AI categorizes as "Transport" ✓                            │
│              ↓                                                   │
│   3. User speaks: "30 dollars spotify"                          │
│              ↓                                                   │
│   4. AI categorizes as "Shopping" ✗                             │
│              ↓                                                   │
│   5. User corrects to "Entertainment"                           │
│              ↓                                                   │
│   6. Correction stored in user_corrections table                │
│              ↓                                                   │
│   7. Future: "spotify premium" → biased toward "Entertainment"  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Correction Storage

```sql
CREATE TABLE user_corrections (
    id UUID PRIMARY KEY,
    user_id UUID,
    expense_id UUID,
    original_text TEXT,
    corrected_data JSONB, -- e.g., {"corrected_category": "Entertainment"}
    created_at TIMESTAMP
);
```

### Future Learning Implementation
1. Query user's corrections before parsing
2. Inject relevant corrections into LLM prompt
3. Bias model toward user's preferences
4. **No global model training** — corrections are private

---

## Multi-Expense Parsing

The LLM can extract multiple expenses from a single input:

**Input**: "Had breakfast for $15 and then took an uber for $30"

**Output**:
```json
{
    "expenses": [
        {
            "amount": 15,
            "category": "Food",
            "title": "Breakfast"
        },
        {
            "amount": 30,
            "category": "Transport",
            "title": "Uber"
        }
    ]
}
```

---

## Month Context Detection

The parser detects temporal references:

| Input | Month Context |
|-------|---------------|
| "50 dollars coffee" | `current` |
| "spent 100 on groceries yesterday" | `current` |
| "september rent was 1500" | `September` |
| "last month's phone bill" | `{previous month}` |

---

## Error Handling

### Whisper Failures
- File not found → Error response
- API timeout → Retry once, then error
- Invalid audio format → Error response

### LLM Failures
- Invalid JSON → Parse with fallback regex
- API timeout → Retry once, then error
- No expenses found → Return empty array

---

## Performance Considerations

### Current (Mock Mode)
- Response time: ~50ms
- No API costs

### Production Estimates
| Step | Time | Cost |
|------|------|------|
| Whisper (30s audio) | 2-3s | ~$0.006 |
| GPT-4o (parse) | 0.5-1s | ~$0.002 |
| **Total** | ~3-4s | ~$0.01/expense |

### Optimization Ideas (v1.1)
- Batch similar corrections
- Cache common phrases
- Use smaller model for simple inputs
- Consider on-device STT (Whisper.cpp)

---

## Integration Points

### Frontend → Backend
```typescript
// Text expense
await api.post("/parse-expense", { text, userId });

// Voice expense
const formData = new FormData();
formData.append("audio", audioBlob);
formData.append("userId", userId);
await api.post("/parse-audio", formData);
```

### Backend → AI
```typescript
// Whisper
const text = await transcribeAudio(file.path);

// LLM
const parsed = await parseExpenseText(text, userId);
```

---

## Testing Strategy

### Mock Mode Benefits
1. Consistent behavior for UI testing
2. Random amounts for realistic totals
3. Random categories for chart variety
4. No API dependencies

### Production Testing
1. Test with various accents/languages
2. Test edge cases (multiple expenses, corrections)
3. Monitor API costs and latency
4. A/B test prompt variations
