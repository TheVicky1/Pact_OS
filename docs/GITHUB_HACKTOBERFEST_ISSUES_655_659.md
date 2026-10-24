# PACT — Hacktoberfest High-Impact Issue Catalog (Issues #655–#659)

This document catalogs **5 newly created, high-impact, beginner-friendly issues** ([#655](https://github.com/TheVicky1/Pact_OS/issues/655)–[#659](https://github.com/TheVicky1/Pact_OS/issues/659)) published live to the `TheVicky1/Pact_OS` repository on GitHub to welcome **Hacktoberfest** and open-source contributors.

---

## ⚡ Issue Summary & Distribution Matrix

| Issue # | Direct Link | Title | Category | SEO Labels | Target File |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **#655** | [#655](https://github.com/TheVicky1/Pact_OS/issues/655) | `[Focus] Add Cognitive Recovery Duration & Mental Fatigue Depletion Predictor in src/lib/focus/recovery-predictor.ts` | 🧠 Focus & Cognition | `hacktoberfest`, `good first issue`, `help wanted`, `focus`, `algorithms` | `src/lib/focus/recovery-predictor.ts` |
| **#656** | [#656](https://github.com/TheVicky1/Pact_OS/issues/656) | `[Analytics] Add Gini Coefficient Inequality Index for Life Domain Time Allocation in src/lib/analytics/gini-coefficient.ts` | 📊 Analytics & Stats | `hacktoberfest`, `good first issue`, `help wanted`, `analytics`, `statistics` | `src/lib/analytics/gini-coefficient.ts` |
| **#657** | [#657](https://github.com/TheVicky1/Pact_OS/issues/657) | `[Security] Add HMAC-SHA256 Signed Verification URL Token Generator in src/lib/security/signed-token.ts` | 🛡️ Security & Crypto | `hacktoberfest`, `good first issue`, `help wanted`, `security`, `cryptography` | `src/lib/security/signed-token.ts` |
| **#658** | [#658](https://github.com/TheVicky1/Pact_OS/issues/658) | `[Habits] Add Decay-Discounted Habit Elasticity & Slump Recovery Score in src/lib/habits/habit-elasticity.ts` | 🔁 Habits & Resilience | `hacktoberfest`, `good first issue`, `help wanted`, `habits`, `psychology` | `src/lib/habits/habit-elasticity.ts` |
| **#659** | [#659](https://github.com/TheVicky1/Pact_OS/issues/659) | `[Discipline] Add Yerkes-Dodson Optimal Arousal & Task Complexity Curve in src/lib/discipline/yerkes-dodson.ts` | ⚡ Discipline & Gamification | `hacktoberfest`, `good first issue`, `help wanted`, `discipline`, `gamification` | `src/lib/discipline/yerkes-dodson.ts` |

---

## 📋 Architectural Specifications

### 1. Issue #655: Focus Recovery & Mental Fatigue Predictor
* **Source Path:** `src/lib/focus/recovery-predictor.ts`
* **Test Path:** `tests/recovery-predictor.test.ts`
* **Underlying Science:** Hockey's Compensatory Control Model & Baumeister's Ego Depletion theory.
* **Core Behavior:** Computes non-linear recovery break times and cumulative daily fatigue ratings ($0–100\%$) based on session duration ($t$), task intensity weight ($W$), and interruption count ($I$).
* **Formula:**
  $$\text{BreakDuration} = \text{Math.round}\left(\text{baseBreakMinutes} \times \left(\frac{t}{25}\right)^{1.15} \times (W + 0.05 \cdot I)\right)$$

---

### 2. Issue #656: Gini Coefficient for Time Allocation
* **Source Path:** `src/lib/analytics/gini-coefficient.ts`
* **Test Path:** `tests/gini-coefficient.test.ts`
* **Underlying Science:** Gini Index of statistical dispersion.
* **Core Behavior:** Quantifies time distribution equity across life domains (Deep Work, Health, Relationships, Learning, Admin) with balance ratings (`equitable_harmony`, `balanced_portfolio`, `moderate_skew`, `hyper_skewed_obsession`).
* **Formula:**
  $$G = \frac{\sum_{i=1}^n \sum_{j=1}^n |x_i - x_j|}{2n^2 \bar{x}}$$

---

### 3. Issue #657: HMAC-SHA256 Signed Verification Token Generator
* **Source Path:** `src/lib/security/signed-token.ts`
* **Test Path:** `tests/signed-token.test.ts`
* **Underlying Science:** Cryptographic message authentication & constant-time comparison.
* **Core Behavior:** Generates and verifies URL-safe signed tokens for accountability partner attestations (`payloadBase64Url.signatureBase64Url`), preventing timing side-channel attacks and parameter tampering.

---

### 4. Issue #658: Decay-Discounted Habit Elasticity & Slump Recovery Score
* **Source Path:** `src/lib/habits/habit-elasticity.ts`
* **Test Path:** `tests/habit-elasticity.test.ts`
* **Underlying Science:** Behavioral habit resilience & avoiding the "what-the-hell" abandonment effect (Polivy & Herman).
* **Core Behavior:** Retains accumulated neural momentum credit ($0–100\%$) after missed habit days via half-life exponential decay rather than brutally resetting to zero.
* **Formula:**
  $$\text{ElasticityScore} = \text{Math.round}\left(100 \times \left(1 - e^{-0.06 \cdot S}\right) \times 0.5^{(\Delta t / h)}\right)$$

---

### 5. Issue #659: Yerkes-Dodson Optimal Arousal & Task Complexity Curve
* **Source Path:** `src/lib/discipline/yerkes-dodson.ts`
* **Test Path:** `tests/yerkes-dodson.test.ts`
* **Underlying Science:** Yerkes-Dodson Inverted-U Law of performance vs. physiological arousal (1908).
* **Core Behavior:** Adjusts recommended stake penalties and countdown pacing based on task cognitive complexity (simple tasks benefit from high urgency $\mu=80$; complex creative tasks require low urgency $\mu=35$).
* **Formula:**
  $$P(A) = \text{Math.round}\left(100 \times e^{-\frac{(A - \mu)^2}{2 \cdot \sigma^2}}\right)$$

---

## 📌 Contributor Best Practices
1. **Zero External Dependencies:** All logic must be pure TypeScript relying only on native language features or Node built-ins (`node:crypto`).
2. **Deterministic & Unit Tested:** Every implementation must come with a dedicated test suite under `tests/`.
3. **Execution Verification:** Run `npm test` and `npm run typecheck` locally before opening pull requests.
