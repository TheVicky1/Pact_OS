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

### Table: `goals`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `title`: `text` (NOT NULL)
- `description`: `text` (NULLABLE)
- `target_date`: `timestamptz` (NULLABLE)
- `status`: `text` (ENUM: `'active'`, `'completed'`, `'archived'`, DEFAULT `'active'`)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & RLS**: Owned by `user_id`; strictly isolated by RLS.

### Table: `projects`
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `goal_id`: `uuid` (NULLABLE, REFERENCES `goals(id)` ON DELETE SET NULL)
- `title`: `text` (NOT NULL)
- `color_accent`: `text` (NULLABLE)
- `status`: `text` (ENUM: `'active'`, `'completed'`, `'paused'`, DEFAULT `'active'`)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & RLS**: Owned by `user_id`; strictly isolated by RLS.

### Table: `tasks` (Commitments)
- `id`: `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE)
- `project_id`: `uuid` (NULLABLE, REFERENCES `projects(id)` ON DELETE SET NULL)
- `goal_id`: `uuid` (NULLABLE, REFERENCES `goals(id)` ON DELETE SET NULL)
- `title`: `text` (NOT NULL)
- `description`: `text` (NULLABLE)
- `priority`: `text` (ENUM: `'low'`, `'medium'`, `'high'`, `'urgent'`, DEFAULT `'medium'`)
- `deadline_at`: `timestamptz` (NOT NULL)
- `status`: `text` (ENUM: `'pending'`, `'in_progress'`, `'completed'`, `'missed'`, DEFAULT `'pending'`)
- `completed_at`: `timestamptz` (NULLABLE, **TRUSTED FIELD — Server Controlled**)
- `missed_at`: `timestamptz` (NULLABLE, **TRUSTED FIELD — Server Controlled**)
- `created_at`: `timestamptz` (NOT NULL, DEFAULT `now()`)
- **Ownership & RLS**: Owned by `user_id`; RLS prevents cross-user access. Trusted fields restricted from client UPDATEs.

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

---

## 3. Trusted Lifecycle Fields Strategy [CONFIRMED]

To prevent client timestamp manipulation:
- Fields marked as **TRUSTED FIELD** (`completed_at`, `missed_at`, `activated_at`, `is_revealed`) CANNOT be updated via standard client UPDATE calls.
- DB Triggers or Server Action API endpoints validate user identity, evaluate deadline condition, and set these fields using server clock (`now()`).

---

## 4. Indexing & Foreign Key Integrity [PROPOSED]

- All foreign key columns (`user_id`, `project_id`, `goal_id`, `task_id`, `category_id`) are indexed to optimize join performance.
- Composite indexes on `(user_id, status)` and `(user_id, deadline_at)` accelerate dashboard queries and deadline background evaluators.
