# PACT OS — Maintainer Operational Health Dashboard
**Operational Governance, Triage Workflows & Launch Maintenance Baseline**

---

## 1. Executive Status & Release Baseline

| Attribute | Operational Value |
| :--- | :--- |
| **Current Version** | `v0.1.0` (Initial Open-Source Preview) |
| **Active Development Line** | `main` |
| **Integration Line** | `phase-6` |
| **Contributor Expansion Branch** | `community/open-source-contributor-expansion` |
| **Certified Application Baseline** | `9d83eb8` (Phase 14 Production Freeze) |
| **Supabase Migrations** | **26/26 Sequential Migrations (Frozen)** |
| **Authoritative Test Matrix** | **56/56 Test Suites (100% Pass)** |
| **Quality Gates** | **TypeScript Strict (0 errors), ESLint (0 warnings), Release Preflight (12/12 PASS)** |

---

## 2. Branch Strategy & Repository Flow

```
external contributor fork
          ↓
  branch: <category>/<issue#>-<desc>  (e.g., docs/101-money-jsdoc)
          ↓
  PR targeting `main` or `phase-6`
          ↓
  CI Validation (.github/workflows/ci.yml)
          ↓
  Maintainer Codeowner Audit (.github/CODEOWNERS)
          ↓
  Squash Merge into `main` / `phase-6`
          ↓
  Auto-close issue & recognize contributor (CONTRIBUTORS.md)
```

---

## 3. Staged Launch Issue Pool (Initial Activation)

The initial community launch activates **5 priority micro-contributions** from [`GITHUB_BEGINNER_ISSUES.md`](GITHUB_BEGINNER_ISSUES.md):

| Issue ID | Category | Target File | Description | Difficulty |
| :--- | :--- | :--- | :--- | :--- |
| **`ISSUE-101`** | Documentation | [`src/lib/money.ts`](../src/lib/money.ts) | Add JSDoc to Money formatting & parsing functions | `difficulty:beginner` |
| **`ISSUE-102`** | UI/UX | [`src/features/dashboard/components/overview-view.tsx`](../src/features/dashboard/components/overview-view.tsx) | Refine Streak Badge contrast for dark mode | `difficulty:beginner` |
| **`ISSUE-103`** | Accessibility | [`src/components/ui/keyboard-shortcuts-modal.tsx`](../src/components/ui/keyboard-shortcuts-modal.tsx) | Add ARIA label to Keyboard Shortcuts Modal Close button | `difficulty:beginner` |
| **`ISSUE-104`** | Testing | [`tests/temporal-engine.test.ts`](../tests/temporal-engine.test.ts) | Add unit tests for leap-year habit boundary calculation | `difficulty:beginner` |
| **`ISSUE-105`** | Security/Core | [`src/lib/auth/sso-engine.ts`](../src/lib/auth/sso-engine.ts) | Reject malformed domain strings in SSO validator | `difficulty:beginner` |

The remaining 15 verified micro-issues in `docs/GITHUB_BEGINNER_ISSUES.md` remain available in the catalog for staged activation as community participation grows.

---

## 4. Post-Launch Triage & Feedback Loop

### A. Bug Reports
```
BUG REPORT SUBMITTED
        ↓
Maintainer Triage (Verify reproduction steps)
        ↓
Assign Labels (`bug`, `area:*`, `difficulty:*`)
        ↓
Is it a Good First Issue?
    ├── YES ➔ Label `good first issue` & add to Beginner Issue catalog
    └── NO  ➔ Assign maintainer or `help wanted`
        ↓
Fix & Unit Test ➔ PR ➔ CI Verification ➔ Merge & Close
```

### B. Feature Requests & RFCs
```
FEATURE REQUEST SUBMITTED
        ↓
Maintainer Evaluation against PACT Core Principles:
    - Does it align with Intent into Discipline?
    - Does it preserve Server-Authoritative Commitments?
    - Does it avoid scope creep or vanity gamification?
        ↓
    ├── APPROVED ➔ Add to Discussion / Roadmap RFC
    └── DECLINED ➔ Respectfully close with architectural rationale
```

### C. Documentation & DX Feedback
```
DOCS / DX FEEDBACK
        ↓
Quick Review (Verify Markdown link & command accuracy)
        ↓
Fast-track Merge (Maintainer approval)
```

---

## 5. Protected Core Boundaries (Maintainer Invariants)

Maintainers must protect the following core architecture boundaries from unintended modifications:

1. **`supabase/migrations/`**: All 26 migrations are frozen. Schema changes require explicit migration review.
2. **PostgreSQL RLS Policies**: Row Level Security policies governing multi-tenant data access must never be bypassed.
3. **Authentication Boundaries**: Session handling, WebAuthn passkey challenges, and SSO replay protection.
4. **Financial Arithmetic**: Integer-cent calculations in `src/lib/money.ts`.
5. **Consequence Engine**: Automatic penalty calculation and accountability state transitions.

---

## 6. Maintenance Health Verification Commands

Maintainers can run the single-command preflight audit at any time to verify system health:

```bash
# Full Preflight Audit (12 Quality Gates)
node scratch/release-check.mjs

# Fast Unit Test Matrix (56 Test Suites)
node scratch/run-tests.mjs

# Zero-Secret Scan
node scratch/secret-scan.mjs

# Markdown Link Audit
node scratch/check-links.mjs
```
