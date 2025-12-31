# Project "Tem" - Complete Development Walkthrough

## 1. Project Mission & Identity
**"Tem"** is a minimalist, voice-first expense tracker.
**Mantra**: "Minimal input. Maximum trust. Zero noise."
**Stack**:
- **Frontend**: React Native (Expo SDK 54), TypeScript, Expo Router, Zustand (State).
- **Backend**: Node.js, Express, PostgreSQL, Multer (Uploads).
- **AI (Mocked for Test)**: OpenAI Whisper (STT), OpenAI GPT-4o keys (Parsing).

---

## 2. File Structure & Implementation Details

### **A. Backend (`backend/`)**
The brain of the operation. Handles audio upload, parsing, database storage, and history retrieval.

#### **1. Infrastructure**
- **`src/index.ts`**: Entry point. Sets up Express, CORS, Rate Limiting, Static file serving (`/audio` -> `uploads/audio`), and routes.
- **`src/db/index.ts`**: Database connection (PostgreSQL) and `initDB` function that creates tables (`users`, `expenses`, `user_corrections`) if they don't exist.
- **`src/middleware/auth.ts`**: `checkSubscription` middleware. Checks if a user's trial (`trial_ends_at`) is valid. Returns `402 Payment Required` if expired.

#### **2. Core Services (`src/services/`)**
- **`whisper.ts`**: Handles Audio-to-Text.
  - *Current State*: **Mocked**. Returns "Mock transcription: 50 dollars for food" to bypass API keys.
  - *Original Intent*: stream file to OpenAI Whisper API.
- **`llm.ts`**: Handles Text-to-Structued-Expense.
  - *Current State*: **Mocked**. Returns a `ParsedExpense` object with randomized amount (10-110), category, and valid timestamp.
  - *Original Intent*: Prompt GPT-4o to extract JSON from text.

#### **3. API Routes (`src/routes/`)**
- **`parseAudio.ts` (`POST /parse-audio`)**:
  - Receives `.m4a` file via `multer`.
  - Saves file to `uploads/audio`.
  - Calls `whisper` service -> Text.
  - Calls `llm` service -> Expense Object.
  - **Saves to DB**: Inserts the expense into `expenses` table, including the `audio_path`.
  - Returns: JSON with expense details and `audio_url`.
- **`parse.ts` (`POST /parse-expense`)**:
  - Text-only version of the above. Parses text, saves to DB, returns JSON.
- **`expenses.ts` (`GET /expenses`)**:
  - Fetches history for a `user_id`.
  - Supports filtering by category.
  - Returns list of expenses + total sum.
- **`export.ts` (`GET /export/excel`)**:
  - Generates an Excel file (.xlsx) of user expenses using `exceljs`.
  - Includes a monthly summary breakdown.
- **`correct.ts` (`POST /correct-expense`)**:
  - Updates an existing expense's category in the DB.
  - Logs the correction in `user_corrections` table for future AI training.

---

### **B. Frontend (`src/`)**
The user interface. Strictly minimalist, "Black & White" premium aesthetic.

#### **1. Screens (`src/app/`)**
- **`MainScreen.tsx`**: The primary interface.
  - **Layout**: Clean. No lists. Just Avatar, Monthly Total, and Input Bar.
  - **Logic**: Uses `useExpenseStore` to manage state.
  - **Recording**: "Hold to Record" (Web compatible). Sends audio to backend.
  - **Popup**: Displays `ConfirmationPopup` when expense is parsed.
  - **Auto-Dismiss**: Managed by `expenseStore`.
- **`user.tsx` (`/user` route)**: The History / Profile screen.
  - Lists past expenses.
  - Play button (`▶`) for audio expenses.
  - Minimalist Card cards.

#### **2. Components (`src/components/`)**
- **`InputBar.tsx`**: The "Pill". Contains TextInput and Mic button.
  - Handles `startRecording` / `stopRecording` calls.
  - Sends data to API.
  - Triggers `store.onParsed`.
- **`ConfirmationPopup.tsx`**: The interaction center.
  - **Modes**:
    1. **Added**: "Expenses added".
    2. **Selecting**: Shows scrollable list of categories to correct.
    3. **Thanks**: "Thanks — I'll remember this."
  - **Design**: Cream pill, high z-index, interactive.
- **`MonthlyTotal.tsx`**: Displays big bold total amount. Toggles help text for new users.
- **`AvatarButton.tsx`**: Simple entry point to History.

#### **3. State & Logic**
- **`store/expenseStore.ts`**: Zustand store.
  - Holds `popupVisible`, `popupMode`, `monthlyTotal`.
  - Contains the **"Business Logic"** for UI interactions:
    - `onParsed`: Updates total, shows popup, starts 3.5s timer.
    - `handleCategorySelect`: Optimistic update, API call, shows "Thanks", starts 1.8s timer.
- **`services/audio.ts`**: Wrapper around `expo-av`.
  - Handles permissions.
  - **Web Fixes**: Uses `fetch(uri).blob()` to ensure correct upload format on Web.
  - **iOS/Android**: Uses standard file URI.
- **`services/api.ts`**: Axios client.
  - Endpoints: `sendAudio`, `sendTextExpense`, `getExpenses`, `correctExpense`.

---

## 3. Current "Test" Configuration
To facilitate testing without burning API credits:
1.  **Backend Services are Mocked**:
    -   Voice input always transcribes to a mock sentence.
    -   Parsing always generates a valid, random expense ($10-$110).
2.  **Database is Real**:
    -   Even though data is generated randomly, it is **persisted** to PostgreSQL.
    -   This means History Screen (`/user`) works for real.
    -   Exports work for real.
    -   Audio playback works for real.

## 4. How to Run
1.  **Backend**: `cd backend && npm run dev` (Runs on Port 3000).
2.  **Frontend**: `npx expo start --go` (or `--web`). Scanning the QR code launches the app.

---

## 5. Journey Recap (Major Milestones)
1.  **Setup**: Initialized Expo & Express.
2.  **Whisper Integration**: Built the pipeline to send audio to OpenAI.
3.  **Parsers**: Built prompt engineering for "Text -> JSON".
4.  **DB Schema**: Added `audio_path` and `user_corrections` tables.
5.  **Main Screen Iterations**:
    -   V1: Basic list + input.
    -   V2: "Black & White" theme.
    -   V3: "Final Implementation" - Strictly minimal, all logic moved to Store.
6.  **Web Compatibility**: Fixed "Hold to Record" issues on web (Touch/Select conflicts) and File Uploads (Blob vs URI).
7.  **Popup Refinement**: "One popup. Two modes." Interactive category correction flow.
