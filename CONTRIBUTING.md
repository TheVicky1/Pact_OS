# Contributing to PACT

Thank you for your interest in contributing to **PACT**!

PACT is an open-source **Personal Operating System (OS)** engineered to turn intent into discipline. We are building a high-integrity, production-grade system that unifies time-blocked planning, strategic goals, projects, deep work focus, financial discipline, and unbreakable accountability contracts.

We warmly welcome contributions from everyone—whether you are a first-time open-source contributor, a student, a frontend or backend developer, a TypeScript specialist, a UI/UX designer, an accessibility advocate, a technical writer, a tester, a security researcher, or an experienced software engineer.

Every meaningful contribution helps make PACT more reliable, accessible, and empowering for everyone.

> [!TIP]
> **First time contributing to open source?**  
> Check out our step-by-step [**Beginner's Contribution Guide**](docs/CONTRIBUTING-BEGINNERS.md) for a zero-to-PR onboarding tutorial. If you encounter any environment or Git hiccups, consult our [**Troubleshooting Guide**](docs/TROUBLESHOOTING.md).

---

## Table of Contents

1. [Contribution Philosophy](#1-contribution-philosophy)
2. [Who Can Contribute?](#2-who-can-contribute)
3. [Contribution Taxonomy](#3-contribution-taxonomy)
4. [Before Starting Work](#4-before-starting-work)
5. [Issue Claiming & Assignment Policy](#5-issue-claiming--assignment-policy)
6. [Branching Strategy](#6-branching-strategy)
7. [Commit Message Conventions](#7-commit-message-conventions)
8. [The Issue → Branch → PR Lifecycle](#8-the-issue--branch--pr-lifecycle)
9. [Pull Request Policy](#9-pull-request-policy)
10. [Engineering & Code Quality Standards](#10-engineering--code-quality-standards)
11. [UI/UX & Visual Contribution Standards](#11-uiux--visual-contribution-standards)
12. [Accessibility (a11y) Baseline](#12-accessibility-a11y-baseline)
13. [Dependency Management Policy](#13-dependency-management-policy)
14. [Database & Supabase Policy](#14-database--supabase-policy)
15. [Documentation Standards](#15-documentation-standards)
16. [Clean Working Tree & Generated Files](#16-clean-working-tree--generated-files)
17. [Testing & Local Validation Protocol](#17-testing--local-validation-protocol)
18. [Security Guidelines & Zero Secret Policy](#18-security-guidelines--zero-secret-policy)
19. [Review Process & Collaboration](#19-review-process--collaboration)
20. [Maintainer Rights & Project Governance](#20-maintainer-rights--project-governance)
21. [Contributor Responsibilities](#21-contributor-responsibilities)
22. [Contributor Recognition](#22-contributor-recognition)
23. [Support & Help Channels](#23-support--help-channels)
24. [Pre-Submission Checklist](#24-pre-submission-checklist)

---

## 1. Contribution Philosophy

PACT balances two core values:

1. **Beginner Accessibility**: Providing transparent, welcoming on-ramps and clear guidance so contributors of all experience levels can participate effectively.
2. **Maintainer-Grade Engineering Discipline**: Upholding rigorous standards for type safety, security boundaries, domain math precision, and visual cohesion.

We do not sacrifice engineering quality for beginner friendliness, nor do we make the contribution process unnecessarily complex.

### Core Principles
- **Small & Focused**: A small, well-tested, high-quality contribution is always preferred over a large, unfocused pull request.
- **Architectural Respect**: Respect existing system boundaries (e.g., server-authoritative authentication, integer-cents financial arithmetic, timezone-safe date math).
- **Scope Discipline**: Solve the specific problem outlined in the issue. Avoid bundling unrelated formatting or incidental refactors.

---

## 2. Who Can Contribute?

Coding is only one of many ways to contribute to PACT. We actively welcome:

- **First-Time Contributors & Students**: Learn open-source practices with accessible beginner issues.
- **Frontend & TypeScript Developers**: Refine React 19 components, custom hooks, and Tailwind CSS v4 styling.
- **Backend & Database Engineers**: Optimize Supabase queries, PostgreSQL schemas, and Server Actions.
- **UI/UX & Product Designers**: Polish micro-interactions, layout ergonomics, and visual hierarchy.
- **Technical Writers**: Clarify setup instructions, fix inaccuracies, and expand architectural documentation.
- **Quality Assurance & Testers**: Add unit tests, test edge cases, and discover reproducible defects.
- **Accessibility Advocates**: Enhance keyboard navigation, ARIA semantics, screen reader support, and color contrast.
- **Security Researchers**: Audit RLS policies, credential handling, and API endpoints (via [SECURITY.md](SECURITY.md)).

---

## 3. Contribution Taxonomy

To establish a clear shared vocabulary across issues and pull requests, PACT classifies contributions into ten distinct categories:

| Type | Focus Area | Description |
| :--- | :--- | :--- |
| 🌱 **Documentation** | `docs` | Guides, API specs, setup tutorials, typos, and architecture diagrams. |
| 🐛 **Bug Fix** | `fix` | Resolving reproducible functional defects and broken state transitions. |
| 🎨 **UI/UX** | `ui` / `style` | Visual polish, layout ergonomics, animations, and design system fidelity. |
| ♿ **Accessibility** | `a11y` | ARIA labeling, keyboard navigation, focus visible states, and contrast. |
| 🧪 **Testing** | `test` | Unit tests, state-machine validation, edge cases, and test harness utilities. |
| ⚡ **Performance** | `perf` | Bundle optimization, query efficiency, render optimizations, and latency reduction. |
| 🧹 **Code Quality** | `refactor` | Non-functional refactoring, dead code pruning, and type safety hardening. |
| 🔌 **Integrations** | `feat` / `fix` | External proof-of-work connectors (GitHub, LeetCode, Codeforces, Google Calendar). |
| ✨ **Feature** | `feat` | New functionality aligned with the roadmap and approved by maintainers. |
| 🔐 **Security** | `security` | Hardening RLS policies, input sanitization, and credential protection. |

*(For complete label definitions, difficulty levels, and composition guidelines, consult our authoritative [**GitHub Label Taxonomy**](docs/GITHUB_LABELS.md)).*

---

## 4. Before Starting Work

To prevent duplicate effort and ensure your time is spent effectively:

1. **Search Existing Issues & PRs**: Check [GitHub Issues](https://github.com/TheVicky1/Pact_OS/issues) and [Pull Requests](https://github.com/TheVicky1/Pact_OS/pulls) to verify no one is already addressing the issue.
2. **Read the Full Issue Description**: Review all acceptance criteria, technical context, and reproduction steps.
3. **Ask for Clarification**: If requirements or edge cases are ambiguous, leave a comment on the issue before writing code.
4. **Align on Substantial Changes**: Do not start large feature additions or major architectural refactors without prior discussion and maintainer alignment.

---

## 5. Issue Claiming & Assignment Policy

PACT uses a structured issue assignment workflow to keep progress transparent:

### Current Manual Assignment Flow
1. **Express Interest**: Comment on the relevant issue stating that you would like to work on it (e.g., *"I'd like to work on this issue. Please assign it to me."*).
2. **Maintainer Confirmation**: A maintainer will assign the issue to you. Once assigned, you have exclusive ownership to work on that issue.
3. **Single Issue at a Time**: To ensure opportunities remain open for all community members, please work on one issue at a time.
4. **Communication & Handoff**: If you encounter unexpected roadblocks or can no longer continue, post a brief comment so maintainers can reopen the issue for another contributor.
5. **Inactive Work**: Assignments represent active, ongoing progress. If an assigned issue receives no updates or activity, maintainers reserve the right to unassign and reopen the issue.

> [!NOTE]
> **Evolution of Issue Assignment**: In a future infrastructure phase (Phase 14), PACT plans to introduce automated issue claiming and stale assignment management. Until then, all assignments and check-ins are handled manually by project maintainers.

---

## 6. Branching Strategy

All contributors must work on dedicated topic branches created from the latest `upstream/main`. Never commit directly to `main`.

### Branch Workflow
```bash
# 1. Synchronize local main with upstream
git checkout main
git pull upstream main

# 2. Create a focused topic branch
git checkout -b <prefix>/<short-description>
```

### Branch Naming Prefixes
Choose a branch prefix matching your contribution category:

- `feat/focus-session-sound-toggle` (New features or enhancements)
- `fix/calendar-timezone-rollover` (Bug fixes)
- `docs/contributor-policy-update` (Documentation improvements)
- `ui/dashboard-metric-hover-polish` (UI visual styling & ergonomics)
- `a11y/modal-focus-trap-enhancement` (Accessibility improvements)
- `test/finance-cents-overflow-matrix` (Automated testing additions)
- `refactor/clean-date-helpers` (Code quality & structural refactoring)
- `perf/bundle-tree-shaking` (Performance optimizations)

Keep each branch dedicated to a single logical change.

---

## 7. Commit Message Conventions

PACT enforces **Conventional Commits** (`type(scope): description`) to ensure clean history, readable change logs, and automated release compatibility.

### Format
```
<type>(<scope>): <short description in present tense>
```

### Allowed Commit Types
- `feat`: A new feature or product capability
- `fix`: A bug fix
- `docs`: Documentation-only changes
- `ui` / `style`: Visual styling, layout, or cosmetic adjustments
- `refactor`: Code changes that neither fix a bug nor add a feature
- `test`: Adding or correcting tests
- `perf`: Performance improvements
- `chore`: Maintenance tasks, repo config, or tooling updates
- `security`: Security patches or RLS policy hardening

### Common Repository Scopes
`auth`, `planner`, `tasks`, `habits`, `focus`, `finance`, `accountability`, `reviews`, `integrations`, `ui`, `a11y`, `docs`, `security`, `config`.

### Examples
- `feat(focus): add audio chime toggle to session preferences`
- `fix(planner): resolve timezone offset calculation during midnight rollover`
- `docs(contributing): formalize contribution policy and standards`
- `ui(dashboard): refine card border contrast and hover transitions`
- `test(accountability): add unit tests for grace period penalty resolution`
- `security(rls): harden profile table update policy`

### Anti-Patterns to Avoid
❌ `git commit -m "update"`  
❌ `git commit -m "fixes and stuff"`  
❌ `git commit -m "WIP"`  
❌ `git commit -m "asdf final"`  

Write concise, descriptive messages explaining **what** changed and **why**.

---

## 8. The Issue → Branch → PR Lifecycle

Every contribution follows a structured eight-step lifecycle:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   1. ISSUE   │ ──> │  2. BRANCH   │ ──> │ 3. IMPLEMENTATION│ ──> │  4. VALIDATION   │
│ Find & Claim │     │ Topic Branch │     │ Clean Code / Doc │     │ Lint, TSC, Tests │
└──────────────┘     └──────────────┘     └──────────────────┘     └──────────────────┘
                                                                             │
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐               ▼
│   8. MERGE   │ <── │  7. REVIEW   │ <── │ 6. PULL REQUEST  │ <── ┌──────────────────┐
│   Ship It!   │     │ Maintainers  │     │ Describe & Link  │     │ 5. COMMIT & PUSH │
└──────────────┘     └──────────────┘     └──────────────────┘     │   Conventional   │
                                                                   └──────────────────┘
```

### Linking Issues in Pull Requests
Always link the relevant issue in your PR description using standard GitHub keywords:
- `Closes #123` (for new features or completed tasks)
- `Fixes #123` (for bug fixes)
- `Related to #123` (for partial progress or related discussions)

---

## 9. Pull Request Policy

A high-quality pull request is focused, descriptive, and easy to review:

### PR Requirements
1. **Single Responsibility**: Address one issue or logical change per PR. Avoid bundling unrelated fixes.
2. **Follow the PR Template**: Complete all applicable sections in PACT's standard [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
3. **Clear Title & Summary**: Use Conventional Commit format for the PR title and clearly summarize what changed and why.
4. **Issue Linking**: Reference the target issue (`Closes #...` or `Fixes #...`).
5. **Validation Evidence**: Disclose which tests and validation scripts you ran locally.
6. **Visual Proof**: For UI changes, include clear before-and-after screenshots or recordings.
7. **PR Size Guidelines**:
   - **Preferred**: Small to medium PRs (< 300 lines of code change).
   - **Caution**: Large PRs (> 500 lines) take significantly longer to review and require prior maintainer alignment.

---

## 10. Engineering & Code Quality Standards

PACT maintains high standards for TypeScript correctness and architectural integrity. When writing application code:

- **Strict TypeScript**: Never use `any`. Define explicit domain interfaces or reuse existing types from `src/types/`.
- **Server-Authoritative Security**: User identity and state transitions must be verified on the server via `supabase.auth.getUser()`. Never trust client-supplied `user_id` values.
- **Input Validation**: All Server Action mutations must validate payload boundaries using Zod schemas (`src/lib/validations/`).
- **Financial Arithmetic**: Never use floating-point numbers for currency. All monetary amounts must be calculated and stored in integer cents (`amount_cents`).
- **Timezone Safety**: Use `src/lib/time.ts` utilities for date and calendar math to respect the user's profile timezone.
- **Fail-Safe Integration Calls**: External API requests (GitHub, LeetCode, Codeforces) must catch errors gracefully and transition to retry states rather than crashing the application.
- **Component Modularity**: Keep React components focused, reusable, and cleanly separated between UI presentation and domain logic.

For deeper technical specifics, review:
- [**Architecture Guide**](docs/ARCHITECTURE.md)
- [**Data Model Specification**](docs/DATA_MODEL.md)
- [**Development Guide**](docs/DEVELOPMENT.md)

---

## 11. UI/UX & Visual Contribution Standards

PACT features a distinctive luxury aesthetic characterized by deep obsidian surfaces, celestial motifs, and restrained metallic gold accents.

### Visual Palette & Tokens
- **Canvas**: Deep Obsidian Black (`#050505`, `#070707`, `#090909`).
- **Surfaces**: Solid luxury card surfaces (`#0C0C0F`, `#101012`) with subtle borders (`rgba(255, 255, 255, 0.06)`).
- **Accent**: Restrained PACT Gold (`#D4AF37`, `#E6C34A`) used intentionally for primary CTAs, active states, and streak highlights.
- **Typography**: Crisp Warm White (`#F5F5F5`) for headings and prominent numerals; Zinc secondary (`#8B8B92`, `#71717A`) for labels and body copy.

### Design Rules
- ❌ **No Random Accent Colors**: Do NOT introduce arbitrary purple, blue, cyan, or neon gradients unless explicitly authorized by a design system update.
- 📐 **Card Geometry**: Standardize on `rounded-2xl` for primary containers and `rounded-xl` for interactive elements.
- 🔍 **Visual Verification**: Always verify that UI changes adapt gracefully across mobile (`375px`), tablet (`768px`), and desktop (`1280px+`) viewports.

Refer to [**Design System & UI Tokens**](docs/DESIGN_SYSTEM.md) for full token definitions.

---

## 12. Accessibility (a11y) Baseline

PACT is committed to building an accessible operating system. All interface contributions must adhere to these baseline practices:

- **Semantic Elements**: Use proper HTML5 semantic tags (`<main>`, `<nav>`, `<section>`, `<article>`, `<button>`, `<input>`).
- **Keyboard Navigation**: Ensure all interactive controls are reachable and operable via the `Tab`, `Enter`, and `Space` keys.
- **Visible Focus States**: Preserve and enhance distinct `focus-visible` styling on all focusable elements.
- **Color Contrast**: Maintain minimum WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text and UI components).
- **Accessible Labeling**: Provide descriptive `aria-label` or `aria-labelledby` attributes for icon-only buttons.
- **Media & Images**: Provide meaningful `alt` text for informational images; use empty `alt=""` for purely decorative graphics.
- **No Color-Only Cues**: Never use color alone to communicate state, warnings, or errors (pair color with text or icons).

---

## 13. Dependency Management Policy

PACT maintains a lean, secure, and performant dependency tree.

### Criteria Before Proposing New Dependencies
Before adding any package to `package.json`, ask:
1. **Necessity**: Can this problem be cleanly solved using modern native Web APIs, React 19 features, or existing utilities?
2. **Maintenance**: Is the library actively maintained, well-documented, and backed by a healthy community?
3. **Bundle Impact**: Does the package bloat client-side bundle size?
4. **License Compatibility**: Is the license compatible with PACT's MIT License?
5. **Security Risk**: Does the library introduce excessive transitive dependencies or known vulnerabilities?

Maintainers reserve the right to decline PRs that introduce unnecessary heavy dependencies.

---

## 14. Database & Supabase Policy

Database schemas, constraints, and Row Level Security (RLS) policies are critical to PACT's data integrity:

- **Ordered Migrations**: All schema modifications must be committed as sequentially numbered SQL files in `supabase/migrations/`.
- **Zero-Trust RLS**: Every table must have RLS enabled with explicit `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies tied to `auth.uid()`.
- **No Destructive Operations**: Migrations must avoid destructive `DROP TABLE` or column removals on active production data without backward-compatible transition phases.
- **Lifecycle Triggers**: State transition constraints (e.g., deadline sweeping, penalty waiving) should be enforced via database triggers and audited.

Reference [**Data Model Documentation**](docs/DATA_MODEL.md) and [**Security Guide**](docs/SECURITY.md) before proposing database modifications.

---

## 15. Documentation Standards

High-quality documentation is treated with the same importance as production code:

- **Accuracy**: Ensure instructions, paths, and commands reflect current, verified repository behavior.
- **Truthful Infrastructure**: Never document future automated tools, unreleased bots, or non-existent CI checks as currently available.
- **Code Examples**: Provide complete, copy-pasteable code examples where applicable.
- **Cross-Reference Hygiene**: When adding or renaming documentation files, update all relevant references in [**`docs/README.md`**](docs/README.md) and the root [**`README.md`**](README.md).

---

## 16. Clean Working Tree & Generated Files

To keep PR diffs clean and prevent accidental leaks:

- **Never Commit Environment Files**: `.env`, `.env.local`, and `.env.production` must remain untracked.
- **No Build Artifacts**: Ensure `.next/`, `out/`, `dist/`, and coverage outputs are never committed.
- **No Editor Noise**: Avoid committing personal IDE configs (`.vscode/`, `.idea/`) unless intentionally updating shared workspace settings.
- **Lockfile Hygiene**: Avoid unnecessary `package-lock.json` churn caused by unrelated npm commands. Only modify lockfiles when package dependencies are intentionally added or updated.

---

## 17. Testing & Local Validation Protocol

Before opening a pull request, execute the local validation suite. All 56 authoritative domain and security tests run in a completely offline environment without requiring live Supabase or Stripe credentials:

```bash
# 1. Code style & linting check
npm run lint

# 2. Strict TypeScript type check
npx tsc --noEmit

# 3. Run all 56 authoritative domain test suites
npm test
# (or: node scratch/run-tests.mjs)

# 4. Run a single targeted test suite during development
npm run test:file -- tests/habit-completion-service.test.ts

# 5. Zero-secret leak audit
node scratch/secret-scan.mjs

# 6. Production build verification
npm run build
```

> [!IMPORTANT]
> Documentation-only pull requests do not require running the full production build, but contributors should always ensure markdown formatting and relative links are verified (`node scratch/check-links.mjs`). Disclose what validation was performed in your PR summary.

---

## 18. Security Guidelines & Zero Secret Policy

> [!CAUTION]
> **ZERO SECRET POLICY**: API keys, OAuth client secrets, database passwords, private keys, service role tokens, and live credentials must **NEVER** be committed to Git.

- Run `node scratch/secret-scan.mjs` before committing changes.
- If you accidentally commit a secret, **revoke the credential immediately** at the provider dashboard and notify maintainers.
- **Vulnerability Disclosure**: If you discover a security vulnerability, please report it privately according to our [**Security Policy**](SECURITY.md). Do **not** open a public issue.

---

## 19. Review Process & Collaboration

Code review at PACT is a constructive, collaborative learning process:

1. **Submission**: You open a pull request adhering to the guidelines above.
2. **Maintainer Review**: A maintainer will review your code for functionality, architecture alignment, security, and styling.
3. **Feedback & Iteration**: Requested changes are a normal part of open-source development. Maintainers will explain the reasoning behind requested adjustments.
4. **Updating Your PR**: Push additional commits to your topic branch to address feedback; the PR updates automatically.
5. **Approval & Merge**: Once all checks pass and approvals are granted, a maintainer will merge your contribution.

---

## 20. Maintainer Rights & Project Governance

To ensure the long-term health, security, and architectural coherence of PACT, maintainers retain the responsibility and authority to:

- Request technical or visual adjustments before merging.
- Close duplicate, spam, or out-of-scope issues and PRs.
- Redirect discussions to appropriate forums or issues.
- Reassign or reopen inactive issues where work has stalled.
- Adjust issue labels, milestones, and project board priorities.
- Determine release timing and architectural roadmap progression.

All governance actions will be conducted respectfully and transparently in accordance with our community standards.

---

## 21. Contributor Responsibilities

As a contributor to PACT, you agree to:

- Communicate respectfully and adhere to our [**Code of Conduct**](CODE_OF_CONDUCT.md).
- Keep pull requests focused on their stated objective.
- Test your changes locally before requesting review.
- Respond constructively to review feedback and questions.
- Promptly communicate if you are unable to finish an assigned issue.
- Safeguard credentials and protect user privacy.

---

## 22. Contributor Recognition

Every merged contribution matters! Every developer who contributes code, tests, documentation, or design to PACT OS is permanently acknowledged:

- 🏛️ Listed in our [**Contributors Hall of Fame**](CONTRIBUTORS.md).
- 🌟 Recognized on the official [**GitHub Contributors Graph**](https://github.com/TheVicky1/Pact_OS/graphs/contributors).
- 🚀 Acknowledged in release changelogs for key milestones.

*(PACT is an open-source project and does not offer monetary compensation for contributions unless explicitly organized through official bounty programs).*

---

## 23. Support & Help Channels

Need assistance, clarification, or guidance during your contribution journey?

- 📖 **Beginner Guide**: [docs/CONTRIBUTING-BEGINNERS.md](docs/CONTRIBUTING-BEGINNERS.md)
- 🎯 **Curated Beginner Issues**: [docs/GITHUB_BEGINNER_ISSUES.md](docs/GITHUB_BEGINNER_ISSUES.md)
- 💬 **Community Discussions**: [docs/GITHUB_DISCUSSIONS.md](docs/GITHUB_DISCUSSIONS.md) & [GitHub Discussions](https://github.com/TheVicky1/Pact_OS/discussions)
- 🏷️ **Label Taxonomy**: [docs/GITHUB_LABELS.md](docs/GITHUB_LABELS.md)
- 🔧 **Troubleshooting**: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- 💬 **Support Guide**: [SUPPORT.md](SUPPORT.md)
- 📚 **Full Documentation**: [docs/README.md](docs/README.md)
- 🛡️ **Security Inquiries**: [SECURITY.md](SECURITY.md)

---

## 24. Pre-Submission Checklist

Before submitting your pull request, please verify:

- [ ] I have read and followed this [**Contributing Guide**](CONTRIBUTING.md).
- [ ] My branch is created from and up to date with `upstream/main` (or designated community branch).
- [ ] My code adheres to TypeScript strictness and domain architecture rules.
- [ ] For UI changes, I have adhered to the luxury Obsidian/Gold design system and tested responsiveness.
- [ ] `npm run lint` passes with 0 errors.
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `npm test` passes all 56 authoritative automated test suites.
- [ ] `node scratch/secret-scan.mjs` confirms 0 committed secrets.
- [ ] `npm run build` succeeds without build failures.
- [ ] My pull request references the issue it addresses (e.g., `Closes #123` or `Fixes #123`).
- [ ] I have included screenshots or screen recordings for any visual changes.
