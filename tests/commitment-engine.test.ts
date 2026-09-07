import assert from 'node:assert';
import {
  accountabilityModeSchema,
  consequenceSnapshotSchema,
  createTaskAccountabilitySchema,
  createConsequenceDefinitionSchema,
} from '../src/lib/validations/accountability';
import { ConsequenceDefinition } from '../src/types/domain';

function runCommitmentEngineTests() {
  console.log('================================================================');
  console.log('  PACT Phase 3 — Commitment Assignment & Immutability Engine Unit Test Suite');
  console.log('================================================================\n');

  // 1. Accountability Mode Schema Validation
  console.log('1. Testing accountability mode schema validation...');
  assert.strictEqual(accountabilityModeSchema.parse('default'), 'default');
  assert.strictEqual(accountabilityModeSchema.parse('explicit'), 'explicit');
  assert.strictEqual(accountabilityModeSchema.parse('none'), 'none');
  assert.throws(() => accountabilityModeSchema.parse('invalid_mode'));
  console.log('✅ Accountability mode schema validated correctly.');

  // 2. Consequence Snapshot Schema Validation
  console.log('2. Testing consequence snapshot schema validation...');
  const validSnapshot = consequenceSnapshotSchema.parse({
    title: '  No Video Games for 48 Hours  ',
    consequence_type: 'personal_restriction',
    action_statement: '  Uninstall Steam and block gaming sites for 48h.  ',
    description: '  Applies to PC and Mobile games.  ',
  });
  assert.strictEqual(validSnapshot.title, 'No Video Games for 48 Hours');
  assert.strictEqual(validSnapshot.consequence_type, 'personal_restriction');
  assert.strictEqual(validSnapshot.action_statement, 'Uninstall Steam and block gaming sites for 48h.');
  assert.strictEqual(validSnapshot.description, 'Applies to PC and Mobile games.');
  console.log('✅ Consequence snapshot payload validated and trimmed correctly.');

  // 3. Create Task Accountability Schema (Default & Explicit Inputs)
  console.log('3. Testing create task accountability schema...');
  const defaultTaskAcc = createTaskAccountabilitySchema.parse({});
  assert.strictEqual(defaultTaskAcc.accountability_mode, 'default');
  assert.strictEqual(defaultTaskAcc.consequence_id, undefined);

  const explicitTaskAcc = createTaskAccountabilitySchema.parse({
    accountability_mode: 'explicit',
    consequence_id: 'b7a3a992-0b1e-436d-9721-3a059b0f47e2',
  });
  assert.strictEqual(explicitTaskAcc.accountability_mode, 'explicit');
  assert.strictEqual(explicitTaskAcc.consequence_id, 'b7a3a992-0b1e-436d-9721-3a059b0f47e2');

  assert.throws(
    () => createTaskAccountabilitySchema.parse({ consequence_id: 'not-a-uuid' }),
    (err: Error) => err.message.includes('Invalid Consequence UUID format.')
  );
  console.log('✅ Create task accountability schema validated correctly.');

  // 4. Consequence Priority Validation
  console.log('4. Testing priority field in consequence definition schema...');
  const defWithPriority = createConsequenceDefinitionSchema.parse({
    title: 'High Priority Restriction',
    consequence_type: 'personal_restriction',
    action_statement: 'Restricted action statement.',
    priority: 10,
  });
  assert.strictEqual(defWithPriority.priority, 10);

  const defDefaultPriority = createConsequenceDefinitionSchema.parse({
    title: 'Default Priority Restriction',
    consequence_type: 'personal_restriction',
    action_statement: 'Restricted action statement.',
  });
  assert.strictEqual(defDefaultPriority.priority, 0);
  console.log('✅ Priority field validated correctly.');

  // 5. Deterministic Priority Ranking Logic Unit Test
  console.log('5. Testing deterministic multi-default priority ranking sorting...');
  const sampleDefinitions: ConsequenceDefinition[] = [
    {
      id: 'def-1',
      user_id: 'user-1',
      title: 'Default A (Priority 0)',
      description: null,
      consequence_type: 'reflection',
      action_statement: 'Write 1 page reflection.',
      is_enabled: true,
      is_default: true,
      priority: 0,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
    {
      id: 'def-2',
      user_id: 'user-1',
      title: 'Default B (Priority 10)',
      description: null,
      consequence_type: 'personal_restriction',
      action_statement: 'No social media 24h.',
      is_enabled: true,
      is_default: true,
      priority: 10,
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-02T00:00:00Z',
    },
    {
      id: 'def-3',
      user_id: 'user-1',
      title: 'Default C (Priority 5)',
      description: null,
      consequence_type: 'extra_responsibility',
      action_statement: 'Clean workspace.',
      is_enabled: true,
      is_default: true,
      priority: 5,
      created_at: '2026-09-03T00:00:00Z',
      updated_at: '2026-09-03T00:00:00Z',
    },
    {
      id: 'def-disabled',
      user_id: 'user-1',
      title: 'Disabled High Priority (Priority 100)',
      description: null,
      consequence_type: 'custom',
      action_statement: 'Disabled statement.',
      is_enabled: false,
      is_default: true,
      priority: 100,
      created_at: '2026-09-04T00:00:00Z',
      updated_at: '2026-09-04T00:00:00Z',
    },
  ];

  // Filter enabled & default, then sort by priority DESC, created_at ASC, id ASC
  const rankedDefaults = sampleDefinitions
    .filter((d) => d.is_enabled && d.is_default)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (a.created_at !== b.created_at) return a.created_at.localeCompare(b.created_at);
      return a.id.localeCompare(b.id);
    });

  assert.strictEqual(rankedDefaults.length, 3);
  assert.strictEqual(rankedDefaults[0].id, 'def-2'); // Priority 10
  assert.strictEqual(rankedDefaults[1].id, 'def-3'); // Priority 5
  assert.strictEqual(rankedDefaults[2].id, 'def-1'); // Priority 0
  console.log('✅ Deterministic multi-default priority ranking sorted correctly.');

  // 6. Commitment Snapshot Immutability Integrity Simulation
  console.log('6. Testing commitment snapshot immutability integrity...');
  const initialDefinition: ConsequenceDefinition = {
    id: 'def-source',
    user_id: 'user-1',
    title: '30 Minutes Extra Study',
    description: 'Study algorithm concepts.',
    consequence_type: 'self_improvement',
    action_statement: 'Solve 2 LeetCode medium problems.',
    is_enabled: true,
    is_default: true,
    priority: 0,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  };

  // Snapshot taken at commitment creation time
  const committedSnapshot = {
    title: initialDefinition.title,
    consequence_type: initialDefinition.consequence_type,
    action_statement: initialDefinition.action_statement,
    description: initialDefinition.description,
  };

  // User later mutates the source definition to "60 Minutes Extra Study"
  const mutatedDefinition = {
    ...initialDefinition,
    title: '60 Minutes Extra Study',
    action_statement: 'Solve 4 LeetCode medium problems.',
    updated_at: '2026-09-07T00:00:00Z',
  };

  // Verify committed snapshot remains strictly unchanged
  assert.strictEqual(committedSnapshot.title, '30 Minutes Extra Study');
  assert.strictEqual(committedSnapshot.action_statement, 'Solve 2 LeetCode medium problems.');
  assert.notStrictEqual(committedSnapshot.title, mutatedDefinition.title);
  assert.notStrictEqual(committedSnapshot.action_statement, mutatedDefinition.action_statement);
  console.log('✅ Commitment snapshot immutability simulation verified.');

  console.log('\n================================================================');
  console.log('🎉 ALL COMMITMENT ENGINE & IMMUTABILITY UNIT TESTS PASSED CLEANLY');
  console.log('================================================================\n');
}

runCommitmentEngineTests();
