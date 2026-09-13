# PACT — GitHub Issue Label Taxonomy & Governance

This document serves as the canonical specification and single source of truth for **PACT's GitHub Label Taxonomy & Merge Governance**.

---

## 1. Core 12-Label Open-Source Taxonomy

To keep the contributor experience clear, low-friction, and predictable, PACT standardizes on a **focused 12-label core taxonomy** for all public issues and pull requests:

| # | Label | Color | Category | Purpose & Contributor Guidance |
| :-: | :--- | :---: | :--- | :--- |
| **1** | `good first issue` | `#7057FF` | Community | Curated, self-contained task specifically structured for first-time contributors. |
| **2** | `help wanted` | `#008672` | Community | Maintainer is actively welcoming community contributions on this issue. |
| **3** | `documentation` | `#0075CA` | Type | Markdown, documentation guides, README updates, or JSDoc docstrings. |
| **4** | `enhancement` | `#A2EEEF` | Type | Small improvement, refinement, or non-breaking feature enhancement. |
| **5** | `bug` | `#D73A4A` | Type | Confirmed defect, broken calculation, or malfunctioning UI component. |
| **6** | `accessibility` | `#1D76DB` | Type | Accessibility / a11y improvements (ARIA labels, keyboard navigation, contrast). |
| **7** | `ui` | `#E99695` | Type | UI visual styling, responsive layout polish, or micro-interaction adjustments. |
| **8** | `testing` | `#BFDADC` | Type | Unit tests, test matrix expansion, boundary fixtures, and regression coverage. |
| **9** | `difficulty:beginner` | `#0E8A16` | Difficulty | Beginner-friendly task with single-file scope and clear acceptance criteria (5–30m). |
| **10** | `area:core` | `#333333` | Area | Core domain logic, shared arithmetic helpers, security, and utility services. |
| **11** | `area:dashboard` | `#333333` | Area | Dashboard overview, navigation, workspaces, and user interfaces. |
| **12** | `hacktoberfest` | `#FF7518` | Community | Eligible high-quality task for open-source community events. |

### Label Application Rule for Beginner Issues
Every good-first-issue is tagged with **2–4 labels** (e.g., `good first issue` + `documentation` + `difficulty:beginner`).

---

## 2. Taxonomy Philosophy

A well-structured issue classification system lowers cognitive friction for new contributors, facilitates GitHub issue search discovery, and enables deterministic triage automation.

PACT’s label taxonomy is organized around **orthogonal dimensions**:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     1. WHAT     │     │  2. IMPORTANCE  │     │  3. DIFFICULTY  │     │    4. WHERE     │     │   5. LIFECYCLE  │
│  is this work?  │ ──> │ is the urgency? │ ──> │ is the scope?   │ ──> │ does it belong? │ ──> │ is the status?  │
│    `type:*`     │     │  `priority:*`   │     │ `difficulty:*`  │     │    `area:*`     │     │   `status:*`    │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

> [!IMPORTANT]
> **PERMANENT RULE: NO TIME-BASED LABELS ON NEW ISSUES**
> `time:*` labels are **permanently retired and forbidden** for newly created issues. Contributor scope and cognitive difficulty are communicated strictly via `difficulty:beginner` alongside the micro-issue standard (1 file preferred, 5–30m estimated completion time).

---

## 3. Comprehensive Label Dictionary & Automation Eligibility

### Category A — Contribution Type (`type:*`)

#### `type:bug`
- **Color:** `#D73A4A` (Red)
- **Purpose:** Something is broken, malfunctioning, failing validation, or producing incorrect results.
- **When to Apply:** Broken state transitions, UI rendering glitches, link 404s, arithmetic discrepancies, unhandled crashes.
- **When NOT to Apply:** New feature requests, cosmetic enhancements without defect, refactoring.
- **Example:** `fix(planner): midnight rollover causes event overlap on timeline`
- **Automation Eligibility:** Auto-applied by `.github/ISSUE_TEMPLATE/bug_report.yml`.

#### `type:feature`
- **Color:** `#A2EEEF` (Soft Cyan)
- **Purpose:** Proposing a new capability, user-facing workflow, or domain engine expansion.
- **When to Apply:** Adding a focus session audio preset, supporting a new proof provider, adding an analytics view.
- **When NOT to Apply:** Defect repairs or internal chore refactorings.
- **Example:** `feat(focus): add binaural beat synthesizer presets`
- **Automation Eligibility:** Auto-applied by `.github/ISSUE_TEMPLATE/feature_request.yml`.

#### `type:documentation` (alias: `type:docs`)
- **Color:** `#0075CA` (Blue)
- **Purpose:** Documentation additions, clarifications, architecture guides, docstrings, or typo fixes.
- **When to Apply:** README updates, contributor onboarding clarifications, troubleshooting steps, API specifications.
- **When NOT to Apply:** Changes modifying runtime TypeScript/React application logic in `src/**`.
- **Example:** `docs(contributing): clarify local Supabase CLI setup prerequisites`
- **Automation Eligibility:** Auto-applied by `.github/ISSUE_TEMPLATE/documentation.yml` or PR path matching `docs/**`, `*.md`.

#### `type:security`
- **Color:** `#B60205` (Deep Crimson)
- **Purpose:** Security hardening, RLS policy audit, secret protection, vulnerability remediation, or dependency patch.
- **When to Apply:** Row Level Security tightening, input validation schemas, Dependabot security PRs.
- **When NOT to Apply:** Active exploitable vulnerability reports (submit privately per [SECURITY.md](../SECURITY.md)).
- **Example:** `security(rls): add strict user ownership check on notification deletions`
- **Automation Eligibility:** Auto-applied to Dependabot security alerts and PRs.

#### `type:maintenance`
- **Color:** `#E4E669` (Subtle Gold)
- **Purpose:** Repository upkeep, dependency upgrades, build script improvements, linter updates, cleanups.
- **When to Apply:** Upgrading Next.js/React versions, pruning unused files, refactoring build helpers.
- **When NOT to Apply:** User-facing bug fixes or net-new features.
- **Example:** `chore(deps): bump production-dependencies (minor/patch)`
- **Automation Eligibility:** Auto-applied to non-security Dependabot PRs and repository chore workflows.

#### `type:question`
- **Color:** `#D4C5F9` (Soft Purple)
- **Purpose:** Support inquiries, usage questions, architectural clarification requests.
- **When to Apply:** Questions about local development, domain logic rationale, or contribution guidance.
- **When NOT to Apply:** Confirmed software bugs or actionable feature proposals (guide user to Discussions).
- **Example:** `question: how does the integer-cents financial engine handle partial cent splits?`
- **Automation Eligibility:** Auto-applied to GitHub Discussions Q&A or question issue templates.

---

### Category B — Priority Dimension (`priority:*`)

#### `priority:critical`
- **Color:** `#B60205` (Deep Red)
- **Purpose:** Production outage, active data loss, broken main build, severe security flaw.
- **When to Apply:** Main branch CI fails, database migrations break startup, critical auth exploit.
- **When NOT to Apply:** Non-blocking visual bugs or cosmetic improvements.
- **Example:** `fix(auth): resolve infinite redirect loop on session expiration`
- **Automation Eligibility:** Maintainer only.

#### `priority:high`
- **Color:** `#D93F0B` (Orange-Red)
- **Purpose:** Major workflow blocker or high-impact defect affecting core productivity loops.
- **When to Apply:** Task state changes failing silently, financial totals calculating incorrectly.
- **When NOT to Apply:** Edge-case cosmetic issues.
- **Example:** `fix(finance): prevent double ledger debit when network times out`
- **Automation Eligibility:** Maintainer only.

#### `priority:medium`
- **Color:** `#FBCA04` (Amber Yellow)
- **Purpose:** Standard defect or prioritized enhancement with a viable workaround.
- **When to Apply:** Non-critical UI glitch, missing shortcut, optional filter issue.
- **When NOT to Apply:** Critical security or core data loss bugs.
- **Example:** `fix(ui): correct tooltip alignment on collapsed sidebar icons`
- **Automation Eligibility:** Default priority assigned by triage bot if unassigned.

#### `priority:low`
- **Color:** `#0E8A16` (Green)
- **Purpose:** Nice-to-have visual refinement, minor documentation polish, or low-urgency feature.
- **When to Apply:** Typo corrections, subtle micro-animation timing, optional developer tooling.
- **When NOT to Apply:** Any reproducible error in core domain calculations.
- **Example:** `chore(docs): add syntax highlighting example to CONTRIBUTING.md`
- **Automation Eligibility:** Maintainer or triage bot heuristics.

---

### Category C — Contributor & Community Labels

#### `good first issue`
- **Color:** `#7057FF` (GitHub Purple)
- **Purpose:** Curated, self-contained issues specifically structured for first-time open-source contributors.
- **When to Apply:** Scope is narrow, files are explicitly listed, acceptance criteria are deterministic, difficulty is beginner.
- **When NOT to Apply:** Issues requiring deep architectural context, multi-package refactoring, or database migrations.
- **Example:** `docs: fix relative markdown link in INTEGRATIONS.md`
- **Automation Eligibility:** Auto-eligible for issues created via Issue Factory with `difficulty:beginner`.

#### `help wanted`
- **Color:** `#008672` (Teal)
- **Purpose:** Explicit invitation for community members to claim and submit a solution.
- **When to Apply:** Well-specified features, verified bug fixes, or documentation tasks ready for implementation.
- **When NOT to Apply:** Issues still in discussion (`status:needs-discussion`) or blocked (`status:blocked`).
- **Example:** `feat(calendar): implement ICS export format generator`
- **Automation Eligibility:** Applied when status changes to `status:ready`.

#### `beginner friendly`
- **Color:** `#0E8A16` (Forest Green)
- **Purpose:** Discoverability alias highlighting accessible, well-guided contribution opportunities.
- **When to Apply:** Paired with `good first issue` to maximize discoverability across global open-source aggregators.
- **When NOT to Apply:** Complex backend or concurrency tasks.
- **Example:** `ui(tokens): standardize border-radius on modal action buttons`
- **Automation Eligibility:** Auto-paired with `good first issue`.

#### `hacktoberfest`
- **Color:** `#FF7518` (Pumpkin Orange)
- **Purpose:** Community event participation label indicating quality open-source contributions are welcome.
- **When to Apply:** Genuine quality tasks during seasonal open-source events.
- **When NOT to Apply:** Spam issues, automated low-effort PRs, or closed internal sprints.
- **Example:** `feat(themes): add high-contrast dark theme variant tokens`
- **Automation Eligibility:** Event-activated by maintainers.

---

### Category D — Project Area (`area:*`)

| Area Label | Subsystem Covered | Primary Repository Paths | Automation Path Pattern |
| :--- | :--- | :--- | :--- |
| `area:ui` | Visual design system, buttons, cards, typography | `src/components/ui/`, `src/app/globals.css` | `src/components/ui/**` |
| `area:auth` | Authentication, sessions, user onboarding | `src/components/auth/`, `src/app/(auth)/` | `src/**/auth/**` |
| `area:planning` | Daily planner, timeline, energy blocks, calendar | `src/features/planner/`, `src/features/calendar/` | `src/features/planner/**` |
| `area:accountability` | Stakes, referees, penalties, proof verification | `src/features/accountability/`, `src/lib/accountability/` | `src/features/accountability/**` |
| `area:finance` | Ledger, integer-cents transactions, budgets | `src/features/finance/`, `src/lib/finance/` | `src/features/finance/**` |
| `area:github` | Workflows, issue forms, PR templates, labels | `.github/**` | `.github/**` |
| `area:supabase` | PostgreSQL schema, migrations, RLS policies | `supabase/**`, `src/lib/supabase/` | `supabase/**` |
| `area:testing` | Unit tests, test matrix, validation scripts | `tests/**`, `scratch/run-tests.mjs` | `tests/**` |
| `area:documentation` | Architecture docs, developer guides, README | `docs/**`, `*.md` | `docs/**`, `*.md` |
| `area:developer-experience`| Tooling, scripts, linters, TypeScript configs | `package.json`, `scratch/**`, `tsconfig.json` | `scratch/**`, `*.config.*` |

---

### Category E — Workflow Status (`status:*`)

#### `status:triage`
- **Color:** `#6A737D` (Slate Gray)
- **Purpose:** Newly submitted issue awaiting maintainer review, reproduction, or classification.
- **When to Apply:** Automatically on issue creation.
- **When NOT to Apply:** Once issue has been reviewed and verified.
- **Automation Eligibility:** Auto-applied on all new issue submissions.

#### `status:ready`
- **Color:** `#0E8A16` (Green)
- **Purpose:** Fully specified, verified, and available for a contributor to claim and implement.
- **When to Apply:** Acceptance criteria are clear and prerequisites are satisfied.
- **When NOT to Apply:** While requirements are ambiguous or blocked.
- **Automation Eligibility:** Applied upon maintainer approval or triage bot completion.

#### `status:in-progress`
- **Color:** `#FBCA04` (Amber)
- **Purpose:** Actively assigned to a contributor or currently being implemented.
- **When to Apply:** A contributor is assigned or an open draft PR links to the issue.
- **When NOT to Apply:** Unassigned issues in the backlog.
- **Automation Eligibility:** Auto-applied when an issue is assigned or PR linked.

#### `status:blocked`
- **Color:** `#D73A4A` (Red)
- **Purpose:** Work cannot proceed due to an upstream blocker, dependent PR, or external decision.
- **When to Apply:** Awaiting a database migration, upstream Next.js release, or design decision.
- **When NOT to Apply:** Issues ready for immediate implementation.
- **Automation Eligibility:** Bot-applied when dependency conditions are unmet.

---

## 4. Governance & Merge Rules

1. **Orthogonal Composition:** Maintainers and bots must compose labels cleanly across dimensions (`type` + `area` + `difficulty` + `priority`).
2. **Deterministic Triage:** Every issue entering the backlog must transition from `status:triage` to `status:ready` before assignment.
3. **Good First Issue Integrity:** Never attach `good first issue` without `difficulty:beginner` and clear acceptance criteria.
4. **Automated Synchronization:** Labels are synced using `node scratch/setup-github-labels.mjs`.
