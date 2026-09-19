# 🌐 PACT OS — Open-Source Directory & Aggregator Listings

This document contains the canonical, pre-formatted project descriptions and submission configurations for listing **PACT OS** across leading open-source directories and developer platforms:

1. 🌟 **Up For Grabs** (`up-for-grabs.net`)
2. 🌱 **Good First Issue Dev** (`goodfirstissue.dev`)
3. 📬 **CodeTriage** (`codetriage.com`)
4. 🚀 **First Timers Only** (`firsttimersonly.com`)

---

## 🏛️ Master Repository Elevator Pitch & Profile Copy

> Use this master copy whenever submitting **PACT OS** to open-source indices, registries, or newsletters.

```markdown
# 🛡️ PACT OS — Local-First Accountability Operating System

PACT OS is a high-performance, open-source, local-first accountability operating system built with Next.js 15, TypeScript, TailwindCSS, and Supabase. 

Engineered for individuals seeking uncompromising discipline, PACT OS integrates a Financial Discipline Engine (real-time monetary commitments & charity pledges), Focus Session Manager (Pomodoro & deep work telemetry), Habit Streak Calculator, and Zero-Telemetry Local Storage Privacy.

### ✨ Key Features
- ⚡ **Local-First Architecture**: Zero network dependency for core workflows; instant offline queue sync.
- 💸 **Financial Discipline Engine**: Real-time cents-based ledger, budget tracking, and pledge automation.
- 🎯 **Focus Engine & Pomodoro**: Dynamic timer, live activity indicator, and distraction audio traps.
- 📊 **Habit Streak & Routines**: Multi-frequency streak calculators with leap-year boundary safety.
- 🔐 **Zero-Knowledge Privacy**: Passkeys (WebAuthn), local IndexedDB caching, and zero tracking scripts.
- 🤝 **35+ Good First Issues**: Curated, single-file beginner tasks with exact local test commands.

### 🛠️ Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS, Lucide Icons
- **Backend & DB**: Supabase (PostgreSQL, RLS security), WebAuthn Passkeys
- **Testing & Quality**: Vitest, Custom Domain Validation Matrix (56 Test Suites, 100% Passing)

### 🔗 Quick Links
- 🐙 **GitHub Repository**: https://github.com/TheVicky1/Pact_OS
- 🎯 **Good First Issues Catalog**: https://github.com/TheVicky1/Pact_OS/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22
- 📘 **Beginner Contribution Guide**: https://github.com/TheVicky1/Pact_OS/blob/main/docs/CONTRIBUTING-BEGINNERS.md
```

---

## 1. 🌟 Up For Grabs Listing (`up-for-grabs.net`)

### Project YAML File (`.github/up-for-grabs.yml`)
> Created directly in `.github/up-for-grabs.yml`:

```yaml
name: PACT OS
description: An open-source, local-first accountability operating system featuring a financial discipline engine, focus timer, habit streak tracking, and zero-telemetry privacy.
projectlink: https://github.com/TheVicky1/Pact_OS
site: https://github.com/TheVicky1/Pact_OS
tags:
  - typescript
  - react
  - nextjs
  - tailwindcss
  - supabase
  - local-first
  - accountability
  - productivity
  - good-first-issue
  - beginner-friendly
  - hacktoberfest
stats:
  issue-label: "good first issue"
```

### 📤 How to Submit to Up For Grabs Index
1. Fork the official directory repository: [`up-for-grabs/up-for-grabs.net`](https://github.com/up-for-grabs/up-for-grabs.net).
2. Add a new project file `_data/projects/pact_os.yml` with the YAML content above.
3. Submit a Pull Request titled: `Add PACT OS to projects index`.

---

## 2. 🌱 Good First Issue Dev Listing (`goodfirstissue.dev`)

### Overview
[GoodFirstIssue.dev](https://goodfirstissue.dev/) automatically indexes public GitHub repositories that contain open issues with the label **`good first issue`**.

### Configuration & Search Query Link
- **Target Repository**: `TheVicky1/Pact_OS`
- **Indexed Filter**: `is:issue is:open label:"good first issue"`
- **Live Good First Issues URL**: https://goodfirstissue.dev/language/typescript?query=TheVicky1%2FPact_OS

### Summary Copy for Directory Profile
```text
PACT OS is an open-source local-first accountability operating system. We maintain 35+ single-file beginner issues (#52–#89, #91–#95) with step-by-step setup guides, local test verification commands, and dedicated maintainer mentoring.
```

---

## 3. 📬 CodeTriage Listing (`codetriage.com`)

### Overview
[CodeTriage](https://www.codetriage.com/) sends daily open issues from registered repositories to developer subscribers to help triage and resolve tasks.

### Submission Instructions
1. Visit https://www.codetriage.com/projects/new
2. Enter repository name: `TheVicky1/Pact_OS`
3. Paste the profile description below.

### CodeTriage Project Profile Description
```markdown
PACT OS is a high-performance, local-first accountability operating system written in Next.js 15, TypeScript, and Supabase. 

We actively welcome open-source triage and community contributions! Our repository features:
- 35+ Curated Good First Issues (single-file scope, 5–15 minute tasks).
- 100% Test Coverage across 56 domain validation suites.
- Friendly maintainers with fast PR review times (< 24h).
- Dedicated beginner contribution guide with step-by-step Git instructions.

Help us triage accessibility (a11y), documentation (JSDoc), and unit test coverage!
```

---

## 4. 🚀 First Timers Only Listing (`firsttimersonly.com`)

### Overview
[First Timers Only](https://www.firsttimersonly.com/) showcases repositories committed to creating a safe, welcoming environment for first-time open-source contributors.

### Submission Description & Badge Markup
Include the **First Timers Only** badge in `README.md`:

```markdown
[![First Timers Only](https://img.shields.io/badge/first--timers--only-friendly-blue.svg?style=for-the-badge)](https://www.firsttimersonly.com/)
```

### First Timers Only Directory Profile Copy
```markdown
### Why Contribute to PACT OS?

PACT OS is designed from the ground up to be the most beginner-friendly open-source project on GitHub:

1. **No Cold Starts**: Every issue includes the exact target file path (`src/...` or `tests/...`) and expected behavior.
2. **Copy-Paste Verification**: Every issue provides the exact terminal command to run tests locally (e.g. `npm run test:file -- tests/notifications.test.ts`).
3. **Guaranteed Support**: Maintainers assign issues upon request and review PRs within 24 hours.
4. **No Complex Setups**: All beginner tasks are single-file additions with zero database or backend configuration required.
```
