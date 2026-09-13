/**
 * PACT Phase 7: WakaTime & IDE Activity Proof-of-Work Test Suite
 * Validates WakaTime data normalization, deterministic duration aggregation,
 * project/language filtering, error handling, and rule evaluation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatWakaTimeDuration,
  normalizeWakaTimeSummaryDay,
  aggregateWakaTimeMetrics,
  WakaTimeSummaryDay,
} from '../src/lib/integrations/proof-of-work/wakatime';

import { evaluateProofOfWorkRule } from '../src/lib/integrations/proof-of-work/engine';

describe('PACT Phase 7: WakaTime & IDE Activity Proof Verification', () => {
  describe('Duration Formatting', () => {
    it('formats seconds into clean human-readable hours and minutes', () => {
      assert.strictEqual(formatWakaTimeDuration(0), '0m');
      assert.strictEqual(formatWakaTimeDuration(45), '0m');
      assert.strictEqual(formatWakaTimeDuration(120), '2m');
      assert.strictEqual(formatWakaTimeDuration(3600), '1h');
      assert.strictEqual(formatWakaTimeDuration(3660), '1h 1m');
      assert.strictEqual(formatWakaTimeDuration(9000), '2h 30m');
    });
  });

  describe('Data Normalization', () => {
    it('normalizes raw WakaTime summary payloads with fallback defaults', () => {
      const raw = {
        range: { date: '2026-09-13' },
        grand_total: { total_seconds: 7200, text: '2 hrs' },
        projects: [
          { name: 'pact-os', total_seconds: 5400, percent: 75 },
          { name: 'website', total_seconds: 1800, percent: 25 },
        ],
        languages: [
          { name: 'TypeScript', total_seconds: 6000, percent: 83.33 },
          { name: 'CSS', total_seconds: 1200, percent: 16.67 },
        ],
        branches: [{ name: 'phase-7', total_seconds: 5400, percent: 75 }],
        editors: [{ name: 'VS Code', total_seconds: 7200, percent: 100 }],
      };

      const normalized = normalizeWakaTimeSummaryDay(raw);
      assert.strictEqual(normalized.date, '2026-09-13');
      assert.strictEqual(normalized.totalSeconds, 7200);
      assert.strictEqual(normalized.projects.length, 2);
      assert.strictEqual(normalized.languages.length, 2);
      assert.strictEqual(normalized.projects[0].name, 'pact-os');
      assert.strictEqual(normalized.projects[0].totalSeconds, 5400);
    });

    it('safely handles empty and malformed payload objects', () => {
      const normalized = normalizeWakaTimeSummaryDay({});
      assert.strictEqual(normalized.totalSeconds, 0);
      assert.deepStrictEqual(normalized.projects, []);
      assert.deepStrictEqual(normalized.languages, []);
    });
  });

  describe('Metrics Aggregation & Filtering', () => {
    const mockDays: WakaTimeSummaryDay[] = [
      {
        date: '2026-09-12',
        totalSeconds: 3600, // 1h
        text: '1h',
        projects: [
          { name: 'pact-os', totalSeconds: 2400, percent: 66.67 },
          { name: 'infra', totalSeconds: 1200, percent: 33.33 },
        ],
        languages: [
          { name: 'TypeScript', totalSeconds: 3000, percent: 83.33 },
          { name: 'Markdown', totalSeconds: 600, percent: 16.67 },
        ],
        branches: [{ name: 'phase-6', totalSeconds: 2400, percent: 66.67 }],
        editors: [{ name: 'VS Code', totalSeconds: 3600, percent: 100 }],
      },
      {
        date: '2026-09-13',
        totalSeconds: 5400, // 1.5h
        text: '1h 30m',
        projects: [
          { name: 'pact-os', totalSeconds: 5400, percent: 100 },
        ],
        languages: [
          { name: 'TypeScript', totalSeconds: 4500, percent: 83.33 },
          { name: 'JSON', totalSeconds: 900, percent: 16.67 },
        ],
        branches: [{ name: 'phase-7', totalSeconds: 5400, percent: 100 }],
        editors: [{ name: 'VS Code', totalSeconds: 5400, percent: 100 }],
      },
    ];

    it('aggregates total metrics across all days without filters', () => {
      const agg = aggregateWakaTimeMetrics(mockDays);
      assert.strictEqual(agg.totalSeconds, 9000); // 2.5 hours
      assert.strictEqual(agg.totalMinutes, 150);
      assert.strictEqual(agg.totalHours, 2.5);
      assert.strictEqual(agg.matchingSeconds, 9000);
      assert.strictEqual(agg.daysCount, 2);
      assert.strictEqual(agg.projects.length, 2);
      assert.strictEqual(agg.projects[0].name, 'pact-os');
      assert.strictEqual(agg.projects[0].totalSeconds, 7800);
    });

    it('filters matching time strictly by target project', () => {
      const agg = aggregateWakaTimeMetrics(mockDays, { project: 'pact-os' });
      assert.strictEqual(agg.totalSeconds, 9000);
      assert.strictEqual(agg.matchingSeconds, 7800); // 2400 + 5400 = 7800s = 130 mins
      assert.strictEqual(agg.matchingMinutes, 130);
    });

    it('filters matching time strictly by target language', () => {
      const agg = aggregateWakaTimeMetrics(mockDays, { language: 'Markdown' });
      assert.strictEqual(agg.matchingSeconds, 600); // 10 mins
      assert.strictEqual(agg.matchingMinutes, 10);
    });
  });

  describe('Rule Evaluation via Proof Engine', () => {
    const mockSummaries: WakaTimeSummaryDay[] = [
      {
        date: '2026-09-13',
        totalSeconds: 7200, // 120 mins
        text: '2h',
        projects: [
          { name: 'pact-os', totalSeconds: 5400, percent: 75 },
          { name: 'docs', totalSeconds: 1800, percent: 25 },
        ],
        languages: [{ name: 'TypeScript', totalSeconds: 7200, percent: 100 }],
        branches: [{ name: 'main', totalSeconds: 7200, percent: 100 }],
        editors: [{ name: 'VS Code', totalSeconds: 7200, percent: 100 }],
      },
    ];

    it('verifies successfully when coding minutes meet requirement', async () => {
      const result = await evaluateProofOfWorkRule({
        provider: 'wakatime',
        ruleType: 'wakatime_time',
        config: { min_minutes: 60 },
        windowStart: '2026-09-13T00:00:00Z',
        windowEnd: '2026-09-13T23:59:59Z',
        accountHandle: 'dev_user',
        fetcherOverrides: {
          wakatimeSummaries: async () => ({
            success: true,
            data: mockSummaries,
          }),
        },
      });

      assert.strictEqual(result.verified, true);
      assert.strictEqual(result.code, 'VERIFIED');
      assert.strictEqual(result.provider, 'wakatime');
      assert.strictEqual(result.checked_count, 120);
      assert.strictEqual(result.required_count, 60);
      assert.strictEqual(result.evidence.length, 1);
    });

    it('verifies project-specific coding time criteria', async () => {
      const result = await evaluateProofOfWorkRule({
        provider: 'wakatime',
        ruleType: 'wakatime_time',
        config: { min_minutes: 60, project: 'pact-os' }, // 90 mins coded on pact-os
        windowStart: '2026-09-13T00:00:00Z',
        windowEnd: '2026-09-13T23:59:59Z',
        accountHandle: 'dev_user',
        fetcherOverrides: {
          wakatimeSummaries: async () => ({
            success: true,
            data: mockSummaries,
          }),
        },
      });

      assert.strictEqual(result.verified, true);
      assert.strictEqual(result.code, 'VERIFIED');
      assert.strictEqual(result.checked_count, 90);
    });

    it('fails honestly with RULE_NOT_SATISFIED when criteria are not met', async () => {
      const result = await evaluateProofOfWorkRule({
        provider: 'wakatime',
        ruleType: 'wakatime_time',
        config: { min_minutes: 180 }, // requires 3 hours, only 2 hours coded
        windowStart: '2026-09-13T00:00:00Z',
        windowEnd: '2026-09-13T23:59:59Z',
        accountHandle: 'dev_user',
        fetcherOverrides: {
          wakatimeSummaries: async () => ({
            success: true,
            data: mockSummaries,
          }),
        },
      });

      assert.strictEqual(result.verified, false);
      assert.strictEqual(result.code, 'RULE_NOT_SATISFIED');
    });

    it('handles rate limiting and provider outage gracefully', async () => {
      const rateLimitedResult = await evaluateProofOfWorkRule({
        provider: 'wakatime',
        ruleType: 'wakatime_time',
        config: { min_minutes: 30 },
        windowStart: '2026-09-13T00:00:00Z',
        windowEnd: '2026-09-13T23:59:59Z',
        accountHandle: 'dev_user',
        fetcherOverrides: {
          wakatimeSummaries: async () => ({
            success: false,
            error: 'Rate limit',
            isRateLimited: true,
          }),
        },
      });

      assert.strictEqual(rateLimitedResult.verified, false);
      assert.strictEqual(rateLimitedResult.code, 'RATE_LIMITED');

      const unavailableResult = await evaluateProofOfWorkRule({
        provider: 'wakatime',
        ruleType: 'wakatime_time',
        config: { min_minutes: 30 },
        windowStart: '2026-09-13T00:00:00Z',
        windowEnd: '2026-09-13T23:59:59Z',
        accountHandle: 'dev_user',
        fetcherOverrides: {
          wakatimeSummaries: async () => ({
            success: false,
            error: 'Network timeout',
          }),
        },
      });

      assert.strictEqual(unavailableResult.verified, false);
      assert.strictEqual(unavailableResult.code, 'PROVIDER_UNAVAILABLE');
    });
  });
});
