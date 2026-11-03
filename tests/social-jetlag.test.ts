import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSleepMidpoint,
  evaluateSocialJetlag,
  type SleepWindow,
  type SocialJetlagSeverity,
} from '../src/lib/rituals/social-jetlag';

const WORKDAY: SleepWindow = { bedtime: '23:00', wakeTime: '07:00' };

function freeDayForShift(shiftMinutes: number): SleepWindow {
  const totalMinutes = 23 * 60 + shiftMinutes;
  const normalizedBedtime = totalMinutes % (24 * 60);
  const wakeMinutes = normalizedBedtime + 8 * 60;
  const format = (minutes: number) => {
    const normalized = minutes % (24 * 60);
    return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
  };

  return {
    bedtime: format(normalizedBedtime),
    wakeTime: format(wakeMinutes),
  };
}

describe('Social Jetlag & Sleep Debt Circadian Phase Delay Calculator (social-jetlag.ts)', () => {
  describe('calculateSleepMidpoint', () => {
    it('calculates an 8-hour window and 03:30 midpoint across midnight', () => {
      assert.deepStrictEqual(calculateSleepMidpoint('23:30', '07:30'), {
        midpoint24h: '03:30',
        durationMinutes: 480,
      });
    });

    it('handles a window that starts exactly at midnight', () => {
      assert.deepStrictEqual(calculateSleepMidpoint('00:00', '08:00'), {
        midpoint24h: '04:00',
        durationMinutes: 480,
      });
    });

    it('handles a midpoint that falls exactly at midnight', () => {
      assert.deepStrictEqual(calculateSleepMidpoint('20:00', '04:00'), {
        midpoint24h: '00:00',
        durationMinutes: 480,
      });
    });

    it('handles a same-day sleep window', () => {
      assert.deepStrictEqual(calculateSleepMidpoint('12:00', '20:00'), {
        midpoint24h: '16:00',
        durationMinutes: 480,
      });
    });

    it('handles an odd-duration window by rounding the midpoint to the nearest minute', () => {
      // 23:15 -> 07:30 is 8h15m (495 minutes); the raw midpoint is 03:22:30.
      assert.deepStrictEqual(calculateSleepMidpoint('23:15', '07:30'), {
        midpoint24h: '03:23',
        durationMinutes: 495,
      });
    });

    it('treats a later wake time as crossing midnight when bedtime follows it', () => {
      assert.deepStrictEqual(calculateSleepMidpoint('22:00', '06:00'), {
        midpoint24h: '02:00',
        durationMinutes: 480,
      });
    });

    it('throws TypeError for invalid 24-hour clock formats', () => {
      assert.throws(() => calculateSleepMidpoint('24:00', '08:00'), TypeError);
      assert.throws(() => calculateSleepMidpoint('23:60', '08:00'), TypeError);
      assert.throws(() => calculateSleepMidpoint('7:30', '08:00'), TypeError);
      assert.throws(() => calculateSleepMidpoint('', '08:00'), TypeError);
      assert.throws(() => calculateSleepMidpoint('23:00', 'not-a-time'), TypeError);
      assert.throws(
        () => calculateSleepMidpoint(null as unknown as string, '08:00'),
        TypeError
      );
    });

    it('throws RangeError for a zero-duration sleep window', () => {
      assert.throws(() => calculateSleepMidpoint('23:00', '23:00'), RangeError);
    });
  });

  describe('evaluateSocialJetlag', () => {
    it('reproduces the documented 2.5-hour social jetlag example', () => {
      const analysis = evaluateSocialJetlag(
        { bedtime: '23:00', wakeTime: '07:00' },
        { bedtime: '01:00', wakeTime: '10:00' }
      );

      assert.strictEqual(analysis.workdaySleepDurationHours, 8);
      assert.strictEqual(analysis.freedaySleepDurationHours, 9);
      assert.strictEqual(analysis.weeklySleepDebtHours, 0);
      assert.strictEqual(analysis.workdayMidpoint, '03:00');
      assert.strictEqual(analysis.freedayMidpoint, '05:30');
      assert.strictEqual(analysis.socialJetlagMinutes, 150);
      assert.strictEqual(analysis.severityLevel, 'moderate');
      assert.strictEqual(analysis.mondayMorningCognitiveLagHours, 2.5);
      assert.ok(analysis.circadianRealignmentSuggestion.length > 0);
    });

    it('classifies every severity band at its exact boundary', () => {
      const cases: Array<{ shiftMinutes: number; expected: SocialJetlagSeverity }> = [
        { shiftMinutes: 0, expected: 'minimal' },
        { shiftMinutes: 59, expected: 'minimal' },
        { shiftMinutes: 60, expected: 'mild' },
        { shiftMinutes: 119, expected: 'mild' },
        { shiftMinutes: 120, expected: 'moderate' },
        { shiftMinutes: 179, expected: 'moderate' },
        { shiftMinutes: 180, expected: 'severe' },
        { shiftMinutes: 181, expected: 'severe' },
      ];

      for (const { shiftMinutes, expected } of cases) {
        const analysis = evaluateSocialJetlag(WORKDAY, freeDayForShift(shiftMinutes));
        assert.strictEqual(analysis.socialJetlagMinutes, shiftMinutes);
        assert.strictEqual(analysis.severityLevel, expected);
      }
    });

    it('classifies a free-day midpoint that is earlier than the workday midpoint', () => {
      const analysis = evaluateSocialJetlag(WORKDAY, {
        bedtime: '21:00',
        wakeTime: '05:00',
      });

      assert.strictEqual(analysis.workdayMidpoint, '03:00');
      assert.strictEqual(analysis.freedayMidpoint, '01:00');
      assert.strictEqual(analysis.socialJetlagMinutes, 120);
      assert.strictEqual(analysis.severityLevel, 'moderate');
      assert.ok(analysis.circadianRealignmentSuggestion.includes('later'));
    });

    it('uses the shortest circular phase difference instead of crossing the 24-hour boundary', () => {
      const lateWorkday = evaluateSocialJetlag(
        { bedtime: '19:00', wakeTime: '03:00' },
        { bedtime: '01:00', wakeTime: '09:00' }
      );

      const earlyWorkday = evaluateSocialJetlag(
        { bedtime: '01:00', wakeTime: '09:00' },
        { bedtime: '19:00', wakeTime: '03:00' }
      );

      assert.strictEqual(lateWorkday.socialJetlagMinutes, 360);
      assert.strictEqual(earlyWorkday.socialJetlagMinutes, 360);
    });

    it('computes the Monday-morning cognitive lag in hours from the phase shift', () => {
      const analysis = evaluateSocialJetlag(WORKDAY, freeDayForShift(90));

      assert.strictEqual(analysis.socialJetlagMinutes, 90);
      assert.strictEqual(analysis.mondayMorningCognitiveLagHours, 1.5);
    });

    it('accumulates weekly sleep debt across 5 workdays and 2 free days', () => {
      const analysis = evaluateSocialJetlag(
        { bedtime: '23:00', wakeTime: '06:00' },
        { bedtime: '01:00', wakeTime: '09:00' },
        8
      );

      assert.strictEqual(analysis.workdaySleepDurationHours, 7);
      assert.strictEqual(analysis.freedaySleepDurationHours, 8);
      assert.strictEqual(analysis.weeklySleepDebtHours, 5);
    });

    it('accumulates debt on both workdays and free days', () => {
      const analysis = evaluateSocialJetlag(
        { bedtime: '23:00', wakeTime: '05:00' },
        { bedtime: '01:00', wakeTime: '08:00' },
        8
      );

      // 5 workdays x 2h + 2 free days x 1h = 12h
      assert.strictEqual(analysis.weeklySleepDebtHours, 12);
    });

    it('does not credit extra free-day sleep against the accumulated deficit', () => {
      const analysis = evaluateSocialJetlag(
        { bedtime: '23:00', wakeTime: '05:00' },
        { bedtime: '01:00', wakeTime: '11:00' },
        8
      );

      // 5 workdays x 2h deficit; a 10h free-day sleep does not erase the shortfall.
      assert.strictEqual(analysis.weeklySleepDebtHours, 10);
    });

    it('returns zero weekly debt when sleep meets the target need', () => {
      const analysis = evaluateSocialJetlag(
        { bedtime: '22:00', wakeTime: '06:00' },
        { bedtime: '01:00', wakeTime: '09:00' },
        8
      );

      assert.strictEqual(analysis.weeklySleepDebtHours, 0);
    });

    it('respects a custom target sleep need', () => {
      const analysis = evaluateSocialJetlag(
        { bedtime: '23:00', wakeTime: '06:00' },
        { bedtime: '01:00', wakeTime: '08:00' },
        7.5
      );

      // 5 x 0.5h + 2 x 0.5h = 3.5h
      assert.strictEqual(analysis.weeklySleepDebtHours, 3.5);
    });

    it('computes fractional-minute sleep debt without compounding rounding errors', () => {
      const analysis = evaluateSocialJetlag(
        { bedtime: '23:00', wakeTime: '06:20' },
        { bedtime: '01:00', wakeTime: '08:40' },
        8
      );

      // 5 x 40m + 2 x 20m = 240m = 4h
      assert.strictEqual(analysis.workdaySleepDurationHours, 7.33);
      assert.strictEqual(analysis.freedaySleepDurationHours, 7.67);
      assert.strictEqual(analysis.weeklySleepDebtHours, 4);
    });

    it('defaults to an 8-hour sleep need', () => {
      const analysis = evaluateSocialJetlag(
        { bedtime: '23:00', wakeTime: '05:00' },
        { bedtime: '01:00', wakeTime: '07:00' }
      );

      // 5 x 2h + 2 x 2h = 14h
      assert.strictEqual(analysis.weeklySleepDebtHours, 14);
    });

    it('returns severity-specific realignment guidance', () => {
      const minimal = evaluateSocialJetlag(WORKDAY, WORKDAY);
      const mild = evaluateSocialJetlag(WORKDAY, freeDayForShift(60));
      const moderate = evaluateSocialJetlag(WORKDAY, freeDayForShift(120));
      const severe = evaluateSocialJetlag(WORKDAY, freeDayForShift(180));

      assert.ok(minimal.circadianRealignmentSuggestion.includes('healthy alignment window'));
      assert.ok(mild.circadianRealignmentSuggestion.includes('15-20 minutes'));
      assert.ok(moderate.circadianRealignmentSuggestion.includes('20%'));
      assert.ok(severe.circadianRealignmentSuggestion.includes('1-2 weeks'));
    });

    it('throws RangeError for a target sleep need outside (0, 24]', () => {
      assert.throws(() => evaluateSocialJetlag(WORKDAY, WORKDAY, 0), RangeError);
      assert.throws(() => evaluateSocialJetlag(WORKDAY, WORKDAY, -1), RangeError);
      assert.throws(() => evaluateSocialJetlag(WORKDAY, WORKDAY, 24.5), RangeError);
      assert.throws(() => evaluateSocialJetlag(WORKDAY, WORKDAY, Number.NaN), RangeError);
      assert.throws(() => evaluateSocialJetlag(WORKDAY, WORKDAY, Number.POSITIVE_INFINITY), RangeError);
    });

    it('throws TypeError for malformed sleep windows', () => {
      assert.throws(
        () => evaluateSocialJetlag(null as unknown as SleepWindow, WORKDAY),
        TypeError
      );
      assert.throws(
        () => evaluateSocialJetlag({ bedtime: '23:00', wakeTime: '07:00' }, { bedtime: '25:00', wakeTime: '09:00' }),
        TypeError
      );
    });
  });
});
