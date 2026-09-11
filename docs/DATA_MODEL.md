# PACT — Relational Data Model & Database Architecture

This document specifies the canonical PostgreSQL database schema for PACT as implemented across the 20 migrations in `supabase/migrations/`.

---

## 1. Relational Schema Overview

```
auth.users (Supabase Auth)
  │
  └── profiles (1:1)
        ├── goals (1:N)
        │     └── projects (1:N)
        │           └── tasks (1:N)
        │                 ├── commitments (1:1)
        │                 │     ├── consequences (1:1)
        │                 │     ├── external_proof_submissions (1:N)
        │                 │     └── commitment_waivers (1:N)
        │                 └── calendar_events (1:1 or 1:N)
        │
        ├── finance_accounts (1:N)
        ├── finance_categories (1:N)
        ├── finance_transactions (1:N)
        ├── finance_budgets (1:N)
        ├── recurring_transactions (1:N)
        │
        ├── focus_sessions (1:N)
        │
        ├── habits (1:N)
        │     └── habit_logs (1:N)
        ├── daily_routines (1:N)
        │     └── routine_items (1:N)
        │
        ├── weekly_reviews (1:N)
        │
        ├── notifications (1:N)
        ├── user_integrations (1:N)
        └── user_onboarding_state (1:1)
```

---

## 2. Core Entity Definitions

### 2.1 Identity & User Profiles
#### Table: `profiles`
- `id`: `uuid` (PRIMARY KEY, REFERENCES `auth.users(id)` ON DELETE CASCADE)
- `full_name`: `text` (NULLABLE)
- `timezone`: `text` (NOT NULL, DEFAULT `'UTC'`)
- `focus_areas`: `text[]` (DEFAULT `ARRAY[]::text[]`)
- `daily_reflection_time`: `time` (DEFAULT `'21:00:00'`)
- `weekly_review_day`: `int` (DEFAULT `0` — Sunday)
- `created_at` / `updated_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **RLS**: User can view and update own profile (`auth.uid() = id`).

---

### 2.2 Goals, Projects & Tasks
#### Table: `goals`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `title`: `text` (NOT NULL)
- `description`: `text` (NULLABLE)
- `target_date`: `timestamptz` (NULLABLE)
- `status`: `text` (`active`, `completed`, `archived`)
- `progress_percentage`: `int` (DEFAULT `0`)

#### Table: `projects`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `goal_id`: `uuid` (NULLABLE, REFERENCES `goals(id)` ON DELETE SET NULL)
- `title`: `text` (NOT NULL)
- `description`: `text` (NULLABLE)
- `color_accent`: `text` (DEFAULT `'#d4af37'`)
- `status`: `text` (`active`, `completed`, `paused`, `archived`)

#### Table: `tasks`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `project_id`: `uuid` (NULLABLE, REFERENCES `projects(id)` ON DELETE SET NULL)
- `goal_id`: `uuid` (NULLABLE, REFERENCES `goals(id)` ON DELETE SET NULL)
- `title`: `text` (NOT NULL)
- `description`: `text` (NULLABLE)
- `priority`: `text` (`low`, `medium`, `high`, `urgent`, DEFAULT `'medium'`)
- `scheduled_start`: `timestamptz` (NULLABLE)
- `scheduled_end`: `timestamptz` (NULLABLE)
- `deadline_at`: `timestamptz` (NULLABLE)
- `estimated_minutes`: `int` (NULLABLE)
- `actual_minutes`: `int` (NULLABLE)
- `status`: `text` (`pending`, `in_progress`, `completed`, `missed`, `archived`)
- `completed_at` / `missed_at`: `timestamptz` (**TRUSTED FIELDS — Server Evaluated**)

---

### 2.3 Accountability, Commitments & Consequences
#### Table: `commitments`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `task_id`: `uuid` (NOT NULL, REFERENCES `tasks(id)` ON DELETE CASCADE)
- `status`: `text` (`active`, `completed`, `breached`, `waived`, `resolved`)
- `grace_period_minutes`: `int` (DEFAULT `0`)
- `created_at` / `resolved_at`: `timestamptz`

#### Table: `consequences`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `commitment_id`: `uuid` (NOT NULL, REFERENCES `commitments(id)` ON DELETE CASCADE)
- `consequence_type`: `text` (`written_reflection`, `public_declaration`, `emergency_task`, `financial_pledge`)
- `payload`: `jsonb` (Encrypted / masked payload)
- `is_activated`: `boolean` (DEFAULT `false`)
- `activated_at`: `timestamptz` (NULLABLE)

#### Table: `external_proof_submissions`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `commitment_id`: `uuid` (NOT NULL, REFERENCES `commitments(id)` ON DELETE CASCADE)
- `provider`: `text` (`github`, `leetcode`, `codeforces`)
- `proof_type`: `text` (`commit`, `pr`, `problem_submission`, `contest`)
- `verification_status`: `text` (`verified`, `failed`, `retry_pending`)
- `raw_response`: `jsonb`

---

### 2.4 Financial Discipline Ledger
#### Table: `finance_transactions`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `category_id`: `uuid` (NULLABLE, REFERENCES `finance_categories(id)`)
- `amount_cents`: `bigint` (NOT NULL) — *Integer cents to prevent float rounding*
- `type`: `text` (`income`, `expense`, `transfer`)
- `description`: `text` (NOT NULL)
- `transaction_date`: `date` (NOT NULL)

#### Table: `finance_budgets`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `category_id`: `uuid` (NOT NULL, REFERENCES `finance_categories(id)`)
- `limit_cents`: `bigint` (NOT NULL)
- `period`: `text` (`monthly`, `weekly`, `yearly`, DEFAULT `'monthly'`)

---

### 2.5 Focus Sessions, Habits & Reviews
#### Table: `focus_sessions`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `task_id`: `uuid` (NULLABLE, REFERENCES `tasks(id)`)
- `target_duration_minutes`: `int` (NOT NULL)
- `actual_duration_seconds`: `int` (NOT NULL)
- `status`: `text` (`completed`, `interrupted`, `abandoned`)
- `started_at` / `ended_at`: `timestamptz` (NOT NULL)

#### Table: `habits` & `habit_logs`
- `habits.id`: `uuid` (PRIMARY KEY)
- `habits.frequency`: `text` (`daily`, `weekdays`, `weekends`, `custom`)
- `habits.target_per_week`: `int` (DEFAULT `7`)
- `habit_logs.id`: `uuid` (PRIMARY KEY)
- `habit_logs.habit_id`: `uuid` (REFERENCES `habits(id)` ON DELETE CASCADE)
- `habit_logs.log_date`: `date` (NOT NULL)
- `habit_logs.completed`: `boolean` (DEFAULT `true`)

#### Table: `weekly_reviews`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `week_start_date`: `date` (NOT NULL)
- `week_end_date`: `date` (NOT NULL)
- `status`: `text` (`draft`, `completed`)
- `wins_summary`: `text` (NULLABLE)
- `reflection_answers`: `jsonb` (DEFAULT `'{}'::jsonb`)
- `metrics_snapshot`: `jsonb` (DEFAULT `'{}'::jsonb`)

---

## 3. Database Triggers & Automations

1. **`trg_enforce_task_trusted_fields`**: Prevents direct client manipulation of `completed_at` and `missed_at`.
2. **`trg_enforce_commitment_status_transitions`**: Strictly validates state transitions in the accountability engine.
3. **`trg_enforce_weekly_waiver_quota`**: Blocks creation of more than 2 commitment waivers per rolling 7-day window.
4. **`trg_update_budget_spent`**: Recalculates category monthly totals upon transaction insert/update/delete.
5. **`pg_cron` Sweep Schedule**: Executes `public.sweep_overdue_deadlines()` every minute.

---

## 4. Indexing & Query Optimization

| Table | Index Columns | Purpose |
| :--- | :--- | :--- |
| `tasks` | `(user_id, status, scheduled_start)` | Day/week planning query acceleration |
| `tasks` | `(user_id, deadline_at)` | Fast deadline sweeping lookup |
| `commitments` | `(user_id, status)` | Active accountability filtering |
| `finance_transactions` | `(user_id, transaction_date DESC)` | Financial ledger ordering & analytics |
| `focus_sessions` | `(user_id, started_at DESC)` | Focus metrics & history |
| `habit_logs` | `(habit_id, log_date)` | Daily habit completion lookup & streak math |
| `notifications` | `(user_id, is_read, created_at DESC)` | Unread notification tray fetch |
