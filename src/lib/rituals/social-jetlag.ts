/**
 * Social Jetlag & Sleep Debt Circadian Phase Delay Calculator
 *
 * Implements Till Roenneberg's social jetlag metric: the mismatch between the
 * circadian sleep midpoint on workdays (MSW) and free days (MSF).
 *
 *   social jetlag = |MSF - MSW|
 *
 * Sleep windows are expressed as local 24-hour clock times and may cross
 * midnight (for example, 23:30 to 07:30). Weekly sleep debt is accumulated
 * across 5 workdays and 2 free days relative to a configurable sleep need.
 *
 * @module src/lib/rituals/social-jetlag
 */

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_HOUR = 60;
const WORKDAYS_PER_WEEK = 5;
const FREEDAYS_PER_WEEK = 2;
const MAX_CIRCULAR_SHIFT_MINUTES = MINUTES_PER_DAY / 2;
const DEFAULT_TARGET_SLEEP_NEED_HOURS = 8.0;
const CLOCK_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type SocialJetlagSeverity = 'minimal' | 'mild' | 'moderate' | 'severe';

export interface SleepWindow {
  /** Local bedtime in 24-hour "HH:MM" format (e.g. "23:30") */
  bedtime: string;
  /** Local wake time in 24-hour "HH:MM" format (e.g. "07:30") */
  wakeTime: string;
}

export interface SocialJetlagAnalysis {
  workdaySleepDurationHours: number;
  freedaySleepDurationHours: number;
  /** Accumulated weekly sleep deficit across 5 workdays and 2 free days */
  weeklySleepDebtHours: number;
  /** Midpoint of sleep on workdays (MSW) as "HH:MM" */
  workdayMidpoint: string;
  /** Midpoint of sleep on free days (MSF) as "HH:MM" */
  freedayMidpoint: string;
  /** Circular phase difference between free-day and workday midpoints */
  socialJetlagMinutes: number;
  severityLevel: SocialJetlagSeverity;
  /** Circadian phase delay carried into Monday morning, in hours */
  mondayMorningCognitiveLagHours: number;
  circadianRealignmentSuggestion: string;
}

interface SleepWindowMetrics {
  durationMinutes: number;
  /** Midpoint of sleep in minutes after midnight (rounded to the nearest minute) */
  midpointMinutes: number;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function minutesToHours(minutes: number): number {
  return roundTo(minutes / MINUTES_PER_HOUR, 2);
}

/**
 * Parses a 24-hour "HH:MM" clock time into minutes after midnight.
 *
 * @throws {TypeError} If the value is not a valid 24-hour clock time
 */
function parseClockTime(value: string, fieldName: string): number {
  if (typeof value !== 'string' || !CLOCK_TIME_PATTERN.test(value)) {
    throw new TypeError(`${fieldName} must be a 24-hour time in "HH:MM" format, received: "${value}"`);
  }

  const [hours, minutes] = value.split(':').map(Number);
  return hours * MINUTES_PER_HOUR + minutes;
}

/**
 * Formats minutes after midnight as a zero-padded 24-hour "HH:MM" string.
 */
function formatClockTime(minutes: number): string {
  const normalizedMinutes = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalizedMinutes / MINUTES_PER_HOUR);
  const remainingMinutes = normalizedMinutes % MINUTES_PER_HOUR;

  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

/**
 * Derives duration and sleep midpoint for a sleep window, handling midnight
 * crossing and next-day wake times.
 */
function calculateSleepWindowMetrics(schedule: SleepWindow): SleepWindowMetrics {
  if (!schedule || typeof schedule !== 'object') {
    throw new TypeError('Sleep window must be an object with bedtime and wakeTime fields');
  }

  const bedtimeMinutes = parseClockTime(schedule.bedtime, 'bedtime');
  const wakeTimeMinutes = parseClockTime(schedule.wakeTime, 'wakeTime');
  const durationMinutes = (wakeTimeMinutes - bedtimeMinutes + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  if (durationMinutes === 0) {
    throw new RangeError('Sleep window must have a non-zero duration');
  }

  const midpointMinutes = Math.round((bedtimeMinutes + durationMinutes / 2) % MINUTES_PER_DAY);

  return { durationMinutes, midpointMinutes };
}

/**
 * Calculates the midpoint of a sleep window and its total duration.
 *
 * The midpoint is circular: a window from 23:30 to 07:30 lasts 8 hours and
 * has a midpoint of 03:30 on the following calendar day.
 *
 * @param bedtime Local bedtime in 24-hour "HH:MM" format
 * @param wakeTime Local wake time in 24-hour "HH:MM" format
 * @returns Midpoint as "HH:MM" and duration in whole minutes
 * @throws {TypeError} If either time is not a valid "HH:MM" string
 * @throws {RangeError} If the sleep window has zero duration
 */
export function calculateSleepMidpoint(
  bedtime: string,
  wakeTime: string
): { midpoint24h: string; durationMinutes: number } {
  const { midpointMinutes, durationMinutes } = calculateSleepWindowMetrics({ bedtime, wakeTime });

  return {
    midpoint24h: formatClockTime(midpointMinutes),
    durationMinutes,
  };
}

/**
 * Returns the shortest signed circular distance from `fromMinutes` to `toMinutes`.
 * Positive values mean `toMinutes` occurs later in the circadian cycle.
 */
function signedCircularDifference(fromMinutes: number, toMinutes: number): number {
  let difference = toMinutes - fromMinutes;

  if (difference > MAX_CIRCULAR_SHIFT_MINUTES) {
    difference -= MINUTES_PER_DAY;
  } else if (difference < -MAX_CIRCULAR_SHIFT_MINUTES) {
    difference += MINUTES_PER_DAY;
  }

  return difference;
}

/**
 * Classifies social jetlag severity according to the accepted thresholds:
 * < 60 minutes minimal, 60-119 mild, 120-179 moderate, >= 180 severe.
 */
function classifySocialJetlagSeverity(socialJetlagMinutes: number): SocialJetlagSeverity {
  if (socialJetlagMinutes < 60) {
    return 'minimal';
  }
  if (socialJetlagMinutes < 120) {
    return 'mild';
  }
  if (socialJetlagMinutes < 180) {
    return 'moderate';
  }
  return 'severe';
}

/**
 * Builds an actionable realignment plan tailored to the severity and direction
 * of the circadian phase shift.
 */
function buildRealignmentSuggestion(
  severity: SocialJetlagSeverity,
  socialJetlagMinutes: number,
  signedShiftMinutes: number
): string {
  const correctionDirection = signedShiftMinutes >= 0 ? 'earlier' : 'later';

  switch (severity) {
    case 'minimal':
      return (
        `Your free-day sleep midpoint is ${socialJetlagMinutes} minutes from your workday midpoint, ` +
        'which is within a healthy alignment window. Keep bedtime and wake time consistent within ' +
        '30 minutes every day, and get 15 minutes of outdoor morning light to anchor your circadian clock.'
      );
    case 'mild':
      return (
        `Your free-day sleep midpoint drifts ${socialJetlagMinutes} minutes from your workday midpoint. ` +
        `Move your free-day sleep midpoint ${correctionDirection} by 15-20 minutes per day for 3-4 days, ` +
        'keep weekend lie-ins within one hour of your workday wake time, and seek bright morning light ' +
        'within 30 minutes of waking.'
      );
    case 'moderate':
      return (
        `Your ${socialJetlagMinutes}-minute phase shift reaches the 2-hour threshold linked to up to 20% ` +
        `reduced Monday-morning working memory. Move bedtime and wake time ${correctionDirection} by ` +
        '15-20 minutes per day, cap weekend lie-ins at one hour, and get 20-30 minutes of morning daylight.'
      );
    case 'severe':
      return (
        `Your ${socialJetlagMinutes}-minute phase shift is severe. Realign gradually rather than all at ` +
        `once: shift bedtime and wake time ${correctionDirection} by 15-30 minutes every 1-2 days, avoid ` +
        'weekend catch-up sleep beyond one hour, get bright morning daylight, and allow 1-2 weeks for the ' +
        'new rhythm to consolidate.'
      );
  }
}

/**
 * Evaluates social jetlag, weekly sleep debt, and circadian realignment needs
 * from workday and free-day sleep schedules.
 *
 * Weekly sleep debt counts each day's shortfall relative to `targetSleepNeedHours`
 * (5 workdays and 2 free days). Extra free-day sleep is not treated as repayment
 * of the deficit, so the result is always non-negative.
 *
 * @param workdaySchedule Typical workday sleep window
 * @param freedaySchedule Typical free-day sleep window
 * @param targetSleepNeedHours Individual sleep need in hours (default: 8.0)
 * @returns Full social jetlag analysis and realignment guidance
 * @throws {TypeError} If a sleep window is malformed
 * @throws {RangeError} If targetSleepNeedHours is outside (0, 24] or a window has zero duration
 */
export function evaluateSocialJetlag(
  workdaySchedule: SleepWindow,
  freedaySchedule: SleepWindow,
  targetSleepNeedHours: number = DEFAULT_TARGET_SLEEP_NEED_HOURS
): SocialJetlagAnalysis {
  if (
    !Number.isFinite(targetSleepNeedHours) ||
    targetSleepNeedHours <= 0 ||
    targetSleepNeedHours > 24
  ) {
    throw new RangeError(
      `targetSleepNeedHours must be a finite number between 0 and 24, received: ${targetSleepNeedHours}`
    );
  }

  const workday = calculateSleepWindowMetrics(workdaySchedule);
  const freeday = calculateSleepWindowMetrics(freedaySchedule);

  const workdaySleepDurationHours = minutesToHours(workday.durationMinutes);
  const freedaySleepDurationHours = minutesToHours(freeday.durationMinutes);

  const signedShiftMinutes = signedCircularDifference(workday.midpointMinutes, freeday.midpointMinutes);
  const socialJetlagMinutes = Math.round(Math.abs(signedShiftMinutes));
  const severityLevel = classifySocialJetlagSeverity(socialJetlagMinutes);

  const targetSleepNeedMinutes = targetSleepNeedHours * MINUTES_PER_HOUR;
  const workdayDeficitMinutes = Math.max(0, targetSleepNeedMinutes - workday.durationMinutes);
  const freedayDeficitMinutes = Math.max(0, targetSleepNeedMinutes - freeday.durationMinutes);
  const weeklySleepDebtHours = minutesToHours(
    workdayDeficitMinutes * WORKDAYS_PER_WEEK + freedayDeficitMinutes * FREEDAYS_PER_WEEK
  );

  return {
    workdaySleepDurationHours,
    freedaySleepDurationHours,
    weeklySleepDebtHours,
    workdayMidpoint: formatClockTime(workday.midpointMinutes),
    freedayMidpoint: formatClockTime(freeday.midpointMinutes),
    socialJetlagMinutes,
    severityLevel,
    mondayMorningCognitiveLagHours: minutesToHours(socialJetlagMinutes),
    circadianRealignmentSuggestion: buildRealignmentSuggestion(
      severityLevel,
      socialJetlagMinutes,
      signedShiftMinutes
    ),
  };
}
