# PACT — Release Management, Semantic Versioning & Changelog Specification

This document serves as the authoritative operational specification for **release engineering, semantic versioning, and changelog governance** for the PACT Personal Operating System.

---

## 1. Release Philosophy

PACT approaches software releases with the rigor of a mission-critical operating system:

- **Predictable Cadence**: Releases are published deliberately after passing all automated quality gates, security audits, and domain validation suites.
- **Strict Reproducibility**: Every release is linked to an exact, immutable Git commit and annotated tag.
- **Zero-Trust Stability**: No release candidate is approved if any automated CI gate, secret scan, or dependency audit produces a failure or unvetted warning.
- **Transparent Communication**: Contributor and user-facing changes are documented clearly using standard [Keep a Changelog](https://keepachangelog.com/) formats and [Conventional Commits](https://www.conventionalcommits.org/).

---

## 2. Semantic Versioning Policy (SemVer 2.0.0)

PACT strictly follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html). Versions are formatted as:

$$\text{v}\mathbf{MAJOR}.\mathbf{MINOR}.\mathbf{PATCH}$$

```
                       ┌──────────────────────────────────────────────┐
                       │             v MAJOR . MINOR . PATCH          │
                       └──────┬─────────────┬─────────────┬───────────┘
                              │             │             │
        Breaking Changes ─────┘             │             └───── Bug Fixes & Patches
        (Architecture/RLS/APIs)             │                    (Non-breaking, Security)
                                            │
               New Features & Capabilities ─┘
               (Backward-compatible)
```

### Version Increment Criteria

| Tier | When to Increment | Examples in PACT |
| :--- | :--- | :--- |
| **MAJOR** (`X.0.0`) | Incompatible architectural changes, breaking API modifications, database schema migrations requiring manual intervention, or breaking changes to public domain interfaces. | Major database schema redesign removing legacy columns, breaking Server Action contract changes, or deprecating core domain engines. |
| **MINOR** (`0.X.0`) | New domain features, additional proof-of-work connectors, new UI capabilities, or major performance enhancements introduced in a backward-compatible manner. | Adding a new external integration connector (e.g., Strava), introducing a new focus audio synthesizer preset, or adding a new dashboard metric. |
| **PATCH** (`0.0.X`) | Backward-compatible bug fixes, security patches, documentation updates, dependency vulnerability remediations, and visual styling refinements. | Fixing timezone midnight rollover edge cases, correcting broken doc links, resolving non-breaking CSS overflows, or updating minor dependencies. |

---

## 3. Canonical Version Source of Truth

To prevent conflicting version declarations across repository files, PACT enforces a **single canonical source of truth**:

$$\text{Canonical Version Location: } \texttt{package.json} \rightarrow \texttt{"version"}$$

```json
{
  "name": "pact-os",
  "version": "0.1.0",
  "private": true
}
```

### Invariants:
1. **No Competing Version Files**: All release scripts, CI workflows, and documentation reference the version declared in `package.json`.
2. **Lockfile Synchronization**: Running `npm install` after editing `package.json` updates `package-lock.json` in lockstep.
3. **Immutable Tag Matching**: The Git tag created during release MUST exactly equal `v` + `package.json.version` (e.g., `v0.1.0`).

---

## 4. Conventional Commits & Release Classification

PACT enforces [Conventional Commits 1.0.0](https://www.conventionalcommits.org/) for all commit messages on the `main` branch.

### Commit Format
```text
<type>(<optional-scope>): <concise description in imperative mood>

[optional body explaining rationale and context]

[optional footer(s), e.g., BREAKING CHANGE: ... or Fixes #123]
```

### Mapping Commits to Changelog & SemVer

| Commit Type | Scope / Focus | Changelog Section | SemVer Impact |
| :--- | :--- | :--- | :--- |
| `feat` | New features, domain capabilities, or UI tools | `### Added` | **MINOR** |
| `fix` | Bug fixes, state machine corrections, visual fixes | `### Fixed` | **PATCH** |
| `security` | Vulnerability patches, RLS hardening, sanitization | `### Security` | **PATCH** (or **MAJOR** if breaking) |
| `perf` | Latency reduction, bundle or query optimization | `### Changed` | **PATCH** |
| `refactor` | Code restructuring without behavioral change | `### Changed` | **PATCH** |
| `docs` | Documentation additions, spec updates, tutorials | `### Documentation` | **PATCH** |
| `chore` | Dependency bumps, CI workflow tweaks, scripts | `### Maintenance` | **PATCH** |
| `test` | Unit tests, test matrix expansion, mock updates | `### Testing` | **PATCH** |
| `BREAKING CHANGE:` | Any commit with breaking footer or `!` after type | `### Breaking Changes` | **MAJOR** |

---

## 5. Changelog Governance (`CHANGELOG.md`)

All repository changes must be documented in [`CHANGELOG.md`](../CHANGELOG.md) following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) standards.

### Changelog Structure
```markdown
# Changelog

All notable changes to PACT are documented here.

## [Unreleased]
### Added
### Changed
### Fixed
### Security

## [0.1.0] - 2026-09-12
### Initial Open-Source Baseline
```

### Governance Rules:
- **Continuous `[Unreleased]` Updates**: Contributors and maintainers add bullet points to the `[Unreleased]` section as PRs are merged.
- **Historical Immutability**: Once a release section is tagged and published, its historical text is frozen.
- **Zero Fabrication**: Releases are recorded only when they are genuinely tagged and certified.

---

## 6. Release Readiness Quality Gates

Before initiating a release, maintainers must verify that all eight quality gates pass cleanly:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PACT RELEASE READINESS CHECKLIST                      │
├─────┬───────────────────────────┬───────────────────────────────────────────┤
│ 1.  │ 🧹 Clean Working Tree     │ `git status` -> working tree clean        │
│ 2.  │ 🌿 Main Branch Sync       │ Up to date with `origin/main`             │
│ 3.  │ 🔒 Zero Secret Leakage    │ `node scratch/secret-scan.mjs` (0 secrets)│
│ 4.  │ 🔗 Markdown Link Validity │ `node scratch/check-links.mjs` (0 broken) │
│ 5.  │ 🧹 ESLint Code Quality    │ `npx eslint src/` (0 errors)              │
│ 6.  │ 🏷️ TypeScript Strictness   │ `npx tsc --noEmit` (0 type errors)        │
│ 7.  │ 🧪 Authoritative Tests    │ `node scratch/run-tests.mjs` (56/56 PASS) │
│ 8.  │ 🏗️ Next.js Production Build│ `npm run build` (24 routes compiled)     │
│ 9.  │ 🛡️ Dependency Health      │ `node scratch/check-dependency-health.mjs`│
│ 10. │ 🔍 Release Preflight Tool │ `node scratch/release-check.mjs` (PASS)   │
└─────┴───────────────────────────┴───────────────────────────────────────────┘
```

---

## 7. Step-by-Step Release Process

Maintainers follow this deterministic 8-step workflow to publish a release:

```mermaid
graph TD
    A[1. Preflight Validation: node scratch/release-check.mjs] --> B[2. Bump Version in package.json & lockfile]
    B --> C[3. Promote [Unreleased] in CHANGELOG.md to [vX.Y.Z]]
    C --> D[4. Run Full Quality Gate Suite Locally]
    D --> E[5. Commit: chore(release): prepare vX.Y.Z]
    E --> F[6. Create Annotated Git Tag: git tag -a vX.Y.Z -m 'Release vX.Y.Z']
    F --> G[7. Push Commit & Tag: git push origin main --tags]
    G --> H[8. Publish GitHub Release with Notes]
```

### Execution Commands:

```bash
# Step 1: Run release readiness audit
node scratch/release-check.mjs --dry-run

# Step 2: Update version in package.json (example: bump to 0.2.0)
npm version 0.2.0 --no-git-tag-version

# Step 3: Edit CHANGELOG.md (promote [Unreleased] to [0.2.0] - YYYY-MM-DD)

# Step 4: Validate clean build and tests
node scratch/secret-scan.mjs
node scratch/check-links.mjs
node scratch/check-dependency-health.mjs
npx eslint src/
npx tsc --noEmit
node scratch/run-tests.mjs
npm run build

# Step 5: Commit release preparation
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): prepare v0.2.0"

# Step 6: Create signed/annotated Git tag
git tag -a v0.2.0 -m "Release v0.2.0"

# Step 7: Push to remote main with tags
git push origin main --tags

# Step 8: Create GitHub Release via Web UI or GitHub CLI
```

---

## 8. Git Tag Naming Convention

All release tags in PACT must follow the canonical naming syntax:

$$\texttt{v}\mathbf{MAJOR}.\mathbf{MINOR}.\mathbf{PATCH}$$

### Examples:
- `v0.1.0` (Initial baseline)
- `v0.2.0` (Minor release with new integration connector)
- `v1.0.0` (First production-certified milestone release)

> [!CAUTION]
> Git tags are immutable references. Never delete or retag an existing release tag once pushed to `origin/main`.

---

## 9. GitHub Release Specification & Template

When publishing a GitHub Release corresponding to a Git tag, maintainers use the following structured template:

```markdown
# PACT vX.Y.Z — Release Title

## Summary
Brief summary of what this release delivers and why it matters.

## 🚀 What's New (Added)
- Summary of new capabilities and features.

## 🔄 Improvements & Changes
- Summary of refactors, UI updates, and performance optimizations.

## 🐛 Bug Fixes
- Key defects resolved.

## 🔒 Security & Supply Chain
- Security advisories, RLS improvements, or dependency updates.

## 👥 Contributors
- Recognition of community members who contributed to this release.

---
**Full Changelog**: https://github.com/TheVicky1/Pact_OS/compare/vPREVIOUS...vX.Y.Z
```

---

## 10. Rollback & Incident Recovery Protocol

If a release is found to contain a severe regression, broken state machine, or critical security defect:

1. **Tag Immutability**: Do NOT delete or force-push over the published Git tag.
2. **Immediate Triage**: Identify the root cause and whether users or database state are compromised.
3. **Hotfix Patch Release**:
   - Create a fix on a dedicated hotfix branch.
   - Increment the `PATCH` version (e.g., `v0.2.0` $\rightarrow$ `v0.2.1`).
   - Run all validation suites and merge to `main`.
   - Publish `v0.2.1` with explicit incident notes and remediation instructions.
4. **Security Advisory**: If the defect involves confidentiality or authentication bypass, publish a coordinated GitHub Security Advisory via [SECURITY.md](../SECURITY.md).
