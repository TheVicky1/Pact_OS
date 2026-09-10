/**
 * PACT Phase 5D: Deterministic Proof-of-Work Verification Engine
 * Pure server-side rule evaluation, time-window filtering, and evidence compilation.
 * Strictly distinguishes:
 * - OBJECTIVELY_VERIFIED vs RULE_NOT_SATISFIED vs PROVIDER_UNAVAILABLE
 */

import {
  ExternalProofProvider,
  ExternalProofRuleResult,
  ExternalProofEvidenceItem,
  VerificationConfig,
  VerificationType,
} from '@/types/domain';
import { fetchGitHubRepoCommits, fetchGitHubPublicUserCommits, fetchGitHubPullRequests } from './github';
import { fetchLeetCodeRecentAc } from './leetcode';
import { fetchCodeforcesSubmissions } from './codeforces';

export interface EvaluationOptions {
  provider: ExternalProofProvider;
  ruleType: VerificationType;
  config: VerificationConfig;
  windowStart: string; // ISO UTC
  windowEnd: string;   // ISO UTC
  accountHandle: string;
  token?: string | null;
  fetcherOverrides?: {
    githubCommits?: (user: string, token?: string | null) => Promise<any>;
    githubPRs?: (user: string, since?: string, until?: string, repo?: string, token?: string | null) => Promise<any>;
    leetcodeAc?: (user: string, limit?: number) => Promise<any>;
    codeforcesSubmissions?: (handle: string, count?: number) => Promise<any>;
  };
}

/**
 * Checks whether an event ISO timestamp falls strictly within the commitment UTC window [windowStart, windowEnd].
 */
export function isTimestampInWindow(
  eventIso: string,
  windowStartIso: string,
  windowEndIso: string
): boolean {
  const eventTime = new Date(eventIso).getTime();
  const startTime = new Date(windowStartIso).getTime();
  const endTime = new Date(windowEndIso).getTime();

  if (isNaN(eventTime) || isNaN(startTime) || isNaN(endTime)) {
    return false;
  }

  return eventTime >= startTime && eventTime <= endTime;
}

/**
 * Deterministically evaluates an external proof-of-work rule against provider data.
 */
export async function evaluateProofOfWorkRule(
  options: EvaluationOptions
): Promise<ExternalProofRuleResult> {
  const {
    provider,
    ruleType,
    config,
    windowStart,
    windowEnd,
    accountHandle,
    token,
    fetcherOverrides,
  } = options;

  const cleanHandle = accountHandle?.trim().replace(/^@/, '');
  if (!cleanHandle) {
    return {
      verified: false,
      code: 'NO_LINKED_ACCOUNT',
      summary: 'No linked external account handle found for verification.',
      provider,
      evidence: [],
      checked_count: 0,
      required_count: 1,
      window_start: windowStart,
      window_end: windowEnd,
      error: 'Account handle is missing or empty.',
    };
  }

  // 1. GitHub Commits / PR Evaluation
  if (provider === 'github') {
    const isPrRule = ruleType === 'github_pr';
    const requiredCount = isPrRule
      ? typeof config.min_prs === 'number' && config.min_prs > 0 ? config.min_prs : 1
      : typeof config.min_commits === 'number' && config.min_commits > 0 ? config.min_commits : 1;
    const targetRepo = typeof config.repository === 'string' && config.repository.trim() ? config.repository.trim() : undefined;

    if (isPrRule) {
      const prFetcher = fetcherOverrides?.githubPRs || fetchGitHubPullRequests;
      const res = await prFetcher(cleanHandle, windowStart, windowEnd, targetRepo, token);

      if (!res.success) {
        if (res.isRateLimited) {
          return {
            verified: false,
            code: 'RATE_LIMITED',
            summary: 'GitHub API rate limit reached. Verification will retry.',
            provider,
            evidence: [],
            checked_count: 0,
            required_count: requiredCount,
            window_start: windowStart,
            window_end: windowEnd,
            error: res.error,
          };
        }
        return {
          verified: false,
          code: 'PROVIDER_UNAVAILABLE',
          summary: 'Unable to reach GitHub to verify pull requests.',
          provider,
          evidence: [],
          checked_count: 0,
          required_count: requiredCount,
          window_start: windowStart,
          window_end: windowEnd,
          error: res.error,
        };
      }

      const validPrs = (res.data || []).filter((pr: any) =>
        isTimestampInWindow(pr.createdAt, windowStart, windowEnd)
      );

      const evidenceItems: ExternalProofEvidenceItem[] = validPrs.map((pr: any) => ({
        external_event_id: `pr_${pr.id || pr.number}`,
        event_timestamp: pr.createdAt,
        evidence_type: 'pr',
        summary: `GitHub PR #${pr.number}: ${pr.title}`,
        metadata: {
          number: pr.number,
          title: pr.title,
          url: pr.htmlUrl,
          repository: pr.repository,
        },
      }));

      const verified = evidenceItems.length >= requiredCount;
      return {
        verified,
        code: verified ? 'VERIFIED' : 'RULE_NOT_SATISFIED',
        summary: verified
          ? `Verified ${evidenceItems.length} GitHub pull request(s) within commitment window (required: ${requiredCount}).`
          : `Found ${evidenceItems.length} of ${requiredCount} required GitHub pull request(s) within commitment window.`,
        provider: 'github',
        evidence: evidenceItems,
        checked_count: evidenceItems.length,
        required_count: requiredCount,
        window_start: windowStart,
        window_end: windowEnd,
      };
    } else {
      // Commits evaluation
      let res;
      if (targetRepo && targetRepo.includes('/')) {
        const [owner, repo] = targetRepo.split('/');
        res = await fetchGitHubRepoCommits(owner, repo, cleanHandle, windowStart, windowEnd, token);
      } else {
        const commitFetcher = fetcherOverrides?.githubCommits || fetchGitHubPublicUserCommits;
        res = await commitFetcher(cleanHandle, token);
      }

      if (!res.success) {
        if (res.isRateLimited) {
          return {
            verified: false,
            code: 'RATE_LIMITED',
            summary: 'GitHub API rate limit reached. Verification will retry.',
            provider,
            evidence: [],
            checked_count: 0,
            required_count: requiredCount,
            window_start: windowStart,
            window_end: windowEnd,
            error: res.error,
          };
        }
        return {
          verified: false,
          code: 'PROVIDER_UNAVAILABLE',
          summary: 'Unable to reach GitHub to verify commit activity.',
          provider,
          evidence: [],
          checked_count: 0,
          required_count: requiredCount,
          window_start: windowStart,
          window_end: windowEnd,
          error: res.error,
        };
      }

      const validCommits = (res.data || []).filter((c: any) => {
        const matchesWindow = isTimestampInWindow(c.authorDate, windowStart, windowEnd);
        const matchesRepo = !targetRepo || (c.repository && c.repository.toLowerCase() === targetRepo.toLowerCase());
        return matchesWindow && matchesRepo;
      });

      // Deduplicate by commit SHA
      const uniqueShas = new Set<string>();
      const evidenceItems: ExternalProofEvidenceItem[] = [];
      for (const c of validCommits) {
        if (!uniqueShas.has(c.sha)) {
          uniqueShas.add(c.sha);
          evidenceItems.push({
            external_event_id: c.sha,
            event_timestamp: c.authorDate,
            evidence_type: 'commit',
            summary: `GitHub Commit ${c.sha.slice(0, 7)}: ${c.message}`,
            metadata: {
              sha: c.sha,
              message: c.message,
              repository: c.repository,
            },
          });
        }
      }

      const verified = evidenceItems.length >= requiredCount;
      return {
        verified,
        code: verified ? 'VERIFIED' : 'RULE_NOT_SATISFIED',
        summary: verified
          ? `Verified ${evidenceItems.length} GitHub commit(s) within commitment window (required: ${requiredCount}).`
          : `Found ${evidenceItems.length} of ${requiredCount} required GitHub commit(s) within commitment window.`,
        provider: 'github',
        evidence: evidenceItems,
        checked_count: evidenceItems.length,
        required_count: requiredCount,
        window_start: windowStart,
        window_end: windowEnd,
      };
    }
  }

  // 2. LeetCode Evaluation
  if (provider === 'leetcode') {
    const requiredCount = typeof config.min_problems === 'number' && config.min_problems > 0 ? config.min_problems : 1;
    const specificSlug = typeof config.specific_slug === 'string' && config.specific_slug.trim() ? config.specific_slug.trim().toLowerCase() : undefined;

    const leetcodeFetcher = fetcherOverrides?.leetcodeAc || fetchLeetCodeRecentAc;
    const res = await leetcodeFetcher(cleanHandle, 50);

    if (!res.success) {
      if (res.isRateLimited) {
        return {
          verified: false,
          code: 'RATE_LIMITED',
          summary: 'LeetCode rate limit reached. Verification will retry.',
          provider,
          evidence: [],
          checked_count: 0,
          required_count: requiredCount,
          window_start: windowStart,
          window_end: windowEnd,
          error: res.error,
        };
      }
      return {
        verified: false,
        code: 'PROVIDER_UNAVAILABLE',
        summary: 'Unable to reach LeetCode GraphQL service.',
        provider,
        evidence: [],
        checked_count: 0,
        required_count: requiredCount,
        window_start: windowStart,
        window_end: windowEnd,
        error: res.error,
      };
    }

    const validSubmissions = (res.data || []).filter((sub: any) => {
      const inWindow = isTimestampInWindow(sub.timestamp, windowStart, windowEnd);
      const matchesSlug = !specificSlug || sub.titleSlug.toLowerCase() === specificSlug;
      return inWindow && matchesSlug;
    });

    // Deduplicate problem solves in the window by titleSlug
    const uniqueSlugs = new Set<string>();
    const evidenceItems: ExternalProofEvidenceItem[] = [];
    for (const sub of validSubmissions) {
      if (!uniqueSlugs.has(sub.titleSlug)) {
        uniqueSlugs.add(sub.titleSlug);
        evidenceItems.push({
          external_event_id: sub.id || `lc_${sub.titleSlug}_${new Date(sub.timestamp).getTime()}`,
          event_timestamp: sub.timestamp,
          evidence_type: 'accepted_submission',
          summary: `LeetCode Accepted: ${sub.title}`,
          metadata: {
            title: sub.title,
            titleSlug: sub.titleSlug,
          },
        });
      }
    }

    const verified = evidenceItems.length >= requiredCount;
    return {
      verified,
      code: verified ? 'VERIFIED' : 'RULE_NOT_SATISFIED',
      summary: verified
        ? `Verified ${evidenceItems.length} accepted LeetCode problem solve(s) within commitment window (required: ${requiredCount}).`
        : `Found ${evidenceItems.length} of ${requiredCount} required LeetCode problem solve(s) within commitment window.`,
      provider: 'leetcode',
      evidence: evidenceItems,
      checked_count: evidenceItems.length,
      required_count: requiredCount,
      window_start: windowStart,
      window_end: windowEnd,
    };
  }

  // 3. Codeforces Evaluation
  if (provider === 'codeforces') {
    const requiredCount = typeof config.min_problems === 'number' && config.min_problems > 0 ? config.min_problems : 1;
    const minRating = typeof config.min_rating === 'number' && config.min_rating > 0 ? config.min_rating : undefined;

    const cfFetcher = fetcherOverrides?.codeforcesSubmissions || fetchCodeforcesSubmissions;
    const res = await cfFetcher(cleanHandle, 50);

    if (!res.success) {
      if (res.isRateLimited) {
        return {
          verified: false,
          code: 'RATE_LIMITED',
          summary: 'Codeforces rate limit reached. Verification will retry.',
          provider,
          evidence: [],
          checked_count: 0,
          required_count: requiredCount,
          window_start: windowStart,
          window_end: windowEnd,
          error: res.error,
        };
      }
      return {
        verified: false,
        code: 'PROVIDER_UNAVAILABLE',
        summary: 'Unable to reach Codeforces API service.',
        provider,
        evidence: [],
        checked_count: 0,
        required_count: requiredCount,
        window_start: windowStart,
        window_end: windowEnd,
        error: res.error,
      };
    }

    const validSubmissions = (res.data || []).filter((sub: any) => {
      const inWindow = isTimestampInWindow(sub.creationTimeIso, windowStart, windowEnd);
      const isAccepted = sub.verdict === 'OK';
      const meetsRating = !minRating || (typeof sub.rating === 'number' && sub.rating >= minRating);
      return inWindow && isAccepted && meetsRating;
    });

    // Deduplicate solves by problem name/index
    const uniqueProblems = new Set<string>();
    const evidenceItems: ExternalProofEvidenceItem[] = [];
    for (const sub of validSubmissions) {
      const probKey = `${sub.contestId || 'c'}_${sub.problemIndex}_${sub.problemName}`;
      if (!uniqueProblems.has(probKey)) {
        uniqueProblems.add(probKey);
        evidenceItems.push({
          external_event_id: `cf_sub_${sub.id}`,
          event_timestamp: sub.creationTimeIso,
          evidence_type: 'accepted_submission',
          summary: `Codeforces Accepted [${sub.problemIndex}] ${sub.problemName}${sub.rating ? ` (${sub.rating})` : ''}`,
          metadata: {
            submissionId: sub.id,
            contestId: sub.contestId,
            problemIndex: sub.problemIndex,
            problemName: sub.problemName,
            rating: sub.rating,
          },
        });
      }
    }

    const verified = evidenceItems.length >= requiredCount;
    return {
      verified,
      code: verified ? 'VERIFIED' : 'RULE_NOT_SATISFIED',
      summary: verified
        ? `Verified ${evidenceItems.length} accepted Codeforces problem solve(s) within commitment window (required: ${requiredCount}).`
        : `Found ${evidenceItems.length} of ${requiredCount} required Codeforces solve(s) within commitment window.`,
      provider: 'codeforces',
      evidence: evidenceItems,
      checked_count: evidenceItems.length,
      required_count: requiredCount,
      window_start: windowStart,
      window_end: windowEnd,
    };
  }

  return {
    verified: false,
    code: 'RULE_NOT_SATISFIED',
    summary: `Unsupported external proof provider: ${provider}`,
    provider,
    evidence: [],
    checked_count: 0,
    required_count: 1,
    window_start: windowStart,
    window_end: windowEnd,
  };
}
