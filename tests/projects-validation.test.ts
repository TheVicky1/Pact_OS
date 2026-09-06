import assert from 'node:assert';
import { createProjectSchema, updateProjectSchema, projectStatusSchema } from '../src/lib/validations/domain';

function runProjectValidationTests() {
  console.log('================================================================');
  console.log('  PACT Phase 2C — Project Domain Zod Validation Unit Test Suite');
  console.log('================================================================\n');

  // 1. Valid Project Creation Payload (Independent Project)
  console.log('1. Testing valid independent Project creation payload...');
  const validIndependentPayload = {
    title: '  Core Engine Optimization  ',
    description: 'Refactor data access layer and indexes.',
    color_accent: '#d4af37',
  };
  const validIndRes = createProjectSchema.safeParse(validIndependentPayload);
  assert.ok(validIndRes.success, `Expected valid independent payload to pass, got: ${validIndRes.error?.message}`);
  assert.strictEqual(validIndRes.data.title, 'Core Engine Optimization', 'Title should be trimmed');
  console.log('✅ Valid independent Project payload passed correctly.');

  // 2. Valid Project Creation Payload with Goal UUID
  console.log('2. Testing valid Project attached to Goal UUID...');
  const goalUuid = '55555555-5555-4555-8555-555555555555';
  const validGoalPayload = {
    title: 'LeetCode 75 Initiative',
    goal_id: goalUuid,
    description: 'Daily algorithms practice',
    color_accent: '#3b82f6',
  };
  const validGoalRes = createProjectSchema.safeParse(validGoalPayload);
  assert.ok(validGoalRes.success, `Expected valid goal payload to pass, got: ${validGoalRes.error?.message}`);
  assert.strictEqual(validGoalRes.data.goal_id, goalUuid);
  console.log('✅ Valid Goal-attached Project payload passed correctly.');

  // 3. Missing Required Title
  console.log('3. Testing missing required title...');
  const missingTitleRes = createProjectSchema.safeParse({
    description: 'No title provided',
  });
  assert.strictEqual(missingTitleRes.success, false, 'Expected missing title to fail');
  console.log('✅ Missing title rejected correctly.');

  // 4. Empty / Whitespace Title
  console.log('4. Testing whitespace-only title...');
  const emptyTitleRes = createProjectSchema.safeParse({
    title: '    ',
  });
  assert.strictEqual(emptyTitleRes.success, false, 'Expected whitespace title to fail');
  console.log('✅ Whitespace-only title rejected correctly.');

  // 5. Excessive Title Length (>255 chars)
  console.log('5. Testing excessive title length (>255 chars)...');
  const longTitleRes = createProjectSchema.safeParse({
    title: 'P'.repeat(256),
  });
  assert.strictEqual(longTitleRes.success, false, 'Expected long title to fail');
  console.log('✅ Excessive title length rejected correctly.');

  // 6. Excessive Description Length (>2000 chars)
  console.log('6. Testing excessive description length (>2000 chars)...');
  const longDescRes = createProjectSchema.safeParse({
    title: 'Valid Project Title',
    description: 'D'.repeat(2001),
  });
  assert.strictEqual(longDescRes.success, false, 'Expected long description to fail');
  console.log('✅ Excessive description length rejected correctly.');

  // 7. Invalid Goal UUID Format
  console.log('7. Testing invalid Goal UUID format...');
  const invalidGoalUuidRes = createProjectSchema.safeParse({
    title: 'Valid Project Title',
    goal_id: 'not-a-valid-uuid',
  });
  assert.strictEqual(invalidGoalUuidRes.success, false, 'Expected invalid goal_id UUID to fail');
  console.log('✅ Invalid Goal UUID format rejected correctly.');

  // 8. Invalid Hex Color Accent Format
  console.log('8. Testing invalid hex color accent format...');
  const invalidColorRes = createProjectSchema.safeParse({
    title: 'Valid Project Title',
    color_accent: 'blue',
  });
  assert.strictEqual(invalidColorRes.success, false, 'Expected non-hex color accent to fail');
  console.log('✅ Invalid hex color accent format rejected correctly.');

  // 9. Project Status Enum Validation
  console.log('9. Testing project status enum schema...');
  assert.strictEqual(projectStatusSchema.safeParse('active').success, true);
  assert.strictEqual(projectStatusSchema.safeParse('completed').success, true);
  assert.strictEqual(projectStatusSchema.safeParse('paused').success, true);
  assert.strictEqual(projectStatusSchema.safeParse('archived').success, true);
  assert.strictEqual(projectStatusSchema.safeParse('invalid_status').success, false);
  console.log('✅ Project status enum schema validated correctly.');

  // 10. Partial Update Schema
  console.log('10. Testing partial update schema...');
  const updateRes = updateProjectSchema.safeParse({
    status: 'paused',
    color_accent: '#10b981',
  });
  assert.ok(updateRes.success, 'Expected partial status update to pass');
  console.log('✅ Partial Project update schema validated correctly.');

  console.log('\n================================================================');
  console.log('🎉 ALL PROJECT DOMAIN VALIDATION UNIT TESTS PASSED CLEANLY');
  console.log('================================================================\n');
}

runProjectValidationTests();
