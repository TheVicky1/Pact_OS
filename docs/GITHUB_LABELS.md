# PACT — GitHub Issue Label Taxonomy & Governance

This document serves as the canonical specification and single source of truth for **PACT's GitHub Issue Label Taxonomy**.

---

## 1. Taxonomy Philosophy

A well-structured issue classification system lowers cognitive friction for new contributors and enables efficient triage for maintainers. PACT’s label taxonomy is built around four fundamental questions:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     1. WHAT     │     │  2. DIFFICULTY  │     │     3. TIME     │     │    4. WHERE     │
│  is this issue? │ ──> │ is the task?    │ ──> │ will it take?   │ ──> │ does it belong? │
│   `type:*`      │     │  `difficulty:*` │     │    `time:*`     │     │    `area:*`     │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Compositional Design (No Label Explosion)
Instead of creating dozens of rigid compound labels (e.g., `frontend-beginner-15m-dashboard`), PACT **composes** orthogonal dimensions:
- `type:ui` + `difficulty:beginner` + `time:15-30m` + `area:dashboard` + `good first issue`

This provides precise filtering across GitHub search without label clutter.

---

## 2. Canonical Label Categories

### Summary Matrix

| Category | Prefix | Question Answered | Example Labels |
| :--- | :--- | :--- | :--- |
| **Contribution Type** | `type:*` | *What type of work is required?* | `type:bug`, `type:feature`, `type:ui`, `type:docs` |
| **Difficulty Level** | `difficulty:*` | *What expertise level is expected?* | `difficulty:beginner`, `difficulty:easy`, `difficulty:intermediate` |
| **Estimated Time** | `time:*` | *How long will this task take?* | `time:<15m`, `time:15-30m`, `time:30-60m`, `time:1-2h` |
| **Project Area** | `area:*` | *Which subsystem is affected?* | `area:dashboard`, `area:planner`, `area:finance`, `area:auth` |
| **Community** | *(none)* | *Is this open for community pickup?* | `good first issue`, `help wanted`, `community` |
| **Workflow Status** | `status:*` | *What is the issue's triage state?* | `status:blocked`, `status:needs-discussion`, `status:needs-review` |

---

## 3. Label Dictionary

### Category A — Contribution Type (`type:*`)

#### `type:bug`
- **Color:** `#D73A4A` (Red)
- **Purpose:** Something is broken, malfunctioning, failing validation, or producing incorrect results.
- **When to use:** Broken state transitions, UI rendering errors, broken links, arithmetic bugs, crashes.
- **When NOT to use:** New feature requests, cosmetic redesigns without defect, or refactoring.
- **Example Issue:** `fix(planner): midnight rollover causes event overlap on timeline`

#### `type:feature`
- **Color:** `#A2EEEF` (Soft Cyan)
- **Purpose:** Proposing a new user capability, domain engine expansion, or major product enhancement.
- **When to use:** Adding a new focus session sound, supporting a new proof provider, or adding a dashboard metric.
- **When NOT to use:** Fixing existing defects or non-functional refactoring.
- **Example Issue:** `feat(focus): add binaural beat synthesizer presets`

#### `type:docs`
- **Color:** `#0075CA` (Blue)
- **Purpose:** Documentation additions, corrections, architecture explanations, or guide updates.
- **When to use:** README updates, contributor guide clarifications, troubleshooting steps, docstring typos.
- **When NOT to use:** Changes that modify runtime application code (`src/**`).
- **Example Issue:** `docs(contributing): clarify local Supabase CLI setup prerequisites`

#### `type:ui`
- **Color:** `#E99695` (Soft Pink)
- **Purpose:** Visual styling, layout ergonomics, card geometry, micro-interactions, or design system tokens.
- **When to use:** Adjusting card hover elevation, fixing mobile padding, aligning badges, or updating typography.
- **When NOT to use:** Pure logic bugs with no visual element.
- **Example Issue:** `ui(dashboard): refine metric card border contrast on mobile viewports`

#### `type:a11y`
- **Color:** `#1D76DB` (Ocean Blue)
- **Purpose:** Accessibility improvements, keyboard navigation, ARIA labeling, and color contrast.
- **When to use:** Adding missing `aria-label` to icon buttons, modal focus traps, screen reader landmarks.
- **When NOT to use:** General visual design changes unrelated to accessibility standards.
- **Example Issue:** `a11y(modal): add keyboard escape listener and focus trap to task modal`

#### `type:test`
- **Color:** `#BFDADC` (Pale Teal)
- **Purpose:** Unit tests, integration tests, mock data fixtures, or test matrix improvements.
- **When to use:** Adding test coverage for edge cases, testing state machine transitions, hardening test runners.
- **When NOT to use:** Feature code changes where tests are merely supporting files.
- **Example Issue:** `test(finance): add edge-case unit tests for zero-cent split allocations`

#### `type:performance`
- **Color:** `#D93F0B` (Rust Orange)
- **Purpose:** Latency reduction, bundle optimization, database query optimization, or render efficiency.
- **When to use:** Memoizing heavy components, optimizing Next.js dynamic imports, indexing slow queries.
- **When NOT to use:** Minor refactors with no measurable performance impact.
- **Example Issue:** `perf(calendar): virtualize month view grid for large event datasets`

#### `type:refactor`
- **Color:** `#E4E669` (Subtle Yellow)
- **Purpose:** Internal code restructuring, dead code pruning, or type safety hardening without behavioral change.
- **When to use:** Consolidating duplicate date math helpers, cleaning up obsolete types, modularizing handlers.
- **When NOT to use:** Bug fixes (use `type:bug`) or visual changes (use `type:ui`).
- **Example Issue:** `refactor(time): centralize ISO date parsing into lib/time.ts`

#### `type:security`
- **Color:** `#B60205` (Deep Crimson)
- **Purpose:** Security hardening, RLS policy audit, input sanitization, or vulnerability mitigation.
- **When to use:** Strengthening Row Level Security policies, preventing XSS, tightening Zod validation schemas.
- **When NOT to use:** Public reporting of active sensitive zero-day exploits (refer to [SECURITY.md](../SECURITY.md)).
- **Example Issue:** `security(rls): add strict user ownership check on notification deletions`

#### `type:integration`
- **Color:** `#5319E7` (Deep Indigo)
- **Purpose:** External connectors and third-party APIs (Google Calendar, GitHub, LeetCode, Codeforces).
- **When to use:** OAuth token refresh handling, webhook payload parsing, API rate-limit resilience.
- **When NOT to use:** Internal domain engines that have no external API dependencies.
- **Example Issue:** `feat(integrations): add LeetCode GraphQL submission streak verification`

---

### Category B — Difficulty Level (`difficulty:*`)

#### `difficulty:beginner`
- **Color:** `#0E8A16` (Forest Green)
- **Purpose:** Genuinely accessible tasks for first-time open-source contributors.
- **When to use:** Narrow scope, explicit file paths, clear acceptance criteria, zero architectural ambiguity.
- **When NOT to use:** Tasks requiring multi-system refactoring, database migrations, or security changes.
- **Recommended companion:** `good first issue`

#### `difficulty:easy`
- **Color:** `#7057FF` (Lavender Purple)
- **Purpose:** Straightforward tasks requiring basic familiarity with React, TypeScript, or Tailwind CSS.
- **When to use:** Single-component tweaks, localized helper functions, standard form field additions.
- **When NOT to use:** Complex state machines or cross-cutting architectural modifications.

#### `difficulty:intermediate`
- **Color:** `#FBCA04` (Warm Amber)
- **Purpose:** Tasks requiring solid understanding of PACT domain engines, Server Actions, or Supabase RLS.
- **When to use:** Multi-file state transitions, new API routes, database schema additions, third-party API handlers.
- **When NOT to use:** Trivial single-line changes or massive multi-week architectural redesigns.

#### `difficulty:advanced`
- **Color:** `#D93F0B` (Burnt Orange)
- **Purpose:** Complex engineering tasks requiring deep domain knowledge, concurrency handling, or security auditing.
- **When to use:** Autonomous cron sweeper changes, database migration sequencing, cryptographic consequence masking.
- **When NOT to use:** Beginner onboarding tasks.

---

### Category C — Estimated Time (`time:*`)

| Label | Color | Target Duration | Contributor Experience |
| :--- | :--- | :--- | :--- |
| `time:<15m` | `#C5DEF5` | < 15 minutes | Quick typo, one-line CSS tweak, or docstring fix. Perfect for immediate first PRs. |
| `time:15-30m` | `#BFD4F2` | 15–30 minutes | Localized UI component adjustment or adding an isolated unit test. |
| `time:30-60m` | `#D4C5F9` | 30–60 minutes | Form validation refinement, new hook utility, or modal enhancement. |
| `time:1-2h` | `#FEF2C0` | 1–2 hours | New domain calculation helper, multi-view responsive polish, or API route. |
| `time:2-4h` | `#F9D0C4` | 2–4 hours | Full feature sub-component, integration connector enhancement, or RLS hardening. |
| `time:4h+` | `#F8B4B4` | 4+ hours | Multi-phase subsystem work, major database migration, or architectural milestone. |

---

### Category D — Project Area (`area:*`)

All area labels map directly to PACT’s verified architecture (`#333333` Charcoal Base):

| Area Label | Architectural Subsystem | Key Directories & Files |
| :--- | :--- | :--- |
| `area:dashboard` | Main OS Overview & Metric Cards | `src/features/dashboard/`, `src/app/app/overview/` |
| `area:planner` | Daily Planner & Timeblocking | `src/features/planner/`, `src/app/app/planner/` |
| `area:calendar` | Calendar Engine & Google Sync UI | `src/features/calendar/`, `src/app/app/calendar/` |
| `area:tasks` | Task Lifecycle & Priority Engine | `src/features/tasks/`, `src/app/app/tasks/` |
| `area:goals` | OKR Hierarchy & Milestone Tracker | `src/features/goals/`, `src/app/app/goals/` |
| `area:projects` | Project Workspaces & Status Boards | `src/features/projects/`, `src/app/app/projects/` |
| `area:accountability` | Stakes, Referees & Penalties | `src/features/accountability/`, `src/lib/accountability/` |
| `area:focus` | Deep Work Timer & Audio Synth | `src/features/focus/`, `src/lib/focus/` |
| `area:habits` | Habit Recurrence & Streak Engine | `src/features/habits/`, `src/lib/habits/` |
| `area:finance` | Integer-Cents Ledger & Budgets | `src/features/finance/`, `src/lib/finance/` |
| `area:analytics` | Velocity Scoring & Visualizations | `src/features/analytics/`, `src/lib/analytics/` |
| `area:review` | Weekly Review Rituals & Drafts | `src/features/review/`, `src/lib/weekly-review/` |
| `area:auth` | Login, Registration & Onboarding | `src/components/auth/`, `src/app/(auth)/` |
| `area:integrations` | External Proof Connectors | `src/lib/integrations/` (GitHub, LeetCode, Codeforces) |
| `area:settings` | User Preferences & Profile Config | `src/app/app/settings/` |
| `area:database` | PostgreSQL Migrations, Schema & RLS | `supabase/migrations/` |
| `area:testing` | Automated 34-Suite Test Matrix | `tests/`, `scratch/run-tests.mjs` |
| `area:documentation` | Guides, Specs & Contributor Docs | `docs/`, `README.md`, `CONTRIBUTING.md` |
| `area:developer-experience` | Tooling, Dev Setup & Workflows | `package.json`, `scratch/`, scripts |

---

### Special Community Labels

#### `good first issue`
- **Color:** `#7057FF` (GitHub Official Purple)
- **Purpose:** Highlighted by GitHub's global discoverability feed. Reserved exclusively for straightforward, well-documented beginner tasks.
- **Rule:** MUST be paired with `difficulty:beginner`. Never place on complex or ambiguous tasks.

#### `help wanted`
- **Color:** `#008672` (Teal Green)
- **Purpose:** Signals that maintainers are actively seeking community contributions for this issue.

#### `community`
- **Color:** `#E11D48` (Rose Red)
- **Purpose:** Community-driven initiatives, discussions, user experience feedback, or documentation crowdsourcing.

---

### Optional Status Labels (`status:*`)

#### `status:blocked`
- **Color:** `#6A737D` (Slate Gray)
- **Purpose:** Work cannot proceed until an upstream dependency, PR, or external decision is resolved.

#### `status:needs-discussion`
- **Color:** `#6A737D` (Slate Gray)
- **Purpose:** Core design, product direction, or technical approach requires discussion before code is written.

#### `status:needs-review`
- **Color:** `#6A737D` (Slate Gray)
- **Purpose:** Pull request has been submitted and is awaiting maintainer code review.

---

## 4. Label Composition Guide

Maintainers should compose labels to provide complete, unambiguous context for every issue:

### Example 1: First-Time Contributor UI Polishing
```
type:ui
difficulty:beginner
time:15-30m
area:dashboard
good first issue
```
*Tells contributor: "A 20-minute visual UI tweak on the dashboard, ideal for first-time open-source contributors."*

### Example 2: Quick Documentation Fix
```
type:docs
difficulty:beginner
time:<15m
area:documentation
good first issue
community
```
*Tells contributor: "A super-fast documentation fix that takes under 15 minutes."*

### Example 3: Accessibility Improvement
```
type:a11y
difficulty:easy
time:30-60m
area:planner
good first issue
```
*Tells contributor: "An accessibility fix on the daily planner keyboard controls taking under an hour."*

### Example 4: Complex Backend Integration
```
type:integration
difficulty:advanced
time:4h+
area:integrations
help wanted
```
*Tells contributor: "An advanced integration feature requiring deep API knowledge and extensive testing."*

---

## 5. Strict Labeling Rules & Governance

1. **Rule 1 (Single Type):** Every standard issue must have exactly **1** `type:*` label.
2. **Rule 2 (Single Difficulty):** Every actionable implementation issue must have exactly **1** `difficulty:*` label.
3. **Rule 3 (Single Time Estimate):** Where estimation is feasible, assign exactly **1** `time:*` label.
4. **Rule 4 (Single Primary Area):** Assign **1** primary `area:*` label (or at most 2 if cross-cutting).
5. **Rule 5 (`good first issue` Discipline):** Only assign `good first issue` when paired with `difficulty:beginner` and accompanied by clear reproduction steps or exact file pointers.
6. **Rule 6 (No Contradictions):** Never assign conflicting labels (e.g., `difficulty:beginner` + `difficulty:advanced`).

---

## 6. Provisioning & Setup

The canonical label taxonomy is provisioned idempotently using the maintenance script:
```bash
node scratch/setup-github-labels.mjs
```

Maintainers with repository admin access can run this script with `GITHUB_TOKEN` configured, or execute the generated GitHub CLI commands to create or sync all 45 canonical labels.
