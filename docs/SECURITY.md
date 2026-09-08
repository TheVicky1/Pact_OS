# PACT — Comprehensive Security Architecture & Mandatory Security Baseline

## 1. Core Security Philosophy & Vertical Slice Execution [CONFIRMED]

Security in PACT is designed **database-first** and **server-authoritative**. Security must NEVER depend solely on frontend UI behavior; the frontend is a presentation layer, NOT a security boundary.

### Mandatory Vertical Slice Engineering Order [CONFIRMED]
Every feature MUST be implemented in the following strict vertical sequence:

```
1. Database Schema & Constraints
   ↓
2. Row Level Security (RLS) & Authorization
   ↓
3. Data Access Layer / Repository (Server-Side)
   ↓
4. Server Actions / API Endpoints
   ↓
5. Input Validation (Zod Schemas)
   ↓
6. Unit & Integration Tests
   ↓
7. Security Code Review
   ↓
8. Frontend UI Implementation
   ↓
9. Visual QA & Verification
```

---

## 2. Comprehensive 28-Point Security Specification Matrix [CONFIRMED]

For every security domain, PACT explicitly defines the 5 fundamental security dimensions:

| # | Security Domain | WHAT is protected? | WHO can access it? | WHERE is the boundary? | HOW is it enforced? | HOW will it be tested? |
|---|---|---|---|---|---|---|
| 1 | **Authentication** | User identity & session state | Authenticated user owning the session | Supabase Auth API / Middleware | JWT token verification on every server route | `FUTURE TEST — Unauthenticated Request Rejection` |
| 2 | **Authorization** | System features & data operations | Authorized resource owner only | Server Actions / API Gateway | Role & ownership check prior to operation | `FUTURE TEST — Unauthorized Role Action Block` |
| 3 | **User Ownership** | All user-created records (tasks, goals, expenses) | Explicit row owner (`auth.uid() = user_id`) | PostgreSQL RLS Engine | `USING (auth.uid() = user_id)` DB policies | `FUTURE TEST — Cross-User Data Isolation` |
| 4 | **PostgreSQL RLS** | All tables containing `user_id` | Database engine level query filter | PostgreSQL Core DB Engine | RLS policies enabled on all user tables | `FUTURE TEST — Direct SQL RLS Enforcement` |
| 5 | **Direct DB Attack Scenarios** | Raw database rows & RPC functions | Authenticated owner only | Database connection pool | RLS policy evaluation inside Postgres | `FUTURE TEST — Direct DB REST/RPC Attack` |
| 6 | **Cross-User SELECT** | Reading another user's records | Owning user only | DB RLS SELECT Policy | `CREATE POLICY ... FOR SELECT USING (auth.uid() = user_id)` | `FUTURE TEST — Cross-User SELECT Prevention` |
| 7 | **Cross-User INSERT** | Creating records under another `user_id` | User creating their own record | DB RLS INSERT Policy | `WITH CHECK (auth.uid() = user_id)` | `FUTURE TEST — Forged userId INSERT Block` |
| 8 | **Cross-User UPDATE** | Modifying another user's records | Owning user only | DB RLS UPDATE Policy | `USING (auth.uid() = user_id) WITH CHECK (...)` | `FUTURE TEST — Cross-User UPDATE Block` |
| 9 | **Cross-User DELETE** | Deleting another user's records | Owning user only | DB RLS DELETE Policy | `CREATE POLICY ... FOR DELETE USING (auth.uid() = user_id)` | `FUTURE TEST — Cross-User DELETE Block` |
| 10 | **ID Manipulation** | Accessing resources by guessing UUIDs | Owning user only | DB RLS + Server Validation | RLS filters out non-owned UUIDs even if guessed | `FUTURE TEST — UUID Guessing Attack Defense` |
| 11 | **Forged userId** | Injecting arbitrary `user_id` in API bodies | System server context | Server API Boundary | `user_id` extracted from verified JWT, ignoring body `user_id` | `FUTURE TEST — Body userId Override Ignored` |
| 12 | **Forged Timestamps** | `completed_at`, `missed_at`, `created_at` | Server system clock only | Server Action / DB Trigger | Server-side `now()` generation; client timestamps rejected | `FUTURE TEST — Client Timestamp Injection Block` |
| 13 | **Forged Lifecycle State** | Task status (`completed`, `missed`) | Server state machine engine | Server Business Logic Layer | Status transitions executed solely by server state engine | `FUTURE TEST — Arbitrary State Transition Block` |
| 14 | **Deadline Integrity** | Commitment completion validity | Server evaluation engine | Server Boundary | Server compares trusted `completed_at` against `deadline_at` | `FUTURE TEST — Boundary Deadline Verification` |
| 15 | **Completion Integrity** | Task completion status verification | Server action workflow | Database Transaction / RPC | Atomic check of deadline and task state inside DB transaction | `FUTURE TEST — Concurrent Completion Race Condition` |
| 16 | **Consequence Confidentiality** | Sensitive consequence payload data | Server engine (until revealed) | DB Data Access / RLS View | Column/Row filtering until `is_revealed = true` set by server | `FUTURE TEST — Unrevealed Consequence Exposure Attempt` |
| 17 | **Server-Side Enforcement** | All security-critical decisions | Trusted server environment | Server Actions / API Routes | Business rules executed exclusively on server | `FUTURE TEST — Client Logic Bypass Defeated` |
| 18 | **Input Validation** | API request payloads & parameters | Validated request schemas | API Boundary | Zod schema parsing prior to controller execution | `FUTURE TEST — Malformed Input Schema Rejection` |
| 19 | **Error Handling** | System internal implementation details | Internal server logs only | API Error Middleware | Generic sanitized error responses returned to client | `FUTURE TEST — Stack Trace & Leakage Verification` |
| 20 | **Account Enumeration** | User registration status & emails | Public registration endpoint | Auth Handler | Uniform error messages ("Invalid credentials") across all auth failures | `FUTURE TEST — Auth Response Timing & Uniformity` |
| 21 | **Rate Limiting** | Public & authenticated API routes | Valid client traffic within quotas | API Gateway / Middleware | Rate limiter tracking IP & User ID request rates | `FUTURE TEST — Rate Limit Threshold Enforcement` |
| 22 | **Session Security** | JWT access tokens & refresh tokens | Valid user agent / browser | HTTP Headers / Secure Cookies | Short-lived JWTs, HTTPS-only, SameSite cookies | `FUTURE TEST — Expired & Tampered Token Rejection` |
| 23 | **Integration Credentials** | Third-party OAuth tokens | Backend sync job worker | Server-Only Storage Boundary | Tokens stored encrypted at rest; never sent to frontend | `FUTURE TEST — Integration Credential Non-Exposure` |
| 24 | **Minimal Data Exposure** | Database query responses | Client view layer | Service / Repository Layer | Explicit SELECT column lists; sensitive fields omitted | `FUTURE TEST — Excessive Payload Column Pruning` |
| 25 | **Auditability** | Security-critical state changes | System audit logs | Database Audit Triggers | Immutable audit log records for state transitions | `FUTURE TEST — State Transition Audit Log Verification` |
| 26 | **Race Conditions** | Concurrent state update requests | First valid atomic transaction | DB Transaction Isolation | Atomic `SERIALIZABLE` or `FOR UPDATE` DB locks | `FUTURE TEST — Parallel Completion Race Condition` |
| 27 | **Timezone Boundaries** | Midnight calculation & daily tasks | Server timezone engine | Server Logic | Storage in UTC (`TIMESTAMPTZ`); conversion via user profile | `FUTURE TEST — Timezone Midnight Boundary Edge Cases` |
| 28 | **Financial Data Protection**| Expense records & category data | Owning user only | DB RLS & Server Layer | Strict user RLS policies on `expenses` and `expense_categories` | `FUTURE TEST — Cross-User Financial Isolation` |

---

## 3. Row Level Security (RLS) Blueprint [PROPOSED]

```sql
-- Standard User Isolation Policy Blueprint
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own tasks"
ON public.tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
ON public.tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own non-trusted task fields"
ON public.tasks FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
ON public.tasks FOR DELETE
USING (auth.uid() = user_id);
```

---

## 4. Consequence Data Confidentiality Policy [CONFIRMED]

Consequence data confidentiality is enforced strictly at the database / data-access layer:
1. `consequences` table rows containing `encrypted_payload` are inaccessible to standard client queries while `is_revealed = false`.
2. Transitioning `is_revealed` to `true` is executed exclusively by trusted server-side cron workers or security-definer RPC stored procedures upon verified deadline failure.

---

## 5. Phase 2C Projects Goal Parent Authorization Verification [CONFIRMED]

For Phase 2C, Projects support optional parent Goal linkage. Security enforcement guarantees that a user cannot link a Project to a Goal owned by another user:
1. **Server Action Authorization**: `createProjectAction` and `updateProjectAction` explicitly query `public.goals` matching `id = goal_id` AND `user_id = user.id` prior to performing any database mutation. If the Goal is not owned by the authenticated user, the mutation fails immediately with `"Selected Goal does not exist or does not belong to you."`.
2. **PostgreSQL RLS Boundary**: PostgreSQL RLS policies on `public.projects` enforce:
   `WITH CHECK (goal_id IS NULL OR EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()))`.
3. **Adversarial Verification**: Verified against the real remote Supabase database via `tests/adversarial-rls-audit.sql`:
   - Cross-user Project `INSERT` with another user's Goal ID is blocked by RLS.
   - Cross-user Project `UPDATE` setting `goal_id` to another user's Goal ID is blocked by RLS.
   - Independent projects with `goal_id = NULL` operate without restriction.

---

## 6. Phase 2D Tasks Parent Entity Authorization & Trusted Field Protection [CONFIRMED]

For Phase 2D, Tasks support optional parent Goal (`goal_id`) and/or parent Project (`project_id`) linkage. Security enforcement guarantees that a user cannot link a Task to parent entities owned by another user:
1. **Server Action Authorization**: `createTaskAction` and `updateTaskAction` independently verify that provided `goal_id` exists in `public.goals` matching `user_id = user.id` AND `project_id` exists in `public.projects` matching `user_id = user.id` prior to executing any mutation.
2. **PostgreSQL RLS Boundary**: PostgreSQL RLS policies on `public.tasks` enforce:
   `WITH CHECK (auth.uid() = user_id AND (goal_id IS NULL OR EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid())) AND (project_id IS NULL OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())))`.
3. **Trusted Field Protection**: PostgreSQL trigger `enforce_task_trusted_fields()` enforces immutability of `completed_at` and `missed_at` timestamps for non-`service_role` clients on both `INSERT` and `UPDATE` statements.
4. **Adversarial Verification**: Verified against real remote Supabase PostgreSQL database via `tests/adversarial-rls-audit.sql`:
   - Cross-user Task `INSERT` / `UPDATE` with another user's Project ID is blocked by RLS (`42501`).
   - Cross-user Task `INSERT` / `UPDATE` with another user's Goal ID is blocked by RLS (`42501`).
   - Direct `INSERT` or `UPDATE` of `completed_at` or `missed_at` is blocked by trigger.
   - Anonymous access to `public.tasks` is blocked (0 rows / `42501`).

---

## 7. Phase 2E Deadline & Timezone Evaluation Engine [CONFIRMED]

For Phase 2E, temporal evaluation logic was isolated into a pure, deterministic engine (`src/lib/time.ts`). Security and temporal integrity guarantees include:
1. **UTC Instant Storage Invariance**: `public.tasks.deadline_at` columns store timestamps strictly as `TIMESTAMPTZ` representing absolute UTC instants. Changing a user profile's local timezone alters only wall-clock display formatting without modifying stored UTC instants.
2. **Strict Canonical IANA Timezone Validation**: Timezones are validated against canonical IANA identifiers (e.g. `Asia/Kolkata`, `America/New_York`, `Europe/London`, `UTC`). Non-canonical 3-letter abbreviations (`IST`, `PST`, `EST`) are rejected at the Zod and application boundary (`ianaTimezoneSchema`).
3. **One-Second Temporal Boundary Integrity**: `isDeadlineReached(deadlineAt, clock)` enforces standard 1-second precision (`now >= deadlineAt`), ensuring instant-level boundary consistency.
4. **DST Spring-Forward & Fall-Back Edge Handling**: Local wall-clock inputs are parsed cleanly via `localToUtc()`. Nonexistent spring-forward local times are flagged (`isNonexistent = true`) with explicit error messaging. Ambiguous fall-back local times are flagged (`isAmbiguous = true`) to prevent silent time shift corruption.
5. **Phase 2F Boundary Isolation**: Pure temporal engine methods answer temporal state questions without triggering business state transitions (`completed_at`, `missed_at`), keeping execution lifecycle strictly isolated for Phase 2F. Verified via unit test suite (`tests/temporal-engine.test.ts`).

---

## 8. Phase 2F Authoritative Task Lifecycle Security & Direct Status Bypass Protection [CONFIRMED]

For Phase 2F, Task execution lifecycle transitions were made fully server-authoritative and race-condition protected:
1. **Direct Status & Timestamp Mutation Block**: Hardened database trigger `enforce_task_trusted_fields()` blocks direct client REST/SQL attempts to mutate `status` to `'completed'` or `'missed'`, as well as setting/updating `completed_at` or `missed_at`.
2. **Authoritative RPC Functions**: `complete_task(p_task_id)` and `mark_task_missed(p_task_id)` execute inside PostgreSQL `SECURITY DEFINER` functions with `SET search_path = public`.
3. **Atomicity & Row Locking**: Transactions execute `SELECT ... FOR UPDATE` on `public.tasks` to lock the target row, preventing race conditions between concurrent requests.
4. **Idempotency & State Invariants**: `completed` and `missed` states are terminal. Idempotent repeated calls preserve original authoritative transaction timestamps without overwriting data.
5. **Adversarial Real Database Verification**: Verified against real remote Supabase PostgreSQL database (`tests/adversarial-rls-audit.sql` Section 6, 29/29 checks passed).

---

## 9. Phase 2I Google OAuth Security & Authentication Hardening [CONFIRMED]

For Phase 2I, Google OAuth was integrated into the existing server-authoritative Supabase Auth architecture:
1. **Supabase Auth Broker Security**: Google OAuth flow uses Supabase Auth as the identity broker (`signInWithOAuth({ provider: 'google' })`). The Google Client ID and Secret reside exclusively in the Supabase Dashboard. No Client Secret is present in frontend code, environment files, or repository assets.
2. **Server-Side PKCE Code Exchange**: The OAuth callback route (`/auth/callback/route.ts`) receives the authorization code and executes `supabase.auth.exchangeCodeForSession(code)` server-side via `@supabase/ssr`, establishing verified HTTP-only session cookies.
3. **Open Redirect Defense**: All redirect target parameters (`next`) pass through `validateSafeRedirect()`. External protocols (`http://`, `https://`), protocol-relative URLs (`//evil.com`), and unauthorized internal routes are rejected, defaulting strictly to `/app`.
4. **Database Identity & Profile Convergence**: Authenticated identity is derived strictly from Supabase Auth (`auth.getUser()`). First-time Google sign-ins trigger `public.handle_new_user()` in PostgreSQL, automatically initializing `public.profiles` with user metadata (`full_name`) without client privilege escalation.
5. **Adversarial & Unit Verification**: Verified via `tests/oauth-flow-validation.test.ts` (10/10 open-redirect vectors blocked, provider contract verified).

---

## 10. Phase 3 Milestone 4 Accountability Resolution, Verification & Waiver Security [CONFIRMED]

For Phase 3 Milestone 4, the consequence resolution and waiver mechanics were built under the core principle: **"PACT never assumes an accountability consequence was fulfilled."**

1. **Anti-Forgery & State Integrity**:
   - `commitment_status` transitions to `'fulfilled'` or `'waived'` are strictly prohibited via direct client `UPDATE`. The DB trigger `protect_accountability_commitment_immutability()` blocks direct status manipulation.
   - Status changes occur exclusively through PostgreSQL `SECURITY DEFINER` RPCs using `pact.internal_bypass = 'true'`.
2. **Server-Authoritative Timed Sessions**:
   - `start_accountability_session(p_commitment_id)` snapshots required duration and stamps server-authoritative `started_at = transaction_timestamp()`.
   - Direct `INSERT`, `UPDATE`, or `DELETE` on `accountability_verification_sessions` is blocked by DB trigger `protect_accountability_sessions_immutability()`.
   - `fulfill_accountability_session(p_session_id, p_evidence_note)` computes elapsed time strictly server-side (`EXTRACT(EPOCH FROM now() - started_at)`). Premature completion requests return `DURATION_NOT_MET`.
   - Supporting activity evidence notes are required for timed sessions (max 5000 chars). Completed session evidence and timestamps are immutable.
3. **Atomic Weekly Waiver Quota**:
   - Users may waive an activated commitment up to a hard limit of 3 waivers per calendar week.
   - Weekly quota is enforced atomically in `waive_accountability_commitment(p_commitment_id, p_confirmation_token)` by acquiring a row-level lock (`SELECT ... FROM public.profiles WHERE id = auth.uid() FOR UPDATE`), preventing concurrent race conditions.
   - Week boundaries are calculated deterministically using the user's configured IANA timezone (`profiles.timezone`).
   - The user-facing confirmation phrase is intentionally deferred; the server enforces validation of internal token `CONFIRM_WAIVER_V1`.
   - Direct client `INSERT`, `UPDATE`, or `DELETE` on `accountability_waivers` is strictly blocked by trigger `protect_accountability_waivers_immutability()`.
4. **Append-Only Auditable History**:
   - Every fulfillment and waiver generates an append-only, immutable record in `public.accountability_events`.
   - Cross-user SELECT, INSERT, UPDATE, and DELETE are blocked by RLS policies. Anonymous access is completely denied.
5. **Adversarial Security Verification**:
   - Verified against the live remote Supabase PostgreSQL database across 84 real adversarial tests in `tests/adversarial-rls-audit.sql` (27 new Milestone 4 checks covering fulfillment, timers, evidence, and weekly quotas).



