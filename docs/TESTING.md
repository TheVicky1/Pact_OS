# PACT — Quality Assurance & Security Testing Contract

## 1. Testing Philosophy [CONFIRMED]

Testing is a core architectural requirement, NOT a final cleanup step. Every vertical feature slice must be verified against automated unit, integration, and security test suites prior to production deployment.

---

## 2. Security Test Mapping & Contract [CONFIRMED]

Because Phase 0 establishes the specification foundation prior to implementation, all security test suites are categorized with explicit execution contracts. 

> [!IMPORTANT]
> All items below are marked **FUTURE TEST — REQUIRED BEFORE FEATURE COMPLETION**. A feature slice CANNOT be marked complete during Phase 1+ until its corresponding security tests pass cleanly.

| Security Requirement / Attack Scenario | Test Classification | Execution Contract Status |
|---|---|---|
| **Cross-User SELECT** | Direct Database RLS Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A, 2C, 2D, 3M1-4)` |
| **Cross-User INSERT** | Direct Database RLS Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A, 2C, 2D, 3M1-4)` |
| **Cross-User UPDATE** | Direct Database RLS Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A, 2C, 2D, 3M1-4)` |
| **Cross-User DELETE** | Direct Database RLS Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A, 2C, 2D, 3M1-4)` |
| **ID Manipulation (UUID Guessing)** | API & Database RLS Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A, 2C, 2D, 3M1-4)` |
| **Forged userId Injection** | Server Action / API Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A, 2C, 2D, 3M1-4)` |
| **Forged `completed_at` Timestamp** | Server Action / API Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A & 2D)` |
| **Forged `missed_at` Timestamp** | Server Action / API Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A & 2D)` |
| **Forged Consequence State** | Server Action / API / RPC Test | `VERIFIED AGAINST REAL DATABASE (Phase 3M3-5: 103/103 Security Checks)` |
| **Deadline Boundary Logic** | Unit & Integration Test | `VERIFIED (Phase 2E, 3M3)` |
| **Timezone Boundary Edge Cases** | Unit & Integration Test | `VERIFIED (Phase 2E, 3M4, 3M5)` |
| **Concurrent Completion Race Condition** | DB Transaction Race Test | `VERIFIED AGAINST REAL DATABASE (Phase 2F, 3M5)` |
| **Unauthorized API Call** | API Gateway Security Test | `FUTURE TEST — REQUIRED BEFORE FEATURE COMPLETION` |
| **Malformed Input Payloads** | Zod Schema Validation Test | `VERIFIED (Phase 1, 2B, 2C, 2D, 3M1-5)` |
| **Session Expiry & Token Revocation** | Auth Integration Test | `VERIFIED AGAINST REAL DATABASE (Phase 1)` |
| **Consequence Data Exposure Attempt** | Database & API Security Test| `VERIFIED AGAINST REAL DATABASE (Phase 3M1-5: RLS & Snapshot Immutability)` |
| **Forged Timed Verification Session** | RPC & DB Immutability Test | `VERIFIED AGAINST REAL DATABASE (Phase 3M4-5: Anti-tamper trigger & duration checks)` |
| **Weekly Waiver Limit Bypass Attempt** | RPC Quota & Timezone Test | `VERIFIED AGAINST REAL DATABASE (Phase 3M4-5: Strict 3 waivers/week limit)` |
| **Illegal State Machine Transition** | Database Trigger Test | `VERIFIED AGAINST REAL DATABASE (Phase 3M5: Direct shortcut & terminal edit blocks)` |
| **Circular Task Completion Self-Reference** | RPC Validation Test | `VERIFIED AGAINST REAL DATABASE (Phase 3M5: Circular task rejection)` |

---

## 3. Test Architecture Matrix [CONFIRMED]

```
┌─────────────────────────────────────────────────────────┐
│                    End-to-End (E2E)                     │  <-- Major user journeys
├─────────────────────────────────────────────────────────┤
│            Security & Direct Database Attack            │  <-- RLS & forged field checks
├─────────────────────────────────────────────────────────┤
│                   Integration Tests                     │  <-- Server Actions, API routes, DB queries
├─────────────────────────────────────────────────────────┤
│                      Unit Tests                         │  <-- Pure business & timezone logic
└─────────────────────────────────────────────────────────┘
```

### 1. Direct Database Attack & Security Tests (Mandatory)
- **Execution Rule**: Tests MUST execute raw SQL queries / Supabase API requests using mock JWT tokens representing User A attempting actions against User B's resources.
- **Success Criteria**: Database returns zero rows or explicit RLS permission denial (`42501`).

### 2. Unit Tests
- **Focus**: Date/timezone conversion math, progress aggregations, Zod schema validation rules, expense category match suggestions.
- **Execution Rule**: Deterministic, zero database network dependencies.

### 3. Regression Test Policy
- Every bug fix MUST include a dedicated regression test reproducing the exact failure state prior to merging code.

---

## 4. Phase 3 Accountability Verification Engine Matrix [VERIFIED]

The Accountability Resolution & Verification Engine was subjected to rigorous unit and adversarial database security testing:

### Automated Unit Test Suites
1. `tests/accountability-hardening.test.ts`: 12 test sections (29 test cases) verifying all verification schemas, multi-modal fulfillment validation, terminal state locks, definition deletion snapshot resilience, waiver calendar week boundaries, and race condition defenses.
2. `tests/resolution-engine.test.ts`: 9 comprehensive test groups verifying verification types, configuration schemas, snapshot persistence, session lifecycle schemas, server-authoritative timer math, waiver confirmation tokens, timezone-aware ISO week calculations, weekly quota resets, and state machine invariants.
3. `tests/commitment-engine.test.ts`: Immutability of snapshotted verification configuration, commitment assignment, and tamper prevention.
4. `tests/consequence-activation.test.ts`: Authoritative consequence activation on missed task deadlines.

### Real Database Adversarial Attack Suite (`tests/adversarial-rls-audit.sql`)
- **Total Checks**: 103 adversarial security checks executed directly against live Supabase PostgreSQL instance.
- **Section 10 Checks (58–84)**: Verification sessions, server-authoritative timer math, evidence note requirements, and weekly waiver quota.
- **Section 11 Additions (Checks 85–103)**:
  - State machine transition trigger `trg_enforce_commitment_status_transitions`:
    - Direct `committed -> fulfilled` blocked (`P0001`).
    - Direct `committed -> waived` blocked (`P0001`).
    - Terminal `fulfilled` status cannot be altered (`P0001`).
    - Terminal `waived` status cannot be altered (`P0001`).
  - Definition deletion resilience: Deleting source consequence definition preserves committed snapshots without cascade.
  - Multi-modal fulfillment RPC authorization & execution:
    - User B cannot fulfill User A's written reflection commitment (`P0001`).
    - Reflection length boundaries (<20 chars, >5000 chars) rejected (`P0001`).
    - Valid written reflection successfully fulfills commitment.
    - User B cannot declare fulfillment on User A's commitment (`P0001`).
    - Declaration statements (<1 char, >1000 chars) rejected (`P0001`).
    - Valid declaration sets `is_self_declaration = true` and `verified_objectively = false`.
    - User B cannot fulfill User A's task completion commitment (`P0001`).
    - Circular self-reference (`target_task_id = commit.task_id`) rejected (`P0001`).
    - Incomplete target task rejected (`P0001`).
    - Cross-user target task rejected (`P0001`).
    - Completed target task successfully fulfills commitment.
  - Defense-in-depth waiver quota trigger `trg_enforce_weekly_waiver_quota`: Direct bypass attempt exceeding weekly limit blocked.
- **Audit Result**: `103/103 checks passed with 0 failures`.

---

## 5. Contributor Test Execution Guide

All 56 authoritative domain test suites run completely offline without needing live Supabase credentials or network access.

### Running the Entire Authoritative Matrix
```bash
npm test
# (or: node scratch/run-tests.mjs)
```

### Running a Targeted Single Test Suite
When working on a micro-contribution, run the specific test file for instant feedback:
```bash
npm run test:file -- tests/habit-completion-service.test.ts
# or by filename pattern:
node scratch/run-tests.mjs habit-completion-service
```



