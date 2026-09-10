/**
 * PACT Phase 5D: LeetCode External Proof-of-Work Adapter
 * Pure GraphQL client for verifying public LeetCode profiles and recent accepted submissions.
 * Zero password storage: relies strictly on verifiable public submissions.
 */

export interface LeetCodeSubmissionItem {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string; // ISO 8601 UTC
}

export interface LeetCodeAdapterResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  isNotFound?: boolean;
  isRateLimited?: boolean;
}

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

const RECENT_AC_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
    }
    matchedUser(username: $username) {
      username
      profile {
        realName
        ranking
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
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
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      return { success: false, error: 'LeetCode username is required.' };
    }

    const res = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PACT-OS/1.0',
        Referer: 'https://leetcode.com',
      },
      body: JSON.stringify({
        query: `query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              realName
              ranking
            }
          }
        }`,
        variables: { username: cleanUsername },
      }),
    });

    if (res.status === 429) {
      return { success: false, isRateLimited: true, error: 'LeetCode rate limit reached. Please retry in a few moments.' };
    }
    if (!res.ok) {
      return { success: false, error: `LeetCode GraphQL error: HTTP ${res.status}` };
    }

    const json = (await res.json()) as {
      data?: {
        matchedUser?: {
          username: string;
          profile?: {
            realName?: string | null;
            ranking?: number | null;
          } | null;
        } | null;
      };
      errors?: Array<{ message: string }>;
    };

    if (!json.data?.matchedUser) {
      return { success: false, isNotFound: true, error: `LeetCode profile "${cleanUsername}" was not found.` };
    }

    return {
      success: true,
      data: {
        username: json.data.matchedUser.username,
        realName: json.data.matchedUser.profile?.realName || null,
        ranking: json.data.matchedUser.profile?.ranking || null,
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
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      return { success: false, error: 'LeetCode username is required.' };
    }

    const boundedLimit = Math.min(Math.max(limit, 1), 50);

    const res = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PACT-OS/1.0',
        Referer: 'https://leetcode.com',
      },
      body: JSON.stringify({
        query: RECENT_AC_QUERY,
        variables: { username: cleanUsername, limit: boundedLimit },
      }),
    });

    if (res.status === 429) {
      return { success: false, isRateLimited: true, error: 'LeetCode rate limit reached.' };
    }
    if (!res.ok) {
      return { success: false, error: `LeetCode error: HTTP ${res.status}` };
    }

    const json = (await res.json()) as {
      data?: {
        recentAcSubmissionList?: Array<{
          id?: string;
          title: string;
          titleSlug: string;
          timestamp: string | number;
        }>;
        matchedUser?: {
          username: string;
        } | null;
      };
    };

    if (!json.data?.matchedUser && !json.data?.recentAcSubmissionList) {
      return { success: false, isNotFound: true, error: `LeetCode user "${cleanUsername}" not found.` };
    }

    const rawList = json.data.recentAcSubmissionList || [];
    const items: LeetCodeSubmissionItem[] = rawList.map((item, idx) => {
      // timestamp is epoch seconds
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
