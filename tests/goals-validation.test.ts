import assert from 'node:assert';
import { createGoalSchema, updateGoalSchema, goalStatusSchema } from '../src/lib/validations/domain';

function runGoalValidationTests() {
  console.log('================================================================');
  console.log('  PACT Phase 2B — Goal Domain Zod Validation Unit Test Suite');
  console.log('================================================================\n');

  // 1. Valid Goal Creation Payload
  console.log('1. Testing valid Goal creation payload...');
  const validPayload = {
    title: '  Launch SaaS Product  ',
    description: 'Build a production-grade multi-tenant platform.',
    target_date: new Date('2026-12-31T23:59:59.000Z').toISOString(),
  };
  const validRes = createGoalSchema.safeParse(validPayload);
  assert.ok(validRes.success, `Expected valid payload to pass, got: ${validRes.error?.message}`);
  assert.strictEqual(validRes.data.title, 'Launch SaaS Product', 'Title should be trimmed');
  console.log('✅ Valid Goal payload passed and trimmed correctly.');

  // 2. Missing Required Title
  console.log('2. Testing missing required title...');
  const missingTitleRes = createGoalSchema.safeParse({
    description: 'No title provided',
  });
  assert.strictEqual(missingTitleRes.success, false, 'Expected missing title to fail');
  console.log('✅ Missing title rejected correctly.');

  // 3. Empty / Whitespace Title
  console.log('3. Testing whitespace-only title...');
  const emptyTitleRes = createGoalSchema.safeParse({
    title: '    ',
  });
  assert.strictEqual(emptyTitleRes.success, false, 'Expected whitespace title to fail');
  console.log('✅ Whitespace-only title rejected correctly.');

  // 4. Excessive Title Length (>255 chars)
  console.log('4. Testing excessive title length (>255 chars)...');
  const longTitleRes = createGoalSchema.safeParse({
    title: 'A'.repeat(256),
  });
  assert.strictEqual(longTitleRes.success, false, 'Expected long title to fail');
  console.log('✅ Excessive title length rejected correctly.');

  // 5. Excessive Description Length (>2000 chars)
  console.log('5. Testing excessive description length (>2000 chars)...');
  const longDescRes = createGoalSchema.safeParse({
    title: 'Valid Goal Title',
    description: 'B'.repeat(2001),
  });
  assert.strictEqual(longDescRes.success, false, 'Expected long description to fail');
  console.log('✅ Excessive description length rejected correctly.');

  // 6. Invalid Target Date ISO String
  console.log('6. Testing invalid target date string...');
  const invalidDateRes = createGoalSchema.safeParse({
    title: 'Valid Goal Title',
    target_date: 'invalid-date-string',
  });
  assert.strictEqual(invalidDateRes.success, false, 'Expected invalid target_date to fail');
  console.log('✅ Invalid target date format rejected correctly.');

  // 7. Goal Status Enum Validation
  console.log('7. Testing goal status enum schema...');
  assert.strictEqual(goalStatusSchema.safeParse('active').success, true);
  assert.strictEqual(goalStatusSchema.safeParse('completed').success, true);
  assert.strictEqual(goalStatusSchema.safeParse('archived').success, true);
  assert.strictEqual(goalStatusSchema.safeParse('invalid_status').success, false);
  console.log('✅ Goal status enum schema validated correctly.');

  // 8. Partial Update Schema
  console.log('8. Testing partial update schema...');
  const updateRes = updateGoalSchema.safeParse({
    status: 'completed',
  });
  assert.ok(updateRes.success, 'Expected partial status update to pass');
  console.log('✅ Partial Goal update schema validated correctly.');

  console.log('\n================================================================');
  console.log('🎉 ALL GOAL DOMAIN VALIDATION UNIT TESTS PASSED CLEANLY');
  console.log('================================================================\n');
}

runGoalValidationTests();
