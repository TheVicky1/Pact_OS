# PACT OS — IndexedDB Migration & Schema Upgrade Failure Runbook

**Document Version:** 1.0.0
**Classification:** Operational Guide — Client-Side Storage Recovery
**Audience:** Support engineers, on-call operators, and contributors debugging browser storage

---

## 1. Scope

This runbook covers recovery when a browser-side **IndexedDB schema upgrade fails** for a
PACT client, and how to recover staged offline data before any reset. It is written for the
operational case: a real user (or your own browser) is stuck because the database will not open
or will not upgrade.

Use it when a PACT tab shows stale/missing offline data, a console error names IndexedDB, or a
deploy needs a client-side database version bump.

---

## 2. What lives in the browser

PACT persists offline state on the client so it keeps working without a network. The durable
stores worth protecting before any reset are:

| Key / store | Written by | Contents |
| --- | --- | --- |
| `pact_local_entity_cache_v2` | `src/lib/offline/local-cache.ts` | Durable entity cache (tasks, thoughts, habits, preferences) with per-entity `version`, `is_dirty` flags and last-synced timestamps |
| `pact_offline_sync_queue_v1` | `src/lib/offline/` sync engine | Queued mutations created while offline, awaiting replay |

The local cache tiers storage as **IndexedDB → localStorage → memory** when a browser exposes
IndexedDB; on browsers that fall back, the same payloads live in Web Storage. Any future schema
change that bumps the IndexedDB version must be rehearsed against real user data, not just a
clean profile.

---

## 3. Symptom catalogue

| Browser error | Meaning | Typical trigger |
| --- | --- | --- |
| `VersionError` | The requested DB version is **lower** than the version already stored in the browser | Rolling back a deploy, or a user whose browser already ran a newer build |
| `AbortError` / `InvalidStateError` during `open` | The upgrade transaction aborted (migration code threw, or was blocked) | A migration script that throws mid-upgrade, or a stale open connection |
| `onblocked` fires and `open` never resolves | Another tab, worker, or iframe still holds an older connection open | Multiple PACT tabs, or a service worker holding an open handle |
| `QuotaExceededError` (`DOMException` code 22) | The origin's storage quota is exhausted mid-write | Large offline queues; detected by `src/lib/storage-quota-detector.ts` |
| Data appears to vanish after an update | Upgrade path reset the store or bumped the schema without migrating payloads | Missing `onupgradeneeded` branch for the new version |

---

## 4. Diagnose first (never reset blindly)

Before touching storage, capture the state so nothing is lost:

1. **Read the console.** Note the exact error name (`VersionError`, `AbortError`,
   `QuotaExceededError`) and the `open()` arguments in the stack trace.
2. **Open DevTools → Application → Storage.**
   - **Indexed DB**: note every database name and its **current version** (shown in the panel).
   - **Local Storage / Session Storage**: note the values of `pact_local_entity_cache_v2` and
     `pact_offline_sync_queue_v1` if present.
3. **Check for other holders.** DevTools → Application → Service Workers, plus every open PACT
   tab. Each open tab or active worker can hold a connection and trigger `onblocked`.
4. **Record the app build** currently served (footer / `/api/health` if exposed) so the
   version mismatch can be reproduced.

---

## 5. Recovery A — `VersionError` (stored version is newer)

`VersionError` means the browser already has a **higher** IndexedDB version than the code is
asking to open. The code cannot downgrade a database; you must raise the requested version or
remove the stale database.

1. Confirm whether the deploy was rolled back intentionally.
   - **If a newer build should still be live:** redeploy the newer build so its requested
     version matches the stored one. The error disappears without touching user data.
   - **If you must run the older build:** the stale database has to be removed (Section 8) —
     **export first** (Section 7).
2. After the correct build is live, hard-reload the tab (**Ctrl/Cmd + Shift + R**) so the service
   worker and old JS bundle are bypassed.

---

## 6. Recovery B — Blocked upgrade (`onblocked`)

A blocked upgrade means another connection is holding the database open at an older version.

1. **Close every other PACT tab and window** for the origin.
2. In DevTools → Application → Service Workers, **Unregister** the PACT service worker, then
   reload.
3. If a worker still holds the handle, run **Application → Storage → Clear site data** for the
   origin *after* exporting (Section 7) — this is the last resort for a blocked connection.
4. Reopen PACT and confirm the upgrade completes. A correctly written migration listens for
   `versionchange` and closes its own connections so upgrades are never blocked.

> Prevention note for contributors: every `IDBDatabase` handle should register
> `db.onversionchange = () => db.close()`, and the upgrade handler should wrap work in a single
> `onupgradeneeded` transaction that is safe to re-run.

---

## 7. Data recovery — export before any reset

Never delete a database that holds unsynced (`is_dirty`) entities without exporting first.

### 7.1 In-app export (preferred)

1. Sign in and open **Settings → Account → Data & Privacy**.
2. Use **Export JSON** (or **Export CSV**) — implemented by
   `src/components/settings/DataExportButton.tsx` against `/api/user/export`.
3. Save the downloaded `pact-os-export-*.json` / `.zip` file. This is the authoritative
   server-side export and is unaffected by client-side database problems.

### 7.2 Manual capture of unsynced local data

If the app cannot render enough to reach Settings, capture the raw stores before reset:

1. DevTools → Application → **Local Storage** → copy the value of
   `pact_local_entity_cache_v2` and `pact_offline_sync_queue_v1` into a text file.
2. If an **Indexed DB** entry holds the same data, right-click it → **Export** (or expand each
   object store and copy rows).
3. Keep these dumps with the incident ticket. They contain unsynced mutations that can be
   replayed or manually re-entered.

---

## 8. Reset procedure (only after Section 7)

1. Close all PACT tabs for the origin.
2. DevTools → Application → **Indexed DB** → select the PACT database → **Delete database**.
3. (If Web Storage was the active tier) Application → **Local Storage** → delete
   `pact_local_entity_cache_v2` and `pact_offline_sync_queue_v1`.
4. Reload PACT and sign in. A fresh, correctly versioned database is created on first use.

---

## 9. Post-reset validation

- [ ] The app loads with no IndexedDB console errors.
- [ ] DevTools shows the expected database **version** for the current build.
- [ ] Previously synced data is restored from the server (Settings → export reflects it).
- [ ] Any unsynced items captured in Section 7 are re-entered or replayed.
- [ ] If a service worker was unregistered, it re-registers on reload.

---

## 10. Prevention checklist (for anyone shipping a schema bump)

- Bump the IndexedDB version in the same PR that adds the corresponding `onupgradeneeded`
  branch; never ship a version with no migration path.
- Write the `onupgradeneeded` handler so it can re-run safely (idempotent).
- Close old handles in `onversionchange`; broadcast the new version to other tabs.
- Test the upgrade against a **populated** database from the previous release, on Chrome,
  Firefox, and Safari.
- Provide a fallback that exports `is_dirty` entities when an upgrade must be abandoned.

---

## 11. Escalation

If a reset is unavoidable and the user has unsynced data, attach the Section 7 captures to the
incident and coordinate replay with the backend owner. Do not close the ticket until Section 9
validation passes on the affected browser.

---

*Last reviewed against PACT OS v1.0 client storage (`src/lib/offline/local-cache.ts`,
`public/sw.js`, `src/lib/storage-quota-detector.ts`).*
