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

## 3. Canonical 15-Part Issue Specification

Every issue generated for PACT's backlog or community onboarding MUST adhere to the following 15-part anatomical structure:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. Search-Optimized Title                                                       │
│ 2. Concise Problem Statement                                                    │
│ 3. Why This Issue Matters (Domain & User Impact)                                │
│ 4. Exact Expected Behavior                                                      │
│ 5. Implementation Hints & Architecture Pointers                                 │
│ 6. Files & Areas Involved                                                       │
│ 7. Acceptance Criteria Checklist                                                │
│ 8. Testing Requirements                                                         │
│ 9. Difficulty Level                                                             │
│ 10. Estimated Effort (Time Window)                                              │
│ 11. Prerequisites & Environment Setup                                           │
│ 12. Canonical Labels                                                            │
│ 13. Step-by-Step Contribution Instructions                                      │
│ 14. Related Documentation Links                                                 │
│ 15. Good First Issue Suitability Assessment                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Canonical Issue Template Example

Below is the standard reference implementation demonstrating how all 15 components compose into a production-grade GitHub issue:

```markdown
### 1. Title
`feat(planner): add keyboard shortcuts for time-block navigation in daily timeline`

### 2. Problem Statement
Users navigating the daily planner timeline currently rely exclusively on mouse pointer clicks to select and move between scheduled time blocks. This interrupts fast keyboard-driven productivity workflows for power users.

### 3. Why This Issue Matters
PACT is designed for hyper-focused, low-friction productivity. Enabling standard keyboard navigation (such as `j`/`k` or `ArrowUp`/`ArrowDown` for block selection and `Enter` to open block details) makes the planner accessible, fast, and compliant with power-user ergonomics.

### 4. Expected Behavior
- Pressing `j` or `ArrowDown` selects the next sequential time block on the daily timeline.
- Pressing `k` or `ArrowUp` selects the previous time block.
- Pressing `Enter` opens the task details drawer for the selected block.
- Pressing `Escape` deselects the active block.
- Shortcuts are automatically disabled when typing inside input or textarea elements.

### 5. Implementation Hints & Architecture Pointers
- Hook into the existing keyboard listener pattern located in `src/hooks/use-hotkeys.ts` (or create a localized event listener in the timeline container).
- Ensure the selected time block maintains an active state index in the planner store (`src/features/planner/`).
- Use `data-selected="true"` and apply the design system focus ring token (`ring-2 ring-primary`).

### 6. Files & Areas Involved
- `src/features/planner/components/timeline-grid.tsx` (Timeline container and DOM focus management)
- `src/features/planner/components/time-block-card.tsx` (Card styling and active state props)
- `src/features/planner/hooks/use-timeline-navigation.ts` (Navigation logic hook)

### 7. Acceptance Criteria
- [ ] Arrow navigation moves focus between time blocks sequentially.
- [ ] Keyboard events do not fire when active element is an input, select, or textarea.
- [ ] ARIA attributes (`aria-selected="true"`, `tabindex="0"`) update accurately on the DOM elements.
- [ ] Full keyboard navigation is demonstrated without mouse input.

### 8. Testing Requirements
- Unit test in `tests/features/planner/use-timeline-navigation.test.ts` covering boundary navigation (first/last block).
- Run full test suite: `node scratch/run-tests.mjs`.
- Lint and typecheck: `npx eslint src/` and `npx tsc --noEmit`.

### 9. Difficulty
`difficulty:beginner`

### 10. Estimated Effort
`time:30-60m`

### 11. Prerequisites
- Node.js 20.x
- Local repository clone with `npm ci` completed
- Basic understanding of React hooks and keyboard event listeners

### 12. Canonical Labels
`type:feature`, `area:planning`, `difficulty:beginner`, `time:30-60m`, `good first issue`, `status:ready`

### 13. Step-by-Step Contribution Instructions
1. Fork and clone the repository.
2. Create your branch: `git checkout -b feat/planner-keyboard-nav`.
3. Follow the setup instructions in [CONTRIBUTING.md](../CONTRIBUTING.md).
4. Implement the hook and connect it to `timeline-grid.tsx`.
5. Verify code quality with `npm run build` and `node scratch/run-tests.mjs`.
6. Submit a Pull Request linking this issue: `Closes #<issue_number>`.

### 14. Related Documentation
- [Planner Architecture Guide](../docs/ARCHITECTURE.md)
- [Design System Keyboard & Focus Guidelines](../docs/DESIGN_SYSTEM.md)
- [Contributor Onboarding Walkthrough](../docs/CONTRIBUTING-BEGINNERS.md)

### 15. Good First Issue Suitability
**Suitability: YES (100%)** — The component is localized to the frontend UI layer, does not require Supabase schema changes or network requests, and has clear input/output behavior easily verified in the browser.
```

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
