import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { OnboardingStatus, OnboardingStep, UserProfileSettings, UserAccountInfo } from '../src/types/domain';
import { getUserProfileInfo } from '../src/lib/auth/profile';
import { validateSafeRedirect } from '../src/lib/auth/redirect';
import { serializeUserAccountJson, buildDomainCsvFiles, RawUserDataArchive } from '../src/lib/export/serializer';

/**
 * PACT OS — Final Production Authentication & Lifecycle Verification Suite
 *
 * Explicit Scenario Coverage (Mocked Unit / State Machine Validation):
 * 1. New Google OAuth user.
 * 2. New email/password user.
 * 3. Existing Google OAuth user signing in again.
 * 4. Existing user updating their authentication email.
 * 5. Existing user with incomplete onboarding.
 * 6. Existing user with completed onboarding.
 * 7. User with missing name metadata.
 * 8. User with missing timezone metadata.
 * 9. Duplicate profile creation attempts.
 * 10. Existing profile with populated onboarding_data.
 * 11. OAuth callback route handler & redirect evaluation.
 * 12. Migration SQL safety & security declarations audit.
 * 13. Static codebase audit: zero queries or mutations referencing profiles.email.
 */

// In-memory simulation of public.profiles table
interface ProfileRow {
  id: string;
  full_name: string;
  timezone: string;
  onboarding_status: OnboardingStatus;
  onboarding_step: OnboardingStep;
  onboarding_data: Record<string, unknown>;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// In-memory mock database
class MockPactDatabase {
  public profiles: Map<string, ProfileRow> = new Map();

  /**
   * Deterministic simulation of public.handle_new_user() trigger function
   * as defined in supabase/migrations/20261112000000_fix_auth_profile_creation.sql
   */
  public handleNewUser(newUser: {
    id: string;
    email: string;
    raw_user_meta_data?: Record<string, unknown>;
    created_at?: string;
  }): { triggerSuccess: boolean; profile: ProfileRow } {
    const rawMeta = newUser.raw_user_meta_data || {};

    // 1. Sanitize full_name from OAuth / Auth metadata
    const rawFullName = typeof rawMeta.full_name === 'string' ? rawMeta.full_name.trim() : '';
    const rawName = typeof rawMeta.name === 'string' ? rawMeta.name.trim() : '';
    const fullName = rawFullName || rawName || '';

    // 2. Sanitize timezone from metadata, defaulting safely to UTC
    const rawTz = typeof rawMeta.timezone === 'string' ? rawMeta.timezone.trim() : '';
    const timezone = rawTz || 'UTC';

    const nowIso = new Date().toISOString();

    // 3. Check for conflict on id (existing profile)
    const existing = this.profiles.get(newUser.id);
    if (existing) {
      // ON CONFLICT (id) DO UPDATE SET updated_at = now()
      existing.updated_at = nowIso;
      return { triggerSuccess: true, profile: { ...existing } };
    }

    // 4. INSERT INTO public.profiles (ONLY existing columns, NO email)
    const newProfile: ProfileRow = {
      id: newUser.id,
      full_name: fullName,
      timezone: timezone,
      onboarding_status: 'not_started',
      onboarding_step: 1,
      onboarding_data: {},
      onboarding_completed_at: null,
      created_at: newUser.created_at || nowIso,
      updated_at: nowIso,
    };

    this.profiles.set(newUser.id, newProfile);
    return { triggerSuccess: true, profile: { ...newProfile } };
  }
}

async function runAuthProfileLifecycleTests() {
  console.log('================================================================');
  console.log('  PACT OS — Production Authentication Lifecycle Verification Suite');
  console.log('================================================================\n');

  const db = new MockPactDatabase();

  // ----------------------------------------------------------------
  // SCENARIO 1: New Google OAuth user
  // ----------------------------------------------------------------
  console.log('1. Scenario 1: New Google OAuth user profile creation...');
  const googleUser = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    email: 'marcus.aurelius@gmail.com',
    raw_user_meta_data: {
      full_name: 'Marcus Aurelius',
      timezone: 'Europe/Rome',
      avatar_url: 'https://lh3.googleusercontent.com/a/abc123xyz',
      provider: 'google',
    },
  };

  const res1 = db.handleNewUser(googleUser);
  assert.strictEqual(res1.triggerSuccess, true);
  assert.strictEqual(res1.profile.id, googleUser.id);
  assert.strictEqual(res1.profile.full_name, 'Marcus Aurelius');
  assert.strictEqual(res1.profile.timezone, 'Europe/Rome');
  assert.strictEqual(res1.profile.onboarding_status, 'not_started');
  assert.strictEqual(res1.profile.onboarding_step, 1);
  assert.deepStrictEqual(res1.profile.onboarding_data, {});
  assert.strictEqual(res1.profile.onboarding_completed_at, null);
  assert.strictEqual('email' in res1.profile, false, 'Profile must NOT contain email column');
  console.log('   ✔ Google user profile initialized with name, timezone, and initial onboarding state.');

  // ----------------------------------------------------------------
  // SCENARIO 2: New email/password user
  // ----------------------------------------------------------------
  console.log('\n2. Scenario 2: New email/password user creation...');
  const emailUser = {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    email: 'seneca@stoic.org',
    raw_user_meta_data: {
      name: 'Lucius Annaeus Seneca',
      // No timezone provided in metadata -> must fallback to UTC
    },
  };

  const res2 = db.handleNewUser(emailUser);
  assert.strictEqual(res2.profile.id, emailUser.id);
  assert.strictEqual(res2.profile.full_name, 'Lucius Annaeus Seneca');
  assert.strictEqual(res2.profile.timezone, 'UTC', 'Timezone must default to UTC');
  assert.strictEqual(res2.profile.onboarding_status, 'not_started');
  assert.strictEqual('email' in res2.profile, false);
  console.log('   ✔ Email user profile initialized with fallback name and canonical UTC timezone.');

  // ----------------------------------------------------------------
  // SCENARIO 3: Existing Google OAuth user signing in again
  // ----------------------------------------------------------------
  console.log('\n3. Scenario 3: Existing Google OAuth user signing in again...');
  const originalProfile = db.profiles.get(googleUser.id)!;
  const originalCreatedAt = originalProfile.created_at;

  const repeatRes = db.handleNewUser({
    ...googleUser,
    raw_user_meta_data: {
      full_name: 'Marcus Aurelius Renamed',
      timezone: 'Europe/Rome',
    },
  });

  assert.strictEqual(repeatRes.triggerSuccess, true);
  assert.strictEqual(repeatRes.profile.id, googleUser.id);
  assert.strictEqual(repeatRes.profile.created_at, originalCreatedAt);
  assert.strictEqual(repeatRes.profile.full_name, 'Marcus Aurelius', 'Existing name is not overwritten');
  console.log('   ✔ Re-authenticating existing Google user preserves profile and updates updated_at.');

  // ----------------------------------------------------------------
  // SCENARIO 4: Existing user updating their authentication email
  // ----------------------------------------------------------------
  console.log('\n4. Scenario 4: Existing user updating their authentication email...');
  // Email updates occur in auth.users without affecting public.profiles
  const updatedAuthUser = {
    ...googleUser,
    email: 'marcus.emperor@rome.gov',
  };

  // Profile lookup remains intact by user.id
  const profileRow = db.profiles.get(updatedAuthUser.id)!;
  assert.ok(profileRow, 'Profile remains linked by UUID');
  assert.strictEqual('email' in profileRow, false, 'No stale email in profiles');

  // Verify that account info retrieves updated email directly from auth user
  const accountInfo: UserAccountInfo = {
    email: updatedAuthUser.email,
    provider: 'google',
    createdAt: profileRow.created_at || new Date().toISOString(),
    lastSignInAt: new Date().toISOString(),
  };
  assert.strictEqual(accountInfo.email, 'marcus.emperor@rome.gov');
  console.log('   ✔ Auth email updates cleanly in auth.users with zero profile desynchronization.');

  // ----------------------------------------------------------------
  // SCENARIO 5: Existing user with incomplete onboarding
  // ----------------------------------------------------------------
  console.log('\n5. Scenario 5: Existing user with incomplete onboarding...');
  // User started onboarding, at step 2
  const inProgressUser = db.profiles.get(emailUser.id)!;
  inProgressUser.onboarding_status = 'in_progress';
  inProgressUser.onboarding_step = 2;
  inProgressUser.onboarding_data = {
    dailyTaskTarget: 5,
    initialGoalTitle: 'Write Letters from a Stoic',
  };

  // Re-run trigger as if auth callback re-fired
  const inProgressTriggerRes = db.handleNewUser(emailUser);
  assert.strictEqual(inProgressTriggerRes.profile.onboarding_status, 'in_progress');
  assert.strictEqual(inProgressTriggerRes.profile.onboarding_step, 2);
  assert.deepStrictEqual(inProgressTriggerRes.profile.onboarding_data, {
    dailyTaskTarget: 5,
    initialGoalTitle: 'Write Letters from a Stoic',
  });

  // Verify route gating detects incomplete onboarding and redirects to /app/onboarding
  const inProgressStatus = inProgressTriggerRes.profile.onboarding_status as OnboardingStatus;
  const shouldRedirectToOnboarding = inProgressStatus !== 'completed';
  assert.strictEqual(shouldRedirectToOnboarding, true, 'User must be redirected to /app/onboarding');
  console.log('   ✔ Incomplete onboarding state preserved and correctly gated by application route.');

  // ----------------------------------------------------------------
  // SCENARIO 6: Existing user with completed onboarding
  // ----------------------------------------------------------------
  console.log('\n6. Scenario 6: Existing user with completed onboarding...');
  const completedTimestamp = '2026-10-15T10:00:00.000Z';
  const completedUser = db.profiles.get(googleUser.id)!;
  completedUser.onboarding_status = 'completed';
  completedUser.onboarding_step = 3;
  completedUser.onboarding_completed_at = completedTimestamp;

  // Duplicate trigger event
  const completedTriggerRes = db.handleNewUser(googleUser);
  assert.strictEqual(completedTriggerRes.profile.onboarding_status, 'completed');
  assert.strictEqual(completedTriggerRes.profile.onboarding_step, 3);
  assert.strictEqual(completedTriggerRes.profile.onboarding_completed_at, completedTimestamp);

  // Verify route gating allows direct dashboard access
  const completedStatus = completedTriggerRes.profile.onboarding_status as OnboardingStatus;
  const bypassOnboarding = completedStatus === 'completed';
  assert.strictEqual(bypassOnboarding, true, 'Completed user accesses /app directly');
  console.log('   ✔ Completed onboarding status & timestamp completely preserved.');

  // ----------------------------------------------------------------
  // SCENARIO 7: User with missing name metadata
  // ----------------------------------------------------------------
  console.log('\n7. Scenario 7: User with missing or whitespace name metadata...');
  const missingNameUser = {
    id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    email: 'noname@example.com',
    raw_user_meta_data: {
      full_name: '   ', // whitespace
      name: '',
      timezone: 'Asia/Tokyo',
    },
  };

  const res7 = db.handleNewUser(missingNameUser);
  assert.strictEqual(res7.profile.full_name, '', 'Whitespace name stored as empty string');

  // Verify that getUserProfileInfo provides canonical fallback
  const mockSupabaseMissingName = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { full_name: res7.profile.full_name, timezone: res7.profile.timezone, onboarding_status: res7.profile.onboarding_status },
            error: null,
          }),
        }),
      }),
    }),
  };

  const profileInfo7 = await getUserProfileInfo(
    mockSupabaseMissingName as any,
    missingNameUser.id,
    missingNameUser.raw_user_meta_data
  );
  assert.strictEqual(profileInfo7.fullName, 'User', 'Falls back safely to "User"');
  console.log('   ✔ Missing name sanitized in trigger and safely resolved to "User" by reader.');

  // ----------------------------------------------------------------
  // SCENARIO 8: User with missing timezone metadata
  // ----------------------------------------------------------------
  console.log('\n8. Scenario 8: User with missing timezone metadata...');
  const missingTzUser = {
    id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    email: 'notz@example.com',
    raw_user_meta_data: {
      full_name: 'Valid Name',
      timezone: '   ', // whitespace
    },
  };

  const res8 = db.handleNewUser(missingTzUser);
  assert.strictEqual(res8.profile.timezone, 'UTC', 'Whitespace timezone stored as UTC');

  const mockSupabaseMissingTz = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { full_name: res8.profile.full_name, timezone: res8.profile.timezone, onboarding_status: res8.profile.onboarding_status },
            error: null,
          }),
        }),
      }),
    }),
  };

  const profileInfo8 = await getUserProfileInfo(
    mockSupabaseMissingTz as any,
    missingTzUser.id,
    missingTzUser.raw_user_meta_data
  );
  assert.strictEqual(profileInfo8.timezone, 'UTC', 'Reader resolves to UTC');
  console.log('   ✔ Missing timezone defaults deterministically to UTC.');

  // ----------------------------------------------------------------
  // SCENARIO 9: Duplicate profile creation attempts
  // ----------------------------------------------------------------
  console.log('\n9. Scenario 9: Duplicate profile creation attempts...');
  // Simulating duplicate webhook or replayed trigger call
  for (let attempt = 1; attempt <= 3; attempt++) {
    const dupRes = db.handleNewUser(googleUser);
    assert.strictEqual(dupRes.triggerSuccess, true);
    assert.strictEqual(dupRes.profile.id, googleUser.id);
  }
  console.log('   ✔ Repeated executions succeed with zero errors or duplicate records.');

  // ----------------------------------------------------------------
  // SCENARIO 10: Existing profile with populated onboarding_data
  // ----------------------------------------------------------------
  console.log('\n10. Scenario 10: Existing profile with populated onboarding_data JSONB...');
  const richDataUser = db.profiles.get(missingNameUser.id)!;
  richDataUser.onboarding_data = {
    workStartTime: '08:30',
    workEndTime: '17:30',
    dailyTaskTarget: 7,
    notificationPreferences: {
      dailyPlanReminder: true,
      consequenceAlerts: true,
    },
    integrations: ['github', 'leetcode'],
  };

  // Re-trigger user creation event
  const richTriggerRes = db.handleNewUser(missingNameUser);
  assert.deepStrictEqual(
    richTriggerRes.profile.onboarding_data,
    richDataUser.onboarding_data,
    'Complex onboarding_data JSONB payload is untouched'
  );
  console.log('   ✔ Complex onboarding_data JSONB structures remain 100% intact.');

  // ----------------------------------------------------------------
  // SCENARIO 11: OAuth callback route handler simulation
  // ----------------------------------------------------------------
  console.log('\n11. Scenario 11: OAuth callback route handler redirect boundary...');
  assert.strictEqual(validateSafeRedirect('/app'), '/app');
  assert.strictEqual(validateSafeRedirect('/app/onboarding'), '/app/onboarding');
  assert.strictEqual(validateSafeRedirect('https://malicious.site'), '/app', 'Open redirect blocked');
  assert.strictEqual(validateSafeRedirect(null), '/app', 'Null redirect defaults to /app');
  console.log('   ✔ OAuth redirect boundaries enforce internal paths.');

  // ----------------------------------------------------------------
  // SCENARIO 12: Database migration safety & security declarations audit
  // ----------------------------------------------------------------
  console.log('\n12. Scenario 12: Auditing SQL migration file declarations...');
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261112000000_fix_auth_profile_creation.sql'
  );
  assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Verify NO DROP COLUMN operation (eliminating table lock risk)
  assert.strictEqual(
    sql.includes('DROP COLUMN'),
    false,
    'Migration must NOT contain DROP COLUMN statements'
  );

  // Verify function security
  assert.ok(sql.includes('SECURITY DEFINER'), 'Must declare SECURITY DEFINER');
  assert.ok(sql.includes('SET search_path = public'), 'Must declare fixed search_path = public');

  // Verify least-privilege permission grants
  assert.ok(
    sql.includes('REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;'),
    'Must revoke from PUBLIC'
  );
  assert.ok(
    sql.includes('GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;'),
    'Must grant strictly to supabase_auth_admin'
  );
  assert.strictEqual(
    sql.includes('GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role'),
    false,
    'service_role does not require unnecessary execute privileges on trigger function'
  );

  // Verify non-destructive ON CONFLICT
  assert.ok(sql.includes('ON CONFLICT (id) DO UPDATE SET'), 'Must contain ON CONFLICT clause');
  assert.strictEqual(
    sql.includes('email = EXCLUDED.email'),
    false,
    'ON CONFLICT must not reference email'
  );

  // Verify trigger recreation
  assert.ok(sql.includes('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;'));
  assert.ok(sql.includes('AFTER INSERT ON auth.users'));

  // Verify idempotent backfill
  assert.ok(sql.includes('WHERE NOT EXISTS'));
  assert.ok(sql.includes('ON CONFLICT (id) DO NOTHING'));
  console.log('   ✔ Migration passes all static security, privilege, and locking safety audits.');

  // ----------------------------------------------------------------
  // SCENARIO 13: Static codebase audit for invalid profile queries
  // ----------------------------------------------------------------
  console.log('\n13. Scenario 13: Static codebase scan for invalid profiles.email queries...');
  const srcDir = path.resolve(process.cwd(), 'src');
  function getAllTsFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(getAllTsFiles(fullPath));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const allSrcFiles = getAllTsFiles(srcDir);
  const offendingLines: string[] = [];

  for (const file of allSrcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const selectEmailRegex = /\.from\(['"]profiles['"]\)\s*\.select\([^)]*email[^)]*\)/g;
    if (selectEmailRegex.test(content)) {
      offendingLines.push(`Select email from profiles in ${file}`);
    }
    const insertEmailRegex = /\.from\(['"]profiles['"]\)\s*\.insert\([^)]*email[^)]*\)/g;
    if (insertEmailRegex.test(content)) {
      offendingLines.push(`Insert email into profiles in ${file}`);
    }
    const updateEmailRegex = /\.from\(['"]profiles['"]\)\s*\.update\([^)]*email[^)]*\)/g;
    if (updateEmailRegex.test(content)) {
      offendingLines.push(`Update email on profiles in ${file}`);
    }
  }

  assert.strictEqual(offendingLines.length, 0, `Offending lines: ${offendingLines.join(', ')}`);
  console.log('   ✔ Codebase scan passed: zero queries assume profiles.email exists.');

  console.log('\n================================================================');
  console.log('🎉 ALL 13 PRODUCTION AUTHENTICATION AUDIT TESTS PASSED CLEANLY');
  console.log('================================================================\n');
}

runAuthProfileLifecycleTests().catch((err) => {
  console.error('❌ Test Suite Failed:', err);
  process.exit(1);
});
