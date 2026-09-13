# PACT — Git Workflow & Secret Prevention Rules

## 1. Version Control Discipline [CONFIRMED]

Git discipline is strictly enforced across all repository operations:

### Pre-Flight Inspection Rule
Before executing any commit or modification, developers and automated tools MUST inspect repository state:
```bash
git status
git branch
git remote -v
```

- Never assume the working directory is clean.
- Never commit directly to `main`; always create a dedicated topic branch.
- Never overwrite or delete existing work without explicit instruction.

---

## 2. Branch Naming Standards [CONFIRMED]

Topic branches should be created from the active development baseline (`upstream/main` or designated release/community branch) and use descriptive prefix naming:

- `feat/<issue-number>-<short-description>`: New capabilities or functional enhancements (e.g., `feat/105-focus-session-sound-toggle`)
- `fix/<issue-number>-<short-description>`: Bug fixes and defect remediation (e.g., `fix/108-calendar-timezone-rollover`)
- `docs/<issue-number>-<short-description>`: Documentation updates and guides (e.g., `docs/101-money-calculation-example`)
- `ui/<issue-number>-<short-description>`: Visual styling and design system refinements (e.g., `ui/102-finance-badge-contrast`)
- `a11y/<issue-number>-<short-description>`: Accessibility improvements and ARIA labels (e.g., `a11y/103-modal-close-label`)
- `test/<issue-number>-<short-description>`: Test additions or harness improvements (e.g., `test/104-leap-year-boundary`)
- `refactor/<issue-number>-<short-description>`: Code restructuring without functional alterations (e.g., `refactor/106-clean-date-helpers`)
- `chore/<issue-number>-<short-description>`: Tooling, dependency, or maintenance updates (e.g., `chore/107-package-scripts`)

---

## 3. Commit Message Standards [CONFIRMED]

All commits follow the **Conventional Commits** format (`type(scope): description`):

- `feat(scope)`: New feature implementation (e.g., `feat(auth): establish authentication foundation`)
- `fix(scope)`: Bug fix (e.g., `fix(tasks): prevent deadline completion race condition`)
- `docs(scope)`: Documentation updates (e.g., `docs(contributing): formalize contribution policy and standards`)
- `ui(scope)` / `style(scope)`: Visual styling and layout adjustments (e.g., `ui(dashboard): refine card border contrast`)
- `a11y(scope)`: Accessibility enhancements (e.g., `a11y(ui): label modal close button`)
- `test(scope)`: Addition of tests or test harness updates (e.g., `test(security): add cross-user RLS tests`)
- `refactor(scope)`: Code restructuring without feature changes (e.g., `refactor(finance): simplify ledger balance accumulator`)
- `perf(scope)`: Performance optimizations (e.g., `perf(calendar): memoize event collision detector`)
- `chore(scope)`: Maintenance, tooling, or repository configuration (e.g., `chore(deps): audit dependencies`)
- `security(scope)`: Security hardening or RLS policy updates (e.g., `security(rls): harden profile table update policy`)

### Recommended Scope Reference
| Scope | Subsystem Covered | Target Directory |
| :--- | :--- | :--- |
| `core` | Shared domain logic, arithmetic, time utilities | `src/lib/`, `src/types/` |
| `dashboard` | Main OS overview, widgets, quick actions | `src/features/dashboard/` |
| `planner` | Daily planner, timeline, energy blocks | `src/features/planner/` |
| `tasks` | Task backlog, filters, modal forms | `src/features/tasks/` |
| `goals` | OKR hierarchy, milestones, status tracking | `src/features/goals/` |
| `projects` | Project boards, deliverables | `src/features/projects/` |
| `habits` | Habit recurrence, routines, streak calculation | `src/features/habits/` |
| `focus` | Deep work timer, audio synthesis presets | `src/features/focus/` |
| `finance` | Integer-cents transactions, budgets, ledger | `src/features/finance/` |
| `review` | Weekly review rituals, retrospectives | `src/features/weekly-review/` |
| `ui` | Shared design system components | `src/components/ui/` |
| `a11y` | Screen reader, focus rings, keyboard traps | `src/lib/a11y/`, `src/components/ui/` |
| `docs` | Documentation guides, specifications, README | `docs/`, `*.md` |
| `testing` | Test matrix, mock harnesses, fixtures | `tests/`, `scratch/` |

---

## 4. Secret Management & Prevention Protocol [CONFIRMED]

> [!CAUTION]
> **ZERO SECRET POLICY**: API keys, OAuth secrets, database passwords, private keys, JWT secrets, and `.env` files must NEVER be committed to Git under any circumstance.

### Mandatory `.gitignore` Standards
The `.gitignore` file MUST include at minimum:
```gitignore
# Environment files
.env
.env*.local
.env.production
.env.development

# Node dependencies & builds
node_modules/
.next/
out/
dist/
build/

# IDE & OS files
.DS_Store
Thumbs.db
.vscode/
.idea/
```

### Pre-Milestone Secret Scan Protocol
Before completing any major project milestone or opening a pull request, run a secret check:
```bash
node scratch/secret-scan.mjs
```

1. Automated check scans for keywords: `API_KEY`, `SECRET`, `PASSWORD`, `PRIVATE_KEY`, `BEARER`, `SUPABASE_SERVICE_ROLE_KEY`.
2. Inspect `git status` to verify no unignored credential files exist.
3. If a secret is detected: **STOP IMMEDIATELY**, revoke the compromised key on the provider platform, report the incident clearly, and remove it from Git history using `git filter-repo` or BFG Repo-Cleaner. NEVER print exposed secrets into logs or documentation.
