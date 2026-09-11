/**
 * PACT Phase 5D: Codeforces External Proof-of-Work Adapter
 * Official REST API client for Codeforces handle verification, rating history,
 * submission analytics, and deterministic metric calculations.
 * Strictly relies on official public API endpoints:
 * - user.info
 * - user.rating
 * - user.status
 * Zero secret storage: relies on public verifiable submissions.
 */

export interface CodeforcesUserProfile {
  handle: string;
  name?: string | null;
  rank?: string | null;
  maxRank?: string | null;
  rating?: number | null;
  maxRating?: number | null;
  contribution?: number;
  friendOfCount?: number;
  avatar?: string | null;
  registrationDate?: string | null; // ISO 8601 UTC
}

export interface CodeforcesRatingRecord {
  contestId: number;
  contestName: string;
  rank: number;
  ratingUpdateTime: string; // ISO 8601 UTC
  oldRating: number;
  newRating: number;
  delta: number;
}

export interface CodeforcesSubmissionItem {
  id: number;
  contestId?: number;
  creationTimeIso: string; // ISO 8601 UTC
  problemName: string;
  problemIndex: string;
  rating?: number;
  tags?: string[];
  verdict: string; // 'OK', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', etc.
  programmingLanguage?: string;
  passedTestCount: number;
}

export interface CodeforcesDailyActivity {
  date: string; // YYYY-MM-DD
  count: number;
  acceptedCount: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface CodeforcesRatingBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface CodeforcesVerdictStat {
  verdict: string;
  count: number;
  percentage: number;
}

export interface CodeforcesLanguageStat {
  language: string;
  count: number;
}

export interface CodeforcesTagStat {
  tag: string;
  count: number;
}

export interface CodeforcesActivitySummary {
  handle: string;
  profile: CodeforcesUserProfile;
  totalSubmissions: number;
  totalAccepted: number;
  uniqueSolvedProblems: number;
  acceptanceRate: number | null; // percentage (0..100)
  currentRating: number | null;
  maxRating: number | null;
  currentRank: string | null;
  maxRank: string | null;
  contestsCount: number;
  currentStreak: number;
  longestStreak: number;
  last30DaysCount: number;
  ratingHistory: CodeforcesRatingRecord[];
  dailyActivity: CodeforcesDailyActivity[];
  difficultyBuckets: CodeforcesRatingBucket[];
  verdictStats: CodeforcesVerdictStat[];
  languageStats: CodeforcesLanguageStat[];
  tagStats: CodeforcesTagStat[];
  recentSubmissions: CodeforcesSubmissionItem[];
  syncedAt: string; // ISO 8601 UTC
}

export interface CodeforcesAdapterResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  isNotFound?: boolean;
  isRateLimited?: boolean;
  isUnavailable?: boolean;
}

const CODEFORCES_API_BASE = 'https://codeforces.com/api';
const TIMEOUT_MS = 12000;

async function fetchWithTimeout(url: string, timeoutMs: number = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PACT-Accountability-OS/1.0 (+https://pact.app)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Verifies that a Codeforces handle exists publicly and returns profile summary.
 */
export async function verifyCodeforcesUser(
  handle: string
): Promise<CodeforcesAdapterResult<CodeforcesUserProfile>> {
  try {
    const cleanHandle = handle.trim().replace(/^@/, '');
    if (!cleanHandle) {
      return { success: false, error: 'Codeforces handle is required.' };
    }

    const url = `${CODEFORCES_API_BASE}/user.info?handles=${encodeURIComponent(cleanHandle)}`;
    const res = await fetchWithTimeout(url);

    if (res.status === 503 || res.status === 502 || res.status === 504) {
      return { success: false, isUnavailable: true, error: 'Codeforces API is currently unavailable.' };
    }
    if (res.status === 429) {
      return { success: false, isRateLimited: true, error: 'Codeforces rate limit reached. Please retry in a few moments.' };
    }

    const json = (await res.json()) as {
      status: string;
      comment?: string;
      result?: Array<{
        handle: string;
        firstName?: string;
        lastName?: string;
        rating?: number;
        maxRating?: number;
        rank?: string;
        maxRank?: string;
        contribution?: number;
        friendOfCount?: number;
        avatar?: string;
        titlePhoto?: string;
        registrationTimeSeconds?: number;
      }>;
    };

    if (json.status !== 'OK' || !json.result || json.result.length === 0) {
      return {
        success: false,
        isNotFound: true,
        error: json.comment || `Codeforces handle "${cleanHandle}" not found.`,
      };
    }

    const rawUser = json.result[0];
    const fullName = [rawUser.firstName, rawUser.lastName].filter(Boolean).join(' ') || null;

    return {
      success: true,
      data: {
        handle: rawUser.handle,
        name: fullName,
        rating: rawUser.rating ?? null,
        maxRating: rawUser.maxRating ?? null,
        rank: rawUser.rank ?? null,
        maxRank: rawUser.maxRank ?? null,
        contribution: rawUser.contribution ?? 0,
        friendOfCount: rawUser.friendOfCount ?? 0,
        avatar: rawUser.avatar || rawUser.titlePhoto || null,
        registrationDate: rawUser.registrationTimeSeconds
          ? new Date(rawUser.registrationTimeSeconds * 1000).toISOString()
          : null,
      },
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, isUnavailable: true, error: 'Codeforces API request timed out.' };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error connecting to Codeforces.',
    };
  }
}

/**
 * Fetches full rated contest history for a Codeforces handle.
 */
export async function fetchCodeforcesRatingHistory(
  handle: string
): Promise<CodeforcesAdapterResult<CodeforcesRatingRecord[]>> {
  try {
    const cleanHandle = handle.trim().replace(/^@/, '');
    if (!cleanHandle) {
      return { success: false, error: 'Codeforces handle is required.' };
    }

    const url = `${CODEFORCES_API_BASE}/user.rating?handle=${encodeURIComponent(cleanHandle)}`;
    const res = await fetchWithTimeout(url);

    if (res.status === 503 || res.status === 502) {
      return { success: false, isUnavailable: true, error: 'Codeforces rating service unavailable.' };
    }
    if (res.status === 429) {
      return { success: false, isRateLimited: true, error: 'Codeforces rate limit reached.' };
    }

    const json = (await res.json()) as {
      status: string;
      comment?: string;
      result?: Array<{
        contestId: number;
        contestName: string;
        rank: number;
        ratingUpdateTimeSeconds: number;
        oldRating: number;
        newRating: number;
      }>;
    };

    if (json.status !== 'OK' || !json.result) {
      return {
        success: false,
        isNotFound: true,
        error: json.comment || `No rating history available for "${cleanHandle}".`,
      };
    }

    const records: CodeforcesRatingRecord[] = json.result.map((r) => ({
      contestId: r.contestId,
      contestName: r.contestName,
      rank: r.rank,
      ratingUpdateTime: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString(),
      oldRating: r.oldRating,
      newRating: r.newRating,
      delta: r.newRating - r.oldRating,
    }));

    // Sort chronologically ascending
    records.sort(
      (a, b) => new Date(a.ratingUpdateTime).getTime() - new Date(b.ratingUpdateTime).getTime()
    );

    return { success: true, data: records };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to query Codeforces rating history.',
    };
  }
}

/**
 * Fetches recent submissions for a Codeforces handle (up to 1000 for rich metrics).
 */
export async function fetchCodeforcesSubmissions(
  handle: string,
  count: number = 1000
): Promise<CodeforcesAdapterResult<CodeforcesSubmissionItem[]>> {
  try {
    const cleanHandle = handle.trim().replace(/^@/, '');
    if (!cleanHandle) {
      return { success: false, error: 'Codeforces handle is required.' };
    }

    const boundedCount = Math.min(Math.max(count, 1), 1000);
    const url = `${CODEFORCES_API_BASE}/user.status?handle=${encodeURIComponent(cleanHandle)}&from=1&count=${boundedCount}`;
    const res = await fetchWithTimeout(url);

    if (res.status === 503 || res.status === 502) {
      return { success: false, isUnavailable: true, error: 'Codeforces submission service unavailable.' };
    }
    if (res.status === 429) {
      return { success: false, isRateLimited: true, error: 'Codeforces rate limit reached.' };
    }

    const json = (await res.json()) as {
      status: string;
      comment?: string;
      result?: Array<{
        id: number;
        contestId?: number;
        creationTimeSeconds: number;
        problem: {
          contestId?: number;
          index: string;
          name: string;
          rating?: number;
          tags?: string[];
        };
        verdict: string;
        programmingLanguage?: string;
        passedTestCount: number;
      }>;
    };

    if (json.status !== 'OK' || !json.result) {
      return {
        success: false,
        isNotFound: true,
        error: json.comment || `Failed to fetch submissions for Codeforces handle "${cleanHandle}".`,
      };
    }

    const items: CodeforcesSubmissionItem[] = json.result.map((sub) => ({
      id: sub.id,
      contestId: sub.contestId || sub.problem.contestId,
      creationTimeIso: new Date(sub.creationTimeSeconds * 1000).toISOString(),
      problemName: sub.problem.name,
      problemIndex: sub.problem.index,
      rating: sub.problem.rating,
      tags: Array.isArray(sub.problem.tags) ? sub.problem.tags : [],
      verdict: sub.verdict || 'UNKNOWN',
      programmingLanguage: sub.programmingLanguage,
      passedTestCount: sub.passedTestCount || 0,
    }));

    return { success: true, data: items };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to query Codeforces submissions.',
    };
  }
}

/**
 * Computes deterministic daily activity calendar and streaks from submissions.
 */
export function computeCodeforcesDailyActivity(
  submissions: CodeforcesSubmissionItem[],
  daysBack: number = 365
): {
  dailyActivity: CodeforcesDailyActivity[];
  currentStreak: number;
  longestStreak: number;
  last30DaysCount: number;
} {
  const dayMap = new Map<string, { total: number; accepted: number }>();
  const now = new Date();

  // Initialize continuous past N days
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dayMap.set(dateStr, { total: 0, accepted: 0 });
  }

  // Populate submission counts
  for (const sub of submissions) {
    const dateStr = sub.creationTimeIso.split('T')[0];
    if (dayMap.has(dateStr)) {
      const entry = dayMap.get(dateStr)!;
      entry.total += 1;
      if (sub.verdict === 'OK') {
        entry.accepted += 1;
      }
    }
  }

  const dailyActivity: CodeforcesDailyActivity[] = [];
  let maxCount = 1;

  for (const [, counts] of dayMap) {
    if (counts.total > maxCount) maxCount = counts.total;
  }

  for (const [date, counts] of dayMap) {
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (counts.total > 0) {
      const ratio = counts.total / maxCount;
      if (ratio > 0.75) level = 4;
      else if (ratio > 0.5) level = 3;
      else if (ratio > 0.25) level = 2;
      else level = 1;
    }

    dailyActivity.push({
      date,
      count: counts.total,
      acceptedCount: counts.accepted,
      level,
    });
  }

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Iterate chronologically
  for (let i = 0; i < dailyActivity.length; i++) {
    const day = dailyActivity[i];
    if (day.count > 0) {
      tempStreak += 1;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Current streak (checking ending at today or yesterday)
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const todayCount = dayMap.get(todayStr)?.total || 0;
  const yesterdayCount = dayMap.get(yesterdayStr)?.total || 0;

  if (todayCount > 0 || yesterdayCount > 0) {
    let streak = 0;
    const startIndex = todayCount > 0 ? dailyActivity.length - 1 : dailyActivity.length - 2;
    for (let i = startIndex; i >= 0; i--) {
      if (dailyActivity[i].count > 0) {
        streak += 1;
      } else {
        break;
      }
    }
    currentStreak = streak;
  }

  // Last 30 days total
  let last30DaysCount = 0;
  const last30Slice = dailyActivity.slice(-30);
  for (const day of last30Slice) {
    last30DaysCount += day.count;
  }

  return { dailyActivity, currentStreak, longestStreak, last30DaysCount };
}

/**
 * Computes problem rating difficulty buckets, verdict breakdown, language stats, and tags.
 */
export function computeCodeforcesDistributions(submissions: CodeforcesSubmissionItem[]) {
  // 1. Unique solved problems & difficulty buckets (only from accepted submissions)
  const solvedProblemsMap = new Map<string, number | undefined>(); // key -> rating
  const verdictMap = new Map<string, number>();
  const languageMap = new Map<string, number>();
  const tagMap = new Map<string, number>();

  let totalAccepted = 0;

  for (const sub of submissions) {
    // Verdict stats
    const verdict = sub.verdict || 'UNKNOWN';
    verdictMap.set(verdict, (verdictMap.get(verdict) || 0) + 1);

    // Language stats
    if (sub.programmingLanguage) {
      const lang = sub.programmingLanguage;
      languageMap.set(lang, (languageMap.get(lang) || 0) + 1);
    }

    if (sub.verdict === 'OK') {
      totalAccepted += 1;
      const key = `${sub.contestId || 'c'}_${sub.problemIndex}_${sub.problemName.toLowerCase().trim()}`;
      if (!solvedProblemsMap.has(key)) {
        solvedProblemsMap.set(key, sub.rating);

        // Tag stats for unique solved
        if (sub.tags) {
          for (const t of sub.tags) {
            tagMap.set(t, (tagMap.get(t) || 0) + 1);
          }
        }
      }
    }
  }

  const uniqueSolvedCount = solvedProblemsMap.size;

  // Difficulty buckets (<1200, 1200-1399, 1400-1599, 1600-1899, 1900-2199, 2200+)
  const buckets: Record<string, number> = {
    '< 1200': 0,
    '1200 - 1399': 0,
    '1400 - 1599': 0,
    '1600 - 1899': 0,
    '1900 - 2199': 0,
    '2200+': 0,
    'Unrated': 0,
  };

  for (const [, rating] of solvedProblemsMap) {
    if (typeof rating !== 'number' || rating <= 0) {
      buckets['Unrated'] += 1;
    } else if (rating < 1200) {
      buckets['< 1200'] += 1;
    } else if (rating < 1400) {
      buckets['1200 - 1399'] += 1;
    } else if (rating < 1600) {
      buckets['1400 - 1599'] += 1;
    } else if (rating < 1900) {
      buckets['1600 - 1899'] += 1;
    } else if (rating < 2200) {
      buckets['1900 - 2199'] += 1;
    } else {
      buckets['2200+'] += 1;
    }
  }

  const difficultyBuckets: CodeforcesRatingBucket[] = Object.entries(buckets).map(
    ([range, count]) => ({
      range,
      count,
      percentage: uniqueSolvedCount > 0 ? Math.round((count / uniqueSolvedCount) * 100) : 0,
    })
  );

  // Verdict stats
  const totalSubmissions = submissions.length;
  const verdictStats: CodeforcesVerdictStat[] = Array.from(verdictMap.entries())
    .map(([verdict, count]) => ({
      verdict,
      count,
      percentage: totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Language stats (top 6)
  const languageStats: CodeforcesLanguageStat[] = Array.from(languageMap.entries())
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Tag stats (top 8)
  const tagStats: CodeforcesTagStat[] = Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    uniqueSolvedProblems: uniqueSolvedCount,
    totalAccepted,
    difficultyBuckets,
    verdictStats,
    languageStats,
    tagStats,
  };
}

/**
 * Complete, authoritative aggregator for Codeforces activity and proof-of-work.
 */
export async function fetchCodeforcesActivitySummary(
  handle: string
): Promise<CodeforcesAdapterResult<CodeforcesActivitySummary>> {
  try {
    const cleanHandle = handle.trim().replace(/^@/, '');
    if (!cleanHandle) {
      return { success: false, error: 'Codeforces handle is required.' };
    }

    // Parallel fetch: user.info, user.rating, user.status
    const [profileRes, ratingRes, statusRes] = await Promise.all([
      verifyCodeforcesUser(cleanHandle),
      fetchCodeforcesRatingHistory(cleanHandle),
      fetchCodeforcesSubmissions(cleanHandle, 1000),
    ]);

    if (!profileRes.success || !profileRes.data) {
      return {
        success: false,
        isNotFound: profileRes.isNotFound,
        isRateLimited: profileRes.isRateLimited,
        isUnavailable: profileRes.isUnavailable,
        error: profileRes.error || `Codeforces handle "${cleanHandle}" not found.`,
      };
    }

    const profile = profileRes.data;
    const ratingHistory = ratingRes.success && ratingRes.data ? ratingRes.data : [];
    const submissions = statusRes.success && statusRes.data ? statusRes.data : [];

    const { dailyActivity, currentStreak, longestStreak, last30DaysCount } =
      computeCodeforcesDailyActivity(submissions, 365);

    const {
      uniqueSolvedProblems,
      totalAccepted,
      difficultyBuckets,
      verdictStats,
      languageStats,
      tagStats,
    } = computeCodeforcesDistributions(submissions);

    const totalSubmissions = submissions.length;
    const acceptanceRate =
      totalSubmissions > 0 ? Math.round((totalAccepted / totalSubmissions) * 100) : null;

    const summary: CodeforcesActivitySummary = {
      handle: profile.handle,
      profile,
      totalSubmissions,
      totalAccepted,
      uniqueSolvedProblems,
      acceptanceRate,
      currentRating: profile.rating ?? null,
      maxRating: profile.maxRating ?? null,
      currentRank: profile.rank ?? null,
      maxRank: profile.maxRank ?? null,
      contestsCount: ratingHistory.length,
      currentStreak,
      longestStreak,
      last30DaysCount,
      ratingHistory,
      dailyActivity,
      difficultyBuckets,
      verdictStats,
      languageStats,
      tagStats,
      recentSubmissions: submissions.slice(0, 15),
      syncedAt: new Date().toISOString(),
    };

    return { success: true, data: summary };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to query Codeforces activity summary.',
    };
  }
}
