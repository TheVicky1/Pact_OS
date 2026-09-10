import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateExpiredTasks,
  SweeperCandidateTask,
} from '../src/lib/accountability/sweeper';
import { TestClock, isDeadlineReached } from '../src/lib/time';

describe('PACT Phase 5A: Autonomous Deadline Sweeper & Accountability Automation', () => {
  const clock = new TestClock('2026-10-15T18:30:00.000Z');

  // Case 1 & 2: Expired pending & in_progress tasks
  it('transitions expired pending and in_progress tasks to missed', () => {
    const tasks: SweeperCandidateTask[] = [
      {
        id: 'task-pending-expired',
        user_id: 'user-1',
        status: 'pending',
        deadline_at: '2026-10-15T18:00:00.000Z', // 30 min before clock
      },
      {
        id: 'task-inprogress-expired',
        user_id: 'user-1',
        status: 'in_progress',
        deadline_at: '2026-10-15T18:29:59.000Z', // 1 sec before clock
      },
    ];

    const result = evaluateExpiredTasks(tasks, clock);
    assert.equal(result.processedCount, 2);
    assert.deepEqual(result.transitionedTaskIds, [
      'task-pending-expired',
      'task-inprogress-expired',
    ]);
  });

  // Case 3: Completed tasks remain untouched
  it('preserves completed tasks even if deadline has passed', () => {
    const tasks: SweeperCandidateTask[] = [
      {
        id: 'task-completed-early',
        user_id: 'user-1',
        status: 'completed',
        deadline_at: '2026-10-15T18:00:00.000Z',
        completed_at: '2026-10-15T17:30:00.000Z',
      },
    ];

    const result = evaluateExpiredTasks(tasks, clock);
    assert.equal(result.processedCount, 0);
    assert.deepEqual(result.transitionedTaskIds, []);
    assert.deepEqual(result.skippedTaskIds, ['task-completed-early']);
  });

  // Case 4: Archived tasks remain untouched
  it('preserves archived tasks even if deadline has passed', () => {
    const tasks: SweeperCandidateTask[] = [
      {
        id: 'task-archived',
        user_id: 'user-1',
        status: 'archived',
        deadline_at: '2026-10-15T18:00:00.000Z',
      },
    ];

    const result = evaluateExpiredTasks(tasks, clock);
    assert.equal(result.processedCount, 0);
    assert.deepEqual(result.skippedTaskIds, ['task-archived']);
  });

  // Case 5: Future tasks remain untouched
  it('preserves future tasks whose deadline is after current clock instant', () => {
    const tasks: SweeperCandidateTask[] = [
      {
        id: 'task-future',
        user_id: 'user-1',
        status: 'pending',
        deadline_at: '2026-10-15T18:30:01.000Z', // 1 sec in future
      },
      {
        id: 'task-tomorrow',
        user_id: 'user-1',
        status: 'in_progress',
        deadline_at: '2026-10-16T18:30:00.000Z', // 1 day in future
      },
    ];

    const result = evaluateExpiredTasks(tasks, clock);
    assert.equal(result.processedCount, 0);
    assert.deepEqual(result.transitionedTaskIds, []);
    assert.deepEqual(result.skippedTaskIds, ['task-future', 'task-tomorrow']);
  });

  // Case 6 & 7: Tasks with and without commitments
  it('activates attached commitment exactly once for expired tasks', () => {
    const tasks: SweeperCandidateTask[] = [
      {
        id: 'task-without-commitment',
        user_id: 'user-1',
        status: 'pending',
        deadline_at: '2026-10-15T18:00:00.000Z',
        commitment: null,
      },
      {
        id: 'task-with-commitment',
        user_id: 'user-1',
        status: 'pending',
        deadline_at: '2026-10-15T18:00:00.000Z',
        commitment: {
          id: 'commit-101',
          commitment_status: 'committed',
        },
      },
    ];

    const result = evaluateExpiredTasks(tasks, clock);
    assert.equal(result.processedCount, 2);
    assert.equal(result.activatedCount, 1);
    assert.deepEqual(result.activatedCommitmentIds, ['commit-101']);
  });

  // Case 8: Repeated sweeps on already processed tasks are idempotent
  it('guarantees idempotency on repeated sweeps (zero duplicate activations)', () => {
    const alreadyProcessedTasks: SweeperCandidateTask[] = [
      {
        id: 'task-already-missed',
        user_id: 'user-1',
        status: 'missed',
        deadline_at: '2026-10-15T18:00:00.000Z',
        missed_at: '2026-10-15T18:01:00.000Z',
        commitment: {
          id: 'commit-101',
          commitment_status: 'activated', // already activated
        },
      },
    ];

    // Second sweep on same tasks
    const secondSweep = evaluateExpiredTasks(alreadyProcessedTasks, clock);
    assert.equal(secondSweep.processedCount, 0);
    assert.equal(secondSweep.activatedCount, 0);
    assert.deepEqual(secondSweep.transitionedTaskIds, []);
    assert.deepEqual(secondSweep.activatedCommitmentIds, []);
  });

  // Case 9: Concurrency safety (disjoint batch partitioning)
  it('simulates concurrent sweeper workers with batch slicing', () => {
    const candidates: SweeperCandidateTask[] = Array.from({ length: 10 }, (_, i) => ({
      id: `task-${i + 1}`,
      user_id: 'user-1',
      status: 'pending',
      deadline_at: '2026-10-15T18:00:00.000Z',
    }));

    // Worker 1 takes batch size 4
    const worker1 = evaluateExpiredTasks(candidates, clock, 4);
    assert.equal(worker1.processedCount, 4);
    assert.deepEqual(worker1.transitionedTaskIds, ['task-1', 'task-2', 'task-3', 'task-4']);

    // Worker 2 takes remaining batch from index 4 with batch size 4
    const remainingForWorker2 = candidates.slice(4);
    const worker2 = evaluateExpiredTasks(remainingForWorker2, clock, 4);
    assert.equal(worker2.processedCount, 4);
    assert.deepEqual(worker2.transitionedTaskIds, ['task-5', 'task-6', 'task-7', 'task-8']);

    // Disjoint sets: No overlap
    const intersection = worker1.transitionedTaskIds.filter((id) =>
      worker2.transitionedTaskIds.includes(id)
    );
    assert.equal(intersection.length, 0);
  });

  // Case 10: Bounded batch size enforcement
  it('strictly enforces batch size limits to prevent unbounded memory spikes', () => {
    const largeSet: SweeperCandidateTask[] = Array.from({ length: 150 }, (_, i) => ({
      id: `task-${i + 1}`,
      user_id: 'user-1',
      status: 'pending',
      deadline_at: '2026-10-15T18:00:00.000Z',
    }));

    const result = evaluateExpiredTasks(largeSet, clock, 50);
    assert.equal(result.processedCount, 50);
    assert.equal(result.transitionedTaskIds.length, 50);
    assert.equal(result.skippedTaskIds.length, 100);
  });

  // Case 11: Exact boundary instant semantics (now == deadline_at)
  it('evaluates exact deadline boundary instant as reached (now == deadline_at)', () => {
    const exactDeadline = '2026-10-15T18:30:00.000Z';
    assert.equal(isDeadlineReached(exactDeadline, clock), true);

    const exactTask: SweeperCandidateTask[] = [
      {
        id: 'task-exact-boundary',
        user_id: 'user-1',
        status: 'pending',
        deadline_at: exactDeadline,
      },
    ];

    const result = evaluateExpiredTasks(exactTask, clock);
    assert.equal(result.processedCount, 1);
    assert.deepEqual(result.transitionedTaskIds, ['task-exact-boundary']);
  });

  // Case 12: User isolation across multi-tenant candidates
  it('handles multi-tenant candidates without mixing accountability identities', () => {
    const multiTenantTasks: SweeperCandidateTask[] = [
      {
        id: 'task-user-A',
        user_id: 'user-uuid-A',
        status: 'pending',
        deadline_at: '2026-10-15T18:00:00.000Z',
        commitment: { id: 'commit-A', commitment_status: 'committed' },
      },
      {
        id: 'task-user-B',
        user_id: 'user-uuid-B',
        status: 'pending',
        deadline_at: '2026-10-15T18:00:00.000Z',
        commitment: { id: 'commit-B', commitment_status: 'committed' },
      },
    ];

    const result = evaluateExpiredTasks(multiTenantTasks, clock);
    assert.equal(result.processedCount, 2);
    assert.equal(result.activatedCount, 2);
    assert.deepEqual(result.activatedCommitmentIds, ['commit-A', 'commit-B']);
  });

  // Case 13: Timezone invariance
  it('evaluates deadlines in canonical UTC regardless of user local timezone', () => {
    // 18:30 UTC is 2026-10-16 00:00 in Asia/Kolkata (+05:30) and 2026-10-15 14:30 in New York (-04:00)
    // A deadline set for 18:29 UTC has passed at 18:30 UTC for all users globally
    const utcDeadline = '2026-10-15T18:29:00.000Z';
    assert.equal(isDeadlineReached(utcDeadline, clock), true);
  });

  // Case 14: Confidentiality guarantee
  it('guarantees sweeper execution summaries contain zero sensitive consequence data', () => {
    const tasks: SweeperCandidateTask[] = [
      {
        id: 'task-101',
        user_id: 'user-1',
        status: 'pending',
        deadline_at: '2026-10-15T18:00:00.000Z',
        commitment: { id: 'commit-101', commitment_status: 'committed' },
      },
    ];

    const result = evaluateExpiredTasks(tasks, clock);
    const serialized = JSON.stringify(result);

    // Ensure no consequence definitions, action statements, or penalty text exist in the summary
    assert.equal(serialized.includes('action_statement'), false);
    assert.equal(serialized.includes('waiver_token'), false);
    assert.equal(serialized.includes('referee_notes'), false);
  });
});
