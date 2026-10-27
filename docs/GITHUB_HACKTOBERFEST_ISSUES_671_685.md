# PACT — Hacktoberfest High-Impact Issue Catalog (Issues #671–#685)

This document catalogs **15 curated, algorithmic, security, and game-theoretic issues** ([#671](https://github.com/TheVicky1/Pact_OS/issues/671)–[#685](https://github.com/TheVicky1/Pact_OS/issues/685)) published live to the `TheVicky1/Pact_OS` repository on GitHub to welcome **Hacktoberfest** and open-source contributors.

---

## ⚡ Issue Summary & Distribution Matrix

| Issue # | Direct Link | Title | Category | Status | Target File |
| :---: | :---: | :--- | :--- | :---: | :--- |
| **#671** | [#671](https://github.com/TheVicky1/Pact_OS/issues/671) | `[Analytics] Add Shannon Entropy Habit Routine Predictability & Chaos Index in src/lib/analytics/routine-entropy.ts` | 📊 Analytics & Information Theory | Open | `src/lib/analytics/routine-entropy.ts` |
| **#672** | [#672](https://github.com/TheVicky1/Pact_OS/issues/672) | `[Focus] Add Parked Distraction "Jot-List" & Post-Focus Triage Queue in src/lib/focus/distraction-triage.ts` | 🧠 Focus & Attention | Open | `src/lib/focus/distraction-triage.ts` |
| **#673** | [#673](https://github.com/TheVicky1/Pact_OS/issues/673) | `[Discipline] Add Fogg Behavior Model (B = MAP) Task Friction & Activation Threshold Diagnostic in src/lib/discipline/fogg-behavior-model.ts` | ⚡ Discipline & Behavioral Psych | Open | `src/lib/discipline/fogg-behavior-model.ts` |
| **#674** | [#674](https://github.com/TheVicky1/Pact_OS/issues/674) | `[Data] Add Delta-RLE Timestamp Compression & Decompression Engine in src/lib/data/delta-rle-compressor.ts` | 💾 Data Compression | Open | `src/lib/data/delta-rle-compressor.ts` |
| **#675** | [#675](https://github.com/TheVicky1/Pact_OS/issues/675) | `[Finance] Add Commitment Bond Slashing & Progressive Escrow Forfeiture Schedule in src/lib/finance/bond-slashing.ts` | 💸 Finance & Escrow | Open | `src/lib/finance/bond-slashing.ts` |
| **#676** | [#676](https://github.com/TheVicky1/Pact_OS/issues/676) | `[Audio] Add ISO 226 Equal-Loudness Contour & Octave Band Attenuation Filter in src/lib/audio/equal-loudness.ts` | 🔊 Audio & Psychoacoustics | Open | `src/lib/audio/equal-loudness.ts` |
| **#677** | [#677](https://github.com/TheVicky1/Pact_OS/issues/677) | `[Habits] Add Habit Stacking Anchor Compatibility & Transition Latency Scorer in src/lib/habits/habit-stacking.ts` | 🔁 Habits & Behavioral Design | Open | `src/lib/habits/habit-stacking.ts` |
| **#678** | [#678](https://github.com/TheVicky1/Pact_OS/issues/678) | `[Security] Add Shamir's Secret Sharing (2-of-3) Threshold Key Splitter in src/lib/security/shamir-secret.ts` | 🛡️ Security & Cryptography | Open | `src/lib/security/shamir-secret.ts` |
| **#679** | [#679](https://github.com/TheVicky1/Pact_OS/issues/679) | `[Discipline] Add Decision Fatigue Index & Daily Choice Budget Allocator in src/lib/discipline/decision-fatigue.ts` | ⚡ Discipline & Cognition | Open | `src/lib/discipline/decision-fatigue.ts` |
| **#680** | [#680](https://github.com/TheVicky1/Pact_OS/issues/680) | `[Analytics] Add Zipf's Law Priority Power-Law Distribution Validator in src/lib/analytics/zipf-distribution.ts` | 📊 Analytics & Statistical Physics | Open | `src/lib/analytics/zipf-distribution.ts` |
| **#681** | [#681](https://github.com/TheVicky1/Pact_OS/issues/681) | `[Data] Add Geohash Precision Encoder & Proximity Bounding Box for Location-Based Pacts in src/lib/data/geohash.ts` | 🗺️ Data & Geolocation | Open | `src/lib/data/geohash.ts` |
| **#682** | [#682](https://github.com/TheVicky1/Pact_OS/issues/682) | `[Focus] Add Cognitive Warm-up Sigmoid Ramping Curve & Flow Onset Estimator in src/lib/focus/cognitive-ramping.ts` | 🧠 Focus & Flow State | Open | `src/lib/focus/cognitive-ramping.ts` |
| **#683** | [#683](https://github.com/TheVicky1/Pact_OS/issues/683) | `[Gamification] Add Six-Attribute Character Skill Tree & Level Progression Matrix in src/lib/gamification/skill-tree.ts` | 🎮 Gamification & Progression | Open | `src/lib/gamification/skill-tree.ts` |
| **#684** | [#684](https://github.com/TheVicky1/Pact_OS/issues/684) | `[Rituals] Add Social Jetlag & Sleep Debt Circadian Phase Delay Calculator in src/lib/rituals/social-jetlag.ts` | 🌅 Rituals & Chronobiology | Open | `src/lib/rituals/social-jetlag.ts` |
| **#685** | [#685](https://github.com/TheVicky1/Pact_OS/issues/685) | `[Finance] Add Dutch Auction Escalating Penalty Price Decaying Multiplier in src/lib/finance/dutch-auction-penalty.ts` | 💸 Finance & Auctions | ✅ Merged (#686) | `src/lib/finance/dutch-auction-penalty.ts` |

---

## 📋 Architectural Specifications

### 1. Issue #671: Shannon Entropy Habit Routine Predictability & Chaos Index
* **Source Path:** `src/lib/analytics/routine-entropy.ts`
* **Test Path:** `tests/routine-entropy.test.ts`
* **Underlying Science:** Claude Shannon's Information Entropy ($H(X) = -\sum_{i=1}^n p(x_i) \log_2 p(x_i)$).
* **Core Behavior:** Computes the mathematical predictability and chaotic dispersion of habit execution times across hours of the day ($0–23$). Distinguishes rock-solid automated routines ($H < 1.5$ bits) from erratic ad-hoc patterns ($H > 3.5$ bits).

---

### 2. Issue #672: Parked Distraction "Jot-List" & Post-Focus Triage Queue
* **Source Path:** `src/lib/focus/distraction-triage.ts`
* **Test Path:** `tests/distraction-triage.test.ts`
* **Underlying Science:** Bluma Zeigarnik's Effect (intrusive cognitive tension from open mental loops).
* **Core Behavior:** Provides an offline-first in-memory capture queue allowing users during active focus sessions to quickly offload intrusive thoughts with zero context switching, followed by automated post-session triage categorization (`convert_to_task`, `delegate`, `discard`).

---

### 3. Issue #673: Fogg Behavior Model (B = MAP) Task Friction Diagnostic
* **Source Path:** `src/lib/discipline/fogg-behavior-model.ts`
* **Test Path:** `tests/fogg-behavior-model.test.ts`
* **Underlying Science:** Dr. BJ Fogg's Behavior Model ($B = \text{Motivation} \times \text{Ability} \times \text{Prompt}$).
* **Core Behavior:** Diagnoses why a user procrastinates or fails a commitment by decomposing perceived friction into 6 sub-dimensions (Time, Money, Physical Effort, Brain Cycles, Social Deviance, Non-Routine) and evaluating whether the task crosses the Action Line.

---

### 4. Issue #674: Delta-RLE Timestamp Compression & Decompression Engine
* **Source Path:** `src/lib/data/delta-rle-compressor.ts`
* **Test Path:** `tests/delta-rle-compressor.test.ts`
* **Underlying Science:** Difference Encoding (Delta) combined with Run-Length Encoding (RLE).
* **Core Behavior:** Efficiently compresses monotonic ascending millisecond timestamps (e.g. focus ticks, habit check-ins) into compact integer delta pairs, optimizing client storage and bandwidth during sync.

---

### 5. Issue #675: Commitment Bond Slashing & Progressive Escrow Forfeiture Schedule
* **Source Path:** `src/lib/finance/bond-slashing.ts`
* **Test Path:** `tests/bond-slashing.test.ts`
* **Underlying Science:** Smart contract stake slashing curves and game-theoretic escrow governance.
* **Core Behavior:** Calculates progressive forfeiture percentages for overdue financial accountability contracts based on elapsed grace-period hours, repeat breach counts, and anti-gaming penalty ceilings.

---

### 6. Issue #676: ISO 226 Equal-Loudness Contour & Octave Band Filter
* **Source Path:** `src/lib/audio/equal-loudness.ts`
* **Test Path:** `tests/equal-loudness.test.ts`
* **Underlying Science:** ISO 226:2003 Acoustics — Normal equal-loudness-level contours (Fletcher-Munson).
* **Core Behavior:** Computes decibel attenuation adjustments across standard octave center frequencies ($63\,\text{Hz}$ to $16\,\text{kHz}$) to compensate for human ear non-linear sensitivity, providing balanced white and brown ambient noise generation.

---

### 7. Issue #677: Habit Stacking Anchor Compatibility & Transition Latency Scorer
* **Source Path:** `src/lib/habits/habit-stacking.ts`
* **Test Path:** `tests/habit-stacking.test.ts`
* **Underlying Science:** James Clear & BJ Fogg Habit Stacking (*"After [Current Habit], I will [New Habit]"*).
* **Core Behavior:** Evaluates physical location compatibility, energy state transitions, and environmental latency between an anchor habit and a candidate target habit.

---

### 8. Issue #678: Shamir's Secret Sharing (2-of-3) Threshold Key Splitter
* **Source Path:** `src/lib/security/shamir-secret.ts`
* **Test Path:** `tests/shamir-secret.test.ts`
* **Underlying Science:** Adi Shamir's $(k, n)$ Threshold Secret Sharing polynomial scheme over finite Galois field $\text{GF}(256)$.
* **Core Behavior:** Splits sensitive consequence accountability unlocking keys into 3 distinct cryptographic shares such that any 2 shares are necessary and sufficient to reconstruct the secret, while any single share leaks zero information.

---

### 9. Issue #679: Decision Fatigue Index & Daily Choice Budget Allocator
* **Source Path:** `src/lib/discipline/decision-fatigue.ts`
* **Test Path:** `tests/decision-fatigue.test.ts`
* **Underlying Science:** Danziger, Levav & Avnaim-Pesso (2011) judicial decision fatigue & Kathleen Vohs ego depletion.
* **Core Behavior:** Models cognitive choice points throughout the day, scoring decision complexity and warning users when their daily decision budget is depleted before high-stakes evening planning.

---

### 10. Issue #680: Zipf's Law Priority Power-Law Distribution Validator
* **Source Path:** `src/lib/analytics/zipf-distribution.ts`
* **Test Path:** `tests/zipf-distribution.test.ts`
* **Underlying Science:** Zipf's Law ($f(r) \propto 1/r^s$) and Pareto 80/20 distribution analysis.
* **Core Behavior:** Analyzes task priority backlogs to determine if user tasks follow healthy power-law distributions (small set of critical P1 priorities, wider tail of routine P3/P4 tasks) or suffer from toxic "everything is an emergency" clustering.

---

### 11. Issue #681: Geohash Precision Encoder & Proximity Bounding Box for Location-Based Pacts
* **Source Path:** `src/lib/data/geohash.ts`
* **Test Path:** `tests/geohash.test.ts`
* **Underlying Science:** Gustavo Niemeyer's Geohash hierarchical spatial data structure.
* **Core Behavior:** Encodes latitude and longitude coordinates into Base32 geohashes, calculates bounding boxes for location-verified pacts (e.g. gym check-in within 100 meters), and determines neighboring cells without external GIS dependencies.

---

### 12. Issue #682: Cognitive Warm-up Sigmoid Ramping Curve & Flow Onset Estimator
* **Source Path:** `src/lib/focus/cognitive-ramping.ts`
* **Test Path:** `tests/cognitive-ramping.test.ts`
* **Underlying Science:** Mihaly Csikszentmihalyi's Flow State dynamics and cognitive task switching cost.
* **Core Behavior:** Models the progressive transition into deep flow via an S-curve sigmoid function ($1 / (1 + e^{-k(t - t_0)})$), discounting early session minutes and predicting when the user reaches peak flow velocity.

---

### 13. Issue #683: Six-Attribute Character Skill Tree & Level Progression Matrix
* **Source Path:** `src/lib/gamification/skill-tree.ts`
* **Test Path:** `tests/skill-tree.test.ts`
* **Underlying Science:** RPG attribute balancing and non-linear diminishing returns leveling curves.
* **Core Behavior:** Maintains an RPG character state across 6 core discipline pillars: Discipline, Focus, Vitality, Knowledge, Grit, and Harmony. Computes experience point thresholds and level achievements.

---

### 14. Issue #684: Social Jetlag & Sleep Debt Circadian Phase Delay Calculator
* **Source Path:** `src/lib/rituals/social-jetlag.ts`
* **Test Path:** `tests/social-jetlag.test.ts`
* **Underlying Science:** Till Roenneberg's Social Jetlag metric ($\Delta MSF_{sc}$) measuring discrepancies between biological sleep timing and social schedules.
* **Core Behavior:** Quantifies mid-sleep phase shifts between workdays and free days, calculating chronic sleep debt accumulation and circadian disruption index ($0–100$).

---

### 15. Issue #685: Dutch Auction Escalating Penalty Price Decaying Multiplier
* **Source Path:** `src/lib/finance/dutch-auction-penalty.ts`
* **Test Path:** `tests/dutch-auction-penalty.test.ts`
* **Status:** ✅ **RESOLVED & MERGED** via Pull Request [#686](https://github.com/TheVicky1/Pact_OS/pull/686) by Aryan (`@Aryan9891`).
* **Core Behavior:** Computes descending or ascending auction multipliers for accountability resolution waivers, decaying exponentially towards the base price over time.

---

## 📌 Contributor Best Practices
1. **Zero External Dependencies:** All logic must be pure TypeScript relying exclusively on native language features or Node built-in packages (`node:crypto`).
2. **Deterministic & Unit Tested:** Every implementation must include a dedicated test suite under `tests/` passing cleanly with `npm test`.
3. **Execution Verification:** Run `npm test` and `npm run typecheck` locally before opening pull requests.
