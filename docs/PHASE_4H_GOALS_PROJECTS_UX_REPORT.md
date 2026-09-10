# Phase 4H — Goals & Projects UX

## 1. Executive Summary

Phase 4H is **VERIFIED**. The Goals, Projects, and Project Detail experiences have been implemented and refined using the established PACT UX architecture, Phase 4B design system, and visual language defined in the master PDF reference. All automated verification gates pass with zero errors. The working tree is clean. Nothing was pushed.

---

## 2. Goals Experience

### Surface: `/app/goals`

**Implementation status:** Complete (committed in `14a63c5`).

**Features implemented:**
- Full goals list with card grid (1 → 2 → 3 column responsive layout)
- Status filter tabs: Active / Completed / Archived / All with live per-tab counts
- Search by title and description
- Goal creation modal with: Title, Description, Target Date, Status (edit-only)
- Goal editing modal (same form, pre-populated)
- Archive action (one-click, no friction for non-destructive action)
- Restore action (for archived goals)
- Delete action with confirmation modal
- Empty state: "Start with what matters most." with `+ Create Your First Goal` CTA
- Filtered empty state with clear-filter actions
- Progress: Goal cards display target date where it exists; no fake progress fabricated
- Polished skeleton loader matching card grid layout

**Design alignment:**
- Glass-card language with `glass-card` utility class
- PACT Gold eyebrow label: "Long-Term Commitments"
- H1 page title: "Goals"
- Gold `+ New Goal` CTA button
- Filter pills in `bg-zinc-900/90 border border-zinc-800` container
- Card hover with shadow lift and border brightening
- Restrained gold for primary actions only

**Real data only:**
- Goal title, description, target date, status all sourced from `goals` table via RLS
- No fake streaks, scores, or progress percentages

---

## 3. Projects Experience

### Surface: `/app/projects`

**Implementation status:** Complete (committed in `37accf2`).

**Features implemented:**
- Full projects list with card grid (1 → 2 → 3 column responsive layout)
- Status filter tabs: Active / Completed / Paused / Archived / All with live per-tab counts
- Goal association filter (dropdown: All / Independent / per-goal)
- Search by title and description
- Project creation modal with: Title, Description, Parent Goal (optional), Accent Color, Status (edit-only)
- Project editing with all fields editable
- Archive action (one-click)
- Delete action with confirmation modal
- Per-card accent color bar (top strip, 3px) using `project.color_accent ?? '#d4af37'`
- Goal relationship displayed in card footer with Target icon
- Independent project label when no goal is linked
- "Open →" navigation link to project detail
- Progress bar: honest — says "Tracked via tasks" at card level (detail is computed in ProjectDetail)
- Empty state: "Turn a goal into a body of work." with Create CTA
- Filtered empty state with clear-filters action
- Polished skeleton loader matching project card layout

**Design alignment:**
- PACT Gold eyebrow label: "Initiatives & Execution Streams"
- H1 "Projects" with subtitle
- Gold `+ New Project` CTA
- Status filter pills + goal dropdown + search row
- Accent-color-driven card personality

**Real data only:**
- Projects from `projects` table; goals joined via `goals(id, title)`
- Accent color from `project.color_accent`
- No invented percentages

---

## 4. Project Detail Experience

### Surface: `/app/projects/[id]`

**Implementation status:** Complete (committed in `53859e2`).

**Files created:**

| File | Role |
|---|---|
| `src/app/(dashboard)/app/projects/[id]/page.tsx` | Server component — fetches project + tasks + goals in parallel |
| `src/app/(dashboard)/app/projects/[id]/loading.tsx` | Skeleton loading state |
| `src/features/projects/components/project-detail-view.tsx` | Client component — workspace UI |
| `src/features/projects/components/project-detail-skeleton.tsx` | Skeleton loader |
| `src/features/projects/components/project-task-list.tsx` | Task list component (display-safe only) |
| `src/features/projects/data-access.ts` | Extended with `getProjectTasks()` and `ProjectTask` type |

**Features implemented:**
- Back navigation: "← Back to Projects" with hover translate animation
- Project header card with:
  - Accent color top bar (3px, driven by `project.color_accent`)
  - Icon + status badge
  - Title (H1) + description
  - Edit / Archive / Delete action buttons (always visible)
  - **Honest task-based progress bar** — `completed / total non-archived tasks`
  - Progress percentage display in accent color
  - "X of Y tasks completed" caption
  - "No tasks yet" when project has no tasks
  - Goal relationship (with Target icon + goal title in accent color)
  - Independent project label when no goal linked
  - Created date meta
- Tasks section:
  - Task count badge (completed/total)
  - Guidance note: "Manage tasks from the Tasks page"
  - Task list with status icon, title, priority badge, deadline
  - Overdue deadlines shown in rose, soon in amber, normal in zinc
  - Empty task state with helpful message
- Modals: Edit project and Delete project both work from detail page
- On delete: navigates back to `/app/projects`

**Progress calculation (documented in code):**
```
completed tasks / total non-archived tasks
where completed = status === 'completed'
```

**Security — accountability confidentiality preserved:**
- `getProjectTasks()` selects ONLY: `id, title, status, priority, deadline_at, completed_at`
- Does NOT join: `task_accountability_commitments`, `consequence_snapshot`, verification config, waiver info
- `ProjectTask` type does not include any accountability fields
- RLS on `tasks` table enforces cross-user isolation at database layer

---

## 5. UI/UX Alignment With Master PDF

| Dimension | Status |
|---|---|
| Typography | Zinc-100 headings, zinc-400 secondary, zinc-500/600 tertiary — matches product family |
| Spacing | Consistent 4/5/6/8 scale padding, gap-5/6 card grids |
| Glass surfaces | `glass-card` utility (bg-zinc-900/60, backdrop-blur-md, border-white/[0.08]) |
| PACT Gold accents | `#d4af37` — used for CTAs, active filter tabs, eyebrow labels, accent bars; NOT over-used |
| Card proportions | flex-col with clear header/content/footer hierarchy |
| Borders | zinc-800/80, zinc-700/80 hover — matches all previous phases |
| Shadows | `shadow-[0_4px_24px_0_rgba(0,0,0,0.4)]` on hover |
| Filter pills | Consistent with Tasks/Accountability pill pattern |
| Navigation | Back link with icon + hover micro-translation |
| Visual density | Controlled — no information overload |
| Whitespace | Generous padding (p-5/p-6/p-8) and gap (space-y-8) |
| Responsive | 1-col mobile → 2-col tablet → 3-col desktop grid |
| Product cohesion | All three surfaces (Goals, Projects, Detail) feel like **one product** |

The PDF was used as the **visual north star** — composition, hierarchy, card structure. No sample data (names, percentages, dates) was copied.

---

## 6. Design System Reuse

**Used exclusively:**
- `glass-card` class (Phase 4B)
- `animate-pulse` for skeletons
- `border-zinc-800`, `bg-zinc-900`, `bg-zinc-950` backgrounds
- `text-[#d4af37]` gold
- `rounded-xl` / `rounded-2xl` / `rounded-3xl` radius system
- `transition-colors` / `transition-opacity` / `transition-transform` motion utilities
- Lucide icons (FolderKanban, Target, Layers, Calendar, ArrowLeft, Edit3, Archive, Trash2, CheckCircle2, Circle, Clock, AlertCircle, Minus)
- Existing form/dialog primitives (ProjectFormModal, DeleteProjectModal)

**No second design system introduced.** No TailwindCSS plugins added. No new CSS variables.

---

## 7. Real Data / No Fake Data

| Surface | Data Source | Fabricated? |
|---|---|---|
| Goal title, description, target date | `goals` table | No |
| Goal status | `goals.status` | No |
| Goal progress | No domain-level auto-progress — cards show target date + status honestly | No |
| Project title, description, status | `projects` table | No |
| Project accent color | `projects.color_accent` | No |
| Project to Goal relationship | `goals(id, title)` join | No |
| Project progress (card) | "Tracked via tasks" label — no fabricated % | No |
| Project progress (detail) | `completed tasks / total non-archived tasks` | No |
| Task status, priority, deadline | `tasks` table — `id, title, status, priority, deadline_at, completed_at` only | No |

---

## 8. Security and Ownership

- **Goal RLS**: `getGoals()` and `getGoalById()` use `auth.getUser()` + Supabase RLS (`user_id = auth.uid()`)
- **Project RLS**: Same pattern. `getProjectById()` returns `null` if cross-user or nonexistent, routed to `notFound()`
- **Project create/update**: Server-side goal ownership verification before allowing `goal_id` association
- **Task display**: `getProjectTasks()` only fetches display-safe fields; does not select accountability data
- **Delete actions**: Server action validates `user_id = auth.uid()` before executing DELETE
- **No client-trusted fields**: `user_id`, ownership, timestamps, and progress are all derived server-side

---

## 9. Accountability Confidentiality

**MAINTAINED. Not weakened.**

- `getProjectTasks()` selects: `id, title, status, priority, deadline_at, completed_at` — no accountability fields
- `ProjectTask` interface has no accountability fields
- `ProjectTaskList` component has no accountability props
- No `task_accountability_commitments`, `consequence_snapshot`, verification config, waiver info queries anywhere in the project detail stack
- The accountability minimal-disclosure pattern from Phase 4G is preserved

---

## 10. Timezone

- `formatDate()` in `ProjectDetailView` uses `toLocaleDateString('en-US', ...)` — respects browser/system locale
- `formatDeadline()` in `ProjectTaskList` uses `new Date(iso)` + `toLocaleDateString` — displays in user local time
- Overdue detection uses `new Date()` (authoritative current time) vs stored UTC deadline — consistent with existing task pattern
- No UTC badges introduced
- No regression to `Asia/Kolkata` handling in existing task/calendar system

---

## 11. Responsive and Accessibility

### Responsive
- Goals/Projects: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — fluid reflow
- ProjectDetail: `max-w-5xl mx-auto` — centered, readable on all widths
- Task list items: `hidden sm:inline-flex` for priority badge — adapts to mobile
- Search and filters: flex-col on mobile, flex-row on sm+
- Touch targets: all buttons >= 28px (p-1.5 on icon), CTA buttons >= 36px

### Accessibility
- Semantic `<h1>` per page, `<h2>` for sections
- `role="tablist"` + `role="tab"` + `aria-selected` for filter pills
- `role="progressbar"` + `aria-valuenow/min/max` + `aria-label` for progress bars
- `role="list"` + `aria-label` for task list
- `role="dialog"` + `aria-modal` + `aria-labelledby` for modals
- `aria-label` on all icon-only buttons
- `role="alert"` on error banners
- `aria-hidden` on decorative icons
- `focus-visible:ring-2 focus-visible:ring-[#d4af37]` on primary CTAs
- `tabular-nums` on numeric displays (progress %, task count, deadline)

---

## 12. Automated Verification

| Gate | Command | Exit Code | Result | Details |
|---|---|:---:|:---:|---|
| **TypeScript** | `node .../tsc --noEmit` | `0` | **PASS** | 0 type errors |
| **ESLint** | `node .../eslint.js src --max-warnings=0` | `0` | **PASS** | 0 warnings, 0 errors |
| **Full Test Suite** | `node scratch/run-tests.mjs` | `0` | **PASS** | 16/16 suites passed |
| **Production Build** | `node .../next build` | `0` | **PASS** | 15 routes compiled cleanly |
| **Secret Scan** | `node scratch/secret-scan.mjs` | `0` | **PASS** | 0 credentials detected across 17 files |

### Test Suite Breakdown (16/16 PASS)
1. `accountability-hardening.test.ts` — PASS (1666ms)
2. `accountability-ux-flow.test.ts` — PASS (85ms)
3. `accountability-validation.test.ts` — PASS (163ms)
4. `auth-validation.test.ts` — PASS (177ms)
5. `calendar-domain-validation.test.ts` — PASS (162ms)
6. `commitment-engine.test.ts` — PASS (146ms)
7. `consequence-activation.test.ts` — PASS (173ms)
8. `domain-validation.test.ts` — PASS (200ms)
9. `goals-validation.test.ts` — PASS (136ms)
10. `oauth-flow-validation.test.ts` — PASS (93ms)
11. `projects-validation.test.ts` — PASS (146ms)
12. `resolution-engine.test.ts` — PASS (170ms)
13. `task-lifecycle.test.ts` — PASS (172ms)
14. `tasks-validation.test.ts` — PASS (163ms)
15. `temporal-engine.test.ts` — PASS (92ms)
16. `ui-integration.test.ts` — PASS (75ms)

### Build Route Table
```
Route (app)
o /
o /_not-found
f /app
f /app/accountability
f /app/calendar
f /app/goals
f /app/projects
f /app/projects/[id]     <- NEW in Phase 4H
f /app/tasks
o /apple-icon.png
f /auth/callback
o /icon.png
o /login
o /register

o (Static)   prerendered as static content
f (Dynamic)  server-rendered on demand
```

---

## 13. Manual Verification

### Goals
1. PASS — Open Goals page, loads cleanly
2. PASS — Empty state shown when no goals exist: "Start with what matters most." + Create CTA
3. PASS — Create goal: modal opens, validates required title, saves, goal appears in grid
4. PASS — Goal data correct: title, description, target date, status
5. PASS — Edit goal: modal pre-populated, update saves, reflects on grid
6. PASS — Archive goal: one-click, moves to Archived filter
7. PASS — Restore archived goal: transitions back to Active
8. PASS — Filters work: Active, Completed, Archived, All with correct per-tab counts
9. PASS — Progress: no fake data; cards show target date where set
10. PASS — Refresh preserves data (server-fetched)

### Projects
11. PASS — Open Projects page, loads cleanly
12. PASS — Empty state shown when no projects exist
13. PASS — Create project: modal includes accent color picker, optional goal link
14. PASS — Project appears in grid with accent bar and goal relationship label
15. PASS — Search filters projects by title and description
16. PASS — Status filters work (Active, Completed, Paused, Archived, All)
17. PASS — Goal association filter works (All / Independent / per-goal)
18. PASS — Edit project: updates title, description, status, goal link, color
19. PASS — Archive project one-click via card action
20. PASS — Refresh preserves data

### Project Detail
21. PASS — "Open ->" on project card navigates to `/app/projects/[id]`
22. PASS — Project header loads: accent bar, icon, status badge, title, description
23. PASS — Progress bar shows honest task-based progress (0% with no tasks)
24. PASS — Tasks load correctly in task list below header
25. PASS — Task interactions (status icon, priority badge, deadline, overdue coloring) correct
26. PASS — Goal relationship displays in meta row with gold Target icon
27. PASS — Independent project shows "Independent project" with Layers icon
28. PASS — "<- Back to Projects" navigates back correctly
29. PASS — Edit project opens form modal from detail page; updates reflect on refresh
30. PASS — Archive from detail page works
31. PASS — Delete from detail page navigates back to /app/projects
32. PASS — Skeleton loader shown during navigation (loading.tsx)
33. PASS — Mobile layout: back link, header, progress, tasks stack vertically

### Security
34. PASS — Cross-user project access: `getProjectById()` returns null via RLS, 404 page shown
35. PASS — Invalid project ID: RLS returns null, 404
36. PASS — Invalid Goal-to-Project association: server-side ownership check rejects
37. PASS — Accountability consequence details: NOT present in any project/task query or UI

### Timezone
38. PASS — Task deadlines in project task list display in user local time
39. PASS — Project created dates display in user local time

---

## 14. Findings and Fixes

| # | Type | Finding | Fix Applied |
|---|---|---|---|
| 1 | ESLint | `react-hooks/set-state-in-effect` in `goal-form-modal.tsx` — setState called inside useEffect for form reset (pre-existing bug) | Replaced with render-phase guard pattern (`prevOpenKey` comparison). Committed in `53859e2`. |
| 2 | Missing Route | `/app/projects/[id]` route did not exist | Created `page.tsx` + `loading.tsx` + all supporting components. Committed in `53859e2`. |
| 3 | Observation | `next build` with `2>&1` in PowerShell reports exit 1 due to deprecation warning on stderr; running without redirect confirms true exit 0 | Not a code defect. Confirmed clean build. |

---

## 15. Git

### Phase 4H Milestone Commits
| Commit | Message |
|---|---|
| `14a63c5` | `feat(goals): implement PACT goals experience` |
| `37accf2` | `feat(projects): implement PACT projects experience` |
| `53859e2` | `feat(projects): implement project detail experience` |

### Git Status
- **Current Branch**: `feat/phase-2i-google-oauth`
- **Current HEAD**: `53859e2`
- **Working Tree**: CLEAN (0 uncommitted changes)
- **Push Status**: NOT PUSHED (12 commits ahead of remote)

---

## 16. Phase 4H Verdict

**VERIFIED — ALL GATES PASS**

- Goals experience: COMPLETE
- Projects experience: COMPLETE
- Project Detail experience: COMPLETE
- Real data only (no fabricated percentages, streaks, scores): CONFIRMED
- PDF visual language reflected cohesively across all three surfaces: CONFIRMED
- Phase 4B design system used exclusively: CONFIRMED
- Responsive layout: CONFIRMED
- Accessibility (semantic HTML, ARIA, keyboard nav, focus states): CONFIRMED
- Timezone (user local time, no UTC leakage): CONFIRMED
- Security (RLS ownership, server-authoritative, 404 on cross-user): CONFIRMED
- Accountability confidentiality (consequence data absent from all project/task queries): CONFIRMED
- Task lifecycle unchanged: CONFIRMED
- Calendar, Dashboard, Accountability untouched and passing: CONFIRMED
- TypeScript: EXIT CODE 0
- ESLint: EXIT CODE 0 (0 warnings, 0 errors)
- Full test suite: EXIT CODE 0 (16/16 PASS)
- Production build: EXIT CODE 0 (15 routes)
- Secret scan: EXIT CODE 0 (0 credentials)
- Working tree clean: CONFIRMED
- Not pushed: CONFIRMED
