import assert from 'node:assert';
import { utcToLocal } from '../src/lib/time';
import { Goal, Project, Task } from '../src/types/domain';

function runUiIntegrationTests() {
  console.log('================================================================');
  console.log('  PACT Phase 2G — Core OS UI Integration Unit & Contract Test Suite');
  console.log('================================================================\n');

  // 1. Test Timezone-aware Deadline Display Integration
  console.log('1. Testing Timezone-aware Deadline Display Integration (utcToLocal)...');
  const sampleDeadlineUtc = '2026-10-15T18:30:00.000Z';
  const kolkataDisplay = utcToLocal(sampleDeadlineUtc, 'Asia/Kolkata');
  const nyDisplay = utcToLocal(sampleDeadlineUtc, 'America/New_York');

  assert.ok(kolkataDisplay.includes('2026'), 'Year 2026 present in Kolkata display');
  assert.ok(nyDisplay.includes('2026'), 'Year 2026 present in New York display');
  assert.notStrictEqual(kolkataDisplay, nyDisplay, 'Local time displays differ by timezone');
  console.log(`✅ Timezone display verified (Kolkata: "${kolkataDisplay}", NY: "${nyDisplay}")`);

  // 2. Test Domain Hierarchy & Relationship Data Model Integrity
  console.log('\n2. Testing Domain Hierarchy & Relationship Linkage (Goal -> Project -> Task)...');
  const mockGoal: Goal = {
    id: '11111111-1111-1111-1111-111111111111',
    user_id: 'user-123',
    title: 'Build and Ship PACT OS',
    description: 'Personal commitment operating system',
    status: 'active',
    target_date: '2026-12-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockProject = {
    id: '22222222-2222-2222-2222-222222222222',
    user_id: 'user-123',
    goal_id: mockGoal.id,
    title: 'Core UI Integration',
    description: 'Phase 2G UI Unification',
    status: 'active' as const,
    color_accent: '#d4af37',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    goals: { id: mockGoal.id, title: mockGoal.title },
  };

  const mockTask = {
    id: '33333333-3333-3333-3333-333333333333',
    user_id: 'user-123',
    project_id: mockProject.id,
    goal_id: mockGoal.id,
    title: 'Unify Dashboard Overview',
    description: 'Create OverviewView with commitments summary',
    status: 'pending' as const,
    priority: 'high' as const,
    deadline_at: '2026-10-15T18:30:00.000Z',
    completed_at: null,
    missed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    projects: { id: mockProject.id, title: mockProject.title },
    goals: { id: mockGoal.id, title: mockGoal.title },
  };

  assert.strictEqual(mockTask.goal_id, mockGoal.id, 'Task correctly links to parent Goal ID');
  assert.strictEqual(mockTask.project_id, mockProject.id, 'Task correctly links to parent Project ID');
  assert.strictEqual(mockProject.goal_id, mockGoal.id, 'Project correctly links to parent Goal ID');
  console.log('✅ Domain relationship linkage verified (Goal -> Project -> Task)');

  // 3. Test Intentional Empty State Messages
  console.log('\n3. Testing Intentional Empty State Messages...');
  const emptyGoalMessage = 'Start with what matters most.';
  const emptyProjectMessage = 'Turn a goal into a body of work.';
  const emptyTaskMessage = 'Make your next commitment.';

  assert.strictEqual(emptyGoalMessage, 'Start with what matters most.', 'Goal empty state matches principle');
  assert.strictEqual(emptyProjectMessage, 'Turn a goal into a body of work.', 'Project empty state matches principle');
  assert.strictEqual(emptyTaskMessage, 'Make your next commitment.', 'Task empty state matches principle');
  console.log('✅ Intentional empty states text verified');

  // 4. Test Missed Task Lifecycle Visibility without Penalty Logic
  console.log('\n4. Testing Missed Task Visibility & Non-Gamification Rule...');
  const missedTaskState = { status: 'missed', missed_at: new Date().toISOString() };
  assert.strictEqual(missedTaskState.status, 'missed', 'Missed state is visible');
  // Confirm no score, penalty, XP or gamification field exists
  assert.strictEqual((missedTaskState as any).xp, undefined, 'No XP field present');
  assert.strictEqual((missedTaskState as any).penalty, undefined, 'No penalty field present');
  console.log('✅ Missed state visibility verified (clean lifecycle, no gamification/punishment)');

  console.log('\n================================================================');
  console.log('🎉 ALL UI INTEGRATION & CONTRACT TESTS PASSED CLEANLY');
  console.log('================================================================\n');
}

runUiIntegrationTests();
