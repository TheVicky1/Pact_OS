# PACT — Integration Architecture & External Connectors

This document specifies the architecture, credential lifecycle, rate-limiting, and verification strategies for PACT's external integrations.

---

## 1. Supported Integration Connectors

| Connector | Status | Integration Type | Use Case & Scope |
| :--- | :--- | :--- | :--- |
| **Google Calendar** | `IMPLEMENTED` | OAuth 2.0 (Bi-directional) | Synchronize time-blocks, import external calendar events, detect schedule conflicts, and push task blocks. |
| **GitHub** | `IMPLEMENTED` | REST API / Webhooks | Verify real commit activity, merged pull requests, and contribution counts for developer commitments. |
| **LeetCode** | `IMPLEMENTED` | Public GraphQL API | Verify daily problem completions and submission counts without requiring user password storage. |
| **Codeforces** | `IMPLEMENTED` | Official REST API | Verify contest participation, rating changes, and problem submissions against public handles. |
| **WakaTime** | `IMPLEMENTED` | REST API Telemetry | Verify active editor coding session time, project durations, and programming languages. |

---

## 2. Core Integration Guarantees

1. **Fully Optional**: Users may connect 0, 1, or all integrations. The core operating system functionality is 100% independent of external connectors.
2. **Fail-Safe Third-Party Fault Tolerance**: If an external provider API suffers an outage, network timeout, or HTTP 429/500 response, PACT marks the proof evaluation as `RETRY_PENDING`. **User commitments are never failed due to third-party outages.**
3. **Zero Plaintext Token Exposure**: OAuth refresh and access tokens are encrypted before storage and strictly isolated to server-side background handlers. Client UIs receive only connection state booleans.

---

## 3. Connector Deep Dives

### 3.1 Google Calendar Connector
- **OAuth Scope**: `https://www.googleapis.com/auth/calendar.events`
- **Token Storage**: `user_integrations` table with automated token refresh when access tokens expire.
- **Bi-directional Sync**:
  - PACT time-blocked tasks push to the user's selected PACT secondary calendar.
  - External events pull into the `/app/planner` view to highlight scheduling conflicts.

### 3.2 GitHub Proof Connector
- **Proof Types**: `commit_count`, `merged_pr`, `repository_push`.
- **Evaluation Mechanism**: Queries the GitHub REST API (`/users/{username}/events`) for events timestamped within the commitment start and deadline window.
- **Validation**: Verifies author email or username against the verified user identity.

### 3.3 LeetCode Proof Connector
- **Proof Types**: `daily_problem_completion`, `submission_count`.
- **Evaluation Mechanism**: Uses LeetCode's public GraphQL endpoint (`https://leetcode.com/graphql`) querying `recentSubmissionList` and `userProfileUserQuestionProgress`.
- **Zero Credentials**: Requires only the public LeetCode username; no passwords or session cookies are requested.
- **Example API Payload**:
  ```json
  {
    "data": {
      "recentSubmissionList": [
        {
          "title": "Two Sum",
          "titleSlug": "two-sum",
          "timestamp": "1726272000",
          "statusDisplay": "Accepted",
          "lang": "typescript"
        }
      ]
    }
  }
  ```

### 3.4 Codeforces Proof Connector
- **Proof Types**: `problem_verdict_ok`, `contest_participation`.
- **Evaluation Mechanism**: Queries official Codeforces API (`https://codeforces.com/api/user.status?handle={handle}`).
- **Zero Credentials**: Validated against public user handle and submission timestamps.

### 3.5 WakaTime Proof Connector
- **Proof Types**: `wakatime_time`, `project_time`, `language_time`.
- **Evaluation Mechanism**: Queries WakaTime summaries API (`https://wakatime.com/api/v1/users/{user}/summaries`) for active coding durations within commitment windows.
- **Filtering**: Supports project-specific, branch-specific, and language-specific coding time criteria.

---

## 4. Google OAuth Authentication Broker Flow

PACT integrates Google OAuth for seamless single-sign-on using **Supabase Auth as the OAuth broker**:

```
PACT Client (/ -> UnifiedAuthCard)
  │  1. Initiate OAuth (`supabase.auth.signInWithOAuth({ provider: 'google' })`)
  ▼
Supabase Auth Broker (https://xptrzmftirlzhbmkdqvy.supabase.co)
  │  2. Redirect to Google Consent Screen
  ▼
Google Cloud Auth (Client ID configured in Supabase)
  │  3. User consents -> Google returns code to Supabase
  ▼
Supabase Auth Server (/auth/v1/callback)
  │  4. PKCE code exchange -> Issues PACT JWT session
  ▼
PACT Callback Route (/auth/callback?code=...)
  │  5. Validates redirect safety -> Sets HttpOnly session cookies
  ▼
Redirects Authenticated User to /app
```

### Security & Sanitization
- **Open Redirect Protection**: `validateSafeRedirect()` rejects external URLs, allowing only internal relative routes (`/app`, `/app/settings`).
- **Profile Convergence**: Database trigger `on_auth_user_created` automatically creates the corresponding `public.profiles` row upon first login.
