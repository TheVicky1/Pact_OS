# PACT — Hacktoberfest High-Impact Issue Catalog (Issues #661–#670)

This document catalogs **10 curated, high-impact, beginner-friendly issues** ([#661](https://github.com/TheVicky1/Pact_OS/issues/661)–[#670](https://github.com/TheVicky1/Pact_OS/issues/670)) published live to the `TheVicky1/Pact_OS` repository on GitHub to welcome **Hacktoberfest** and open-source contributors.

---

## ⚡ Issue Summary & Distribution Matrix

| Issue # | Direct Link | Title | Category | SEO Labels | Target File |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **#661** | [#661](https://github.com/TheVicky1/Pact_OS/issues/661) | `[Discipline] Add Implementation Intentions "If-Then" Contingency Action Trigger Parser in src/lib/discipline/implementation-intentions.ts` | ⚡ Discipline & Execution | `hacktoberfest`, `good first issue`, `help wanted`, `area:core` | `src/lib/discipline/implementation-intentions.ts` |
| **#662** | [#662](https://github.com/TheVicky1/Pact_OS/issues/662) | `[Gamification] Add Streak Shield Loss-Aversion Insurance Points Calculator in src/lib/gamification/streak-shield.ts` | 🎮 Gamification & Retention | `hacktoberfest`, `good first issue`, `help wanted`, `area:habits` | `src/lib/gamification/streak-shield.ts` |
| **#663** | [#663](https://github.com/TheVicky1/Pact_OS/issues/663) | `[Analytics] Add Task Opportunity Cost & Hourly Leverage Rate Allocator in src/lib/analytics/opportunity-cost.ts` | 📊 Analytics & Economics | `hacktoberfest`, `good first issue`, `help wanted`, `area:analytics` | `src/lib/analytics/opportunity-cost.ts` |
| **#664** | [#664](https://github.com/TheVicky1/Pact_OS/issues/664) | `[Focus] Add Pomodoro Fatigue Cumulative Work-to-Rest Ratio Auto-Tuner in src/lib/focus/pomodoro-tuner.ts` | 🧠 Focus & Cognition | `hacktoberfest`, `good first issue`, `help wanted`, `area:focus` | `src/lib/focus/pomodoro-tuner.ts` |
| **#665** | [#665](https://github.com/TheVicky1/Pact_OS/issues/665) | `[Data] Add Exponential Moving Average (EMA) Habit Consistency Trend Smoother in src/lib/data/ema-smoother.ts` | 📈 Data & Time Series | `hacktoberfest`, `good first issue`, `help wanted`, `area:data` | `src/lib/data/ema-smoother.ts` |
| **#666** | [#666](https://github.com/TheVicky1/Pact_OS/issues/666) | `[A11y] Add WCAG 2.2 Accessible Modular Typographic Scale & Line Height Calculator in src/lib/ui/typographic-scale.ts` | ♿ Accessibility & UI | `hacktoberfest`, `good first issue`, `help wanted`, `area:ui` | `src/lib/ui/typographic-scale.ts` |
| **#667** | [#667](https://github.com/TheVicky1/Pact_OS/issues/667) | `[Health] Add 4-7-8 & Box Breathing Parasympathetic Recovery Cycle Calculator in src/lib/health/breathwork.ts` | 🫁 Health & Vagal Regulation | `hacktoberfest`, `good first issue`, `help wanted`, `area:health` | `src/lib/health/breathwork.ts` |
| **#668** | [#668](https://github.com/TheVicky1/Pact_OS/issues/668) | `[Discipline] Add Temptation Bundling & Premack Principle Synergy Matcher in src/lib/discipline/temptation-bundler.ts` | ⚡ Discipline & Behavioral Psych | `hacktoberfest`, `good first issue`, `help wanted`, `area:core` | `src/lib/discipline/temptation-bundler.ts` |
| **#669** | [#669](https://github.com/TheVicky1/Pact_OS/issues/669) | `[Rituals] Add Circadian Cortisol Awakening Response (CAR) Work Alignment Planner in src/lib/rituals/cortisol-curve.ts` | 🌅 Rituals & Chronobiology | `hacktoberfest`, `good first issue`, `help wanted`, `area:rituals` | `src/lib/rituals/cortisol-curve.ts` |
| **#670** | [#670](https://github.com/TheVicky1/Pact_OS/issues/670) | `[Analytics] Add Pearson Correlation Coefficient Matrix for Multi-Habit Synergy in src/lib/analytics/correlation-matrix.ts` | 📊 Analytics & Correlation | `hacktoberfest`, `good first issue`, `help wanted`, `area:analytics` | `src/lib/analytics/correlation-matrix.ts` |

---

## 📋 Architectural Specifications

### 1. Issue #661: Implementation Intentions "If-Then" Contingency Action Trigger Parser
* **Source Path:** `src/lib/discipline/implementation-intentions.ts`
* **Test Path:** `tests/implementation-intentions.test.ts`
* **Underlying Science:** Peter Gollwitzer's Implementation Intentions research (*"If situation X arises, then I will initiate goal-directed response Y"*).
* **Core Behavior:** Parses natural language or structured If-Then commitments, categorizes situational cues (`time`, `location`, `preceding_event`, `emotional_state`), calculates clarity scores ($0–100$), and outputs actionable contingency models.

---

### 2. Issue #662: Streak Shield Loss-Aversion Insurance Points Calculator
* **Source Path:** `src/lib/gamification/streak-shield.ts`
* **Test Path:** `tests/streak-shield.test.ts`
* **Underlying Science:** Kahneman & Tversky's Prospect Theory (Loss Aversion) and mitigating the "what-the-hell" post-slip abandonment effect.
* **Core Behavior:** Evaluates consistency credits to accrue streak shields (e.g., 1 shield earned per 7 days of verified consistency; max inventory of 3), and handles safe redemption for missed habit occurrences without breaking streaks.

---

### 3. Issue #663: Task Opportunity Cost & Hourly Leverage Rate Allocator
* **Source Path:** `src/lib/analytics/opportunity-cost.ts`
* **Test Path:** `tests/opportunity-cost.test.ts`
* **Underlying Science:** Microeconomic opportunity cost and comparative advantage hourly leverage analysis.
* **Core Behavior:** Computes the economic opportunity cost of low-leverage administrative tasks versus high-leverage strategic commitments based on the user's imputed hourly rate, delivering leverage classification (`ultra_high_leverage`, `high_leverage`, `neutral`, `delegation_candidate`).

---

### 4. Issue #664: Pomodoro Fatigue Cumulative Work-to-Rest Ratio Auto-Tuner
* **Source Path:** `src/lib/focus/pomodoro-tuner.ts`
* **Test Path:** `tests/pomodoro-tuner.test.ts`
* **Underlying Science:** Cognitive depletion curves and compensatory recovery scheduling.
* **Core Behavior:** Dynamically adapts traditional $25/5$ Pomodoro intervals as cumulative focus hours accumulate throughout the day, automatically lengthening break durations and suggesting long breaks when fatigue thresholds are reached.

---

### 5. Issue #665: Exponential Moving Average (EMA) Habit Consistency Trend Smoother
* **Source Path:** `src/lib/data/ema-smoother.ts`
* **Test Path:** `tests/ema-smoother.test.ts`
* **Underlying Science:** Exponential Moving Average ($EMA_t = \alpha \cdot Y_t + (1 - \alpha) \cdot EMA_{t-1}$) in financial and behavioral time series.
* **Core Behavior:** Filters out random daily binary noise from 30/60/90 day habit histories to compute smooth, trend-responsive momentum curves that emphasize recent execution.

---

### 6. Issue #666: WCAG 2.2 Accessible Modular Typographic Scale & Line Height Calculator
* **Source Path:** `src/lib/ui/typographic-scale.ts`
* **Test Path:** `tests/typographic-scale.test.ts`
* **Underlying Science:** WCAG 2.2 Success Criterion 1.4.12 (Text Spacing) and musical/modular typographic scales.
* **Core Behavior:** Generates accessible font sizes, proportional line-heights, and paragraph bottom-margins using harmonic ratios (`major_third`, `perfect_fourth`, `golden_ratio`) with guaranteed WCAG compliance flags.

---

### 7. Issue #667: 4-7-8 & Box Breathing Parasympathetic Recovery Cycle Calculator
* **Source Path:** `src/lib/health/breathwork.ts`
* **Test Path:** `tests/breathwork.test.ts`
* **Underlying Science:** Autonomic nervous system regulation via Dr. Andrew Weil's 4-7-8 method and Navy SEAL Box Breathing (4-4-4-4).
* **Core Behavior:** Generates second-accurate phase timelines (Inhale, Hold, Exhale, Hold) with heart-rate variability (HRV) recovery estimations and phase timestamps for meditation and focus cooldowns.

---

### 8. Issue #668: Temptation Bundling & Premack Principle Synergy Matcher
* **Source Path:** `src/lib/discipline/temptation-bundler.ts`
* **Test Path:** `tests/temptation-bundler.test.ts`
* **Underlying Science:** Katherine Milkman's Temptation Bundling & David Premack's Principle.
* **Core Behavior:** Pairs high-resistance discipline tasks (e.g., studying, tax admin, cardio) with high-craving guilty pleasures (e.g., favorite podcasts, luxury coffee) and calculates temptation bundling compatibility scores.

---

### 9. Issue #669: Circadian Cortisol Awakening Response (CAR) Work Alignment Planner
* **Source Path:** `src/lib/rituals/cortisol-curve.ts`
* **Test Path:** `tests/cortisol-curve.test.ts`
* **Underlying Science:** Human chronobiology and Cortisol Awakening Response (CAR peak at $+30$ to $+45$ minutes post-waking).
* **Core Behavior:** Maps user wake-up times and chronotypes (`lark`, `intermediate`, `night_owl`) to diurnal cortisol and melatonin curves, outputting peak deep-work time blocks and low-arousal administrative windows.

---

### 10. Issue #670: Pearson Correlation Coefficient Matrix for Multi-Habit Synergy
* **Source Path:** `src/lib/analytics/correlation-matrix.ts`
* **Test Path:** `tests/correlation-matrix.test.ts`
* **Underlying Science:** Pearson bivariate correlation coefficient ($r \in [-1.0, 1.0]$).
* **Core Behavior:** Aggregates multi-habit completion arrays across common historical date windows, computes an $N \times N$ symmetric correlation matrix, and identifies keystone habits (positive synergy) and conflicting habits (negative friction).

---

## 📌 Contributor Best Practices
1. **Zero External Dependencies:** All logic must be pure TypeScript relying exclusively on native language features or Node built-in packages (`node:crypto`).
2. **Deterministic & Unit Tested:** Every implementation must include a dedicated test suite under `tests/` passing cleanly with `npm test`.
3. **Execution Verification:** Run `npm test` and `npm run typecheck` locally before opening pull requests.
