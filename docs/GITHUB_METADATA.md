# PACT — Canonical GitHub Repository Metadata & Discoverability Specification

This document defines the canonical repository metadata, topics taxonomy, social preview specifications, and provisioning guidelines for **PACT** on GitHub.

---

## 1. 🏛️ Repository Identity & Canonical Descriptions

| Attribute | Canonical Value |
| :--- | :--- |
| **Repository Name** | `Pact_OS` |
| **Display Name** | **PACT — Personal Operating System** |
| **Primary Tagline** | *A System for Keeping Promises to Yourself.* |
| **Operational Mission** | *Turn Intent Into Discipline.* |
| **Primary License** | **MIT License** ([LICENSE](../LICENSE)) |
| **Repository URL** | `https://github.com/TheVicky1/Pact_OS` |
| **Default Branch** | `main` |

### Canonical Repository Description (GitHub About Field)
> **`Personal Productivity & Accountability OS — Turn Intent Into Discipline with server-authoritative commitments, time-blocked planning, and proof-of-work verification.`**  
> *(166 characters — optimized for GitHub About box readability without truncation)*

### Short Fallback Description (Mobile / Embeds)
> **`Personal Productivity & Accountability OS — Turn Intent Into Discipline.`**  
> *(74 characters)*

---

## 2. 🏷️ Canonical Topics Taxonomy

PACT uses a curated set of **16 high-signal GitHub topics**. Topics are strictly divided across domain purpose, technology stack, and open-source discoverability.

| # | Topic | Category | Rationale & Justification |
| :-: | :--- | :--- | :--- |
| 1 | `productivity` | Domain | Core product domain covering task management, time-blocking, and daily workflow execution. |
| 2 | `personal-productivity` | Domain | Differentiates PACT as an executive personal system rather than enterprise team ticketing software. |
| 3 | `personal-operating-system` | Domain | Captures the holistic OS paradigm unifying tasks, goals, habits, finance, and focus under one canvas. |
| 4 | `accountability` | Domain | Core differentiator: enforceable commitment contracts, confidential consequences, and resolution workflows. |
| 5 | `discipline` | Domain | Philosophical pillar emphasizing follow-through and anti-passive accumulation. |
| 6 | `time-blocking` | Domain | Core temporal planning engine supporting day/week/month calendar scheduling with Google Calendar sync. |
| 7 | `nextjs` | Stack | Foundation framework: Next.js 16 App Router, React Server Components, and Server Actions. |
| 8 | `react` | Stack | UI library: React 19 concurrent features and client-side transition hooks. |
| 9 | `typescript` | Stack | Strict type system guaranteeing domain contract safety and zero runtime schema drift. |
| 10 | `tailwindcss` | Stack | Tailwind CSS v4 powering the luxury OLED Obsidian canvas and specular border tokens. |
| 11 | `supabase` | Stack | Managed backend platform providing PostgreSQL, Row Level Security (RLS), and SSR cookie auth. |
| 12 | `postgresql` | Stack | Relational database engine executing deterministic migrations, constraints, and audit trails. |
| 13 | `open-source` | Community | Designates the project as public, community-governed software welcoming external contributors. |
| 14 | `good-first-issue` | Community | Discoverability index for GitHub's contributor ecosystem matching our curated beginner issues. |
| 15 | `contributions-welcome` | Community | Global discoverability tag signaling active maintainer review and onboarding readiness. |
| 16 | `up-for-grabs` | Community | Open-source ecosystem portal indexing unassigned, available contribution tasks. |

---

## 3. 🎯 Topic Selection & Quality Rules

To maintain high search ranking and technical integrity on GitHub:

1. **High-Signal Only**: Never add generic keyword-stuffing tags (e.g., `app`, `web`, `code`, `tool`, `best`, `cool`).
2. **Stack Accuracy**: Only tag technologies with actual dependencies in `package.json` or native infrastructure.
3. **No Exaggeration**: Do not tag enterprise or AI keywords unless backed by server-authoritative implementations.
4. **Community Alignment**: Always keep `open-source` and `good-first-issue` active to support new open-source contributors finding [docs/GITHUB_BEGINNER_ISSUES.md](./GITHUB_BEGINNER_ISSUES.md).

---

## 4. 🖼️ Social Preview & Open Graph Asset

The repository's social preview card provides the first visual impression when shared on GitHub, Discord, Twitter/X, and technical forums.

- **Asset Path:** [`docs/assets/github-social-preview.png`](./assets/github-social-preview.png)
- **Target Dimensions:** `1280 × 720` (16:9 GitHub standard, scaled cleanly for 1280×640 viewports)
- **Visual Composition:**
  - **Canvas:** Deepest OLED Obsidian (`#050505`) with soft atmospheric gold back-scatter.
  - **Typography:** Bold luxury title `PACT` with Warm White subtitle `Personal Productivity & Accountability OS` and tagline `Turn Intent Into Discipline`.
  - **Celestial Hero:** Photorealistic 3D planet sphere featuring volumetric lighting, Rayleigh atmospheric scatter, and a sharp gold crescent rim (`#D4AF37`).
  - **Accents:** Restrained translucent glassmorphic backdrop with ultra-fine specular hairline borders.

---

## 5. ⚙️ Automated Metadata Provisioning Tool

PACT provides a non-destructive script to synchronize repository metadata with GitHub via the REST API or GitHub CLI.

### Script Location
[`scratch/setup-github-metadata.mjs`](../scratch/setup-github-metadata.mjs)

### Features & Safety Guarantees
- **Dry-Run Mode by Default**: Safely previews proposed changes without requiring tokens or mutating remote state.
- **Idempotent Synchronization**: Inspects existing repository description and topics before updating, making zero duplicate changes.
- **Secret-Safe Execution**: Never logs or prints auth tokens, API keys, or environment secrets to stdout or disk.
- **Non-Destructive**: Only manages the repository **Description**, **Homepage URL**, and **Topics**. Never modifies branch protection, repository visibility, collaborators, or webhooks.

### Usage Commands

```bash
# 1. Run local verification (Dry Run)
node scratch/setup-github-metadata.mjs --dry-run

# 2. Provision remotely using a GitHub Personal Access Token (PAT with repo scope)
$env:GITHUB_TOKEN="ghp_your_token_here"
node scratch/setup-github-metadata.mjs

# 3. Alternative: Provision remotely via GitHub CLI (if authenticated)
gh repo edit TheVicky1/Pact_OS --description "Personal Productivity & Accountability OS — Turn Intent Into Discipline with server-authoritative commitments, time-blocked planning, and proof-of-work verification." --add-topic "productivity,personal-productivity,personal-operating-system,accountability,discipline,time-blocking,nextjs,react,typescript,tailwindcss,supabase,postgresql,open-source,good-first-issue"
```

---

## 6. 🔄 Metadata Maintenance Policy

Repository metadata should be updated only under the following conditions:

| Trigger Event | Required Action |
| :--- | :--- |
| **Major Framework Upgrade** | Update stack topic (e.g. Next.js, React, Tailwind) if major architectural change occurs. |
| **New Native Proof Connector** | Add integration topic (e.g., `leetcode`, `github-api`) if a major domain engine is added. |
| **Product Scope Expansion** | Review description and domain topics if core product architecture changes. |
| **Rebranding / Visual Refresh** | Regenerate social preview asset and update visual specifications. |

---

## 7. 🔗 Related Documentation
- [**Documentation Index**](./README.md)
- [**GitHub Labels Taxonomy**](./GITHUB_LABELS.md)
- [**Curated Beginner Issues Factory**](./GITHUB_BEGINNER_ISSUES.md)
- [**Beginner Contributor Guide**](./CONTRIBUTING-BEGINNERS.md)
- [**Design System Specification**](./DESIGN_SYSTEM.md)
