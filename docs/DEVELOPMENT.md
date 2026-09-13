# PACT — Developer Guide & Local Environment Setup

This document provides a comprehensive guide for developers contributing to the PACT codebase, including local development setup, database migrations, testing workflows, and environment configuration.

---

## 1. Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (v10+)
- **Database**: PostgreSQL 15+ (local instance or Supabase Cloud project)
- **Supabase CLI** (optional, for local migration management): `npm i -g supabase`

---

## 2. Local Environment Setup

### 2.1 Clone and Install Dependencies
```bash
# 1. Clone repository fork
git clone https://github.com/<your-username>/Pact_OS.git
cd Pact_OS

# 2. Add upstream remote
git remote add upstream https://github.com/TheVicky1/Pact_OS.git

# 3. Install dependencies
npm install
```

### 2.2 Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

| Variable | Description | Required | Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | Yes | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | Yes | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | Yes (Server) | `eyJhbGciOi...` |
| `CRON_SECRET` | Secret token for `/api/cron/sweep-deadlines` | Yes (Cron) | `random_secure_hex_string` |
| `NEXT_PUBLIC_APP_URL` | Public application URL | Yes | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Optional | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Optional | `GOCSPX-xxx` |
| `GITHUB_CLIENT_ID` | GitHub Integration Client ID | Optional | `Ov23xxx` |
| `GITHUB_CLIENT_SECRET` | GitHub Integration Client Secret | Optional | `ghs_xxx` |

---

## 3. Database Migrations

Database schemas and lifecycle triggers are managed through ordered SQL migrations in `supabase/migrations/`:

```bash
# To apply migrations against local or remote Supabase instance:
supabase db reset    # For local Supabase CLI
# OR execute migrations sequentially via Supabase SQL Editor / psql
```

### Migration Overview
1. `20260906000000_create_profiles_table.sql`: User profile and timezone metadata.
2. `20260907000000_create_core_domain_tables.sql`: Goals, projects, tasks, and commitments.
3. `20260907010000_task_lifecycle_engine.sql`: Task transitions and audit triggers.
4. `20260907020000_accountability_foundation.sql`: Commitments and consequences.
5. `20260908000000_accountability_resolution_engine.sql`: Penalty resolution and waivers.
6. `20260909000000_create_calendar_events.sql`: Calendar schedule and timeblocks.
7. `20260910000000_create_finance_tables.sql`: Integer-cents transactions and budgets.
8. `20260911000000_deadline_sweeper_engine.sql`: Automated task and commitment sweeper.
9. `20260911010000_create_notifications_table.sql`: In-app notification queue and channels.
10. `20260911020000_google_calendar_sync.sql`: Google Calendar token storage and sync logs.
11. `20260911030000_external_proof_of_work.sql`: GitHub, LeetCode, and Codeforces proof tables.
12. `20260911040000_financial_discipline.sql`: Budget alert triggers and recurrence rules.
13. `20260911050000_user_onboarding.sql`: Multi-step onboarding state machine.
14. `20260911060000_production_hardening_and_cron_schedule.sql`: pg_cron schedule definitions.
15. `20260911070000_focus_sessions_engine.sql`: Focus timer sessions and analytics.
16. `20260911080000_habits_and_routines_engine.sql`: Habits, routines, and streak calculation.
17. `20260911090000_weekly_reviews_engine.sql`: Weekly review rituals and draft state.

---

## 4. Running the Development Server

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Testing & Quality Assurance

PACT enforces a strict 41-suite automated test matrix verifying domain engines, math precision, security boundaries, and integration reliability.

```bash
# 1. Run all 41 automated domain test suites
node scratch/run-tests.mjs

# 2. Run TypeScript strict typecheck
npx tsc --noEmit

# 3. Run ESLint code quality checks
npm run lint

# 4. Run zero-secret leak scanner
node scratch/secret-scan.mjs

# 5. Production build test
npm run build
```

---

## 6. Project Structure & Key Directories

```
src/
├── app/                  # Next.js App Router (pages, layouts, error boundaries)
│   ├── (auth)/           # Authentication pages & OAuth callbacks
│   ├── (dashboard)/app/  # Authenticated OS core modules
│   └── api/              # API Route Handlers (cron sweepers, data exports)
├── components/           # Shared glassmorphic UI components
├── features/             # Feature-specific components and UI logic
├── hooks/                # Custom React hooks (useUrlState, useSelection)
├── lib/                  # Pure domain engines, calculations, and services
│   ├── accountability/   # Commitment state machines & consequence execution
│   ├── analytics/        # Velocity scoring & completion rate math
│   ├── finance/          # Integer-cents arithmetic & budget evaluation
│   ├── focus/            # Deep work timer calculations & sound synthesis
│   ├── habits/           # Habit recurrence loops & streak engines
│   ├── integrations/     # External proof connectors (GitHub, LeetCode, Codeforces)
│   ├── notifications/    # Multi-channel notification dispatcher
│   ├── supabase/         # Server, client, and admin Supabase instances
│   ├── validations/      # Zod validation schemas for all mutations
│   └── weekly-review/    # Metric aggregation & weekly boundary calculations
└── types/                # TypeScript domain contracts
```

---

## 7. Development Best Practices

1. **Integer-Cents for Currency**: Never use floating-point numbers for money. Always store and calculate financial values in integer cents (`amount_cents`).
2. **Server-Side Identity**: Never trust `user_id` provided in client payloads. Always verify identity using `supabase.auth.getUser()`.
3. **Zod Validation**: Always validate Server Action inputs against strict Zod schemas before running business logic.
4. **Timezone Awareness**: Always use `lib/time.ts` utilities for date operations to respect the user's configured profile timezone.
5. **Fail-Safe Third-Party Calls**: External integration calls must always be wrapped in try/catch blocks that transition to `RETRY_PENDING` on failure rather than throwing unhandled exceptions.
