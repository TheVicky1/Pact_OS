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

Topic branches must be created from `upstream/main` and use descriptive prefix naming aligned with [**CONTRIBUTING.md**](../CONTRIBUTING.md):

- `feat/<feature-name>`: New capabilities or functional enhancements (e.g., `feat/focus-session-sound-toggle`)
- `fix/<bug-name>`: Bug fixes and defect remediation (e.g., `fix/calendar-timezone-rollover`)
- `docs/<doc-name>`: Documentation updates and guides (e.g., `docs/contributor-policy-update`)
- `ui/<component-name>`: Visual styling and design system refinements (e.g., `ui/dashboard-metric-hover-polish`)
- `a11y/<feature-name>`: Accessibility improvements and ARIA labels (e.g., `a11y/modal-focus-trap-enhancement`)
- `test/<suite-name>`: Test additions or harness improvements (e.g., `test/finance-cents-overflow-matrix`)
- `refactor/<scope-name>`: Code restructuring without functional alterations (e.g., `refactor/clean-date-helpers`)
- `perf/<optimization-name>`: Latency and bundle size optimizations (e.g., `perf/bundle-tree-shaking`)

---

## 3. Commit Message Standards [CONFIRMED]

All commits follow the **Conventional Commits** format (`type(scope): description`):

- `feat(scope)`: New feature implementation (e.g., `feat(auth): establish authentication foundation`)
- `fix(scope)`: Bug fix (e.g., `fix(tasks): prevent deadline completion race condition`)
- `docs(scope)`: Documentation updates (e.g., `docs(contributing): formalize contribution policy and standards`)
- `ui(scope)` / `style(scope)`: Visual styling and layout adjustments (e.g., `ui(dashboard): refine card border contrast`)
- `test(scope)`: Addition of tests or test harness updates (e.g., `test(security): add cross-user RLS tests`)
- `refactor(scope)`: Code restructuring without feature changes (e.g., `refactor(finance): simplify ledger balance accumulator`)
- `perf(scope)`: Performance optimizations (e.g., `perf(calendar): memoize event collision detector`)
- `chore(scope)`: Maintenance, tooling, or repository configuration (e.g., `chore(deps): audit dependencies`)
- `security(scope)`: Security hardening or RLS policy updates (e.g., `security(rls): harden profile table update policy`)

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
