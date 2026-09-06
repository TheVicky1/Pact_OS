import assert from 'node:assert';
import {
  TestClock,
  isValidIanaTimezone,
  localToUtc,
  utcToLocal,
  isDeadlineReached,
  compareInstants,
  getDeadlineStatus,
} from '../src/lib/time';

function runTemporalEngineTestSuite() {
  console.log('================================================================');
  console.log('  PACT Phase 2E — Deadline & Timezone Engine Unit Test Suite');
  console.log('================================================================\n');

  // ----------------------------------------------------------------
  // 1. IANA TIMEZONE VALIDATION TESTS
  // ----------------------------------------------------------------
  console.log('1. Testing IANA Timezone Validation...');
  assert.strictEqual(isValidIanaTimezone('Asia/Kolkata'), true);
  assert.strictEqual(isValidIanaTimezone('America/New_York'), true);
  assert.strictEqual(isValidIanaTimezone('Europe/London'), true);
  assert.strictEqual(isValidIanaTimezone('Australia/Sydney'), true);
  assert.strictEqual(isValidIanaTimezone('UTC'), true);

  // Vague / Invalid abbreviations must be rejected
  assert.strictEqual(isValidIanaTimezone('IST'), false, 'IST must be rejected as non-canonical');
  assert.strictEqual(isValidIanaTimezone('PST'), false, 'PST must be rejected as non-canonical');
  assert.strictEqual(isValidIanaTimezone('GMT+5:30'), false, 'GMT offsets must be rejected');
  assert.strictEqual(isValidIanaTimezone('invalid_tz_string'), false);
  assert.strictEqual(isValidIanaTimezone(''), false);
  console.log('✅ IANA Timezone Validation tests passed cleanly.\n');

  // ----------------------------------------------------------------
  // 2. TIMEZONE CONVERSION TESTS (Asia/Kolkata, America/New_York, Europe/London)
  // ----------------------------------------------------------------
  console.log('2. Testing Local <-> UTC Timezone Conversions...');

  // 2.1 Asia/Kolkata (UTC+5:30)
  const kolkataLocal = '2026-10-15T18:30:00';
  const kolkataRes = localToUtc(kolkataLocal, 'Asia/Kolkata');
  assert.strictEqual(kolkataRes.error, null);
  assert.strictEqual(kolkataRes.utcIso, '2026-10-15T13:00:00.000Z');
  console.log('✅ Asia/Kolkata local -> UTC conversion verified (18:30 IST -> 13:00 UTC).');

  // Reverse display
  const kolkataDisplay = utcToLocal('2026-10-15T13:00:00.000Z', 'Asia/Kolkata');
  assert.ok(kolkataDisplay.includes('6:30 PM') || kolkataDisplay.includes('18:30'));
  console.log(`✅ UTC -> Asia/Kolkata display verified ("${kolkataDisplay}").`);

  // 2.2 America/New_York (EDT UTC-4 during Oct)
  const nyLocal = '2026-10-15T18:30:00';
  const nyRes = localToUtc(nyLocal, 'America/New_York');
  assert.strictEqual(nyRes.error, null);
  assert.strictEqual(nyRes.utcIso, '2026-10-15T22:30:00.000Z');
  console.log('✅ America/New_York local -> UTC conversion verified (18:30 EDT -> 22:30 UTC).');

  // 2.3 Europe/London (BST UTC+1 during Oct)
  const londonLocal = '2026-10-15T18:30:00';
  const londonRes = localToUtc(londonLocal, 'Europe/London');
  assert.strictEqual(londonRes.error, null);
  assert.strictEqual(londonRes.utcIso, '2026-10-15T17:30:00.000Z');
  console.log('✅ Europe/London local -> UTC conversion verified (18:30 BST -> 17:30 UTC).\n');

  // ----------------------------------------------------------------
  // 3. ONE-SECOND BOUNDARY & DETERMINISTIC CLOCK TESTS
  // ----------------------------------------------------------------
  console.log('3. Testing One-Second Boundary Logic & Injected TestClock...');

  const targetDeadline = new Date('2026-10-15T18:30:00.000Z');
  const targetMs = targetDeadline.getTime();

  // 3.1 One second BEFORE deadline
  const clockBefore = new TestClock(targetMs - 1000); // 18:29:59.000Z
  assert.strictEqual(isDeadlineReached(targetDeadline, clockBefore), false);
  assert.strictEqual(getDeadlineStatus(targetDeadline, clockBefore), 'FUTURE');
  console.log('✅ Deadline - 1s: NOT EXPIRED (FUTURE).');

  // 3.2 EXACT second of deadline
  const clockExact = new TestClock(targetMs); // 18:30:00.000Z
  assert.strictEqual(isDeadlineReached(targetDeadline, clockExact), true);
  assert.strictEqual(getDeadlineStatus(targetDeadline, clockExact), 'EXPIRED');
  console.log('✅ Deadline EXACT: EXPIRED.');

  // 3.3 One second AFTER deadline
  const clockAfter = new TestClock(targetMs + 1000); // 18:30:01.000Z
  assert.strictEqual(isDeadlineReached(targetDeadline, clockAfter), true);
  assert.strictEqual(getDeadlineStatus(targetDeadline, clockAfter), 'EXPIRED');
  console.log('✅ Deadline + 1s: EXPIRED.\n');

  // ----------------------------------------------------------------
  // 4. MIDNIGHT LOCAL DAY TRANSITION TESTS
  // ----------------------------------------------------------------
  console.log('4. Testing Midnight Local Day Transitions...');
  const midnightBeforeLocal = '2026-10-15T23:59:59';
  const midnightBeforeRes = localToUtc(midnightBeforeLocal, 'Asia/Kolkata');
  assert.strictEqual(midnightBeforeRes.utcIso, '2026-10-15T18:29:59.000Z');

  const midnightAfterLocal = '2026-10-16T00:00:00';
  const midnightAfterRes = localToUtc(midnightAfterLocal, 'Asia/Kolkata');
  assert.strictEqual(midnightAfterRes.utcIso, '2026-10-15T18:30:00.000Z');

  const diffMs = new Date(midnightAfterRes.utcIso!).getTime() - new Date(midnightBeforeRes.utcIso!).getTime();
  assert.strictEqual(diffMs, 1000, 'Midnight local transition must differ by exactly 1 second (1000ms)');
  console.log('✅ Local midnight day transition verified (23:59:59 -> 00:00:00 differs by 1000ms).\n');

  // ----------------------------------------------------------------
  // 5. DAYLIGHT SAVING TIME (DST) SPRING-FORWARD & FALL-BACK TESTS
  // ----------------------------------------------------------------
  console.log('5. Testing DST Spring-Forward & Fall-Back Boundaries...');

  // 5.1 Spring-Forward Nonexistent Local Time (Clocks jump 02:00 -> 03:00 on March 8, 2026 in NY)
  const springForwardNonexistent = '2026-03-08T02:30:00';
  const springRes = localToUtc(springForwardNonexistent, 'America/New_York');
  assert.strictEqual(springRes.isNonexistent, true);
  assert.ok(springRes.error?.includes('DST spring-forward'));
  console.log(`✅ Nonexistent spring-forward time rejected correctly (${springRes.error}).`);

  // 5.2 Fall-Back Ambiguous Local Time (Clocks fall back 02:00 -> 01:00 on November 1, 2026 in NY)
  const fallBackAmbiguous = '2026-11-01T01:30:00';
  const fallRes = localToUtc(fallBackAmbiguous, 'America/New_York');
  assert.strictEqual(fallRes.isAmbiguous, true);
  assert.strictEqual(fallRes.error, null);
  assert.ok(fallRes.utcIso);
  console.log('✅ Ambiguous fall-back time detected correctly.\n');

  // ----------------------------------------------------------------
  // 6. TIMEZONE CHANGE INVARIANCE TESTS
  // ----------------------------------------------------------------
  console.log('6. Testing Timezone Change Invariance (Stored UTC Instant Preserved)...');

  // User A creates task in Asia/Kolkata with deadline 2026-10-15 18:30 local
  const createdInKolkata = localToUtc('2026-10-15T18:30:00', 'Asia/Kolkata');
  const storedUtcIso = createdInKolkata.utcIso!;
  assert.strictEqual(storedUtcIso, '2026-10-15T13:00:00.000Z');

  // Profile timezone updated to America/New_York
  const displayInNy = utcToLocal(storedUtcIso, 'America/New_York');

  // Verify stored UTC instant NEVER changes
  assert.strictEqual(storedUtcIso, '2026-10-15T13:00:00.000Z');
  // Verify display converted to NY time (9:00 AM EDT)
  assert.ok(displayInNy.includes('9:00 AM') || displayInNy.includes('09:00'));
  console.log(`✅ Timezone change invariance verified (Stored UTC: ${storedUtcIso}, NY Display: "${displayInNy}").\n`);

  // ----------------------------------------------------------------
  // 7. PRECISION & COMPARISON UTILITIES
  // ----------------------------------------------------------------
  console.log('7. Testing Instant Comparison Utilities...');
  const dateEarly = '2026-10-15T10:00:00.000Z';
  const dateLate = '2026-10-15T12:00:00.000Z';

  assert.ok(compareInstants(dateEarly, dateLate) < 0);
  assert.ok(compareInstants(dateLate, dateEarly) > 0);
  assert.strictEqual(compareInstants(dateEarly, dateEarly), 0);
  console.log('✅ Instant comparison utilities verified.\n');

  console.log('================================================================');
  console.log('🎉 ALL TEMPORAL ENGINE & TIMEZONE UNIT TESTS PASSED CLEANLY');
  console.log('================================================================\n');
}

runTemporalEngineTestSuite();
