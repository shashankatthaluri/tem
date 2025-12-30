# PRD — tem

**Minimalist Voice-First Expense Tracker**

## 1. Product Overview
*   **Product Name**: tem
*   **Tagline**: “Speak your expenses. We track it.”
*   **Product Summary**:
    tem is a voice-first, minimalist mobile expense tracker that allows users to log expenses by simply speaking. The app converts voice into structured expense data, intelligently categorizes it, confirms correctness, and learns from user corrections — all within a calm, black-and-white interface.

    tem is designed to remove friction, not add control. It avoids dashboards, alerts, and guilt-inducing analytics. The app prioritizes trust, calm, and accuracy.

## 2. Problem Statement
**Most expense trackers:**
*   Require manual data entry
*   Force users to think in categories
*   Overwhelm users with charts and controls
*   Feel like financial dashboards rather than personal tools

**Users want:**
*   Zero-effort logging
*   Natural input (voice)
*   Confidence that data is correct
*   A calm experience they can return to daily

## 3. Product Goals
**Primary Goals**
*   Enable fast, frictionless expense logging
*   Build trust through transparent confirmation and correction
*   Maintain a calm, minimalist experience
*   Learn from users without demanding effort

**Non-Goals (v1)**
*   Budgeting rules
*   Alerts or notifications
*   Financial advice
*   Daily spending pressure
*   Social or sharing features

## 4. Target Users
**Primary User**
*   Individuals who want to track expenses casually but consistently
*   Professionals, founders, students
*   People who prefer voice over forms

**User Mindset**
*   “I don’t want to manage money — I want awareness.”
*   “I want this to quietly work in the background.”

## 5. Core Principles
*   **Voice First** — speaking is the default interaction
*   **Minimalism** — black & white, no visual noise
*   **Trust Over Automation** — always confirm, always allow correction
*   **Calm by Default** — no pressure, no guilt
*   **One Clear Loop** — log → confirm → learn

## 6. Core User Flow (v1)
1.  User opens the app
2.  User speaks or types an expense
3.  App processes input (voice → text → intelligence)
4.  App shows confirmation popup
5.  User optionally corrects
6.  App learns and updates totals
7.  User can view summary or history later

## 7. Screens & Features

### 7.1 Authentication
*   Login / Sign up
*   14-day free trial
*   No friction onboarding

### 7.2 Main Screen (Primary Screen)
**Purpose**: Logging expenses

**UI Characteristics**
*   Black background
*   White text
*   No lists, no clutter

**Elements**
*   Large monthly total (hero number)
*   Input bar (text + mic)
*   Inline confirmation popup

**Behavior**
*   Monthly total updates quietly
*   Confirmation popup appears after each log
*   No “add more” hints
*   No persistent guidance text after initial use

### 7.3 Confirmation Popup (Trust Loop)
Appears after logging. Example:
```
Expenses added
✓ $800 → Food
```

**Features**
*   Auto-dismiss (~2–3s)
*   Each row tappable for correction
*   Checkbox-based category correction
*   Correction feedback: `Thanks — I’ll remember this.`

**Design**
*   Text-only
*   Black & white
*   Calm motion only

### 7.4 Summary Screen
**Access**
*   Tap monthly total
*   Or voice: “Show summary”

**Features**
*   Pie chart (black & white)
*   Category totals shown as amounts (not %)
*   White highlight on selected slice
*   Month selector (top right)
*   **No** Daily view (v1)
*   Filters
*   Trend analytics

### 7.5 History Screen
**Access**
*   Tap category from summary

**Features**
*   Category total at top
*   Scrollable list of expenses
*   Card layout:
    ```
    Title · Timestamp        ▶
            $800
    ```
*   Audio playback with waveform
*   No transcript (v1)

### 7.6 Historical Month View
**Access**
*   Voice request (“Show September expenses”)
*   Month selector in summary

**Behavior**
*   Main number updates to selected month
*   Month label shown above total
*   Read-only mode
*   Back button returns to current month

### 7.7 User Screen
**Access**
*   Top-left avatar

**Features**
*   Profile (name, email)
*   Edit credentials
*   Trial status
*   Upgrade (monthly / lifetime)
*   Excel export
*   Logout

## 8. Voice & Intelligence System
### 8.1 Intelligence Pipeline
`Voice → Whisper (STT) → LLM Parser → Structured JSON → Database`

**Frontend never:**
*   Transcribes
*   Calls LLMs
*   Stores API keys

### 8.2 Categories (v1 – Fixed)
*   Food
*   Transport
*   Shopping
*   Bills
*   Entertainment
*   Health
*   Education
*   Travel
*   Misc
*   Fallback → Misc

### 8.3 Canonical Parse Response (Locked)
```json
{
  "source": "voice",
  "raw_text": "800 dollars restaurant bill",
  "expenses": [
    {
      "amount": 800,
      "currency": "USD",
      "category": "Food",
      "title": "Restaurant",
      "occurred_at": "ISO_TIMESTAMP",
      "expense_id": "uuid"
    }
  ],
  "month_context": "current"
}
```

### 8.4 Correction & Learning Loop
*   User corrects category via popup
*   Backend updates expense
*   Correction stored per user
*   Future parsing biased using user-specific rules
*   **No global model training**

## 9. Data Model (High Level)
**Tables**
*   `users`
*   `expenses`
*   `user_corrections`

**Stored Data**
*   Amount
*   Category
*   Timestamp
*   Audio URL
*   Correction history
*   **No computed totals stored** — all derived.

## 10. Export Feature
**Format**: Excel (single sheet)

**Includes**
*   Timestamp
*   Category
*   Title
*   Amount
*   Currency
*   **Monthly Summary**: Embedded to the right of data (Category totals, Pie chart per month)
*   Clean, professional, ownership-first.

## 11. Pricing
**Trial**
*   14 days
*   Full access
*   No credit card initially

**Paid Plans**
*   Monthly: $4.99
*   Early Supporter (Lifetime): $49 (limited)
*   No tiers. No usage limits. No ads.

## 12. Privacy & Trust
*   Voice used only for expense processing
*   Audio stored only if enabled
*   Corrections are private per user
*   No data sold or shared
*   Transparent review via history & playback

## 13. Success Metrics (v1)
*   Expense logs per user per week
*   Correction rate (should decrease over time)
*   Trial → paid conversion
*   Retention after 30 days

## 14. Out of Scope (Explicit)
*   Daily expense pressure
*   Budget limits
*   Notifications
*   Social features
*   Insights or advice
*   Color themes
*   Analysis Paralysis

## 15. Product Mantra
*   **Minimal input.**
*   **Maximum trust.**
*   **Zero noise.**
