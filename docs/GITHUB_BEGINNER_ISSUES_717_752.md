# PACT — Curated Beginner & Micro-Task Issue Catalog (Issues #717–#752)

This document catalogs **29 curated, validated, and beginner-friendly issues** ([#717](https://github.com/TheVicky1/Pact_OS/issues/717)–[#752](https://github.com/TheVicky1/Pact_OS/issues/752)) designed for first-time open-source contributors and Hacktoberfest developers joining the PACT project.

Every task in this catalog adheres to PACT's **Micro-Contribution Standard**: bounded to a single file, verified via local tests or typechecks, with zero cloud dependency requirements and zero production risk.

---

## ⚡ Issue Summary & Distribution Matrix

| Issue # | Direct Link | Title | Category | Status | Target File |
| :---: | :---: | :--- | :--- | :---: | :--- |
| **#717** | [#717](https://github.com/TheVicky1/Pact_OS/issues/717) | `[Discipline] Add Eat-The-Frog Task Frog Score & Morning Priority Ranker` | ⚡ Discipline | Open | `src/lib/discipline/frog-score.ts` |
| **#718** | [#718](https://github.com/TheVicky1/Pact_OS/issues/718) | `[Habits] Add Two-Minute Rule Task Ignition & Micro-Step Extractor` | 🔁 Habits | ✅ Merged (#738) | `src/lib/habits/two-minute-rule.ts` |
| **#719** | [#719](https://github.com/TheVicky1/Pact_OS/issues/719) | `[Gamification] Add Pomodoro Combo Multiplier & Streak Bonus Calculator` | 🎮 Gamification | Open | `src/lib/gamification/combo-multiplier.ts` |
| **#720** | [#720](https://github.com/TheVicky1/Pact_OS/issues/720) | `[Finance] Add Anti-Impulse 24-Hour Purchase Cooling-Off Timer` | 💸 Finance | Open | `src/lib/finance/cooling-off.ts` |
| **#721** | [#721](https://github.com/TheVicky1/Pact_OS/issues/721) | `[Rituals] Add Ultradian 90-Minute Rhythm Peak Energy Window Finder` | 🌅 Rituals | Open | `src/lib/rituals/ultradian-rhythm.ts` |
| **#722** | [#722](https://github.com/TheVicky1/Pact_OS/issues/722) | `[Data] Add Luhn Algorithm Checksum Validator for Accountability Bond IDs` | 💾 Data & Security | ✅ Merged (#737) | `src/lib/data/luhn-validator.ts` |
| **#723** | [#723](https://github.com/TheVicky1/Pact_OS/issues/723) | `[Health] Add Hydration Target Calculator & Daily Sip Pacing Engine` | 💧 Health | Open | `src/lib/health/hydration-pacing.ts` |
| **#724** | [#724](https://github.com/TheVicky1/Pact_OS/issues/724) | `[Analytics] Add Task Priority Eisenhower Matrix Quadrant Classifier` | 📊 Analytics | Open | `src/lib/analytics/eisenhower-matrix.ts` |
| **#725** | [#725](https://github.com/TheVicky1/Pact_OS/issues/725) | `[Focus] Add 5-Second Rule Inertia Breaker Countdown Engine` | 🧠 Focus | Open | `src/lib/focus/five-second-rule.ts` |
| **#726** | [#726](https://github.com/TheVicky1/Pact_OS/issues/726) | `[Habits] Add Seinfeld "Don't Break the Chain" Calendar Completion Streak Checker` | 🔁 Habits | ✅ Merged (#727) | `src/lib/habits/chain-streak.ts` |
| **#728** | [#728](https://github.com/TheVicky1/Pact_OS/issues/728) | `docs: add VS Code recommended extensions and launch configurations` | 📖 Documentation | Open | `docs/DEVELOPMENT.md` |
| **#729** | [#729](https://github.com/TheVicky1/Pact_OS/issues/729) | `docs: add Environment Variables reference matrix and fallback guide` | 📖 Documentation | Open | `docs/DEVELOPMENT.md` |
| **#730** | [#730](https://github.com/TheVicky1/Pact_OS/issues/730) | `docs: add First-Time Contributor FAQ section` | 📖 Documentation | Open | `docs/CONTRIBUTING-BEGINNERS.md` |
| **#731** | [#731](https://github.com/TheVicky1/Pact_OS/issues/731) | `docs: add Web Accessibility (WCAG 2.1 AA) component checklist` | ♿ Accessibility | Open | `docs/DESIGN_SYSTEM.md` |
| **#732** | [#732](https://github.com/TheVicky1/Pact_OS/issues/732) | `docs: add Pomodoro technique best practices and interval customization guide` | 📖 Documentation | Open | `docs/FEATURES.md` |
| **#733** | [#733](https://github.com/TheVicky1/Pact_OS/issues/733) | `docs: add Habit Formation psychology primer (Cue, Craving, Response, Reward)` | 📖 Documentation | Open | `docs/FEATURES.md` |
| **#734** | [#734](https://github.com/TheVicky1/Pact_OS/issues/734) | `docs: add Offline PWA service worker debugging & cache inspection guide` | 📖 Documentation | ✅ Merged (#735) | `docs/TROUBLESHOOTING.md` |
| **#739** | [#739](https://github.com/TheVicky1/Pact_OS/issues/739) | `[Finance] Add Emergency Fund Runway & Months of Safety Margin Calculator` | 💸 Finance | Open | `src/lib/finance/emergency-runway.ts` |
| **#740** | [#740](https://github.com/TheVicky1/Pact_OS/issues/740) | `[Focus] Add Pomodoro Streak Combo Bonus Points Multiplier` | 🧠 Focus | Open | `src/lib/focus/pomodoro-multiplier.ts` |
| **#741** | [#741](https://github.com/TheVicky1/Pact_OS/issues/741) | `[Text] Add Reading Time & Word Count Estimator for Reflection Notes` | 📝 Text Processing | Open | `src/lib/text/reading-time.ts` |
| **#742** | [#742](https://github.com/TheVicky1/Pact_OS/issues/742) | `[Data] Add Human-Readable Byte Size Formatter (SI and IEC Binary Units)` | 💾 Data Utilities | Open | `src/lib/data/byte-formatter.ts` |
| **#745** | [#745](https://github.com/TheVicky1/Pact_OS/issues/745) | `[Data] Add URL-Safe Slug Generator for Task & Goal Titles` | 💾 Data Utilities | Open | `src/lib/data/slug-generator.ts` |
| **#746** | [#746](https://github.com/TheVicky1/Pact_OS/issues/746) | `[Health] Add Daily Step Count to Calorie Energy Expenditure Estimator` | 💧 Health | Open | `src/lib/health/step-calorie.ts` |
| **#747** | [#747](https://github.com/TheVicky1/Pact_OS/issues/747) | `[Focus] Add 20-20-20 Rule Eye Strain & Micro-Break Cadence Scheduler` | 🧠 Focus | Open | `src/lib/focus/micro-break.ts` |
| **#748** | [#748](https://github.com/TheVicky1/Pact_OS/issues/748) | `[Finance] Add Fair Bill & Expense Split Divider with Cent Remainder Balancing` | 💸 Finance | Open | `src/lib/finance/split-bill.ts` |
| **#749** | [#749](https://github.com/TheVicky1/Pact_OS/issues/749) | `[Audio] Add Linear Amplitude to Decibel Attenuation Converter` | 🔊 Audio & Focus | Open | `src/lib/audio/decibel-scale.ts` |
| **#750** | [#750](https://github.com/TheVicky1/Pact_OS/issues/750) | `[Gamification] Add Tiered Badge Milestone Progression Tracker` | 🎮 Gamification | Open | `src/lib/gamification/badge-progress.ts` |
| **#751** | [#751](https://github.com/TheVicky1/Pact_OS/issues/751) | `[Text] Add Case-Insensitive Tag Sanitizer & Deduplicator` | 📝 Text Processing | Open | `src/lib/text/tag-normalizer.ts` |
| **#752** | [#752](https://github.com/TheVicky1/Pact_OS/issues/752) | `[Data] Add Pure Array Chunker & Batch Paginator` | 💾 Data Utilities | Open | `src/lib/data/array-chunk.ts` |

---

## 📋 Batch Specifications

### Batch 8: Behavioral Design, Chronobiology & Momentum (#717–#726)

#### Issue #717: [Discipline] Add Eat-The-Frog Task Frog Score & Morning Priority Ranker
* **Source Path:** `src/lib/discipline/frog-score.ts`
* **Test Path:** `tests/frog-score.test.ts`
* **Concept:** Brian Tracy's *"Eat That Frog!"* heuristic ($S = \text{impact} \times \text{resistance} / \text{time}$).
* **Core Behavior:** Computes a 0–100 difficulty/impact score for pending tasks, ranking the most critical "frog" to tackle during high-willpower morning windows.

#### Issue #718: [Habits] Add Two-Minute Rule Task Ignition & Micro-Step Extractor
* **Source Path:** `src/lib/habits/two-minute-rule.ts`
* **Test Path:** `tests/two-minute-rule.test.ts`
* **Status:** ✅ Merged via PR [#738](https://github.com/TheVicky1/Pact_OS/pull/738) by [@Ritin1308](https://github.com/Ritin1308).

#### Issue #719: [Gamification] Add Pomodoro Combo Multiplier & Streak Bonus Calculator
* **Source Path:** `src/lib/gamification/combo-multiplier.ts`
* **Test Path:** `tests/combo-multiplier.test.ts`
* **Concept:** Flow state compounding reward schedules.
* **Core Behavior:** Rewards uninterrupted back-to-back focus intervals with escalating XP score multipliers while safely capping multi-session fatigue.

#### Issue #720: [Finance] Add Anti-Impulse 24-Hour Purchase Cooling-Off Timer
* **Source Path:** `src/lib/finance/cooling-off.ts`
* **Test Path:** `tests/cooling-off.test.ts`
* **Concept:** Hyperbolic discounting mitigation and impulse purchase suppression.
* **Core Behavior:** Implements mandatory cooling-off countdown thresholds based on discretionary purchase price relative to user hourly income.

#### Issue #721: [Rituals] Add Ultradian 90-Minute Rhythm Peak Energy Window Finder
* **Source Path:** `src/lib/rituals/ultradian-rhythm.ts`
* **Test Path:** `tests/ultradian-rhythm.test.ts`
* **Concept:** Nathaniel Kleitman's Basic Rest-Activity Cycle (BRAC).
* **Core Behavior:** Maps 90-minute high-focus alertness peaks alternating with 20-minute recovery dips from wake-up time throughout the working day.

#### Issue #722: [Data] Add Luhn Algorithm Checksum Validator for Accountability Bond IDs
* **Source Path:** `src/lib/data/luhn-validator.ts`
* **Test Path:** `tests/luhn-validator.test.ts`
* **Status:** ✅ Merged via PR [#737](https://github.com/TheVicky1/Pact_OS/pull/737) by [@hieuk48](https://github.com/hieuk48).

#### Issue #723: [Health] Add Hydration Target Calculator & Daily Sip Pacing Engine
* **Source Path:** `src/lib/health/hydration-pacing.ts`
* **Test Path:** `tests/hydration-pacing.test.ts`
* **Concept:** Circadian fluid balance and dehydration prevention during deep work.
* **Core Behavior:** Recommends hourly milliliter sip targets based on body weight, workout intensity, and active ambient temperature.

#### Issue #724: [Analytics] Add Task Priority Eisenhower Matrix Quadrant Classifier
* **Source Path:** `src/lib/analytics/eisenhower-matrix.ts`
* **Test Path:** `tests/eisenhower-matrix.test.ts`
* **Concept:** Dwight D. Eisenhower's Urgency-Importance Decision Framework.
* **Core Behavior:** Categorizes tasks into Q1 (*Do First*), Q2 (*Schedule*), Q3 (*Delegate*), and Q4 (*Eliminate*) with quadrant distribution percentages.

#### Issue #725: [Focus] Add 5-Second Rule Inertia Breaker Countdown Engine
* **Source Path:** `src/lib/focus/five-second-rule.ts`
* **Test Path:** `tests/five-second-rule.test.ts`
* **Concept:** Mel Robbins' 5-Second Rule (prefrontal cortex activation countdown).
* **Core Behavior:** Evaluates countdown start timestamps, abort conditions, and execution transition states ($5 \to 4 \to 3 \to 2 \to 1 \to \text{Ignite}$).

#### Issue #726: [Habits] Add Seinfeld "Don't Break the Chain" Calendar Completion Streak Checker
* **Source Path:** `src/lib/habits/chain-streak.ts`
* **Test Path:** `tests/chain-streak.test.ts`
* **Status:** ✅ Merged via PR [#727](https://github.com/TheVicky1/Pact_OS/pull/727) by [@Ritin1308](https://github.com/Ritin1308).

---

### Batch 9: Documentation & Developer Experience (#728–#734)

#### Issue #728: docs: add VS Code recommended extensions and launch configurations
* **Target File:** `docs/DEVELOPMENT.md`
* **Scope:** Document `.vscode/extensions.json` and debugger launch targets for Next.js 16 and Jest/Node test execution.

#### Issue #729: docs: add Environment Variables reference matrix and fallback guide
* **Target File:** `docs/DEVELOPMENT.md`
* **Scope:** Add exhaustive environment variable table with production, preview, and local offline fallback behaviors.

#### Issue #730: docs: add First-Time Contributor FAQ section
* **Target File:** `docs/CONTRIBUTING-BEGINNERS.md`
* **Scope:** Add dedicated FAQ covering branch naming, offline mock test suites, and CLA/DCO guidelines.

#### Issue #731: docs: add Web Accessibility (WCAG 2.1 AA) component checklist
* **Target File:** `docs/DESIGN_SYSTEM.md`
* **Scope:** Standardize accessibility requirements (4.5:1 contrast, keyboard focus rings, `aria-pressed` states).

#### Issue #732: docs: add Pomodoro technique best practices and interval customization guide
* **Target File:** `docs/FEATURES.md`
* **Scope:** Document Pomodoro 25/5 and 50/10 intervals, task batching rules, and break cadence recommendations.

#### Issue #733: docs: add Habit Formation psychology primer (Cue, Craving, Response, Reward)
* **Target File:** `docs/FEATURES.md`
* **Scope:** Explain the 4-stage habit loop architecture powering PACT's habit tracking modules.

#### Issue #734: docs: add Offline PWA service worker debugging & cache inspection guide
* **Target File:** `docs/TROUBLESHOOTING.md`
* **Status:** ✅ Merged via PR [#735](https://github.com/TheVicky1/Pact_OS/pull/735) by [@questelalex7-coder](https://github.com/questelalex7-coder).

---

### Batch 10: Financial Runway & Utility Engines (#739–#742)

#### Issue #739: [Finance] Add Emergency Fund Runway & Months of Safety Margin Calculator
* **Source Path:** `src/lib/finance/emergency-runway.ts`
* **Test Path:** `tests/emergency-runway.test.ts`
* **Core Behavior:** Calculates total survival runway in months from liquid balances divided by essential monthly burn rate, surfacing risk alert badges.

#### Issue #740: [Focus] Add Pomodoro Streak Combo Bonus Points Multiplier
* **Source Path:** `src/lib/focus/pomodoro-multiplier.ts`
* **Test Path:** `tests/pomodoro-multiplier.test.ts`
* **Core Behavior:** Computes bonus focus score points for back-to-back Pomodoros completed without abandonment or pause infractions.

#### Issue #741: [Text] Add Reading Time & Word Count Estimator for Reflection Notes
* **Source Path:** `src/lib/text/reading-time.ts`
* **Test Path:** `tests/reading-time.test.ts`
* **Core Behavior:** Estimates word count, character count, and reading duration (at 200–250 WPM) for daily reflection notes and goal retrospectives.

#### Issue #742: [Data] Add Human-Readable Byte Size Formatter (SI and IEC Binary Units)
* **Source Path:** `src/lib/data/byte-formatter.ts`
* **Test Path:** `tests/byte-formatter.test.ts`
* **Core Behavior:** Formats raw integer byte counts into decimal (KB, MB, GB; base 1000) and binary (KiB, MiB, GiB; base 1024) notation with configurable decimal precision.

---

### Batch 11: Pure Functional Building Blocks (#745–#752)

#### Issue #745: [Data] Add URL-Safe Slug Generator for Task & Goal Titles
* **Source Path:** `src/lib/data/slug-generator.ts`
* **Test Path:** `tests/slug-generator.test.ts`
* **Core Behavior:** Converts arbitrary UTF-8 strings into clean, lowercase, hyphen-delimited ASCII slugs with diacritic normalization and length trimming.

#### Issue #746: [Health] Add Daily Step Count to Calorie Energy Expenditure Estimator
* **Source Path:** `src/lib/health/step-calorie.ts`
* **Test Path:** `tests/step-calorie.test.ts`
* **Core Behavior:** Estimates active kcal expenditure from step count, body weight, stride length, and walking pace.

#### Issue #747: [Focus] Add 20-20-20 Rule Eye Strain & Micro-Break Cadence Scheduler
* **Source Path:** `src/lib/focus/micro-break.ts`
* **Test Path:** `tests/micro-break.test.ts`
* **Core Behavior:** Tracks continuous screen exposure minutes and generates 20-second distant gaze micro-break prompts every 20 minutes.

#### Issue #748: [Finance] Add Fair Bill & Expense Split Divider with Cent Remainder Balancing
* **Source Path:** `src/lib/finance/split-bill.ts`
* **Test Path:** `tests/split-bill.test.ts`
* **Core Behavior:** Divides shared integer cent expenses across $N$ participants without floating-point drift, deterministically allocating 1-cent remainders.

#### Issue #749: [Audio] Add Linear Amplitude to Decibel Attenuation Converter
* **Source Path:** `src/lib/audio/decibel-scale.ts`
* **Test Path:** `tests/decibel-scale.test.ts`
* **Core Behavior:** Converts normalized 0.0–1.0 linear volume sliders to logarithmic decibel attenuation ($dB = 20 \log_{10}(A)$) and vice-versa.

#### Issue #750: [Gamification] Add Tiered Badge Milestone Progression Tracker
* **Source Path:** `src/lib/gamification/badge-progress.ts`
* **Test Path:** `tests/badge-progress.test.ts`
* **Core Behavior:** Evaluates user metrics against Bronze, Silver, Gold, and Obsidian milestone tiers, returning progress percentages and remaining requirements.

#### Issue #751: [Text] Add Case-Insensitive Tag Sanitizer & Deduplicator
* **Source Path:** `src/lib/text/tag-normalizer.ts`
* **Test Path:** `tests/tag-normalizer.test.ts`
* **Core Behavior:** Trims, deduplicates, and validates tag arrays while preserving user display casing and enforcing max-length boundaries.

#### Issue #752: [Data] Add Pure Array Chunker & Batch Paginator
* **Source Path:** `src/lib/data/array-chunk.ts`
* **Test Path:** `tests/array-chunk.test.ts`
* **Core Behavior:** Partitions arbitrary arrays into fixed-size chunks and provides 1-based page window slicing with metadata.

---

## 🛠️ Verification & Testing Commands

To verify your implementation locally before submitting a pull request:

```bash
# Run unit tests for a specific task
npm run test:file -- tests/<filename>.test.ts

# Run the complete test matrix
npm test

# Typecheck TypeScript definitions
npm run typecheck
```
