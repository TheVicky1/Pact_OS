# PACT — Curated Beginner Issue Factory (Good First Issues)

This document contains the canonical catalog of **curated, validated, and beginner-friendly issues** designed for first-time open-source and **Hacktoberfest** contributors joining the PACT project.

> 📁 **Latest Issue Catalogs**:
> - [**Issues #187–#204 Catalog** (18 High-Impact Feature & Growth Issues)](GITHUB_HIGH_IMPACT_ISSUES_187_204.md)
> - [**Issues #166–#185 Catalog** (20 Hacktoberfest Issues)](GITHUB_BEGINNER_ISSUES_166_185.md)
> - [**Issues #140–#164 Catalog** (25 Hacktoberfest Issues)](GITHUB_BEGINNER_ISSUES_140_164.md)
> - [**Issues #130–#138 Catalog** (9 Beginner Issues)](GITHUB_BEGINNER_ISSUES_130_138.md)
> - [**Issues #107–#113 Catalog** (7 Beginner Issues)](GITHUB_BEGINNER_ISSUES_107_113.md)

---

## ⚡ Contributor Standard & Principles

Every task in this catalog adheres to PACT's **Micro-Contribution Standard**:

1. **Single-File Scope**: Every beginner task is strictly bounded to **one single file** (or a documentation pairing).
2. **5–30 Minute Completion**: A developer with basic TypeScript / React or Markdown experience can complete the task cleanly in one sitting.
3. **No Production Risk**: Zero database migrations, zero authentication/session changes, zero financial calculation alterations, and zero secret exposure.
4. **Self-Contained Verification**: Every issue provides the exact local command needed to verify correctness before opening a PR.
5. **No Time Labels on GitHub**: Scope is communicated via `difficulty:beginner` and clear acceptance criteria.

---

## 📊 Summary & Category Distribution Matrix (20 Issues)

| Category | Count | Difficulty Breakdown | Target Subsystems |
| :--- | :---: | :--- | :--- |
| 🌱 **Documentation / Markdown** | **5** | Level 1 (5–10m) | `docs/`, Developer Guides, Architecture |
| 🎨 **UI / Visual Polish** | **4** | Level 2 (10–15m) | `src/features/`, Badges, Modals, Skeletons |
| ♿ **Accessibility (a11y)** | **4** | Level 2 (10–15m) | `src/components/ui/`, ARIA labels, Focus Rings |
| 🧪 **Tests & QA** | **3** | Level 3 (15–30m) | `tests/`, Unit Test Matrix, Boundary Cases |
| 📝 **JSDoc & Code Clarity** | **2** | Level 2 (10–15m) | `src/lib/`, Utility Documentation & Types |
| 💬 **Copy & UX Clarity** | **2** | Level 1 (5–10m) | `src/features/`, Empty States, Pluralization |
| **TOTAL** | **20** | **100% Validated in Codebase** | **Balanced Across All PACT Subsystems** |

---

### 🌐 Live GitHub Issue Provisioning Mapping

| Catalog # | GitHub Issue | Title | Status |
| :---: | :---: | :--- | :---: |
| Catalog #1 | [#52](https://github.com/TheVicky1/Pact_OS/issues/52) | `[Docs] Add Code Examples for lib/money.ts Integer-Cents Calculations` | ✅ Live |
| Catalog #2 | [#53](https://github.com/TheVicky1/Pact_OS/issues/53) | `[Docs] Document Supabase RLS Recursion Troubleshooting Note` | ✅ Live |
| Catalog #3 | [#54](https://github.com/TheVicky1/Pact_OS/issues/54) | `[Docs] Add LeetCode API Payload Example to Proof Connector Spec` | ✅ Live |
| Catalog #4 | [#55](https://github.com/TheVicky1/Pact_OS/issues/55) | `[Docs] Clarify Offline Test Execution in Beginner Contribution Guide` | ✅ Live |
| Catalog #5 | [#56](https://github.com/TheVicky1/Pact_OS/issues/56) | `[Docs] Document Conventional Commit Scopes in Git Workflow Guide` | ✅ Live |
| Catalog #6 | [#57](https://github.com/TheVicky1/Pact_OS/issues/57) | `[Copy] Improve Empty-State Description and Callout in Goals View` | ✅ Live |
| Catalog #7 | [#58](https://github.com/TheVicky1/Pact_OS/issues/58) | `[Copy] Correct Zero-State Pluralization in Daily Cadence Widget` | ✅ Live |
| Catalog #8 | [#59](https://github.com/TheVicky1/Pact_OS/issues/59) | `[UI] Refine Finance Category Badge Background Opacity` | ✅ Live |
| Catalog #9 | [#60](https://github.com/TheVicky1/Pact_OS/issues/60) | `[UI] Enhance Streak Summary Highlight Glow on Habit Card` | ✅ Live |
| Catalog #10 | [#61](https://github.com/TheVicky1/Pact_OS/issues/61) | `[UI] Improve Mobile Bottom Sheet Padding in Task Form Modal` | ✅ Live |
| Catalog #11 | [#62](https://github.com/TheVicky1/Pact_OS/issues/62) | `[UI] Refine Card Border Styling in Analytics Skeleton Loader` | ✅ Live |
| Catalog #12 | [#63](https://github.com/TheVicky1/Pact_OS/issues/63) | `[A11y] Add Accessible Focus Ring to Keyboard Shortcuts Modal Close Button` | ✅ Live |
| Catalog #13 | [#64](https://github.com/TheVicky1/Pact_OS/issues/64) | `[A11y] Add Explicit ARIA Label to Notification Popover Clear Action` | ✅ Live |
| Catalog #14 | [#65](https://github.com/TheVicky1/Pact_OS/issues/65) | `[A11y] Add aria-expanded and aria-haspopup Attributes to User Profile Trigger` | ✅ Live |
| Catalog #15 | [#66](https://github.com/TheVicky1/Pact_OS/issues/66) | `[A11y] Ensure Active Focus Card Timer Has Accessible Status Label` | ✅ Live |
| Catalog #16 | [#67](https://github.com/TheVicky1/Pact_OS/issues/67) | `[JSDoc] Add JSDoc Examples and Return Contracts in lib/money.ts` | ✅ Live |
| Catalog #17 | [#68](https://github.com/TheVicky1/Pact_OS/issues/68) | `[JSDoc] Add JSDoc Documentation to Timezone Helpers in lib/time.ts` | ✅ Live |
| Catalog #18 | [#69](https://github.com/TheVicky1/Pact_OS/issues/69) | `[Test] Add Leap-Year Boundary Test Case to Habit Streak Test Suite` | ✅ Live |
| Catalog #19 | [#70](https://github.com/TheVicky1/Pact_OS/issues/70) | `[Test] Add Step Boundary Range Assertion to Weekly Review Test Suite` | ✅ Live |
| Catalog #20 | [#71](https://github.com/TheVicky1/Pact_OS/issues/71) | `[Test] Add Notification Channel Filter Test Case to Notifications Test Suite` | ✅ Live |
| Catalog #21 | [#80](https://github.com/TheVicky1/Pact_OS/issues/80) | `[A11y] Add aria-label and type="button" to Habit Card Reset Triggers` | ✅ Live |
| Catalog #22 | [#81](https://github.com/TheVicky1/Pact_OS/issues/81) | `[JSDoc] Add Return Type Annotations and Usage Examples in src/lib/utils/analytics.ts` | ✅ Live |
| Catalog #23 | [#82](https://github.com/TheVicky1/Pact_OS/issues/82) | `[Test] Add Zero-Value Expense Test Case to Finance Discipline Test Suite` | ✅ Live |
| Catalog #24 | [#83](https://github.com/TheVicky1/Pact_OS/issues/83) | `[A11y] Add aria-live Polite Region to Focus Timer Display` | ✅ Live |
| Catalog #25 | [#84](https://github.com/TheVicky1/Pact_OS/issues/84) | `[Test] Add Empty Queue Assertion to Offline Sync Queue Test Suite` | ✅ Live |
| Catalog #26 | [#85](https://github.com/TheVicky1/Pact_OS/issues/85) | `[A11y] Add Keyboard Navigation Support (Enter/Space) to Notification Preference Toggles` | ✅ Live |
| Catalog #27 | [#86](https://github.com/TheVicky1/Pact_OS/issues/86) | `[JSDoc] Document Currency Conversion Boundaries in src/lib/utils/money.ts` | ✅ Live |
| Catalog #28 | [#87](https://github.com/TheVicky1/Pact_OS/issues/87) | `[Test] Add Single-Item Boundary Test Case to Task Prioritization Test Suite` | ✅ Live |
| Catalog #29 | [#88](https://github.com/TheVicky1/Pact_OS/issues/88) | `[A11y] Add aria-expanded and aria-controls to Navigation Menu Triggers` | ✅ Live |
| Catalog #30 | [#89](https://github.com/TheVicky1/Pact_OS/issues/89) | `[Test] Add Step Completion Boundary Test Case to Weekly Review Test Suite` | ✅ Live |
| Catalog #31 | [#91](https://github.com/TheVicky1/Pact_OS/issues/91) | `[A11y] Add aria-label and type="button" to Calendar Navigation Arrow Controls` | ✅ Live |
| Catalog #32 | [#92](https://github.com/TheVicky1/Pact_OS/issues/92) | `[JSDoc] Document Parameter Constraints and Return Types in src/lib/utils/time.ts` | ✅ Live |
| Catalog #33 | [#93](https://github.com/TheVicky1/Pact_OS/issues/93) | `[Test] Add Boundary Test Case for Max Budget Percentage in Budget Remaining Test Suite` | ✅ Live |
| Catalog #34 | [#94](https://github.com/TheVicky1/Pact_OS/issues/94) | `[A11y] Add aria-describedby Instruction Link to Goal Target Input Field` | ✅ Live |
| Catalog #35 | [#95](https://github.com/TheVicky1/Pact_OS/issues/95) | `[Test] Add Multiple Tag Deduplication Test Case to Tasks Validation Test Suite` | ✅ Live |
| Catalog #36 | [#130](https://github.com/TheVicky1/Pact_OS/issues/130) | `[A11y] Add aria-pressed Attribute to Focus Mode Switcher Buttons` | ✅ Live |
| Catalog #37 | [#131](https://github.com/TheVicky1/Pact_OS/issues/131) | `[Test] Add Boundary Test Case for Exact 255 Character Title in Goals Validation Test Suite` | ✅ Live |
| Catalog #38 | [#132](https://github.com/TheVicky1/Pact_OS/issues/132) | `[JSDoc] Add Return Type Annotations and Usage Example to formatTimerDisplay in src/lib/focus/timer.ts` | ✅ Live |
| Catalog #39 | [#133](https://github.com/TheVicky1/Pact_OS/issues/133) | `[A11y] Add aria-label Attribute to Delete Task Modal Cancel Action` | ✅ Live |
| Catalog #40 | [#134](https://github.com/TheVicky1/Pact_OS/issues/134) | `[JSDoc] Add Return Type Annotations and Usage Example to formatMonthLabel in src/lib/money.ts` | ✅ Live |
| Catalog #41 | [#135](https://github.com/TheVicky1/Pact_OS/issues/135) | `[Test] Add Single-Frequency Filter Test Case to Habit Recurrence Suite` | ✅ Live |
| Catalog #42 | [#136](https://github.com/TheVicky1/Pact_OS/issues/136) | `[A11y] Add ARIA Progressbar Role and Value Attributes to Streak Summary Card` | ✅ Live |
| Catalog #43 | [#137](https://github.com/TheVicky1/Pact_OS/issues/137) | `[JSDoc] Add JSDoc Annotations to Partner Verification Schemas in src/lib/validations/partner.ts` | ✅ Live |
| Catalog #44 | [#138](https://github.com/TheVicky1/Pact_OS/issues/138) | `[Docs] Add Node.js Version Verification Tip in docs/DEVELOPMENT.md` | ✅ Live |

---

## 🎯 Level 1: Fast Wins (5–10 Minutes) — Documentation & Copy

---

### Issue #1: [Docs] Add Code Examples for lib/money.ts Integer-Cents Calculations
- **Labels:** `good first issue`, `documentation`, `difficulty:beginner`, `area:core`
- **Target File:** `docs/DEVELOPMENT.md`
- **Estimated Time:** 5–10 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
PACT strictly forbids floating-point arithmetic for currency calculations (all monetary values are calculated in integer cents). Providing clear, copy-pasteable TypeScript code snippets in `docs/DEVELOPMENT.md` helps new contributors avoid common floating-point bugs.

#### Current Behavior
Section 7 in `docs/DEVELOPMENT.md` mentions that integer cents should be used for currency, but lacks a concise TypeScript example illustrating `formatCentsToDollars`, `dollarsToCents`, and `sumCents`.

#### Requested Change
Add a short fenced TypeScript code block under Section 7 in `docs/DEVELOPMENT.md` illustrating:
```typescript
import { dollarsToCents, formatCentsToCurrency, sumCents } from '@/lib/money';

const stakeCents = dollarsToCents(25.50); // 2550
const totalCents = sumCents([stakeCents, 1000]); // 3550
const formatted = formatCentsToCurrency(totalCents); // "$35.50"
```

#### Acceptance Criteria
- [ ] TypeScript code example is added under Section 7 of `docs/DEVELOPMENT.md`.
- [ ] Snippet uses valid imported function names from `src/lib/money.ts`.
- [ ] Relative links and markdown formatting remain clean and valid.

#### Verification
```bash
node scratch/check-links.mjs
```

#### Contributor Notes
This is a markdown-only documentation task. No application logic changes are required.

---

### Issue #2: [Docs] Document Supabase RLS Recursion Troubleshooting Note
- **Labels:** `good first issue`, `documentation`, `difficulty:beginner`, `area:core`
- **Target File:** `docs/TROUBLESHOOTING.md`
- **Estimated Time:** 5–10 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
When querying related tables with Row Level Security (RLS) policies, developers may occasionally encounter PostgreSQL infinite recursion errors (`42P17: infinite recursion detected in policy for relation`). Documenting the cause and fix in `docs/TROUBLESHOOTING.md` saves time for developers writing Server Actions.

#### Current Behavior
`docs/TROUBLESHOOTING.md` covers Node.js, Next.js, and TypeScript issues, but lacks a specific section explaining Supabase RLS policy recursion.

#### Requested Change
Add a subsection in `docs/TROUBLESHOOTING.md` under database troubleshooting explaining:
1. **Symptom:** `error: infinite recursion detected in policy for relation "profiles"`.
2. **Cause:** A policy on Table A queries Table B, whose policy in turn queries Table A.
3. **Fix:** Use a security-definer helper function or reference `auth.uid()` directly without cross-joining parent policies.

#### Acceptance Criteria
- [ ] Subsection added to `docs/TROUBLESHOOTING.md` with clear Symptom, Cause, and Fix.
- [ ] Markdown formatting conforms to existing guide style.

#### Verification
```bash
node scratch/check-links.mjs
```

#### Contributor Notes
Markdown-only issue. Ideal for first-time contributors learning backend/PostgreSQL concepts.

---

### Issue #3: [Docs] Add LeetCode API Payload Example to Proof Connector Spec
- **Labels:** `good first issue`, `documentation`, `difficulty:beginner`, `area:core`
- **Target File:** `docs/INTEGRATIONS.md`
- **Estimated Time:** 5–10 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
PACT verifies proof-of-work accountability through external platforms like LeetCode and GitHub. Providing a concrete mock JSON payload in `docs/INTEGRATIONS.md` helps contributors understand how verification data is parsed without needing live API tokens.

#### Current Behavior
`docs/INTEGRATIONS.md` describes the LeetCode GraphQL connector conceptually, but does not include a sample GraphQL JSON response for submission verification.

#### Requested Change
Add a fenced JSON code block in `docs/INTEGRATIONS.md` under the LeetCode section showing a sample GraphQL response payload containing `recentSubmissionList` with `titleSlug`, `statusDisplay: "Accepted"`, and `timestamp`.

#### Acceptance Criteria
- [ ] Sample JSON payload block added to `docs/INTEGRATIONS.md`.
- [ ] JSON is valid and matches the fields handled in `src/lib/integrations/leetcode.ts`.

#### Verification
```bash
node scratch/check-links.mjs
```

#### Contributor Notes
Documentation-only task.

---

### Issue #4: [Docs] Clarify Offline Test Execution in Beginner Contribution Guide
- **Labels:** `good first issue`, `documentation`, `difficulty:beginner`, `area:core`
- **Target File:** `docs/CONTRIBUTING-BEGINNERS.md`
- **Estimated Time:** 5–10 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
New contributors often assume they need to provision a live Supabase database and configure Stripe webhooks just to test small UI or documentation changes. Explicitly reassuring them that all tests run offline eliminates onboarding hesitation.

#### Current Behavior
`docs/CONTRIBUTING-BEGINNERS.md` lists test commands, but could more prominently emphasize that unit tests mock all database dependencies locally.

#### Requested Change
Add a helpful callout box in `docs/CONTRIBUTING-BEGINNERS.md` under Step 10 explaining that `npm test` runs 100% offline in under 5 seconds with zero cloud setup needed.

#### Acceptance Criteria
- [ ] Callout box added using standard GitHub markdown syntax (`> [!NOTE]`).
- [ ] Explains that local tests do not require Supabase credentials.

#### Verification
```bash
node scratch/check-links.mjs
```

#### Contributor Notes
Great first issue for understanding PACT's contributor philosophy.

---

### Issue #5: [Docs] Document Conventional Commit Scopes in Git Workflow Guide
- **Labels:** `good first issue`, `documentation`, `difficulty:beginner`, `area:core`
- **Target File:** `docs/GIT_WORKFLOW.md`
- **Estimated Time:** 5–10 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
PACT uses Conventional Commits (e.g., `feat(planner): ...`, `ui(habits): ...`). Documenting valid commit scopes helps contributors format their PR commits accurately.

#### Current Behavior
`docs/GIT_WORKFLOW.md` outlines commit types (`feat`, `fix`, `docs`, `ui`), but does not provide a reference list of common scopes (`planner`, `finance`, `habits`, `focus`, `a11y`, `auth`).

#### Requested Change
Add a concise table in `docs/GIT_WORKFLOW.md` listing recommended scope names corresponding to PACT's feature modules.

#### Acceptance Criteria
- [ ] Scope table added to `docs/GIT_WORKFLOW.md`.
- [ ] Scopes match existing directories in `src/features/`.

#### Verification
```bash
node scratch/check-links.mjs
```

#### Contributor Notes
Markdown-only issue.

---

### Issue #6: [Copy] Improve Empty-State Description and Callout in Goals View
- **Labels:** `good first issue`, `ui`, `difficulty:beginner`, `area:dashboard`
- **Target File:** `src/features/goals/components/goals-view.tsx`
- **Estimated Time:** 5–10 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
When a new user visits the Goals workspace for the first time with 0 goals, the empty state should offer clear, encouraging guidance on setting their first strategic milestone.

#### Current Behavior
`src/features/goals/components/goals-view.tsx` displays a basic "No goals found" heading.

#### Requested Change
Refine the empty-state subtitle copy to: *"Define your high-leverage quarterly objectives and break them down into actionable milestones."*

#### Acceptance Criteria
- [ ] Empty state copy updated in `src/features/goals/components/goals-view.tsx`.
- [ ] TypeScript check and ESLint pass cleanly.

#### Verification
```bash
npm run lint
npx tsc --noEmit
```

#### Contributor Notes
Single string copy change in one file.

---

### Issue #7: [Copy] Correct Zero-State Pluralization in Daily Cadence Widget
- **Labels:** `good first issue`, `ui`, `difficulty:beginner`, `area:dashboard`
- **Target File:** `src/features/dashboard/components/daily-cadence-widget.tsx`
- **Estimated Time:** 5–10 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
When a user completes all daily tasks, the widget summary text should read grammatically clean copy ("0 tasks remaining today") rather than awkward singular/plural edge cases.

#### Current Behavior
The cadence widget displays `${count} tasks remaining` even when count is 1.

#### Requested Change
Update the text string to use clean singular/plural formatting:
```typescript
const taskLabel = count === 1 ? 'task' : 'tasks';
```

#### Acceptance Criteria
- [ ] Pluralization logic updated in `src/features/dashboard/components/daily-cadence-widget.tsx`.
- [ ] Displays "1 task remaining" when count is 1, and "X tasks remaining" otherwise.

#### Verification
```bash
npm run lint
npx tsc --noEmit
```

#### Contributor Notes
Simple 1-line string format adjustment.

---

## 🎨 Level 2: Core Refinements (10–15 Minutes) — UI, a11y, JSDoc

---

### Issue #8: [UI] Refine Finance Category Badge Background Opacity
- **Labels:** `good first issue`, `ui`, `difficulty:beginner`, `area:dashboard`
- **Target File:** `src/features/finance/components/transaction-list.tsx`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
In the transactions ledger table, category tag badges should maintain optimal contrast against the Obsidian dark background (`#050505`) while preserving the subtle glassmorphism aesthetic.

#### Current Behavior
Category tags currently use `bg-opacity-20`, which can appear slightly washed out on lower-contrast monitors.

#### Requested Change
In `src/features/finance/components/transaction-list.tsx`, update the badge background utility classes to `bg-opacity-15 border border-white/[0.08]` for enhanced legibility and visual crispness.

#### Acceptance Criteria
- [ ] Badge opacity adjusted in `src/features/finance/components/transaction-list.tsx`.
- [ ] Visual contrast conforms to WCAG AA on dark backgrounds.
- [ ] `npm run lint` and `npx tsc --noEmit` pass with 0 errors.

#### Verification
```bash
npm run lint
npx tsc --noEmit
```

#### Contributor Notes
Scoped strictly to Tailwind CSS classes in a single component.

---

### Issue #9: [UI] Enhance Streak Summary Highlight Glow on Habit Card
- **Labels:** `good first issue`, `ui`, `difficulty:beginner`, `area:dashboard`
- **Target File:** `src/features/habits/components/streak-summary-card.tsx`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
Active streaks represent personal discipline momentum. Adding a subtle hover glow effect to the highest-streak milestone card provides rewarding tactile feedback.

#### Current Behavior
The metric card in `src/features/habits/components/streak-summary-card.tsx` has static border styling.

#### Requested Change
Add a subtle transition class to the streak summary metric card:
`transition-all duration-200 hover:border-amber-500/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.05)]`

#### Acceptance Criteria
- [ ] Hover styling added to the card container in `src/features/habits/components/streak-summary-card.tsx`.
- [ ] Uses PACT Gold RGB values (`212, 175, 55`).

#### Verification
```bash
npm run lint
npx tsc --noEmit
```

#### Contributor Notes
Single file Tailwind CSS addition.

---

### Issue #10: [UI] Improve Mobile Bottom Sheet Padding in Task Form Modal
- **Labels:** `good first issue`, `ui`, `difficulty:beginner`, `area:dashboard`
- **Target File:** `src/features/tasks/components/task-form-modal.tsx`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
On mobile viewports (`< 640px`), form action buttons in modals should have adequate safe-area bottom padding to prevent overlap with mobile browser navigation bars.

#### Current Behavior
The modal footer in `src/features/tasks/components/task-form-modal.tsx` has fixed padding `p-4`.

#### Requested Change
Update the modal footer container to use responsive padding: `p-4 pb-6 sm:pb-4`.

#### Acceptance Criteria
- [ ] Responsive padding applied in `src/features/tasks/components/task-form-modal.tsx`.
- [ ] Modal displays cleanly on both mobile (`375px`) and desktop (`1280px`).

#### Verification
```bash
npm run lint
npx tsc --noEmit
```

#### Contributor Notes
CSS utility tweak in one file.

---

### Issue #11: [UI] Refine Card Border Styling in Analytics Skeleton Loader
- **Labels:** `good first issue`, `ui`, `difficulty:beginner`, `area:dashboard`
- **Target File:** `src/features/analytics/components/analytics-skeleton.tsx`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
Skeleton loaders should match the exact border radii and border opacities of their hydrated component counterparts to avoid visual layout shifts during page loading.

#### Current Behavior
Card placeholders in `src/features/analytics/components/analytics-skeleton.tsx` use `border-white/[0.08]`.

#### Requested Change
Align card placeholder borders with the design system standard: `border border-white/[0.06] rounded-2xl bg-zinc-950/40`.

#### Acceptance Criteria
- [ ] Card placeholder styling updated in `src/features/analytics/components/analytics-skeleton.tsx`.
- [ ] Skeleton matches hydrated analytics summary cards.

#### Verification
```bash
npm run lint
npx tsc --noEmit
```

#### Contributor Notes
Single file modification.

---

### Issue #12: [A11y] Add Accessible Focus Ring to Keyboard Shortcuts Modal Close Button
- **Labels:** `good first issue`, `accessibility`, `difficulty:beginner`, `area:dashboard`
- **Target File:** `src/components/ui/keyboard-shortcuts-modal.tsx`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
Keyboard-only users navigating the shortcuts modal need a clear visible focus indicator when tabbing to the close (`X`) button.

#### Current Behavior
The close button in `src/components/ui/keyboard-shortcuts-modal.tsx` line 97 has hover styles but lacks an explicit `focus:ring` indicator.

#### Requested Change
Add `focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-1 focus:ring-offset-neutral-900` to the close button's `className`.

#### Acceptance Criteria
- [ ] Visible focus ring classes added to the button element in `src/components/ui/keyboard-shortcuts-modal.tsx`.
- [ ] Button retains its existing `aria-label="Close shortcuts guide"`.

#### Verification
```bash
npm run lint
npx tsc --noEmit
```

#### Contributor Notes
Great micro-task for practicing accessible focus states in Tailwind CSS.

---

### Issue #13: [A11y] Add Explicit ARIA Label to Notification Popover Clear Action
- **Labels:** `good first issue`, `accessibility`, `difficulty:beginner`, `area:dashboard`
- **Target File:** `src/components/ui/notification-popover.tsx`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
Screen reader users navigating notifications need unambiguous action descriptions for icon-only action buttons.

#### Current Behavior
In `src/components/ui/notification-popover.tsx`, the mark-all-read button renders an icon without an explicit `aria-label`.

#### Requested Change
Add `aria-label="Mark all notifications as read"` and a descriptive `title` to the button element.

#### Acceptance Criteria
- [ ] `aria-label` attribute present on the mark-all-as-read button in `src/components/ui/notification-popover.tsx`.
- [ ] Screen readers announce the button purpose clearly.

#### Verification
```bash
npm run lint
npx tsc --noEmit
```

#### Contributor Notes
Single attribute addition.

---

### Issue #14: [A11y] Add aria-expanded and aria-haspopup Attributes to User Profile Trigger
- **Labels:** `good first issue`, `accessibility`, `difficulty:beginner`, `area:dashboard`
- **Target File:** `src/components/ui/user-profile-dropdown.tsx`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
Dropdown menus must communicate their open/closed state to assistive technologies via WAI-ARIA menu button patterns.

#### Current Behavior
The profile button in `src/components/ui/user-profile-dropdown.tsx` toggles state in React, but does not bind `aria-expanded` to the button element.

#### Requested Change
Add `aria-haspopup="menu"` and `aria-expanded={isOpen}` to the dropdown trigger button in `src/components/ui/user-profile-dropdown.tsx`.

#### Acceptance Criteria
- [ ] `aria-haspopup="menu"` added to the trigger button.
- [ ] `aria-expanded` dynamically reflects the `isOpen` boolean state.

#### Verification
```bash
npm run lint
npx tsc --noEmit
```

#### Contributor Notes
Standard WAI-ARIA dropdown attribute binding.

---

### Issue #15: [A11y] Ensure Active Focus Card Timer Has Accessible Status Label
- **Labels:** `good first issue`, `accessibility`, `difficulty:beginner`, `area:dashboard`
- **Target File:** `src/features/dashboard/components/active-focus-card.tsx`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
The active focus session card displays a live countdown timer. Adding an `aria-label` describing the active session state ensures screen reader users understand the focus duration.

#### Current Behavior
The time display in `src/features/dashboard/components/active-focus-card.tsx` renders raw text without an enclosing accessible description.

#### Requested Change
Add `aria-label={`Active focus timer: ${formattedTime} remaining`}` to the countdown timer container.

#### Acceptance Criteria
- [ ] Accessible `aria-label` added to the timer display container in `src/features/dashboard/components/active-focus-card.tsx`.
- [ ] Formatted string dynamically updates with remaining time.

#### Verification
```bash
npm run lint
npx tsc --noEmit
```

#### Contributor Notes
Single JSX attribute update.

---

### Issue #16: [JSDoc] Add JSDoc Examples and Return Contracts in lib/money.ts
- **Labels:** `good first issue`, `documentation`, `difficulty:beginner`, `area:core`
- **Target File:** `src/lib/money.ts`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
`src/lib/money.ts` contains PACT's core currency math utilities. Comprehensive JSDoc comments with `@example`, `@param`, and `@returns` tags provide instant in-editor documentation for other developers.

#### Current Behavior
Several utility functions in `src/lib/money.ts` (such as `formatCentsToCurrency` and `dollarsToCents`) have brief comments but lack structured JSDoc `@example` blocks.

#### Requested Change
Add formatted JSDoc docstrings with `@param`, `@returns`, and `@example` blocks above `dollarsToCents` and `formatCentsToCurrency` in `src/lib/money.ts`.

#### Acceptance Criteria
- [ ] Structured JSDoc docstrings added above the specified functions in `src/lib/money.ts`.
- [ ] Examples accurately demonstrate integer cents inputs and outputs.
- [ ] `npx tsc --noEmit` and `npm run lint` pass with 0 errors.

#### Verification
```bash
npm run lint
npx tsc --noEmit
```

#### Contributor Notes
Code clarity task. Do not alter any runtime function logic.

---

### Issue #17: [JSDoc] Add JSDoc Documentation to Timezone Helpers in lib/time.ts
- **Labels:** `good first issue`, `documentation`, `difficulty:beginner`, `area:core`
- **Target File:** `src/lib/time.ts`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
Timezone handling is critical in PACT to ensure deadlines, habit streaks, and daily sunset rituals trigger at the user's local midnight. Clear JSDoc comments explain how UTC conversions operate.

#### Current Behavior
Core functions in `src/lib/time.ts` (such as `localToUtc` and `utcToDatetimeLocalInput`) have basic comments without JSDoc parameter definitions.

#### Requested Change
Add complete JSDoc docstrings with `@param dateStr`, `@param timezone`, `@returns`, and `@example` to `localToUtc` and `utcToDatetimeLocalInput` in `src/lib/time.ts`.

#### Acceptance Criteria
- [ ] JSDoc docstrings added to target functions in `src/lib/time.ts`.
- [ ] Parameter types and return formats are accurately documented.

#### Verification
```bash
npm run lint
npx tsc --noEmit
```

#### Contributor Notes
Documentation-only code improvement.

---

## 🧪 Level 3: Deep Dives (15–30 Minutes) — Unit Tests & Edge Cases

---

### Issue #18: [Test] Add Leap-Year Boundary Test Case to Habit Streak Test Suite
- **Labels:** `good first issue`, `testing`, `difficulty:beginner`, `area:core`
- **Target File:** `tests/habits-routines.test.ts`
- **Estimated Time:** 15–20 minutes
- **Difficulty:** Level 3 (Beginner)

#### Why This Matters
Habit streak calculations must correctly handle February 28 to February 29 transitions during leap years without resetting the streak to zero.

#### Current Behavior
`tests/habits-routines.test.ts` validates daily and weekly habit streaks, but lacks an explicit leap-year boundary test case spanning `2028-02-28` to `2028-02-29` and `2028-03-01`.

#### Requested Change
Add a new test case in `tests/habits-routines.test.ts` verifying that completing a daily habit on Feb 28, Feb 29 (leap day), and Mar 1 calculates a continuous 3-day streak.

#### Acceptance Criteria
- [ ] Test case added in `tests/habits-routines.test.ts`.
- [ ] Test passes cleanly when run via `npm run test:file -- tests/habits-routines.test.ts`.
- [ ] Existing 56 test suites remain passing.

#### Verification
```bash
npm run test:file -- tests/habits-routines.test.ts
```

#### Contributor Notes
Follow the existing test patterns in `tests/habits-routines.test.ts`.

---

### Issue #19: [Test] Add Step Boundary Range Assertion to Weekly Review Test Suite
- **Labels:** `good first issue`, `testing`, `difficulty:beginner`, `area:core`
- **Target File:** `tests/weekly-review.test.ts`
- **Estimated Time:** 15–20 minutes
- **Difficulty:** Level 3 (Beginner)

#### Why This Matters
The Weekly Review ritual progresses through 5 discrete steps (`1: Retrospective`, `2: Tasks Audit`, `3: Habit Scorecard`, `4: Goal Alignment`, `5: Strategic Commitments`). Boundary tests ensure invalid step indices (`< 1` or `> 5`) are rejected cleanly.

#### Current Behavior
`tests/weekly-review.test.ts` validates standard step advancement, but does not explicitly assert that step indices 0 or 6 throw validation errors.

#### Requested Change
Add a dedicated test block in `tests/weekly-review.test.ts` asserting that step transitions clamp to valid range `[1, 5]`.

#### Acceptance Criteria
- [ ] Boundary check test case added to `tests/weekly-review.test.ts`.
- [ ] Test executes and passes cleanly.

#### Verification
```bash
npm run test:file -- tests/weekly-review.test.ts
```

#### Contributor Notes
Self-contained unit test addition.

---

### Issue #20: [Test] Add Notification Channel Filter Test Case to Notifications Test Suite
- **Labels:** `good first issue`, `testing`, `difficulty:beginner`, `area:core`
- **Target File:** `tests/notifications.test.ts`
- **Estimated Time:** 15–20 minutes
- **Difficulty:** Level 3 (Beginner)

#### Why This Matters
PACT routes notifications to different channels (`in_app`, `email`, `push`). Adding unit test coverage for channel filtering ensures unread notification counts filter accurately by channel.

#### Current Behavior
`tests/notifications.test.ts` verifies notification creation and dismissal, but does not test filtering by `channel = 'in_app'`.

#### Requested Change
Add a test case in `tests/notifications.test.ts` that creates a mock array with mixed channels (`in_app` and `email`) and verifies that filtering for `in_app` returns only the expected items.

#### Acceptance Criteria
- [ ] Channel filter test case added to `tests/notifications.test.ts`.
- [ ] Test runs cleanly offline with `npm run test:file -- tests/notifications.test.ts`.

#### Verification
```bash
npm run test:file -- tests/notifications.test.ts
```

#### Contributor Notes
Self-contained test addition.

---

## 🚀 How to Claim and Implement an Issue

1. **Choose an Issue**: Browse the list above and pick an issue that matches your interest and available time.
2. **Comment on GitHub**: Leave a comment on the corresponding GitHub issue: *"I would like to work on this issue. Please assign it to me."*
3. **Follow the Guide**: Review our [**Beginner's Contribution Guide**](CONTRIBUTING-BEGINNERS.md) for step-by-step Git instructions.
4. **Verify Locally**: Run the specific verification command listed on the issue before opening your PR.
5. **Submit PR**: Open a pull request against `main` (or the designated community branch) referencing the issue number!
