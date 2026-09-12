# Changelog

All notable changes to the **PACT Personal Operating System** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Containerization & Deployment Readiness**: Added production multi-stage `Dockerfile`, `.dockerignore`, and `docker-compose.yml` for self-hosted and staging deployments.
- **Operational Health & Readiness Endpoint**: Implemented safe `/api/health` HTTP GET/HEAD route with uptime probes and zero credential leakage guarantees.
- **Release Automation Workflow**: Added `.github/workflows/release.yml` with automated release preflight audit and test verification.
- **Privacy & Release Engineering Test Suites**: Added `tests/health-endpoint.test.ts`, `tests/release-engineering.test.ts`, and `tests/privacy-guarantees.test.ts`.
- **Automated CI Quality Gates**: Complete 7-stage GitHub Actions pipeline enforcing clean installs, secret scanning, link integrity, ESLint, TypeScript, domain test matrix, and production Next.js builds ([#10](https://github.com/TheVicky1/Pact_OS/pull/10)).
- **Supply-Chain & Dependency Security**: Weekly automated Dependabot updates, CVSS severity policy, and dedicated `dependency-audit.yml` workflow ([#11](https://github.com/TheVicky1/Pact_OS/pull/11)).
- **Release Management & Versioning System**: Semantic versioning specification, Conventional Commit standards, Keep-a-Changelog foundation, and read-only release readiness checker (`scratch/release-check.mjs`).
- **Community & Contributor Infrastructure**: GitHub Discussions setup, 40 curated beginner issues, issue and PR templates, and unified label taxonomy.
- **Documentation Architecture**: Added `CI_PIPELINE.md`, `DEPENDENCY_SECURITY.md`, `RELEASE_MANAGEMENT.md`, and complete onboarding guides in `docs/`.

### Changed
- Refactored ESLint configuration to modern flat config format with 0-error CI guarantees.
- Sanitized secret scanning utilities to output safe metadata without exposing credential snippets in logs.
- Updated documentation tree, index, and navigation tables to provide unified technical specifications.

### Fixed
- Relative link resolution discrepancies across root and nested markdown documentation.
- Tracked verification and diagnostic scripts in `scratch/` for reproducible CI execution.

### Security
- Zero-secret scanning baseline verified across all tracked files.
- Zero CVE supply-chain audit baseline verified across 467 resolved dependencies.

---

## [0.1.0] - 2026-09-12

### Initial Open-Source Baseline
- Initial open-source architecture foundation, Core OS modules, Supabase database migrations, Row Level Security policies, luxury obsidian visual system, and 35 authoritative domain test suites.
