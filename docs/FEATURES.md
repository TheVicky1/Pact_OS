# PACT — Core Feature Inventory

## 1. Core V0 Product Areas [CONFIRMED]

The initial V0 product architecture encompasses 12 primary feature modules:

| # | Core Area | Status | V0 Scope Description |
|---|---|---|---|
| 1 | **Authentication** | [CONFIRMED] | Secure identity management via Supabase Auth (Email/Password, OAuth optional). Strict server-enforceable session security. |
| 2 | **Dashboard / Overview** | [CONFIRMED] | High-level situational command center providing daily context, progress metrics, timeline, and priority commitments. |
| 3 | **Tasks / Commitments** | [CONFIRMED] | Authoritative commitment tracking with status, priority, scheduling, project/goal associations, and server-controlled lifecycle timestamps. |
| 4 | **Planner** | [CONFIRMED] | Time-blocking and daily execution planner aligning tasks with specific time windows and timezone-aware daily boundaries. |
| 5 | **Projects** | [CONFIRMED] | Organizational containers grouping related tasks and commitments toward specific deliverables or outcomes. |
| 6 | **Goals** | [CONFIRMED] | Higher-level intentional targets containing or relating to multiple projects and measuring overall long-term direction. |
| 7 | **Accountability / Consequences** | [CONFIRMED] | Systems for handling missed commitments. Backend engine complete (Milestones 1–5: definitions, commitments, immutability, activation, verification sessions, multi-modal fulfillment, state machine invariants, weekly waiver quotas). Consequences remain hidden during normal use. |
| 8 | **Finance / Expense Tracking** | [CONFIRMED] | Personal expense logging with amount, description, category, default current date, and user-confirmed smart category suggestions. Strict privacy protection. |
| 9 | **Analytics** | [CONFIRMED] | Progress tracking, follow-through ratios, trend visualizations, and historical productivity metrics. |
| 10 | **Notifications** | [CONFIRMED] | Calm, non-intrusive reminder system for upcoming deadlines, plan reviews, and critical account events. |
| 11 | **Integrations** | [PROPOSED] | Modular sync connectors for external platforms (GitHub, Codeforces, LeetCode). Fully optional. |
| 12 | **Settings / Profile** | [CONFIRMED] | User profile management, timezone settings, notification preferences, integration management, and security settings. |

---

## 2. Phase 3 Accountability Engine Status [BACKEND COMPLETE]

Phase 3 establishes the backend/domain foundation for PACT's core principle: *"Turn intent into discipline."*
- **Milestone 1**: Domain foundation, user preferences, reusable consequence definitions, safety model, RLS.
- **Milestone 2**: Automatic assignment, multi-default deterministic resolution, committed snapshot immutability.
- **Milestone 3**: Authoritative consequence activation subscriber to `mark_task_missed`, atomic transactions, event log.
- **Milestone 4**: Resolution & verification engine, server-authoritative timed sessions, evidence notes, weekly waiver quota.
- **Milestone 5**: Edge cases & hardening, DB-level state machine invariants (`trg_enforce_commitment_status_transitions`), multi-modal fulfillment RPCs (`written_reflection`, `declaration`, `task_completion`), secondary waiver quota trigger (`trg_enforce_weekly_waiver_quota`), 103/103 real database adversarial checks passing.
- *UI/UX Phase*: Deferred to upcoming UI milestone.

---

## 2. Optional Integrations Breakdown [PROPOSED]

PACT supports up to three initial external integrations:
1. **GitHub**: Activity tracking, commit counts, PR contributions, issue resolutions.
2. **Codeforces**: Problem submission sync, contest rating changes, solved count.
3. **LeetCode**: Daily problem completion, submission history, contest metrics.

### Integration Principles [CONFIRMED]
- **Fully Optional**: A user may connect 0, 1, 2, or all 3 integrations.
- **Zero Hard Dependency**: The core PACT application must function identically regardless of whether any integration is connected.
- **Graceful Disconnection**: Disconnecting an integration must cleanly preserve or purge data based on user configuration, without breaking any core application state.

---

## 3. V0 Scope vs Future Scope [CONFIRMED]

### Included in V0 Specifications
- Full domain model for Goals, Projects, Tasks, Consequences, Expenses, Analytics.
- Security architecture, Row-Level Security (RLS) definitions, and data-boundary rules.
- Design system foundation and visual guidelines.
- Technical architecture and API layer contracts.

### Deferred to Future Phases [FUTURE]
- Progressive Web App (PWA) offline sync capabilities.
- Advanced automated AI expense category learning models.
- Shared multi-user accountability circles or team commitments.
- Custom webhooks for external third-party tools.
