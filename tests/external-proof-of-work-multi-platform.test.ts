/**
 * PACT Phase 5D: Multi-Platform External Proof-of-Work Unit & Contract Tests
 * Validates Codeforces and LeetCode data normalization, deterministic statistics,
 * streak calculations, difficulty bucketing, calendar heatmap decoding, and idempotency.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeCodeforcesDailyActivity,
  computeCodeforcesDistributions,
  CodeforcesSubmissionItem,
  CodeforcesRatingRecord,
} from '../src/lib/integrations/proof-of-work/codeforces';

import {
  parseLeetCodeSubmissionCalendar,
  LeetCodeSubmissionItem,
} from '../src/lib/integrations/proof-of-work/leetcode';

describe('PACT Multi-Platform Proof-of-Work Engine', () => {
  // ==========================================
  // 1. Codeforces Calculations & Normalization
  // ==========================================
  describe('Codeforces Calculations', () => {
    it('computes daily activity and streaks deterministically', () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

      const mockSubmissions: CodeforcesSubmissionItem[] = [
        {
          id: 1001,
          contestId: 1800,
          creationTimeIso: `${todayStr}T14:30:00Z`,
          problemName: 'A. Recent Actions',
          problemIndex: 'A',
          rating: 800,
          verdict: 'OK',
          passedTestCount: 15,
        },
        {
          id: 1002,
          contestId: 1800,
          creationTimeIso: `${todayStr}T15:00:00Z`,
          problemName: 'B. Set of Points',
          problemIndex: 'B',
          rating: 1200,
          verdict: 'WRONG_ANSWER',
          passedTestCount: 3,
        },
        {
          id: 1003,
          contestId: 1790,
          creationTimeIso: `${yesterdayStr}T18:20:00Z`,
          problemName: 'C. Premutation',
          problemIndex: 'C',
          rating: 1300,
          verdict: 'OK',
          passedTestCount: 20,
        },
        {
          id: 1004,
          contestId: 1780,
          creationTimeIso: `${twoDaysAgoStr}T10:15:00Z`,
          problemName: 'D. Bit Flipping',
          problemIndex: 'D',
          rating: 1600,
          verdict: 'OK',
          passedTestCount: 25,
        },
      ];

      const { dailyActivity, currentStreak, longestStreak, last30DaysCount } =
        computeCodeforcesDailyActivity(mockSubmissions, 365);

      assert.equal(dailyActivity.length, 365, 'Should generate continuous 365-day calendar');
      assert.equal(last30DaysCount, 4, 'Last 30 days should contain all 4 submissions');
      assert.equal(currentStreak, 3, 'Consecutive activity today, yesterday, and 2 days ago = streak 3');
      assert.ok(longestStreak >= 3, 'Longest streak must be at least 3');

      // Verify today's activity entry
      const todayEntry = dailyActivity.find((d) => d.date === todayStr);
      assert.ok(todayEntry, 'Today entry must exist');
      assert.equal(todayEntry.count, 2, 'Today should have 2 submissions');
      assert.equal(todayEntry.acceptedCount, 1, 'Today should have 1 accepted submission');
      assert.ok(todayEntry.level > 0, 'Today intensity level must be > 0');
    });

    it('computes unique solved problems, difficulty buckets, and verdicts', () => {
      const mockSubmissions: CodeforcesSubmissionItem[] = [
        // Problem 1: Solved on second try
        {
          id: 2001,
          contestId: 1700,
          creationTimeIso: '2026-03-01T10:00:00Z',
          problemName: 'Optimal Subsequences',
          problemIndex: 'A',
          rating: 900,
          tags: ['greedy', 'math'],
          verdict: 'WRONG_ANSWER',
          programmingLanguage: 'GNU C++20',
          passedTestCount: 2,
        },
        {
          id: 2002,
          contestId: 1700,
          creationTimeIso: '2026-03-01T10:15:00Z',
          problemName: 'Optimal Subsequences',
          problemIndex: 'A',
          rating: 900,
          tags: ['greedy', 'math'],
          verdict: 'OK',
          programmingLanguage: 'GNU C++20',
          passedTestCount: 15,
        },
        // Problem 2: 1400 rating problem
        {
          id: 2003,
          contestId: 1700,
          creationTimeIso: '2026-03-02T12:00:00Z',
          problemName: 'Tree Queries',
          problemIndex: 'D',
          rating: 1400,
          tags: ['trees', 'dfs and similar'],
          verdict: 'OK',
          programmingLanguage: 'Python 3',
          passedTestCount: 30,
        },
        // Problem 3: 2000 rating problem
        {
          id: 2004,
          contestId: 1650,
          creationTimeIso: '2026-03-03T16:00:00Z',
          problemName: 'Count Graphs',
          problemIndex: 'F',
          rating: 2050,
          tags: ['graphs', 'dp'],
          verdict: 'OK',
          programmingLanguage: 'GNU C++20',
          passedTestCount: 45,
        },
      ];

      const {
        uniqueSolvedProblems,
        totalAccepted,
        difficultyBuckets,
        verdictStats,
        languageStats,
        tagStats,
      } = computeCodeforcesDistributions(mockSubmissions);

      assert.equal(totalAccepted, 3, 'Total accepted submissions should be 3');
      assert.equal(uniqueSolvedProblems, 3, 'Unique solved problems should be 3');

      // Check difficulty buckets
      const b900 = difficultyBuckets.find((b) => b.range === '< 1200');
      const b1400 = difficultyBuckets.find((b) => b.range === '1400 - 1599');
      const b2000 = difficultyBuckets.find((b) => b.range === '1900 - 2199');

      assert.equal(b900?.count, 1, '< 1200 should have 1 problem');
      assert.equal(b1400?.count, 1, '1400 - 1599 should have 1 problem');
      assert.equal(b2000?.count, 1, '1900 - 2199 should have 1 problem');

      // Check verdict stats
      const okVerdict = verdictStats.find((v) => v.verdict === 'OK');
      const waVerdict = verdictStats.find((v) => v.verdict === 'WRONG_ANSWER');
      assert.equal(okVerdict?.count, 3, 'OK verdict count should be 3');
      assert.equal(waVerdict?.count, 1, 'WRONG_ANSWER count should be 1');

      // Check language stats
      const cpp = languageStats.find((l) => l.language === 'GNU C++20');
      const py = languageStats.find((l) => l.language === 'Python 3');
      assert.equal(cpp?.count, 3, 'GNU C++20 should be used 3 times');
      assert.equal(py?.count, 1, 'Python 3 should be used 1 time');

      // Check tags
      const greedyTag = tagStats.find((t) => t.tag === 'greedy');
      assert.equal(greedyTag?.count, 1, 'Greedy tag should be present on unique solved');
    });

    it('handles empty Codeforces submissions gracefully without crashing', () => {
      const { dailyActivity, currentStreak, longestStreak, last30DaysCount } =
        computeCodeforcesDailyActivity([], 365);

      assert.equal(dailyActivity.length, 365);
      assert.equal(currentStreak, 0);
      assert.equal(longestStreak, 0);
      assert.equal(last30DaysCount, 0);

      const { uniqueSolvedProblems, totalAccepted, difficultyBuckets } =
        computeCodeforcesDistributions([]);
      assert.equal(uniqueSolvedProblems, 0);
      assert.equal(totalAccepted, 0);
      assert.ok(difficultyBuckets.length > 0);
    });
  });

  // ==========================================
  // 2. LeetCode Calculations & Normalization
  // ==========================================
  describe('LeetCode Calculations', () => {
    it('decodes LeetCode submissionCalendar JSON string correctly', () => {
      const now = new Date();
      const nowEpoch = Math.floor(now.getTime() / 1000);
      const yesterdayEpoch = nowEpoch - 86400;
      const twoDaysAgoEpoch = nowEpoch - 86400 * 2;

      const calendarObj: Record<string, number> = {};
      calendarObj[String(nowEpoch)] = 4;
      calendarObj[String(yesterdayEpoch)] = 2;
      calendarObj[String(twoDaysAgoEpoch)] = 1;

      const calendarJson = JSON.stringify(calendarObj);

      const { dailyContributions, currentStreak, longestStreak, last30DaysCount } =
        parseLeetCodeSubmissionCalendar(calendarJson, 365);

      assert.equal(dailyContributions.length, 365, 'Continuous 365 calendar');
      assert.equal(last30DaysCount, 7, 'Total 4 + 2 + 1 = 7 submissions');
      assert.equal(currentStreak, 3, 'Streak should be 3');
      assert.ok(longestStreak >= 3, 'Longest streak >= 3');
    });

    it('handles null or malformed LeetCode calendar JSON safely', () => {
      const { dailyContributions, currentStreak, longestStreak, last30DaysCount } =
        parseLeetCodeSubmissionCalendar('invalid json {', 365);

      assert.equal(dailyContributions.length, 365);
      assert.equal(currentStreak, 0);
      assert.equal(longestStreak, 0);
      assert.equal(last30DaysCount, 0);

      const resNull = parseLeetCodeSubmissionCalendar(null, 365);
      assert.equal(resNull.dailyContributions.length, 365);
      assert.equal(resNull.currentStreak, 0);
    });
  });

  // ==========================================
  // 3. Idempotent Synchronization Invariant
  // ==========================================
  describe('Idempotent Synchronization Invariant', () => {
    it('5x repeated evaluation yields identical metrics with zero mutation or inflation', () => {
      const rawCalendar = JSON.stringify({
        '1700000000': 3,
        '1700086400': 5,
      });

      const firstRun = parseLeetCodeSubmissionCalendar(rawCalendar, 365);
      for (let i = 0; i < 5; i++) {
        const subsequentRun = parseLeetCodeSubmissionCalendar(rawCalendar, 365);
        assert.deepEqual(
          subsequentRun.currentStreak,
          firstRun.currentStreak,
          'Current streak must remain identical across repeated syncs'
        );
        assert.deepEqual(
          subsequentRun.longestStreak,
          firstRun.longestStreak,
          'Longest streak must remain identical across repeated syncs'
        );
        assert.deepEqual(
          subsequentRun.last30DaysCount,
          firstRun.last30DaysCount,
          '30-day count must remain identical across repeated syncs'
        );
        assert.equal(
          subsequentRun.dailyContributions.length,
          firstRun.dailyContributions.length,
          'Calendar length must remain invariant'
        );
      }
    });
  });
});
