# PACT — Architectural Decision Records (ADR) Log

## 1. Decision Status Key

Every architectural item in PACT documentation is categorized into one of five explicit statuses:
- **[CONFIRMED]**: Firmly decided rule or product requirement.
- **[PROPOSED]**: Recommended implementation direction subject to review.
- **[UNDECIDED]**: Recognized design choice requiring further analysis before lock-in.
- **[ASSUMPTION]**: Explicit working hypothesis used for current design.
- **[FUTURE]**: Scope explicitly deferred past V0 baseline.

---

## 2. Decision Log

### ADR-001: Greenfield Rebuild Scope [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Start completely from zero. Establish Phase 0 documentation baseline before writing any application code or database migrations.

### ADR-002: Dual Tagline Approval [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Approve both *"A System for Keeping Promises to Yourself"* and *"Turn Intent Into Discipline"*. Neither is permanently locked as sole tagline.

### ADR-003: Core Brand Identity [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Reference Image 2 (Gold P Monogram) is the sole visual brand mark. Reference Image 1 is visual north star for dark glassmorphic quality.

### ADR-004: Consequence Data Confidentiality Boundary [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Hiding consequences is enforced at the database RLS / data access boundary, NOT via frontend UI visibility toggles. Unrevealed payload data (`is_revealed = false`) is omitted from client query results.

### ADR-005: Technology Stack Preferences [PROPOSED]
- **Status**: [PROPOSED]
- **Proposed Stack**: Next.js (App Router, TypeScript), Tailwind CSS, Framer Motion, Supabase (PostgreSQL + RLS + Auth), Zod validation, Vercel deployment.

### ADR-006: Threat Model Architecture [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Define explicit Threat Matrix (`docs/THREAT_MODEL.md`) covering 8 threat actors, attack surfaces, security boundaries, mitigations, and required future test contracts.

### ADR-007: Integration Token Security Lifecycle [PROPOSED]
- **Status**: [PROPOSED]
- **Decision**: Integration tokens are encrypted at rest and accessible only to server-side sync handlers. Application-level token encryption and key rotation strategy are marked [PROPOSED] / [UNDECIDED] to avoid premature lock-in during V0.

### ADR-008: Mandatory Security Test Mapping [CONFIRMED]
- **Status**: [CONFIRMED]
- **Decision**: Map all 16 security requirement scenarios to `FUTURE TEST — REQUIRED BEFORE FEATURE COMPLETION` entries in `docs/TESTING.md`.
