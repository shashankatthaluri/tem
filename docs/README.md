# TEM Documentation

> Complete product, design, and technical documentation for the Tem expense tracker project.

---

## About Tem

**Tem** is a voice-first, minimalist expense tracker.  
**Tagline**: "Speak your expenses. We track it."  
**Mantra**: "Minimal input. Maximum trust. Zero noise."

---

## Documentation Index

| # | Document | Description |
|---|----------|-------------|
| 00 | [Project Overview](./00_PROJECT_OVERVIEW.md) | What is Tem? Philosophy, principles, target users |
| 01 | [Tech Stack](./01_TECH_STACK.md) | Complete technical architecture & dependencies |
| 02 | [UI/UX Design](./02_UI_UX_DESIGN.md) | Design philosophy, screens, components, interactions |
| 03 | [Backend Architecture](./03_BACKEND_ARCHITECTURE.md) | Server structure, API routes, database schema |
| 04 | [AI/LLM Pipeline](./04_AI_LLM_PIPELINE.md) | Voice processing, parsing, learning system |
| 05 | [Payments & Subscription](./05_PAYMENTS_SUBSCRIPTION.md) | Pricing, trial, paywall, Stripe integration |
| 06 | [Implementation Status](./06_IMPLEMENTATION_STATUS.md) | What's built vs. planned, technical debt |
| 07 | [V1 Release Plan](./07_V1_RELEASE_PLAN.md) | Pre-launch checklist, timeline, success criteria |
| 08 | [V1.1 Roadmap](./08_V1.1_ROADMAP.md) | Post-launch features, improvements, timeline |

---

## Quick Links

### For New Team Members
1. Start with [Project Overview](./00_PROJECT_OVERVIEW.md)
2. Read [UI/UX Design](./02_UI_UX_DESIGN.md) for the design philosophy
3. Review [Tech Stack](./01_TECH_STACK.md) for architecture understanding

### For Developers
1. [Tech Stack](./01_TECH_STACK.md) — Architecture & project structure
2. [Backend Architecture](./03_BACKEND_ARCHITECTURE.md) — API details
3. [Implementation Status](./06_IMPLEMENTATION_STATUS.md) — What's done & pending

### For Designers
1. [UI/UX Design](./02_UI_UX_DESIGN.md) — Complete design system
2. [Project Overview](./00_PROJECT_OVERVIEW.md) — Product philosophy

### For Product/Business
1. [Project Overview](./00_PROJECT_OVERVIEW.md) — Vision & principles
2. [Payments & Subscription](./05_PAYMENTS_SUBSCRIPTION.md) — Monetization
3. [V1 Release Plan](./07_V1_RELEASE_PLAN.md) — Launch checklist

---

## Running the Project

### Frontend (React Native)
```bash
cd expense-tracker
npm install
npx expo start --web     # Web
npx expo start           # Mobile (scan QR)
```

### Backend (Node.js/Express)
```bash
cd expense-tracker/backend
npm install
npm run dev
```

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key (for production)

---

## Project Status

| Area | Status |
|------|--------|
| Core UI | ✅ Complete |
| Backend API | ✅ Working |
| AI Services | ⚠️ Mocked |
| Authentication | 🔲 Pending |
| Payments | 🔲 Pending |

See [Implementation Status](./06_IMPLEMENTATION_STATUS.md) for details.

---

## Contributing

1. Read the documentation relevant to your area
2. Follow the existing code patterns
3. Maintain the minimalist philosophy in all changes
4. Test on web and mobile before submitting

---

*Last updated: January 2026*
