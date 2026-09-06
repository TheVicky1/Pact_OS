# PACT — Integration Architecture & External Connectors

## 1. Optional Integrations Framework [CONFIRMED]

PACT supports optional sync integration connectors for developer and problem-solving platforms:
1. **GitHub**: Repository commits, pull request submissions, issue resolutions, contribution activity.
2. **Codeforces**: Problem submission history, contest rating updates, solved difficulty metrics.
3. **LeetCode**: Daily streak completion, total solved counts, problem category breakdown.

---

## 2. Core Architectural Guarantees [CONFIRMED]

### Fully Modular & Optional
- Connectors are strictly decoupled from core application state.
- A user may connect **0, 1, 2, or all 3 integrations**.
- The core PACT application must execute seamlessly without any active integration.

---

## 3. Credential & Token Security Specification [PROPOSED]

> [!CAUTION]
> Third-party access tokens and OAuth secrets must **NEVER** be stored in plaintext in the database or exposed to the client frontend.

### Security Lifecycle Breakdown [PROPOSED]

| Lifecycle Dimension | Specification & Boundary Rules | Status |
|---|---|---|
| **Token Lifecycle** | Issued during OAuth consent flow; stored encrypted; used during background sync; revoked on disconnect. | [PROPOSED] |
| **Storage Location** | `integration_accounts` table in PostgreSQL (Column: `encrypted_access_token`). | [PROPOSED] |
| **Access Boundary** | Inaccessible via client API queries; readable only by server-side background sync jobs. | [CONFIRMED] |
| **Encryption Boundary** | Encrypted prior to DB insert; decrypted in memory exclusively within serverless sync handlers. | [PROPOSED] |
| **Key Management** | Key management strategy (e.g., Cloud KMS or environment-level master key) is marked [PROPOSED]. | [PROPOSED] |
| **Key Rotation** | Key rotation protocol is marked [UNDECIDED] and will be formalized prior to integration build. | [UNDECIDED] |
| **Revocation & Disconnect** | Server calls provider OAuth revocation API, then hard-deletes token row from DB. | [CONFIRMED] |
| **Frontend Exposure** | Zero token bytes returned to client UI (UI receives connection status boolean only). | [CONFIRMED] |
| **Logging Restrictions** | Tokens, secret keys, and authorization headers are strictly redacted from application logs. | [CONFIRMED] |

---

## 4. Connector Interface Contract [PROPOSED]

```typescript
export interface IntegrationConnector<TData> {
  id: 'github' | 'codeforces' | 'leetcode';
  
  connect(credentials: IntegrationAuthPayload): Promise<ConnectionResult>;
  disconnect(userId: string, retentionPolicy: RetentionPolicy): Promise<void>;
  
  fetchLatestProgress(userId: string): Promise<TData>;
  normalizeProgressData(rawData: TData): StandardizedProgressSignal;
  
  handleRateLimit(error: unknown): RateLimitBackoffStrategy;
}
```

---

## 5. Sync Schedules & Disconnect Behavior [PROPOSED]

### Synchronization Strategy
- Executed asynchronously via background cron functions. Default interval: **Every 6 hours** (or manual refresh with 15-minute cooldown).

### Disconnect Behavior
1. Token revocation request sent to provider API.
2. Credentials purged from `integration_accounts`.
3. Historical metrics retained or purged based on user preference ("Keep metrics" vs. "Purge all").
