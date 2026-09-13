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
import {
  fetchGitHubRepoCommits,
  fetchGitHubPublicUserCommits,
  fetchGitHubPullRequests,
  GitHubCommitItem,
  GitHubPullRequestItem,
  GitHubAdapterResult,
} from './github';
import { fetchLeetCodeRecentAc, LeetCodeSubmissionItem, LeetCodeAdapterResult } from './leetcode';
import { fetchCodeforcesSubmissions, CodeforcesSubmissionItem, CodeforcesAdapterResult } from './codeforces';
import {
  fetchWakaTimeSummaries,
  aggregateWakaTimeMetrics,
  WakaTimeSummaryDay,
  WakaTimeAdapterResult,
  formatWakaTimeDuration,
} from './wakatime';

export interface EvaluationOptions {
  provider: ExternalProofProvider;
  ruleType: VerificationType;
  config: VerificationConfig;
  windowStart: string; // ISO UTC
  windowEnd: string;   // ISO UTC
  accountHandle: string;
  token?: string | null;
  fetcherOverrides?: {
    githubCommits?: (user: string, token?: string | null) => Promise<GitHubAdapterResult<GitHubCommitItem[]>>;
    githubPRs?: (user: string, since?: string, until?: string, repo?: string, token?: string | null) => Promise<GitHubAdapterResult<GitHubPullRequestItem[]>>;
    leetcodeAc?: (user: string, limit?: number) => Promise<LeetCodeAdapterResult<LeetCodeSubmissionItem[]>>;
    codeforcesSubmissions?: (handle: string, count?: number) => Promise<CodeforcesAdapterResult<CodeforcesSubmissionItem[]>>;
    wakatimeSummaries?: (user: string, start: string, end: string, token?: string | null) => Promise<WakaTimeAdapterResult<WakaTimeSummaryDay[]>>;
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

  if (Number.isNaN(eventTime) || Number.isNaN(startTime) || Number.isNaN(endTime)) {
    return false;
  }

  return eventTime >= startTime && eventTime <= endTime;
}

/**
 * Evaluates proof-of-work criteria deterministically against external activity feeds.
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

  const cleanHandle = accountHandle.replace(/^@/, '').trim();
  if (!cleanHandle) {
    return {
      verified: false,
      code: 'NO_LINKED_ACCOUNT',
      summary: `No linked account handle configured for provider "${provider}".`,
      provider,
      evidence: [],
      checked_count: 0,
      required_count: 1,
      window_start: windowStart,
      window_end: windowEnd,
    };
  }

  // 1. GitHub Evaluation
  if (provider === 'github') {
    const targetRepo = typeof config.repo === 'string' && config.repo.trim() ? config.repo.trim() : undefined;

    if (ruleType === 'github_pr') {
      const requiredCount =
        typeof config.min_prs === 'number' && config.min_prs > 0
          ? config.min_prs
          : typeof config.min_count === 'number' && config.min_count > 0
          ? config.min_count
          : 1;
      const prFetcher = fetcherOverrides?.githubPRs || fetchGitHubPullRequests;
      const res = await prFetcher(cleanHandle, windowStart, windowEnd, targetRepo, token);

      if (!res.success) {
        if (res.isRateLimited) {
          return {
            verified: false,
            code: 'RATE_LIMITED',
            summary: 'GitHub API rate limit exceeded. Verification will retry.',
            provider,
            evidence: [],
            checked_count: 0,
            required_count: requiredCount,
            window_start: windowStart,
            window_end: windowEnd,
            error: res.error,
          };
        }
        if (res.isUnauthorized) {
          return {
            verified: false,
            code: 'UNAUTHORIZED',
            summary: 'GitHub authentication expired or token revoked.',
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
          summary: 'Unable to connect to GitHub API.',
          provider,
          evidence: [],
          checked_count: 0,
          required_count: requiredCount,
          window_start: windowStart,
          window_end: windowEnd,
          error: res.error,
        };
      }

      const validPrs = (res.data || []).filter((pr: GitHubPullRequestItem) =>
        isTimestampInWindow(pr.createdAt, windowStart, windowEnd)
      );

      const evidenceItems: ExternalProofEvidenceItem[] = validPrs.map((pr: GitHubPullRequestItem) => ({
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
          ? `Verified ${evidenceItems.length} GitHub pull request(s) created in commitment window (required: ${requiredCount}).`
          : `Found ${evidenceItems.length} of ${requiredCount} required GitHub pull requests within commitment window.`,
        provider: 'github',
        evidence: evidenceItems,
        checked_count: evidenceItems.length,
        required_count: requiredCount,
        window_start: windowStart,
        window_end: windowEnd,
      };
    }

    // Default: github_commits
    if (ruleType === 'github_commits' || ruleType === 'external_proof') {
      const requiredCount =
        typeof config.min_commits === 'number' && config.min_commits > 0
          ? config.min_commits
          : typeof config.min_count === 'number' && config.min_count > 0
          ? config.min_count
          : 1;
      let res: GitHubAdapterResult<GitHubCommitItem[]>;

      if (targetRepo && targetRepo.includes('/')) {
        const [owner, repoName] = targetRepo.split('/');
        res = await fetchGitHubRepoCommits(owner, repoName, cleanHandle, windowStart, windowEnd, token);
      } else {
        const commitFetcher = fetcherOverrides?.githubCommits || fetchGitHubPublicUserCommits;
        res = await commitFetcher(cleanHandle, token);
      }

      if (!res.success) {
        if (res.isRateLimited) {
          return {
            verified: false,
            code: 'RATE_LIMITED',
            summary: 'GitHub API rate limit exceeded. Verification will retry.',
            provider,
            evidence: [],
            checked_count: 0,
            required_count: requiredCount,
            window_start: windowStart,
            window_end: windowEnd,
            error: res.error,
          };
        }
        if (res.isUnauthorized) {
          return {
            verified: false,
            code: 'UNAUTHORIZED',
            summary: 'GitHub access token invalid or expired.',
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
          summary: 'Unable to reach GitHub commit logs.',
          provider,
          evidence: [],
          checked_count: 0,
          required_count: requiredCount,
          window_start: windowStart,
          window_end: windowEnd,
          error: res.error,
        };
      }

      const validCommits = (res.data || []).filter((c: GitHubCommitItem) => {
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

    const validSubmissions = (res.data || []).filter((sub: LeetCodeSubmissionItem) => {
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
          external_event_id: `lc_ac_${sub.id}`,
          event_timestamp: sub.timestamp,
          evidence_type: 'accepted_submission',
          summary: `LeetCode Solved: ${sub.title}`,
          metadata: {
            submissionId: sub.id,
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
        ? `Verified ${evidenceItems.length} LeetCode accepted solve(s) in commitment window (required: ${requiredCount}).`
        : `Found ${evidenceItems.length} of ${requiredCount} required LeetCode problem solves in commitment window.`,
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

    const validSubmissions = (res.data || []).filter((sub: CodeforcesSubmissionItem) => {
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
        ? `Verified ${evidenceItems.length} Codeforces accepted submission(s) in commitment window (required: ${requiredCount}).`
        : `Found ${evidenceItems.length} of ${requiredCount} required Codeforces accepted submission(s) in commitment window.`,
      provider: 'codeforces',
      evidence: evidenceItems,
      checked_count: evidenceItems.length,
      required_count: requiredCount,
      window_start: windowStart,
      window_end: windowEnd,
    };
  }

  // 4. WakaTime / IDE Activity Evaluation
  if (provider === 'wakatime' || ruleType === 'wakatime_time') {
    const requiredMinutes =
      typeof config.min_minutes === 'number' && config.min_minutes > 0
        ? config.min_minutes
        : typeof config.required_duration_seconds === 'number' && config.required_duration_seconds > 0
        ? Math.ceil(config.required_duration_seconds / 60)
        : typeof config.min_count === 'number' && config.min_count > 0
        ? config.min_count
        : 30; // default 30 minutes

    const targetProject = typeof config.project === 'string' && config.project.trim() ? config.project.trim() : undefined;
    const targetLanguage = typeof config.language === 'string' && config.language.trim() ? config.language.trim() : undefined;
    const targetBranch = typeof config.branch === 'string' && config.branch.trim() ? config.branch.trim() : undefined;

    const startDate = windowStart.split('T')[0] || new Date().toISOString().split('T')[0];
    const endDate = windowEnd.split('T')[0] || new Date().toISOString().split('T')[0];

    const wakaFetcher = fetcherOverrides?.wakatimeSummaries || fetchWakaTimeSummaries;
    const res = await wakaFetcher(cleanHandle, startDate, endDate, token);

    if (!res.success) {
      if (res.isRateLimited) {
        return {
          verified: false,
          code: 'RATE_LIMITED',
          summary: 'WakaTime API rate limit reached. Verification will retry.',
          provider: 'wakatime',
          evidence: [],
          checked_count: 0,
          required_count: requiredMinutes,
          window_start: windowStart,
          window_end: windowEnd,
          error: res.error,
        };
      }
      if (res.isUnauthorized) {
        return {
          verified: false,
          code: 'UNAUTHORIZED',
          summary: 'WakaTime API key invalid or unauthorized.',
          provider: 'wakatime',
          evidence: [],
          checked_count: 0,
          required_count: requiredMinutes,
          window_start: windowStart,
          window_end: windowEnd,
          error: res.error,
        };
      }
      return {
        verified: false,
        code: 'PROVIDER_UNAVAILABLE',
        summary: 'Unable to reach WakaTime editor telemetry service.',
        provider: 'wakatime',
        evidence: [],
        checked_count: 0,
        required_count: requiredMinutes,
        window_start: windowStart,
        window_end: windowEnd,
        error: res.error,
      };
    }

    const aggregated = aggregateWakaTimeMetrics(res.data || [], {
      project: targetProject,
      language: targetLanguage,
      branch: targetBranch,
    });

    const evidenceItems: ExternalProofEvidenceItem[] = (res.data || [])
      .filter((day) => day.totalSeconds > 0)
      .map((day) => {
        let matchingSec = day.totalSeconds;
        if (targetProject) {
          const p = day.projects.find((pr) => pr.name.toLowerCase() === targetProject.toLowerCase());
          matchingSec = p ? p.totalSeconds : 0;
        } else if (targetLanguage) {
          const l = day.languages.find((la) => la.name.toLowerCase() === targetLanguage.toLowerCase());
          matchingSec = l ? l.totalSeconds : 0;
        }

        return {
          external_event_id: `waka_${day.date}`,
          event_timestamp: `${day.date}T23:59:59Z`,
          evidence_type: 'wakatime_coding_session',
          summary: `WakaTime ${day.date}: ${formatWakaTimeDuration(matchingSec)} coded${
            targetProject ? ` on ${targetProject}` : ''
          }`,
          metadata: {
            date: day.date,
            totalSeconds: day.totalSeconds,
            matchingSeconds: matchingSec,
            projects: day.projects,
            languages: day.languages,
          },
        };
      });

    const verified = aggregated.matchingMinutes >= requiredMinutes;
    const filterDesc = targetProject
      ? ` on project "${targetProject}"`
      : targetLanguage
      ? ` in language "${targetLanguage}"`
      : '';

    return {
      verified,
      code: verified ? 'VERIFIED' : 'RULE_NOT_SATISFIED',
      summary: verified
        ? `Verified ${aggregated.matchingMinutes} minutes (${formatWakaTimeDuration(
            aggregated.matchingSeconds
          )}) of active coding${filterDesc} (required: ${requiredMinutes} mins).`
        : `Found ${aggregated.matchingMinutes} of ${requiredMinutes} required minutes of coding${filterDesc} in commitment window.`,
      provider: 'wakatime',
      evidence: evidenceItems,
      checked_count: Math.floor(aggregated.matchingMinutes),
      required_count: requiredMinutes,
      window_start: windowStart,
      window_end: windowEnd,
    };
  }

  return {
    verified: false,
    code: 'UNKNOWN_PROVIDER',
    summary: `Unsupported external proof provider: "${provider}".`,
    provider,
    evidence: [],
    checked_count: 0,
    required_count: 1,
    window_start: windowStart,
    window_end: windowEnd,
  };
}
