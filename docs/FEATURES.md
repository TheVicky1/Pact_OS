# PACT — Canonical Feature Inventory & Module Reference

This document provides the authoritative inventory of all 14 integrated product systems in PACT, detailing their capabilities, routes, and verified implementation status.

---

## 1. Feature Module Matrix

| # | System / Module | Route | Implementation Status | Scope & Capabilities |
|---|---|---|---|---|
| 1 | **Authentication & Onboarding** | `/`, `/app/onboarding` | `IMPLEMENTED` | Unified single-screen landing page with email/password, Google OAuth, password reset, and a 4-step personalized onboarding setup wizard. |
| 2 | **Command Center & Overview Dashboard** | `/app` | `IMPLEMENTED` | Daily situational operating system featuring a photorealistic 3D celestial hero, 4 primary metric cards with 8% gold orbital geometry, Immediate Focus spotlight card, Follow-Through rate track, 24H activity cadence histogram, daily calendar with unclipped event modal, quick-capture palette, and universal search (`Cmd+K`). |
| 3 | **Tasks & Backlog** | `/app/tasks` | `IMPLEMENTED` | Complete task management with priority matrix, estimated duration, scheduled times, deadline tracking, and bulk multi-select operations. |
| 4 | **Planner** | `/app/planner` | `IMPLEMENTED` | Day, Week, and Month time-blocking views with drag-and-drop scheduling, timezone boundary enforcement, and calendar event conflict markers. |
| 5 | **Goals** | `/app/goals` | `IMPLEMENTED` | Long-term strategic intentional targets with milestone progress bars, associated projects, and deadline indicators. |
| 6 | **Projects** | `/app/projects` | `IMPLEMENTED` | Scoped initiatives and deliverable containers grouping associated tasks, tracking phase completion rates and deadlines. |
| 7 | **Accountability & Partner Portal** | `/app/accountability` | `IMPLEMENTED` | Commitment contract engine binding tasks to confidential consequences, waiver quotas (max 2/week), written reflections, resolution workflows, and cryptographic partner verification review links. |
| 8 | **Finance & Cash Flow** | `/app/finance` | `IMPLEMENTED` | Integer-cents transaction ledger (`amount_cents`), recurring expense rules, net cash flow calculation, and budget ceiling threshold alerts. |
| 9 | **Focus Timer** | `/app/focus` | `IMPLEMENTED` | Deep work sessions with configurable intervals (Pomodoro/Flow), Web Audio synthesized chimes, task association, and session metrics. |
| 10 | **Habits & Routines** | `/app/habits` | `IMPLEMENTED` | Recurring daily/weekly habit loops, morning/evening routine templates, daily completion logging, and active streak counters. |
| 11 | **Weekly Review** | `/app/review` | `IMPLEMENTED` | 5-step interactive Sunday planning ritual: Celebrate Wins, Review Metrics, Process Incompletes, Calibrate Goals, and Commit Next Week. |
| 12 | **Analytics & Scoring** | `/app/analytics` | `IMPLEMENTED` | Quantitative follow-through scoring, task completion velocity, weekly trend comparisons, and historical performance breakdowns. |
| 13 | **Integrations** | `/app/integrations` | `IMPLEMENTED` | Connectors for Google Calendar (OAuth bi-directional sync), GitHub (commits/PRs), LeetCode (daily problems), Codeforces (submissions), and WakaTime (active IDE coding time). |
| 14 | **Settings & Portability** | `/app/settings` | `IMPLEMENTED` | User profile management, timezone settings, notification dispatch preferences, RFC 4180 ZIP/JSON/CSV account export, and full round-trip JSON backup restore engine. |

---

## 2. Core System Deep Dives

### 2.1 Overview Dashboard & Command Center
- **3D Celestial Hero**: Photorealistic 3D planet sphere with multi-layer SVG radial lighting (`#1E1E26` $\rightarrow$ `#050507`), Rayleigh back-scatter, razor-thin gold crescent specular highlight (`#FFF7D6`/`#D4AF37`), atmospheric corona, and active date navigation controls with 350ms delay-gated non-obstructive tooltips.
- **Metric Cards Matrix**: 4 standardized `#0C0C0F` cards (Pending Commitments, Active Goals, Active Projects, Missed Commitments) with faint 8% gold orbital corner geometry, `#F5F5F5` numerals, `ArrowUpRight` indicators, and hover micro-elevation.
- **Immediate Focus Spotlight**: Active commitment focus card with upper-right radial gold spotlight (`rgba(212,175,55,0.06)`), priority indicator, and status badge.
- **Cadence & Follow-Through Widgets**: Linear follow-through completion progress track and 24-hour activity distribution histogram.
- **Daily Calendar Integration**: Time-blocked schedule view with gold real-time indicator line and accessible, unclipped `z-50` centered event creation modal.

### 2.2 Accountability, Consequences & Partner Portal
- **State Machine**: `DRAFT` ➔ `ACTIVE` ➔ `COMPLETED` / `BREACHED` ➔ `CONSEQUENCE_ACTIVATED` ➔ `RESOLVED` / `WAIVED`.
- **Confidentiality**: Penalty details remain masked in database queries until activated by deadline breach.
- **Partner Verification**: Generates secure SHA-256 tokenized review links for external accountability buddies to inspect evidence and submit attestations without leaking internal penalties.
- **Autonomous Sweeping**: Handled by `/api/cron/sweep-deadlines` with timing-safe `CRON_SECRET` authorization.
- **Fulfillment Modes**: Written reflection, public declaration, or completion of emergency backlog tasks.

### 2.3 External Proof-of-Work Verification
- **GitHub**: Verifies real commit counts and merged PRs within commitment time windows.
- **LeetCode**: Fetches public daily problem submissions via GraphQL.
- **Codeforces**: Verifies problem verdicts and contest submissions via public REST APIs.
- **WakaTime**: Verifies active editor coding time, project durations, and language metrics via REST API.
- **Resilience**: Third-party outages or rate limits trigger a `RETRY_PENDING` state and never mark user commitments as failed.

### 2.4 Financial Discipline
- **Integer Cents Precision**: Eliminates IEEE 754 floating-point errors by storing and calculating all amounts as integer cents (`amount_cents`).
- **Budget Envelopes**: Visual warnings trigger at 80% ceiling and breach alerts trigger at 100% of category limits.
- **Recurrence Engine**: Automatically computes projected monthly fixed overhead and net cash savings.

### 2.5 Deep Work Focus Timer
- **Precision Timekeeping**: Web Worker background timer with timestamp differential arithmetic.
- **Audio Chimes**: Pure synthesized Web Audio API tones (no external audio assets required).
- **Session Attribution**: Focus sessions are linked to specific projects or tasks and aggregated into analytics.

### 2.6 Habits & Daily Routines
- **Routine Templates**: Structured stacks of daily habits (e.g., Morning Kickoff, Evening Wind-down).
- **Streak Calculation**: Pure deterministic calculation handling rest days and timezone roll-overs.

---

## 3. Scope Boundaries & Future Directions

### Current Scope (Certified)
- Full relational domain model across all 14 core areas.
- Server-authoritative mutations with zero-trust validation.
- Responsive dark glassmorphic design system.
- Biometric WebAuthn passkey authentication & RLS security model.
- Offline-first local synchronization & IndexedDB delta sync engine.

### Future Scope (Planned)
- Native mobile companion application (React Native / Expo).
