import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateChainStreak, DayCheckin } from '../src/lib/habits/chain-streak';
import { addDaysToDateString } from '../src/lib/time';

/** Builds `days` consecutive check-ins starting at `startDate`. */
function chain(startDate: string, days: number, completed = true): DayCheckin[] {
  return Array.from({ length: days }, (_, index) => ({
    dateString: addDaysToDateString(startDate, index),
    completed,
  }));
}

describe('evaluateChainStreak', () => {
  describe('basic reports', () => {
    it('returns zero streaks and next milestone 7 for an empty array', () => {
      assert.deepStrictEqual(evaluateChainStreak([], '2026-11-04'), {
        currentStreakDays: 0,
        longestStreakDays: 0,
        totalCompletedDays: 0,
        nextMilestoneDays: 7,
        daysUntilNextMilestone: 7,
        isChainActiveToday: false,
      });
    });

    it('counts a single completed day', () => {
      assert.deepStrictEqual(
        evaluateChainStreak([{ dateString: '2026-11-04', completed: true }], '2026-11-04'),
        {
          currentStreakDays: 1,
          longestStreakDays: 1,
          totalCompletedDays: 1,
          nextMilestoneDays: 7,
          daysUntilNextMilestone: 6,
          isChainActiveToday: true,
        }
      );
    });

    it('counts a continuous streak ending on the reference date', () => {
      const report = evaluateChainStreak(chain('2026-11-01', 4), '2026-11-04');
      assert.strictEqual(report.currentStreakDays, 4);
      assert.strictEqual(report.longestStreakDays, 4);
      assert.strictEqual(report.totalCompletedDays, 4);
      assert.strictEqual(report.isChainActiveToday, true);
    });
  });

  describe('incomplete reference date', () => {
    it('preserves the streak when the reference date is explicitly incomplete', () => {
      const report = evaluateChainStreak(
        [...chain('2026-11-01', 3), { dateString: '2026-11-04', completed: false }],
        '2026-11-04'
      );
      assert.strictEqual(report.currentStreakDays, 3);
      assert.strictEqual(report.isChainActiveToday, false);
    });

    it('preserves the streak when the reference date has no record yet', () => {
      const report = evaluateChainStreak(chain('2026-11-01', 3), '2026-11-04');
      assert.strictEqual(report.currentStreakDays, 3);
      assert.strictEqual(report.isChainActiveToday, false);
    });

    it('resets the current streak when the previous day was also not completed', () => {
      const report = evaluateChainStreak(chain('2026-11-01', 3), '2026-11-05');
      assert.strictEqual(report.currentStreakDays, 0);
      assert.strictEqual(report.longestStreakDays, 3);
      assert.strictEqual(report.isChainActiveToday, false);
    });
  });

  describe('broken chains and history', () => {
    it('separates the current streak from a longer historical streak', () => {
      const report = evaluateChainStreak(
        [
          ...chain('2026-11-01', 5),
          ...chain('2026-11-06', 2, false),
          ...chain('2026-11-08', 3),
        ],
        '2026-11-10'
      );
      assert.strictEqual(report.currentStreakDays, 3);
      assert.strictEqual(report.longestStreakDays, 5);
      assert.strictEqual(report.totalCompletedDays, 8);
      assert.strictEqual(report.nextMilestoneDays, 7);
      assert.strictEqual(report.daysUntilNextMilestone, 4);
    });

    it('treats a missing date as a break in the chain', () => {
      const report = evaluateChainStreak(
        [
          { dateString: '2026-11-01', completed: true },
          { dateString: '2026-11-02', completed: true },
          { dateString: '2026-11-04', completed: true },
        ],
        '2026-11-04'
      );
      assert.strictEqual(report.currentStreakDays, 1);
      assert.strictEqual(report.longestStreakDays, 2);
      assert.strictEqual(report.totalCompletedDays, 3);
    });

    it('produces the same report for unsorted check-ins without mutating the input', () => {
      const sorted = [...chain('2026-11-01', 5), ...chain('2026-11-08', 3)];
      const shuffled: DayCheckin[] = [
        sorted[6], sorted[1], sorted[7], sorted[3], sorted[0], sorted[5], sorted[4], sorted[2],
      ];
      const snapshot = structuredClone(shuffled);

      assert.deepStrictEqual(
        evaluateChainStreak(shuffled, '2026-11-10'),
        evaluateChainStreak(sorted, '2026-11-10')
      );
      assert.deepStrictEqual(shuffled, snapshot);
    });
  });

  describe('calendar boundaries', () => {
    it('continues a streak across a month boundary', () => {
      const report = evaluateChainStreak(chain('2026-10-30', 4), '2026-11-02');
      assert.strictEqual(report.currentStreakDays, 4);
      assert.strictEqual(report.longestStreakDays, 4);
    });

    it('continues a streak across a year boundary', () => {
      const report = evaluateChainStreak(chain('2026-12-30', 4), '2027-01-02');
      assert.strictEqual(report.currentStreakDays, 4);
      assert.strictEqual(report.longestStreakDays, 4);
    });

    it('includes February 29 in a leap year chain', () => {
      const report = evaluateChainStreak(chain('2028-02-28', 3), '2028-03-01');
      assert.strictEqual(report.currentStreakDays, 3);
    });

    it('breaks a chain when a leap day is missed', () => {
      const report = evaluateChainStreak(
        [
          { dateString: '2028-02-28', completed: true },
          { dateString: '2028-03-01', completed: true },
        ],
        '2028-03-01'
      );
      assert.strictEqual(report.currentStreakDays, 1);
      assert.strictEqual(report.longestStreakDays, 1);
    });

    it('continues a streak across a daylight-saving changeover', () => {
      const report = evaluateChainStreak(chain('2026-03-07', 3), '2026-03-09');
      assert.strictEqual(report.currentStreakDays, 3);
    });
  });

  describe('milestones', () => {
    const expectations: Array<[streak: number, next: number, remaining: number]> = [
      [0, 7, 7],
      [3, 7, 4],
      [6, 7, 1],
      [7, 14, 7],
      [10, 14, 4],
      [14, 21, 7],
      [21, 30, 9],
      [30, 60, 30],
      [60, 90, 30],
      [90, 100, 10],
      [100, 180, 80],
      [180, 365, 185],
      [364, 365, 1],
    ];

    for (const [streak, next, remaining] of expectations) {
      it(`targets ${next} with ${remaining} days remaining for a ${streak}-day streak`, () => {
        const reference = '2026-11-04';
        const start = addDaysToDateString(reference, 1 - streak);
        const report = evaluateChainStreak(chain(start, streak), reference);
        assert.strictEqual(report.currentStreakDays, streak);
        assert.strictEqual(report.nextMilestoneDays, next);
        assert.strictEqual(report.daysUntilNextMilestone, remaining);
      });
    }

    it('stays at the final milestone with 0 days remaining at and beyond 365 days', () => {
      for (const streak of [365, 400]) {
        const reference = '2026-11-04';
        const start = addDaysToDateString(reference, 1 - streak);
        const report = evaluateChainStreak(chain(start, streak), reference);
        assert.strictEqual(report.currentStreakDays, streak);
        assert.strictEqual(report.nextMilestoneDays, 365);
        assert.strictEqual(report.daysUntilNextMilestone, 0);
      }
    });

    it('uses the current streak rather than the longest streak', () => {
      const report = evaluateChainStreak(
        [...chain('2026-10-01', 20), ...chain('2026-11-02', 3)],
        '2026-11-04'
      );
      assert.strictEqual(report.longestStreakDays, 20);
      assert.strictEqual(report.currentStreakDays, 3);
      assert.strictEqual(report.nextMilestoneDays, 7);
    });
  });

  describe('data quality', () => {
    it('counts duplicate records for a date once', () => {
      const report = evaluateChainStreak(
        [...chain('2026-11-03', 2), ...chain('2026-11-03', 2)],
        '2026-11-04'
      );
      assert.strictEqual(report.totalCompletedDays, 2);
      assert.strictEqual(report.currentStreakDays, 2);
    });

    it('treats a date as completed if any duplicate record is, regardless of order', () => {
      const done = { dateString: '2026-11-04', completed: true };
      const notDone = { dateString: '2026-11-04', completed: false };
      assert.strictEqual(evaluateChainStreak([done, notDone], '2026-11-04').isChainActiveToday, true);
      assert.strictEqual(evaluateChainStreak([notDone, done], '2026-11-04').isChainActiveToday, true);
    });

    it('ignores records with invalid dates', () => {
      const invalidDates = ['', 'not-a-date', '2026-02-30', '2026-13-01', '2026-11-4', '2026-11-04T00:00:00Z'];
      const report = evaluateChainStreak(
        [
          ...invalidDates.map((dateString) => ({ dateString, completed: true })),
          { dateString: '2026-11-04', completed: true },
        ],
        '2026-11-04'
      );
      assert.strictEqual(report.totalCompletedDays, 1);
      assert.strictEqual(report.longestStreakDays, 1);
    });

    it('ignores records dated after the reference date', () => {
      const report = evaluateChainStreak(chain('2026-11-01', 10), '2026-11-03');
      assert.strictEqual(report.currentStreakDays, 3);
      assert.strictEqual(report.longestStreakDays, 3);
      assert.strictEqual(report.totalCompletedDays, 3);
    });

    it('throws a RangeError for an invalid reference date', () => {
      for (const reference of ['', 'today', '2026-02-30']) {
        assert.throws(() => evaluateChainStreak([], reference), RangeError);
      }
    });
  });

  describe('default reference date', () => {
    it('uses the current UTC date when no reference date is given', (t) => {
      t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-04T23:30:00Z') });
      const report = evaluateChainStreak(chain('2026-11-02', 3));
      assert.strictEqual(report.currentStreakDays, 3);
      assert.strictEqual(report.isChainActiveToday, true);
    });

    it('does not report a stale chain as current', (t) => {
      t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-20T12:00:00Z') });
      const report = evaluateChainStreak(chain('2026-11-01', 5));
      assert.strictEqual(report.currentStreakDays, 0);
      assert.strictEqual(report.longestStreakDays, 5);
    });

    it('includes the current local day for a user ahead of UTC', (t) => {
      // 01:30 on Nov 5 in Kolkata, while it is still Nov 4 in UTC.
      t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-04T20:00:00Z') });
      const report = evaluateChainStreak(chain('2026-11-03', 3), undefined, 'Asia/Kolkata');
      assert.strictEqual(report.currentStreakDays, 3);
      assert.strictEqual(report.totalCompletedDays, 3);
      assert.strictEqual(report.isChainActiveToday, true);
    });

    it('does not count a day that has not started for a user behind UTC', (t) => {
      // 21:00 on Nov 4 in New York, while it is already Nov 5 in UTC.
      t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-05T02:00:00Z') });
      const report = evaluateChainStreak(chain('2026-11-03', 3), undefined, 'America/New_York');
      assert.strictEqual(report.currentStreakDays, 2);
      assert.strictEqual(report.totalCompletedDays, 2);
      assert.strictEqual(report.isChainActiveToday, true);
    });

    it('prefers an explicit reference date over the timezone', (t) => {
      t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-04T20:00:00Z') });
      const report = evaluateChainStreak(chain('2026-11-01', 2), '2026-11-02', 'Asia/Kolkata');
      assert.strictEqual(report.currentStreakDays, 2);
      assert.strictEqual(report.isChainActiveToday, true);
    });
  });
});
