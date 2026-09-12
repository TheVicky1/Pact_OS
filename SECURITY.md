# PACT Security Policy

Security is a foundational pillar of the **PACT Personal Operating System**. We take the security and privacy of our users, commitments, financial records, and confidential data seriously.

This document outlines our public security policy, supported versions, and procedures for responsibly reporting vulnerabilities.

---

## Supported Versions

PACT is actively developed on the `main` branch. We release security patches and stability updates to the active development line:

| Version / Branch | Supported | Notes |
| :--- | :--- | :--- |
| `main` (Latest) | :white_check_mark: Yes | Actively supported with continuous patches and fixes. |
| Prior Releases (< 1.0.0) | :x: No | Please upgrade to the latest `main` branch. |

---

## Reporting a Vulnerability

If you believe you have discovered a security vulnerability in PACT, **please do NOT report it through a public GitHub issue, pull request, or discussion**. Public disclosure before a fix is available puts user data at risk.

### How to Report

Please report vulnerabilities using **GitHub Private Vulnerability Reporting**:

1. Navigate to the [Security Advisories tab](https://github.com/TheVicky1/Pact_OS/security/advisories) on the PACT repository.
2. Click **"Report a vulnerability"** to submit your findings privately to project maintainers.
3. If Private Vulnerability Reporting is unavailable, contact the project maintainer privately via GitHub: [@TheVicky1](https://github.com/TheVicky1).

---

## What to Include in Your Report

To help us investigate and resolve the issue quickly, please provide as much detail as possible:

- **Type of Issue**: (e.g., Cross-User RLS bypass, Authentication flaw, Injection vulnerability, Secret leakage).
- **Affected Component**: Specific route, Server Action, API endpoint, or database table.
- **Step-by-Step Reproduction**: Detailed steps, requests, or scripts demonstrating the issue.
- **Proof of Concept**: Minimal proof-of-concept payload or screenshot (where safe to share).
- **Impact Assessment**: Explanation of the potential impact on users or data confidentiality.
- **Suggested Fix / Mitigation**: If you have identified a potential fix, feel free to include your recommendation.

---

## What NOT to Include

To protect your safety and user confidentiality:

- **Do NOT share live user secrets, real passwords, or private access tokens.**
- **Do NOT access, alter, or delete other users' data** during testing.
- **Do NOT perform denial-of-service (DoS) attacks** against hosted instances or third-party integration APIs.

---

## Response & Disclosure Process

1. **Acknowledgment**: Maintainers will make a best-effort response to acknowledge receipt of the report within **48–72 hours**.
2. **Investigation & Assessment**: We will verify the vulnerability, evaluate its severity, and determine the affected components.
3. **Patch & Verification**: We will develop and test a fix in a private branch before deploying.
4. **Coordinated Disclosure**: Once a patch is merged and released, we will publish a security advisory acknowledging your contribution (unless you prefer to remain anonymous).

---

## Secret Hygiene & Contributor Security

- **Zero-Secret Baseline**: PACT utilizes an automated secret scanner (`node scratch/secret-scan.mjs`) to verify that no credentials or keys are committed to git history.
- **Server-Authoritative RLS**: All data access is governed by PostgreSQL Row Level Security (RLS) policies.
- **Architecture Reference**: For an in-depth review of PACT's internal security engineering model, please refer to our technical [Security Specification](docs/SECURITY.md).
