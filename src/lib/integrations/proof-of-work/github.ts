/**
 * PACT Phase 5D: GitHub External Proof-of-Work Adapter
 * High-precision GitHub GraphQL and REST API integration.
 * Retrieves authoritative GitHub Contribution Calendars (weeks, contributionDays, levels, counts),
 * commit contributions, pull request contributions, and streaks.
 * Strict credential confidentiality: tokens are never exposed to client or logs.
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
  level: 0 | 1 | 2 | 3 | 4; // 0 = NONE, 1 = FIRST_QUARTILE, 2 = SECOND_QUARTILE, 3 = THIRD_QUARTILE, 4 = FOURTH_QUARTILE
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
  totalIssues?: number;
  restrictedContributionsCount?: number;
  dailyContributions: GitHubDailyContribution[];
  topRepositories: GitHubRepoContribution[];
  recentActivities: GitHubRecentActivity[];
  syncedAt: string;
  source: 'graphql' | 'public_calendar';
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
  const effectiveToken = token?.trim() || process.env.GITHUB_TOKEN?.trim() || process.env.GITHUB_PAT?.trim();
  if (effectiveToken) {
    headers.Authorization = `Bearer ${effectiveToken}`;
  }
  return headers;
}

/**
 * Maps GitHub GraphQL contributionLevel enum to integer 0..4
 */
export function mapGraphQLContributionLevel(
  level: string
): 0 | 1 | 2 | 3 | 4 {
  switch (level?.toUpperCase()) {
    case 'FOURTH_QUARTILE':
      return 4;
    case 'THIRD_QUARTILE':
      return 3;
    case 'SECOND_QUARTILE':
      return 2;
    case 'FIRST_QUARTILE':
      return 1;
    case 'NONE':
    default:
      return 0;
  }
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
 * Queries GitHub GraphQL API for the official contributionsCollection and contributionCalendar.
 */
export async function fetchGitHubContributionsGraphQL(
  username: string,
  token?: string | null,
  fromIso?: string,
  toIso?: string
): Promise<
  GitHubAdapterResult<{
    totalContributions: number;
    totalCommitContributions: number;
    totalPullRequestContributions: number;
    totalIssueContributions: number;
    restrictedContributionsCount: number;
    dailyContributions: GitHubDailyContribution[];
  }>
> {
  try {
    const cleanUser = username.trim().replace(/^@/, '');
    const effectiveToken = token?.trim() || process.env.GITHUB_TOKEN?.trim() || process.env.GITHUB_PAT?.trim();
    if (!effectiveToken) {
      return { success: false, error: 'GitHub authorization token required for GraphQL API.' };
    }

    const query = `
      query($login: String!, $from: DateTime, $to: DateTime) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            totalPullRequestContributions
            totalIssueContributions
            restrictedContributionsCount
            contributionCalendar {
              totalContributions
              weeks {
                firstDay
                contributionDays {
                  date
                  contributionCount
                  contributionLevel
                  weekday
                }
              }
            }
          }
        }
      }
    `;

    const variables: Record<string, unknown> = {
      login: cleanUser,
    };
    if (fromIso) variables.from = fromIso;
    if (toIso) variables.to = toIso;

    const res = await fetch(`${GITHUB_API_BASE}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildHeaders(effectiveToken),
      },
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 401) {
      return { success: false, isUnauthorized: true, error: 'GitHub token unauthorized or expired.' };
    }
    if (res.status === 403 || res.status === 429) {
      return { success: false, isRateLimited: true, error: 'GitHub GraphQL rate limit exceeded.' };
    }
    if (!res.ok) {
      return { success: false, error: `GitHub GraphQL error: HTTP ${res.status}` };
    }

    interface GraphQLResponse {
      data?: {
        user?: {
          contributionsCollection?: {
            totalCommitContributions: number;
            totalPullRequestContributions: number;
            totalIssueContributions: number;
            restrictedContributionsCount: number;
            contributionCalendar?: {
              totalContributions: number;
              weeks: Array<{
                firstDay: string;
                contributionDays: Array<{
                  date: string;
                  contributionCount: number;
                  contributionLevel: string;
                  weekday: number;
                }>;
              }>;
            };
          };
        } | null;
      };
      errors?: Array<{ message: string }>;
    }

    const json = (await res.json()) as GraphQLResponse;

    if (json.errors && json.errors.length > 0) {
      return { success: false, error: json.errors.map((e) => e.message).join('; ') };
    }

    const collection = json.data?.user?.contributionsCollection;
    if (!collection || !collection.contributionCalendar) {
      return { success: false, isNotFound: true, error: `No contribution calendar found for @${cleanUser}.` };
    }

    const dailyContributions: GitHubDailyContribution[] = [];
    const weeks = collection.contributionCalendar.weeks || [];

    for (const week of weeks) {
      for (const day of week.contributionDays) {
        dailyContributions.push({
          date: day.date,
          count: day.contributionCount,
          commitCount: 0, // In calendar, total count is definitive
          prCount: 0,
          level: mapGraphQLContributionLevel(day.contributionLevel),
        });
      }
    }

    // Sort chronologically ascending
    dailyContributions.sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      data: {
        totalContributions: collection.contributionCalendar.totalContributions,
        totalCommitContributions: collection.totalCommitContributions,
        totalPullRequestContributions: collection.totalPullRequestContributions,
        totalIssueContributions: collection.totalIssueContributions,
        restrictedContributionsCount: collection.restrictedContributionsCount,
        dailyContributions,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to query GitHub GraphQL contributions.',
    };
  }
}

/**
 * Scrapes the official public GitHub contribution calendar endpoint (https://github.com/users/{username}/contributions)
 * when no Personal Access Token is available.
 */
export async function fetchGitHubPublicContributionCalendar(
  username: string
): Promise<
  GitHubAdapterResult<{
    totalContributions: number;
    dailyContributions: GitHubDailyContribution[];
  }>
> {
  try {
    const cleanUser = username.trim().replace(/^@/, '');
    const url = `https://github.com/users/${encodeURIComponent(cleanUser)}/contributions`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PACT-Accountability-OS',
        Accept: 'text/html',
      },
    });

    if (res.status === 404) {
      return { success: false, isNotFound: true, error: `GitHub user @${cleanUser} not found.` };
    }
    if (res.status === 429) {
      return { success: false, isRateLimited: true, error: 'GitHub rate limit exceeded.' };
    }
    if (!res.ok) {
      return { success: false, error: `GitHub error: HTTP ${res.status}` };
    }

    const html = await res.text();
    const dayRegex = /<td[^>]*data-date="([0-9]{4}-[0-9]{2}-[0-9]{2})"[^>]*data-level="([0-4])"[^>]*>(?:[\s\S]*?<tool-tip[^>]*>([^<]+)<\/tool-tip>)?/g;
    let match: RegExpExecArray | null;
    const daysMap = new Map<string, GitHubDailyContribution>();

    while ((match = dayRegex.exec(html)) !== null) {
      const date = match[1];
      const level = (parseInt(match[2], 10) || 0) as 0 | 1 | 2 | 3 | 4;
      const tooltip = match[3] || '';
      let count = 0;
      const countMatch = tooltip.match(/^([0-9]+)\s+contribution/i);
      if (countMatch) {
        count = parseInt(countMatch[1], 10);
      } else if (tooltip.toLowerCase().includes('no contribution')) {
        count = 0;
      } else if (level > 0) {
        count = level;
      }

      daysMap.set(date, {
        date,
        count,
        commitCount: 0,
        prCount: 0,
        level,
      });
    }

    const dailyContributions = Array.from(daysMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const totalContributions = dailyContributions.reduce((sum, d) => sum + d.count, 0);

    return {
      success: true,
      data: {
        totalContributions,
        dailyContributions,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve public GitHub contribution calendar.',
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
 * Calculates current streak and longest streak from daily contribution history.
 */
export function calculateStreaksFromContributions(
  dailyContributions: GitHubDailyContribution[]
): { currentStreak: number; longestStreak: number } {
  if (!dailyContributions || dailyContributions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Ensure chronological order
  const sorted = [...dailyContributions].sort((a, b) => a.date.localeCompare(b.date));

  let longestStreak = 0;
  let runningStreak = 0;

  for (const day of sorted) {
    if (day.count > 0) {
      runningStreak += 1;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  // Calculate current streak backward from today
  let currentStreak = 0;
  const reversed = [...sorted].reverse();

  // If latest day has 0 contributions, allow 1 grace day (yesterday)
  let startIndex = 0;
  if (
    reversed.length > 0 &&
    reversed[0].count === 0 &&
    reversed.length > 1 &&
    reversed[1].count > 0
  ) {
    startIndex = 1;
  }

  for (let i = startIndex; i < reversed.length; i++) {
    if (reversed[i].count > 0) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak };
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
 * Fetches and aggregates complete authoritative GitHub activity summary for the specified user.
 * Prioritizes GitHub's GraphQL API (with user token or server token), and falls back seamlessly
 * to the official public contribution calendar scraper + public event streams.
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

    let totalContributions = 0;
    let totalCommits = 0;
    let totalPRs = 0;
    let totalIssues = 0;
    let restrictedContributionsCount = 0;
    let dailyContributions: GitHubDailyContribution[] = [];
    let dataSource: 'graphql' | 'public_calendar' = 'public_calendar';

    // 1. Try GraphQL if token is available
    const hasToken = Boolean(
      token?.trim() || process.env.GITHUB_TOKEN?.trim() || process.env.GITHUB_PAT?.trim()
    );

    if (hasToken && !fetcherOverrides) {
      const gqlRes = await fetchGitHubContributionsGraphQL(
        cleanUser,
        token,
        sinceIso,
        now.toISOString()
      );

      if (gqlRes.success && gqlRes.data) {
        totalContributions = gqlRes.data.totalContributions;
        totalCommits = gqlRes.data.totalCommitContributions;
        totalPRs = gqlRes.data.totalPullRequestContributions;
        totalIssues = gqlRes.data.totalIssueContributions;
        restrictedContributionsCount = gqlRes.data.restrictedContributionsCount;
        dailyContributions = gqlRes.data.dailyContributions;
        dataSource = 'graphql';
      }
    }

    // 2. Fallback to public contribution calendar scraper if GraphQL wasn't used or failed
    if (dailyContributions.length === 0 && !fetcherOverrides) {
      const pubRes = await fetchGitHubPublicContributionCalendar(cleanUser);
      if (pubRes.success && pubRes.data && pubRes.data.dailyContributions.length > 0) {
        dailyContributions = pubRes.data.dailyContributions;
        totalContributions = pubRes.data.totalContributions;
        dataSource = 'public_calendar';
      }
    }

    // 3. Fetch recent events and repository breakdowns for rich contextual activity
    let eventCommits: GitHubCommitItem[] = [];
    let searchCommits: GitHubCommitItem[] = [];
    let prs: GitHubPullRequestItem[] = [];

    if (fetcherOverrides?.commits) {
      const cRes = await fetcherOverrides.commits(cleanUser, token);
      if (cRes.success && cRes.data) eventCommits = cRes.data;
    } else {
      const [eventsRes, searchCommitsRes] = await Promise.all([
        fetchGitHubPublicUserCommits(cleanUser, token),
        fetchGitHubSearchCommits(cleanUser, sinceIso, undefined, token),
      ]);
      eventCommits = eventsRes.success && eventsRes.data ? eventsRes.data : [];
      searchCommits = searchCommitsRes.success && searchCommitsRes.data ? searchCommitsRes.data : [];
    }

    if (fetcherOverrides?.pullRequests) {
      const pRes = await fetcherOverrides.pullRequests(cleanUser, sinceIso, token);
      if (pRes.success && pRes.data) prs = pRes.data;
    } else {
      const prsRes = await fetchGitHubPullRequests(cleanUser, sinceIso, undefined, undefined, token);
      prs = prsRes.success && prsRes.data ? prsRes.data : [];
    }

    // Deduplicate commits by SHA
    const commitMap = new Map<string, GitHubCommitItem>();
    for (const c of [...eventCommits, ...searchCommits]) {
      if (c.sha && !commitMap.has(c.sha)) {
        commitMap.set(c.sha, c);
      }
    }
    const rawCommits = Array.from(commitMap.values());

    // If totalCommits wasn't set by GraphQL, use searched commit count or events count
    if (totalCommits === 0) {
      totalCommits = rawCommits.length;
    }
    if (totalPRs === 0) {
      totalPRs = prs.length;
    }

    // 4. If daily contributions weren't fetched from GraphQL/calendar, build from commit & PR events
    if (dailyContributions.length === 0) {
      const dailyMap = new Map<string, { count: number; commitCount: number; prCount: number }>();
      const d = new Date(startDate);
      while (d <= now) {
        const dateStr = d.toISOString().split('T')[0];
        dailyMap.set(dateStr, { count: 0, commitCount: 0, prCount: 0 });
        d.setUTCDate(d.getUTCDate() + 1);
      }
      const todayStr = now.toISOString().split('T')[0];
      if (!dailyMap.has(todayStr)) {
        dailyMap.set(todayStr, { count: 0, commitCount: 0, prCount: 0 });
      }

      for (const c of rawCommits) {
        const dateStr = c.authorDate.split('T')[0];
        const entry = dailyMap.get(dateStr);
        if (entry) {
          entry.count += 1;
          entry.commitCount += 1;
        }
      }

      for (const pr of prs) {
        const dateStr = pr.createdAt.split('T')[0];
        const entry = dailyMap.get(dateStr);
        if (entry) {
          entry.count += 1;
          entry.prCount += 1;
        }
      }

      dailyContributions = Array.from(dailyMap.entries())
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
    } else {
      // Enrich calendar entries with commit/pr breakdown where available
      const dayMap = new Map<string, GitHubDailyContribution>();
      for (const d of dailyContributions) {
        dayMap.set(d.date, d);
      }
      for (const c of rawCommits) {
        const dateStr = c.authorDate.split('T')[0];
        const entry = dayMap.get(dateStr);
        if (entry) {
          entry.commitCount = (entry.commitCount || 0) + 1;
        }
      }
      for (const pr of prs) {
        const dateStr = pr.createdAt.split('T')[0];
        const entry = dayMap.get(dateStr);
        if (entry) {
          entry.prCount = (entry.prCount || 0) + 1;
        }
      }
    }

    // 5. Build repository breakdown and recent activities
    const repoMap = new Map<string, { commitCount: number; prCount: number; totalCount: number }>();
    const recentActivities: GitHubRecentActivity[] = [];

    for (const c of rawCommits) {
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

    for (const pr of prs) {
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

    // 6. Calculate window metrics (7-day, 30-day, streaks)
    let last7DaysCount = 0;
    let last30DaysCount = 0;
    const sevenDaysAgoStr = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const thirtyDaysAgoStr = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];

    for (const day of dailyContributions) {
      if (day.date >= sevenDaysAgoStr) {
        last7DaysCount += day.count;
      }
      if (day.date >= thirtyDaysAgoStr) {
        last30DaysCount += day.count;
      }
    }

    const { currentStreak, longestStreak } = calculateStreaksFromContributions(dailyContributions);

    if (totalContributions === 0 || fetcherOverrides) {
      totalContributions = dailyContributions.reduce((sum, d) => sum + d.count, 0);
    }
    if (fetcherOverrides) {
      totalCommits = rawCommits.length;
      totalPRs = prs.length;
    }

    // Sort recent activities and top repositories
    recentActivities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

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
        totalCommits,
        totalPRs,
        totalIssues,
        restrictedContributionsCount,
        dailyContributions,
        topRepositories,
        recentActivities: recentActivities.slice(0, 15),
        syncedAt: now.toISOString(),
        source: dataSource,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to compile GitHub activity summary.',
    };
  }
}
