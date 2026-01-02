# TEM — Payments & Subscription Model

> Monetization strategy, pricing tiers, and subscription implementation.

---

## Revenue Philosophy

### Core Beliefs
- **Simplicity over complexity** — Three pricing options maximum
- **Early supporters matter** — Reward first adopters with lifetime access
- **No feature gating** — Full access for paying users, no tiers
- **Trust-based trial** — No credit card required upfront

---

## Pricing Tiers

### Trial
| Aspect | Value |
|--------|-------|
| Duration | 14 days |
| Access | Full features |
| Credit Card | Not required |
| Limit | Unlimited expenses |

### Monthly
| Aspect | Value |
|--------|-------|
| Price | $4.99/month |
| Access | Full features |
| Cancellation | Anytime |
| Target | General users |

### Lifetime (Early Supporter)
| Aspect | Value |
|--------|-------|
| Price | $49 one-time |
| Access | Full features forever |
| Availability | Limited (first 1000) |
| Target | Early adopters, believers |

---

## What's NOT Included

Tem intentionally avoids:
- ❌ Multiple tiers (Basic, Pro, Enterprise)
- ❌ Usage limits for paid users
- ❌ Ads (even on free tier)
- ❌ In-app purchases beyond subscription
- ❌ Feature upsells

---

## Trial Experience

### User Journey

```
┌────────────────────────────────────────────────────────────────┐
│  Day 1: User downloads app                                      │
│         → 14-day trial starts automatically                     │
│                                                                 │
│  Day 1-14: Full access, no restrictions                        │
│            → User sees "Trial: X days left" in profile         │
│                                                                 │
│  Day 14: Trial expires                                          │
│          → Soft paywall appears                                 │
│          → Previous data remains accessible (read-only)         │
│          → New expenses require subscription                    │
└────────────────────────────────────────────────────────────────┘
```

### Trial Messaging

**In Profile Screen**:
```
Trial: 12 days left
Upgrade to support Tem
```

**Soft, not aggressive** — No countdown pop-ups, no guilt messaging.

---

## Paywall Component

### Location
`src/components/Paywall.tsx`

### Design

```
┌─────────────────────────────────────────┐
│                                          │
│         Extend your trial                │
│                                          │
│    If this has helped you, you can      │
│           keep using it.                 │
│                                          │
│   ┌───────────────────────────────────┐  │
│   │       $4.99 / month              │  │
│   └───────────────────────────────────┘  │
│                                          │
│   ┌───────────────────────────────────┐  │
│   │    $49 Early Supporter           │  │
│   └───────────────────────────────────┘  │
│                                          │
│            Maybe later                   │
│                                          │
└─────────────────────────────────────────┘
```

### Key Design Choices
- **"Extend your trial"** — Not "Pay now"
- **"If this has helped you"** — Appeal to value, not fear
- **"Maybe later"** — Always offer opt-out
- **No crossed-out prices** — No psychological tricks

---

## Backend Implementation

### Trial Tracking

```sql
-- Users table includes trial status
ALTER TABLE users
ADD COLUMN trial_ends_at TIMESTAMP;

-- Default: 14 days from creation
UPDATE users SET trial_ends_at = created_at + INTERVAL '14 days';
```

### Subscription Check Middleware

```typescript
// middleware/auth.ts
export async function checkSubscription(req, res, next) {
    const userId = req.body.userId || req.query.user_id;
    
    const result = await query(
        `SELECT trial_ends_at FROM users WHERE id = $1`,
        [userId]
    );
    
    const { trial_ends_at } = result.rows[0];
    
    if (!trial_ends_at || new Date() > new Date(trial_ends_at)) {
        return res.status(402).json({ 
            error: "Payment Required: Trial Expired" 
        });
    }
    
    next();
}
```

### Status: Not Yet Integrated
The middleware exists but is not applied to routes in v1 (MVP phase).

---

## Frontend Implementation

### User Screen Subscription Display

```typescript
// src/app/user.tsx
const [subscription, setSubscription] = useState({
    status: "trial",      // "trial" | "monthly" | "lifetime"
    trialDaysLeft: 12,
    nextBillingDate: undefined,
    isEarlySupporter: false,
});
```

### Display Logic

| Status | Display |
|--------|---------|
| `trial` | "Trial: X days left" + upgrade link |
| `monthly` | "Subscription active" + next billing + upgrade to lifetime |
| `lifetime` | "Lifetime access" + "Early supporter" badge |

---

## Payment Processing (Planned)

### v1 Launch
- Manual Stripe integration
- Payment links (not in-app purchase)
- Webhook for subscription updates

### v1.1 Consideration
- In-app purchase via App Store / Play Store
- RevenueCat integration
- Subscription management UI

### Why Not IAP Initially?
- Apple/Google take 30% commission
- Simpler to validate product-market fit first
- Can always add later

---

## Financial Projections

### Assumptions
- 1,000 downloads/month
- 5% trial-to-paid conversion
- 50/50 split monthly vs lifetime

### Monthly Revenue Estimate
| Source | Users | Revenue |
|--------|-------|---------|
| Monthly | 25 | $125/month |
| Lifetime | 25 | $1,225 (one-time) |
| **Monthly Recurring** | - | ~$125 MRR |

### Cost Considerations
| Item | Estimate |
|------|----------|
| OpenAI API (per expense) | $0.01 |
| Server hosting | $20/month |
| Database | $15/month |
| **Break-even** | ~10 paying users |

---

## Subscription States

```
┌─────────────────────────────────────────────────────────────────┐
│                      SUBSCRIPTION STATES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Trial Active] ─────┬────────────▶ [Monthly Active]           │
│         │             │                     │                    │
│         │             │                     ▼                    │
│         │             └────────────▶ [Lifetime Active]          │
│         │                                                        │
│         ▼                                                        │
│   [Trial Expired] ────┬────────────▶ [Monthly Active]           │
│                       │                                          │
│                       └────────────▶ [Lifetime Active]          │
│                                                                  │
│   [Monthly Active] ───────────────▶ [Monthly Cancelled]         │
│                                                                  │
│   [Monthly Active] ───────────────▶ [Lifetime Active]           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Grace Periods

### Trial Expired
- **Duration**: 3 days grace
- **Behavior**: Soft reminder, data accessible
- **After grace**: Hard paywall on new expenses

### Monthly Cancelled
- **Duration**: End of billing period
- **Behavior**: Full access until period ends
- **After**: Same as trial expired

---

## Analytics to Track

| Metric | Purpose |
|--------|---------|
| Trial starts | Total signups |
| Trial conversions | Effectiveness of trial period |
| Monthly vs Lifetime ratio | Pricing optimization |
| Churn rate | Retention health |
| LTV (Lifetime Value) | Revenue forecasting |

---

## Future Considerations

### v1.1 Pricing Experiments
- Family plan ($9.99/month, 5 users)
- Annual plan ($39.99/year, 33% savings)
- Regional pricing for India, etc.

### What NOT to Add
- ❌ Feature-gated tiers
- ❌ Usage limits
- ❌ Ads for free users
- ❌ "Premium" badge flexing
