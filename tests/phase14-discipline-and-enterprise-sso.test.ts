import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  evaluateDisciplineInsights,
  filterActiveDisciplineInsights,
  DisciplineMetricsInput,
} from '../src/lib/discipline/insights-engine';
import {
  generateSsoState,
  consumeSsoState,
  validateSsoDomain,
  mapIdpRole,
  parseOidcTokenPayload,
} from '../src/lib/auth/sso-engine';
import { validateProductionEnvironment } from '../src/lib/config/production-validator';

describe('Phase 14: Autonomous Discipline Intelligence & Anti-Burnout Engine', () => {
  const baseMetrics: DisciplineMetricsInput = {
    userId: 'user-123',
    activeTaskCount: 5,
    overdueTaskCount: 0,
    completedTasksThisWeek: 8,
    completedTasksLastWeek: 8,
    consecutiveFocusMinutesToday: 60,
    totalFocusHoursThisWeek: 15,
    habitCompletionRate: 0.9,
    missedHabitCountThisWeek: 0,
    activeCommitmentsCount: 2,
    breachedCommitmentsCount: 0,
    dailyPlannedHours: 5,
    dailyCapacityHours: 8,
  };

  it('returns no warnings when metrics are within healthy operational thresholds', () => {
    const insights = evaluateDisciplineInsights(baseMetrics, '2026-09-14');
    assert.strictEqual(insights.length, 0);
  });

  it('detects workload overload when daily planned hours exceed capacity threshold', () => {
    const overloadedMetrics: DisciplineMetricsInput = {
      ...baseMetrics,
      dailyPlannedHours: 12, // 150% of 8h capacity
      overdueTaskCount: 6,
    };
    const insights = evaluateDisciplineInsights(overloadedMetrics, '2026-09-14');
    assert.ok(insights.length > 0);
    const overloadInsight = insights.find((i) => i.category === 'WORKLOAD_OVERLOAD');
    assert.ok(overloadInsight !== undefined);
    assert.strictEqual(overloadInsight?.severity, 'HIGH');
    assert.ok(overloadInsight?.explanation.includes('12.0 hours'));
  });

  it('flags focus overextension for continuous sessions >= 180 minutes', () => {
    const focusFatigueMetrics: DisciplineMetricsInput = {
      ...baseMetrics,
      consecutiveFocusMinutesToday: 210,
    };
    const insights = evaluateDisciplineInsights(focusFatigueMetrics, '2026-09-14');
    const focusInsight = insights.find((i) => i.category === 'FOCUS_OVEREXTENSION');
    assert.ok(focusInsight !== undefined);
    assert.ok(focusInsight?.recommendedAction.includes('physical recovery'));
  });

  it('flags habit fatigue when completion rate drops below 50% with multiple misses', () => {
    const habitFatigueMetrics: DisciplineMetricsInput = {
      ...baseMetrics,
      habitCompletionRate: 0.3,
      missedHabitCountThisWeek: 4,
    };
    const insights = evaluateDisciplineInsights(habitFatigueMetrics, '2026-09-14');
    const habitInsight = insights.find((i) => i.category === 'HABIT_FATIGUE');
    assert.ok(habitInsight !== undefined);
    assert.strictEqual(habitInsight?.severity, 'MEDIUM');
  });

  it('flags velocity decline when output drops dramatically compared to previous week', () => {
    const velocityMetrics: DisciplineMetricsInput = {
      ...baseMetrics,
      completedTasksLastWeek: 15,
      completedTasksThisWeek: 4,
      activeTaskCount: 18,
    };
    const insights = evaluateDisciplineInsights(velocityMetrics, '2026-09-14');
    const velocityInsight = insights.find((i) => i.category === 'VELOCITY_DECLINE');
    assert.ok(velocityInsight !== undefined);
  });

  it('filters out dismissed insight IDs', () => {
    const overloadedMetrics: DisciplineMetricsInput = {
      ...baseMetrics,
      dailyPlannedHours: 14,
      overdueTaskCount: 8,
    };
    const insights = evaluateDisciplineInsights(overloadedMetrics, '2026-09-14');
    assert.ok(insights.length > 0);

    const dismissed = new Set([insights[0].id]);
    const filtered = filterActiveDisciplineInsights(insights, dismissed);
    assert.strictEqual(filtered.length, insights.length - 1);
  });
});

describe('Phase 14: Enterprise SSO & OIDC Security Engine', () => {
  it('generates cryptographically random state and nonce bound to domain', () => {
    const { state, nonce } = generateSsoState('acme.corp');
    assert.ok(state !== undefined);
    assert.ok(nonce !== undefined);
    assert.strictEqual(typeof state, 'string');
    assert.ok(state.length > 20);
  });

  it('enforces replay attack prevention by allowing single-use consumption of state', () => {
    const { state } = generateSsoState('acme.corp');
    const firstConsumption = consumeSsoState(state);
    assert.ok(firstConsumption !== null);
    assert.strictEqual(firstConsumption?.domain, 'acme.corp');

    const secondConsumption = consumeSsoState(state);
    assert.strictEqual(secondConsumption, null); // Replay attack prevented
  });

  it('validates enterprise email domain matching accurately', () => {
    assert.strictEqual(validateSsoDomain('alice@acme.corp', 'acme.corp'), true);
    assert.strictEqual(validateSsoDomain('alice@ACME.CORP', 'acme.corp'), true);
    assert.strictEqual(validateSsoDomain('attacker@malicious.com', 'acme.corp'), false);
    assert.strictEqual(validateSsoDomain('fake@sub.acme.corp', 'acme.corp'), false);
  });

  it('safely maps IdP claims to PACT workspace roles without arbitrary escalation', () => {
    assert.strictEqual(mapIdpRole('Administrator', 'member'), 'admin');
    assert.strictEqual(mapIdpRole('Auditor', 'member'), 'observer');
    assert.strictEqual(mapIdpRole('User', 'member'), 'member');
    assert.strictEqual(mapIdpRole('UnknownRole', 'member'), 'member');
  });

  it('parses OIDC identity token payloads safely', () => {
    const validPayload = {
      sub: 'idp-user-999',
      email: 'corp.user@enterprise.org',
      name: 'Jane Doe',
      email_verified: true,
    };
    const parsed = parseOidcTokenPayload(validPayload);
    assert.ok(parsed !== null);
    assert.strictEqual(parsed?.email, 'corp.user@enterprise.org');
    assert.strictEqual(parsed?.name, 'Jane Doe');

    const invalidPayload = {
      name: 'No Email User',
    };
    assert.strictEqual(parseOidcTokenPayload(invalidPayload), null);
  });
});

describe('Phase 14: Production GA Readiness & Environment Validator', () => {
  it('validates a complete production environment correctly', () => {
    const validEnv = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-test',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-test',
      NODE_ENV: 'production',
    };
    const result = validateProductionEnvironment(validEnv);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.checks.environmentVariables.passed, true);
    assert.strictEqual(result.checks.databaseMigrations.count, 26);
  });

  it('flags missing mandatory environment variables', () => {
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_URL: '',
      NODE_ENV: 'production',
    };
    const result = validateProductionEnvironment(invalidEnv);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });
});
