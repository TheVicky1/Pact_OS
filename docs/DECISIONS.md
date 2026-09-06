# PACT — Architectural Decision Records (ADR) Log

## 1. Decision Status Key

Every architectural item in PACT documentation is categorized into one of five explicit statuses:
- **[CONFIRMED]**: Firmly decided rule or product requirement.
- **[PROPOSED]**: Recommended implementation direction subject to review.
- **[UNDECIDED]**: Recognized design choice requiring further analysis before lock-in.
- **[ASSUMPTION]**: Explicit working hypothesis used for current design.
- **[FUTURE]**: Scope explicitly deferred past V0 baseline.

---

## 2. Decision Log

### ADR-001: Greenfield Rebuild Scope [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Start completely from zero. Establish Phase 0 documentation baseline before writing any application code or database migrations.

### ADR-002: Dual Tagline Approval [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Approve both *"A System for Keeping Promises to Yourself"* and *"Turn Intent Into Discipline"*. Neither is permanently locked as sole tagline.

### ADR-003: Core Brand Identity [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Reference Image 2 (Gold P Monogram) is the sole visual brand mark. Reference Image 1 is visual north star for dark glassmorphic quality.

### ADR-004: Consequence Data Confidentiality Boundary [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Hiding consequences is enforced at the database RLS / data access boundary, NOT via frontend UI visibility toggles. Unrevealed payload data (`is_revealed = false`) is omitted from client query results.

### ADR-005: Technology Stack Preferences [PROPOSED]
- **Status**: [PROPOSED]
- **Proposed Stack**: Next.js (App Router, TypeScript), Tailwind CSS, Framer Motion, Supabase (PostgreSQL + RLS + Auth), Zod validation, Vercel deployment.

### ADR-006: Threat Model Architecture [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Define explicit Threat Matrix (`docs/THREAT_MODEL.md`) covering 8 threat actors, attack surfaces, security boundaries, mitigations, and required future test contracts.

### ADR-007: Integration Token Security Lifecycle [PROPOSED]
- **Status**: [PROPOSED]
- **Decision**: Integration tokens are encrypted at rest and accessible only to server-side sync handlers. Application-level token encryption and key rotation strategy are marked [PROPOSED] / [UNDECIDED] to avoid premature lock-in during V0.

### ADR-008: Mandatory Security Test Mapping [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Map all 16 security requirement scenarios to `FUTURE TEST — REQUIRED BEFORE FEATURE COMPLETION` entries in `docs/TESTING.md`.

### ADR-009: Phase 2A Core Domain Schema & Cross-User RLS Defense [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Migrate `goals`, `projects`, and `tasks` domain tables. Enforce strict database-level RLS policies requiring `auth.uid() = user_id`. Validate parent entity ownership (`goal_id`/`project_id`) via RLS subqueries to prevent cross-user resource hijacking. Protect trusted lifecycle fields (`completed_at`, `missed_at`) via PostgreSQL trigger `enforce_task_trusted_fields()`.

### ADR-010: Task Trusted Field Protection Hardening & Real DB Adversarial Verification [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Adversarial verification on the real Supabase PostgreSQL database revealed that `protect_task_trusted_fields` trigger was attached only `BEFORE UPDATE`, leaving `INSERT` vulnerable to timestamp forgery. The trigger was remediated to `BEFORE INSERT OR UPDATE ON public.tasks`, enforcing field immutability for both `INSERT` and `UPDATE` operations from non-`service_role` clients. All 18 adversarial security tests (RLS CRUD matrix, cross-user parent linkage attacks, forged user_id, client timestamp forgery, and anonymous access) passed against the real database.

### ADR-011: Goal Vertical Slice Implementation Architecture [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Implement the Goal vertical slice end-to-end (`Database -> Server Data Access -> Server Actions -> Validation -> UI Components -> Pages`). Goal CRUD mutations (`createGoalAction`, `updateGoalAction`, `archiveGoalAction`, `deleteGoalAction`) extract `user_id` strictly from the server-side Supabase auth session. Client-side input validation uses Zod (`createGoalSchema`, `updateGoalSchema`) for UX, while PostgreSQL RLS (`auth.uid() = user_id`) serves as the immutable security boundary. Verified via real database integration & unit test suites (`tests/goals-validation.test.ts`, `tests/adversarial-rls-audit.sql`).

### ADR-012: Project Vertical Slice & Goal Ownership Authorization Architecture [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Implement the Projects vertical slice (`Database -> Server Data Access -> Server Actions -> Zod Validation -> UI Components -> Route Pages`). Projects support optional association with user-owned Goals or independent status (`goal_id` optional). Server actions (`createProjectAction`, `updateProjectAction`, `archiveProjectAction`, `deleteProjectAction`) enforce double-layer authorization: 1) derive `user.id` strictly from server auth session; 2) verify that provided `goal_id` belongs to the authenticated user before executing insertion or update. Database PostgreSQL RLS policy (`WITH CHECK (goal_id IS NULL OR EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid())))`) serves as the authoritative security boundary blocking cross-user parent goal linkage attacks even if UI or server validation is bypassed. Verified via real Supabase database adversarial audit and Zod unit tests (`tests/projects-validation.test.ts`, `tests/adversarial-rls-audit.sql`).

### ADR-013: Task Vertical Slice & Parent Entity Authorization Architecture [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Implement the Tasks & Commitments vertical slice (`Database -> Server Data Access -> Server Actions -> Zod Validation -> UI Components -> Route Pages`). Tasks support optional association with user-owned Goals (`goal_id`) and/or user-owned Projects (`project_id`), or independent operation. Server actions (`createTaskAction`, `updateTaskAction`, `archiveTaskAction`, `deleteTaskAction`) derive `user.id` strictly from the server auth session and independently verify that provided `goal_id` and `project_id` belong to the authenticated user. PostgreSQL RLS policies on `public.tasks` enforce parent entity ownership subquery checks for both `INSERT` and `UPDATE` operations. Direct client setting or update of trusted lifecycle fields (`completed_at`, `missed_at`) is prohibited by database trigger `enforce_task_trusted_fields()`. Verified via real Supabase database adversarial audit and Zod unit tests (`tests/tasks-validation.test.ts`, `tests/adversarial-rls-audit.sql`).

### ADR-014: Deadline & Timezone Engine Architecture [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Implement deterministic, timezone-aware temporal evaluation for PACT Tasks (`src/lib/time.ts`). Key architectural guarantees:
  1. **UTC Storage Invariance**: Stored timestamps represent absolute UTC instants in `public.tasks.deadline_at` (`TIMESTAMPTZ`). User profile timezone changes alter local display representation only without modifying the underlying UTC instant.
  2. **Canonical IANA Timezone Validation**: Require full IANA identifiers (e.g. `Asia/Kolkata`, `America/New_York`, `Europe/London`, `UTC`). Reject non-canonical 3-letter abbreviations (`IST`, `PST`, `EST`).
  3. **Temporal Boundary Evaluation**: `isDeadlineReached(deadlineAt, clock)` performs exact 1-second boundary checks (`now >= deadlineAt`).
  4. **DST Spring-Forward & Fall-Back Handling**: `localToUtc()` flags nonexistent spring-forward local wall-clock times (`isNonexistent = true`) and detects ambiguous fall-back local wall-clock times (`isAmbiguous = true`).
  5. **Injected TestClock Abstraction**: Pure temporal methods accept an optional `Clock` dependency, enabling deterministic unit testing without system clock flakiness.
  6. **Phase 2F Boundary Isolation**: Pure temporal engine answers temporal evaluation questions without triggering business state transitions (`completed_at`, `missed_at`), keeping execution lifecycle strictly isolated for Phase 2F. Verified via unit test suite (`tests/temporal-engine.test.ts`).

### ADR-015: Authoritative Task Lifecycle State Machine & Concurrency Strategy [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Implement server/database authoritative lifecycle execution for Tasks (`complete_task` and `mark_task_missed` RPC functions). Key architectural guarantees:
  1. **Database-Authoritative Execution**: Task completion (`complete_task`) and missed transitions (`mark_task_missed`) execute inside PostgreSQL `SECURITY DEFINER` stored procedures. Client attempts to directly set `status = 'completed'` or `status = 'missed'` or alter `completed_at` / `missed_at` via direct REST/SQL queries are blocked by hardened trigger `enforce_task_trusted_fields()`.
  2. **Row Locking & Race Safety**: Both RPC functions lock the target task row via `SELECT ... FOR UPDATE`, ensuring atomic evaluation and absolute race condition protection for concurrent requests.
  3. **Temporal Integration**: Deadline expiration (`transaction_timestamp() >= deadline_at`) is evaluated inside the locked transaction using Phase 2E temporal semantics. Completion of expired tasks returns `DEADLINE_REACHED`.
  4. **Idempotency & Terminal States**: Repeated completion calls return `ALREADY_COMPLETED` while preserving original `completed_at`. Missed tasks cannot be completed (`ALREADY_MISSED`). Completed tasks cannot be marked missed (`ALREADY_COMPLETED`).
  5. **Pure GET Reads**: Data-access functions (`getTasks()`, `getTaskById()`) remain 100% pure reads with zero hidden side-effect writes. Verified against real remote Supabase PostgreSQL database (`tests/adversarial-rls-audit.sql`).



