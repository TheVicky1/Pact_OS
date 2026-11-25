import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSleepArchitecturePlan,
  formatMinuteOfDay,
  type SleepArchitectureType,
} from '../src/lib/time/polyphasic-schedule';

describe('Polyphasic & Biphasic Sleep Architecture Schedule Generator', () => {
  describe('formatMinuteOfDay helper', () => {
    it('formats morning, afternoon, and midnight minutes correctly', () => {
      assert.strictEqual(formatMinuteOfDay(0), '00:00');
      assert.strictEqual(formatMinuteOfDay(450), '07:30');
      assert.strictEqual(formatMinuteOfDay(720), '12:00');
      assert.strictEqual(formatMinuteOfDay(1260), '21:00');
      assert.strictEqual(formatMinuteOfDay(1439), '23:59');
    });

    it('wraps negative minutes and minutes exceeding 1440 modulo 1440', () => {
      assert.strictEqual(formatMinuteOfDay(-60), '23:00');
      assert.strictEqual(formatMinuteOfDay(-180), '21:00');
      assert.strictEqual(formatMinuteOfDay(1440), '00:00');
      assert.strictEqual(formatMinuteOfDay(1500), '01:00');
    });

    it('throws TypeError if minute is not a finite number', () => {
      assert.throws(() => formatMinuteOfDay('450' as unknown as number), TypeError);
      assert.throws(() => formatMinuteOfDay(Number.NaN), TypeError);
      assert.throws(() => formatMinuteOfDay(Infinity), TypeError);
    });
  });

  describe('Monophasic Architecture', () => {
    it('generates an 8-hour core block ending at 07:00 (420 min)', () => {
      const plan = generateSleepArchitecturePlan({
        architecture: 'monophasic',
        primaryWakeMinuteOfDay: 420, // 07:00
      });

      assert.strictEqual(plan.architecture, 'monophasic');
      assert.strictEqual(plan.totalSleepMinutes, 480);
      assert.strictEqual(plan.totalSleepHours, 8);
      assert.strictEqual(plan.blocks.length, 1);

      const [core] = plan.blocks;
      assert.strictEqual(core.type, 'core');
      assert.strictEqual(core.durationMinutes, 480);
      assert.strictEqual(core.startMinuteOfDay, 1380); // 23:00 previous day
      assert.strictEqual(formatMinuteOfDay(core.startMinuteOfDay), '23:00');
      assert.strictEqual(
        formatMinuteOfDay(core.startMinuteOfDay + core.durationMinutes),
        '07:00'
      );
    });

    it('correctly handles midnight rollover with wake at 05:00 (300 min) -> core at 21:00 (1260 min)', () => {
      const plan = generateSleepArchitecturePlan({
        architecture: 'monophasic',
        primaryWakeMinuteOfDay: 300, // 05:00
      });

      const [core] = plan.blocks;
      assert.strictEqual(core.startMinuteOfDay, 1260); // 21:00
      assert.strictEqual(formatMinuteOfDay(core.startMinuteOfDay), '21:00');
      assert.strictEqual(core.durationMinutes, 480);
    });
  });

  describe('Biphasic (Siesta) Architecture', () => {
    it('generates a 6-hour core and 30-min nap 7 hours post-wake', () => {
      const plan = generateSleepArchitecturePlan({
        architecture: 'biphasic-siesta',
        primaryWakeMinuteOfDay: 420, // 07:00
      });

      assert.strictEqual(plan.architecture, 'biphasic-siesta');
      assert.strictEqual(plan.totalSleepMinutes, 390);
      assert.strictEqual(plan.totalSleepHours, 6.5);
      assert.strictEqual(plan.blocks.length, 2);

      const [core, nap] = plan.blocks;
      // Core: 360 mins ending at 07:00 -> starts at 01:00 (60 mins)
      assert.strictEqual(core.type, 'core');
      assert.strictEqual(core.startMinuteOfDay, 60);
      assert.strictEqual(core.durationMinutes, 360);
      assert.strictEqual(formatMinuteOfDay(core.startMinuteOfDay), '01:00');

      // Nap: 30 mins starting 7h (420m) after wake (420 + 420 = 840 -> 14:00)
      assert.strictEqual(nap.type, 'nap');
      assert.strictEqual(nap.startMinuteOfDay, 840);
      assert.strictEqual(nap.durationMinutes, 30);
      assert.strictEqual(formatMinuteOfDay(nap.startMinuteOfDay), '14:00');
    });

    it('handles late wake time rollover for midday siesta nap', () => {
      // Wake at 18:00 (1080 min). Nap at 1080 + 420 = 1500 -> 01:00 (60 min)
      const plan = generateSleepArchitecturePlan({
        architecture: 'biphasic-siesta',
        primaryWakeMinuteOfDay: 1080,
      });

      const [, nap] = plan.blocks;
      assert.strictEqual(nap.startMinuteOfDay, 60);
      assert.strictEqual(formatMinuteOfDay(nap.startMinuteOfDay), '01:00');
    });
  });

  describe('Segmented Sleep Architecture', () => {
    it('generates two 3.5-hour core blocks separated by a 1-hour quiet wake period', () => {
      const plan = generateSleepArchitecturePlan({
        architecture: 'segmented',
        primaryWakeMinuteOfDay: 420, // 07:00
      });

      assert.strictEqual(plan.architecture, 'segmented');
      assert.strictEqual(plan.totalSleepMinutes, 420);
      assert.strictEqual(plan.totalSleepHours, 7);
      assert.strictEqual(plan.blocks.length, 2);

      const [core1, core2] = plan.blocks;

      // Core 2: 210 mins ending at 07:00 (420) -> starts at 03:30 (210)
      assert.strictEqual(core2.type, 'core');
      assert.strictEqual(core2.startMinuteOfDay, 210);
      assert.strictEqual(core2.durationMinutes, 210);
      assert.strictEqual(formatMinuteOfDay(core2.startMinuteOfDay), '03:30');

      // 60 min quiet wake before Core 2 means Core 1 ends at 02:30 (150).
      // Core 1: 210 mins ending at 02:30 (150) -> starts at 23:00 (1380) previous day.
      assert.strictEqual(core1.type, 'core');
      assert.strictEqual(core1.startMinuteOfDay, 1380);
      assert.strictEqual(core1.durationMinutes, 210);
      assert.strictEqual(formatMinuteOfDay(core1.startMinuteOfDay), '23:00');

      // Verify the 60 min quiet gap between Core 1 end and Core 2 start:
      // Core 1 end = 1380 + 210 = 1590 -> 150. Core 2 start = 210. 210 - 150 = 60 minutes.
      const core1End = (core1.startMinuteOfDay + core1.durationMinutes) % 1440;
      assert.strictEqual(core2.startMinuteOfDay - core1End, 60);
    });
  });

  describe('Everyman (E3) Architecture', () => {
    it('generates a 3.5-hour core and three 20-min naps spaced throughout the day', () => {
      const plan = generateSleepArchitecturePlan({
        architecture: 'everyman-3',
        primaryWakeMinuteOfDay: 420, // 07:00
      });

      assert.strictEqual(plan.architecture, 'everyman-3');
      assert.strictEqual(plan.totalSleepMinutes, 270);
      assert.strictEqual(plan.totalSleepHours, 4.5);
      assert.strictEqual(plan.blocks.length, 4);

      const [core, nap1, nap2, nap3] = plan.blocks;

      // Core: 210 mins ending at 07:00 (420) -> starts at 03:30 (210)
      assert.strictEqual(core.type, 'core');
      assert.strictEqual(core.startMinuteOfDay, 210);
      assert.strictEqual(core.durationMinutes, 210);
      assert.strictEqual(formatMinuteOfDay(core.startMinuteOfDay), '03:30');

      // Nap 1: wake + 240m = 660 (11:00)
      assert.strictEqual(nap1.type, 'nap');
      assert.strictEqual(nap1.startMinuteOfDay, 660);
      assert.strictEqual(nap1.durationMinutes, 20);
      assert.strictEqual(formatMinuteOfDay(nap1.startMinuteOfDay), '11:00');

      // Nap 2: wake + 480m = 900 (15:00)
      assert.strictEqual(nap2.type, 'nap');
      assert.strictEqual(nap2.startMinuteOfDay, 900);
      assert.strictEqual(nap2.durationMinutes, 20);
      assert.strictEqual(formatMinuteOfDay(nap2.startMinuteOfDay), '15:00');

      // Nap 3: wake + 720m = 1140 (19:00)
      assert.strictEqual(nap3.type, 'nap');
      assert.strictEqual(nap3.startMinuteOfDay, 1140);
      assert.strictEqual(nap3.durationMinutes, 20);
      assert.strictEqual(formatMinuteOfDay(nap3.startMinuteOfDay), '19:00');
    });

    it('handles nap rollovers across midnight with late wake time', () => {
      // Wake at 20:00 (1200 min).
      // Nap 1: 1200 + 240 = 1440 -> 00:00 (0 min)
      // Nap 2: 1200 + 480 = 1680 -> 04:00 (240 min)
      // Nap 3: 1200 + 720 = 1920 -> 08:00 (480 min)
      const plan = generateSleepArchitecturePlan({
        architecture: 'everyman-3',
        primaryWakeMinuteOfDay: 1200,
      });

      const [, nap1, nap2, nap3] = plan.blocks;
      assert.strictEqual(nap1.startMinuteOfDay, 0);
      assert.strictEqual(formatMinuteOfDay(nap1.startMinuteOfDay), '00:00');

      assert.strictEqual(nap2.startMinuteOfDay, 240);
      assert.strictEqual(formatMinuteOfDay(nap2.startMinuteOfDay), '04:00');

      assert.strictEqual(nap3.startMinuteOfDay, 480);
      assert.strictEqual(formatMinuteOfDay(nap3.startMinuteOfDay), '08:00');
    });
  });

  describe('Validation & Error Handling', () => {
    it('throws RangeError when primaryWakeMinuteOfDay is negative or >= 1440', () => {
      assert.throws(
        () =>
          generateSleepArchitecturePlan({
            architecture: 'monophasic',
            primaryWakeMinuteOfDay: -1,
          }),
        RangeError
      );

      assert.throws(
        () =>
          generateSleepArchitecturePlan({
            architecture: 'monophasic',
            primaryWakeMinuteOfDay: 1440,
          }),
        RangeError
      );

      assert.throws(
        () =>
          generateSleepArchitecturePlan({
            architecture: 'monophasic',
            primaryWakeMinuteOfDay: 2000,
          }),
        RangeError
      );
    });

    it('throws TypeError when primaryWakeMinuteOfDay is not a finite number', () => {
      assert.throws(
        () =>
          generateSleepArchitecturePlan({
            architecture: 'monophasic',
            primaryWakeMinuteOfDay: '420' as unknown as number,
          }),
        TypeError
      );

      assert.throws(
        () =>
          generateSleepArchitecturePlan({
            architecture: 'monophasic',
            primaryWakeMinuteOfDay: Number.NaN,
          }),
        TypeError
      );
    });

    it('throws TypeError when architecture is unknown or config is invalid', () => {
      assert.throws(
        () =>
          generateSleepArchitecturePlan({
            architecture: 'unknown-arch' as SleepArchitectureType,
            primaryWakeMinuteOfDay: 420,
          }),
        TypeError
      );

      assert.throws(
        () => generateSleepArchitecturePlan(null as unknown as { architecture: 'monophasic'; primaryWakeMinuteOfDay: 420 }),
        TypeError
      );
    });
  });
});
