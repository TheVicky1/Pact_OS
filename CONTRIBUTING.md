# Contributing to PACT

Thank you for your interest in contributing to **PACT**! 

PACT is an open-source **Personal Operating System (OS)** engineered to turn intention into discipline. We are building a high-integrity, production-grade system that unifies time-blocked planning, strategic goals, projects, deep work focus, financial discipline, and unbreakable accountability contracts.

We warmly welcome contributions from everyone—whether you are a first-time open-source contributor, a beginner developer, an experienced engineer, a technical writer, or a UI/UX designer. Every meaningful contribution helps make PACT a better tool for everyone.

> 💡 **First time contributing to open source?**  
> Check out our step-by-step [**Beginner's Contribution Guide**](docs/CONTRIBUTING-BEGINNERS.md) for a zero-to-PR walkthrough, then return here for standard contributor standards.

---

## Table of Contents

1. [Before You Start](#before-you-start)
2. [Types of Contributions](#types-of-contributions)
3. [Development Environment Setup](#development-environment-setup)
4. [Branching Strategy](#branching-strategy)
5. [Commit Message Conventions](#commit-message-conventions)
6. [Submitting a Pull Request](#submitting-a-pull-request)
7. [Code Quality & Standards](#code-quality--standards)
8. [UI/UX Contribution Standards](#uiux-contribution-standards)
9. [Documentation Contributions](#documentation-contributions)
10. [Testing & Validation](#testing--validation)
11. [Security Guidelines](#security-guidelines)
12. [Code of Conduct](#code-of-conduct)
13. [Getting Help](#getting-help)
14. [Contributor Recognition](#contributor-recognition)
15. [Pre-Submission Checklist](#pre-submission-checklist)

---

## Before You Start

To ensure a smooth and productive experience:

1. **Check Existing Issues**: Before starting work on any change, search the [GitHub Issues](https://github.com/TheVicky1/Pact_OS/issues) to verify that someone else is not already working on the same problem.
2. **Look for Beginner-Friendly Issues**: If you are new to the repository, look for issues tagged with `good first issue` or `help wanted`.
3. **Claim an Issue**: Leave a comment on the issue stating that you would like to work on it. A maintainer will confirm the assignment so you can proceed with confidence.
4. **Avoid Large Unsolicited PRs**: If you plan to propose a major new feature or architectural refactor, open an issue first to discuss the concept with maintainers before writing code.

---

## Types of Contributions

You do not need to be a full-stack engineer to contribute. We value all forms of contributions:

- **Documentation**: Fixing typos, clarifying local setup guides, improving explanations, or writing walkthroughs.
- **Beginner Fixes**: Small bug fixes, error message improvements, or simple UI alignment adjustments.
- **UI/UX Polish**: Refining animations, improving layout responsiveness, or enhancing visual states within the PACT design language.
- **Accessibility (a11y)**: Adding ARIA attributes, improving keyboard navigation, or verifying contrast ratios.
- **Testing**: Adding unit tests, edge-case coverage, or state-machine validation.
- **Core Engineering**: Enhancing domain engines, optimizing database interactions, or building new platform connectors.
- **Bug Reports**: Finding reproducible bugs and documenting clear steps to reproduce them.

---

## Development Environment Setup

PACT is built with **Next.js 16 (React 19)**, **TypeScript**, **Tailwind CSS v4**, and **Supabase**.

### Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (v10+)
- **Git**: Installed and configured on your machine

### Setup Steps

1. **Fork the Repository**: Click the **Fork** button on GitHub to create your personal copy of the repository.
2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/<your-username>/Pact_OS.git
   cd Pact_OS
   ```
3. **Configure Upstream Remote**:
   ```bash
   git remote add upstream https://github.com/TheVicky1/Pact_OS.git
   ```
4. **Install Dependencies**:
   ```bash
   npm install
   ```
5. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   *Note: For offline UI and domain development, the default mock/placeholder variables in `.env.example` allow local pages and the test suite to execute.*
6. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view PACT.

---

## Branching Strategy

Always create a dedicated feature branch for your work instead of working directly on `main`:

```bash
# Ensure your local main is in sync with upstream
git checkout main
git pull upstream main

# Create a new topic branch
git checkout -b <branch-type>/<short-description>
```

### Branch Naming Conventions

- `feat/add-focus-preset` (New features or enhancements)
- `fix/calendar-modal-overflow` (Bug fixes)
- `docs/update-troubleshooting-guide` (Documentation changes)
- `ui/refine-metric-card-hover` (UI/UX visual adjustments)
- `test/add-finance-edge-cases` (Testing improvements)
- `refactor/clean-date-helpers` (Non-functional code cleanup)

---

## Commit Message Conventions

We follow a clean, consistent commit convention based on Conventional Commits:

```
<type>(<scope>): <short description in present tense>
```

### Examples

- `feat(focus): add audio chime toggle to session settings`
- `fix(planner): resolve timezone offset calculation during midnight rollover`
- `docs(readme): clarify local environment prerequisites`
- `ui(dashboard): improve hover elevation on metric cards`
- `test(accountability): add unit tests for grace period expiration`

---

## Submitting a Pull Request

When you are ready to submit your contribution:

1. **Push Your Branch**:
   ```bash
   git push -u origin <your-branch-name>
   ```
2. **Open a Pull Request**: Navigate to the [PACT repository](https://github.com/TheVicky1/Pact_OS) on GitHub and click **Compare & pull request**.
3. **Provide a Clear Title & Description**:
   - Summarize **what** changed and **why**.
   - Reference the related issue (e.g., `Closes #12` or `Fixes #45`).
   - Describe the manual or automated testing performed.
   - For UI changes, attach before/after screenshots or a short recording.
4. **Keep PRs Focused**: Avoid mixing unrelated changes into a single pull request. Smaller, focused PRs are reviewed and merged much faster.

---

## Code Quality & Standards

- **TypeScript**: Strict type checking is enabled. Avoid using `any`; define explicit interfaces or use existing types from `src/types/`.
- **Server Boundaries**: Follow the server-authoritative pattern. User identity and critical state transitions must be verified on the server.
- **Component Design**: Keep React components focused, modular, and readable.
- **Dependencies**: Avoid adding heavy external libraries when a clean, lightweight native implementation is possible.
- **Linting**: Ensure code adheres to ESLint rules without suppressing warnings unnecessarily.

---

## UI/UX Contribution Standards

PACT features a distinctive, disciplined visual identity:

- **Color Palette**: Strictly adhere to the approved luxury palette:
  - **Canvas**: Deep Obsidian Black (`#050505`, `#070707`, `#090909`).
  - **Surfaces**: Solid luxury card surfaces (`#0C0C0F`, `#101012`) with subtle borders (`rgba(255, 255, 255, 0.06)`).
  - **Accent**: Restrained PACT Gold (`#D4AF37`, `#E6C34A`).
  - **Text**: Crisp Warm White (`#F5F5F5`) for headings and numerals; neutral zinc for secondary copy.
  - *Do NOT introduce arbitrary neon colors or unapproved color schemes.*
- **Responsive Layouts**: Verify that UI components scale cleanly across desktop, tablet, and mobile breakpoints.
- **Accessibility**: Ensure high text contrast ratios (WCAG AA) and proper focus visible states.

---

## Documentation Contributions

Clear documentation is as important as code. When writing or updating documentation:

- Use clear, professional, and accessible language.
- Ensure all markdown formatting, tables, and code blocks render correctly.
- Verify that all relative links and file paths are valid.
- Avoid obsolete instructions or undocumented assumptions.

---

## Testing & Validation

Before opening a pull request, run the following verification steps locally:

1. **Lint Check**:
   ```bash
   npm run lint
   ```
2. **Type Check**:
   ```bash
   npx tsc --noEmit
   ```
3. **Domain Test Suite**:
   ```bash
   node scratch/run-tests.mjs
   ```
4. **Secret Scan**:
   ```bash
   node scratch/secret-scan.mjs
   ```
5. **Production Build**:
   ```bash
   npm run build
   ```

All checks must pass with zero errors.

---

## Security Guidelines

Security is foundational to PACT:

- **Never Commit Secrets**: Never commit API keys, service role tokens, database credentials, or `.env.local` files.
- **Responsible Disclosure**: If you discover a potential security vulnerability, do NOT open a public GitHub issue. Please follow our disclosure process outlined in [SECURITY.md](SECURITY.md).

---

## Code of Conduct

All contributors and community members are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat fellow contributors with respect, kindness, and empathy.

---

## Getting Help

If you have questions, need clarification on an issue, or run into technical roadblocks:

- Consult our [**Troubleshooting Guide**](docs/TROUBLESHOOTING.md) for solutions to common setup, build, or test issues.
- Consult [SUPPORT.md](SUPPORT.md) for available help channels.
- Check our existing documentation in [`docs/`](docs/README.md).
- Leave a comment directly on the relevant GitHub issue.

---

## Contributor Recognition

We appreciate every contribution! Contributors with accepted pull requests are recognized in [CONTRIBUTORS.md](CONTRIBUTORS.md).

---

## Pre-Submission Checklist

Before submitting your pull request, please verify:

- [ ] I have read and followed this Contributing Guide.
- [ ] My branch is created from and up to date with `upstream/main`.
- [ ] My code adheres to the project's TypeScript and styling standards.
- [ ] For UI changes, I have tested responsiveness and included screenshots.
- [ ] `npm run lint` passes with 0 errors.
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `node scratch/run-tests.mjs` passes all test suites.
- [ ] `node scratch/secret-scan.mjs` confirms 0 committed secrets.
- [ ] `npm run build` succeeds without build failures.
- [ ] My pull request references the issue it addresses.
