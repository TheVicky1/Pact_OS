# 🏛️ PACT Maintainer Operating Workflow

This runbook outlines the day-to-day operational procedures for maintainers of **PACT OS**. It establishes a high-standard, welcoming, and predictable workflow for triaging issues, assigning beginner contributors, reviewing pull requests, managing inactive claims, and executing releases.

---

## 1. Guiding Philosophy

1. **Welcoming & Encouraging**: Treat every first-time contributor with respect and enthusiasm. Constructive, kind, and timely reviews build long-term open-source community members.
2. **Uphold Engineering Integrity**: Beginner-friendly does not mean lowering engineering standards. Strict TypeScript, zero secret leakage, integer-cents currency arithmetic, and 100% pass rates across the 41-suite test matrix are required for all merged code.
3. **Keep Workflows Simple**: Avoid unnecessary bot bureaucracy or multi-tier approval committees. Vicky personally reviews and approves every pull request.

---

## 2. Issue Triage & Claim Assignment

### Step 1: Evaluating Issue Claims
When a contributor comments on an issue with `good first issue` or `difficulty:beginner` expressing interest:
1. **Check Availability**: Verify that the issue is not already assigned to another contributor.
2. **Check Concurrency**: Ensure the contributor does not already have another active, unmerged issue in progress (enforcing the *"One issue at a time per contributor"* policy).
3. **Assign**: Assign the issue to the contributor in the GitHub right-hand sidebar.
4. **Acknowledge**: Post a brief welcoming confirmation comment:
   ```markdown
   Thanks for your interest in contributing to PACT, @username! 🚀

   I've assigned this issue to you. Please take a look at our [Beginner's Contribution Guide](https://github.com/TheVicky1/Pact_OS/blob/main/docs/CONTRIBUTING-BEGINNERS.md) if you need a step-by-step walkthrough.

   Feel free to ask questions here if you run into any roadblocks!
   ```

### Step 2: Handling Overlapping Claims
If a second contributor requests an issue that is already assigned:
```markdown
Hi @username, thanks for your enthusiasm! This issue is currently claimed by @assigned_user.

Please check out our other open [Good First Issues](https://github.com/TheVicky1/Pact_OS/labels/good%20first%20issue) to find another task!
```

---

## 3. Managing Stale Assignments

To prevent beginner issues from becoming indefinitely blocked by inactive claims:

1. **Activity Window**: Contributors are expected to submit a draft PR or comment with an update within **7 days** of being assigned.
2. **Friendly Check-in (Day 7)**: If there is no activity after 7 days, post a friendly check-in:
   ```markdown
   Hi @username, just checking in on your progress with this issue. Are you still planning to work on this, or would you like us to reopen it for another community member?
   ```
3. **Reassignment (Day 9)**: If no response is received within **48 hours** of the check-in:
   - Unassign the contributor.
   - Post a polite handoff comment:
     ```markdown
     Reopening this issue for other contributors due to inactivity. @username, feel free to pick up another issue whenever you're ready!
     ```

---

## 4. Pull Request Review Protocol

Every pull request must pass both **Automated Quality Gates** and **Maintainer Manual Inspection** before merging.

### Automated Checks (Must be Green)
- [ ] **Continuous Integration (20.x)** — `npm run lint`, `npx tsc --noEmit`, `node scratch/run-tests.mjs`, `npm run build`
- [ ] **Dependency Security Audit (20.x)** — `node scratch/check-dependency-health.mjs`, `npm audit --audit-level=high`
- [ ] **Zero Secret Scan** — `node scratch/secret-scan.mjs`

### Maintainer Review Checklist
1. **Issue Linkage**: Verify that Section 1 of the PR links the relevant issue (e.g., `Closes #12`).
2. **Scope Discipline**: Ensure the PR only touches files required for the issue (no incidental refactors or large formatting changes).
3. **Design System Adherence**: For UI changes, verify Obsidian black (`#050505`), PACT Gold (`#D4AF37`), and WCAG AA contrast.
4. **TypeScript Quality**: Ensure no `any` types were introduced.
5. **Domain Precision**: Confirm integer-cents arithmetic (`amount_cents`) if touching finance components.

### Requesting Changes
When giving review feedback:
- Point directly to the relevant line of code.
- Explain *why* the change is necessary and provide a concrete snippet if helpful.
- Keep feedback actionable and encouraging.

---

## 5. Merging Protocol

1. **Confirm Status Checks**: Ensure all required status checks are passing (`✔ Quality Gates & Verification (20.x)`).
2. **Title Format**: Ensure the PR title adheres to Conventional Commits:
   `type(scope): description (#PR_NUMBER)`
   *(e.g., `docs(money): add code examples for integer-cents calculations (#12)`)*
3. **Merge Strategy**: Use **Squash and Merge** (enforcing linear Git history).
4. **Verify Issue Closure**: Confirm the linked issue is automatically marked as closed.
5. **Express Gratitude**: Thank the contributor for their contribution!

---

## 6. Security & Credential Incident Response

If a contributor accidentally posts an API key, password, or `.env.local` contents in a public issue or PR:
1. **Immediate Redaction**: Edit the comment or PR description immediately to remove the sensitive string.
2. **Notify Contributor**: Inform the contributor to rotate and revoke the exposed credential immediately.
3. **Security Inquiries**: Direct all potential security vulnerability inquiries to [SECURITY.md](https://github.com/TheVicky1/Pact_OS/blob/main/SECURITY.md).

---

## 7. Contributor Recognition & First-Time PR Fast-Track

To foster an encouraging, long-term contributor community:

1. **Micro-PR Priority Review**: Give prompt priority review (target within 24–48 hours) to first-time contributors working on single-file Good First Issues.
2. **First-Time PR Welcome**: First-time PR authors receive an automated, welcoming orientation comment via `.github/workflows/welcome-contributor.yml`.
3. **Contributor Hall of Fame**: Upon merging a contributor's first PR, verify that their contribution is acknowledged in [CONTRIBUTORS.md](https://github.com/TheVicky1/Pact_OS/blob/main/CONTRIBUTORS.md) and on the [GitHub Contributors Graph](https://github.com/TheVicky1/Pact_OS/graphs/contributors).
4. **Encouraging Next Steps**: When merging a beginner's PR, invite them to tackle another Good First Issue or explore feature discussions in [GitHub Discussions](https://github.com/TheVicky1/Pact_OS/discussions).

---

## 8. Evidence-Based Issue Batch Release Policy

To prevent issue flooding and maintain a high standard of contributor engagement, new batches of Good First Issues (such as Batch 4) remain strictly in reserve in `docs/GITHUB_BEGINNER_ISSUES.md` until explicit evidence-based triggers are met.

### Batch 4 Release Trigger Criteria (All 4 Required):
1. **Active Inventory Depletion**: Available unassigned `good first issue` count drops below **10** (out of the 30 active issues).
2. **External PR Completion**: At least **5 unique external pull requests** have been successfully reviewed, approved, and merged into `main`.
3. **Maintainer Capacity**: Maintainer review turnaround SLA has consistently stayed under 48 hours for active pull requests.
4. **Zero Stale Blockers**: Less than **20%** of open issues have stalled or inactive claims.

Maintainers should run `node scratch/inspect-community-intake.mjs` to evaluate intake metrics prior to releasing any future batch.

---

## 9. Permanent Micro-Issue Quality Standard & Label Governance

From Phase 6D onward, all newly generated or curated contributor issues must strictly adhere to the following standards:

1. **Micro-Scope Guarantee**:
   - **One file preferred**, two files maximum.
   - **5–30 minutes** expected completion for a beginner.
   - Zero architectural, migration, authentication, or production-infrastructure scope.
2. **Permanent Retirement of Time-Based Labels**:
   - `time:<15m`, `time:15-30m`, `time:30-60m`, etc., are **permanently retired and forbidden** on new issues.
   - Contributor difficulty is communicated cleanly via `difficulty:beginner` and structured acceptance criteria.
3. **Canonical 6-Part Anatomy**:
   - `## What needs to be done`
   - `## Why this matters`
   - `## Where to work`
   - `## Implementation guidance`
   - `## Acceptance criteria`
   - `## Verification`
4. **Issue Discovery Labeling**:
   - Use standard tags: `good first issue`, `beginner friendly`, `difficulty:beginner`, `help wanted`, `contributions-welcome`, `up-for-grabs`.
   - Add orthogonal classification: `type:*` (`type:docs`, `type:ui`, `type:a11y`, `type:test`, `type:bug`, `type:refactor`) and `area:*`.

