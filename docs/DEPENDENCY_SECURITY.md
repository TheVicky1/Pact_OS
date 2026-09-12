# PACT — Dependency Health, Security Auditing & Supply-Chain Policy

This document establishes the canonical policy, verification tooling, ecosystem compatibility matrix, and operational runbooks for **dependency management, vulnerability auditing, and supply-chain hygiene** in the PACT Personal Operating System.

---

## 1. Purpose & Core Philosophy

As a high-integrity Personal Operating System handling confidential commitments, financial transactions, and cryptographic proofs, PACT maintains a strict zero-trust stance toward external supply-chain dependencies:

- **Minimal Surface Area**: Dependencies are introduced only when standard platform APIs and native JavaScript/TypeScript runtimes cannot achieve the architectural goal.
- **Deterministic Reproducibility**: Builds must be 100% reproducible across local contributor workstations and remote CI environments via strict lockfile enforcement (`npm ci`).
- **Ecosystem Coherence**: Meta-framework-bound dependencies (Next.js, ESLint, TypeScript, and React) must be upgraded as a coordinated ecosystem rather than independently across breaking major boundaries.
- **Early Vulnerability Detection**: Automated scanners detect known Common Vulnerabilities and Exposures (CVEs) before code reaches production branches.
- **Transparent Upgrade Lifecycle**: Dependency upgrades are treated as intentional architectural changes, never automated blindly without review.

---

## 2. Verified Toolchain Baseline & Ecosystem Interdependence

The PACT frontend and backend systems rely on a tightly coupled ecosystem centered around **Next.js 16 (Turbopack)** and **Node.js 20.x LTS**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               NEXT.JS 16 ECOSYSTEM BASELINE                            │
│                                                                                        │
│   ┌─────────────────────┐             ┌─────────────────────┐                          │
│   │   Next.js 16.3.4    │ ──────────> │   React / DOM 19    │                          │
│   └──────────┬──────────┘             └─────────────────────┘                          │
│              │                                                                         │
│              ▼                                                                         │
│   ┌─────────────────────┐                                                              │
│   │ eslint-config-next  │ ── bundles ──> ┌──────────────────────────────────────────┐ │
│   │       16.3.4        │                │ • typescript-eslint ^8.46.0               │ │
│   └──────────┬──────────┘                │ • eslint-plugin-react ^7.37.0             │ │
│              │                           │ • eslint-plugin-import ^2.32.0            │ │
│              │                           │ • eslint-plugin-jsx-a11y ^6.10.0          │ │
│              │                           └────────────────────┬─────────────────────┘ │
│              │                                                │                        │
│              ▼                                                ▼                        │
│   ┌─────────────────────┐                      ┌─────────────────────┐                 │
│   │    ESLint ^9.x      │                      │   TypeScript ^5.x   │                 │
│   │  (Active: 9.39.5)   │                      │  (Active: 5.9.3)    │                 │
│   └─────────────────────┘                      └─────────────────────┘                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Ecosystem Coupling Rules:

1. **ESLint 9 vs. ESLint 10 Compatibility:**
   - `eslint-config-next@16.3.4` depends on `eslint-plugin-react` (`peerDependencies.eslint: "^8 || ^9"`), `eslint-plugin-import` (`peerDependencies.eslint: "^8 || ^9"`), and `eslint-plugin-jsx-a11y` (`peerDependencies.eslint: "^8 || ^9"`).
   - Furthermore, ESLint 10 removes legacy `context.getFilename()` APIs used internally by Next.js lint rules.
   - **Policy:** ESLint MUST remain on `^9` until Next.js officially releases an ESLint 10-compatible version of `eslint-config-next`.

2. **TypeScript 5 vs. TypeScript 7 Compatibility:**
   - `eslint-config-next@16.3.4` and `typescript-eslint@8.x` restrict TypeScript peer compatibility to `typescript: ">=4.8.4 <6.1.0"`.
   - TypeScript 7 is a breaking major upgrade unsupported by current AST parsers and Next.js Turbopack compiler plugins.
   - **Policy:** TypeScript MUST remain on `^5` until upstream `typescript-eslint` and Next.js support TypeScript 7.

3. **Node.js LTS Runtime vs. `@types/node`:**
   - PACT targets **Node.js 20.x LTS** in CI (`.github/workflows/ci.yml`) and production hosting.
   - Upgrading `@types/node` to `26.x` introduces unsupported type definitions and API signatures.
   - **Policy:** `@types/node` MUST remain on `^20` to match the target runtime engine.

---

## 3. Dependency Architecture & Classification

PACT tracks third-party packages exclusively through the official npm registry across two canonical manifests:

```
Pact_OS/
├── package.json         # Declares direct production and development dependencies with semver ranges
└── package-lock.json    # Exact dependency tree, resolved sub-dependencies, integrity hashes, and versions (lockfileVersion: 3)
```

| Layer | Purpose | Packages | Security & Upgrade Policy |
| :--- | :--- | :--- | :--- |
| **Production Runtime** (`dependencies`) | Required for runtime execution in the browser and Next.js server runtime. | `next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `lucide-react`, `framer-motion` | 0 high/critical vulnerabilities. Minor/patch updates automatically grouped and validated. |
| **Development & Tooling** (`devDependencies`) | Used strictly during build, typechecking, linting, testing, and CI verification. | `typescript`, `tailwindcss`, `@tailwindcss/postcss`, `eslint`, `eslint-config-next`, `pg`, `@types/*` | Isolated from client bundles. Major updates on framework-bound tools are governed by ecosystem readiness. |

---

## 4. Local Audit & Health Commands

Contributors and maintainers can verify dependency health locally using the following canonical commands:

```bash
# 1. Clean, lockfile-safe dependency installation
npm ci

# 2. Comprehensive automated dependency health and lockfile synchronization check
node scratch/check-dependency-health.mjs

# 3. Standard npm security vulnerability audit
npm audit

# 4. Strict high-severity threshold audit (fails on high or critical vulnerabilities)
npm audit --audit-level=high

# 5. Machine-readable audit report
npm audit --json
```

---

## 5. Vulnerability Severity & CI Quality Gate Policy

PACT evaluates dependency vulnerabilities according to CVSS severity ratings. Our automated CI quality gates enforce the following deterministic policy:

```
┌─────────────────┐     ┌────────────────────────────────────────────────────────┐     ┌──────────────┐
│  VULNERABILITY  │     │                       CI ACTION                        │     │  RESOLUTION  │
│    SEVERITY     │     │                                                        │     │  TIMEFRAME   │
├─────────────────┼────────────────────────────────────────────────────────┼──────────────┤
│ 🚨 CRITICAL     │ ✖ HARD BLOCK — Pipeline immediately fails. PR blocked.   │ Immediate    │
│ 🛑 HIGH         │ ✖ HARD BLOCK — Pipeline immediately fails. PR blocked.   │ < 48 Hours   │
│ ⚠️ MODERATE     │ ℹ WARNING — Logged in audit reports; requires triage.   │ Next Minor   │
│ 💡 LOW / INFO   │ ℹ INFORMATIONAL — Evaluated during routine reviews.      │ Scheduled    │
└─────────────────┘     └────────────────────────────────────────────────────────┘     └──────────────┘
```

### Policy Rules
1. **Zero Tolerance for High/Critical**: No PR or release will be merged if `npm audit --audit-level=high` or `scratch/check-dependency-health.mjs` reports unresolved High or Critical vulnerabilities.
2. **Lockfile Desynchronization**: Any mismatch between `package.json` and `package-lock.json` triggers an immediate CI failure.
3. **No Unreachable Blind Fixes**: Vulnerability remediation must be tested against the actual application test matrix (`node scratch/run-tests.mjs`) to prevent regressions.

---

## 6. Dependabot Automated Update Strategy

PACT uses GitHub Dependabot to provide continuous, non-intrusive monitoring of third-party package updates.

### Configuration (`.github/dependabot.yml`)

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "06:00"
      timezone: "UTC"
    open-pull-requests-limit: 10
    target-branch: "main"
    labels:
      - "type:security"
      - "area:developer-experience"
    commit-message:
      prefix: "chore"
      prefix-development: "chore"
      include: "scope"
    ignore:
      - dependency-name: "eslint"
        update-types:
          - "version-update:semver-major"
      - dependency-name: "typescript"
        update-types:
          - "version-update:semver-major"
      - dependency-name: "@types/node"
        update-types:
          - "version-update:semver-major"
    groups:
      production-dependencies:
        dependency-type: "production"
        update-types:
          - "minor"
          - "patch"
      development-dependencies:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"
```

### Governance Rationale
1. **Grouped Minor & Patch Updates**: Compatible patch and minor updates are grouped into consolidated PRs for `production-dependencies` and `development-dependencies` to eliminate noise.
2. **Explicit Major Ignore Rules**: Prevents Dependabot from opening recurring, un-mergeable PRs for `eslint@10`, `typescript@7`, and `@types/node@26` until maintainers intentionally unlock them after upstream meta-framework support is released.
3. **Security Updates Unrestricted**: Security patches and vulnerability updates are never ignored and receive highest priority.

---

## 7. Dependabot PR Triage & Assessment Matrix

| Dependabot PR | Target Package(s) | Update Type | Architectural Assessment & Resolution |
| :--- | :--- | :--- | :--- |
| **PR #6** | `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react` | Minor / Patch Group | ✅ **Approved for Merge.** Compatible with Next.js 16 and all quality gates pass. |
| **PR #7** | `@types/node` (20 → 26) | Semver Major | ❌ **Closed.** Node 26 types conflict with PACT's Node 20 LTS target runtime. |
| **PR #8** | `eslint` (9.39.5 → 10.10.0) | Semver Major | ❌ **Closed.** Breaking change incompatible with `eslint-config-next@16.3.4`. Deferred. |
| **PR #9** | `typescript` (5.9.3 → 7.0.2) | Semver Major | ❌ **Closed.** Incompatible with `typescript-eslint@8.x` peer constraint (`<6.1.0`). Deferred. |

---

## 8. Safe Dependency Update Workflow

Maintainers and contributors must follow this 9-step workflow when updating dependencies or addressing security advisories:

```
┌────────────────────────────────────────┐
│ 1. Inspect Advisory or Release Notes   │
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│ 2. Check Peer Dependency Constraints   │
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│ 3. Update Minimal Target in package.json
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│ 4. Run npm install & Check Lockfile Diff
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│ 5. Execute Local Verification Suite    │
│    - node scratch/check-dependency-health.mjs
│    - npx eslint src/                   │
│    - npx tsc --noEmit                  │
│    - node scratch/run-tests.mjs        │
│    - npm run build                     │
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│ 6. Open PR, CI Passes & Maintainer Merge
└────────────────────────────────────────┘
```

---

## 9. Supply-Chain Security Principles

To protect PACT against supply-chain attacks, typo-squatting, and dependency hijacking:

1. **Lockfile Immutability**: All CI workflows use `npm ci` rather than `npm install` to guarantee strict lockfile compliance.
2. **Zero Wildcard Versions**: Package versions must specify bounded semver ranges; wildcards (`*`) and `latest` tags are prohibited.
3. **Zero Embedded Secrets**: Package scripts and configuration files must never reference or print environment variables, API tokens, or private keys.
4. **Trusted Provenance**: Only well-established, actively maintained packages with verifiable source repositories are accepted into the PACT architecture.
5. **Pruning Dead Dependencies**: Unused packages must be removed immediately rather than maintained as technical debt.
