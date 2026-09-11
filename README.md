# PACT — Personal Operating System

> **Tagline**: *"A System for Keeping Promises to Yourself."* / *"Turn Intent Into Discipline"*

---

## 📌 Overview

**PACT** is a production-hardened personal operating system designed to turn intentions into consistent action. PACT helps individuals define commitments, plan time, organize hierarchical projects, track high-level goals, analyze temporal follow-through, manage personal finances with budget discipline, synchronize with Google Calendar, objectively verify proof-of-work via external platforms (GitHub, LeetCode, Codeforces), and maintain unyielding personal accountability.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (or Node 22+)
- PostgreSQL 15+ / Supabase database instance

### Installation & Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment variables
cp .env.example .env.local

# 3. Run database migrations (via Supabase CLI or SQL editor)
# Apply migrations from supabase/migrations/

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

---

## 🧪 Testing & Verification

PACT features a comprehensive 34-suite test matrix covering domain logic, focus timer engine, command center search, lifecycle state machines, RLS boundaries, integration resilience, financial math, habits/routines, weekly reviews, URL state synchronization, and cron automation.

```bash
# Run full test runner (34 suites)
node scratch/run-tests.mjs

# Run TypeScript typecheck
npx tsc --noEmit

# Run ESLint
npm run lint

# Production build test
npm run build

# Zero-secret scan
node scratch/secret-scan.mjs
```

---

## 🏛️ Core Product Architecture

```
src/
├── app/                              # Next.js 16 App Router pages & API handlers
│   ├── (auth)/                       # Login, Register, Auth Callbacks
│   ├── app/                          # Authenticated Core OS routes
│   │   ├── accountability/           # Consequence & Commitment management
│   │   ├── analytics/                # Completion rates, streaks, velocity
│   │   ├── calendar/                 # Bi-directional Google Calendar sync & schedule
│   │   ├── finance/                  # Integer-cents transactions, recurring, budgets
│   │   ├── focus/                    # Deep work sessions, timer engine, focus stats
│   │   ├── goals/                    # Strategic high-level objectives
│   │   ├── habits/                   # Recurring habits & daily routine templates
│   │   ├── onboarding/               # Multi-step personalized user onboarding
│   │   ├── planner/                  # Day/Week/Month time-blocking planner
│   │   ├── projects/                 # Scoped initiatives & deliverables
│   │   ├── review/                   # Structured Weekly Review & Sunday Planning Ritual
│   │   ├── settings/                 # Profile, notification channels, data export
│   │   └── tasks/                    # Task management & deadline tracking
│   └── api/
│       ├── cron/sweep-deadlines/     # Production cron sweeper (timing-safe Bearer auth)
│       └── user/export/              # RFC 4180 ZIP/JSON/CSV account data export
├── components/                       # Shared glassmorphic UI components
├── features/                         # Feature-specific components and UI logic
│   ├── command-center/               # Global Cmd+K palette & universal search
│   ├── focus/                        # Focus timer display, setup & history
│   ├── habits/                       # Habit trackers, routines, streak calculations
│   ├── weekly-review/                # 5-step interactive review wizard & metrics
├── hooks/                            # Reusable React hooks (useUrlState, useSelection)
├── lib/                              # Core domain business logic and engines
│   ├── accountability/               # State machines, resolution, penalty enforcement
│   ├── analytics/                    # Pure deterministic metrics & scoring
│   ├── command-center/               # Registry, fuzzy ranking & entity search
│   ├── export/                       # Data portability & secret sanitization
│   ├── finance/                      # Integer-cents arithmetic, recurrence, budgets
│   ├── focus/                        # Timestamp arithmetic, sound synthesis, metrics
│   ├── habits/                       # Habits, routines, and streak engines
│   ├── integrations/                 # Google Calendar, GitHub, LeetCode, Codeforces
│   ├── notifications/                # Multi-channel alerts (In-App, Email, Webhook)
│   ├── onboarding/                   # Onboarding state machine & profiles
│   ├── supabase/                     # Server, client, and admin Supabase instances
│   ├── url-state/                    # Deterministic URL parsers & serializers
│   ├── validations/                  # Strict Zod domain validation schemas
│   └── weekly-review/                # Week boundaries, metric aggregator, draft state
└── types/                            # Domain TypeScript contracts
```

---

## ⚙️ Background Automation & Cron Scheduling

PACT runs an autonomous, idempotent deadline sweeping engine that expires overdue tasks, transitions commitments, and activates confidential consequences.

### Production Scheduling Methods:
1. **Vercel Cron** (`vercel.json`): Configured to trigger `/api/cron/sweep-deadlines` every minute with timing-safe `CRON_SECRET` authorization.
2. **Supabase `pg_cron`** (`20260911060000_production_hardening_and_cron_schedule.sql`): Runs automated task sweeping and background maintenance directly inside the database cluster.

---

## 🔒 Security Architecture

1. **Strict Server-Side Boundaries**: User identities are derived strictly from verified JWT claims via `supabase.auth.getUser()`. Client-provided `user_id` fields in mutations are rejected.
2. **Consequence Confidentiality**: Hidden consequence data is enforced at the database RLS boundary and scrubbed from client payloads before commitment resolution.
3. **Data Portability & Secret Sanitization**: Data exports (`/api/user/export`) strip all OAuth tokens, refresh tokens, webhook signing secrets, and password hashes before archiving.
4. **Integer-Cents Precision**: Financial balances, limits, and transactions are stored in integer cents (`amount_cents`, `limit_cents`) to prevent IEEE 754 floating-point errors.
5. **Fail-Safe Integration Proofs**: External provider downtime or rate limits (GitHub, LeetCode, Codeforces, Google Calendar) never mark user commitments as failed.

---

## 📄 Documentation Baseline

Comprehensive specifications, system architectures, and engineering runbooks are maintained in the [`docs/`](./docs/README.md) directory:

| Document | Purpose |
|---|---|
| 🌟 [**Master Documentation**](./docs/PACT_MASTER_DOCUMENTATION.md) | Central comprehensive technical and product reference |
| 📖 [**Product Vision**](./docs/PRODUCT.md) | Vision, dual taglines, product philosophy, and core principles |
| 📋 [**Feature Inventory**](./docs/FEATURES.md) | Authoritative inventory of all 14 core product modules |
| 🏗️ [**Architecture**](./docs/ARCHITECTURE.md) | Next.js 16 App Router architecture, server boundaries, and timezone safety |
| 🗄️ [**Data Model**](./docs/DATA_MODEL.md) | Relational entity schemas, trusted fields, indexes, and RLS policies |
| 🔌 [**Integrations**](./docs/INTEGRATIONS.md) | Google Calendar, GitHub, LeetCode, and Codeforces connectors |
| 🔒 [**Security Architecture**](./docs/SECURITY.md) | 28-point security matrix, zero-trust validation, and secret sanitization |
| 🛡️ [**Threat Model**](./docs/THREAT_MODEL.md) | Threat actor matrix, attack surfaces, and defense-in-depth mitigations |
| 💻 [**Developer Guide**](./docs/DEVELOPMENT.md) | Local environment setup, database migrations, and development commands |
| 🧪 [**Testing Strategy**](./docs/TESTING.md) | 34-suite automated test matrix and verification runbooks |
| 🌿 [**Git Workflow**](./docs/GIT_WORKFLOW.md) | Conventional Commits, branch hygiene, and pre-commit safety rules |
| 🗺️ [**Product Roadmap**](./docs/ROADMAP.md) | Verified implementation status and future planned milestones |
| 🎨 [**Design System**](./docs/DESIGN_SYSTEM.md) | Luxury Obsidian & Gold palette, 3D celestial planetary hero, and design tokens |
| 🔄 [**User Flows**](./docs/USER_FLOWS.md) | Domain hierarchy flow, daily planning, and consequence lifecycle |
| 🚀 [**Deployment Runbook**](./docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md) | Production cloud deployment guide and environment configuration |
| 📦 [**Historical Archive**](./docs/archive/README.md) | Preserved historical phase completion reports (Phases 4 through 6) |

---

## 📄 License

This project is licensed under the MIT License.
