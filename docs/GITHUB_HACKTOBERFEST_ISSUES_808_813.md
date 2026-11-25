# PACT — Hacktoberfest High-Impact Issue Catalog (Issues #808–#813)

This document catalogs **6 newly created, high-impact, beginner-friendly issues** ([#808](https://github.com/TheVicky1/Pact_OS/issues/808)–[#813](https://github.com/TheVicky1/Pact_OS/issues/813)) published live to the `TheVicky1/Pact_OS` repository on GitHub to welcome **Hacktoberfest** and open-source contributors.

---

## ⚡ Issue Summary & Distribution Matrix

| Issue # | Direct Link | Title | Category | SEO Labels | Target File |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **#808** | [#808](https://github.com/TheVicky1/Pact_OS/issues/808) | `[Focus] Add Hick-Hyman Law Decision Latency & Choice Overload Clutter Index in src/lib/focus/hicks-law.ts` | 🧠 Focus & Cognition | `hacktoberfest`, `good first issue`, `beginner friendly`, `area:focus` | `src/lib/focus/hicks-law.ts` |
| **#809** | [#809](https://github.com/TheVicky1/Pact_OS/issues/809) | `[Accountability] Add Dunbar's Number Social Bandwidth & Circle Sizing Guardrail in src/lib/accountability/dunbar-capacity.ts` | 🤝 Accountability & Social | `hacktoberfest`, `good first issue`, `beginner friendly`, `area:accountability` | `src/lib/accountability/dunbar-capacity.ts` |
| **#810** | [#810](https://github.com/TheVicky1/Pact_OS/issues/810) | `[Analytics] Add Circadian Non-Parametric Interdaily Stability (IS) & Intradaily Variability (IV) in src/lib/analytics/interdaily-stability.ts` | 📊 Analytics & Stats | `hacktoberfest`, `good first issue`, `beginner friendly`, `area:analytics` | `src/lib/analytics/interdaily-stability.ts` |
| **#811** | [#811](https://github.com/TheVicky1/Pact_OS/issues/811) | `[Health] Add Epworth Sleepiness Scale (ESS) Daytime Somnolence & Alertness Deficit Scorer in src/lib/health/epworth-sleepiness.ts` | 🩺 Health & Physiology | `hacktoberfest`, `good first issue`, `beginner friendly`, `area:health` | `src/lib/health/epworth-sleepiness.ts` |
| **#812** | [#812](https://github.com/TheVicky1/Pact_OS/issues/812) | `[Habits] Add Ebbinghaus Forgetting Curve & Spaced Retrieval Interval Scheduler in src/lib/habits/ebbinghaus-decay.ts` | 🔁 Habits & Retention | `hacktoberfest`, `good first issue`, `beginner friendly`, `area:habits` | `src/lib/habits/ebbinghaus-decay.ts` |
| **#813** | [#813](https://github.com/TheVicky1/Pact_OS/issues/813) | `[UI] Add Fitts's Law Target Acquisition Difficulty & Action Ergonomics Scorer in src/lib/ui/fitts-ergonomics.ts` | 🖥️ UI & Ergonomics | `hacktoberfest`, `good first issue`, `beginner friendly`, `area:ui` | `src/lib/ui/fitts-ergonomics.ts` |

---

## 📋 Architectural Specifications

### 1. Issue #808: Hick-Hyman Law Decision Latency & Choice Overload Clutter Index
* **Source Path:** `src/lib/focus/hicks-law.ts`
* **Test Path:** `tests/hicks-law.test.ts`
* **Underlying Science:** Hick-Hyman Law ($T = a + b \cdot \log_2(n + 1)$) of decision reaction time as a function of available choices.
* **Core Behavior:** Computes decision latency in milliseconds, quantifies UI clutter ($0–100$), and returns progressive disclosure recommendations to minimize decision fatigue.

---

### 2. Issue #809: Dunbar's Number Social Bandwidth & Circle Sizing Guardrail
* **Source Path:** `src/lib/accountability/dunbar-capacity.ts`
* **Test Path:** `tests/dunbar-capacity.test.ts`
* **Underlying Science:** Robin Dunbar's social group hierarchy (Support Clique of 5, Sympathy Group of 15) and Bystander Effect / Diffusion of Responsibility.
* **Core Behavior:** Evaluates circle capacity, computes bystander apathy risk ($R = 1 - 1/\sqrt{n}$), and recommends optimal verifier quorums.

---

### 3. Issue #810: Circadian Non-Parametric Interdaily Stability & Intradaily Variability
* **Source Path:** `src/lib/analytics/interdaily-stability.ts`
* **Test Path:** `tests/interdaily-stability.test.ts`
* **Underlying Science:** Van Someren et al. (1999) Non-Parametric Circadian Rhythm Analysis (NPCRA).
* **Core Behavior:** Analyzes multi-day 24-hour activity matrices to compute Interdaily Stability ($IS \in [0, 1]$) and Intradaily Variability ($IV \in [0, 2]$) to diagnose schedule fragmentation.

---

### 4. Issue #811: Epworth Sleepiness Scale Daytime Somnolence Scorer
* **Source Path:** `src/lib/health/epworth-sleepiness.ts`
* **Test Path:** `tests/epworth-sleepiness.test.ts`
* **Underlying Science:** Dr. Murray Johns (1991) Epworth Sleepiness Scale (ESS).
* **Core Behavior:** Validates and scores 8 situational dozing propensities ($0–24$) to categorize clinical daytime sleepiness tiers and warn against high-risk activities.

---

### 5. Issue #812: Ebbinghaus Forgetting Curve & Spaced Retrieval Scheduler
* **Source Path:** `src/lib/habits/ebbinghaus-decay.ts`
* **Test Path:** `tests/ebbinghaus-decay.test.ts`
* **Underlying Science:** Hermann Ebbinghaus (1885) exponential forgetting curve ($R = e^{-t/S}$) and spaced repetition stability expansion.
* **Core Behavior:** Projects memory retention decay, calculates memory half-life, and schedules optimal next review dates for habits and skills.

---

### 6. Issue #813: Fitts's Law Target Acquisition Difficulty & Action Ergonomics Scorer
* **Source Path:** `src/lib/ui/fitts-ergonomics.ts`
* **Test Path:** `tests/fitts-ergonomics.test.ts`
* **Underlying Science:** Paul Fitts (1954) human motor response model ($MT = a + b \cdot \log_2(D/W + 1)$).
* **Core Behavior:** Evaluates UI touch targets and buttons against WCAG 2.1/2.2 minimums ($44\text{px}$), computing Index of Difficulty ($ID$) and thumb-zone reachability ratings.
