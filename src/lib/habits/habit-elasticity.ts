/**
 * Behavioral Habit Elasticity & Slump Recovery Model
 *
 * Implements exponential half-life decay discounting for habit continuity to prevent
 * the psychological "what-the-hell" abandonment effect (Polivy & Herman) when habit
 * streaks are interrupted.
 *
 * Rather than abruptly resetting momentum to absolute zero upon a single missed day,
 * this model preserves neural habit elasticity based on accumulated streak depth
 * and time-discounted decay:
 *
 *   Momentum: M = min(1.0, 1 - exp(-0.06 * streakBeforeBreak))
 *   Decay:    D = 0.5 ^ (daysMissed / halfLifeDays)
 *   Score:    ElasticityScore = round(100 * M * D) [0 - 100%]
 *   Credits:  RetainedStreakCredits = floor(streakBeforeBreak * ElasticityScore / 100)
 *             (Expires to 0 for prolonged absence > 14 days)
 *
 * @module src/lib/habits/habit-elasticity
 */

export interface HabitElasticityOptions {
  streakBeforeBreak: number;
  daysMissed: number;
  halfLifeDays?: number;
}

export interface HabitElasticityReport {
  elasticityScore: number;
  retainedStreakCredits: number;
  slumpSeverity:
    | 'minor_hiccup'
    | 'slippery_slope'
    | 'habit_dormant'
    | 'full_extinction';
  resilienceMessage: string;
  suggestedAction:
    | 'immediate_one_rep_win'
    | 'half_volume_session'
    | 'full_ritual_restart';
}

/**
 * Calculates decay-discounted habit elasticity and slump recovery metrics.
 *
 * @param options Calculation options including prior streak, days missed, and optional half-life
 * @returns Comprehensive recovery report with elasticity score, retained credits, severity, and guidance
 * @throws {TypeError} If options or arguments are of invalid type
 * @throws {RangeError} If numerical inputs are negative, non-finite, or halfLifeDays <= 0
 */
export function calculateHabitElasticity(
  options: HabitElasticityOptions
): HabitElasticityReport {
  if (!options || typeof options !== 'object') {
    throw new TypeError('Options must be provided as an object');
  }

  const { streakBeforeBreak, daysMissed } = options;

  if (typeof streakBeforeBreak !== 'number') {
    throw new TypeError('streakBeforeBreak must be a number');
  }
  if (!Number.isFinite(streakBeforeBreak) || streakBeforeBreak < 0) {
    throw new RangeError(
      `streakBeforeBreak must be a finite non-negative number, got: ${streakBeforeBreak}`
    );
  }

  if (typeof daysMissed !== 'number') {
    throw new TypeError('daysMissed must be a number');
  }
  if (!Number.isFinite(daysMissed) || daysMissed < 0) {
    throw new RangeError(
      `daysMissed must be a finite non-negative number, got: ${daysMissed}`
    );
  }

  const halfLifeDays = options.halfLifeDays ?? 3;
  if (typeof halfLifeDays !== 'number') {
    throw new TypeError('halfLifeDays must be a number');
  }
  if (!Number.isFinite(halfLifeDays) || halfLifeDays <= 0) {
    throw new RangeError(
      `halfLifeDays must be a finite positive number greater than 0, got: ${halfLifeDays}`
    );
  }

  // 1. Baseline momentum accumulation: M = min(1.0, 1 - exp(-0.06 * streakBeforeBreak))
  const momentum = Math.min(1.0, 1 - Math.exp(-0.06 * streakBeforeBreak));

  // 2. Exponential decay factor over missed days: decay = 0.5 ^ (daysMissed / halfLifeDays)
  const decay = Math.pow(0.5, daysMissed / halfLifeDays);

  // 3. Final elasticity score (0-100%)
  const elasticityScore = Math.min(100, Math.max(0, Math.round(100 * momentum * decay)));

  // 4. Preserved streak credits:
  // Policy: Prolonged absence exceeding 14 days completely expires retained streak credits (0 credits)
  // as mandated by the behavioral recovery acceptance criteria to prevent lingering streak inflation
  // after extended abandonment, while elasticityScore continues to follow the exponential decay curve.
  const rawStreakCredits = Math.floor((streakBeforeBreak * elasticityScore) / 100);
  const retainedStreakCredits = daysMissed > 14 ? 0 : Math.max(0, rawStreakCredits);

  // 5. Slump severity classification
  let slumpSeverity: HabitElasticityReport['slumpSeverity'];
  if (daysMissed <= 1) {
    slumpSeverity = 'minor_hiccup';
  } else if (daysMissed <= 2) {
    slumpSeverity = 'slippery_slope';
  } else if (daysMissed <= 7) {
    slumpSeverity = 'habit_dormant';
  } else {
    slumpSeverity = 'full_extinction';
  }

  // 6. Actionable recommendations and supportive resilience messages
  let suggestedAction: HabitElasticityReport['suggestedAction'];
  let resilienceMessage: string;

  switch (slumpSeverity) {
    case 'minor_hiccup':
      suggestedAction = 'immediate_one_rep_win';
      resilienceMessage =
        daysMissed === 0
          ? 'Your habit momentum is operating at peak strength. Complete today’s session with a quick win to keep your streak thriving.'
          : 'A single missed day is just a brief pause, not a reset. Complete one quick rep today to preserve your habit momentum.';
      break;

    case 'slippery_slope':
      suggestedAction = 'half_volume_session';
      resilienceMessage =
        'Two missed days create friction, but your foundation is intact. Lower the barrier with a half-volume session today to regain rhythm.';
      break;

    case 'habit_dormant':
      suggestedAction = 'half_volume_session';
      resilienceMessage =
        'Your habit has gone dormant, but your baseline resilience remains. Reactivate your routine with a gentle half-volume session.';
      break;

    case 'full_extinction':
      suggestedAction = 'full_ritual_restart';
      resilienceMessage =
        'Extended breaks happen to every practitioner. Treat today as a fresh start and rebuild your routine with a full ritual restart.';
      break;
  }

  return {
    elasticityScore,
    retainedStreakCredits,
    slumpSeverity,
    resilienceMessage,
    suggestedAction,
  };
}
