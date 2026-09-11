/**
 * PACT Phase 5D: LeetCode External Proof-of-Work Adapter
 * Pure GraphQL client for verifying public LeetCode profiles, solved problem distributions,
 * official submission calendars, contest ratings, streaks, and skill stats.
 * Strictly relies on LeetCode public GraphQL endpoints.
 * Zero secret storage: relies on public verifiable submissions and profiles.
 */

export interface LeetCodeUserProfile {
  username: string;
  realName?: string | null;
  avatar?: string | null;
  ranking?: number | null;
  reputation?: number | null;
  aboutMe?: string | null;
}

export interface LeetCodeDifficultyStats {
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'All';
  count: number;
  submissions?: number;
}

export interface LeetCodeContestRecord {
  contestTitle: string;
  rating: number;
  ranking: number;
  startTimeIso: string; // ISO 8601 UTC
}

export interface LeetCodeBadge {
  id: string;
  displayName: string;
  icon: string;
  creationDate?: string;
}

export interface LeetCodeLanguageStat {
  languageName: string;
  problemsSolved: number;
}

export interface LeetCodeTopicStat {
  tagName: string;
  problemsSolved: number;
}

export interface LeetCodeDailyContribution {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface LeetCodeSubmissionItem {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string; // ISO 8601 UTC
}

export interface LeetCodeActivitySummary {
  username: string;
  profile: LeetCodeUserProfile;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalAvailable: number;
  acceptanceRate: number | null; // percentage (0..100)
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  last30DaysCount: number;
  contestRating: number | null;
  contestGlobalRanking: number | null;
  attendedContestsCount: number;
  topPercentage: number | null;
  badges: LeetCodeBadge[];
  difficultyStats: Array<{
    difficulty: 'Easy' | 'Medium' | 'Hard';
    solved: number;
    total: number;
    percentage: number;
  }>;
  contestHistory: LeetCodeContestRecord[];
  dailyContributions: LeetCodeDailyContribution[];
  languageStats: LeetCodeLanguageStat[];
  topicStats: LeetCodeTopicStat[];
  recentSubmissions: LeetCodeSubmissionItem[];
  syncedAt: string; // ISO 8601 UTC
}

export interface LeetCodeAdapterResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  isNotFound?: boolean;
  isRateLimited?: boolean;
}

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';
const TIMEOUT_MS = 12000;

async function executeLeetCodeGraphQL<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<{ data?: T; errors?: Array<{ message: string }>; status: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PACT-OS/1.0 (+https://pact.app)',
        Referer: 'https://leetcode.com',
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    if (res.status === 429) {
      return { status: 429 };
    }

    if (!res.ok) {
      return { status: res.status };
    }

    const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
    return { data: json.data, errors: json.errors, status: 200 };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * GraphQL Queries
 */
const USER_PROFILE_QUERY = `
  query userProfileAndStats($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        realName
        userAvatar
        ranking
        reputation
        aboutMe
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      badges {
        id
        displayName
        icon
        creationDate
      }
      userCalendar {
        streak
        totalActiveDays
        submissionCalendar
      }
    }
    allQuestionsCount {
      difficulty
      count
    }
  }
`;

const USER_CONTEST_QUERY = `
  query userContestRankingInfo($username: String!) {
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      totalParticipants
      topPercentage
      badge {
        name
      }
    }
    userContestRankingHistory(username: $username) {
      attended
      rating
      ranking
      contest {
        title
        startTime
      }
    }
  }
`;

const RECENT_AC_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
    }
  }
`;

const SKILL_AND_LANGUAGE_QUERY = `
  query userSkillsAndLanguages($username: String!) {
    matchedUser(username: $username) {
      languageProblemCount {
        languageName
        problemsSolved
      }
      tagProblemCounts {
        advanced {
          tagName
          problemsSolved
        }
        intermediate {
          tagName
          problemsSolved
        }
        fundamental {
          tagName
          problemsSolved
        }
      }
    }
  }
`;

/**
 * Verifies that a LeetCode user profile exists publicly.
 */
export async function verifyLeetCodeUser(
  username: string
): Promise<LeetCodeAdapterResult<{ username: string; realName: string | null; ranking: number | null }>> {
  try {
    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) {
      return { success: false, error: 'LeetCode username is required.' };
    }

    const { data, status } = await executeLeetCodeGraphQL<{
      matchedUser?: {
        username: string;
        profile?: {
          realName?: string | null;
          ranking?: number | null;
        } | null;
      } | null;
    }>(
      `query verifyUser($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            realName
            ranking
          }
        }
      }`,
      { username: cleanUsername }
    );

    if (status === 429) {
      return { success: false, isRateLimited: true, error: 'LeetCode rate limit reached. Please retry in a few moments.' };
    }

    if (!data?.matchedUser) {
      return { success: false, isNotFound: true, error: `LeetCode user "${cleanUsername}" not found.` };
    }

    return {
      success: true,
      data: {
        username: data.matchedUser.username,
        realName: data.matchedUser.profile?.realName || null,
        ranking: data.matchedUser.profile?.ranking || null,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error connecting to LeetCode.',
    };
  }
}

/**
 * Fetches recent accepted problem submissions for a user.
 */
export async function fetchLeetCodeRecentAc(
  username: string,
  limit: number = 20
): Promise<LeetCodeAdapterResult<LeetCodeSubmissionItem[]>> {
  try {
    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) {
      return { success: false, error: 'LeetCode username is required.' };
    }

    const boundedLimit = Math.min(Math.max(limit, 1), 50);
    const { data, status } = await executeLeetCodeGraphQL<{
      recentAcSubmissionList?: Array<{
        id?: string;
        title: string;
        titleSlug: string;
        timestamp: string | number;
      }>;
    }>(RECENT_AC_QUERY, { username: cleanUsername, limit: boundedLimit });

    if (status === 429) {
      return { success: false, isRateLimited: true, error: 'LeetCode rate limit reached.' };
    }

    const rawList = data?.recentAcSubmissionList || [];
    const items: LeetCodeSubmissionItem[] = rawList.map((item, idx) => {
      const epochSeconds = typeof item.timestamp === 'string' ? parseInt(item.timestamp, 10) : item.timestamp;
      const isoTime = new Date(epochSeconds * 1000).toISOString();
      const uniqueId = item.id || `ac_${item.titleSlug}_${epochSeconds}_${idx}`;

      return {
        id: uniqueId,
        title: item.title,
        titleSlug: item.titleSlug,
        timestamp: isoTime,
      };
    });

    return { success: true, data: items };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to query LeetCode accepted submissions.',
    };
  }
}

/**
 * Parses LeetCode's submissionCalendar JSON string into a continuous 365-day heatmap.
 * submissionCalendar format: '{"1672531199": 2, "1672617599": 5, ...}'
 */
export function parseLeetCodeSubmissionCalendar(
  calendarJson?: string | null,
  daysBack: number = 365
): {
  dailyContributions: LeetCodeDailyContribution[];
  currentStreak: number;
  longestStreak: number;
  last30DaysCount: number;
} {
  const dayCountsMap = new Map<string, number>();
  const now = new Date();

  // Initialize continuous past N days
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dayCountsMap.set(dateStr, 0);
  }

  if (calendarJson) {
    try {
      const parsed = JSON.parse(calendarJson) as Record<string, number>;
      for (const [epochStr, count] of Object.entries(parsed)) {
        const epochSeconds = parseInt(epochStr, 10);
        if (!Number.isNaN(epochSeconds)) {
          const dateStr = new Date(epochSeconds * 1000).toISOString().split('T')[0];
          if (dayCountsMap.has(dateStr)) {
            dayCountsMap.set(dateStr, (dayCountsMap.get(dateStr) || 0) + count);
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  const dailyContributions: LeetCodeDailyContribution[] = [];
  let maxCount = 1;

  for (const [, count] of dayCountsMap) {
    if (count > maxCount) maxCount = count;
  }

  for (const [date, count] of dayCountsMap) {
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) {
      const ratio = count / maxCount;
      if (ratio > 0.75) level = 4;
      else if (ratio > 0.5) level = 3;
      else if (ratio > 0.25) level = 2;
      else level = 1;
    }

    dailyContributions.push({ date, count, level });
  }

  // Calculate streaks
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < dailyContributions.length; i++) {
    if (dailyContributions[i].count > 0) {
      tempStreak += 1;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Current streak
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const todayCount = dayCountsMap.get(todayStr) || 0;
  const yesterdayCount = dayCountsMap.get(yesterdayStr) || 0;

  let currentStreak = 0;
  if (todayCount > 0 || yesterdayCount > 0) {
    const startIndex = todayCount > 0 ? dailyContributions.length - 1 : dailyContributions.length - 2;
    for (let i = startIndex; i >= 0; i--) {
      if (dailyContributions[i].count > 0) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  // Last 30 days count
  let last30DaysCount = 0;
  const last30Slice = dailyContributions.slice(-30);
  for (const day of last30Slice) {
    last30DaysCount += day.count;
  }

  return { dailyContributions, currentStreak, longestStreak, last30DaysCount };
}

/**
 * Complete, authoritative aggregator for LeetCode activity and proof-of-work.
 */
export async function fetchLeetCodeActivitySummary(
  username: string
): Promise<LeetCodeAdapterResult<LeetCodeActivitySummary>> {
  try {
    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) {
      return { success: false, error: 'LeetCode username is required.' };
    }

    // Parallel GraphQL fetches
    const [profileRes, contestRes, recentAcRes, skillsRes] = await Promise.all([
      executeLeetCodeGraphQL<{
        matchedUser?: {
          username: string;
          profile?: {
            realName?: string | null;
            userAvatar?: string | null;
            ranking?: number | null;
            reputation?: number | null;
            aboutMe?: string | null;
          } | null;
          submitStatsGlobal?: {
            acSubmissionNum?: Array<{ difficulty: string; count: number; submissions?: number }>;
            totalSubmissionNum?: Array<{ difficulty: string; count: number; submissions?: number }>;
          };
          badges?: Array<{
            id: string;
            displayName: string;
            icon: string;
            creationDate?: string;
          }>;
          userCalendar?: {
            streak?: number;
            totalActiveDays?: number;
            submissionCalendar?: string;
          };
        } | null;
        allQuestionsCount?: Array<{ difficulty: string; count: number }>;
      }>(USER_PROFILE_QUERY, { username: cleanUsername }),

      executeLeetCodeGraphQL<{
        userContestRanking?: {
          attendedContestsCount?: number;
          rating?: number;
          globalRanking?: number;
          totalParticipants?: number;
          topPercentage?: number;
          badge?: { name: string };
        } | null;
        userContestRankingHistory?: Array<{
          attended?: boolean;
          rating?: number;
          ranking?: number;
          contest?: {
            title: string;
            startTime: number;
          };
        }>;
      }>(USER_CONTEST_QUERY, { username: cleanUsername }),

      fetchLeetCodeRecentAc(cleanUsername, 15),

      executeLeetCodeGraphQL<{
        matchedUser?: {
          languageProblemCount?: Array<{ languageName: string; problemsSolved: number }>;
          tagProblemCounts?: {
            advanced?: Array<{ tagName: string; problemsSolved: number }>;
            intermediate?: Array<{ tagName: string; problemsSolved: number }>;
            fundamental?: Array<{ tagName: string; problemsSolved: number }>;
          };
        };
      }>(SKILL_AND_LANGUAGE_QUERY, { username: cleanUsername }),
    ]);

    if (!profileRes.data?.matchedUser) {
      return {
        success: false,
        isNotFound: true,
        error: `LeetCode user "${cleanUsername}" not found.`,
      };
    }

    const matchedUser = profileRes.data.matchedUser;
    const profile: LeetCodeUserProfile = {
      username: matchedUser.username,
      realName: matchedUser.profile?.realName || null,
      avatar: matchedUser.profile?.userAvatar || null,
      ranking: matchedUser.profile?.ranking || null,
      reputation: matchedUser.profile?.reputation || null,
      aboutMe: matchedUser.profile?.aboutMe || null,
    };

    // Solved counts by difficulty
    const acNum = matchedUser.submitStatsGlobal?.acSubmissionNum || [];
    const totalQuestions = profileRes.data.allQuestionsCount || [];

    const getCount = (diff: string) => acNum.find((x) => x.difficulty.toLowerCase() === diff.toLowerCase())?.count || 0;
    const getTotal = (diff: string) => totalQuestions.find((x) => x.difficulty.toLowerCase() === diff.toLowerCase())?.count || 1;

    const easySolved = getCount('Easy');
    const mediumSolved = getCount('Medium');
    const hardSolved = getCount('Hard');
    const totalSolved = getCount('All') || easySolved + mediumSolved + hardSolved;
    const totalAvailable = getTotal('All') || 3300;

    const difficultyStats = [
      {
        difficulty: 'Easy' as const,
        solved: easySolved,
        total: getTotal('Easy') || 800,
        percentage: Math.round((easySolved / (getTotal('Easy') || 1)) * 100),
      },
      {
        difficulty: 'Medium' as const,
        solved: mediumSolved,
        total: getTotal('Medium') || 1700,
        percentage: Math.round((mediumSolved / (getTotal('Medium') || 1)) * 100),
      },
      {
        difficulty: 'Hard' as const,
        solved: hardSolved,
        total: getTotal('Hard') || 750,
        percentage: Math.round((hardSolved / (getTotal('Hard') || 1)) * 100),
      },
    ];

    // Acceptance rate
    const totalSubmissions = matchedUser.submitStatsGlobal?.totalSubmissionNum?.find(
      (x) => x.difficulty.toLowerCase() === 'all'
    )?.submissions;
    const acceptedSubmissions = matchedUser.submitStatsGlobal?.acSubmissionNum?.find(
      (x) => x.difficulty.toLowerCase() === 'all'
    )?.submissions;

    let acceptanceRate: number | null = null;
    if (typeof acceptedSubmissions === 'number' && typeof totalSubmissions === 'number' && totalSubmissions > 0) {
      acceptanceRate = Math.round((acceptedSubmissions / totalSubmissions) * 100);
    }

    // Calendar & Streaks
    const calendarRaw = matchedUser.userCalendar?.submissionCalendar;
    const { dailyContributions, currentStreak: calcCurrentStreak, longestStreak: calcLongestStreak, last30DaysCount } =
      parseLeetCodeSubmissionCalendar(calendarRaw, 365);

    const currentStreak = matchedUser.userCalendar?.streak ?? calcCurrentStreak;
    const totalActiveDays = matchedUser.userCalendar?.totalActiveDays ?? dailyContributions.filter((d) => d.count > 0).length;

    // Badges
    const badges: LeetCodeBadge[] = (matchedUser.badges || []).map((b) => ({
      id: b.id,
      displayName: b.displayName,
      icon: b.icon.startsWith('http') ? b.icon : `https://leetcode.com${b.icon}`,
      creationDate: b.creationDate,
    }));

    // Contest Stats & History
    const contestData = contestRes.data?.userContestRanking;
    const contestRating = contestData?.rating ? Math.round(contestData.rating) : null;
    const contestGlobalRanking = contestData?.globalRanking || null;
    const attendedContestsCount = contestData?.attendedContestsCount || 0;
    const topPercentage = contestData?.topPercentage ? Math.round(contestData.topPercentage * 10) / 10 : null;

    const contestHistoryRaw = contestRes.data?.userContestRankingHistory || [];
    const contestHistory: LeetCodeContestRecord[] = contestHistoryRaw
      .filter((c) => c.attended && typeof c.rating === 'number' && c.contest)
      .map((c) => ({
        contestTitle: c.contest?.title || 'Weekly Contest',
        rating: Math.round(c.rating || 0),
        ranking: c.ranking || 0,
        startTimeIso: c.contest?.startTime ? new Date(c.contest.startTime * 1000).toISOString() : new Date().toISOString(),
      }));

    // Languages (Top 6)
    const languageStats: LeetCodeLanguageStat[] = (
      skillsRes.data?.matchedUser?.languageProblemCount || []
    )
      .map((l) => ({ languageName: l.languageName, problemsSolved: l.problemsSolved }))
      .sort((a, b) => b.problemsSolved - a.problemsSolved)
      .slice(0, 6);

    // Topics / Tags (Top 8 combined from advanced, intermediate, fundamental)
    const rawTags = skillsRes.data?.matchedUser?.tagProblemCounts;
    const combinedTopicsMap = new Map<string, number>();

    if (rawTags) {
      const allTagLists = [rawTags.fundamental || [], rawTags.intermediate || [], rawTags.advanced || []];
      for (const list of allTagLists) {
        for (const item of list) {
          combinedTopicsMap.set(
            item.tagName,
            (combinedTopicsMap.get(item.tagName) || 0) + item.problemsSolved
          );
        }
      }
    }

    const topicStats: LeetCodeTopicStat[] = Array.from(combinedTopicsMap.entries())
      .map(([tagName, problemsSolved]) => ({ tagName, problemsSolved }))
      .sort((a, b) => b.problemsSolved - a.problemsSolved)
      .slice(0, 8);

    const summary: LeetCodeActivitySummary = {
      username: profile.username,
      profile,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      totalAvailable,
      acceptanceRate,
      currentStreak,
      longestStreak: calcLongestStreak,
      totalActiveDays,
      last30DaysCount,
      contestRating,
      contestGlobalRanking,
      attendedContestsCount,
      topPercentage,
      badges,
      difficultyStats,
      contestHistory,
      dailyContributions,
      languageStats,
      topicStats,
      recentSubmissions: recentAcRes.success && recentAcRes.data ? recentAcRes.data : [],
      syncedAt: new Date().toISOString(),
    };

    return { success: true, data: summary };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to query LeetCode activity summary.',
    };
  }
}
