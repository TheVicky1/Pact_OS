# PACT — Open-Source Issue Factory & Contributor Discovery Architecture

This document defines the canonical architecture and specification guidelines for PACT's **Issue Factory**. It ensures that issues created in the repository are easily discoverable by open-source contributors via GitHub Search and provide complete, unambiguous context for implementation.

---

## 1. Overview & Objectives

The primary objective of PACT's Issue Factory is to bridge the gap between project requirements and contributor discovery:
1. **GitHub Search & SEO Discoverability:** Issues must surface naturally when developers search GitHub for accessible tasks in modern web technologies (`Next.js`, `React`, `TypeScript`, `Tailwind CSS`, `Supabase`, `PostgreSQL`, `accessibility`, `responsive UI`, `authentication`, `time blocking`, `productivity`, `accountability`, `testing`, `documentation`).
2. **Cognitive Ease & Zero Ambiguity:** Every issue provides explicit architectural context, reproduction steps, code hints, exact file pointers, and acceptance criteria.
3. **Contributor Success Rate:** By structuring tasks with pre-identified test commands and explicit guardrails, contributors can complete PRs without friction or maintainer bottlenecks.

---

## 2. Search-Friendly Title Conventions

Issue titles must use natural GitHub search terminology and follow the Conventional Commits format with descriptive domain scopes.

### Title Anti-Patterns vs. Best Practices

| Anti-Pattern (Vague, Hard to Discover) | Best Practice (SEO & Search-Optimized) |
| :--- | :--- |
| `Improve planner` | `feat(planner): add keyboard shortcuts for time-block navigation in daily timeline` |
| `Fix button` | `a11y(ui): add accessible ARIA labels and focus ring to sidebar navigation buttons` |
| `Update docs` | `docs(contributing): document local Supabase PostgreSQL seed workflow with Next.js` |
| `Ledger calculation` | `test(finance): add edge-case unit tests for integer-cents budget rollover math` |
| `Dark mode problem` | `fix(theme): prevent flash of unstyled theme on initial SSR load in Next.js layout` |

---

## 3. Permanent PACT OS Micro-Issue Standard

From Phase 6D onward, all beginner and first-time contributor issues MUST satisfy the **Micro-Issue Standard**:

### Complexity & Scope Boundary
- **Files Touched**: **One file preferred**, two files maximum unless absolutely necessary.
- **Estimated Completion**: **5–30 minutes** for a first-time contributor.
- **Architectural Isolation**:
  - ❌ No architectural changes
  - ❌ No database migrations or schema adjustments
  - ❌ No authentication or session logic changes
  - ❌ No production infrastructure modifications
  - ❌ No complex business logic or temporal engine alterations
  - ❌ No large refactors
  - ❌ No dependency upgrades
  - ❌ No security-sensitive changes
- **Permanent Labeling Rule**: **TIME LABELS ARE PERMANENTLY FORBIDDEN** (`time:<15m`, `time:<30m`, `time:1-2h`). Cognitive complexity is communicated strictly via `difficulty:beginner`.

### Canonical 6-Part Micro-Issue Anatomy
Every beginner issue must contain the following clear structure:

```markdown
## What needs to be done
Explain the tiny task in simple, jargon-free language.

## Why this matters
Explain why this change improves PACT OS for users or contributors.

## Where to work
Point directly to the exact file path and component.

## Implementation guidance
Give concise, actionable information so the contributor understands
what to change without reverse-engineering the entire codebase.

## Acceptance criteria
- [ ] Requirement 1
- [ ] Requirement 2

## Verification
Explain the simplest command or manual steps to verify the change locally.
```

---

## 4. Canonical Micro-Issue Reference Example

```markdown
## What needs to be done
Add an explicit `aria-label="Close notification panel"` attribute to the popover close button inside the notification popover component.

## Why this matters
Screen reader users navigating the top bar cannot currently identify the purpose of the close button icon, creating an accessibility barrier.

## Where to work
`src/components/notifications/notification-popover.tsx`

## Implementation guidance
1. Open `src/components/notifications/notification-popover.tsx`.
2. Locate the close button element (`<button>` wrapping the `X` icon).
3. Add `aria-label="Close notification panel"` to the button props.

## Acceptance criteria
- [ ] Popover close button includes `aria-label="Close notification panel"`.
- [ ] Visual appearance and click behavior remain unchanged.
- [ ] All linting and TypeScript checks pass.

## Verification
1. Run `npm run lint` — verify 0 errors.
2. Run `npx tsc --noEmit` — verify 0 errors.
3. Open `http://localhost:3000` in your browser and inspect the close button using browser DevTools.
```

---

## 5. Required Contributor Label Taxonomy

For all newly created beginner issues, apply the following orthogonal labels:

### Contributor Discovery Labels
- `good first issue`
- `beginner friendly`
- `difficulty:beginner`
- `help wanted`
- `contributions-welcome` (optional)
- `up-for-grabs` (optional)

### Classification Labels
- `type:docs`, `type:ui`, `type:a11y`, `type:test`, `type:bug`, `type:refactor`
- `area:<subsystem>` (e.g., `area:ui`, `area:documentation`, `area:testing`, `area:finance`)
- `status:ready`

> 🚫 **Forbidden Labels**: Do NOT use `time:*` labels on new issues. Time-based estimation is retired.

---

## 5. Domain Keyword Integration Guidelines

When drafting issues, use domain keywords naturally within the problem statement, technical hints, and tags. Do NOT stuff keywords unnaturally.

### Verified Domain Vocabulary Matrix

| Category | Primary Search Terms | Recommended Natural Phrasing |
| :--- | :--- | :--- |
| **Core Framework** | Next.js, React, TypeScript | *"Implement a localized React hook with strict TypeScript interfaces..."* |
| **Styling & Design** | Tailwind CSS, responsive UI, dark mode | *"Apply responsive Tailwind CSS utility classes adhering to PACT tokens..."* |
| **Accessibility** | a11y, ARIA labels, focus trap, contrast | *"Ensure WCAG 2.1 AA keyboard focus trap and ARIA live regions..."* |
| **Backend & DB** | Supabase, PostgreSQL, RLS policies | *"Ensure queries adhere to Supabase Row Level Security constraints..."* |
| **Domain Engines** | Time blocking, accountability, integer cents | *"Enforce integer-cents arithmetic to avoid floating-point errors..."* |
| **Quality & Tests** | Unit tests, CI quality gates, zero-secret | *"Add test coverage in tests/ and verify with node scratch/run-tests.mjs..."* |

---

## 6. Batch Generation & Backlog Curation

When expanding the repository backlog:
1. **Batching:** Curate issues in focused batches of 5–10 issues per functional milestone.
2. **Review:** Ensure no two issues touch the same specific component lines concurrently to prevent contributor merge conflicts.
3. **Triage:** Ensure every generated issue is published with `status:ready` and verified links.
