# PACT — Curated Beginner Issue Factory (40 Good First Issues)

This document contains the canonical catalog of **40 curated, actionable, and beginner-friendly issues** designed for first-time open-source contributors joining the PACT project.

---

## ⚡ Phase 5G Micro-Contribution Standard

Starting in Phase 5G, PACT OS adopts a **Micro-Contribution Philosophy**:

1. **Single-File Scoping**: Every beginner task is strictly bounded to **one target file**.
2. **5–30 Minute Micro-Scoping**: A contributor familiar with basic TypeScript / React can implement the change in minutes with clear acceptance criteria.
3. **No Time Estimation Badges**: We deprecate `time:*` labels on new issues in favor of tightly-scoped acceptance criteria.
4. **Self-Contained Verification**: Every issue provides the exact local command (e.g. `npm run lint` or `node --test tests/xyz.test.ts`) required to verify the change.
5. **No Production Risk**: Zero complex architectural refactors, zero database migrations, and zero auth/session changes.

---

## 🔍 Audit & Classification Matrix of the 20 Unpublished Catalog Issues

Below is the exhaustive classification of all 20 unpublished catalog issues from Phases 5B/5E, audited against the current repository state:

| Catalog # | Canonical Slug | Original Title | Action | Classification Rational & Micro-Conversion Strategy |
| :---: | :--- | :--- | :---: | :--- |
| **#3** | `docs-integrations-payload-examples` | docs: add API payload examples to proof connector specification | **REDUCE** | Scoped down from full multi-provider spec to a single LeetCode JSON response example in `docs/INTEGRATIONS.md`. |
| **#5** | `docs-weekly-review-flow-diagram` | docs: document weekly review 5-step state machine in user flows | **REDUCE** | Simplified to documenting the 5 state enum names in `docs/DEVELOPMENT.md`. |
| **#7** | `docs-habit-recurrence-syntax` | docs: document habit recurrence rule syntax in data model guide | **KEEP** | Retained as concise documentation snippet for recurrence rules. |
| **#8** | `docs-troubleshooting-rls-recursion` | docs: add troubleshooting steps for Supabase RLS recursion errors | **KEEP** | **Batch 3 Candidate #1**: High-leverage troubleshooting entry in `docs/TROUBLESHOOTING.md`. |
| **#13** | `ui-finance-category-badge-opacity` | ui: refine category badge color opacity in transaction list | **KEEP** | **Batch 3 Candidate #2**: Single Tailwind class opacity tweak in `src/features/finance/components/transaction-list.tsx`. |
| **#14** | `ui-streak-summary-pulse-glow` | ui: add pulse glow effect to streak summary highlight on overview | **REDUCE** | Simple CSS animation addition on overview card. |
| **#15** | `ui-task-form-modal-mobile-padding` | ui: improve mobile bottom sheet padding in task form modal | **KEEP** | **Batch 3 Candidate #5**: Single Tailwind padding adjustment `pb-6 sm:pb-4` in `src/features/tasks/components/task-form-modal.tsx`. |
| **#16** | `ui-analytics-skeleton-shimmer` | ui: polish skeleton loader shimmer animation in analytics workspace | **KEEP** | **Batch 3 Candidate #8**: Single hover border transition in `src/features/analytics/components/analytics-summary-cards.tsx`. |
| **#21** | `a11y-focus-timer-aria-live` | a11y: add aria-live polite region to focus timer countdown | **REPLACE** | Timer display already contains `aria-live="polite"`; replaced with **Batch 3 Candidate #3**: `a11y-command-palette-results-label`. |
| **#24** | `test-habit-streak-leap-year` | test: add unit test verifying habit streak calculation on leap years | **KEEP** | **Batch 3 Candidate #4**: Single leap-year test case in `tests/habits-routines.test.ts`. |
| **#26** | `test-weekly-review-step-boundaries` | test: add unit tests for weekly review step progression boundary checks | **KEEP** | **Batch 3 Candidate #7**: Single step boundary test in `tests/weekly-review.test.ts`. |
| **#27** | `test-notification-channel-filter` | test: add unit tests for notification channel filter utility | **KEEP** | Retained for future batches in `tests/notifications.test.ts`. |
| **#30** | `refactor-currency-symbol-helper` | refactor: centralize currency symbol formatting in lib/money.ts | **REPLACE** | Replaced with **Batch 3 Candidate #10**: `test-money-sum-negative-cents`. |
| **#31** | `refactor-date-string-helper-time` | refactor: export type-safe date string helper in lib/time.ts | **REPLACE** | Replaced with higher-leverage micro-docs task. |
| **#32** | `refactor-modal-transition-variants` | refactor: export shared modal transition variants in components/ui/modal.tsx | **REDUCE** | Scoped to exporting existing framer-motion variants. |
| **#33** | `fix-finance-negative-budget-remaining` | fix: prevent negative budget remaining calculation on expense overage | **KEEP** | **Batch 3 Candidate #9**: Clean 1-line `Math.max(0, ...)` clamp in `src/lib/validations/finance.ts`. |
| **#34** | `fix-notification-popover-hydration-timestamp` | fix: resolve hydration warning on formatted relative timestamp in notification popover | **DROP** | Popover is already fully client-side hydrated. |
| **#38** | `feat-settings-webhook-copy-button` | feat: add copy-to-clipboard button on integration webhook URL in settings | **REDUCE** | Simple copy button component addition. |
| **#39** | `feat-tasks-proof-verified-filter` | feat: add quick filter for proof-verified tasks in task list | **REPLACE** | Too complex for micro-contribution standard. |
| **#40** | `feat-settings-export-format-selector` | feat: add export data format selector (JSON / CSV) helper in data privacy settings | **REPLACE** | Export API already supports CSV/JSON endpoints. |

---

## 🎯 Batch 3 Candidate Set (10 Micro-Issues)

The following 10 micro-issues constitute the candidate set for **Batch 3**:

| # | Slug | Title | Type | Area | Difficulty | Target File |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `docs-troubleshooting-rls-recursion` | `docs: add Supabase RLS recursion troubleshooting note` | `type:docs` | `area:documentation` | `difficulty:beginner` | `docs/TROUBLESHOOTING.md` |
| 2 | `ui-finance-category-badge-opacity` | `ui: refine category badge opacity in transaction list` | `type:ui` | `area:finance` | `difficulty:beginner` | `src/features/finance/components/transaction-list.tsx` |
| 3 | `ui-streak-summary-pulse-glow` | `ui: add subtle icon glow in streak summary card` | `type:ui` | `area:habits` | `difficulty:beginner` | `src/features/habits/components/streak-summary-card.tsx` |
| 4 | `ui-task-form-modal-mobile-padding` | `ui: improve mobile padding in task form modal` | `type:ui` | `area:tasks` | `difficulty:beginner` | `src/features/tasks/components/task-form-modal.tsx` |
| 5 | `ui-analytics-skeleton-shimmer` | `ui: refine skeleton loading card borders in analytics workspace` | `type:ui` | `area:analytics` | `difficulty:beginner` | `src/features/analytics/components/analytics-skeleton.tsx` |
| 6 | `test-habit-streak-leap-year` | `test: add leap year unit test to habit streak test suite` | `type:test` | `area:testing` | `difficulty:easy` | `tests/habits-routines.test.ts` |
| 7 | `test-weekly-review-step-boundaries` | `test: add boundary check test for weekly review step progression` | `type:test` | `area:testing` | `difficulty:beginner` | `tests/weekly-review.test.ts` |
| 8 | `test-notification-channel-filter` | `test: add unit test for in-app notification filtering` | `type:test` | `area:testing` | `difficulty:beginner` | `tests/notifications.test.ts` |
| 9 | `refactor-modal-transition-variants` | `refactor: export modal motion transition variants in modal component` | `type:refactor` | `area:ui` | `difficulty:beginner` | `src/components/ui/modal.tsx` |
| 10 | `fix-finance-negative-budget-remaining` | `fix: clamp negative budget remaining balance to zero in budget engine` | `type:bug` | `area:finance` | `difficulty:easy` | `src/lib/finance/budgets.ts` |

---

## 📊 Summary & Distribution Matrix

| Category | Count | Difficulty Breakdown | Target Subsystems |
| :--- | :---: | :--- | :--- |
| 🌱 **Documentation** | 8 | 8 `beginner` | `area:documentation`, `area:testing`, `area:architecture` |
| 🎨 **UI / UX Polish** | 8 | 8 `beginner` | `area:focus`, `area:goals`, `area:finance`, `area:habits`, `area:tasks`, `area:analytics` |
| ♿ **Accessibility (a11y)** | 5 | 3 `beginner`, 2 `easy` | `area:dashboard`, `area:tasks`, `area:settings`, `area:focus` |
| 🧪 **Testing** | 6 | 5 `beginner`, 1 `easy` | `area:testing`, `area:finance`, `area:tasks`, `area:habits`, `area:focus`, `area:review` |
| 🧹 **Developer Experience & Refactor** | 5 | 4 `beginner`, 1 `easy` | `area:developer-experience`, `area:integrations`, `area:finance`, `area:ui` |
| 🐛 **Small Bug Fixes & Edge Cases** | 4 | 2 `beginner`, 2 `easy` | `area:finance`, `area:dashboard`, `area:goals` |
| 🔌 **Integrations & Safe Features** | 4 | 4 `easy` | `area:integrations`, `area:settings`, `area:tasks` |
| **TOTAL** | **40** | **28 Beginner / 12 Easy** | **Fully Balanced Across PACT Subsystems** |

---

## 📋 Canonical Issue Inventory

| # | Slug | Title | Type | Difficulty | Time | Area |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `docs-money-cents-examples` | docs: add code examples for lib/money.ts integer-cents calculations | `type:docs` | `difficulty:beginner` | `time:15-30m` | `area:documentation` |
| 2 | `docs-timezone-mocking-runbook` | docs: document local timezone mocking in tests runbook | `type:docs` | `difficulty:beginner` | `time:15-30m` | `area:documentation` |
| 3 | `docs-integrations-payload-examples` | docs: add API payload examples to proof connector specification | `type:docs` | `difficulty:beginner` | `time:30-60m` | `area:documentation` |
| 4 | `docs-focus-audio-architecture` | docs: clarify focus timer ambient sound generation and Web Audio API | `type:docs` | `difficulty:beginner` | `time:30-60m` | `area:documentation` |
| 5 | `docs-weekly-review-flow-diagram` | docs: document weekly review 5-step state machine in user flows | `type:docs` | `difficulty:beginner` | `time:30-60m` | `area:documentation` |
| 6 | `docs-developer-commands-cheatsheet` | docs: add quick-reference command table to developer guide | `type:docs` | `difficulty:beginner` | `time:15-30m` | `area:documentation` |
| 7 | `docs-habit-recurrence-syntax` | docs: document habit recurrence rule syntax in data model guide | `type:docs` | `difficulty:beginner` | `time:30-60m` | `area:documentation` |
| 8 | `docs-troubleshooting-rls-recursion` | docs: add troubleshooting steps for Supabase RLS recursion errors | `type:docs` | `difficulty:beginner` | `time:15-30m` | `area:documentation` |
| 9 | `ui-active-focus-card-hover` | ui: enhance hover elevation and gold border on active focus card | `type:ui` | `difficulty:beginner` | `time:15-30m` | `area:focus` |
| 10 | `ui-goals-empty-state-polish` | ui: standardize empty state layout in goals view | `type:ui` | `difficulty:beginner` | `time:15-30m` | `area:goals` |
| 11 | `ui-finance-summary-responsive-padding` | ui: improve responsive padding on finance summary cards | `type:ui` | `difficulty:beginner` | `time:15-30m` | `area:finance` |
| 12 | `ui-habits-routine-toggle-transition` | ui: add subtle transition animation to habit routine toggle buttons | `type:ui` | `difficulty:beginner` | `time:15-30m` | `area:habits` |
| 13 | `ui-finance-category-badge-opacity` | ui: refine category badge color opacity in transaction list | `type:ui` | `difficulty:beginner` | `time:15-30m` | `area:finance` |
| 14 | `ui-streak-summary-pulse-glow` | ui: add pulse glow effect to streak summary highlight on overview | `type:ui` | `difficulty:beginner` | `time:30-60m` | `area:habits` |
| 15 | `ui-task-form-modal-mobile-padding` | ui: improve mobile bottom sheet padding in task form modal | `type:ui` | `difficulty:beginner` | `time:15-30m` | `area:tasks` |
| 16 | `ui-analytics-skeleton-shimmer` | ui: polish skeleton loader shimmer animation in analytics workspace | `type:ui` | `difficulty:beginner` | `time:15-30m` | `area:analytics` |
| 17 | `a11y-notification-popover-close-button` | a11y: add aria-label and visible focus ring to notification popover close button | `type:a11y` | `difficulty:beginner` | `time:15-30m` | `area:dashboard` |
| 18 | `a11y-command-palette-escape-listener` | a11y: add keyboard Escape listener to command palette modal | `type:a11y` | `difficulty:beginner` | `time:30-60m` | `area:dashboard` |
| 19 | `a11y-task-priority-sr-only` | a11y: ensure task priority icons include screen reader accessible text | `type:a11y` | `difficulty:beginner` | `time:15-30m` | `area:tasks` |
| 20 | `a11y-user-profile-dropdown-aria` | a11y: add aria-expanded and aria-haspopup attributes to user profile dropdown | `type:a11y` | `difficulty:beginner` | `time:15-30m` | `area:settings` |
| 21 | `a11y-focus-timer-aria-live` | a11y: add aria-live polite region to focus timer countdown | `type:a11y` | `difficulty:easy` | `time:30-60m` | `area:focus` |
| 22 | `test-money-cents-formatting-edge-cases` | test: add unit tests for formatCentsToDollars edge cases (negative & zero values) | `type:test` | `difficulty:beginner` | `time:30-60m` | `area:testing` |
| 23 | `test-task-priority-sorting-comparator` | test: add unit tests for task priority sorting comparator | `type:test` | `difficulty:beginner` | `time:30-60m` | `area:testing` |
| 24 | `test-habit-streak-leap-year` | test: add unit test verifying habit streak calculation on leap years | `type:test` | `difficulty:easy` | `time:30-60m` | `area:testing` |
| 25 | `test-focus-duration-boundaries` | test: add boundary tests for focus session duration validator | `type:test` | `difficulty:beginner` | `time:30-60m` | `area:testing` |
| 26 | `test-weekly-review-step-boundaries` | test: add unit tests for weekly review step progression boundary checks | `type:test` | `difficulty:beginner` | `time:30-60m` | `area:testing` |
| 27 | `test-notification-channel-filter` | test: add unit tests for notification channel filter utility | `type:test` | `difficulty:beginner` | `time:30-60m` | `area:testing` |
| 28 | `dev-package-typecheck-script-alias` | chore: add npm run typecheck alias script in package.json | `type:refactor` | `difficulty:beginner` | `time:15-30m` | `area:developer-experience` |
| 29 | `refactor-unused-icon-imports-integrations` | refactor: prune unused icon imports in integration cards | `type:refactor` | `difficulty:beginner` | `time:15-30m` | `area:integrations` |
| 30 | `refactor-currency-symbol-helper` | refactor: centralize currency symbol formatting in lib/money.ts | `type:refactor` | `difficulty:beginner` | `time:30-60m` | `area:finance` |
| 31 | `refactor-date-string-helper-time` | refactor: export type-safe date string helper in lib/time.ts | `type:refactor` | `difficulty:easy` | `time:30-60m` | `area:developer-experience` |
| 32 | `refactor-modal-transition-variants` | refactor: export shared modal transition variants in components/ui/modal.tsx | `type:refactor` | `difficulty:beginner` | `time:15-30m` | `area:ui` |
| 33 | `fix-finance-negative-budget-remaining` | fix: prevent negative budget remaining calculation on expense overage | `type:bug` | `difficulty:easy` | `time:30-60m` | `area:finance` |
| 34 | `fix-notification-popover-hydration-timestamp` | fix: resolve hydration warning on formatted relative timestamp in notification popover | `type:bug` | `difficulty:easy` | `time:30-60m` | `area:dashboard` |
| 35 | `fix-daily-cadence-zero-tasks-pluralization` | fix: correct pluralization on zero tasks remaining in daily cadence widget | `type:bug` | `difficulty:beginner` | `time:15-30m` | `area:dashboard` |
| 36 | `fix-goals-form-empty-title-validation` | fix: prevent empty goal title submission in goal form modal | `type:bug` | `difficulty:beginner` | `time:15-30m` | `area:goals` |
| 37 | `feat-codeforces-rating-tier-badge` | feat: add Codeforces rating tier color badge helper | `type:feature` | `difficulty:easy` | `time:30-60m` | `area:integrations` |
| 38 | `feat-settings-webhook-copy-button` | feat: add copy-to-clipboard button on integration webhook URL in settings | `type:feature` | `difficulty:easy` | `time:30-60m` | `area:settings` |
| 39 | `feat-tasks-proof-verified-filter` | feat: add quick filter for proof-verified tasks in task list | `type:feature` | `difficulty:easy` | `time:1-2h` | `area:tasks` |
| 40 | `feat-settings-export-format-selector` | feat: add export data format selector (JSON / CSV) helper in data privacy settings | `type:feature` | `difficulty:easy` | `time:30-60m` | `area:settings` |

---

## 📖 Issue Specifications (1 – 40)

### Issue 1: `docs-money-cents-examples`
**Title:** `docs: add code examples for lib/money.ts integer-cents calculations`
**Labels:** `type:docs`, `difficulty:beginner`, `time:15-30m`, `area:documentation`, `good first issue`
**Target File:** `docs/DEVELOPMENT.md` & `src/lib/money.ts`

```markdown
<!-- PACT-BEGINNER-ISSUE: docs-money-cents-examples -->
## 🎯 What needs to be done
Add clear, copy-pasteable TypeScript code examples in `docs/DEVELOPMENT.md` showing how to use PACT's integer-cents financial arithmetic utilities from `src/lib/money.ts`.

## Why this matters
PACT strictly forbids floating-point numbers for financial amounts (all currency is calculated in integer cents). New contributors need explicit examples in the developer guide to avoid common floating-point mistakes.

## 📍 Where to work
- `docs/DEVELOPMENT.md` (Section 7: Development Best Practices)
- `src/lib/money.ts` (Reference existing exported functions: `formatCentsToDollars`, `dollarsToCents`, `sumCents`)

## 🧭 Implementation guidance
1. Open `docs/DEVELOPMENT.md` and navigate to Section 7 ("Development Best Practices").
2. Under item 1 ("Integer-Cents for Currency"), add a fenced TypeScript code block showing:
   - Converting dollars string/number to cents using `dollarsToCents`
   - Formatting integer cents for UI display with `formatCentsToDollars`
   - Summing multiple transactions safely
3. Ensure the markdown renders cleanly without formatting issues.

## ✅ Acceptance criteria
- [ ] `docs/DEVELOPMENT.md` contains accurate TypeScript code examples for `src/lib/money.ts`.
- [ ] Code examples use modern TypeScript syntax and import paths.
- [ ] Markdown link validation passes with 0 broken links.

## 🧪 Verification
```bash
npm run lint
node scratch/secret-scan.mjs
```

## ⏱️ Estimated effort
15–30 minutes

## 🌱 Beginner note
This is a great first contribution! You only need to write documentation; no runtime application code is modified.
```

---

### Issue 2: `docs-timezone-mocking-runbook`
**Title:** `docs: document local timezone mocking in tests runbook`
**Labels:** `type:docs`, `difficulty:beginner`, `time:15-30m`, `area:documentation`, `good first issue`
**Target File:** `docs/TESTING.md` & `src/lib/time.ts`

```markdown
<!-- PACT-BEGINNER-ISSUE: docs-timezone-mocking-runbook -->
## 🎯 What needs to be done
Add a runbook section in `docs/TESTING.md` documenting how to use `TestClock` and `time.ts` utilities to mock dates, midnight boundaries, and specific IANA timezones in unit tests.

## Why this matters
PACT guarantees timezone safety across global timezones (e.g. `America/New_York`, `Asia/Kolkata`, `Europe/London`). Explaining how to test timezone-sensitive code helps contributors write robust unit tests.

## 📍 Where to work
- `docs/TESTING.md`
- `tests/temporal-engine.test.ts` (Reference existing test patterns)

## 🧭 Implementation guidance
1. Open `docs/TESTING.md` and locate Section 3 ("Test Authoring Patterns").
2. Add a sub-section titled "Timezone & Clock Mocking".
3. Provide code snippets showing how `utcToLocal`, `localToUtc`, and injected timestamp parameters work in domain tests.

## ✅ Acceptance criteria
- [ ] `docs/TESTING.md` explains timezone mocking patterns clearly.
- [ ] Examples reflect actual utilities in `src/lib/time.ts`.
```

---

### Issue 3: `docs-integrations-payload-examples`
**Title:** `docs: add API payload examples to proof connector specification`
**Labels:** `type:docs`, `difficulty:beginner`, `time:30-60m`, `area:documentation`, `good first issue`
**Target File:** `docs/INTEGRATIONS.md` & `src/lib/integrations/proof-of-work/`

```markdown
<!-- PACT-BEGINNER-ISSUE: docs-integrations-payload-examples -->
## 🎯 What needs to be done
Add sample JSON response payloads for GitHub PushEvents, LeetCode user profile submissions, and Codeforces user status queries in `docs/INTEGRATIONS.md`.

## Why this matters
Contributors building or testing proof-of-work connectors need realistic mock payloads to test offline without needing live API tokens.

## 📍 Where to work
- `docs/INTEGRATIONS.md`
- `src/lib/integrations/proof-of-work/github.ts`
- `src/lib/integrations/proof-of-work/leetcode.ts`
- `src/lib/integrations/proof-of-work/codeforces.ts`

## 🧭 Implementation guidance
1. Open `docs/INTEGRATIONS.md`.
2. Under each platform section (GitHub, LeetCode, Codeforces), add a collapsible `<details>` block with sanitized sample JSON payloads.
3. Ensure no real user credentials, tokens, or personal emails are present in sample data.

## ✅ Acceptance criteria
- [ ] Sanitized payload examples added for GitHub, LeetCode, and Codeforces.
- [ ] `node scratch/secret-scan.mjs` passes with 0 secrets detected.
```

---

### Issue 4: `docs-focus-audio-architecture`
**Title:** `docs: clarify focus timer ambient sound generation and Web Audio API`
**Labels:** `type:docs`, `difficulty:beginner`, `time:30-60m`, `area:documentation`, `good first issue`
**Target File:** `docs/ARCHITECTURE.md` & `src/lib/focus/sound.ts`

```markdown
<!-- PACT-BEGINNER-ISSUE: docs-focus-audio-architecture -->
## 🎯 What needs to be done
Document PACT's offline Web Audio API ambient sound synthesizer in `docs/ARCHITECTURE.md`.

## Why this matters
PACT generates focus sounds (pink noise, white noise, brown noise, binaural waves) client-side using native browser audio nodes with zero external audio assets or network downloads. Documenting this highlights our privacy and offline-first design.

## 📍 Where to work
- `docs/ARCHITECTURE.md`
- `src/lib/focus/sound.ts`

## 🧭 Implementation guidance
1. Open `docs/ARCHITECTURE.md` and add a sub-section under "Domain Subsystems" for the Focus & Deep Work Audio Engine.
2. Explain how `AudioContext`, `BiquadFilterNode`, and noise buffer generators create soothing background soundscapes offline.

## ✅ Acceptance criteria
- [ ] `docs/ARCHITECTURE.md` accurately documents the Web Audio API synthesizer.
```

---

### Issue 5: `docs-weekly-review-flow-diagram`
**Title:** `docs: document weekly review 5-step state machine in user flows`
**Labels:** `type:docs`, `difficulty:beginner`, `time:30-60m`, `area:documentation`, `good first issue`
**Target File:** `docs/USER_FLOWS.md` & `src/features/weekly-review/components/weekly-review-workspace.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: docs-weekly-review-flow-diagram -->
## 🎯 What needs to be done
Add a detailed walkthrough and ASCII flow diagram of the 5-step Sunday Weekly Review ritual in `docs/USER_FLOWS.md`.

## Why this matters
The weekly review is a core ritual in PACT. Contributors should understand how drafts, step progression (1: Reflection -> 2: Cleanup -> 3: Planning -> 4: Commitments -> 5: Summary), and final commits transition in state.

## 📍 Where to work
- `docs/USER_FLOWS.md`
- `src/features/weekly-review/components/weekly-review-workspace.tsx`

## ✅ Acceptance criteria
- [ ] `docs/USER_FLOWS.md` outlines all 5 stages of the review state machine.
```

---

### Issue 6: `docs-developer-commands-cheatsheet`
**Title:** `docs: add quick-reference command table to developer guide`
**Labels:** `type:docs`, `difficulty:beginner`, `time:15-30m`, `area:documentation`, `good first issue`
**Target File:** `docs/DEVELOPMENT.md`

```markdown
<!-- PACT-BEGINNER-ISSUE: docs-developer-commands-cheatsheet -->
## 🎯 What needs to be done
Add a clean Markdown table summarizing all key local developer commands at the top of `docs/DEVELOPMENT.md`.

## Why this matters
Developers frequently consult `docs/DEVELOPMENT.md` to find verification and test commands. A top-level summary table makes onboarding significantly faster.

## 📍 Where to work
- `docs/DEVELOPMENT.md`

## 🧭 Implementation guidance
1. Open `docs/DEVELOPMENT.md`.
2. Add a table with columns: `Command`, `Description`, and `When to Run` covering:
   - `npm run dev`
   - `npm run lint`
   - `npx tsc --noEmit`
   - `node scratch/run-tests.mjs`
   - `node scratch/secret-scan.mjs`
   - `npm run build`

## ✅ Acceptance criteria
- [ ] Table is well-formatted and easy to scan.
```

---

### Issue 7: `docs-habit-recurrence-syntax`
**Title:** `docs: document habit recurrence rule syntax in data model guide`
**Labels:** `type:docs`, `difficulty:beginner`, `time:30-60m`, `area:documentation`, `good first issue`
**Target File:** `docs/DATA_MODEL.md` & `src/lib/habits/`

```markdown
<!-- PACT-BEGINNER-ISSUE: docs-habit-recurrence-syntax -->
## 🎯 What needs to be done
Document how habit frequency types (`DAILY`, `WEEKLY_DAYS`, `INTERVAL`) and recurrence bitmasks are stored in the database in `docs/DATA_MODEL.md`.

## Why this matters
Understanding the habit data model helps developers working on habit completion state machines and calendar integrations.

## 📍 Where to work
- `docs/DATA_MODEL.md`
- `supabase/migrations/20260911080000_habits_and_routines_engine.sql`
```

---

### Issue 8: `docs-troubleshooting-rls-recursion`
**Title:** `docs: add Supabase RLS recursion troubleshooting note`
**Labels:** `type:docs`, `difficulty:beginner`, `area:documentation`, `good first issue`, `help wanted`
**Target File:** `docs/TROUBLESHOOTING.md`

```markdown
<!-- PACT-BEGINNER-ISSUE: docs-troubleshooting-rls-recursion -->
## 🎯 What needs to be done
Add a troubleshooting note in `docs/TROUBLESHOOTING.md` under database / Supabase configuration explaining how to resolve PostgreSQL error `42P17 (infinite recursion detected in policy for relation)`.

## Why this matters
Contributors writing new Row-Level Security (RLS) policies may accidentally query the same table inside a subquery. Documenting the fix (`SECURITY DEFINER` functions or direct column lookups) prevents confusion and onboarding friction.

## 📍 Where to work
`docs/TROUBLESHOOTING.md`

## 🧭 Implementation guidance
1. Open `docs/TROUBLESHOOTING.md`.
2. Locate the database or Supabase troubleshooting section (or create subsection `3.3 Supabase RLS Policy Infinite Recursion (42P17)`).
3. Add a concise problem explanation, cause, and recommended solution.
4. Save the file.

## ✅ Acceptance criteria
- [ ] `docs/TROUBLESHOOTING.md` documents PostgreSQL error 42P17 and its resolution clearly.
- [ ] Markdown link validation passes with 0 broken links.

## 🧪 Verification
```bash
node scratch/check-links.mjs
```

## 🌱 Beginner note
This is a documentation-only task! No TypeScript build or complex local setup is required.
```

---

### Issue 9: `ui-active-focus-card-hover`
**Title:** `ui: enhance hover elevation and gold border on active focus card`
**Labels:** `type:ui`, `difficulty:beginner`, `time:15-30m`, `area:focus`, `good first issue`
**Target File:** `src/features/dashboard/components/active-focus-card.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: ui-active-focus-card-hover -->
## 🎯 What needs to be done
Add smooth hover elevation and a subtle gold border accent (`hover:border-gold/30 transition-all duration-200`) to the active focus session card on the dashboard overview.

## Why this matters
The focus card is a primary interactive gateway on the dashboard. Polishing its hover state provides immediate visual feedback aligned with PACT's luxury aesthetic.

## 📍 Where to work
- `src/features/dashboard/components/active-focus-card.tsx`

## 🧭 Implementation guidance
1. Open `src/features/dashboard/components/active-focus-card.tsx`.
2. Locate the root container `div` or `GlassCard`.
3. Add `hover:border-gold/30 hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-all duration-200` to the class list.
4. Verify that visual styling matches `docs/DESIGN_SYSTEM.md`.

## ✅ Acceptance criteria
- [ ] Active focus card responds with a subtle gold glow on desktop hover.
- [ ] No layout shift occurs during hover.
- [ ] TypeScript check and lint pass.

## 🧪 Verification
```bash
npm run lint
npx tsc --noEmit
```
```

---

### Issue 10: `ui-goals-empty-state-polish`
**Title:** `ui: standardize empty state layout in goals view`
**Labels:** `type:ui`, `difficulty:beginner`, `time:15-30m`, `area:goals`, `good first issue`
**Target File:** `src/features/goals/components/goals-view.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: ui-goals-empty-state-polish -->
## 🎯 What needs to be done
Standardize vertical padding, icon container styling, and CTA button alignment in the zero-goals empty state within `goals-view.tsx`.

## Why this matters
Consistent empty states across all modules (Tasks, Goals, Projects, Habits) create a cohesive first-impression experience for new users.

## 📍 Where to work
- `src/features/goals/components/goals-view.tsx`
- Reference `src/features/tasks/components/tasks-view.tsx` for standard empty-state layout tokens.
```

---

### Issue 11: `ui-finance-summary-responsive-padding`
**Title:** `ui: improve responsive padding on finance summary cards`
**Labels:** `type:ui`, `difficulty:beginner`, `time:15-30m`, `area:finance`, `good first issue`
**Target File:** `src/features/finance/components/finance-summary-cards.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: ui-finance-summary-responsive-padding -->
## 🎯 What needs to be done
Optimize mobile grid padding (`p-4 sm:p-6`) on the Income, Expense, and Net Cash Flow summary cards in `finance-summary-cards.tsx`.

## Why this matters
On narrow mobile screens (375px), large numbers in integer-cents formatting can wrap awkwardly if card padding is too generous.

## 📍 Where to work
- `src/features/finance/components/finance-summary-cards.tsx`

## ✅ Acceptance criteria
- [ ] Finance summary numbers fit comfortably without text clipping on 375px mobile viewports.
```

---

### Issue 12: `ui-habits-routine-toggle-transition`
**Title:** `ui: add subtle transition animation to habit routine toggle buttons`
**Labels:** `type:ui`, `difficulty:beginner`, `time:15-30m`, `area:habits`, `good first issue`
**Target File:** `src/features/habits/components/routine-card.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: ui-habits-routine-toggle-transition -->
## 🎯 What needs to be done
Add smooth color and scale transitions (`transition-all duration-150 active:scale-95`) to checkmark toggles in routine checklists.

## Why this matters
Completing a routine item should feel rewarding and responsive. Adding tactile micro-interactions reinforces daily discipline.

## 📍 Where to work
- `src/features/habits/components/routine-card.tsx`
```

---

### Issue 13: `ui-finance-category-badge-opacity`
**Title:** `ui: refine category badge opacity in transaction list`
**Labels:** `type:ui`, `difficulty:beginner`, `area:finance`, `good first issue`, `help wanted`
**Target File:** `src/features/finance/components/transaction-list.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: ui-finance-category-badge-opacity -->
## 🎯 What needs to be done
In `src/features/finance/components/transaction-list.tsx`, refine the category badge background opacity tokens in `COLOR_MAP` from `bg-*-400/10` to `bg-*-400/15` for enhanced contrast against deep obsidian card backgrounds.

## Why this matters
Slightly higher badge background opacity enhances readability for category tags (e.g. Income, Food, Housing, Utilities) across light/dark ambient lighting.

## 📍 Where to work
`src/features/finance/components/transaction-list.tsx` (lines 48–57)

## 🧭 Implementation guidance
1. Open `src/features/finance/components/transaction-list.tsx`.
2. Locate the `COLOR_MAP` object near line 48.
3. Update the `bg` property in each color record to use `/15` instead of `/10`.
4. Do not modify any logic or other components.

## ✅ Acceptance criteria
- [ ] `COLOR_MAP` background opacity tokens updated to `/15`.
- [ ] ESLint and TypeScript checks pass.

## 🧪 Verification
```bash
npm run lint
```

## 🌱 Beginner note
This is an isolated single-file styling tweak with zero business logic risk.
```

---

### Issue 14: `ui-streak-summary-pulse-glow`
**Title:** `ui: add subtle icon glow in streak summary card`
**Labels:** `type:ui`, `difficulty:beginner`, `area:habits`, `good first issue`, `help wanted`
**Target File:** `src/features/habits/components/streak-summary-card.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: ui-streak-summary-pulse-glow -->
## 🎯 What needs to be done
In `src/features/habits/components/streak-summary-card.tsx`, add a subtle amber shadow/glow to the Top Streak Flame icon badge container.

## Why this matters
Visual feedback on top active streaks provides celebratory visual polish without distracting from focused daily execution.

## 📍 Where to work
`src/features/habits/components/streak-summary-card.tsx`

## 🧭 Implementation guidance
1. Open `src/features/habits/components/streak-summary-card.tsx`.
2. Locate the Top Streak card icon container `div` (around line 55).
3. Add `shadow-sm shadow-amber-500/20` to the class list.
4. Save and verify formatting.

## ✅ Acceptance criteria
- [ ] Top Streak icon badge container includes `shadow-sm shadow-amber-500/20`.
- [ ] No layout shift or unintended styling changes.

## 🧪 Verification
```bash
npm run lint
```

## 🌱 Beginner note
A clean 1-line Tailwind CSS class addition perfect for your first PR!
```

---

### Issue 15: `ui-task-form-modal-mobile-padding`
**Title:** `ui: improve mobile padding in task form modal`
**Labels:** `type:ui`, `difficulty:beginner`, `area:tasks`, `good first issue`, `help wanted`
**Target File:** `src/features/tasks/components/task-form-modal.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: ui-task-form-modal-mobile-padding -->
## 🎯 What needs to be done
In `src/features/tasks/components/task-form-modal.tsx`, update the form content container padding from `p-4` to `p-4 sm:p-6` to ensure comfortable touch targets on mobile while providing clean breathing room on desktop viewports.

## Why this matters
Consistent responsive padding prevents form controls and action buttons from feeling cramped on wide screens or colliding with mobile screen edges.

## 📍 Where to work
`src/features/tasks/components/task-form-modal.tsx`

## 🧭 Implementation guidance
1. Open `src/features/tasks/components/task-form-modal.tsx`.
2. Find the form body container element.
3. Update padding classes to `p-4 sm:p-6`.
4. Ensure modal action buttons remain clearly visible.

## ✅ Acceptance criteria
- [ ] Modal padding adjusts cleanly with `p-4 sm:p-6`.
- [ ] All form fields and action buttons remain fully functional.

## 🧪 Verification
```bash
npm run lint
```

## 🌱 Beginner note
A simple, focused responsive CSS polish in a single file.
```

---

### Issue 16: `ui-analytics-skeleton-shimmer`
**Title:** `ui: refine skeleton loading card borders in analytics workspace`
**Labels:** `type:ui`, `difficulty:beginner`, `area:analytics`, `good first issue`, `help wanted`
**Target File:** `src/features/analytics/components/analytics-skeleton.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: ui-analytics-skeleton-shimmer -->
## 🎯 What needs to be done
In `src/features/analytics/components/analytics-skeleton.tsx`, update the summary skeleton cards' border class from `border-white/[0.08]` to `border-white/[0.06]` to match production card border styling.

## Why this matters
Consistency in skeleton border tokens eliminates visual flicker when placeholder skeletons transition into loaded metric cards.

## 📍 Where to work
`src/features/analytics/components/analytics-skeleton.tsx`

## 🧭 Implementation guidance
1. Open `src/features/analytics/components/analytics-skeleton.tsx`.
2. Locate the summary cards skeleton map around line 24.
3. Update `border-white/[0.08]` to `border-white/[0.06]`.
4. Save the file.

## ✅ Acceptance criteria
- [ ] Summary skeleton card border token matches production cards (`border-white/[0.06]`).
- [ ] Linter passes with 0 warnings.

## 🧪 Verification
```bash
npm run lint
```

## 🌱 Beginner note
One class name update in one file — ideal for getting your first merged contribution!
```

---

### Issue 17: `a11y-notification-popover-close-button`
**Title:** `a11y: add aria-label and visible focus ring to notification popover close button`
**Labels:** `type:a11y`, `difficulty:beginner`, `time:15-30m`, `area:dashboard`, `good first issue`
**Target File:** `src/components/ui/notification-popover.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: a11y-notification-popover-close-button -->
## 🎯 What needs to be done
Add `aria-label="Close notification menu"` and `focus-visible:ring-2 focus-visible:ring-gold/50` to the dismiss button in `notification-popover.tsx`.

## Why this matters
Icon-only buttons require explicit `aria-label` attributes so screen readers announce their function to assistive technology users.

## 📍 Where to work
- `src/components/ui/notification-popover.tsx`

## ✅ Acceptance criteria
- [ ] Close button has explicit `aria-label`.
- [ ] Keyboard navigation displays a visible gold focus ring.
```

---

### Issue 18: `a11y-command-palette-escape-listener`
**Title:** `a11y: add keyboard Escape listener to command palette modal`
**Labels:** `type:a11y`, `difficulty:beginner`, `time:30-60m`, `area:dashboard`, `good first issue`
**Target File:** `src/features/command-center/command-palette-modal.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: a11y-command-palette-escape-listener -->
## 🎯 What needs to be done
Ensure the Command Palette modal (`Ctrl+K` / `Cmd+K`) listens for the `Escape` key event and gracefully closes the dialog, returning focus to the previous element.

## Why this matters
Keyboard accessibility requires that all modal dialogs can be dismissed with the standard `Escape` key.

## 📍 Where to work
- `src/features/command-center/command-palette-modal.tsx`
```

---

### Issue 19: `a11y-task-priority-sr-only`
**Title:** `a11y: ensure task priority icons include screen reader accessible text`
**Labels:** `type:a11y`, `difficulty:beginner`, `time:15-30m`, `area:tasks`, `good first issue`
**Target File:** `src/features/tasks/components/task-card.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: a11y-task-priority-sr-only -->
## 🎯 What needs to be done
Add a `<span className="sr-only">Priority: {priority}</span>` element next to priority flame/flag icons in `task-card.tsx`.

## Why this matters
Assistive technologies cannot infer priority purely from SVG icon colors. Hidden screen reader text ensures equal access to urgency information.

## 📍 Where to work
- `src/features/tasks/components/task-card.tsx`
```

---

### Issue 20: `a11y-user-profile-dropdown-aria`
**Title:** `a11y: add aria-expanded and aria-haspopup attributes to user profile dropdown`
**Labels:** `type:a11y`, `difficulty:beginner`, `time:15-30m`, `area:settings`, `good first issue`
**Target File:** `src/components/ui/user-profile-dropdown.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: a11y-user-profile-dropdown-aria -->
## 🎯 What needs to be done
Add `aria-expanded={isOpen}` and `aria-haspopup="menu"` to the user avatar trigger button in `user-profile-dropdown.tsx`.

## Why this matters
Informs screen readers whether the dropdown menu is currently open or collapsed.

## 📍 Where to work
- `src/components/ui/user-profile-dropdown.tsx`
```

---

### Issue 21: `a11y-focus-timer-aria-live`
**Title:** `a11y: add aria-live polite region to focus timer countdown`
**Labels:** `type:a11y`, `difficulty:easy`, `time:30-60m`, `area:focus`, `good first issue`
**Target File:** `src/features/focus/components/focus-timer-display.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: a11y-focus-timer-aria-live -->
## 🎯 What needs to be done
Add an `aria-live="polite"` region that announces session state transitions (e.g. "Focus session started", "Focus session completed") without announcing every second.

## Why this matters
Allows screen reader users to receive timely auditory announcements when work intervals begin or end.

## 📍 Where to work
- `src/features/focus/components/focus-timer-display.tsx`
```

---

### Issue 22: `test-money-cents-formatting-edge-cases`
**Title:** `test: add unit tests for formatCentsToDollars edge cases (negative & zero values)`
**Labels:** `type:test`, `difficulty:beginner`, `time:30-60m`, `area:testing`, `good first issue`
**Target File:** `tests/finance-domain-validation.test.ts` & `src/lib/money.ts`

```markdown
<!-- PACT-BEGINNER-ISSUE: test-money-cents-formatting-edge-cases -->
## 🎯 What needs to be done
Add unit tests in `tests/finance-domain-validation.test.ts` testing negative values (`-1050` -> `-$10.50`), zero cents (`0` -> `$0.00`), and large numbers in `src/lib/money.ts`.

## Why this matters
Financial integrity is a top priority in PACT. Exhaustive unit testing on integer-cents conversion prevents rounding and formatting regressions.

## 📍 Where to work
- `tests/finance-domain-validation.test.ts`
- `src/lib/money.ts`

## ✅ Acceptance criteria
- [ ] Unit tests added covering negative numbers, zero, and boundary values.
- [ ] `node scratch/run-tests.mjs` executes cleanly with all tests passing.
```

---

### Issue 23: `test-task-priority-sorting-comparator`
**Title:** `test: add unit tests for task priority sorting comparator`
**Labels:** `type:test`, `difficulty:beginner`, `time:30-60m`, `area:testing`, `good first issue`
**Target File:** `tests/tasks-validation.test.ts` & `src/lib/validations/domain.ts`

```markdown
<!-- PACT-BEGINNER-ISSUE: test-task-priority-sorting-comparator -->
## 🎯 What needs to be done
Add unit test assertions verifying that tasks sort deterministically by priority rank (`HIGH` > `MEDIUM` > `LOW` > `NONE`) when deadlines are identical.

## Why this matters
Prevents sorting instability and inconsistent task ordering on the planner and task board.

## 📍 Where to work
- `tests/tasks-validation.test.ts`
- `src/lib/validations/domain.ts`
```

---

### Issue 24: `test-habit-streak-leap-year`
**Title:** `test: add leap year unit test to habit streak test suite`
**Labels:** `type:test`, `difficulty:easy`, `area:testing`, `good first issue`, `help wanted`
**Target File:** `tests/habits-routines.test.ts`

```markdown
<!-- PACT-BEGINNER-ISSUE: test-habit-streak-leap-year -->
## 🎯 What needs to be done
Add a unit test in `tests/habits-routines.test.ts` verifying that daily habit streaks calculate consecutively across Feb 28 -> Feb 29 -> Mar 1 in leap years (e.g. 2024 or 2028).

## Why this matters
Guarantees that streak calculation engines and calendar day difference helpers do not break or reset due to leap year date boundaries.

## 📍 Where to work
`tests/habits-routines.test.ts`

## 🧭 Implementation guidance
1. Open `tests/habits-routines.test.ts`.
2. Locate the streak calculation test block.
3. Add a test case using sample dates across `2024-02-28`, `2024-02-29`, and `2024-03-01`.
4. Assert that `calculateHabitStreak` computes a streak count of `3`.

## ✅ Acceptance criteria
- [ ] Leap year streak test case added to `tests/habits-routines.test.ts`.
- [ ] Test passes when running `npm test`.

## 🧪 Verification
```bash
npm test
```

## 🌱 Beginner note
Adding unit tests in existing test files is one of the safest and most valuable ways to start contributing to open source!
```

---

### Issue 25: `test-focus-duration-boundaries`
**Title:** `test: add boundary tests for focus session duration validator`
**Labels:** `type:test`, `difficulty:beginner`, `time:30-60m`, `area:testing`, `good first issue`
**Target File:** `tests/focus-engine.test.ts` & `src/lib/validations/focus.ts`

```markdown
<!-- PACT-BEGINNER-ISSUE: test-focus-duration-boundaries -->
## 🎯 What needs to be done
Add unit tests asserting that focus session duration inputs `< 1` minute or `> 240` minutes are rejected with explicit Zod validation errors.

## Why this matters
Hardens input validation against invalid session parameters before server action execution.

## 📍 Where to work
- `tests/focus-engine.test.ts`
```

---

### Issue 26: `test-weekly-review-step-boundaries`
**Title:** `test: add boundary check test for weekly review step progression`
**Labels:** `type:test`, `difficulty:beginner`, `area:testing`, `good first issue`, `help wanted`
**Target File:** `tests/weekly-review.test.ts`

```markdown
<!-- PACT-BEGINNER-ISSUE: test-weekly-review-step-boundaries -->
## 🎯 What needs to be done
In `tests/weekly-review.test.ts`, add a test case verifying that `saveReviewDraftSchema` rejects invalid step index values (e.g. `step: 0` or `step: 6`).

## Why this matters
Ensures user review drafts remain within the strict 5-step weekly review workflow boundaries.

## 📍 Where to work
`tests/weekly-review.test.ts`

## 🧭 Implementation guidance
1. Open `tests/weekly-review.test.ts`.
2. Locate the schema validation test suite.
3. Add assertions testing `saveReviewDraftSchema.safeParse` with `current_step: 0` and `current_step: 6` to verify rejection.
4. Verify all tests pass.

## ✅ Acceptance criteria
- [ ] Boundary test added for weekly review draft step indices.
- [ ] All unit tests pass with 0 failures.

## 🧪 Verification
```bash
npm test
```

## 🌱 Beginner note
A straightforward unit test addition using Node's built-in test runner.
```

---

### Issue 27: `test-notification-channel-filter`
**Title:** `test: add unit test for in-app notification filtering`
**Labels:** `type:test`, `difficulty:beginner`, `area:testing`, `good first issue`, `help wanted`
**Target File:** `tests/notifications.test.ts`

```markdown
<!-- PACT-BEGINNER-ISSUE: test-notification-channel-filter -->
## 🎯 What needs to be done
In `tests/notifications.test.ts`, add a unit test asserting that notification delivery helpers handle empty recipient lists gracefully without throwing unhandled exceptions.

## Why this matters
Ensures resilient notification delivery when no channels are configured or available.

## 📍 Where to work
`tests/notifications.test.ts`

## 🧭 Implementation guidance
1. Open `tests/notifications.test.ts`.
2. Add a test case testing `deliverInApp` or `dispatchNotification` with an empty or unconfigured state.
3. Assert that it resolves safely with the expected fallback status.

## ✅ Acceptance criteria
- [ ] Unit test added in `tests/notifications.test.ts`.
- [ ] Test passes when running `npm test`.

## 🧪 Verification
```bash
npm test
```

## 🌱 Beginner note
Unit testing error handling and fallbacks helps keep PACT production-ready.
```

---

### Issue 28: `dev-package-typecheck-script-alias`
**Title:** `chore: add npm run typecheck alias script in package.json`
**Labels:** `type:refactor`, `difficulty:beginner`, `time:15-30m`, `area:developer-experience`, `good first issue`
**Target File:** `package.json` & `docs/DEVELOPMENT.md`

```markdown
<!-- PACT-BEGINNER-ISSUE: dev-package-typecheck-script-alias -->
## 🎯 What needs to be done
Add `"typecheck": "tsc --noEmit"` to `scripts` in `package.json` and document the alias in `docs/DEVELOPMENT.md`.

## Why this matters
Many developers intuitively type `npm run typecheck` to verify TypeScript types without emitting build files. Providing this standard alias improves contributor developer experience.

## 📍 Where to work
- `package.json`
- `docs/DEVELOPMENT.md`

## ✅ Acceptance criteria
- [ ] `npm run typecheck` runs `tsc --noEmit` and exits with code 0.
```

---

### Issue 29: `refactor-unused-icon-imports-integrations`
**Title:** `refactor: prune unused icon imports in integration cards`
**Labels:** `type:refactor`, `difficulty:beginner`, `time:15-30m`, `area:integrations`, `good first issue`
**Target File:** `src/features/integrations/components/codeforces-proof-of-work-card.tsx` & `src/features/integrations/components/leetcode-proof-of-work-card.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: refactor-unused-icon-imports-integrations -->
## 🎯 What needs to be done
Remove unused icon imports (`Flame`, `ChevronRight`) in `codeforces-proof-of-work-card.tsx` and `leetcode-proof-of-work-card.tsx` to eliminate ESLint warnings.

## Why this matters
Keeps the codebase warning-free and reduces bundle overhead.

## 📍 Where to work
- `src/features/integrations/components/codeforces-proof-of-work-card.tsx`
- `src/features/integrations/components/leetcode-proof-of-work-card.tsx`
```

---

### Issue 30: `refactor-currency-symbol-helper`
**Title:** `refactor: centralize currency symbol formatting in lib/money.ts`
**Labels:** `type:refactor`, `difficulty:beginner`, `time:30-60m`, `area:finance`, `good first issue`
**Target File:** `src/lib/money.ts`

```markdown
<!-- PACT-BEGINNER-ISSUE: refactor-currency-symbol-helper -->
## 🎯 What needs to be done
Add an exported helper function `getCurrencySymbol(currencyCode: string): string` to `src/lib/money.ts` supporting standard ISO codes (`USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`).

## Why this matters
Avoids hardcoding `$` across multiple finance components and centralizes currency symbol resolution.

## 📍 Where to work
- `src/lib/money.ts`
- `tests/finance-domain-validation.test.ts`
```

---

### Issue 31: `refactor-date-string-helper-time`
**Title:** `refactor: export type-safe date string helper in lib/time.ts`
**Labels:** `type:refactor`, `difficulty:easy`, `time:30-60m`, `area:developer-experience`, `good first issue`
**Target File:** `src/lib/time.ts`

```markdown
<!-- PACT-BEGINNER-ISSUE: refactor-date-string-helper-time -->
## 🎯 What needs to be done
Export a helper function `toISODateString(date: Date): string` in `src/lib/time.ts` that safely returns `YYYY-MM-DD` without UTC timezone shifting.

## Why this matters
Prevents subtle date offset bugs when converting `Date` objects to HTML date input format strings.

## 📍 Where to work
- `src/lib/time.ts`
- `tests/temporal-engine.test.ts`
```

---

### Issue 32: `refactor-modal-transition-variants`
**Title:** `refactor: export modal motion transition variants in modal component`
**Labels:** `type:refactor`, `difficulty:beginner`, `area:ui`, `good first issue`, `help wanted`
**Target File:** `src/components/ui/modal.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: refactor-modal-transition-variants -->
## 🎯 What needs to be done
In `src/components/ui/modal.tsx`, export the backdrop and modal card Framer Motion animation transition variants as named constants (`MODAL_BACKDROP_VARIANTS` and `MODAL_CONTENT_VARIANTS`).

## Why this matters
Allows custom dialogs and drawers across PACT to reuse identical easing curves and spring physics without code duplication.

## 📍 Where to work
`src/components/ui/modal.tsx`

## 🧭 Implementation guidance
1. Open `src/components/ui/modal.tsx`.
2. Find the motion variant objects defined inside or above `Modal`.
3. Add `export const` to make them reusable by other components.
4. Verify TypeScript and ESLint pass.

## ✅ Acceptance criteria
- [ ] Modal transition variants exported as named constants.
- [ ] TypeScript check passes with 0 errors.

## 🧪 Verification
```bash
npx tsc --noEmit
npm run lint
```

## 🌱 Beginner note
Exporting an existing constant is an ideal 2-line micro-contribution!
```

---

### Issue 33: `fix-finance-negative-budget-remaining`
**Title:** `fix: clamp negative budget remaining balance to zero in budget engine`
**Labels:** `type:bug`, `difficulty:easy`, `area:finance`, `good first issue`, `help wanted`
**Target File:** `src/lib/finance/budgets.ts`

```markdown
<!-- PACT-BEGINNER-ISSUE: fix-finance-negative-budget-remaining -->
## 🎯 What needs to be done
In `src/lib/finance/budgets.ts`, wrap the remaining amount calculation in `Math.max(0, limitCents - spentCents)` inside `calculateBudgetStatus` so remaining budget balance never reports as a negative integer.

## Why this matters
When an expense exceeds a category budget, `remainingCents` should clamp cleanly to `0` while `isExceeded` flags the overage.

## 📍 Where to work
`src/lib/finance/budgets.ts` (inside `calculateBudgetStatus`)

## 🧭 Implementation guidance
1. Open `src/lib/finance/budgets.ts`.
2. Locate `remainingCents: limitCents - spentCents`.
3. Wrap with `Math.max(0, limitCents - spentCents)`.
4. Run unit tests to verify.

## ✅ Acceptance criteria
- [ ] `remainingCents` is clamped to non-negative values.
- [ ] Finance unit tests pass cleanly.

## 🧪 Verification
```bash
npm test
```

## 🌱 Beginner note
A crisp 1-line arithmetic bug fix with immediate test verification.
```

---

### Issue 34: `fix-notification-popover-hydration-timestamp`
**Title:** `fix: resolve hydration warning on formatted relative timestamp in notification popover`
**Labels:** `type:bug`, `difficulty:easy`, `time:30-60m`, `area:dashboard`, `good first issue`
**Target File:** `src/components/ui/notification-popover.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: fix-notification-popover-hydration-timestamp -->
## 🎯 What needs to be done
Add a client-mounted guard or `suppressHydrationWarning` to relative timestamp text ("5 minutes ago") in `notification-popover.tsx` to prevent server/client timestamp mismatch warnings.

## Why this matters
Relative timestamps rendered on the server can differ by a few seconds from the client render, triggering benign React hydration warnings in development.

## 📍 Where to work
- `src/components/ui/notification-popover.tsx`
```

---

### Issue 35: `fix-daily-cadence-zero-tasks-pluralization`
**Title:** `fix: correct pluralization on zero tasks remaining in daily cadence widget`
**Labels:** `type:bug`, `difficulty:beginner`, `time:15-30m`, `area:dashboard`, `good first issue`
**Target File:** `src/features/dashboard/components/daily-cadence-widget.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: fix-daily-cadence-zero-tasks-pluralization -->
## 🎯 What needs to be done
Update task count pluralization logic in `daily-cadence-widget.tsx` so "0 tasks remaining" and "1 task remaining" format with proper singular/plural grammar.

## Why this matters
Improves linguistic precision and polish on the primary overview dashboard.

## 📍 Where to work
- `src/features/dashboard/components/daily-cadence-widget.tsx`
```

---

### Issue 36: `fix-goals-form-empty-title-validation`
**Title:** `fix: prevent empty goal title submission in goal form modal`
**Labels:** `type:bug`, `difficulty:beginner`, `time:15-30m`, `area:goals`, `good first issue`
**Target File:** `src/features/goals/components/goal-form-modal.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: fix-goals-form-empty-title-validation -->
## 🎯 What needs to be done
Ensure the goal title input in `goal-form-modal.tsx` trims leading and trailing whitespace, disabling the submit button if the resulting string is empty.

## Why this matters
Prevents accidental creation of blank or whitespace-only goals.

## 📍 Where to work
- `src/features/goals/components/goal-form-modal.tsx`
```

---

### Issue 37: `feat-codeforces-rating-tier-badge`
**Title:** `feat: add Codeforces rating tier color badge helper`
**Labels:** `type:feature`, `difficulty:easy`, `time:30-60m`, `area:integrations`, `good first issue`
**Target File:** `src/features/integrations/components/codeforces-proof-of-work-card.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: feat-codeforces-rating-tier-badge -->
## 🎯 What needs to be done
Add a helper function in `codeforces-proof-of-work-card.tsx` that maps Codeforces ranks (Newbie, Pupil, Specialist, Expert, Candidate Master) to standard PACT tag badge colors.

## Why this matters
Provides visual recognition for competitive programming achievements inside PACT's proof-of-work verification system.

## 📍 Where to work
- `src/features/integrations/components/codeforces-proof-of-work-card.tsx`
```

---

### Issue 38: `feat-settings-webhook-copy-button`
**Title:** `feat: add copy-to-clipboard button on integration webhook URL in settings`
**Labels:** `type:feature`, `difficulty:easy`, `time:30-60m`, `area:settings`, `good first issue`
**Target File:** `src/features/settings/components/integrations-settings-card.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: feat-settings-webhook-copy-button -->
## 🎯 What needs to be done
Add a "Copy" button with temporary checkmark feedback next to webhook endpoint URLs in `integrations-settings-card.tsx`.

## Why this matters
Simplifies setting up GitHub webhooks by allowing one-click copying of the receiving endpoint URL.

## 📍 Where to work
- `src/features/settings/components/integrations-settings-card.tsx`
```

---

### Issue 39: `feat-tasks-proof-verified-filter`
**Title:** `feat: add quick filter for proof-verified tasks in task list`
**Labels:** `type:feature`, `difficulty:easy`, `time:1-2h`, `area:tasks`, `good first issue`
**Target File:** `src/features/tasks/components/tasks-view.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: feat-tasks-proof-verified-filter -->
## 🎯 What needs to be done
Add a filter pill button in `tasks-view.tsx` allowing users to filter tasks that require external proof of work (GitHub / LeetCode / Codeforces).

## Why this matters
Allows developers and engineers to quickly view their coding and algorithmic tasks that link to automated proof verification.

## 📍 Where to work
- `src/features/tasks/components/tasks-view.tsx`
```

---

### Issue 40: `feat-settings-export-format-selector`
**Title:** `feat: add export data format selector (JSON / CSV) helper in data privacy settings`
**Labels:** `type:feature`, `difficulty:easy`, `time:30-60m`, `area:settings`, `good first issue`
**Target File:** `src/features/settings/components/data-privacy-settings-card.tsx`

```markdown
<!-- PACT-BEGINNER-ISSUE: feat-settings-export-format-selector -->
## 🎯 What needs to be done
Add a format selection toggle (JSON or CSV) to the user data export card in `data-privacy-settings-card.tsx` that triggers the appropriate export download endpoint.

## Why this matters
Enhances data portability by giving users flexibility to export their life OS data in either JSON or spreadsheet-friendly CSV format.

## 📍 Where to work
- `src/features/settings/components/data-privacy-settings-card.tsx`
```
