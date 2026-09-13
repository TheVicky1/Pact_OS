# PACT — Technical Architecture & System Design

This document details the production architecture, technology stack, security boundaries, and execution models of the PACT Personal Operating System.

---

## 1. Production Technology Stack

| Layer | Technology | Status | Implementation Details |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router) + React 19 | `IMPLEMENTED` | Hybrid Server/Client Components, Next.js Server Actions for mutations. |
| **Language** | TypeScript (Strict Mode) | `IMPLEMENTED` | End-to-end type safety across domain models, actions, and UI contracts. |
| **Styling** | Tailwind CSS v4 + Vanilla CSS Tokens | `IMPLEMENTED` | High-performance CSS engine with glassmorphism design tokens and gold accents. |
| **Animations** | Framer Motion | `IMPLEMENTED` | GPU-accelerated transitions, modal reveals, and ambient OS core lighting. |
| **Database & Auth** | PostgreSQL 15+ via Supabase | `IMPLEMENTED` | Row Level Security (RLS) on all tables, auth cookie sessions via `@supabase/ssr`. |
| **Validation** | Zod (v4) | `IMPLEMENTED` | Schema validation on 100% of server actions and API route inputs. |
| **Background Cron** | Vercel Cron & Supabase `pg_cron` | `IMPLEMENTED` | 1-minute automated deadline sweeping with timing-safe Bearer authentication. |
| **Deployment** | Vercel / Cloud Edge | `IMPLEMENTED` | Edge caching, Serverless functions, and automated build pipelines. |

---

## 2. Directory & Modular Architecture

```
src/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth callbacks & redirects
│   ├── (dashboard)/app/              # 14 Core OS modules
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
│   ├── api/                          # Route Handlers (/api/cron/sweep-deadlines, /api/user/export)
│   ├── globals.css                   # Tailwind v4 theme, animations & design tokens
│   ├── layout.tsx                    # Root HTML layout & font declarations
│   └── page.tsx                      # Single-screen unified landing & auth entry
├── components/                       # Shared glassmorphic UI components & icons
├── features/                         # Feature-specific UI components and view models
├── hooks/                            # Custom React hooks (useUrlState, useSelection)
├── lib/                              # Pure domain engines, math, and business logic
│   ├── accountability/               # Commitment state machines & consequence execution
│   ├── analytics/                    # Velocity scoring & completion rate math
│   ├── command-center/               # Registry, fuzzy ranking & entity search
│   ├── export/                       # Data portability & secret sanitization
│   ├── finance/                      # Integer-cents arithmetic & budget evaluation
│   ├── focus/                        # Deep work timer calculations & sound synthesis
│   ├── habits/                       # Habit recurrence loops & streak engines
│   ├── integrations/                 # External proof connectors (GitHub, LeetCode, Codeforces)
│   ├── notifications/                # Multi-channel notification dispatcher
│   ├── supabase/                     # Server, client, and admin Supabase instances
│   ├── url-state/                    # Deterministic URL parsers & serializers
│   ├── validations/                  # Strict Zod domain validation schemas
│   └── weekly-review/                # Metric aggregation & weekly boundary calculations
└── types/                            # Domain TypeScript contracts
```

---

## Focus & Deep Work Audio Engine

PACT includes an offline, client-side ambient sound synthesizer located in `src/lib/focus/sound.ts` that generates focus soundscapes without external audio assets or network requests.

- **Core Technology**: Built on native browser `AudioContext` with lazy initialization upon user interaction.
- **Synthesizer Components**: Utilizes `BiquadFilterNode`, custom audio buffer generators, and Web Audio oscillators to produce focus frequencies and auditory chimes (start, pause, and completion chimes using sine and triangle wave patterns).
- **Privacy & Performance Guarantee**: Fully offline-first design ensuring zero telemetry leaks or external bandwidth consumption for background soundscapes.

---

## 3. Server vs. Client Boundary Architecture

1. **Server Actions for Mutations**: All mutations (create/update/delete) are performed through Next.js Server Actions with strict Zod validation.
2. **Server Identity Verification**: Actions derive user identity solely from `supabase.auth.getUser()`. Client-submitted `user_id` fields are rejected.
3. **Client Leaves**: Interactive controls, timer clocks, and drag-and-drop canvases are encapsulated in `"use client"` leaf components.
4. **URL as State**: Filters, tabs, and dates are serialized directly to URL search params using `useUrlState`, enabling deep-linking and browser back/forward fidelity.

---

## 4. Timezone & Temporal Architecture

Because PACT governs deadlines, day-level planning, and midnight habit resets:

1. **Storage in UTC**: All timestamps in PostgreSQL are stored as `TIMESTAMPTZ` (UTC).
2. **Profile Timezone Anchor**: The user's IANA timezone (e.g. `America/New_York`, `Asia/Kolkata`) is fetched on login and stored in `profiles.timezone`.
3. **Deterministic Math**: Calculations in `lib/time.ts` convert UTC timestamps to the user's localized day boundaries before calculating streaks or daily timeblocks.
4. **No Direct Browser Clock Trust**: Critical status transitions (e.g., `mark_task_missed`) are evaluated server-side against authoritative server timestamps.

---

## 5. Security Architecture & Threat Boundary

1. **Row Level Security (RLS)**: 100% of database tables enforce `auth.uid() = user_id`.
2. **Consequence Confidentiality**: Unactivated consequence payloads remain encrypted/masked in the database to prevent client inspection prior to a deadline breach.
3. **Data Portability**: Full account export (`/api/user/export`) generates sanitized RFC 4180 archives, stripping OAuth tokens and password hashes before compression.
4. **Zero Float Financial Arithmetic**: Currency is handled strictly in integer cents (`amount_cents`) to eliminate IEEE 754 precision errors.
