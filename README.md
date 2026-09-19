<div id="top"></div>

<div align="center">

<img src="./public/brand/pact-logo.png" alt="PACT Monogram Logo" width="88" height="88" />

# PACT - Personal Operating System

**A System for Keeping Promises to Yourself.**  
*Turn Intent Into Discipline.*

<br />

[![CI](https://github.com/TheVicky1/Pact_OS/actions/workflows/ci.yml/badge.svg)](https://github.com/TheVicky1/Pact_OS/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-d4af37.svg?style=for-the-badge)](LICENSE)
[![Good First Issues](https://img.shields.io/github/issues/TheVicky1/Pact_OS/good%20first%20issue?style=for-the-badge&color=7057ff&label=Good%20First%20Issues)](https://github.com/TheVicky1/Pact_OS/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
[![First Timers Only](https://img.shields.io/badge/First--Timers--Only-Friendly-7057ff.svg?style=for-the-badge)](https://www.firsttimersonly.com/)
[![Up For Grabs](https://img.shields.io/badge/Up--For--Grabs-Listed-00b0ff.svg?style=for-the-badge)](https://up-for-grabs.net/)
[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-0e8a16.svg?style=for-the-badge)](CONTRIBUTING.md)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-050505.svg?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-050505.svg?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-050505.svg?style=for-the-badge&logo=typescript&logoColor=3178C6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-050505.svg?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-050505.svg?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.com/)

<br />

[About](#about) · [Quick Start](#quick-start) · [Contributing](#contributing) · [Core Features](#core-features) · [Architecture](#architecture) · [Documentation](#documentation)

</div>

---

<div align="center">
  <h2>About</h2>
</div>

Most productivity tools suffer from **passive accumulation**—tasks, habits, and aspirational goals are recorded with enthusiasm, then quietly neglected when friction strikes.

**Intent is easy. Execution is difficult.**

**PACT** is an open-source **Personal Operating System (OS)** built with **Next.js 16**, **React 19**, **TypeScript 5**, **Tailwind CSS v4**, and **Supabase PostgreSQL** to bridge the critical divide between intention and action. Rather than functioning as a passive checklist, PACT provides an active governance system unifying time-blocked planning, strategic milestone tracking, deep work focus sessions, integer-cents financial cash flow, and unbreakable accountability contracts.

### Foundational Principles

1. **Unbreakable Accountability**: Commitments are bound to explicit deadlines, confidential consequences, and strict resolution workflows.
2. **Temporal Truth**: Time-blocked planning with bi-directional Google Calendar synchronization guarantees realistic daily execution capacity.
3. **Objective Proof Verification**: Automated external connectors validate technical proof-of-work via GitHub, LeetCode, and Codeforces.
4. **Holistic Governance**: Single unified operational system for tasks, strategic goals, scoped projects, recurring routines, deep work focus, and financial cash flow.
5. **Open Source & Beginner Friendly**: Designed as a welcoming hub for first-time open-source contributors with single-file micro-issues, zero-database local setup, and fast-track PR reviews.

---

<div align="center">
  <h2>Quick Start</h2>
</div>

### Prerequisites

- **Node.js**: `v20.x` (LTS recommended)
- **Package Manager**: `npm` (v10+)
- **Git**: Installed and configured

### Local Setup

```bash
# 1. Clone your fork or the repository
git clone https://github.com/TheVicky1/Pact_OS.git
cd Pact_OS

# 2. Install reproducible dependencies
npm ci

# 3. Configure local environment variables
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access PACT.

### Validation & Quality Gates

Run the local verification suite prior to committing changes:

```bash
# Run ESLint check
npm run lint

# Run TypeScript type check
npm run typecheck

# Run automated domain, release, and security test matrix
npm test

# Run preflight release readiness audit
npm run release:check

# Run pre-commit secret scanner
node scratch/secret-scan.mjs

# Run documentation link verification
node scratch/check-links.mjs

# Run production build compilation
npm run build
```

### 🐳 Containerized & Staging Deployment

PACT OS includes a multi-stage production `Dockerfile` and `docker-compose.yml` for self-hosted or staging environments:

```bash
# Build and start containerized PACT OS
docker compose up -d --build

# Verify operational readiness probe
curl -I http://localhost:3000/api/health
```

> 💡 **Having setup issues?** Consult our [**Troubleshooting Guide**](docs/TROUBLESHOOTING.md) or [**Production Deployment Runbook**](docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md) for detailed environment configuration.

---

<div align="center">
  <h2>Contributing</h2>
</div>

Contributions are warmly welcomed! PACT is designed to be one of the most welcoming and beginner-friendly open-source destinations on GitHub.

> 🚀 **New to Open Source? Start with a Micro-Contribution!**
> We deliberately scope our beginner tasks into **tiny, single-file micro-contributions** (5–30 minutes of work) with exact file pointers, concrete acceptance criteria, and step-by-step guidance.
> 👉 [**Browse Live Good First Issues (28 Available)**](https://github.com/TheVicky1/Pact_OS/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) &nbsp;|&nbsp; 📖 [**Read the Beginner's Guide**](docs/CONTRIBUTING-BEGINNERS.md)

### 🌟 Why Contribute to PACT OS?

- **⚡ Zero-Database Friction**: Run the full application and all **44 automated test suites** locally right away using `.env.example`—no cloud database setup required.
- **🎯 Highly Scoped Micro-Issues**: Tasks touch **one file** (max two) with zero complex business logic, no database migrations, and clear verification steps.
- **🚀 Fast Maintainer Reviews**: First-time contributor pull requests receive priority review from core maintainers (target turnaround under 48 hours).
- **🏛️ Permanent Recognition**: Every merged contribution is permanently acknowledged in [**CONTRIBUTORS.md**](CONTRIBUTORS.md) and on the [**GitHub Contributors Graph**](https://github.com/TheVicky1/Pact_OS/graphs/contributors).

### ⚡ 8-Step Contributor Quick Start

1. **Pick an Issue**: Browse open [**Good First Issues**](https://github.com/TheVicky1/Pact_OS/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).
2. **Claim It**: Leave a comment (e.g., *"I'd like to work on this!"*) so we can assign it to you.
3. **Fork & Clone**: Fork the repository and clone it to your machine (`git clone https://github.com/<your-username>/Pact_OS.git`).
4. **Create a Branch**: Create a descriptive branch (`git checkout -b fix/issue-12-typo`).
5. **Make the Change**: Edit the single specified file following the issue instructions.
6. **Verify Locally**: Run `npm run lint`, `npx tsc --noEmit`, and `node scratch/run-tests.mjs`.
7. **Open a Pull Request**: Push your branch and open a PR linking your issue (e.g., `Closes #12`).
8. **Celebrate & Iterate**: Our automated CI and maintainers will review and guide your PR to merge!

### For Complete Beginners

Start with our step-by-step [**Beginner's Contribution Guide**](docs/CONTRIBUTING-BEGINNERS.md) for a comprehensive zero-to-PR walkthrough explaining Git forks, branch setup, making changes, and opening your first pull request.

Explore our curated issues:
- 🎯 [**Live Good First Issues**](https://github.com/TheVicky1/Pact_OS/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — Filter active beginner-friendly tasks on GitHub.
- 📋 [**Curated Beginner Issues Factory**](docs/GITHUB_BEGINNER_ISSUES.md) — Canonical catalog of structured, self-contained Good First Issues across all PACT modules.
- 💬 [**Community Discussions**](docs/GITHUB_DISCUSSIONS.md) — Ask questions, share ideas, and connect with other contributors.

### Not a Beginner?

All contributions are welcome! Whether you are optimizing SQL queries, refining accessibility, expanding test coverage, or implementing integrations:
1. Review the canonical [**CONTRIBUTING.md**](CONTRIBUTING.md) developer guidelines.
2. Ensure your changes adhere to [**Conventional Commits**](docs/GIT_WORKFLOW.md).
3. Validate that all quality gates pass locally before opening a Pull Request.

### Contributor Reference

| Resource | Purpose |
| :--- | :--- |
| 📖 [**Contributing Guide**](CONTRIBUTING.md) | Standard developer workflow, code style, and PR standards |
| 🌱 [**Beginner's Guide**](docs/CONTRIBUTING-BEGINNERS.md) | Step-by-step zero-to-PR walkthrough for first-time contributors |
| 🎯 [**Beginner Issues Factory**](docs/GITHUB_BEGINNER_ISSUES.md) | 20 curated, actionable Good First Issues (#52–#71) |
| 💬 [**Discussions Guide**](docs/GITHUB_DISCUSSIONS.md) | Categories, idea lifecycles, and community forum guidelines |
| 🏷️ [**Label Taxonomy**](docs/GITHUB_LABELS.md) | Official issue classification system and difficulty tiers |
| ⚙️ [**CI Pipeline**](docs/CI_PIPELINE.md) | GitHub Actions quality gates and verification requirements |
| 🤝 [**Code of Conduct**](CODE_OF_CONDUCT.md) | Community standards and participation expectations |
| 🔒 [**Security Policy**](SECURITY.md) | Responsible disclosure of security vulnerabilities |

---

<div align="center">
  <h2>Core Features</h2>
</div>

PACT is composed of 14 integrated systems operating under a cohesive, responsive interface:

| System | Capabilities | Status |
| :--- | :--- | :--- |
| **Command Center** | Daily situational dashboard with a photorealistic 3D celestial hero, focus metrics, and universal search (`Cmd+K`). | Available |
| **Tasks & Backlog** | Priority matrix, estimated duration, scheduled times, deadline tracking, and multi-select bulk operations. | Available |
| **Planner** | Day, Week, and Month time-blocking with drag-and-drop scheduling, timezone boundary enforcement, and calendar conflict markers. | Available |
| **Goals & Milestones** | Strategic long-term intentional targets with progress tracking, associated projects, and target deadlines. | Available |
| **Projects** | Scoped deliverable containers grouping associated tasks, tracking phase completion rates and deadlines. | Available |
| **Accountability Engine** | Enforceable contracts binding tasks to confidential consequences, waiver quotas (max 2/week), and resolution workflows. | Available |
| **Deep Work Focus Timer** | Configurable interval focus engine (Pomodoro/Flow), synthesized Web Audio acoustic chimes, and deep work logs. | Available |
| **Habits & Routines** | Daily routine templates (Morning Kickoff, Evening Wind-down), completion tracking, and streak engines. | Available |
| **Finance & Cash Flow** | Integer-cents transaction ledger (`amount_cents`), recurring expense models, net cash calculations, and budget ceiling alerts. | Available |
| **Weekly Review** | 5-step guided Sunday planning ritual: Celebrate Wins, Review Metrics, Process Incompletes, Calibrate Goals, Commit Next Week. | Available |
| **Analytics & Scoring** | Quantitative follow-through scoring, task completion velocity, weekly trend comparisons, and historical breakdowns. | Available |
| **Integrations & Proofs** | Connectors for Google Calendar (OAuth bi-directional sync), GitHub (commits/PRs), LeetCode, and Codeforces. | Available |
| **Autonomous Sweeper** | Autonomous cron engine (`/api/cron/sweep-deadlines`) evaluating grace periods, expiring overdue tasks, and escalating consequences. | Available |
| **Settings & Portability** | User profile configuration, timezone management, notification channels, and complete RFC 4180 ZIP/JSON/CSV account export. | Available |

---

<div align="center">
  <h2>Visual Identity & Design Philosophy</h2>
</div>

PACT features a distinctive luxury visual language designed for calm, executive focus:

- **Obsidian Canvas Foundation**: Deep OLED Obsidian (`#050505`, `#070707`, `#090909`) eliminating interface fatigue.
- **Solid Luxury Surfaces**: Rich card surfaces (`#0C0C0F`, `#101012`) with ultra-fine specular hairline borders (`rgba(255, 255, 255, 0.06)`).
- **Restrained PACT Gold**: Warm gold accents (`#D4AF37`, `#E6C34A`) applied with surgical discipline for active states, progress indicators, and specular crescent highlights.
- **3D Celestial Planetary Hero**: Volumetric SVG radial illumination, Rayleigh atmospheric back-scatter, and razor-thin gold crescent lighting.

> For complete guidelines, typography scales, and token values, see the [Design System Specification](docs/DESIGN_SYSTEM.md).

---

<div align="center">
  <h2>Architecture</h2>
</div>

PACT enforces a strict database-first, server-authoritative architecture:

```
+-------------------------------------------------------------+
|                Client Layer (React 19 / UI)                 |
|  - Obsidian Theme Tokens    - 3D Celestial Planetary Hero   |
|  - Accessible Dialogs       - URL State Sync (useUrlState)  |
+-------------------------------------------------------------+
                               |
                  Server Actions & API Routes
                               |
+-------------------------------------------------------------+
|              Domain Business Logic (src/lib/)               |
|  - Accountability Engine     - Focus Session Engine         |
|  - Financial Arithmetic      - Habits & Streak Engine       |
|  - External Proof Sweeper    - Analytics Matrix             |
+-------------------------------------------------------------+
                               |
                  Supabase SSR Database Client
                               |
+-------------------------------------------------------------+
|                 Database Layer (PostgreSQL)                 |
|  - Row Level Security (RLS) on 100% of User Tables          |
|  - Confidential Consequence Masking                         |
|  - Autonomous pg_cron Deadline Sweeper Engine               |
+-------------------------------------------------------------+
```

> For deep architectural details, see the [Architecture Guide](docs/ARCHITECTURE.md) and [Data Model Specification](docs/DATA_MODEL.md).

---

<div align="center">
  <h2>Project Structure</h2>
</div>

```text
Pact_OS/
├── .github/                   # Workflows (CI, audit), issue templates, Dependabot config
├── src/
│   ├── app/                   # Next.js 16 App Router pages & API routes
│   │   ├── (auth)/            # Landing, login, and registration screens
│   │   ├── app/               # Authenticated Core OS routes (planner, goals, tasks, etc.)
│   │   └── api/               # Cron sweeper & data export API endpoints
│   ├── components/            # Reusable UI primitives (buttons, modals, cards)
│   ├── features/              # Feature modules (dashboard, calendar, habits, review)
│   ├── hooks/                 # Custom React hooks (useUrlState, useSelection)
│   ├── lib/                   # Core domain business logic and calculation engines
│   └── types/                 # TypeScript domain schemas and contracts
├── supabase/                  # PostgreSQL schema migrations and RLS security policies
├── tests/                     # Automated domain and security test suites
├── docs/                      # Comprehensive technical & product documentation
└── scratch/                   # Test runner, secret scanner, and validation scripts
```

---

<div align="center">
  <h2>Technology Stack</h2>
</div>

- **Frontend Framework**: [Next.js 16](https://nextjs.org/) (App Router, React Server Components, Server Actions) & [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS Design Tokens
- **Motion & Icons**: [Framer Motion](https://www.framer.com/motion/) & [Lucide React](https://lucide.dev/)
- **Database & Auth**: [Supabase](https://supabase.com/) PostgreSQL with Row Level Security (RLS) & SSR Cookie Auth (`@supabase/ssr`)
- **Data Validation**: [Zod](https://zod.dev/) Schemas for all Server Actions and API payloads
- **Audio Engine**: Native Web Audio API synthesis (zero external audio dependencies)

---

<div align="center">
  <h2>Documentation</h2>
</div>

Comprehensive technical specifications, system architectures, and operational runbooks are maintained in [`docs/`](docs/README.md):

| Document | Purpose |
| :--- | :--- |
| 🌱 [**Beginner Contributing**](docs/CONTRIBUTING-BEGINNERS.md) | Step-by-step zero-to-PR guide for first-time contributors |
| 🎯 [**Curated Beginner Issues**](docs/GITHUB_BEGINNER_ISSUES.md) | Factory of 20 fully specified Good First Issues (#52–#71) across all PACT modules |
| 🏭 [**Issue Factory Architecture**](docs/GITHUB_ISSUE_FACTORY.md) | 15-part issue specification, SEO discovery rules & domain vocabulary |
| 💬 [**Community Discussions**](docs/GITHUB_DISCUSSIONS.md) | GitHub Discussions categories, ideas lifecycle, and contributor journey |
| 🏷️ [**GitHub Labels**](docs/GITHUB_LABELS.md) | Canonical issue classification, difficulty levels & composition |
| 🤖 [**Automation & Bot Architecture**](docs/GITHUB_AUTOMATION.md) | Event-driven triage bot, security model & lifecycle policies |
| 🌐 [**GitHub Metadata**](docs/GITHUB_METADATA.md) | Canonical repository description, topics taxonomy & social preview |
| 🔧 [**Troubleshooting**](docs/TROUBLESHOOTING.md) | Practical fixes for common setup, build, and Git roadblocks |
| 🌟 [**Master Documentation**](docs/PACT_MASTER_DOCUMENTATION.md) | Central comprehensive technical and product reference |
| 📖 [**Product Vision**](docs/PRODUCT.md) | Vision, dual taglines, product philosophy, and core principles |
| 📋 [**Feature Inventory**](docs/FEATURES.md) | Authoritative inventory of all 14 core product modules |
| 🏗️ [**Architecture**](docs/ARCHITECTURE.md) | Next.js 16 App Router architecture, server boundaries, and data flow |
| 🗄️ [**Data Model**](docs/DATA_MODEL.md) | Relational entity schemas, constraints, indexes, and RLS policies |
| 🔌 [**Integrations**](docs/INTEGRATIONS.md) | Google Calendar, GitHub, LeetCode, and Codeforces connectors |
| 🔒 [**Security Architecture**](docs/SECURITY.md) | 28-point security matrix, zero-trust validation, and secret sanitization |
| 🛡️ [**Threat Model**](docs/THREAT_MODEL.md) | Threat actor matrix, attack surfaces, and defense-in-depth mitigations |
| 💻 [**Developer Guide**](docs/DEVELOPMENT.md) | Local environment setup, database migrations, and development commands |
| 🧪 [**Testing Strategy**](docs/TESTING.md) | Automated test matrix and verification runbooks |
| ⚙️ [**CI Pipeline**](docs/CI_PIPELINE.md) | GitHub Actions automated quality gates, secret scans & test matrix |
| 🛡️ [**Dependency Security**](docs/DEPENDENCY_SECURITY.md) | Dependency health, supply-chain hygiene & vulnerability policy |
| 📦 [**Release Management**](docs/RELEASE_MANAGEMENT.md) | Semantic Versioning policy, Keep a Changelog governance, and release checklists |
| 🌿 [**Git Workflow**](docs/GIT_WORKFLOW.md) | Conventional Commits, branch hygiene, and pre-commit safety rules |
| 🗺️ [**Product Roadmap**](docs/ROADMAP.md) | Verified implementation status and future planned milestones |
| 🎨 [**Design System**](docs/DESIGN_SYSTEM.md) | Luxury Obsidian & Gold palette, 3D celestial planetary hero, and design tokens |
| 🔄 [**User Flows**](docs/USER_FLOWS.md) | Domain hierarchy flow, daily planning, and consequence lifecycle |
| 🚀 [**Deployment Runbook**](docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md) | Production cloud deployment guide and environment configuration |

---

<div align="center">
  <h2>Open Source & Contributing</h2>
</div>

PACT OS is free, open-source software built by developers who value intentionality, focus, and high-craft software engineering. We actively welcome contributions from developers, writers, designers, and students of all experience levels!

### 🌱 Quick Links for Contributors:
- 📖 [**Contributing Guide**](CONTRIBUTING.md) — Comprehensive workflow, branching, and PR policies
- 🚀 [**Beginner's Contribution Guide**](docs/CONTRIBUTING-BEGINNERS.md) — Step-by-step zero-to-PR walkthrough
- 🎯 [**Curated Good First Issues**](docs/GITHUB_BEGINNER_ISSUES.md) — 20 self-contained, validated micro-tasks (5–30 min)
- 🏷️ [**Label Taxonomy**](docs/GITHUB_LABELS.md) — Standardized 12-label open-source taxonomy
- 🔧 [**Troubleshooting Guide**](docs/TROUBLESHOOTING.md) — Solutions for common setup and build issues
- 💬 [**Community Discussions**](https://github.com/TheVicky1/Pact_OS/discussions) — Feature ideas, Q&A, and project showcases

---

<div align="center">
  <h2>Contributors & Community</h2>
</div>

PACT is built with care by an open-source community dedicated to personal mastery, high-integrity engineering, and intentional productivity.

<div align="center">

[![Contributors](https://img.shields.io/github/contributors/TheVicky1/Pact_OS?style=for-the-badge&color=d4af37)](https://github.com/TheVicky1/Pact_OS/graphs/contributors)

*A huge thank you to everyone who has contributed to PACT OS!*

👉 [**View all contributors on GitHub**](https://github.com/TheVicky1/Pact_OS/graphs/contributors) • [**Contributors Hall of Fame**](CONTRIBUTORS.md)

</div>

---

<div align="center">
  <h2>License</h2>
</div>

PACT is open-source software licensed under the [MIT License](LICENSE).

---

<div align="center">

**Plan. Track. Improve. Repeat.**

[⬆ Back to top](#top)

</div>
