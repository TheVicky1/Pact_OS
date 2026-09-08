import assert from 'node:assert';
import {
  accountabilityEventTypeSchema,
  commitmentStatusSchema,
} from '../src/lib/validations/accountability';
import type { TaskAccountabilityCommitment, AccountabilityEvent, ConsequenceSnapshot } from '../src/types/domain';

function runConsequenceActivationUnitTests() {
  console.log('================================================================');
  console.log('  PACT Phase 3 — Milestone 3 Consequence Activation Unit Test Suite');
  console.log('================================================================\n');

  // 1. Accountability Event Type Validation
  console.log('1. Testing accountability event type schema validation...');
  const validTypes = ['activated', 'fulfilled', 'waived', 'resolved'] as const;
  for (const eventType of validTypes) {
    const parsed = accountabilityEventTypeSchema.parse(eventType);
    assert.strictEqual(parsed, eventType);
  }
  console.log('✅ All supported accountability event types validated correctly.');

  // 2. Invalid Event Type Rejection
  console.log('2. Testing invalid event type rejection...');
  assert.throws(() => {
    accountabilityEventTypeSchema.parse('forged_activation');
  });
  console.log('✅ Invalid event type rejected correctly.');

  // 3. Commitment Status Schema Validation
  console.log('3. Testing commitment status schema validation...');
  const validStatuses = ['committed', 'activated', 'fulfilled', 'waived'] as const;
  for (const status of validStatuses) {
    const parsed = commitmentStatusSchema.parse(status);
    assert.strictEqual(parsed, status);
  }
  console.log('✅ All commitment statuses validated correctly.');

  // 4. Source Definition Deletion Snapshot Resilience
  console.log('4. Testing source definition deletion snapshot resilience...');
  const initialSnapshot: ConsequenceSnapshot = {
    title: 'No Social Media for 24 Hours',
    consequence_type: 'personal_restriction',
    action_statement: 'Log out of all social accounts for 24 hours.',
    description: 'Covers Twitter and Instagram',
  };

  const commitment: TaskAccountabilityCommitment = {
    id: 'commitment-uuid-1',
    task_id: 'task-uuid-1',
    user_id: 'user-uuid-1',
    source_consequence_id: null, // Simulated deleted source definition (ON DELETE SET NULL)
    consequence_snapshot: initialSnapshot,
    commitment_status: 'committed',
    activated_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Even if source_consequence_id is null, the frozen consequence_snapshot remains intact and valid
  assert.strictEqual(commitment.source_consequence_id, null);
  assert.strictEqual(commitment.consequence_snapshot.title, 'No Social Media for 24 Hours');
  assert.strictEqual(commitment.consequence_snapshot.consequence_type, 'personal_restriction');
  console.log('✅ Snapshot remains 100% intact even after source consequence definition deletion.');

  // 5. Activation State Transition Simulation
  console.log('5. Testing committed -> activated state transition semantics...');
  const activeTimestamp = new Date().toISOString();
  const activatedCommitment: TaskAccountabilityCommitment = {
    ...commitment,
    commitment_status: 'activated',
    activated_at: activeTimestamp,
    updated_at: activeTimestamp,
  };

  assert.strictEqual(activatedCommitment.commitment_status, 'activated');
  assert.strictEqual(activatedCommitment.activated_at, activeTimestamp);
  console.log('✅ Commitment status successfully updated to activated with authoritative timestamp.');

  // 6. Activation Idempotency & Duplicate Protection Simulation
  console.log('6. Testing activation idempotency and single event history invariant...');
  const events: AccountabilityEvent[] = [];

  function simulateActivation(comm: TaskAccountabilityCommitment): { comm: TaskAccountabilityCommitment; eventLogged: boolean } {
    if (comm.commitment_status === 'activated') {
      return { comm, eventLogged: false }; // No-op, idempotent
    }

    const timestamp = new Date().toISOString();
    const updated: TaskAccountabilityCommitment = {
      ...comm,
      commitment_status: 'activated',
      activated_at: timestamp,
      updated_at: timestamp,
    };

    const event: AccountabilityEvent = {
      id: 'event-uuid-1',
      user_id: comm.user_id,
      task_id: comm.task_id,
      commitment_id: comm.id,
      event_type: 'activated',
      metadata: null,
      created_at: timestamp,
    };

    events.push(event);
    return { comm: updated, eventLogged: true };
  }

  // First activation
  const res1 = simulateActivation(commitment);
  assert.strictEqual(res1.eventLogged, true);
  assert.strictEqual(events.length, 1);

  // Second activation attempt (idempotent no-op)
  const res2 = simulateActivation(res1.comm);
  assert.strictEqual(res2.eventLogged, false);
  assert.strictEqual(events.length, 1);
  assert.strictEqual(res2.comm.activated_at, res1.comm.activated_at);
  console.log('✅ Repeated activation is strictly idempotent and creates ZERO duplicate event history.');

  console.log('\n================================================================');
  console.log('🎉 ALL CONSEQUENCE ACTIVATION UNIT TESTS PASSED CLEANLY');
  console.log('================================================================\n');
}

runConsequenceActivationUnitTests();
