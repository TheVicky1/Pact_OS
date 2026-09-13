# PACT — Continuous Integration & Automated Quality Gates

This document defines the automated Continuous Integration (CI) pipeline, quality gate specifications, and local pre-submission validation runbooks for **PACT**.

---

## 1. ⚙️ Overview of CI Architecture

PACT uses [GitHub Actions](https://github.com/features/actions) to ensure that every push to `main` and every Pull Request meets strict quality, security, and architectural standards before merging.

- **Workflow File:** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
- **Execution Triggers:**
  - `push` to `main`
  - `pull_request` targeting `main`
- **Concurrency:** Automatically cancels redundant in-progress runs on branch updates (`cancel-in-progress: true`).
- **Security:** Strict least-privilege permissions (`contents: read`). Zero external network egress required for testing.

---

## 2. 🛡️ The 7 Automated Quality Gates

Every CI build executes 7 deterministic quality gates in sequence:

```text
┌────────────────────────────────────────────────────────┐
│               GitHub Actions CI Pipeline               │
│                                                        │
│  1. 📦 Clean Install (npm ci)                          │
│  2. 🔒 Zero-Secret Scan (scratch/secret-scan.mjs)       │
│  3. 🔗 Markdown Link Audit (scratch/check-links.mjs)   │
│  4. 🧹 ESLint Code Quality (npx eslint src/)           │
│  5. 🏷️ TypeScript Typecheck (npx tsc --noEmit)         │
│  6. 🧪 Domain Test Matrix (40 Suites / run-tests.mjs)  │
│  7. 🏗️ Production Build (npm run build)                │
└────────────────────────────────────────────────────────┘
```

| Step | Quality Gate | Command | Purpose & Invariants Enforced |
| :-: | :--- | :--- | :--- |
| **1** | **Clean Install** | `npm ci` | Installs exact dependency tree from `package-lock.json` with cache. |
| **2** | **Secret Scan** | `node scratch/secret-scan.mjs` | Scans all repository files to guarantee 0 leaked tokens, keys, or credentials. |
| **3** | **Link Audit** | `node scratch/check-links.mjs` | Validates 100% of relative Markdown links across all documentation. |
| **4** | **ESLint** | `npx eslint src/` | Checks code formatting, React 19 conventions, and TypeScript hygiene. |
| **5** | **Typecheck** | `npx tsc --noEmit` | Enforces 100% TypeScript strict type safety across all domain models. |
| **6** | **Test Matrix** | `node scratch/run-tests.mjs` | Executes 40 automated test suites covering deadlines, timezones, math, and RLS. |
| **7** | **Production Build** | `npm run build` | Compiles all 24 Next.js App Router routes and static pages with Turbopack. |

---

## 3. 💻 How to Run CI Quality Gates Locally

Before opening a pull request, contributors are expected to run the quality gates locally:

```bash
# 1. Verify 0 secrets
node scratch/secret-scan.mjs

# 2. Verify documentation relative links
node scratch/check-links.mjs

# 3. Verify ESLint rules
npx eslint src/

# 4. Verify TypeScript types
npx tsc --noEmit

# 5. Run full 40 test suites
node scratch/run-tests.mjs

# 6. Verify Next.js production build
npm run build
```

---

## 4. 🔧 Diagnosing & Fixing CI Failures

| Failure Type | Common Root Cause | Recommended Fix |
| :--- | :--- | :--- |
| **Secret Scan Failure** | Real API token, Supabase secret key, or personal path committed in code. | Replace with dummy placeholders or read from environment variables. |
| **Link Audit Failure** | Broken relative link in Markdown or renamed documentation file. | Check file path casing and run `node scratch/check-links.mjs`. |
| **Typecheck Failure** | TypeScript type mismatch or missing property in domain model. | Run `npx tsc --noEmit` locally to see exact error line numbers. |
| **Test Matrix Failure** | Domain invariant violation, floating-point math, or timezone drift. | Run `node scratch/run-tests.mjs` locally and inspect the failing test suite. |
| **Build Failure** | Invalid React Server Component boundary or syntax error in route. | Run `npm run build` locally to inspect Next.js compiler output. |

---

## 5. 🔗 Related Documentation
- [**Documentation Index**](./README.md)
- [**Developer Setup Guide**](./DEVELOPMENT.md)
- [**Testing Runbook**](./TESTING.md)
- [**Beginner Contribution Guide**](./CONTRIBUTING-BEGINNERS.md)
- [**Contributing Policy**](../CONTRIBUTING.md)
