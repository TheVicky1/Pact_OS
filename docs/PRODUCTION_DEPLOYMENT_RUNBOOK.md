# PACT OS — Production Deployment Runbook & Release Execution Plan

**Document Version:** 1.0.0  
**Target Release:** PACT OS v1.0 Production  
**Classification:** Operational Guide & Production Standard  
**Last Verified:** September 11, 2026  

---

## 1. Prerequisites

Before deploying PACT OS to production, ensure you have access to:
1. **GitHub / Git Repository**: Access to push the certified local `main` branch to the production repository.
2. **Supabase Account & Project**: A fresh or designated production Supabase project (PostgreSQL 15+).
3. **Vercel Account & Team**: A Vercel project linked to the production repository with Node.js 20+ runtime.
4. **Google Cloud Console Project** *(Optional, for Google Calendar sync)*: Configured OAuth 2.0 Client Credentials.
5. **Resend Account** *(Optional, for transactional email alerts)*: Configured API Key and verified sending domain.

---

## 2. Required Environment Variables

All environment variables must be configured in Vercel Project Settings (Production Environment) and in Supabase settings where applicable.

### A. Core Application (Public Client Variables)
| Variable Name | Environment | Description | Example |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Production | Canonical public URL of the deployed application | `https://pact.yourdomain.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production | Supabase REST API & Auth endpoint URL | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production | Supabase anon / publishable public key | `eyJhbGciOi...` |

### B. Core Server-Only Secrets (NEVER Expose to Client)
| Variable Name | Environment | Description | Sensitivity |
| :--- | :---: | :--- | :---: |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Supabase service-role secret key (used for autonomous background deadline sweeper across all users) | **CRITICAL** |
| `CRON_SECRET` | Server Only | 32+ character random secret token for timing-safe `Bearer` authorization on `/api/cron/sweep-deadlines` | **CRITICAL** |

### C. Optional Integration Credentials (Server Only)
| Variable Name | Environment | Description | Required When |
| :--- | :---: | :--- | :--- |
| `GOOGLE_CLIENT_ID` | Server Only | Google Cloud OAuth 2.0 Web Client ID | Google Calendar Sync enabled |
| `GOOGLE_CLIENT_SECRET` | Server Only | Google Cloud OAuth 2.0 Client Secret | Google Calendar Sync enabled |
| `RESEND_API_KEY` | Server Only | Resend REST API Key for email notifications | Email channel enabled |

---

## 3. Supabase Production Setup

1. **Create Production Supabase Project**:
   - Region: Select region closest to your users (e.g. `ap-south-1` for India or `us-east-1` for US).
   - Database Password: Generate a high-entropy 32-character password.
2. **Retrieve API Credentials**:
   - Project Settings → API:
     - Copy **Project URL** → Set as `NEXT_PUBLIC_SUPABASE_URL`.
     - Copy **anon public key** → Set as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
     - Copy **service_role secret key** → Set as `SUPABASE_SERVICE_ROLE_KEY`.

---

## 4. Sequential Database Migration Procedure

Apply all 20 migrations in `supabase/migrations/` sequentially via Supabase CLI (`supabase db push`) or by executing each file in order in the Supabase SQL Editor:

```bash
# Using Supabase CLI:
supabase link --project-ref <your-project-ref>
supabase db push
```

### Migration Checklist & Verification:

| Step | Migration File | Purpose | Destructive? | Downtime? |
| :---: | :--- | :--- | :---: | :---: |
| 1 | `20260906000000_create_profiles_table.sql` | Creates `profiles` table & auto-trigger on `auth.users` | No | None |
| 2 | `20260907000000_create_core_domain_tables.sql` | Creates `goals`, `projects`, `tasks` with RLS | No | None |
| 3 | `20260907010000_task_lifecycle_engine.sql` | State machine & `complete_task_with_lock` RPC | No | None |
| 4 | `20260907020000_accountability_foundation.sql` | `consequence_definitions` & `task_accountability_commitments` | No | None |
| 5 | `20260907030000_commitment_assignment_engine.sql` | Assignment triggers & immutable snapshot enforcement | No | None |
| 6 | `20260907040000_consequence_activation_engine.sql` | Activation triggers on task miss | No | None |
| 7 | `20260908000000_accountability_resolution_engine.sql` | Sessions, waivers, audit events, resolution RPCs | No | None |
| 8 | `20260908010000_accountability_hardening_and_edge_cases.sql` | Partial unique indexes, weekly waiver limits | No | None |
| 9 | `20260909000000_create_calendar_events.sql` | Creates `calendar_events` table for day planner | No | None |
| 10 | `20260910000000_create_finance_tables.sql` | Creates integer-cents `finance_categories` & transactions | No | None |
| 11 | `20260911000000_deadline_sweeper_engine.sql` | `sweep_expired_tasks_and_commitments` sweeper RPC | No | None |
| 12 | `20260911010000_create_notifications_table.sql` | Creates `notifications` & `notification_channel_configs` | No | None |
| 13 | `20260911020000_google_calendar_sync.sql` | Creates `google_calendar_sync_states` table | No | None |
| 14 | `20260911030000_external_proof_of_work.sql` | Creates `external_provider_integrations` & proof evidence | No | None |
| 15 | `20260911040000_financial_discipline.sql` | Creates `finance_recurring_transactions` & `finance_budgets` | No | None |
| 16 | `20260911050000_user_onboarding.sql` | Onboarding profile fields & category seeding triggers | No | None |
| 17 | `20260911060000_production_hardening_and_cron_schedule.sql` | Index optimization & optional `pg_cron` jobs | No | None |
| 18 | `20260911070000_focus_sessions_engine.sql` | Creates `focus_sessions` table with RLS & status rules | No | None |
| 19 | `20260911080000_habits_and_routines_engine.sql` | Creates `habits`, `habit_occurrences`, routines tables | No | None |
| 20 | `20260911090000_weekly_reviews_engine.sql` | Creates `weekly_reviews` table & uniqueness constraint | No | None |

---

## 5. Authentication & OAuth Configuration

### A. Supabase Auth Configuration
In Supabase Dashboard → Authentication → URL Configuration:
1. **Site URL**: Set to `https://pact.yourdomain.com` (or `https://<your-app>.vercel.app`).
2. **Redirect URLs (Allow List)**:
   - `https://pact.yourdomain.com/auth/callback`
   - `https://pact.yourdomain.com/**`
   - `http://localhost:3000/auth/callback` *(for development)*

### B. Google OAuth Configuration *(Optional, for Google Calendar)*
In Google Cloud Console → APIs & Services → Credentials:
1. Create **OAuth 2.0 Client ID** (Web application).
2. **Authorized JavaScript Origins**:
   - `https://pact.yourdomain.com`
3. **Authorized Redirect URIs**:
   - `https://pact.yourdomain.com/auth/callback`
   - `https://<project-ref>.supabase.co/auth/v1/callback`
4. Copy Client ID & Client Secret to Vercel Environment Variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

---

## 6. Vercel Deployment Configuration

1. **Project Linking**: Link repository to Vercel.
2. **Framework Preset**: `Next.js`
3. **Build & Development Settings**:
   - Build Command: `next build` (or `npm run build`)
   - Install Command: `npm install`
   - Node.js Version: `20.x` or `22.x`
4. **Configure Environment Variables**: Enter all 5 core variables (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) in Vercel Project Settings.
5. **Deploy**: Trigger initial production deployment.

---

## 7. Cron Automation Configuration

PACT OS requires periodic execution of the deadline sweeper to transition expired tasks, activate consequences, and generate recurring transactions.

### Method 1: Vercel Cron (Configured by Default)
- `vercel.json` schedules `/api/cron/sweep-deadlines` every minute (`* * * * *`).
- Vercel automatically sends the `Authorization: Bearer <CRON_SECRET>` header if `CRON_SECRET` is set in Vercel project settings.

### Method 2: Supabase `pg_cron` (In-Database Alternative)
If running self-hosted or using Supabase `pg_cron`:
```sql
-- Included in migration 20260911060000_production_hardening_and_cron_schedule.sql
SELECT cron.schedule(
  'pact-sweeper-every-minute',
  '* * * * *',
  $$ SELECT sweep_expired_tasks_and_commitments(50); $$
);
```

---

## 8. Deployment Sequence Checklist

```
[ ] 1. Apply Supabase migrations (1 through 20) in order.
[ ] 2. Verify RLS is active on all 24 tables.
[ ] 3. Set Auth Redirect URLs in Supabase Dashboard.
[ ] 4. Add all 5 required environment variables to Vercel.
[ ] 5. Trigger Vercel Production Build.
[ ] 6. Confirm Build succeeds with zero errors.
[ ] 7. Perform post-deployment smoke test suite.
[ ] 8. Verify Cron Sweeper execution logs.
```

---

## 9. 24-Point Production Smoke Test Plan

Execute this manual smoke test immediately after deployment:

| Test # | Workflow | Expected Outcome | Failure Indicator |
| :---: | :--- | :--- | :--- |
| **1** | User Sign Up | Account created in Supabase Auth, redirected to onboarding | Error toast, redirect loop |
| **2** | User Sign In | Authenticated session created, redirected to `/app` | Invalid credentials error on valid login |
| **3** | Onboarding Flow | 3-step profile setup completes, default categories seeded | Incomplete step state, blank profile |
| **4** | Create Goal | Goal created and displayed in `/app/goals` | Goal not appearing in list |
| **5** | Create Project | Project linked to Goal, accent color displayed | Dropdown unpopulated, save fails |
| **6** | Create Task | Task created with deadline in user's timezone | Time offset discrepancy, task missing |
| **7** | Complete Task | Task marks completed via `complete_task_with_lock` | Status remains pending |
| **8** | Accountability Commitment | Assign consequence definition to task; remains confidential | Snapshot leaked before activation |
| **9** | Notification Drawer | Notification bell indicates unread count; drawer opens | Drawer empty or count desynced |
| **10** | Global Command Center | `Cmd+K` opens palette, search queries results, `Esc` closes | Palette unresponsive, cross-tenant results |
| **11** | Daily Calendar Planning | Calendar time-blocks render & create directly in Daily Calendar on `/app` | Overlapping blocks, modal failure |
| **12** | Finance Transaction | Integer-cents transaction recorded in `/app/finance` | Floating-point rounding error, decimal drift |
| **13** | Recurring Transaction | Recurring rule saved, next occurrence calculated | Next occurrence missing or invalid date |
| **14** | Budget Tracking | Category budget progress bar displays accurate % | Division by zero error on 0 target |
| **15** | Habit Creation | Habit scheduled for specific days in `/app/habits` | Habit schedule days desynced |
| **16** | Habit Completion | Check off habit for today; streak increments | Streak broken on non-scheduled day |
| **17** | Daily Routine | Start routine, check off ordered items | Items disorder or progress stalls |
| **18** | Focus Timer | Start countdown session in `/app/focus`, complete timer | Timer drift, sound synthesis failure |
| **19** | Weekly Review | Sunday ritual banner surfaces; complete 5-step review | Step progress loss, metrics NaN |
| **20** | Deep-Link URL State | Filter tasks by priority in URL (`?priority=urgent`), reload | Filter lost on reload, hydration error |
| **21** | Bulk Task Operations | Select multiple tasks, reschedule / complete via toolbar | Partial failures silent, limit > 50 allowed |
| **22** | Account Data Export | Download ZIP from `/app/settings`; verify JSON & CSVs | Archive corrupt, secrets in CSV |
| **23** | Timezone Change | Update timezone in `/app/settings`; verify deadline display | Instant shift in stored UTC timestamps |
| **24** | Cron Sweeper Test | Invoke `/api/cron/sweep-deadlines` with Bearer secret | 401 Unauthorized, unhandled exception |

---

## 10. Monitoring & Observability Checklist

After deployment, monitor the following metrics:
1. **Vercel Runtime Logs**: Check for uncaught exceptions in server actions or API routes.
2. **Cron Execution Logs**: Verify `/api/cron/sweep-deadlines` returns HTTP 200 every minute with operational JSON payload (`{ success: true, processed_count, duration_ms }`).
3. **Supabase Database Health**:
   - Connection pool utilization (PgBouncer).
   - Slow query logs (queries exceeding 100ms).
   - Database disk space and RAM utilization.

---

## 11. Rollback & Disaster Recovery Procedure

### A. Application Rollback (Vercel)
1. Go to Vercel Dashboard → Deployments.
2. Find the previous stable deployment.
3. Click `...` → **Instant Rollback**.
4. Traffic redirects to the previous build in < 5 seconds.

### B. Database Rollback
- All 20 migrations are additive (non-destructive).
- If a specific migration requires rollback, execute the corresponding `DROP TABLE` or `DROP FUNCTION` statements in reverse order.
- Nightly automated backups are maintained in Supabase (Point-In-Time Recovery / WAL-G).

---

## 12. Secret Rotation Procedure

If any production secret is compromised:
1. **Supabase Anon / Service-Role Key**:
   - Supabase Dashboard → Settings → API → **Generate New Secret Keys**.
   - Update Vercel environment variables immediately and redeploy.
2. **`CRON_SECRET`**:
   - Generate a new 32-character random string.
   - Update `CRON_SECRET` in Vercel environment variables and redeploy.
3. **Google OAuth Client Secret**:
   - Google Cloud Console → Credentials → Reset Client Secret.
   - Update `GOOGLE_CLIENT_SECRET` in Vercel and redeploy.

---

## 13. Known Limitations & Classification

| Component | Status | Classification |
| :--- | :---: | :--- |
| **Core OS & All 6 Phases** | Ready | `VERIFIED` |
| **Offline Verification Matrix (34 Suites)** | Passed | `VERIFIED` |
| **Next.js 16 Production Build** | Passed | `VERIFIED` |
| **Security & Secret Scanner** | Clean | `VERIFIED` |
| **Live Google OAuth Exchange** | Ready for keys | `NOT LIVE VERIFIED — REQUIRES PRODUCTION CREDENTIALS` |
| **Live GitHub / LeetCode / Codeforces API** | Ready for keys | `NOT LIVE VERIFIED — REQUIRES PRODUCTION CREDENTIALS` |
| **Live Resend Email Delivery** | Ready for key | `NOT LIVE VERIFIED — REQUIRES PRODUCTION CREDENTIALS` |
