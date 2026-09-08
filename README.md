# PACT — Personal Operating System

> **Tagline Options**:
> - *"A System for Keeping Promises to Yourself."*
> - *"Turn Intent Into Discipline"*

---

## 📌 Overview

**PACT** is a personal operating system designed to turn intentions into consistent action. PACT helps individuals define commitments, plan time, organize projects, track goals, analyze follow-through, manage personal finances, and maintain meaningful accountability.

---

## 🚀 Getting Started (Phase 1 Application Foundation)

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

---

## 📁 V0 Foundation Documentation Baseline

This repository is built on the authoritative Phase 0 specification baseline within the [`docs/`](./docs/) directory:

| Document | Purpose |
|---|---|
| 📖 [**Product Vision**](./docs/PRODUCT.md) | Vision, dual taglines, product philosophy, and scope rules |
| 📋 [**Core Features**](./docs/FEATURES.md) | Inventory of the 12 core product areas and optional integrations |
| 🔄 [**User Flows**](./docs/USER_FLOWS.md) | Domain hierarchy flow, daily planning, and consequence lifecycle |
| 🏗️ [**Architecture**](./docs/ARCHITECTURE.md) | Tech stack preferences, feature-oriented structure, timezone safety |
| 🗄️ [**Database Model**](./docs/DATABASE.md) | Relational entity schemas, trusted fields, and indexing strategy |
| 🔒 [**Security Architecture**](./docs/SECURITY.md) | 28-point security matrix, RLS policies, zero-trust validation |
| 🛡️ [**Threat Model**](./docs/THREAT_MODEL.md) | Threat actor matrix, attack surfaces, mitigations, and test requirements |
| 🎨 [**Design System**](./docs/DESIGN_SYSTEM.md) | Gold P Monogram brand mark, dark glassmorphic UI, design tokens |
| 🔌 [**Integrations**](./docs/INTEGRATIONS.md) | GitHub, Codeforces, and LeetCode connectors & token lifecycle |
| 🧪 [**Testing Strategy**](./docs/TESTING.md) | Unit, integration, E2E, and mandatory security test contracts |
| 🌿 [**Git Workflow**](./docs/GIT_WORKFLOW.md) | Conventional commits, secret prevention rules, gitignore standards |
| 📝 [**Decision Record (ADR)**](./docs/DECISIONS.md) | Architectural decision log tracking status across all specs |

---

## 🔒 Security Principles

1. **Security-First Vertical Slices**: Schema -> RLS -> API -> Validation -> Tests -> UI.
2. **Server-Side Authorization**: Never trust client-provided user IDs, timestamps, or status claims.
3. **Consequence Confidentiality**: Hidden consequence data is protected at the database RLS boundary, not merely hidden in UI code.
4. **Timezone Safety**: UTC storage with explicit user-timezone conversion on trusted server boundaries.

---

## 📄 License

This project is licensed under the MIT License.
