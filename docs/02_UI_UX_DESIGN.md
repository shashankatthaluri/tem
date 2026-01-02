# TEM — UI/UX Design Philosophy

> Why minimalism matters and how every design decision serves the user.

---

## The Design Philosophy

### Calm Technology

Tem embraces the concept of **"Calm Technology"** — technology that informs without demanding attention. In a world of dopamine-driven apps fighting for screen time, Tem chooses silence.

### The Visual Language

| Principle | Implementation |
|-----------|----------------|
| **Black & White** | Pure #000000 background, #FFFFFF text |
| **No Visual Noise** | No gradients, no shadows (except subtle popup) |
| **Typography First** | Inter font family at the center |
| **Breathing Room** | Generous whitespace, minimal elements |

### Why Black & White?

1. **Focus on Content** — Numbers and text stand out without distraction
2. **Premium Feel** — Monochrome conveys sophistication
3. **Reduced Decision Fatigue** — No colors to process
4. **Battery Efficiency** — OLED screens benefit from dark themes
5. **Universal Accessibility** — Works for all color perception types

---

## Typography System

The entire app uses the **Inter** font family from Google Fonts:

| Weight | Use Case |
|--------|----------|
| `Inter_300Light` | Subtle text, hints, timestamps |
| `Inter_400Regular` | Body text, labels, buttons |
| `Inter_500Medium` | Emphasis, hero numbers, headers |

### Implementation

```typescript
// src/theme/typography.ts
export const typography = {
    light: { fontFamily: "Inter_300Light" },
    regular: { fontFamily: "Inter_400Regular" },
    medium: { fontFamily: "Inter_500Medium" },
};
```

---

## Screen Breakdown

### 1. Main Screen (Hero Screen)

**Purpose**: The primary expense logging interface.

```
┌────────────────────────────────────────┐
│  [👤]                                   │  ← Avatar (top-left)
│                                         │
│                                         │
│                                         │
│                  24,850                 │  ← Hero Number (monthly total)
│            Total this month             │  ← Subtitle
│                                         │
│                                         │
│                                         │
│  ┌──────────────────────── [🔴]┐       │  ← Input Pill
│  │ Hold to speak              ⬤ │       │
│  └──────────────────────────────┘       │
└────────────────────────────────────────┘
```

**Design Decisions**:
- **No lists visible** — The main screen is purely for input
- **Hero number dominates** — Largest element, centered
- **Input at bottom** — Natural thumb zone for mobile
- **Avatar for escape** — Single exit point, not distracting

### 2. Confirmation Popup (Trust Loop)

**Purpose**: Show what was logged, allow correction.

```
┌──────────────────────────────────┐
│  ┌────────────────────────────┐  │
│  │  EXPENSES ADDED            │  │
│  │  ☑ 800 → Food              │  │  ← Tappable row
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**Three Modes**:
1. **"added"** — Shows added expenses with checkmarks
2. **"selecting"** — Shows category picker for correction
3. **"thanks"** — Shows "Thanks — I'll remember this."

**Design Decisions**:
- **Cream background** (#F5F5F0) — Subtle contrast from black
- **Auto-dismiss** (3.5s) — Doesn't require interaction
- **Tappable rows** — For correction, not required to tap
- **Animated entry** — Subtle slide-down animation

### 3. Summary Screen (Pie Chart)

**Purpose**: Visual breakdown by category.

```
┌────────────────────────────────────────┐
│  [←]           September           [📅] │  ← Top bar
│                                         │
│              ┌─────────┐               │
│          ╱       ╲      │               │
│        ╱   3,200   ╲    │               │  ← Pie chart
│       │             │   │               │
│        ╲           ╱    │               │
│          ╲       ╱      │               │
│              └─────────┘               │
│                                         │
│        Tap a slice to see details       │  ← Hint text
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  Month Selector Sheet              │ │  ← Bottom sheet
│  └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Design Decisions**:
- **Black pie with white strokes** — Maintains monochrome
- **Selected slice shows amount** — Center of pie displays value
- **Double-tap to drill down** — First tap selects, second navigates
- **Month selector as sheet** — Non-intrusive, easy access

### 4. Category History Screen

**Purpose**: Detailed list of expenses by category.

```
┌────────────────────────────────────────┐
│  [←]             Food                   │
│                September                │
│                                         │
│                 8,400                   │  ← Category total
│                                         │
│  ────────────────────────────────────── │
│                                         │
│  Restaurant        14:32         [▶]   │  ← With audio
│  800                                    │
│                                         │
│  Groceries      12 Dec · 10:15         │  ← No audio
│  1,200                                  │
│                                         │
│  Coffee           Yesterday      [▶]   │
│  150                                    │
│                                         │
└────────────────────────────────────────┘
```

**Design Decisions**:
- **Audio playback inline** — Red accent for play button only
- **Timestamp logic** — Today shows time only, older shows date
- **Waveform placeholder** — Visual feedback during playback
- **No edit/delete** — Simplicity over features (v1)

### 5. User/Profile Screen

**Purpose**: Account, subscription, and export.

```
┌────────────────────────────────────────┐
│  [←]                                    │
│                                         │
│              [Avatar]                   │
│                Shiva                    │
│          shiva@example.com              │
│                                         │
│         Trial: 12 days left             │
│       Upgrade to support Tem            │  ← Link to pricing
│                                         │
│                                         │
│              ↓ (spacer)                 │
│                                         │
│               [📤]                       │  ← Export button
│              Log out                    │
└────────────────────────────────────────┘
```

**Design Decisions**:
- **Centered identity** — Avatar and name prominent
- **Subscription visible** — But not pressuring
- **Export accessible** — Icon button, not buried
- **Logout subtle** — Text only, bottom of screen

---

## Component Library

### InputBar (The Pill)

**States**:
- Default: "Hold to speak" placeholder
- Recording: "Listening…" with pulsing indicator
- Loading: Spinner replacing mic dot

**Dual Input**:
- Text input on the left
- Mic button on the right

### ConfirmationPopup

**Animations**:
- Slide down on enter (translateY: -20 → 0)
- Fade out on exit (opacity: 1 → 0)
- 220ms enter, 180ms exit

### ExpensePieChart

**Custom SVG**:
- No third-party charting library
- Hand-crafted arc paths
- Touch-friendly slice selection

### MonthlyTotal

**Contextual Text**:
- New users: "Speak your expenses. We track it."
- Returning users: "Total this month"

---

## Interaction Patterns

### Voice Recording
- **Web**: Press-and-hold triggers recording
- **Mobile**: Long-press (200ms delay) triggers recording
- **Release**: Stops recording and processes

### Category Correction
1. Tap expense row in popup
2. Popup switches to category list
3. Tap category to correct
4. Popup shows "Thanks" message
5. Auto-dismisses after 1.8s

### Navigation
- Avatar → User screen
- Monthly total → Summary screen
- Pie slice (double-tap) → Category history
- Back button → Previous screen

---

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Pure Black | `#000000` | Background |
| Pure White | `#FFFFFF` | Primary text |
| Mid Gray | `#666666` | Placeholders, hints |
| Light Gray | `#AAAAAA` | Subtitles |
| Dark Gray | `#888888` | Secondary text |
| Cream | `#F5F5F0` | Popup background |
| Red Accent | `#FF4444` | Audio play button only |

---

## Accessibility Considerations

1. **High Contrast** — Pure black/white ensures WCAG AAA compliance
2. **Large Touch Targets** — 44px minimum for interactive elements
3. **Voice Input** — Primary interaction doesn't require typing
4. **No Color Dependence** — Information conveyed through size/position
5. **Screen Reader Ready** — All components use semantic labels

---

## Animation Philosophy

> "Calm motion only"

- Animations are subtle, never playful
- Entry animations: Slide + fade (200-300ms)
- Exit animations: Fade only (150-200ms)
- No bounces, no elastic effects
- Purpose: Orientation, not entertainment

---

## Future Design Considerations

### v1.1 Potential Additions
- Dark mode toggle (already dark, add light option)
- Font size adjustment
- Reduced motion option
- High contrast mode (for accessibility)

### Explicitly Avoided
- Color themes
- Customizable categories
- Stickers or emoji
- Gamification elements
- Social sharing visuals
