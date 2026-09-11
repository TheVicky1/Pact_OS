import assert from 'node:assert';
import {
  evaluateProofOfWorkRule,
  isTimestampInWindow,
  fetchGitHubActivitySummary,
} from '../src/lib/integrations/proof-of-work';
import { ExternalProofRuleResult } from '../src/types/domain';

/**
 * PACT Phase 5D: External Proof-of-Work Unit & Security Test Suite
 * Tests GitHub, LeetCode, Codeforces adapters, time-window boundaries,
 * rate limit recovery, rule satisfaction, and server trust boundaries.
 */
async function runProofOfWorkTests() {
  console.log('================================================================');
  console.log('  PACT Phase 5D — External Proof-of-Work Verification Test Suite');
  console.log('================================================================\n');

  const now = new Date('2026-09-11T12:00:00.000Z');
  const windowStart = '2026-09-11T09:00:00.000Z';
  const windowEnd = '2026-09-11T12:00:00.000Z';

  // 1. Time-Window Boundary Calculations
  console.log('1. Testing pure time-window boundary logic...');
  assert.strictEqual(
    isTimestampInWindow('2026-09-11T09:00:00.000Z', windowStart, windowEnd),
    true,
    'Exact start time is inclusive'
  );
  assert.strictEqual(
    isTimestampInWindow('2026-09-11T12:00:00.000Z', windowStart, windowEnd),
    true,
    'Exact end time is inclusive'
  );
  assert.strictEqual(
    isTimestampInWindow('2026-09-11T10:30:00.000Z', windowStart, windowEnd),
    true,
    'Mid-window timestamp is inclusive'
  );
  assert.strictEqual(
    isTimestampInWindow('2026-09-11T08:59:59.999Z', windowStart, windowEnd),
    false,
    'Timestamp before start window is rejected'
  );
  assert.strictEqual(
    isTimestampInWindow('2026-09-11T12:00:00.001Z', windowStart, windowEnd),
    false,
    'Timestamp after end window is rejected'
  );
  console.log('✅ Time-window boundaries verified.');

  // 2. GitHub Commits Verification
  console.log('\n2. Testing GitHub Commits rule evaluation...');
  const mockGitHubCommits = async () => ({
    success: true,
    data: [
      {
        sha: 'abc111',
        authorLogin: 'developer',
        authorDate: '2026-09-11T08:00:00.000Z', // Out of window
        message: 'Old commit',
        repository: 'pact/core',
      },
      {
        sha: 'abc222',
        authorLogin: 'developer',
        authorDate: '2026-09-11T10:00:00.000Z', // In window
        message: 'feat: implement proof of work',
        repository: 'pact/core',
      },
      {
        sha: 'abc333',
        authorLogin: 'developer',
        authorDate: '2026-09-11T11:30:00.000Z', // In window
        message: 'fix: edge case handling',
        repository: 'pact/core',
      },
      {
        sha: 'abc222', // Duplicate SHA simulation
        authorLogin: 'developer',
        authorDate: '2026-09-11T10:00:00.000Z',
        message: 'feat: implement proof of work',
        repository: 'pact/core',
      },
    ],
  });

  const ghResSuccess: ExternalProofRuleResult = await evaluateProofOfWorkRule({
    provider: 'github',
    ruleType: 'github_commits',
    config: { min_commits: 2 },
    windowStart,
    windowEnd,
    accountHandle: 'developer',
    fetcherOverrides: { githubCommits: mockGitHubCommits },
  });

  assert.strictEqual(ghResSuccess.verified, true, 'GitHub commits verified with 2 valid in-window commits');
  assert.strictEqual(ghResSuccess.code, 'VERIFIED', 'Code is VERIFIED');
  assert.strictEqual(ghResSuccess.evidence.length, 2, 'Deduplicated duplicate commit SHA');
  assert.strictEqual(ghResSuccess.evidence[0].external_event_id, 'abc222');
  assert.strictEqual(ghResSuccess.evidence[1].external_event_id, 'abc333');

  const ghResShort: ExternalProofRuleResult = await evaluateProofOfWorkRule({
    provider: 'github',
    ruleType: 'github_commits',
    config: { min_commits: 3 },
    windowStart,
    windowEnd,
    accountHandle: 'developer',
    fetcherOverrides: { githubCommits: mockGitHubCommits },
  });
  assert.strictEqual(ghResShort.verified, false, 'Failed when required 3 commits but only 2 found');
  assert.strictEqual(ghResShort.code, 'RULE_NOT_SATISFIED');
  console.log('✅ GitHub commits evaluation verified.');

  // 3. GitHub Pull Requests Verification
  console.log('\n3. Testing GitHub Pull Requests rule evaluation...');
  const mockGitHubPRs = async () => ({
    success: true,
    data: [
      {
        id: 101,
        number: 42,
        title: 'Add external integrations',
        authorLogin: 'developer',
        createdAt: '2026-09-11T10:15:00.000Z',
        htmlUrl: 'https://github.com/pact/core/pull/42',
        repository: 'pact/core',
      },
    ],
  });

  const ghPrRes: ExternalProofRuleResult = await evaluateProofOfWorkRule({
    provider: 'github',
    ruleType: 'github_pr',
    config: { min_prs: 1 },
    windowStart,
    windowEnd,
    accountHandle: 'developer',
    fetcherOverrides: { githubPRs: mockGitHubPRs },
  });

  assert.strictEqual(ghPrRes.verified, true, 'GitHub PR verified');
  assert.strictEqual(ghPrRes.evidence.length, 1);
  assert.strictEqual(ghPrRes.evidence[0].evidence_type, 'pr');
  console.log('✅ GitHub PR evaluation verified.');

  // 4. LeetCode Solves Verification
  console.log('\n4. Testing LeetCode problem solve evaluation...');
  const mockLeetCodeAc = async () => ({
    success: true,
    data: [
      {
        id: 'sub_1',
        title: 'Two Sum',
        titleSlug: 'two-sum',
        timestamp: '2026-09-11T09:30:00.000Z', // In window
      },
      {
        id: 'sub_2',
        title: 'LRU Cache',
        titleSlug: 'lru-cache',
        timestamp: '2026-09-11T11:00:00.000Z', // In window
      },
      {
        id: 'sub_3',
        title: 'LRU Cache',
        titleSlug: 'lru-cache',
        timestamp: '2026-09-11T11:05:00.000Z', // Duplicate solve of same problem in window
      },
      {
        id: 'sub_4',
        title: 'Median of Two Sorted Arrays',
        titleSlug: 'median-of-two-sorted-arrays',
        timestamp: '2026-09-10T11:00:00.000Z', // Out of window
      },
    ],
  });

  const lcRes: ExternalProofRuleResult = await evaluateProofOfWorkRule({
    provider: 'leetcode',
    ruleType: 'leetcode_solve',
    config: { min_problems: 2 },
    windowStart,
    windowEnd,
    accountHandle: 'algo_master',
    fetcherOverrides: { leetcodeAc: mockLeetCodeAc },
  });

  assert.strictEqual(lcRes.verified, true, 'LeetCode verified 2 unique problem solves');
  assert.strictEqual(lcRes.evidence.length, 2, 'Deduplicated duplicate solves of LRU Cache');

  // Specific problem slug test
  const lcSlugRes: ExternalProofRuleResult = await evaluateProofOfWorkRule({
    provider: 'leetcode',
    ruleType: 'leetcode_solve',
    config: { min_problems: 1, specific_slug: 'two-sum' },
    windowStart,
    windowEnd,
    accountHandle: 'algo_master',
    fetcherOverrides: { leetcodeAc: mockLeetCodeAc },
  });
  assert.strictEqual(lcSlugRes.verified, true, 'Specific slug requirement matched');

  const lcMissingSlugRes: ExternalProofRuleResult = await evaluateProofOfWorkRule({
    provider: 'leetcode',
    ruleType: 'leetcode_solve',
    config: { min_problems: 1, specific_slug: 'trapping-rain-water' },
    windowStart,
    windowEnd,
    accountHandle: 'algo_master',
    fetcherOverrides: { leetcodeAc: mockLeetCodeAc },
  });
  assert.strictEqual(lcMissingSlugRes.verified, false, 'Missing specific slug failed gracefully');
  console.log('✅ LeetCode evaluation verified.');

  // 5. Codeforces Solves Verification
  console.log('\n5. Testing Codeforces problem solve evaluation...');
  const mockCodeforcesSubmissions = async () => ({
    success: true,
    data: [
      {
        id: 9991,
        contestId: 1900,
        creationTimeIso: '2026-09-11T09:45:00.000Z', // In window
        problemName: 'Cover in Water',
        problemIndex: 'A',
        rating: 800,
        verdict: 'OK',
        passedTestCount: 15,
      },
      {
        id: 9992,
        contestId: 1900,
        creationTimeIso: '2026-09-11T10:15:00.000Z', // In window
        problemName: 'Laura and Operations',
        problemIndex: 'B',
        rating: 1100,
        verdict: 'WRONG_ANSWER', // Rejected verdict
        passedTestCount: 3,
      },
      {
        id: 9993,
        contestId: 1900,
        creationTimeIso: '2026-09-11T10:45:00.000Z', // In window
        problemName: 'Laura and Operations',
        problemIndex: 'B',
        rating: 1100,
        verdict: 'OK', // Accepted
        passedTestCount: 20,
      },
    ],
  });

  const cfRes: ExternalProofRuleResult = await evaluateProofOfWorkRule({
    provider: 'codeforces',
    ruleType: 'codeforces_solve',
    config: { min_problems: 2 },
    windowStart,
    windowEnd,
    accountHandle: 'tourist',
    fetcherOverrides: { codeforcesSubmissions: mockCodeforcesSubmissions },
  });

  assert.strictEqual(cfRes.verified, true, 'Codeforces verified 2 OK solves');
  assert.strictEqual(cfRes.evidence.length, 2);

  // Minimum rating test
  const cfRatingRes: ExternalProofRuleResult = await evaluateProofOfWorkRule({
    provider: 'codeforces',
    ruleType: 'codeforces_solve',
    config: { min_problems: 2, min_rating: 1000 },
    windowStart,
    windowEnd,
    accountHandle: 'tourist',
    fetcherOverrides: { codeforcesSubmissions: mockCodeforcesSubmissions },
  });
  assert.strictEqual(cfRatingRes.verified, false, 'Filtered out sub-1000 problem');
  assert.strictEqual(cfRatingRes.evidence.length, 1, 'Only 1100 problem matched');
  console.log('✅ Codeforces evaluation verified.');

  // 6. Provider Failure & Rate Limit Invariants
  console.log('\n6. Testing Provider Outage & Rate Limit Invariants...');
  const mockOutage = async () => ({
    success: false,
    isUnavailable: true,
    error: 'Codeforces 503 Service Unavailable',
  });

  const outageRes = await evaluateProofOfWorkRule({
    provider: 'codeforces',
    ruleType: 'codeforces_solve',
    config: { min_problems: 1 },
    windowStart,
    windowEnd,
    accountHandle: 'tourist',
    fetcherOverrides: { codeforcesSubmissions: mockOutage },
  });

  assert.strictEqual(outageRes.verified, false, 'Outage returns verified: false');
  assert.strictEqual(outageRes.code, 'PROVIDER_UNAVAILABLE', 'Distinct PROVIDER_UNAVAILABLE code returned');
  assert.notStrictEqual(outageRes.code, 'RULE_NOT_SATISFIED', 'Outage is NEVER conflated with user failure');

  const mockRateLimit = async () => ({
    success: false,
    isRateLimited: true,
    error: 'GitHub API 429 Rate Limited',
  });

  const rateLimitRes = await evaluateProofOfWorkRule({
    provider: 'github',
    ruleType: 'github_commits',
    config: { min_commits: 1 },
    windowStart,
    windowEnd,
    accountHandle: 'developer',
    fetcherOverrides: { githubCommits: mockRateLimit },
  });

  assert.strictEqual(rateLimitRes.code, 'RATE_LIMITED', 'Rate limit handled gracefully');
  console.log('✅ Provider outage and rate limit resilience verified.');

  // 7. Missing Account Handle Defense
  console.log('\n7. Testing Missing Account Defense...');
  const noAccountRes = await evaluateProofOfWorkRule({
    provider: 'github',
    ruleType: 'github_commits',
    config: { min_commits: 1 },
    windowStart,
    windowEnd,
    accountHandle: '',
  });

  assert.strictEqual(noAccountRes.code, 'NO_LINKED_ACCOUNT');
  console.log('✅ Missing account defense verified.');

  // 8. GitHub Activity Summary & Contribution Heatmap Aggregation
  console.log('\n8. Testing GitHub Activity Summary & Contribution Aggregation...');
  const emptyUserRes = await fetchGitHubActivitySummary('');
  assert.strictEqual(emptyUserRes.success, false, 'Empty username returns failure');

  const summaryRes = await fetchGitHubActivitySummary('developer', undefined, 365, {
    commits: async () => ({
      success: true,
      data: [
        {
          sha: 'sha-1',
          authorLogin: 'developer',
          authorDate: '2026-09-10T14:00:00Z',
          message: 'feat: add contribution heatmap',
          repository: 'pact/core',
        },
        {
          sha: 'sha-2',
          authorLogin: 'developer',
          authorDate: '2026-09-10T16:30:00Z',
          message: 'test: add heatmap unit tests',
          repository: 'pact/core',
        },
        {
          sha: 'sha-3',
          authorLogin: 'developer',
          authorDate: '2026-09-09T10:00:00Z',
          message: 'docs: update integration runbook',
          repository: 'pact/docs',
        },
      ],
    }),
    pullRequests: async () => ({
      success: true,
      data: [
        {
          id: 101,
          number: 42,
          title: 'Surface Real GitHub Activity',
          authorLogin: 'developer',
          createdAt: '2026-09-10T17:00:00Z',
          htmlUrl: 'https://github.com/pact/core/pull/42',
          repository: 'pact/core',
        },
      ],
    }),
  });

  assert.strictEqual(summaryRes.success, true, 'Activity summary generated successfully');
  assert.strictEqual(summaryRes.data?.username, 'developer');
  assert.strictEqual(summaryRes.data?.totalCommits, 3, 'Total commits counted');
  assert.strictEqual(summaryRes.data?.totalPRs, 1, 'Total PRs counted');
  assert.strictEqual(summaryRes.data?.totalContributions, 4, 'Total contributions calculated');
  assert.ok(
    summaryRes.data && summaryRes.data.dailyContributions.length >= 365,
    '365+ daily contribution buckets generated'
  );

  // Verify daily level calculation on 2026-09-10 (2 commits + 1 PR = 3 -> level 2)
  const sep10 = summaryRes.data?.dailyContributions.find((d) => d.date === '2026-09-10');
  assert.ok(sep10, '2026-09-10 found in daily contributions');
  assert.strictEqual(sep10?.count, 3, '2026-09-10 count is 3');
  assert.strictEqual(sep10?.commitCount, 2, '2026-09-10 commitCount is 2');
  assert.strictEqual(sep10?.prCount, 1, '2026-09-10 prCount is 1');
  assert.strictEqual(sep10?.level, 2, '2026-09-10 level is 2');

  // Verify repository breakdown
  const topRepos = summaryRes.data?.topRepositories || [];
  assert.strictEqual(topRepos.length, 2, 'Two unique repositories identified');
  assert.strictEqual(topRepos[0].name, 'pact/core', 'Top repo is pact/core');
  assert.strictEqual(topRepos[0].totalCount, 3, 'pact/core has 3 contributions');
  assert.strictEqual(topRepos[1].name, 'pact/docs', 'Second repo is pact/docs');

  // Verify recent activities
  assert.strictEqual(summaryRes.data?.recentActivities.length, 4, '4 recent activities recorded');
  console.log('✅ GitHub Activity Summary, Streaks & Heatmap verified.');

  console.log('\n================================================================');
  console.log('🎉 ALL 8 EXTERNAL PROOF-OF-WORK TEST SUITES PASSED CLEANLY');
  console.log('================================================================\n');
}

runProofOfWorkTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
