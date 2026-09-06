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

