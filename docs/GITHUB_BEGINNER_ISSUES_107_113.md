# 🎯 Curated Beginner Issue Factory (7 New Good First Issues #107–#113)

This document catalogs 7 brand new, beginner-friendly micro-issues for **PACT**. Every issue is scoped to a single target file, requires 5–15 minutes to implement, and includes explicit acceptance criteria and verification commands.

---

## Issue Catalog Overview

| Issue ID | Category | Title | Target File | Est. Time | Difficulty |
| :---: | :---: | :--- | :--- | :---: | :---: |
| **#107** | `accessibility` | `[A11y] Add Accessible Focus Ring to Notification Popover Action Buttons` | `src/components/ui/notification-popover.tsx` | 5–10m | Level 1 |
| **#108** | `jsdoc` | `[JSDoc] Add Return Type Annotations and Usage Example to Money Helper` | `src/lib/money.ts` | 5–10m | Level 1 |
| **#109** | `documentation` | `[Docs] Document Supabase Missing Environment Variable Troubleshooting` | `docs/TROUBLESHOOTING.md` | 5–10m | Level 1 |
| **#110** | `testing` | `[Test] Add Single-Item Filter Boundary Test Case to Task Engine` | `tests/tasks-validation.test.ts` | 10–15m | Level 2 |
| **#111** | `ui` | `[UI] Standardize Hover Elevation and Gold Border on Streak Summary Card` | `src/features/habits/components/streak-summary-card.tsx` | 5–10m | Level 1 |
| **#112** | `accessibility` | `[A11y] Add Keyboard Escape Key Listener to Task Form Modal` | `src/features/tasks/components/task-form-modal.tsx` | 10–15m | Level 2 |
| **#113** | `copy` | `[Copy] Correct Zero-State Pluralization in Daily Cadence Widget` | `src/features/dashboard/components/daily-cadence-widget.tsx` | 5–10m | Level 1 |

---

## Detailed Issue Specifications

### Issue #107: `[A11y] Add Accessible Focus Ring to Notification Popover Action Buttons`
* **Labels**: `good first issue`, `accessibility`, `difficulty:beginner`, `area:ui`
* **Target File**: `src/components/ui/notification-popover.tsx`
* **Estimated Time**: 5–10 minutes
* **Difficulty**: Level 1 (Beginner)
* **Why This Matters**:
  All interactive icon buttons inside popover components must present visible focus rings when navigated via keyboard.
* **Current Behavior**:
  The action buttons in `notification-popover.tsx` use hover transition styles but lack explicit `focus-visible:ring-1` focus indicators.
* **Requested Change**:
  Add `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d4af37]/50` to the action button class list.
* **Acceptance Criteria**:
  * Action buttons in `notification-popover.tsx` show visible focus indicators when focused via keyboard Tab key.
  * Code passes `npm run lint`.

---

### Issue #108: `[JSDoc] Add Return Type Annotations and Usage Example to Money Helper`
* **Labels**: `good first issue`, `jsdoc`, `difficulty:beginner`, `area:core`
* **Target File**: `src/lib/money.ts`
* **Estimated Time**: 5–10 minutes
* **Difficulty**: Level 1 (Beginner)
* **Why This Matters**:
  Public utility functions in domain engines should document return contracts and usage examples for new contributors.
* **Current Behavior**:
  `formatCentsToDollars` in `src/lib/money.ts` contains basic JSDoc comments but lacks `@returns` contract annotations and code examples.
* **Requested Change**:
  Add `@returns {string}` and a `@example` block illustrating integer-cents conversion (e.g. `formatCentsToDollars(1250) // => "$12.50"`).
* **Acceptance Criteria**:
  * Function has complete JSDoc annotations with `@param`, `@returns`, and `@example`.
  * Passes `npx tsc --noEmit`.

---

### Issue #109: `[Docs] Document Supabase Missing Environment Variable Troubleshooting`
* **Labels**: `good first issue`, `documentation`, `difficulty:beginner`, `area:core`
* **Target File**: `docs/TROUBLESHOOTING.md`
* **Estimated Time**: 5–10 minutes
* **Difficulty**: Level 1 (Beginner)
* **Why This Matters**:
  Developers setting up PACT locally may occasionally forget to copy `.env.example` to `.env.local`, causing runtime Supabase client initialization errors.
* **Current Behavior**:
  `docs/TROUBLESHOOTING.md` covers RLS recursion and Node versions, but lacks a dedicated section for missing Supabase URL/Key environment variables.
* **Requested Change**:
  Add a subsection under Section 3 (Environment Variables) in `docs/TROUBLESHOOTING.md` detailing:
  * **Symptom**: `Error: supabaseUrl is required` or `Invalid API key`.
  * **Cause**: `.env.local` is missing or `NEXT_PUBLIC_SUPABASE_URL` is empty.
  * **Fix**: Copy `.env.example` to `.env.local` and populate valid Supabase credentials.
* **Acceptance Criteria**:
  * Subsection added with clear Symptom, Cause, and Fix matching existing document style.
  * Passes link audit via `node scratch/check-links.mjs`.

---

### Issue #110: `[Test] Add Single-Item Filter Boundary Test Case to Task Engine`
* **Labels**: `good first issue`, `testing`, `difficulty:beginner`, `area:tasks`
* **Target File**: `tests/tasks-validation.test.ts`
* **Estimated Time**: 10–15 minutes
* **Difficulty**: Level 2 (Beginner)
* **Why This Matters**:
  Task collection filters must maintain array integrity when filtering collections containing exactly one task element.
* **Current Behavior**:
  `tests/tasks-validation.test.ts` covers multi-task priority sorting and empty array handling, but lacks a dedicated single-element array boundary test.
* **Requested Change**:
  Add a unit test case `it('preserves single task when matching filter criteria')` in `tests/tasks-validation.test.ts`.
* **Acceptance Criteria**:
  * New unit test added and passes cleanly via `npm test`.

---

### Issue #111: `[UI] Standardize Hover Elevation and Gold Border on Streak Summary Card`
* **Labels**: `good first issue`, `ui`, `difficulty:beginner`, `area:habits`
* **Target File**: `src/features/habits/components/streak-summary-card.tsx`
* **Estimated Time**: 5–10 minutes
* **Difficulty**: Level 1 (Beginner)
* **Why This Matters**:
  Consistency across obsidian glassmorphic card containers improves visual cohesion across OS workspaces.
* **Current Behavior**:
  `streak-summary-card.tsx` renders static border styles without subtle hover elevation or gold border glow.
* **Requested Change**:
  Add `transition-all duration-200 hover:border-[#d4af37]/30 hover:shadow-lg` to the primary card container.
* **Acceptance Criteria**:
  * Card container smoothly transitions border opacity on hover.
  * `npm run lint` passes without warnings.

---

### Issue #112: `[A11y] Add Keyboard Escape Key Listener to Task Form Modal`
* **Labels**: `good first issue`, `accessibility`, `difficulty:beginner`, `area:tasks`
* **Target File**: `src/features/tasks/components/task-form-modal.tsx`
* **Estimated Time**: 10–15 minutes
* **Difficulty**: Level 2 (Beginner)
* **Why This Matters**:
  Accessible modal dialogs must allow keyboard users to dismiss active overlays using the `Escape` key.
* **Current Behavior**:
  `task-form-modal.tsx` can be closed via mouse click on the backdrop or close button, but lacks a `window.addEventListener('keydown')` for the `Escape` key.
* **Requested Change**:
  Add a `useEffect` hook with a keydown listener checking `if (e.g. e.key === 'Escape') onClose()`.
* **Acceptance Criteria**:
  * Pressing `Esc` key closes the modal overlay when active.
  * Code passes TypeScript typecheck.

---

### Issue #113: `[Copy] Correct Zero-State Pluralization in Daily Cadence Widget`
* **Labels**: `good first issue`, `copy`, `difficulty:beginner`, `area:dashboard`
* **Target File**: `src/features/dashboard/components/daily-cadence-widget.tsx`
* **Estimated Time**: 5–10 minutes
* **Difficulty**: Level 1 (Beginner)
* **Why This Matters**:
  Empty state typography should accurately reflect zero commitments without grammatically awkward phrasing.
* **Current Behavior**:
  `daily-cadence-widget.tsx` displays "0 active commitment remaining" instead of "0 active commitments remaining".
* **Requested Change**:
  Update pluralization logic to display "commitments" when task count is 0 or > 1.
* **Acceptance Criteria**:
  * Zero remaining commitments state correctly renders pluralized string "0 active commitments remaining".
  * Test suite passes `npm test`.
