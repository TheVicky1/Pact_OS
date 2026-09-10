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
