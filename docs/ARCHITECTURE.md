# PACT — Technical Architecture & System Design

## 1. Proposed V0 Technology Stack [PROPOSED]

The architecture is designed around type safety, server-authoritative logic, and high visual performance:

| Layer | Technology | Status | Rationale |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router, React 19 / Server Components) | [PROPOSED] | Hybrid SSR/CSR, optimized bundle size, clean server/client boundaries. |
| **Language** | TypeScript (Strict Mode) | [CONFIRMED] | End-to-end type safety across domain models, API routes, and UI components. |
| **Styling** | Tailwind CSS v4 + Vanilla CSS Variables | [PROPOSED] | High-performance utility styling with custom design tokens. |
| **Animations** | Framer Motion | [PROPOSED] | Smooth micro-interactions, layout transitions, and glassmorphism reveals. |
| **Database** | PostgreSQL via Supabase | [PROPOSED] | Relational integrity, native Row-Level Security (RLS), JSONB support. |
| **Authentication** | Supabase Auth | [PROPOSED] | Secure JWT session management, server-side token validation. |
| **Validation** | Zod | [CONFIRMED] | Centralized, schema-driven input validation at server and client boundaries. |
| **Deployment** | Vercel | [PROPOSED] | Optimized for Next.js server actions, edge routing, and automated CI/CD. |

---

## 2. Directory & Modular Architecture Structure [PROPOSED]

PACT adopts a **feature-oriented architecture** with strict boundaries to ensure modularity as the project grows:

```
src/
├── app/                  # Next.js App Router (pages, layouts, API routes)
│   ├── (auth)/           # Authentication layout group
│   ├── (dashboard)/      # Main application dashboard layout group
│   └── api/              # Secure server API endpoints / webhooks
├── components/           # Core shared UI primitives (buttons, inputs, modals, cards)
├── features/             # Isolated feature domain modules
│   ├── auth/             # Authentication logic, hooks, components
│   ├── dashboard/        # Overview widgets, metrics summary
│   ├── tasks/            # Commitment management, task lifecycle logic
│   ├── planner/          # Time-blocking grid, daily schedule
│   ├── projects/         # Project containers, grouping logic
│   ├── goals/            # Goal tracking, progress aggregation
│   ├── accountability/   # Consequence security boundaries & lifecycle
│   ├── finance/          # Expense tracking, category suggestions
│   ├── analytics/        # Performance trends, follow-through ratios
│   ├── integrations/     # GitHub, Codeforces, LeetCode sync connectors
│   └── notifications/    # Alert triggers and delivery logic
├── hooks/                # Global custom React hooks
├── lib/                  # Shared utilities (supabase client, Zod schemas, date utils)
├── services/             # Server-side business logic and data access repositories
├── types/                # TypeScript interface and type definitions
└── styles/               # Global CSS, design tokens, typography
```

---

## 3. Server vs. Client Boundary Rules [CONFIRMED]

To prevent security vulnerabilities and excessive client bundle sizes:
1. **Server Components by Default**: Data fetching, DB queries, and security checks occur in React Server Components or Server Actions.
2. **Client Components Only When Needed**: Interactive state, client event listeners, and animations (`"use client"`) are strictly isolated to leaf components.
3. **No Direct DB Access from Client**: All database operations pass through Supabase client libraries enforced by RLS policies or server-side API routes.

---

## 4. Timezone Strategy & Handling [CONFIRMED]

Timezone is a **first-class domain concern** in PACT. Because PACT handles deadlines, daily time-blocking, recurring schedules, and midnight boundaries:

### Core Rules
1. **UTC Storage**: All timestamps (`created_at`, `updated_at`, `deadline_at`, `completed_at`) are stored in PostgreSQL as `TIMESTAMPTZ` (UTC).
2. **Explicit User Timezone**: User timezone preference (e.g., `America/New_York`, `Asia/Kolkata`) is stored in `users/profiles`.
3. **Server-Side Evaluation**: Deadline breaches and day boundary calculations are performed using the user's explicit timezone on trusted server infrastructure.
4. **No Direct Browser Clock Trust**: Client-side `new Date()` is NEVER trusted for deadline decisions or lifecycle timestamping.

---

## 5. Atomicity & State Operations [CONFIRMED]

Operations modifying security-sensitive state must execute atomically:
- Task completion verification vs. deadline evaluation.
- Consequence state activation.
- Expense category assignments & transaction entries.
- Account integration sync updates.

Database transactions or Supabase RPC stored procedures will be used to prevent partial state corruption.

---

## 6. Authentication Architecture & OAuth Broker Flow [CONFIRMED]

PACT employs **Supabase Auth** as the authoritative identity and session manager across all authentication channels:

### Supported Authentication Methods
1. **Email / Password**: Registration and login validated with Zod (`signUpSchema`, `signInSchema`) and authenticated via `supabase.auth.signUp()` and `supabase.auth.signInWithPassword()`.
2. **Google OAuth 2.0**: Initiated via browser client `supabase.auth.signInWithOAuth({ provider: 'google' })`, brokered through Supabase Auth, and completed via server-side PKCE code exchange at `/auth/callback/route.ts`.

### Unified Identity Model
Regardless of authentication method (Email/Password or Google OAuth), identity converges into a single authenticated user model:
- `auth.getUser()` verifies JWT and cookie session server-side.
- PostgreSQL trigger `on_auth_user_created` automatically inserts a corresponding `public.profiles` row upon `auth.users` creation.
- RLS policies filter data strictly by `auth.uid() = user_id`.

---

## 7. Accountability & Consequence Engine Architecture [CONFIRMED]

PACT introduces the **Accountability & Consequence Engine** as a foundational domain capability while preserving low-friction task creation (`Title` + `Deadline`).

### Core Architectural Principles
1. **Low-Friction Task Creation**: Users configure default accountability preferences once. Normal task creation (`Title` + `Deadline`) automatically inherits the preferred default consequence unless explicitly overridden or disabled.
2. **User Ownership & Storage Isolation**: All consequence definitions, user preferences, and task commitments are owned strictly by the authenticated user (`user_id = auth.uid()`). Cross-user exposure and shared consequences are prohibited.
3. **Commitment Snapshot Immutability**: When accountability is assigned to a task, a dedicated `task_accountability_commitments` record is created containing an immutable JSONB snapshot (`consequence_snapshot`) of the consequence (`title`, `consequence_type`, `action_statement`, `description`). Subsequent edits to reusable `consequence_definitions` or task metadata updates do NOT alter the committed snapshot. Direct client UPDATE or DELETE of commitment snapshots is blocked by database trigger `protect_accountability_commitment_immutability()`.
4. **Deterministic Multi-Default Resolution**: Users can maintain multiple enabled default consequence definitions. The system resolves defaults deterministically by ordering enabled defaults by `(priority DESC, created_at ASC, id ASC)`. Explicit preference `default_consequence_id` serves as a primary override when active.
5. **Integration with Authoritative Task Lifecycle**: The Accountability Engine acts as a reactive subscriber to task state transitions. When a task reaches a terminal state (`completed` or `missed`), the engine executes consequences only for missed tasks.
6. **"PACT Never Assumes Fulfillment"**: An activated consequence cannot be resolved by client-side status flags or forged timestamps. An activated consequence remains activated until authoritatively fulfilled through a server-verified session or an authorized waiver. Direct client updates to `fulfilled` or `waived` are blocked by database triggers.
7. **Server-Authoritative Timed-Session Verification**: Timed consequences require real elapsed server time (`now() - started_at >= required_duration_seconds`). Browser disconnect/reconnect maintains session state idempotently without resetting progress. Supporting evidence (e.g. activity note) is required and validated server-side.
8. **Timezone-Aware Waiver System with Weekly Quotas**: Users may deliberately waive an activated consequence up to 3 times per calendar week (ISO week: Monday–Sunday) calculated using their configured IANA timezone (`profiles.timezone`). Quotas are enforced atomically via row locks. The final user-facing confirmation word is intentionally deferred; the server validates internal token `CONFIRM_WAIVER_V1`.

### Absolute Backend Safety Boundaries [CONFIRMED]
The PACT backend enforces hard safety boundaries at the architecture level:
- **NO Arbitrary Code Execution**: Consequence definitions and snapshots represent declarative instructions, never executable scripts, shell commands, or dynamic code blocks.
- **NO External System Control**: PACT does not issue automated shell commands, external API destructive calls, or control un-vetted external systems.
- **NO Automatic Financial Transfers**: Financial consequences are user-declared accountability records, NOT automated bank or payment processor transfers.
- **NO Dangerous or Coercive Actions**: Physical harm, illegal acts, or coercive mechanics targeting third parties are strictly prohibited.
- **NO Invasive Surveillance**: Verification validates process completion and server-authoritative elapsed time without device surveillance, camera monitoring, or invasive tracking.




