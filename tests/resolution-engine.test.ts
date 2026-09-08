import assert from 'node:assert';
import {
  verificationTypeSchema,
  verificationConfigSchema,
  startSessionSchema,
  fulfillSessionSchema,
  cancelSessionSchema,
  waiveCommitmentSchema,
  consequenceSnapshotSchema,
  createConsequenceDefinitionSchema,
} from '../src/lib/validations/accountability';
import {
  VerificationType,
  VerificationConfig,
  ConsequenceSnapshot,
  AccountabilityVerificationSession,
  AccountabilityWaiver,
} from '../src/types/domain';

console.log('================================================================');
console.log('  PACT Phase 3 — Accountability Resolution & Verification Engine Unit Test Suite');
console.log('================================================================\n');

// 1. Verification Type Schema Validation
console.log('1. Testing VerificationType schema validation...');
const supportedTypes: VerificationType[] = [
  'timed_session',
  'task_completion',
  'written_reflection',
  'declaration',
  'custom',
];

for (const vType of supportedTypes) {
  const parsed = verificationTypeSchema.parse(vType);
  assert.strictEqual(parsed, vType);
}

assert.throws(
  () => verificationTypeSchema.parse('ai_surveillance'),
  /Invalid/,
  'Disallowed verification type should be rejected.'
);
console.log('✅ All 5 verification types validated; unsupported types rejected.');

// 2. Verification Config Schema Validation
console.log('2. Testing VerificationConfig schema validation...');
const validConfig: VerificationConfig = {
  required_duration_seconds: 1800,
  activity_prompt: 'What did you study during this session?',
  custom_tag: 'focus_block',
};
const parsedConfig = verificationConfigSchema.parse(validConfig);
assert.strictEqual(parsedConfig.required_duration_seconds, 1800);
assert.strictEqual(parsedConfig.activity_prompt, 'What did you study during this session?');
assert.strictEqual(parsedConfig.custom_tag, 'focus_block');

// Reject negative duration
assert.throws(
  () => verificationConfigSchema.parse({ required_duration_seconds: -30 }),
  /too_small/,
  'Negative required duration should be rejected.'
);

// Reject duration > 86400 (24h)
assert.throws(
  () => verificationConfigSchema.parse({ required_duration_seconds: 90000 }),
  /too_big/,
  'Excessive required duration (>24h) should be rejected.'
);
console.log('✅ VerificationConfig schema enforces bounds and allows pass-through metadata.');

// 3. Consequence Snapshot with Verification Metadata
console.log('3. Testing ConsequenceSnapshot with snapshotted verification rules...');
const snapshotWithVerification: ConsequenceSnapshot = {
  title: 'Study 30 Minutes',
  consequence_type: 'self_improvement',
  action_statement: 'Study algorithms for 30 minutes',
  description: 'Deep work block',
  verification_type: 'timed_session',
  verification_config: { required_duration_seconds: 1800 },
};

const parsedSnapshot = consequenceSnapshotSchema.parse(snapshotWithVerification);
assert.strictEqual(parsedSnapshot.verification_type, 'timed_session');
assert.strictEqual(parsedSnapshot.verification_config?.required_duration_seconds, 1800);
console.log('✅ ConsequenceSnapshot accurately snapshots verification type and configuration.');

// 4. Session Start, Fulfillment, and Cancellation Schemas
console.log('4. Testing Session lifecycle input schemas...');
const validStart = startSessionSchema.parse({
  commitment_id: '11111111-1111-4111-8111-111111111111',
});
assert.strictEqual(validStart.commitment_id, '11111111-1111-4111-8111-111111111111');

assert.throws(
  () => startSessionSchema.parse({ commitment_id: 'not-a-uuid' }),
  /Invalid commitment UUID format/,
  'Non-UUID commitment ID should be rejected.'
);

const validFulfill = fulfillSessionSchema.parse({
  session_id: '22222222-2222-4222-8222-222222222222',
  evidence_note: 'Solved 2 LeetCode medium dynamic programming questions.',
});
assert.strictEqual(validFulfill.evidence_note, 'Solved 2 LeetCode medium dynamic programming questions.');

// Evidence note > 5000 characters
const oversizedNote = 'A'.repeat(5001);
assert.throws(
  () => fulfillSessionSchema.parse({
    session_id: '22222222-2222-4222-8222-222222222222',
    evidence_note: oversizedNote,
  }),
  /Evidence note must not exceed 5000 characters/,
  'Oversized evidence note (>5000 chars) should be rejected.'
);

const validCancel = cancelSessionSchema.parse({
  session_id: '22222222-2222-4222-8222-222222222222',
});
assert.strictEqual(validCancel.session_id, '22222222-2222-4222-8222-222222222222');
console.log('✅ Session lifecycle schemas validate correctly.');

// 5. Server-Authoritative Timed Session Elapsed Calculation Simulation
console.log('5. Testing Server-Authoritative Timer & Duration Enforcement logic...');
function evaluateFulfillmentEligibility(
  startedAtIso: string,
  serverNowIso: string,
  requiredDurationSeconds: number,
  evidenceNote?: string
): { eligible: boolean; code: string; elapsedSeconds: number } {
  const startedAt = new Date(startedAtIso).getTime();
  const serverNow = new Date(serverNowIso).getTime();
  const elapsedSeconds = Math.floor((serverNow - startedAt) / 1000);

  if (elapsedSeconds < requiredDurationSeconds) {
    return { eligible: false, code: 'DURATION_NOT_MET', elapsedSeconds };
  }

  if (requiredDurationSeconds > 0) {
    if (!evidenceNote || evidenceNote.trim().length === 0) {
      return { eligible: false, code: 'EVIDENCE_REQUIRED', elapsedSeconds };
    }
  }

  return { eligible: true, code: 'FULFILLED', elapsedSeconds };
}

const sessionStartTime = '2026-09-08T10:00:00.000Z';

// Test: Client attempts to fulfill after only 2 minutes (120s) for a 30m (1800s) requirement
const earlyCheck = evaluateFulfillmentEligibility(
  sessionStartTime,
  '2026-09-08T10:02:00.000Z',
  1800,
  'I studied hard!'
);
assert.strictEqual(earlyCheck.eligible, false);
assert.strictEqual(earlyCheck.code, 'DURATION_NOT_MET');
assert.strictEqual(earlyCheck.elapsedSeconds, 120);

// Test: 30 minutes exactly elapsed, but evidence note missing
const missingEvidenceCheck = evaluateFulfillmentEligibility(
  sessionStartTime,
  '2026-09-08T10:30:00.000Z',
  1800,
  '   '
);
assert.strictEqual(missingEvidenceCheck.eligible, false);
assert.strictEqual(missingEvidenceCheck.code, 'EVIDENCE_REQUIRED');

// Test: 31 minutes elapsed with valid evidence note
const validCheck = evaluateFulfillmentEligibility(
  sessionStartTime,
  '2026-09-08T10:31:00.000Z',
  1800,
  'Reviewed Chapter 4 on Distributed Systems.'
);
assert.strictEqual(validCheck.eligible, true);
assert.strictEqual(validCheck.code, 'FULFILLED');
assert.strictEqual(validCheck.elapsedSeconds, 1860);
console.log('✅ Server-authoritative timer enforces required duration and rejects early/unattested completion.');

// 6. Waiver Confirmation Token Validation
console.log('6. Testing Waiver confirmation token validation...');
const validWaiver = waiveCommitmentSchema.parse({
  commitment_id: '33333333-3333-4333-8333-333333333333',
  confirmation_token: 'CONFIRM_WAIVER_V1',
});
assert.strictEqual(validWaiver.confirmation_token, 'CONFIRM_WAIVER_V1');

assert.throws(
  () => waiveCommitmentSchema.parse({
    commitment_id: '33333333-3333-3333-3333-333333333333',
    confirmation_token: '   ',
  }),
  /Confirmation token is required/,
  'Empty confirmation token should be rejected.'
);
console.log('✅ Waiver confirmation token schema validated.');

// 7. Timezone-Aware Calendar Week Calculation Simulation (ISO week: Monday = start)
console.log('7. Testing Timezone-Aware Calendar Week Calculation...');

function getIsoWeekAndYear(date: Date, timeZone: string): { weekYear: number; weekNumber: number } {
  // Format date in specified IANA timezone as YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  // Build local date object in local timezone year/month/day
  const localYear = parseInt(partMap.year, 10);
  const localMonth = parseInt(partMap.month, 10) - 1;
  const localDay = parseInt(partMap.day, 10);
  const localDate = new Date(Date.UTC(localYear, localMonth, localDay));

  // ISO week calculation (Thursday determines week year)
  const dayOfWeek = localDate.getUTCDay() || 7; // 1 = Monday, 7 = Sunday
  localDate.setUTCDate(localDate.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(localDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((localDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return { weekYear: localDate.getUTCFullYear(), weekNumber };
}

// Test case: 2026-09-06T22:30:00Z (Sunday night UTC)
// In America/New_York (EDT, UTC-4), it is Sunday 2026-09-06 at 18:30 (Week 36)
// In Asia/Kolkata (IST, UTC+5:30), it is Monday 2026-09-07 at 04:00 (Week 37 - next week!)
const boundaryDate = new Date('2026-09-06T22:30:00Z');

const nyWeek = getIsoWeekAndYear(boundaryDate, 'America/New_York');
const kolkataWeek = getIsoWeekAndYear(boundaryDate, 'Asia/Kolkata');

assert.strictEqual(nyWeek.weekNumber, 36, 'New York should be in Week 36 on Sunday evening');
assert.strictEqual(kolkataWeek.weekNumber, 37, 'Kolkata should be in Week 37 on Monday morning');
console.log(`✅ Timezone boundary correctly resolved: NY Week=${nyWeek.weekNumber} vs Kolkata Week=${kolkataWeek.weekNumber}`);

// 8. Weekly Waiver Limit Simulation (Max 3 per calendar week)
console.log('8. Testing Weekly Waiver Limit (3 waivers per week quota) simulation...');
class WaiverQuotaTracker {
  private waivers: Array<{ userId: string; weekYear: number; weekNumber: number }> = [];

  recordWaiver(userId: string, weekYear: number, weekNumber: number): { allowed: boolean; count: number } {
    const currentCount = this.waivers.filter(
      (w) => w.userId === userId && w.weekYear === weekYear && w.weekNumber === weekNumber
    ).length;

    if (currentCount >= 3) {
      return { allowed: false, count: currentCount };
    }

    this.waivers.push({ userId, weekYear, weekNumber });
    return { allowed: true, count: currentCount + 1 };
  }
}

const tracker = new WaiverQuotaTracker();
const testUser = 'user-test-123';

// Waiver 1
const w1 = tracker.recordWaiver(testUser, 2026, 37);
assert.strictEqual(w1.allowed, true);
assert.strictEqual(w1.count, 1);

// Waiver 2
const w2 = tracker.recordWaiver(testUser, 2026, 37);
assert.strictEqual(w2.allowed, true);
assert.strictEqual(w2.count, 2);

// Waiver 3
const w3 = tracker.recordWaiver(testUser, 2026, 37);
assert.strictEqual(w3.allowed, true);
assert.strictEqual(w3.count, 3);

// Waiver 4 in same week -> REJECTED
const w4 = tracker.recordWaiver(testUser, 2026, 37);
assert.strictEqual(w4.allowed, false);
assert.strictEqual(w4.count, 3);

// Waiver in next week (Week 38) -> ALLOWED (Quota resets)
const nextWeekWaiver = tracker.recordWaiver(testUser, 2026, 38);
assert.strictEqual(nextWeekWaiver.allowed, true);
assert.strictEqual(nextWeekWaiver.count, 1);

console.log('✅ Weekly quota enforced at exactly 3 waivers; resets in subsequent calendar week.');

// 9. Commitment State Transition Invariants
console.log('9. Testing Commitment Resolution State Transition Invariants...');
const validTransitions: Record<string, string[]> = {
  committed: ['activated'], // from task lifecycle only
  activated: ['fulfilled', 'waived'], // from verification session or waiver RPC
  fulfilled: [], // terminal state
  waived: [], // terminal state
};

function canTransition(current: string, target: string): boolean {
  return validTransitions[current]?.includes(target) ?? false;
}

assert.strictEqual(canTransition('committed', 'fulfilled'), false, 'Cannot jump directly from committed to fulfilled');
assert.strictEqual(canTransition('committed', 'waived'), false, 'Cannot jump directly from committed to waived');
assert.strictEqual(canTransition('activated', 'fulfilled'), true, 'Activated can transition to fulfilled upon verification');
assert.strictEqual(canTransition('activated', 'waived'), true, 'Activated can transition to waived within quota');
assert.strictEqual(canTransition('fulfilled', 'waived'), false, 'Fulfilled cannot transition to waived');
assert.strictEqual(canTransition('waived', 'fulfilled'), false, 'Waived cannot transition to fulfilled');
console.log('✅ Commitment resolution state transition invariants verified.');

console.log('\n================================================================');
console.log('🎉 ALL RESOLUTION & VERIFICATION ENGINE UNIT TESTS PASSED CLEANLY');
console.log('================================================================\n');
