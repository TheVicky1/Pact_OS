import assert from 'node:assert';
import {
  consequenceTypeSchema,
  createConsequenceDefinitionSchema,
  updateUserAccountabilityPreferencesSchema,
} from '../src/lib/validations/accountability';

function runAccountabilityValidationTests() {
  console.log('================================================================');
  console.log('  PACT Phase 3 — Accountability Domain Zod Validation Unit Test Suite');
  console.log('================================================================\n');

  // 1. Valid Consequence Definition payload
  console.log('1. Testing valid Consequence Definition creation payload...');
  const validConsequence = createConsequenceDefinitionSchema.parse({
    title: '  No Social Media for 24 Hours  ',
    consequence_type: 'personal_restriction',
    action_statement: '  Log out of all social accounts for 24 hours.  ',
    description: '  Applies to Instagram, Twitter, and TikTok.  ',
    is_enabled: true,
    is_default: true,
  });
  assert.strictEqual(validConsequence.title, 'No Social Media for 24 Hours');
  assert.strictEqual(validConsequence.consequence_type, 'personal_restriction');
  assert.strictEqual(validConsequence.action_statement, 'Log out of all social accounts for 24 hours.');
  assert.strictEqual(validConsequence.description, 'Applies to Instagram, Twitter, and TikTok.');
  assert.strictEqual(validConsequence.is_enabled, true);
  assert.strictEqual(validConsequence.is_default, true);
  console.log('✅ Valid Consequence Definition payload passed and trimmed correctly.');

  // 2. Missing required title
  console.log('2. Testing missing required title...');
  assert.throws(
    () => {
      createConsequenceDefinitionSchema.parse({
        title: '',
        consequence_type: 'reflection',
        action_statement: 'Write reflection log.',
      });
    },
    (err: Error) => err.message.includes('Consequence title is required.')
  );
  console.log('✅ Missing title rejected correctly.');

  // 3. Excessive title length (>255 chars)
  console.log('3. Testing excessive title length (>255 chars)...');
  assert.throws(
    () => {
      createConsequenceDefinitionSchema.parse({
        title: 'A'.repeat(256),
        consequence_type: 'reflection',
        action_statement: 'Write reflection log.',
      });
    },
    (err: Error) => err.message.includes('Consequence title must not exceed 255 characters.')
  );
  console.log('✅ Excessive title length rejected correctly.');

  // 4. Missing required action statement
  console.log('4. Testing missing required action statement...');
  assert.throws(
    () => {
      createConsequenceDefinitionSchema.parse({
        title: 'Daily Reflection',
        consequence_type: 'reflection',
        action_statement: '   ',
      });
    },
    (err: Error) => err.message.includes('Action statement is required.')
  );
  console.log('✅ Missing action statement rejected correctly.');

  // 5. Excessive action statement length (>1000 chars)
  console.log('5. Testing excessive action statement length (>1000 chars)...');
  assert.throws(
    () => {
      createConsequenceDefinitionSchema.parse({
        title: 'Self Improvement Pledge',
        consequence_type: 'self_improvement',
        action_statement: 'X'.repeat(1001),
      });
    },
    (err: Error) => err.message.includes('Action statement must not exceed 1000 characters.')
  );
  console.log('✅ Excessive action statement length rejected correctly.');

  // 6. Invalid consequence type enum
  console.log('6. Testing invalid consequence type enum...');
  assert.throws(() => {
    consequenceTypeSchema.parse('dangerous_command');
  });
  console.log('✅ Invalid consequence type enum rejected correctly.');

  // 7. All supported consequence categories
  console.log('7. Testing all supported consequence categories...');
  const categories = [
    'personal_restriction',
    'extra_responsibility',
    'self_improvement',
    'reflection',
    'financial_declaration',
    'custom',
  ] as const;

  for (const cat of categories) {
    const parsedCat = consequenceTypeSchema.parse(cat);
    assert.strictEqual(parsedCat, cat);
  }
  console.log('✅ All 6 supported consequence categories validated correctly.');

  // 8. User Accountability Preferences schema
  console.log('8. Testing User Accountability Preferences update schema...');
  const prefsUpdate = updateUserAccountabilityPreferencesSchema.parse({
    default_consequence_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    auto_apply_default: true,
    is_enabled: true,
  });
  assert.strictEqual(prefsUpdate.default_consequence_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  assert.strictEqual(prefsUpdate.auto_apply_default, true);
  assert.strictEqual(prefsUpdate.is_enabled, true);
  console.log('✅ User Accountability Preferences schema validated correctly.');

  // 9. Invalid UUID for default_consequence_id
  console.log('9. Testing invalid UUID for default_consequence_id...');
  assert.throws(
    () => {
      updateUserAccountabilityPreferencesSchema.parse({
        default_consequence_id: 'not-a-valid-uuid',
      });
    },
    (err: Error) => err.message.includes('Invalid Consequence UUID format.')
  );
  console.log('✅ Invalid Consequence UUID rejected correctly.');

  console.log('\n================================================================');
  console.log('🎉 ALL ACCOUNTABILITY DOMAIN VALIDATION UNIT TESTS PASSED CLEANLY');
  console.log('================================================================\n');
}

runAccountabilityValidationTests();

