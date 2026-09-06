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
| **Cross-User SELECT** | Direct Database RLS Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A, 2C, 2D)` |
| **Cross-User INSERT** | Direct Database RLS Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A, 2C, 2D)` |
| **Cross-User UPDATE** | Direct Database RLS Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A, 2C, 2D)` |
| **Cross-User DELETE** | Direct Database RLS Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A, 2C, 2D)` |
| **ID Manipulation (UUID Guessing)** | API & Database RLS Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A, 2C, 2D)` |
| **Forged userId Injection** | Server Action / API Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A, 2C, 2D)` |
| **Forged `completed_at` Timestamp** | Server Action / API Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A & 2D)` |
| **Forged `missed_at` Timestamp** | Server Action / API Test | `VERIFIED AGAINST REAL DATABASE (Phase 2A & 2D)` |
| **Forged Consequence State** | Server Action / API Test | `FUTURE TEST — REQUIRED BEFORE FEATURE COMPLETION` |
| **Deadline Boundary Logic** | Unit & Integration Test | `VERIFIED (Phase 2E)` |
| **Timezone Boundary Edge Cases** | Unit & Integration Test | `VERIFIED (Phase 2E)` |
| **Concurrent Completion Race Condition** | DB Transaction Race Test | `VERIFIED AGAINST REAL DATABASE (Phase 2F)` |
| **Unauthorized API Call** | API Gateway Security Test | `FUTURE TEST — REQUIRED BEFORE FEATURE COMPLETION` |
| **Malformed Input Payloads** | Zod Schema Validation Test | `VERIFIED (Phase 1, 2B, 2C, 2D)` |
| **Session Expiry & Token Revocation** | Auth Integration Test | `VERIFIED AGAINST REAL DATABASE (Phase 1)` |
| **Consequence Data Exposure Attempt** | Database & API Security Test| `FUTURE TEST — REQUIRED BEFORE FEATURE COMPLETION` |

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
