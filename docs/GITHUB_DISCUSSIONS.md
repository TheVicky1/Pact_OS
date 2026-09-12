# PACT — Community Discussions & Engagement Guide

This document defines the community architecture, discussion categories, interaction routing, and contributor journey for **PACT**.

---

## 1. 🧭 Community Information Architecture & Routing

To keep the PACT open-source repository organized, productive, and beginner-friendly, interactions are routed to specific channels:

| Channel | Purpose | Examples | Primary Location |
| :--- | :--- | :--- | :--- |
| **GitHub Issues** | Actionable, reproducible, and scoped tasks | Reproducible bugs, approved feature implementations, documentation errors, curated good-first-issues | [Issues Tab](https://github.com/TheVicky1/Pact_OS/issues) |
| **GitHub Discussions** | Open conversations, brainstorming, and Q&A | Setup questions, product ideas, architecture debates, community setups, announcements | [Discussions Tab](https://github.com/TheVicky1/Pact_OS/discussions) |
| **Pull Requests** | Code and documentation contributions | Bug fixes, feature implementations, test coverage additions, documentation improvements | [Pull Requests](https://github.com/TheVicky1/Pact_OS/pulls) |
| **Support Guide** | Self-serve troubleshooting & diagnostics | Local environment setup roadblocks, build errors, port conflicts, test failures | [`SUPPORT.md`](../SUPPORT.md) & [`docs/TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) |
| **Security Policy** | Private vulnerability disclosures | Secret leakage, authentication bypasses, RLS vulnerabilities | [`SECURITY.md`](../SECURITY.md) *(Private only)* |

---

## 2. 🏷️ Canonical Discussion Categories

When GitHub Discussions is enabled for the repository, discussions are organized into **6 high-signal categories**:

```
GitHub Discussions
├── 📣 Announcements       # Maintainer updates, release milestones, and roadmap progress
├── 💬 General             # Open community chat, introductions, and casual conversation
├── 💡 Ideas               # Early-stage feature proposals, concepts, and feedback
├── ❓ Q&A                 # Questions regarding setup, domain logic, or contributing
├── 🏗️ Architecture        # Technical deep-dives on Next.js 16, Supabase RLS, and domain engines
└── 🎨 Show and Tell       # Community setups, custom extensions, and daily discipline rituals
```

### Category Details

| Category | Emoji | Format | Description & Posting Guidelines |
| :--- | :---: | :--- | :--- |
| **Announcements** | 📣 | Announcement | **Maintainer-only posts**. Used for release announcements, phase completions, and major project milestones. |
| **General** | 💬 | Open Discussion | Open conversation, community introductions, general productivity discussions, and feedback. |
| **Ideas** | 💡 | Open Discussion | Propose and debate new features or improvements before creating a formal GitHub Issue. |
| **Q&A** | ❓ | Question / Answer | Ask questions about local development, architecture, or contributing. Community members can mark verified answers. |
| **Architecture** | 🏗️ | Open Discussion | Technical design debates, database schema proposals, temporal math, and financial ledger considerations. |
| **Show and Tell** | 🎨 | Showcase | Share how you use PACT, daily planning rituals, custom workflows, or community extensions. |

---

## 3. 🔄 The Contributor Journey: From Discovery to Recognition

PACT provides an explicit, transparent contributor journey:

```text
                  🌱 Discover PACT
                         │
                         ▼
             📖 Read README & Vision
                         │
                         ▼
          🌱 Read Beginner Contributor Guide
             (docs/CONTRIBUTING-BEGINNERS.md)
                         │
                         ▼
        ❓ Have a Question or Idea?
       ┌─────────────────┴─────────────────┐
       ▼                                   ▼
 💡 Share in Discussions             ❓ Ask in Q&A
 (docs/GITHUB_DISCUSSIONS.md)         (docs/TROUBLESHOOTING.md)
       │                                   │
       └─────────────────┬─────────────────┘
                         │
                         ▼
         🎯 Choose a Curated Beginner Issue
           (docs/GITHUB_BEGINNER_ISSUES.md)
                         │
                         ▼
         💬 Claim Issue via Comment
                         │
                         ▼
         🛠️ Implement Locally on Branch
                         │
                         ▼
         🧪 Run Quality Verification Gates
         (npm run lint, tsc, run-tests.mjs, secret-scan.mjs)
                         │
                         ▼
         🚀 Open Pull Request (PR Template)
                         │
                         ▼
         🔍 Maintainer Review & Feedback
                         │
                         ▼
         🎉 PR Merged into main!
                         │
                         ▼
         🌟 Recognized in CONTRIBUTORS.md
```

---

## 4. 💡 Lifecycle: Moving an Idea → Issue → Pull Request

Not every thought needs to start as an issue. We encourage the following progressive lifecycle:

1. **Step 1: Discuss in `💡 Ideas`**: Share your concept, problem statement, and proposed approach in Discussions using the [Idea Template](../.github/DISCUSSION_TEMPLATE/idea.md).
2. **Step 2: Maintainer & Community Alignment**: Discuss feasibility, design system alignment, and technical trade-offs.
3. **Step 3: Create a Formal Issue**: Once the scope, acceptance criteria, and architecture are agreed upon, a maintainer or contributor creates a formal [Feature Request Issue](../.github/ISSUE_TEMPLATE/feature_request.yml).
4. **Step 4: Implementation & PR**: The issue is claimed, implemented on a feature branch, verified locally, and submitted via a Pull Request.

---

## 5. 🤝 Community Behavior & Code of Conduct

PACT is committed to providing a welcoming, inclusive, and professional environment for all contributors regardless of experience level.

- **Be Encouraging**: We actively welcome first-time open-source contributors. Explain concepts patiently and constructively.
- **Stay Focused**: Discussions should remain constructive and centered on personal productivity, system architecture, and code quality.
- **Zero Tolerance for Harassment**: All interactions across Issues, Discussions, and Pull Requests are governed by our [**Code of Conduct**](../CODE_OF_CONDUCT.md).

---

## 6. ⚙️ Discussions Provisioning & Administration

To enable and manage GitHub Discussions on the remote repository:

```bash
# Verify Discussion configuration locally
node scratch/setup-github-discussions.mjs --dry-run

# Provision / check remote status with GitHub token
$env:GITHUB_TOKEN="ghp_your_token"; node scratch/setup-github-discussions.mjs
```

> **Maintainer Note:** GitHub Discussions can also be toggled directly in repository settings under **Settings** → **Features** → **Discussions**.

---

## 7. 🔗 Related Resources
- [**Documentation Directory**](./README.md)
- [**Beginner's Contribution Guide**](./CONTRIBUTING-BEGINNERS.md)
- [**Curated Beginner Issues Factory**](./GITHUB_BEGINNER_ISSUES.md)
- [**GitHub Labels Taxonomy**](./GITHUB_LABELS.md)
- [**Code of Conduct**](../CODE_OF_CONDUCT.md)
- [**Support Guide**](../SUPPORT.md)
- [**Contributors Directory**](../CONTRIBUTORS.md)
