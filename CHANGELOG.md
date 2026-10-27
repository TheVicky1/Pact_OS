# Changelog

All notable changes to the **PACT Personal Operating System** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Hacktoberfest Issue Factory Expansion**: Designed, validated, and published 62 brand-new, zero-collision micro-task issues across seven distinct batches:
  - Batch 1 (`#577`–`#587`): Multi-locale currency formatter, DST shift detector, CRC-32 checksum calculator, Luhn PIN verifier, binaural beats frequency detuner, 5-second rule countdown evaluator, conic progress gradients, hex opacity appender, habit momentum index, JSON-LD generator, and natural recurrence describer.
  - Batch 2 (`#591`–`#601`): Haversine distance & geofence evaluator, RFC 6238 TOTP URI builder, 90-minute ultradian sleep cycle calculator, aspect ratio box fitting, bounded in-memory LRU cache, Levenshtein distance & similarity index, compounding penalty accrual, daily hydration target calculator, safe Markdown auto-closure truncator, 31-day bitmask check-in flags, and Heckbert "nice numbers" axis tick scale generator.
  - Batch 3 (`#604`–`#608`): Audio frequency to musical pitch note translator, exponential XP progression curve calculator, Base58 unambiguous verification token encoder/decoder, Soundex phonetic matching code generator, and Run-Length Encoding (RLE) streak record compressor.
  - Batch 4 (`#655`–`#659`): Focus cognitive recovery predictor, Gini coefficient domain time allocation inequality, HMAC-SHA256 signed verification tokens, habit elasticity decay, and Yerkes-Dodson arousal curve.
  - Batch 5 (`#661`–`#670`): Implementation intentions "If-Then" trigger parser, streak shield insurance points, task opportunity cost allocator, Pomodoro work-to-rest auto-tuner, EMA habit consistency smoother, WCAG 2.2 modular typographic scale, 4-7-8 & box breathing recovery cycles, temptation bundling matcher, circadian cortisol awakening response planner, and Pearson correlation coefficient matrix.
  - Batch 6 (`#671`–`#675`): Shannon entropy habit routine predictability, parked distraction triage queue, Fogg behavior model task friction diagnostic, delta-RLE timestamp compression engine, and commitment bond slashing schedule.
  - Batch 7 (`#676`–`#685`): ISO 226 equal-loudness contour filter, habit stacking anchor compatibility scorer, Shamir's secret sharing (2-of-3) key splitter, decision fatigue choice budget, Zipf's law power-law distribution validator, geohash precision encoder, cognitive warm-up sigmoid ramping, six-attribute character skill tree, social jetlag calculator, and Dutch auction escalating penalty price decaying multiplier.
- **Community Contributions & Merged Features**:
  - Dutch auction escalating penalty decaying multiplier (#686) by Aryan (`@Aryan9891`).
  - Inverted index search, SRI hash calculator, XP level progression, and focus efficiency ratio (#650, #651, #652, #653) by Toyes (`@toyes3429`).
  - Constant-time string/buffer comparisons and Elo rating calculator (#648, #649) by Akshat (`@akshatXD-hash`).
  - Fixed-precision decimal arithmetic and automatic theme preference observer (#621, #642) by Sibi Sudhan Elangovan (`@SibiSudhanElangovan`).
  - Edge-case unit test suites for fractional timestamps, low battery threshold levels, and currency formatting (#622, #623, #654) by Ravi Modiya (`@ravimodiya`).
  - Countdown ignition evaluator for discipline enforcement (#636) by `@xhbxx`.
  - Base58 unambiguous token encoder/decoder, 20-20-20 screen rest, caffeine sleep cutoff, Parkinson's law compression, and Jaro-Winkler string similarity (#620, #625, #626, #627, #628) by Aryan (`@Aryan9891`).
  - Media box-fit aspect ratio calculator (#614) by Krishna (`@krishna2707`).
  - Accessible accent swatch announcements and selection states (#613) by Aaqib Hafeez Khan (`@Aaqibhafeezkhan`).
  - Windows contributing and PowerShell troubleshooting guide (#612) by Sunanda Pandit (`@sunandapandit03`).
  - Sliding-window rate limiter for partner invitations (#611) by `@mutabalShawandar`.
  - Run-Length Encoding (RLE) streak record compressor (#610) by `@Enard52`.
  - Verification PIN generation & Luhn check digit validation (#602) by Sahil Thakur (`@sahilthakurr24`).
  - Color hex alpha transparency utility (#590) by Gaurav Patil (`@GauravPatil2515`).
  - Screen wake lock API manager for active focus sessions (#588) by Gautam (`@GauravPatil2515` / `@Gautam5471`).
  - Deterministic category tag color palette generator (#576) by Ayaan Qazi (`@ayaan-qazi`).
  - Daily ritual step progress & completion calculator (#575) by Naman Goyal (`@namangoyal176-10`).
  - Comprehensive documentation guides for webhooks, troubleshooting, offline sync, PWA service workers, code review policy, timezone setup, and Supabase RLS (#544–#553) by Arthur Joseph Lawson (`@ArthurJosephLawson`).
- **Community Contributors Hall of Fame Update**: Expanded `CONTRIBUTORS.md` recognizing all 51 community contributors and their specific merged pull requests across core engineering, accessibility, quality assurance, theming, and technical writing.
- **Test Matrix Expansion**: Automated test matrix expanded to 102 complete test suites with 100% pass rate covering all domain validations, utilities, and security guarantees.


## [0.2.0] - 2026-09-20

### Added
- **Multi-Device Delta Replication Protocol (Phase 13)**: Lightweight, deterministic delta-based replication protocol with Lamport logical clocks, monotonic sync cursors, operation deduplication, tombstones, and zero punitive consequence leakage guarantees (`src/lib/offline/delta-engine.ts`, `src/features/sync/sync-actions.ts`, `src/app/api/sync/delta/route.ts`).
- **Service Worker Background Synchronization (Phase 13)**: Enhanced Progressive Web App Service Worker with Background Sync API event listener (`pact-sync-deltas`), reconnect recovery listeners, and durable device identity resolution (`src/lib/offline/background-sync.ts`, `public/sw.js`).
- **Offline Proof & Evidence Staging Cache (Phase 13)**: Client-side staged proof cache with strict quotas (5MB per file, 25MB total), MIME validation (`image/png`, `image/jpeg`, `image/webp`, `application/pdf`, `text/plain`, `application/json`), SHA-256 integrity checksums, and server-authoritative verification protection (`src/lib/offline/attachment-cache.ts`).
- **Multi-Device Sync Status Indicator & Device Registry (Phase 13)**: Live header status pill with latency feedback and registered device manager in Settings for active session inspection and remote device revocation (`src/features/sync/components/sync-status-indicator.tsx`, `src/features/settings/components/device-management-card.tsx`).
- **Multi-Device Sync & Replication Migration (Phase 13)**: PostgreSQL migration introducing `device_registry`, `sync_delta_logs`, and `staged_proof_attachments` tables with Supabase Row Level Security and composite query indexes (`supabase/migrations/20260916000000_multi_device_sync_and_replication.sql`).
- **Phase 13 Comprehensive Regression Test Suite (Phase 13)**: Automated tests verifying delta merges, field convergence, Lamport clock monotonicity, attachment quotas, and zero consequence leakage (`tests/phase13-multi-device-sync-replication.test.ts`).
- **Daily Sunset & Shutdown Ritual Engine (Phase 12)**: 4-step evening closure flow with daily scorecard compilation, task triage (carry forward to tomorrow, move to backlog, discard), structured evening reflection notes, and tomorrow commitment lock-in (`src/lib/rituals/daily-sunset.ts`, `src/features/rituals/daily-sunset-actions.ts`, `src/features/rituals/components/daily-sunset-view.tsx`, `src/app/(dashboard)/app/sunset/page.tsx`).
- **Account Lifecycle Governance & Danger Zone (Phase 12)**: Full GDPR-compliant account data deletion with cryptographic phrase confirmation (`"DELETE MY ACCOUNT AND ALL DATA"`), cascade deletion across all relational tables, client-side offline store purge, and user audit trail explorer (`src/features/settings/actions.ts`, `src/features/settings/components/account-lifecycle-card.tsx`, `src/features/settings/components/audit-trail-card.tsx`).
- **Universal Accessibility (WCAG 2.1 AA) & Keyboard System (Phase 12)**: Accessible modal focus trap manager, ARIA-live dynamic announcement engine, global skip-to-content links, and unified keyboard shortcut overlay triggered by `?` / `Shift+/` (`src/lib/a11y/focus-trap.ts`, `src/lib/a11y/announcer.ts`, `src/components/ui/keyboard-shortcuts-modal.tsx`, `src/components/ui/skip-to-content.tsx`, `src/components/ui/app-shell.tsx`).
- **Live Diagnostics & Operational Telemetry Dashboard (Phase 12)**: Real-time RTT latency measurement, Node runtime memory heap inspection, rate-limit headroom, and deep health check telemetry runner (`src/features/settings/components/system-diagnostics-card.tsx`).
- **Daily Rituals & Account Governance Migration (Phase 12)**: PostgreSQL migration introducing the `daily_sunset_logs` table with Supabase Row Level Security and composite query indexes (`supabase/migrations/20260915000000_daily_rituals_and_account_governance.sql`).
- **Phase 12 Comprehensive Regression Test Suite (Phase 12)**: Automated tests verifying sunset scorecard aggregation, task triage schemas, reflection notes sanitization, and timing boundaries (`tests/phase12-daily-rituals-and-governance.test.ts`).
- **Production Resilience & Rate Limiting Engine (Phase 11)**: Token-bucket sliding-window rate limiters across `AUTH`, `WEBHOOK`, `PROOF_SYNC`, `API`, and `CRON` tiers with safe IP resolution, spoofing protection, and RFC rate limit headers (`src/lib/security/rate-limiter.ts`).
- **Privacy-Safe Structured Observability (Phase 11)**: Structured JSON logger with zero-trust automated redaction for bearer tokens, Stripe secrets, webhook signing keys, passwords, and private consequence descriptions (`src/lib/observability/logger.ts`, `src/lib/observability/telemetry.ts`).
- **Global Application Error Boundaries & Resilience (Phase 11)**: Luxury dark root and dashboard error boundaries with safe recovery, reset triggers, and 404 views (`src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`, `src/app/(dashboard)/app/error.tsx`).
- **Multi-Channel Durable Notification Dispatcher (Phase 11)**: Asynchronous priority queue (`CRITICAL`, `HIGH`, `NORMAL`, `LOW`) with exponential backoff retries, dead-letter storage, and authenticated dispatch worker endpoint (`src/lib/notifications/notification-dispatcher.ts`, `src/app/api/notifications/dispatch/route.ts`).
- **Stripe & Charity Pledge Webhook Endpoint (Phase 11)**: Live webhook receiver with rate limiting, HMAC-SHA256 signature verification, and 5-minute replay protection tolerance (`src/app/api/finance/webhook/route.ts`).
- **Deep Health & Subsystem Readiness Probes (Phase 11)**: Multi-subsystem health check evaluating database, RLS, queue depth, and memory stats (`src/app/api/health/deep/route.ts`).
- **Production Resilience & Audit Telemetry Migration (Phase 11)**: Composite indexes for circle members, pledges, and notifications, plus audit log telemetry table with RLS (`supabase/migrations/20260914000000_production_resilience_and_telemetry.sql`).
- **Multi-Party Accountability Circles (Phase 10)**: Circle membership, role matrices (`owner`, `accountability_partner`, `member`, `observer`), cryptographic invitation tokens, and voting consensus verification (`src/lib/accountability/circles.ts`, `src/features/accountability/circle-actions.ts`).
- **Charity Pledge Automation Engine (Phase 10)**: Micro-consequence pledge lifecycle, Stripe payment intent integration, idempotency keys, and unexcused breach forfeiture handling (`src/lib/finance/pledge-engine.ts`, `src/features/finance/pledge-actions.ts`).
- **Local-First Entity Cache & Deterministic Conflict Engine**: Client-side durable entity cache supporting storage tiering (IndexedDB with localStorage fallback), version increment tracking, Last-Write-Wins (LWW) conflict detection, and strict server-authoritative consequence protection (`src/lib/offline/local-cache.ts`, `src/lib/offline/conflict-engine.ts`).
- **WebAuthn / Passkey Passwordless Security**: FIDO2 / WebAuthn Level 3 biometric authentication with cryptographically random challenges, 5-minute TTL, single-use replay protection, origin/RP verification, and PostgreSQL RLS on `passkey_credentials` (`src/lib/auth/passkeys.ts`, `src/lib/validations/passkeys.ts`, `src/features/auth/passkey-actions.ts`).
- **Security Settings & Passkey UX**: Passkey registration, device naming, credential revocation, and biometric sign-in button in UnifiedAuthCard (`src/features/settings/components/security-settings-card.tsx`, `src/components/auth/unified-auth-card.tsx`).
- **PWA Foundation & Service Worker**: Installable Progressive Web App with v2 manifest, standalone display, shortcuts, and static app-shell caching with zero private data leakage guarantees.
- **Offline Quick Capture & Durable Sync Engine**: Client-side offline queue persistence with RFC 4122 UUID v4, deterministic idempotency keys, and exponential backoff synchronization.
- **Mobile Live Focus Activity & Screen Wake Lock**: Cross-platform Live Activity contracts for iOS Dynamic Island / Lock Screen widgets and Android Ongoing notifications, plus Screen Wake Lock and Web Notification completion alerts.
- **Mobile Device Registration & Push Architecture**: Zod schema for device token registration and push notification formatting with strict consequence masking confidentiality.

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
- Constant-time timing-safe comparisons enforced for all cron secrets and webhook signatures.

---

## [0.1.0] - 2026-09-12

### Initial Open-Source Baseline
- Initial open-source architecture foundation, Core OS modules, Supabase database migrations, Row Level Security policies, luxury obsidian visual system, and 35 authoritative domain test suites.
