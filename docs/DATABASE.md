# PACT — Relational Data Model & Database Architecture

## 1. Relational Schema Overview [PROPOSED]

> [!NOTE]
> This schema represents the conceptual V0 database model. Tables will NOT be migrated during Phase 0.

```
profiles (1:1 with auth.users)
  │
  ├── goals (1:N)
  │     └── projects (1:N)
  │           └── tasks (1:N)
  │                 ├── task_instances (1:N)
  │                 └── consequences (1:1 or 1:N)
  │
  ├── expenses (1:N)
  │     └── expense_categories (N:1)
  │
  ├── notifications (1:N)
  │
  └── integration_accounts (1:N)
        └── integration_snapshots (1:N)
```

---

## 2. Entity Definitions & Security Attributes [PROPOSED]

### Table: `profiles`
- `id`: `uuid` (PRIMARY KEY, REFERENCES `auth.users(id)` ON DELETE CASCADE)
- `full_name`: `text` (NULLABLE)
- `timezone`: `text` (NOT NULL, DEFAULT `'UTC'`, e.g., `'America/New_York'`)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- `updated_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & RLS**: 1:1 with authenticated user; user can read/update own profile.

### Table: `goals` [CONFIRMED / MIGRATED]
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `title`: `text` (NOT NULL)
- `description`: `text` (NULLABLE)
- `target_date`: `timestamptz` (NULLABLE)
- `status`: `text` (ENUM: `'active'`, `'completed'`, `'archived'`, DEFAULT `'active'`)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- `updated_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & RLS**: Owned by `user_id`; strictly isolated by RLS.

### Table: `projects` [CONFIRMED / MIGRATED]
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `goal_id`: `uuid` (NULLABLE, REFERENCES `goals(id)` ON DELETE SET NULL)
- `title`: `text` (NOT NULL)
- `description`: `text` (NULLABLE)
- `color_accent`: `text` (NULLABLE)
- `status`: `text` (ENUM: `'active'`, `'completed'`, `'paused'`, `'archived'`, DEFAULT `'active'`)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- `updated_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & RLS**: Owned by `user_id`; strictly isolated by RLS with cross-user parent goal validation.

### Table: `tasks` (Commitments) [CONFIRMED / MIGRATED]
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `project_id`: `uuid` (NULLABLE, REFERENCES `projects(id)` ON DELETE SET NULL)
- `goal_id`: `uuid` (NULLABLE, REFERENCES `goals(id)` ON DELETE SET NULL)
- `title`: `text` (NOT NULL)
- `description`: `text` (NULLABLE)
- `priority`: `text` (ENUM: `'low'`, `'medium'`, `'high'`, `'urgent'`, DEFAULT `'medium'`)
- `deadline_at`: `timestamptz` (NOT NULL)
- `status`: `text` (ENUM: `'pending'`, `'in_progress'`, `'completed'`, `'missed'`, `'archived'`, DEFAULT `'pending'`)
- `completed_at`: `timestamptz` (NULLABLE, **TRUSTED FIELD — Server Controlled**)
- `missed_at`: `timestamptz` (NULLABLE, **TRUSTED FIELD — Server Controlled**)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- `updated_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & RLS**: Owned by `user_id`; RLS prevents cross-user access and cross-user parent references (`goal_id`, `project_id`). Trusted fields protected via `enforce_task_trusted_fields` DB trigger.

### Table: `consequences` (Accountability Payload)
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `task_id`: `uuid` (NOT NULL, REFERENCES `tasks(id)` ON DELETE CASCADE)
- `consequence_type`: `text` (NOT NULL)
- `encrypted_payload`: `text` (SENSITIVE — Protected at DB boundary)
- `activated_at`: `timestamptz` (NULLABLE, **TRUSTED FIELD**)
- `is_revealed`: `boolean` (NOT NULL, DEFAULT `false`, **TRUSTED FIELD — Server Controlled**)
- **Ownership & RLS**: Data payload filtered out at DB boundary until `is_revealed = true`.

### Table: `expense_categories`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `name`: `text` (NOT NULL)
- `color_hex`: `text` (NULLABLE)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & RLS**: Owned by `user_id`; strictly isolated by RLS.

### Table: `expenses`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `category_id`: `uuid` (NULLABLE, REFERENCES `expense_categories(id)` ON DELETE SET NULL)
- `amount`: `numeric(12, 2)` (NOT NULL)
- `description`: `text` (NOT NULL)
- `expense_date`: `date` (NOT NULL, DEFAULT `CURRENT_DATE`)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & RLS**: Financial data owned by `user_id`; strictly protected by RLS.

### Table: `consequence_definitions` [CONFIRMED / MIGRATED]
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `title`: `text` (NOT NULL)
- `description`: `text` (NULLABLE)
- `consequence_type`: `text` (ENUM: `'personal_restriction'`, `'extra_responsibility'`, `'self_improvement'`, `'reflection'`, `'financial_declaration'`, `'custom'`)
- `action_statement`: `text` (NOT NULL)
- `is_enabled`: `boolean` (NOT NULL, DEFAULT `true`)
- `is_default`: `boolean` (NOT NULL, DEFAULT `false`)
- `priority`: `integer` (NOT NULL, DEFAULT `0`)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- `updated_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & RLS**: Owned by `user_id`; strictly isolated by RLS. Authenticated users can CRUD only their own consequence definitions.

### Table: `user_accountability_preferences` [CONFIRMED / MIGRATED]
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, UNIQUE, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `default_consequence_id`: `uuid` (NULLABLE, REFERENCES `consequence_definitions(id)` ON DELETE SET NULL)
- `auto_apply_default`: `boolean` (NOT NULL, DEFAULT `false`)
- `is_enabled`: `boolean` (NOT NULL, DEFAULT `true`)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- `updated_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & RLS**: 1:1 per user (`user_id` UNIQUE). RLS ensures users access only their own preference record and prevents linking a foreign user's consequence definition as `default_consequence_id`.

### Table: `task_accountability_commitments` [CONFIRMED / MIGRATED]
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `task_id`: `uuid` (NOT NULL, UNIQUE, REFERENCES `tasks(id)` ON DELETE CASCADE)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `source_consequence_id`: `uuid` (NULLABLE, REFERENCES `consequence_definitions(id)` ON DELETE SET NULL)
- `consequence_snapshot`: `jsonb` (NOT NULL, contains `{ title, consequence_type, action_statement, description, verification_type, verification_config }`)
- `commitment_status`: `text` (ENUM: `'committed'`, `'activated'`, `'fulfilled'`, `'waived'`, DEFAULT `'committed'`)
- `activated_at`: `timestamptz` (NULLABLE)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- `updated_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & RLS**: 1:1 with `tasks`. Protected by RLS (`auth.uid() = user_id`). Direct client `UPDATE` or `DELETE` of commitment snapshot fields is blocked by DB trigger `protect_accountability_commitment_immutability()`.

### Table: `accountability_events` [CONFIRMED / MIGRATED]
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `task_id`: `uuid` (NOT NULL, REFERENCES `tasks(id)` ON DELETE CASCADE)
- `commitment_id`: `uuid` (NOT NULL, REFERENCES `task_accountability_commitments(id)` ON DELETE CASCADE)
- `event_type`: `text` (ENUM: `'activated'`, `'fulfilled'`, `'waived'`, `'resolved'`)
- `metadata`: `jsonb` (NULLABLE)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & Immutability**: Append-only log. RLS allows `SELECT` for owner. Direct client `INSERT`, `UPDATE`, and `DELETE` blocked by trigger `protect_accountability_events_immutability()`.

### Table: `accountability_verification_sessions` [CONFIRMED / MIGRATED]
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `commitment_id`: `uuid` (NOT NULL, REFERENCES `task_accountability_commitments(id)` ON DELETE CASCADE)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `started_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- `ended_at`: `timestamptz` (NULLABLE)
- `required_duration_seconds`: `integer` (NOT NULL, DEFAULT `0`)
- `actual_duration_seconds`: `integer` (NULLABLE)
- `status`: `text` (ENUM: `'started'`, `'completed'`, `'cancelled'`, `'expired'`, DEFAULT `'started'`)
- `evidence_note`: `text` (NULLABLE, max 5000 characters)
- `verification_metadata`: `jsonb` (NULLABLE)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- `updated_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Indexes & Constraints**: Partial unique index `uq_active_session_per_commitment` enforces at most one `started` session per commitment.
- **Ownership & Immutability**: RLS allows `SELECT` for owner. Direct client `INSERT`, `UPDATE`, and `DELETE` blocked by trigger `protect_accountability_sessions_immutability()`. Once completed, verification evidence and duration are immutable.

### Table: `accountability_waivers` [CONFIRMED / MIGRATED]
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `commitment_id`: `uuid` (NOT NULL, UNIQUE, REFERENCES `task_accountability_commitments(id)` ON DELETE CASCADE)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `task_id`: `uuid` (NOT NULL, REFERENCES `tasks(id)` ON DELETE CASCADE)
- `waived_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- `confirmation_token`: `text` (NOT NULL, validated server-side as `CONFIRM_WAIVER_V1`)
- `waiver_week_year`: `integer` (NOT NULL, ISO week year in user's timezone)
- `waiver_week_number`: `integer` (NOT NULL, ISO week number 1-53 in user's timezone)
- `waiver_count_in_week`: `integer` (NOT NULL, CHECK `1 <= waiver_count_in_week <= 3`)
- `metadata`: `jsonb` (NULLABLE)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & Immutability**: Append-only audit record. RLS allows `SELECT` for owner. Direct client mutation or deletion strictly prohibited by trigger `protect_accountability_waivers_immutability()`.

### Authoritative Resolution RPCs [CONFIRMED / MIGRATED]
- `public.start_accountability_session(p_commitment_id UUID)`: Creates session with snapshotted duration or resumes existing active session.
- `public.fulfill_accountability_session(p_session_id UUID, p_evidence_note TEXT)`: Validates real elapsed time against required duration, validates activity note, atomically marks session `completed` and commitment `fulfilled`, and records event.
- `public.cancel_accountability_session(p_session_id UUID)`: Cancels active session; commitment remains `activated`.
- `public.waive_accountability_commitment(p_commitment_id UUID, p_confirmation_token TEXT)`: Enforces 3-waivers/week quota calculated in user's profile timezone with row locking, records immutable waiver, and transitions commitment to `waived`.
- `public.fulfill_written_reflection(p_commitment_id UUID, p_reflection_text TEXT)`: Enforces minimum 20 characters, maximum 5000 characters, whitespace-trimmed reflection text, transitions commitment to `fulfilled`, and logs reflection audit metadata.
- `public.declare_accountability_fulfillment(p_commitment_id UUID, p_declaration_statement TEXT)`: Permits self-attestation only where explicitly allowed by definition, records `is_self_declaration = true` and `verified_objectively = false` in audit log, and marks commitment `fulfilled`.
- `public.fulfill_task_completion_commitment(p_commitment_id UUID, p_target_task_id UUID)`: Verifies another real PACT task owned by the user reached authoritative `completed` status, blocks circular self-reference, marks commitment `fulfilled`, and logs objective verification metadata.

### Hardened State Machine & Quota Triggers [CONFIRMED / MIGRATED]
- `trg_enforce_commitment_status_transitions` (`BEFORE UPDATE ON public.task_accountability_commitments`): Enforces legal state machine transitions (`committed -> activated -> fulfilled | waived`). Disallows direct fulfillment/waiver of un-activated commitments and locks terminal states (`fulfilled`, `waived`).
- `trg_enforce_weekly_waiver_quota` (`BEFORE INSERT ON public.accountability_waivers`): Table-level defense-in-depth trigger guaranteeing at most 3 waivers per user per calendar week.


---


## 3. Trusted Lifecycle Fields Strategy [VERIFIED AGAINST REAL DATABASE]

To prevent client timestamp manipulation:
- Fields marked as **TRUSTED FIELD** (`completed_at`, `missed_at`) CANNOT be set or modified via client `INSERT` or `UPDATE` calls.
- DB Trigger `protect_task_trusted_fields` (`BEFORE INSERT OR UPDATE ON public.tasks`) enforces strict immutability for non-`service_role` roles.
- Lifecycle state transitions (`pending` -> `completed` / `missed`) are intentionally deferred to Phase 2D/2E server actions and database functions.

---

## 4. Indexing & Foreign Key Integrity [CONFIRMED / MIGRATED]

- All foreign key columns (`user_id`, `project_id`, `goal_id`, `default_consequence_id`) are indexed to optimize join performance.
- Composite indexes on `(user_id, status)` and `(user_id, deadline_at)` accelerate dashboard queries and deadline background evaluators.
- Foreign keys use `ON DELETE CASCADE` for `user_id` -> `profiles(id)` and `ON DELETE SET NULL` for parent/reference relationships (`goal_id`, `project_id`, `default_consequence_id`) to preserve user configurations.
- **Phase 3 Milestone 1 Adversarial Audit**: Fully verified against the real remote Supabase PostgreSQL database. All cross-user CRUD attempts, cross-user default consequence linkages, forged user IDs, and anonymous access attempts were DENIED by RLS policies.

