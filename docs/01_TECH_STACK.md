# TEM — Technical Stack

> Complete technical architecture and technology decisions.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  React Native (Expo SDK 54) + TypeScript                    │ │
│  │  ────────────────────────────────────────────────────────── │ │
│  │  Expo Router (file-based routing)                           │ │
│  │  Zustand (state management)                                  │ │
│  │  expo-av (audio recording)                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                       HTTP / REST                                 │
│                              ↓                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      BACKEND API                             │ │
│  │  ────────────────────────────────────────────────────────── │ │
│  │  Node.js + Express + TypeScript                              │ │
│  │  Multer (file uploads)                                       │ │
│  │  ExcelJS (export generation)                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ↓                                    │
│  ┌────────────────┐    ┌────────────────┐                        │
│  │   PostgreSQL   │    │   OpenAI API   │                        │
│  │   (Database)   │    │ Whisper + GPT  │                        │
│  └────────────────┘    └────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.81.5 | Cross-platform mobile framework |
| **Expo** | SDK 54 | Development platform & build tools |
| **TypeScript** | 5.9.x | Type safety |

### Navigation & Routing
| Technology | Purpose |
|------------|---------|
| **expo-router** | File-based routing (like Next.js for mobile) |

### State Management
| Technology | Purpose |
|------------|---------|
| **Zustand** | Lightweight, hook-based state management |

### Audio & Media
| Technology | Purpose |
|------------|---------|
| **expo-av** | Audio recording & playback |
| **expo-file-system** | File handling for exports |
| **expo-sharing** | Native sharing on mobile |

### UI & Styling
| Technology | Purpose |
|------------|---------|
| **react-native-svg** | Custom SVG components (pie chart) |
| **@expo-google-fonts/inter** | Inter font family (Light, Regular, Medium) |
| **expo-haptics** | Haptic feedback for interactions |

### HTTP Client
| Technology | Purpose |
|------------|---------|
| **axios** | API requests |

---

## Backend Stack

### Core Server
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express** | 4.x | HTTP server framework |
| **TypeScript** | 5.x | Type safety |

### Database
| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database |
| **node-postgres (pg)** | PostgreSQL client |

### File Handling
| Technology | Purpose |
|------------|---------|
| **Multer** | Multipart form data / file uploads |

### Security & Rate Limiting
| Technology | Purpose |
|------------|---------|
| **cors** | Cross-origin resource sharing |
| **express-rate-limit** | API rate limiting (100 req/15min) |
| **dotenv** | Environment variable management |

### Export Generation
| Technology | Purpose |
|------------|---------|
| **ExcelJS** | Excel file generation for data export |

---

## AI/LLM Stack

### Speech-to-Text
| Technology | Purpose | Status |
|------------|---------|--------|
| **OpenAI Whisper** | Audio transcription | ⚠️ Mocked for testing |

### Text Parsing
| Technology | Purpose | Status |
|------------|---------|--------|
| **OpenAI GPT-4o** | Expense extraction & categorization | ⚠️ Mocked for testing |

### Pipeline Flow
```
Voice Input → Whisper (STT) → GPT-4o (Parser) → Structured JSON → Database
```

> **Important**: Frontend never transcribes, calls LLMs, or stores API keys.

---

## Project Structure

```
expense-tracker/
├── src/                          # Frontend source
│   ├── app/                      # Screens (Expo Router)
│   │   ├── MainScreen.tsx        # Primary input screen
│   │   ├── summary.tsx           # Pie chart summary
│   │   ├── category-history.tsx  # Category expense list
│   │   ├── user.tsx              # Profile & settings
│   │   └── _layout.tsx           # Root layout with fonts
│   ├── components/               # Reusable UI components
│   │   ├── InputBar.tsx          # Voice/text input pill
│   │   ├── ConfirmationPopup.tsx # Trust loop popup
│   │   ├── ExpensePieChart.tsx   # SVG pie chart
│   │   ├── MonthlyTotal.tsx      # Hero number display
│   │   └── ...
│   ├── services/                 # API & audio services
│   │   ├── api.ts                # Axios client
│   │   └── audio.ts              # expo-av wrapper
│   ├── store/                    # Zustand stores
│   │   └── expenseStore.ts       # Main app state
│   ├── theme/                    # Design tokens
│   │   └── typography.ts         # Font configurations
│   ├── types/                    # TypeScript types
│   └── utils/                    # Utility functions
│
├── backend/                      # Backend source
│   ├── src/
│   │   ├── index.ts              # Express entry point
│   │   ├── db/
│   │   │   └── index.ts          # PostgreSQL connection
│   │   ├── routes/
│   │   │   ├── parse.ts          # Text parsing endpoint
│   │   │   ├── parseAudio.ts     # Audio parsing endpoint
│   │   │   ├── expenses.ts       # History endpoint
│   │   │   ├── correct.ts        # Correction endpoint
│   │   │   └── export.ts         # Excel export endpoint
│   │   ├── services/
│   │   │   ├── whisper.ts        # OpenAI Whisper service
│   │   │   └── llm.ts            # GPT-4o parsing service
│   │   └── middleware/
│   │       └── auth.ts           # Trial/subscription check
│   └── uploads/                  # Audio file storage
│
├── package.json                  # Frontend dependencies
├── app.json                      # Expo configuration
├── prd.md                        # Original PRD document
└── docs/                         # This documentation
```

---

## Database Schema

### Tables

#### `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_ends_at TIMESTAMP,  -- Added via migration
    currency VARCHAR(3),       -- Added via migration
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `expenses`
```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    audio_path TEXT,           -- Path to audio recording
    date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `user_corrections`
```sql
CREATE TABLE user_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    original_text TEXT,
    corrected_data JSONB,      -- Stores correction history
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/parse-expense` | Parse text expense |
| `POST` | `/parse-audio` | Parse voice expense |
| `GET` | `/expenses` | Get expense history |
| `POST` | `/correct-expense` | Update expense category |
| `GET` | `/export/excel` | Download Excel export |
| `GET` | `/health` | Health check |
| `GET` | `/audio/:filename` | Serve audio files (static) |

---

## Development Commands

### Frontend
```bash
cd expense-tracker
npm install
npx expo start --web     # Web development
npx expo start           # Mobile (scan QR code)
```

### Backend
```bash
cd backend
npm install
npm run dev              # Development server (port 3000)
```

---

## Environment Variables

### Backend `.env`
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tem
DB_USER=postgres
DB_PASSWORD=postgres
OPENAI_API_KEY=your-key-here
```

---

## Design Decisions

### Why Expo?
- Unified development experience across platforms
- Excellent audio APIs via expo-av
- Easy over-the-air updates for rapid iteration

### Why Zustand?
- Minimal boilerplate compared to Redux
- Built-in persistence support
- Simple, hook-based API

### Why PostgreSQL?
- Robust relational database for structured expense data
- JSONB support for flexible correction storage
- Easy backup and migration capabilities

### Why Express?
- Familiar, battle-tested Node.js framework
- Large ecosystem of middleware
- Simple to deploy and scale
