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
- Never overwrite or delete existing work without explicit instruction.

---

## 2. Commit Message Standards [CONFIRMED]

All commits follow **Conventional Commits** format:

- `feat(scope)`: New feature implementation (e.g., `feat(auth): establish authentication foundation`)
- `fix(scope)`: Bug fix (e.g., `fix(tasks): prevent deadline completion race condition`)
- `test(security)`: Addition of security or attack tests (e.g., `test(security): add cross-user RLS tests`)
- `docs(scope)`: Documentation updates (e.g., `docs(architecture): define timezone safety strategy`)
- `refactor(scope)`: Code restructuring without feature changes

---

## 3. Secret Management & Prevention Protocol [CONFIRMED]

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
Before completing any major project milestone or releasing a pull request, run a secret check:
1. Search for keywords: `API_KEY`, `SECRET`, `PASSWORD`, `PRIVATE_KEY`, `BEARER`, `SUPABASE_SERVICE_ROLE_KEY`.
2. Inspect `git status` to verify no unignored credential files exist.
3. If a secret is detected: **STOP IMMEDIATELY**, revoke the compromised key on the provider platform, report the incident clearly, and remove it from Git history using `git filter-repo` or BFG Repo-Cleaner. NEVER print exposed secrets into logs or documentation.
