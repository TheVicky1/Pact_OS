# Changelog

All notable changes to the **PACT Personal Operating System** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Local-First Entity Cache & Deterministic Conflict Engine**: Client-side durable entity cache supporting storage tiering (IndexedDB with localStorage fallback), version increment tracking, Last-Write-Wins (LWW) conflict detection, and strict server-authoritative consequence protection (`src/lib/offline/local-cache.ts`, `src/lib/offline/conflict-engine.ts`).
- **WebAuthn / Passkey Passwordless Security**: FIDO2 / WebAuthn Level 3 biometric authentication with cryptographically random challenges, 5-minute TTL, single-use replay protection, origin/RP verification, and PostgreSQL RLS on `passkey_credentials` (`src/lib/auth/passkeys.ts`, `src/lib/validations/passkeys.ts`, `src/features/auth/passkey-actions.ts`).
- **Security Settings & Passkey UX**: Passkey registration, device naming, credential revocation, and biometric sign-in button in UnifiedAuthCard (`src/features/settings/components/security-settings-card.tsx`, `src/components/auth/unified-auth-card.tsx`).
- **PWA Foundation & Service Worker**: Installable Progressive Web App with v2 manifest, standalone display, shortcuts, and static app-shell caching with zero private data leakage guarantees.
- **Offline Quick Capture & Durable Sync Engine**: Client-side offline queue persistence with RFC 4122 UUID v4, deterministic idempotency keys, and exponential backoff synchronization.
- **Mobile Live Focus Activity & Screen Wake Lock**: Cross-platform Live Activity contracts for iOS Dynamic Island / Lock Screen widgets and Android Ongoing notifications, plus Screen Wake Lock and Web Notification completion alerts.
- **Mobile Device Registration & Push Architecture**: Zod schema for device token registration and push notification formatting with strict consequence masking confidentiality.
- **Staging & Deployment Smoke Validation**: Added `tests/staging-smoke-validation.test.ts` to verify deployment invariants, open-redirect neutralizers, environment variable segregation, and automated sweeper cron scheduling.
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
