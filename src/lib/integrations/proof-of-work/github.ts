/**
 * PACT Phase 5D: GitHub External Proof-of-Work Adapter
 * Pure REST API v3 client for querying GitHub commits, pull requests, and events.
 * Strict credential confidentiality: tokens are never logged or exposed.
 */

export interface GitHubCommitItem {
  sha: string;
  authorLogin: string;
  authorDate: string; // ISO 8601 UTC
  message: string;
  repository?: string;
}

export interface GitHubPullRequestItem {
  id: number;
  number: number;
  title: string;
  authorLogin: string;
  createdAt: string; // ISO 8601 UTC
  htmlUrl: string;
  repository?: string;
}

export interface GitHubDailyContribution {
  date: string; // YYYY-MM-DD
  count: number;
  commitCount: number;
  prCount: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = 0, 1 = 1-2, 2 = 3-5, 3 = 6-9, 4 = 10+
}

export interface GitHubRecentActivity {
  id: string;
  type: 'commit' | 'pull_request';
  title: string;
  repository: string;
  timestamp: string; // ISO 8601 UTC
  url?: string;
}

export interface GitHubRepoContribution {
  name: string;
  commitCount: number;
  prCount: number;
  totalCount: number;
}

export interface GitHubActivitySummary {
  username: string;
  totalContributions: number;
  last7DaysCount: number;
  last30DaysCount: number;
  currentStreak: number;
  longestStreak: number;
  totalCommits: number;
  totalPRs: number;
  dailyContributions: GitHubDailyContribution[];
  topRepositories: GitHubRepoContribution[];
  recentActivities: GitHubRecentActivity[];
  syncedAt: string;
}

export interface GitHubAdapterResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  isRateLimited?: boolean;
  isUnauthorized?: boolean;
  isNotFound?: boolean;
}

const GITHUB_API_BASE = 'https://api.github.com';

function buildHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'PACT-Accountability-OS',
  };
  if (token && token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return headers;
}

/**
 * Verifies that a GitHub user exists and returns normalized handle.
 */
export async function verifyGitHubUser(
  username: string,
  token?: string | null
): Promise<GitHubAdapterResult<{ username: string; id: number; name: string | null }>> {
  try {
    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) {
      return { success: false, error: 'GitHub username is required.' };
    }

    const res = await fetch(`${GITHUB_API_BASE}/users/${encodeURIComponent(cleanUsername)}`, {
      headers: buildHeaders(token),
    });

    if (res.status === 404) {
      return { success: false, isNotFound: true, error: `GitHub user @${cleanUsername} not found.` };
    }
    if (res.status === 401) {
      return { success: false, isUnauthorized: true, error: 'Invalid or revoked GitHub authorization token.' };
    }
    if (res.status === 403 || res.status === 429) {
      return { success: false, isRateLimited: true, error: 'GitHub API rate limit exceeded. Please try again later.' };
    }
    if (!res.ok) {
      return { success: false, error: `GitHub API error: HTTP ${res.status}` };
    }

    const json = (await res.json()) as { login: string; id: number; name?: string | null };
    return {
      success: true,
      data: {
        username: json.login,
        id: json.id,
        name: json.name || null,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error communicating with GitHub.',
    };
  }
}

/**
 * Fetches commits authored by a user for a specific repository within a time window.
 */
export async function fetchGitHubRepoCommits(
  owner: string,
  repo: string,
  author: string,
  sinceIso?: string,
  untilIso?: string,
  token?: string | null
): Promise<GitHubAdapterResult<GitHubCommitItem[]>> {
  try {
    const cleanAuthor = author.trim().replace(/^@/, '');
    const params = new URLSearchParams({
      author: cleanAuthor,
      per_page: '100',
    });
    if (sinceIso) params.set('since', sinceIso);
    if (untilIso) params.set('until', untilIso);

    const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?${params.toString()}`;
    const res = await fetch(url, { headers: buildHeaders(token) });

    if (res.status === 404) {
      return { success: false, isNotFound: true, error: `Repository ${owner}/${repo} not found or access denied.` };
    }
    if (res.status === 401) {
      return { success: false, isUnauthorized: true, error: 'GitHub token is invalid or unauthorized.' };
    }
    if (res.status === 403 || res.status === 429) {
      return { success: false, isRateLimited: true, error: 'GitHub rate limit exceeded.' };
    }
    if (!res.ok) {
      return { success: false, error: `GitHub error: HTTP ${res.status}` };
    }

    const list = (await res.json()) as Array<{
      sha: string;
      commit: {
        author: { name: string; date: string };
        message: string;
      };
      author?: { login: string } | null;
    }>;

    const items: GitHubCommitItem[] = list.map((c) => ({
      sha: c.sha,
      authorLogin: c.author?.login || cleanAuthor,
      authorDate: c.commit.author.date,
      message: c.commit.message?.split('\n')[0] || '(No message)',
      repository: `${owner}/${repo}`,
    }));

    return { success: true, data: items };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch repository commits from GitHub.',
    };
  }
}

/**
 * Fetches recent public push events for a user across all repositories.
 */
export async function fetchGitHubPublicUserCommits(
  username: string,
  token?: string | null
): Promise<GitHubAdapterResult<GitHubCommitItem[]>> {
  try {
    const cleanUser = username.trim().replace(/^@/, '');
    const url = `${GITHUB_API_BASE}/users/${encodeURIComponent(cleanUser)}/events/public?per_page=100`;
    const res = await fetch(url, { headers: buildHeaders(token) });

    if (res.status === 404) {
      return { success: false, isNotFound: true, error: `User @${cleanUser} not found.` };
    }
    if (res.status === 401) {
      return { success: false, isUnauthorized: true, error: 'GitHub token unauthorized.' };
    }
    if (res.status === 403 || res.status === 429) {
      return { success: false, isRateLimited: true, error: 'GitHub rate limit exceeded.' };
    }
    if (!res.ok) {
      return { success: false, error: `GitHub API error: HTTP ${res.status}` };
    }

    const events = (await res.json()) as Array<{
      id: string;
      type: string;
      created_at: string;
      repo: { name: string };
      payload?: {
        commits?: Array<{ sha: string; message: string }>;
      };
    }>;

    const commitItems: GitHubCommitItem[] = [];
    for (const evt of events) {
      if (evt.type === 'PushEvent' && evt.payload?.commits) {
        for (const c of evt.payload.commits) {
          commitItems.push({
            sha: c.sha,
            authorLogin: cleanUser,
            authorDate: evt.created_at,
            message: c.message?.split('\n')[0] || '(No message)',
            repository: evt.repo.name,
          });
        }
      }
    }

    return { success: true, data: commitItems };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch public user events from GitHub.',
    };
  }
}

/**
 * Searches commits authored by a user within a time window across repositories.
 */
export async function fetchGitHubSearchCommits(
  author: string,
  sinceIso?: string,
  untilIso?: string,
  token?: string | null
): Promise<GitHubAdapterResult<GitHubCommitItem[]>> {
  try {
    const cleanAuthor = author.trim().replace(/^@/, '');
    let query = `author:${cleanAuthor}`;
    if (sinceIso && untilIso) {
      query += ` author-date:${sinceIso.split('T')[0]}..${untilIso.split('T')[0]}`;
    } else if (sinceIso) {
      query += ` author-date:>=${sinceIso.split('T')[0]}`;
    }

    const url = `${GITHUB_API_BASE}/search/commits?q=${encodeURIComponent(query)}&sort=author-date&order=desc&per_page=100`;
    const res = await fetch(url, {
      headers: {
        ...buildHeaders(token),
        Accept: 'application/vnd.github.cloak-preview+json, application/vnd.github.v3+json',
      },
    });

    if (res.status === 403 || res.status === 429) {
      return { success: false, isRateLimited: true, error: 'GitHub rate limit exceeded.' };
    }
    if (!res.ok) {
      return { success: false, error: `GitHub Search error: HTTP ${res.status}` };
    }

    const data = (await res.json()) as {
      items?: Array<{
        sha: string;
        commit: {
          author: { name: string; date: string };
          message: string;
        };
        author?: { login: string } | null;
        repository?: { full_name: string };
      }>;
    };

    const items: GitHubCommitItem[] = (data.items || []).map((c) => ({
      sha: c.sha,
      authorLogin: c.author?.login || cleanAuthor,
      authorDate: c.commit.author.date,
      message: c.commit.message?.split('\n')[0] || '(No message)',
      repository: c.repository?.full_name,
    }));

    return { success: true, data: items };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to search GitHub commits.',
    };
  }
}

/**
 * Fetches pull requests created by author.
 */
export async function fetchGitHubPullRequests(
  author: string,
  sinceIso?: string,
  untilIso?: string,
  repository?: string,
  token?: string | null
): Promise<GitHubAdapterResult<GitHubPullRequestItem[]>> {
  try {
    const cleanAuthor = author.trim().replace(/^@/, '');
    let query = `type:pr author:${cleanAuthor}`;
    if (repository) {
      query += ` repo:${repository}`;
    }
    if (sinceIso && untilIso) {
      query += ` created:${sinceIso.split('T')[0]}..${untilIso.split('T')[0]}`;
    } else if (sinceIso) {
      query += ` created:>=${sinceIso.split('T')[0]}`;
    }

    const url = `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(query)}&per_page=100`;
    const res = await fetch(url, { headers: buildHeaders(token) });

    if (res.status === 403 || res.status === 429) {
      return { success: false, isRateLimited: true, error: 'GitHub rate limit exceeded.' };
    }
    if (!res.ok) {
      return { success: false, error: `GitHub Search error: HTTP ${res.status}` };
    }

    const data = (await res.json()) as {
      items: Array<{
        id: number;
        number: number;
        title: string;
        user: { login: string };
        created_at: string;
        html_url: string;
        repository_url?: string;
      }>;
    };

    const prs: GitHubPullRequestItem[] = data.items.map((i) => {
      let repoName: string | undefined = undefined;
      if (i.repository_url) {
        const parts = i.repository_url.split('/');
        repoName = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
      }
      return {
        id: i.id,
        number: i.number,
        title: i.title,
        authorLogin: i.user.login,
        createdAt: i.created_at,
        htmlUrl: i.html_url,
        repository: repoName,
      };
    });

    return { success: true, data: prs };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to search GitHub pull requests.',
    };
  }
}

/**
 * Fetches and aggregates complete GitHub activity summary for the specified user.
 * Generates daily contribution counts, heatmap levels, streaks, repository breakdown, and recent activity.
 */
export async function fetchGitHubActivitySummary(
  username: string,
  token?: string | null,
  daysBack: number = 365,
  fetcherOverrides?: {
    commits?: (user: string, token?: string | null) => Promise<GitHubAdapterResult<GitHubCommitItem[]>>;
    pullRequests?: (user: string, sinceIso: string, token?: string | null) => Promise<GitHubAdapterResult<GitHubPullRequestItem[]>>;
  }
): Promise<GitHubAdapterResult<GitHubActivitySummary>> {
  try {
    const cleanUser = username.trim().replace(/^@/, '');
    if (!cleanUser) {
      return { success: false, error: 'GitHub username is required.' };
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() - daysBack);
    const sinceIso = startDate.toISOString();

    // 1. Fetch public/authenticated commits and PRs in parallel
    let rawCommits: GitHubCommitItem[] = [];
    let prs: GitHubPullRequestItem[] = [];

    if (fetcherOverrides?.commits) {
      const cRes = await fetcherOverrides.commits(cleanUser, token);
      if (cRes.success && cRes.data) rawCommits = cRes.data;
    } else {
      const [eventsRes, searchRes] = await Promise.all([
        fetchGitHubPublicUserCommits(cleanUser, token),
        fetchGitHubSearchCommits(cleanUser, sinceIso, undefined, token),
      ]);
      const eventCommits = eventsRes.success && eventsRes.data ? eventsRes.data : [];
      const searchCommits = searchRes.success && searchRes.data ? searchRes.data : [];

      const commitMap = new Map<string, GitHubCommitItem>();
      for (const c of [...eventCommits, ...searchCommits]) {
        if (c.sha && !commitMap.has(c.sha)) {
          commitMap.set(c.sha, c);
        }
      }
      rawCommits = Array.from(commitMap.values());
    }

    if (fetcherOverrides?.pullRequests) {
      const pRes = await fetcherOverrides.pullRequests(cleanUser, sinceIso, token);
      if (pRes.success && pRes.data) prs = pRes.data;
    } else {
      const pRes = await fetchGitHubPullRequests(cleanUser, sinceIso, undefined, undefined, token);
      if (pRes.success && pRes.data) prs = pRes.data;
    }

    const commits = rawCommits;

    // 2. Build complete daily calendar array from startDate to today
    const dailyMap = new Map<string, { count: number; commitCount: number; prCount: number }>();
    const d = new Date(startDate);
    while (d <= now) {
      const dateStr = d.toISOString().split('T')[0];
      dailyMap.set(dateStr, { count: 0, commitCount: 0, prCount: 0 });
      d.setUTCDate(d.getUTCDate() + 1);
    }

    // Ensure today's date is in the map
    const todayStr = now.toISOString().split('T')[0];
    if (!dailyMap.has(todayStr)) {
      dailyMap.set(todayStr, { count: 0, commitCount: 0, prCount: 0 });
    }

    const repoMap = new Map<string, { commitCount: number; prCount: number; totalCount: number }>();
    const recentActivities: GitHubRecentActivity[] = [];

    // 3. Aggregate commits
    for (const c of commits) {
      const dateStr = c.authorDate.split('T')[0];
      const entry = dailyMap.get(dateStr);
      if (entry) {
        entry.count += 1;
        entry.commitCount += 1;
      }

      const repo = c.repository || 'Uncategorized';
      const repoEntry = repoMap.get(repo) || { commitCount: 0, prCount: 0, totalCount: 0 };
      repoEntry.commitCount += 1;
      repoEntry.totalCount += 1;
      repoMap.set(repo, repoEntry);

      recentActivities.push({
        id: `commit_${c.sha}`,
        type: 'commit',
        title: c.message,
        repository: repo,
        timestamp: c.authorDate,
        url: `https://github.com/${repo}/commit/${c.sha}`,
      });
    }

    // 4. Aggregate pull requests
    for (const pr of prs) {
      const dateStr = pr.createdAt.split('T')[0];
      const entry = dailyMap.get(dateStr);
      if (entry) {
        entry.count += 1;
        entry.prCount += 1;
      }

      const repo = pr.repository || 'Uncategorized';
      const repoEntry = repoMap.get(repo) || { commitCount: 0, prCount: 0, totalCount: 0 };
      repoEntry.prCount += 1;
      repoEntry.totalCount += 1;
      repoMap.set(repo, repoEntry);

      recentActivities.push({
        id: `pr_${pr.id || pr.number}`,
        type: 'pull_request',
        title: `#${pr.number}: ${pr.title}`,
        repository: repo,
        timestamp: pr.createdAt,
        url: pr.htmlUrl,
      });
    }

    // 5. Convert daily map to sorted contributions list and calculate levels
    const dailyContributions: GitHubDailyContribution[] = Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, stats]) => {
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (stats.count >= 10) level = 4;
        else if (stats.count >= 6) level = 3;
        else if (stats.count >= 3) level = 2;
        else if (stats.count >= 1) level = 1;

        return {
          date,
          count: stats.count,
          commitCount: stats.commitCount,
          prCount: stats.prCount,
          level,
        };
      });

    // 6. Calculate 7-day, 30-day, total, and streak metrics
    let totalContributions = 0;
    let last7DaysCount = 0;
    let last30DaysCount = 0;
    const sevenDaysAgoStr = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const thirtyDaysAgoStr = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];

    for (const day of dailyContributions) {
      totalContributions += day.count;
      if (day.date >= sevenDaysAgoStr) {
        last7DaysCount += day.count;
      }
      if (day.date >= thirtyDaysAgoStr) {
        last30DaysCount += day.count;
      }
    }

    // Calculate streaks
    let longestStreak = 0;
    let runningStreak = 0;
    for (const day of dailyContributions) {
      if (day.count > 0) {
        runningStreak += 1;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    }

    // Current streak (evaluating from latest date backward)
    let currentStreak = 0;
    const reversedDays = [...dailyContributions].reverse();
    // If today has activity, start from today; if today is 0 but yesterday had activity, start from yesterday
    let startIndex = 0;
    if (reversedDays.length > 0 && reversedDays[0].count === 0 && reversedDays.length > 1 && reversedDays[1].count > 0) {
      startIndex = 1;
    }

    for (let i = startIndex; i < reversedDays.length; i++) {
      if (reversedDays[i].count > 0) {
        currentStreak += 1;
      } else {
        break;
      }
    }

    // 7. Sort recent activities and top repositories
    recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const topRepositories: GitHubRepoContribution[] = Array.from(repoMap.entries())
      .map(([name, stats]) => ({
        name,
        commitCount: stats.commitCount,
        prCount: stats.prCount,
        totalCount: stats.totalCount,
      }))
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 8);

    return {
      success: true,
      data: {
        username: cleanUser,
        totalContributions,
        last7DaysCount,
        last30DaysCount,
        currentStreak,
        longestStreak,
        totalCommits: commits.length,
        totalPRs: prs.length,
        dailyContributions,
        topRepositories,
        recentActivities: recentActivities.slice(0, 15),
        syncedAt: now.toISOString(),
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to compile GitHub activity summary.',
    };
  }
}
