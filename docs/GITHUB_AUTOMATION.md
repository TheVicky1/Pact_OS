# PACT — GitHub Automation & Triage Bot Architecture

This document defines the architectural specification, security model, and policy engine design for PACT's future **GitHub Automation & Contributor Triage Bot** (`pact-bot`).

---

## 1. Architectural Overview

The PACT GitHub automation infrastructure is designed as an **event-driven, least-privilege system** that decouples event ingestion, policy evaluation, and action execution.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   GitHub Event Ingestion (Webhooks / Actions)          │
│         (issues, issue_comment, pull_request, schedule, status)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Event Router & Context                         │
│       - Validates payload signature and author permissions             │
│       - Extracts actor, entity (Issue/PR), paths, and event type       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Rule & Policy Engine                           │
│   ┌───────────────────────┬───────────────────────┬─────────────────┐  │
│   │  Triage & Label Rules │ Contributor Lifecycle │ Stale & Sweeper │  │
│   │  - Missing info check │ - First-time welcome  │ - Inactivity    │  │
│   │  - Path-based label   │ - Claim reservation  │ - PR staleness  │  │
│   │  - Duplicate scorer   │ - Merge recognition   │ - Dependency PR │  │
│   └───────────────────────┴───────────────────────┴─────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Action Executor                                │
│       - Mutates labels, comments, milestones via GitHub API            │
│       - Emits rate-limited, idempotent REST calls                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Structured Audit Log                           │
│       - Records execution traces, decisions, and timestamps            │
│       - Zero-secret redaction guarantee                                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Bot Responsibilities

### 2.1 Issue Triage & Quality Assurance
- **Missing Information Detection:** Validates whether new issue submissions contain reproduction steps, environment details, or acceptance criteria. If required sections are omitted, politely prompts the author to complete them and applies `status:needs-info`.
- **Path & Context Labeling:** Automatically assigns `area:*` and `type:*` labels based on Issue Form dropdown selections or PR file changes (`area:ui` for `src/components/ui/**`, `area:supabase` for `supabase/**`).
- **Duplicate Detection Heuristic:** Calculates title and body similarity scores against open issues to highlight potential duplicates before duplicate work begins.

### 2.2 Contributor Onboarding & Engagement
- **First-Time Welcome Greeting:** Posts a welcoming, non-intrusive message to contributors on their first issue or pull request, pointing them directly to [CONTRIBUTING.md](../CONTRIBUTING.md) and [CONTRIBUTING-BEGINNERS.md](./CONTRIBUTING-BEGINNERS.md).
- **Issue Claim Management:** Allows community members to claim ready issues by commenting `/claim` or `/take`. The bot assigns the issue, changes status to `status:in-progress`, and sets a 7-day progress expectation.
- **Contributor Recognition:** Automatically acknowledges merged pull request authors and updates [CONTRIBUTORS.md](../CONTRIBUTORS.md) in batch releases.

### 2.3 Lifecycle & Stale Triage Sweepers
- **Inactive Claim Sweeper:** Runs weekly on a cron schedule. If an issue assigned to an external contributor has no commits or PR linked after 10 days, gently comments asking for an update. If inactive after 14 days, frees the assignment and restores `status:ready`.
- **Stale PR Detection:** Identifies pull requests with failing CI or unresolved merge conflicts that have been inactive for > 14 days, providing actionable guidance to unblock the contributor.
- **Dependency PR Triage:** Validates incoming Dependabot PRs against CI status checks. Automatically adds `type:security` or `type:maintenance` labels and comments with test summaries.

---

## 3. Security Architecture & Threat Model

Security is paramount when executing automated agents with GitHub API credentials.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SECURITY GUARDRAILS                             │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Identity:       Dedicated GitHub App with installation tokens       │
│ 2. Credentials:    NO Personal Access Tokens (PAT) stored in repo      │
│ 3. Permissions:    Strict least-privilege (read-only where possible)   │
│ 4. Execution:      NEVER run untrusted PR code with write privileges   │
│ 5. Auto-Merge:     PROHIBIT automated merging of contributor PRs       │
│ 6. Redaction:      Strict zero-secret logging across all workflows     │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Least-Privilege GitHub Permissions Matrix

| Resource | Required Permission | Justification |
| :--- | :--- | :--- |
| `issues` | `read & write` | Read issue bodies, apply labels, post guidance comments, assign contributors |
| `pull_requests` | `read & write` | Read PR metadata, apply area labels, post review checklists |
| `contents` | `read` | Read repository documentation, templates, and directory structure |
| `discussions` | `read & write` | Triage unanswered questions and categorize discussions |
| `actions` | `read` | Check CI run outcomes for PR status reporting |
| `administration` | `none` | Repository settings remain strictly maintainer-controlled |

### 3.2 Secure PR Execution Model (`pull_request_target` vs `pull_request`)
- Forked pull request code is **NEVER** executed in workflows with write access or secret exposure.
- Automated tests run under standard `pull_request` with unprivileged, read-only permissions (`contents: read`).
- Triage actions (e.g., labeling based on branch names or title) execute under unprivileged events or strictly sanitized payload evaluators.

---

## 4. Policy Engine Rules Matrix

| Trigger Event | Condition | Policy / Action Executed |
| :--- | :--- | :--- |
| `issues.opened` | Author has no prior commits | Post first-time contributor welcome message with links to documentation. |
| `issues.opened` | Issue template is empty or `< 50` chars | Apply `status:needs-info` and request reproduction details. |
| `issue_comment.created` | Comment equals `/claim` and issue is `status:ready` | Assign commenter, apply `status:in-progress`, record timestamp. |
| `pull_request.opened` | PR touches `docs/**` or `*.md` only | Auto-assign `type:documentation` and `area:documentation`. |
| `pull_request.opened` | PR has no linked issue (`Closes #...`) | Post gentle reminder requesting issue link for traceability. |
| `schedule (cron)` | Assigned issue has 0 activity for 10 days | Post check-in comment requesting status update. |
| `schedule (cron)` | Assigned issue has 0 activity for 14 days | Unassign inactive user, set `status:ready`, post notification. |
| `pull_request.closed` | PR merged to `main` | Post celebration comment, tag issue closed, log author for release notes. |

---

## 5. Modular Implementation Roadmap

The bot infrastructure is designed for phased rollout without disruptive repository reorganizations:

- **Phase 12 (Current):** Governance, Label Taxonomy, Branch Protection, Issue Factory Architecture (Completed).
- **Phase 13 (Next):** Issue Factory Generation (20 canonical beginner issues #52–#71) + Local/GitHub Actions Issue Triage Automation Workflow.
- **Phase 14 (Future):** Dedicated PACT GitHub App integration with event router and multi-repo support.
