/**
 * PACT Phase 5D: Codeforces External Proof-of-Work Adapter
 * Official REST API client for querying Codeforces handle info and submissions.
 * Zero password storage: relies strictly on verifiable public submissions.
 */

export interface CodeforcesSubmissionItem {
  id: number;
  contestId?: number;
  creationTimeIso: string; // ISO 8601 UTC
  problemName: string;
  problemIndex: string;
  rating?: number;
  verdict: string; // 'OK', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', etc.
  passedTestCount: number;
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

/**
 * Verifies that a Codeforces handle exists publicly.
 */
export async function verifyCodeforcesUser(
  handle: string
): Promise<CodeforcesAdapterResult<{ handle: string; rating?: number; rank?: string }>> {
  try {
    const cleanHandle = handle.trim();
    if (!cleanHandle) {
      return { success: false, error: 'Codeforces handle is required.' };
    }

    const res = await fetch(`${CODEFORCES_API_BASE}/user.info?handles=${encodeURIComponent(cleanHandle)}`, {
      headers: {
        'User-Agent': 'PACT-Accountability-OS',
      },
    });

    if (res.status === 503 || res.status === 502) {
      return { success: false, isUnavailable: true, error: 'Codeforces API is currently unavailable.' };
    }
    if (res.status === 429) {
      return { success: false, isRateLimited: true, error: 'Codeforces rate limit exceeded.' };
    }

    const json = (await res.json()) as {
      status: string;
      comment?: string;
      result?: Array<{ handle: string; rating?: number; rank?: string }>;
    };

    if (json.status !== 'OK' || !json.result || json.result.length === 0) {
      return {
        success: false,
        isNotFound: true,
        error: json.comment || `Codeforces handle "${cleanHandle}" not found.`,
      };
    }

    const user = json.result[0];
    return {
      success: true,
      data: {
        handle: user.handle,
        rating: user.rating,
        rank: user.rank,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error connecting to Codeforces.',
    };
  }
}

/**
 * Fetches recent submissions for a Codeforces handle.
 */
export async function fetchCodeforcesSubmissions(
  handle: string,
  count: number = 50
): Promise<CodeforcesAdapterResult<CodeforcesSubmissionItem[]>> {
  try {
    const cleanHandle = handle.trim();
    if (!cleanHandle) {
      return { success: false, error: 'Codeforces handle is required.' };
    }

    const boundedCount = Math.min(Math.max(count, 1), 100);

    const url = `${CODEFORCES_API_BASE}/user.status?handle=${encodeURIComponent(cleanHandle)}&from=1&count=${boundedCount}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PACT-Accountability-OS',
      },
    });

    if (res.status === 503 || res.status === 502) {
      return { success: false, isUnavailable: true, error: 'Codeforces API is currently unavailable.' };
    }
    if (res.status === 429) {
      return { success: false, isRateLimited: true, error: 'Codeforces rate limit exceeded.' };
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
        };
        verdict: string;
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
      contestId: sub.contestId,
      creationTimeIso: new Date(sub.creationTimeSeconds * 1000).toISOString(),
      problemName: sub.problem.name,
      problemIndex: sub.problem.index,
      rating: sub.problem.rating,
      verdict: sub.verdict,
      passedTestCount: sub.passedTestCount,
    }));

    return { success: true, data: items };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to query Codeforces submissions.',
    };
  }
}
