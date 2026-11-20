/**
 * Polyphasic & Biphasic Sleep Architecture Schedule Generator
 *
 * Deterministically generates daily minute-of-day sleep blocks and schedules
 * for diverse sleep architectures (Monophasic, Biphasic/Siesta, Segmented,
 * Everyman-3) anchored to the user's primary target morning wake time.
 *
 * @module src/lib/time/polyphasic-schedule
 */

export type SleepArchitectureType =
  | 'monophasic'
  | 'biphasic-siesta'
  | 'segmented'
  | 'everyman-3';

export interface SleepBlock {
  blockId: string;
  type: 'core' | 'nap';
  startMinuteOfDay: number; // 0 to 1439 (minutes from 00:00)
  durationMinutes: number;
  label: string;
}

export interface SleepScheduleConfig {
  architecture: SleepArchitectureType;
  primaryWakeMinuteOfDay: number; // e.g. 420 for 07:00 AM
}

export interface GeneratedSleepPlan {
  architecture: SleepArchitectureType;
  totalSleepMinutes: number;
  totalSleepHours: number;
  blocks: SleepBlock[];
}

const MINUTES_PER_DAY = 1440;

/**
 * Wraps any minute integer cleanly into the [0, 1439] range modulo 1440.
 */
function wrapMinuteOfDay(minute: number): number {
  return ((minute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/**
 * Formats a minute-of-day integer into a 24-hour "HH:MM" string.
 *
 * @param minute - Minute of day (wrapped cleanly modulo 1440).
 * @returns 24-hour formatted time string, e.g. 450 -> "07:30".
 * @throws {TypeError} If minute is not a finite number.
 */
export function formatMinuteOfDay(minute: number): string {
  if (typeof minute !== 'number' || !Number.isFinite(minute)) {
    throw new TypeError('minute must be a finite number');
  }

  const wrapped = wrapMinuteOfDay(Math.floor(minute));
  const hours = Math.floor(wrapped / 60);
  const mins = wrapped % 60;

  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Generates deterministic sleep schedule blocks anchored to the primary morning wake time.
 *
 * @param config - Configuration containing sleep architecture type and target wake minute.
 * @returns GeneratedSleepPlan with calculated sleep blocks, total sleep minutes, and hours.
 * @throws {TypeError} If config is invalid or primaryWakeMinuteOfDay is not a finite number.
 * @throws {RangeError} If primaryWakeMinuteOfDay < 0 or >= 1440.
 */
export function generateSleepArchitecturePlan(
  config: SleepScheduleConfig
): GeneratedSleepPlan {
  if (!config || typeof config !== 'object') {
    throw new TypeError('config must be an object');
  }

  const { architecture, primaryWakeMinuteOfDay } = config;

  if (
    typeof primaryWakeMinuteOfDay !== 'number' ||
    !Number.isFinite(primaryWakeMinuteOfDay)
  ) {
    throw new TypeError('primaryWakeMinuteOfDay must be a finite number');
  }

  if (primaryWakeMinuteOfDay < 0 || primaryWakeMinuteOfDay >= MINUTES_PER_DAY) {
    throw new RangeError(
      `primaryWakeMinuteOfDay must be between 0 and ${MINUTES_PER_DAY - 1} inclusive`
    );
  }

  let blocks: SleepBlock[];

  switch (architecture) {
    case 'monophasic': {
      // 480 min (8h) core block ending at primaryWakeMinuteOfDay
      const duration = 480;
      blocks = [
        {
          blockId: 'monophasic-core',
          type: 'core',
          startMinuteOfDay: wrapMinuteOfDay(primaryWakeMinuteOfDay - duration),
          durationMinutes: duration,
          label: 'Core Sleep',
        },
      ];
      break;
    }

    case 'biphasic-siesta': {
      // 360 min (6h) core block ending at wake time; 30 min nap starting 7 hours (420 mins) after wake time
      const coreDuration = 360;
      const napDuration = 30;
      blocks = [
        {
          blockId: 'biphasic-core',
          type: 'core',
          startMinuteOfDay: wrapMinuteOfDay(primaryWakeMinuteOfDay - coreDuration),
          durationMinutes: coreDuration,
          label: 'Core Sleep',
        },
        {
          blockId: 'siesta-nap',
          type: 'nap',
          startMinuteOfDay: wrapMinuteOfDay(primaryWakeMinuteOfDay + 420),
          durationMinutes: napDuration,
          label: 'Siesta Nap',
        },
      ];
      break;
    }

    case 'segmented': {
      // Historical two-sleep pattern: Core 1 (210 mins), 60 min quiet wake period, Core 2 (210 mins) ending at wake time
      const core2Duration = 210;
      const quietWakeDuration = 60;
      const core1Duration = 210;
      const core2Start = wrapMinuteOfDay(primaryWakeMinuteOfDay - core2Duration);
      const core1Start = wrapMinuteOfDay(
        primaryWakeMinuteOfDay - core2Duration - quietWakeDuration - core1Duration
      );

      blocks = [
        {
          blockId: 'segmented-core-1',
          type: 'core',
          startMinuteOfDay: core1Start,
          durationMinutes: core1Duration,
          label: 'Core 1 (First Sleep)',
        },
        {
          blockId: 'segmented-core-2',
          type: 'core',
          startMinuteOfDay: core2Start,
          durationMinutes: core2Duration,
          label: 'Core 2 (Second Sleep)',
        },
      ];
      break;
    }

    case 'everyman-3': {
      // Core (210 mins) ending at wake time; 3x 20 min naps at wake+240m, wake+480m, wake+720m
      const coreDuration = 210;
      const napDuration = 20;

      blocks = [
        {
          blockId: 'everyman-core',
          type: 'core',
          startMinuteOfDay: wrapMinuteOfDay(primaryWakeMinuteOfDay - coreDuration),
          durationMinutes: coreDuration,
          label: 'Core Sleep',
        },
        {
          blockId: 'everyman-nap-1',
          type: 'nap',
          startMinuteOfDay: wrapMinuteOfDay(primaryWakeMinuteOfDay + 240),
          durationMinutes: napDuration,
          label: 'Nap 1',
        },
        {
          blockId: 'everyman-nap-2',
          type: 'nap',
          startMinuteOfDay: wrapMinuteOfDay(primaryWakeMinuteOfDay + 480),
          durationMinutes: napDuration,
          label: 'Nap 2',
        },
        {
          blockId: 'everyman-nap-3',
          type: 'nap',
          startMinuteOfDay: wrapMinuteOfDay(primaryWakeMinuteOfDay + 720),
          durationMinutes: napDuration,
          label: 'Nap 3',
        },
      ];
      break;
    }

    default: {
      throw new TypeError(`Unknown sleep architecture: ${String(architecture)}`);
    }
  }

  const totalSleepMinutes = blocks.reduce(
    (acc, block) => acc + block.durationMinutes,
    0
  );
  const totalSleepHours = Math.round((totalSleepMinutes / 60) * 100) / 100;

  return {
    architecture,
    totalSleepMinutes,
    totalSleepHours,
    blocks,
  };
}
