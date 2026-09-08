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
| **Forged Consequence State** | Server Action / API / RPC Test | `VERIFIED AGAINST REAL DATABASE (Phase 3M3-4: 84/84 Security Checks)` |
| **Deadline Boundary Logic** | Unit & Integration Test | `VERIFIED (Phase 2E, 3M3)` |
| **Timezone Boundary Edge Cases** | Unit & Integration Test | `VERIFIED (Phase 2E, 3M4)` |
| **Concurrent Completion Race Condition** | DB Transaction Race Test | `VERIFIED AGAINST REAL DATABASE (Phase 2F)` |
| **Unauthorized API Call** | API Gateway Security Test | `FUTURE TEST — REQUIRED BEFORE FEATURE COMPLETION` |
| **Malformed Input Payloads** | Zod Schema Validation Test | `VERIFIED (Phase 1, 2B, 2C, 2D, 3M1-4)` |
| **Session Expiry & Token Revocation** | Auth Integration Test | `VERIFIED AGAINST REAL DATABASE (Phase 1)` |
| **Consequence Data Exposure Attempt** | Database & API Security Test| `VERIFIED AGAINST REAL DATABASE (Phase 3M1-4: RLS & Snapshot Immutability)` |
| **Forged Timed Verification Session** | RPC & DB Immutability Test | `VERIFIED AGAINST REAL DATABASE (Phase 3M4: Anti-tamper trigger & duration checks)` |
| **Weekly Waiver Limit Bypass Attempt** | RPC Quota & Timezone Test | `VERIFIED AGAINST REAL DATABASE (Phase 3M4: Strict 3 waivers/week limit)` |

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
1. `tests/resolution-engine.test.ts`: 9 comprehensive test groups verifying verification types, configuration schemas, snapshot persistence, session lifecycle schemas, server-authoritative timer math, waiver confirmation tokens, timezone-aware ISO week calculations, weekly quota resets, and state machine invariants.
2. `tests/commitment-engine.test.ts`: Immutability of snapshotted verification configuration, commitment assignment, and tamper prevention.
3. `tests/consequence-activation.test.ts`: Authoritative consequence activation on missed task deadlines.

### Real Database Adversarial Attack Suite (`tests/adversarial-rls-audit.sql`)
- **Total Checks**: 84 adversarial security checks executed directly against live Supabase PostgreSQL instance.
- **Section 10 Additions (Checks 58–84)**:
  - Multi-user cross-tenant session read isolation (User B cannot see User A's session).
  - Cross-user session initiation blocked.
  - Direct SQL INSERT/UPDATE/DELETE on `accountability_verification_sessions` blocked by immutability trigger `protect_accountability_sessions_immutability()`.
  - Direct SQL INSERT/UPDATE/DELETE on `accountability_waivers` blocked by immutability trigger `protect_accountability_waivers_immutability()`.
  - Attacker User B attempting to fulfill/cancel User A's session via RPC blocked with `P0001: Unauthorized: Verification session does not belong to the authenticated user`.
  - Premature fulfillment (< required duration) rejected with `P0001: Accountability session duration not met`.
  - Tampered client timestamps rejected (server uses authoritative `now()`).
  - Missing or whitespace-only evidence notes rejected.
  - Oversized evidence notes (> 5000 characters) rejected.
  - Cross-user commitment waiver attempts blocked.
  - Non-pending commitment waiver attempts blocked.
  - Strict weekly waiver quota (hard limit 3 per calendar week per timezone) enforced; 4th attempt rejected with `P0001: Weekly waiver limit reached (maximum 3 waivers allowed per calendar week)`.
  - Invalid confirmation token rejected with `P0001: Waiver confirmation token invalid`.
  - Idempotency and anti-tamper triggers verified across all terminal states.
- **Audit Result**: `84/84 checks passed with 0 failures`.

