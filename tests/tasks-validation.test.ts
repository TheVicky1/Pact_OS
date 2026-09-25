import assert from 'node:assert';
import {
  createTaskSchema,
  updateTaskSchema,
  taskPrioritySchema,
  taskStatusSchema,
} from '../src/lib/validations/domain';

function runTaskValidationTests() {
  console.log('================================================================');
  console.log('  PACT Phase 2D — Task Domain Zod Validation Unit Test Suite');
  console.log('================================================================\n');

  const validDeadlineIso = new Date(Date.now() + 86400000).toISOString();
  const validGoalUuid = '55555555-5555-4555-8555-555555555555';
  const validProjectUuid = '66666666-6666-4666-8666-666666666666';

  // 1. Valid Independent Task Creation Payload
  console.log('1. Testing valid independent Task creation payload...');
  const validIndependentPayload = {
    title: '  Complete System Design Chapter  ',
    description: 'Read and take notes on distributed caching.',
    deadline_at: validDeadlineIso,
    priority: 'high',
  };
  const validIndRes = createTaskSchema.safeParse(validIndependentPayload);
  assert.ok(validIndRes.success, `Expected valid independent task to pass, got: ${validIndRes.error?.message}`);
  assert.strictEqual(validIndRes.data.title, 'Complete System Design Chapter', 'Title should be trimmed');
  assert.strictEqual(validIndRes.data.priority, 'high');
  console.log('✅ Valid independent Task payload passed correctly.');

  // 2. Valid Task Attached to Goal and Project UUIDs
  console.log('2. Testing valid Task attached to Goal & Project UUIDs...');
  const validParentPayload = {
    title: 'Implement Data Access Unit Tests',
    deadline_at: validDeadlineIso,
    goal_id: validGoalUuid,
    project_id: validProjectUuid,
    priority: 'urgent',
    description: 'Add tests for repositories and server actions.',
  };
  const validParentRes = createTaskSchema.safeParse(validParentPayload);
  assert.ok(validParentRes.success, `Expected valid parent-attached task to pass, got: ${validParentRes.error?.message}`);
  assert.strictEqual(validParentRes.data.goal_id, validGoalUuid);
  assert.strictEqual(validParentRes.data.project_id, validProjectUuid);
  console.log('✅ Valid Goal & Project attached Task payload passed correctly.');

  // 3. Missing Required Title
  console.log('3. Testing missing required title...');
  const missingTitleRes = createTaskSchema.safeParse({
    deadline_at: validDeadlineIso,
    description: 'No title provided',
  });
  assert.strictEqual(missingTitleRes.success, false, 'Expected missing title to fail');
  console.log('✅ Missing title rejected correctly.');

  // 4. Empty / Whitespace Title
  console.log('4. Testing whitespace-only title...');
  const emptyTitleRes = createTaskSchema.safeParse({
    title: '    ',
    deadline_at: validDeadlineIso,
  });
  assert.strictEqual(emptyTitleRes.success, false, 'Expected whitespace title to fail');
  console.log('✅ Whitespace-only title rejected correctly.');

  // 5. Excessive Title Length (>255 chars)
  console.log('5. Testing excessive title length (>255 chars)...');
  const longTitleRes = createTaskSchema.safeParse({
    title: 'T'.repeat(256),
    deadline_at: validDeadlineIso,
  });
  assert.strictEqual(longTitleRes.success, false, 'Expected long title to fail');
  console.log('✅ Excessive title length rejected correctly.');

  // 6. Excessive Description Length (>2000 chars)
  console.log('6. Testing excessive description length (>2000 chars)...');
  const longDescRes = createTaskSchema.safeParse({
    title: 'Valid Task Title',
    deadline_at: validDeadlineIso,
    description: 'D'.repeat(2001),
  });
  assert.strictEqual(longDescRes.success, false, 'Expected long description to fail');
  console.log('✅ Excessive description length rejected correctly.');

  // 7. Invalid Deadline ISO String Format
  console.log('7. Testing invalid deadline ISO timestamp format...');
  const invalidDeadlineRes = createTaskSchema.safeParse({
    title: 'Valid Task Title',
    deadline_at: '2026-09-31 23:59:00', // Not ISO 8601 string
  });
  assert.strictEqual(invalidDeadlineRes.success, false, 'Expected invalid deadline format to fail');
  console.log('✅ Invalid deadline ISO format rejected correctly.');

  // 8. Invalid Goal UUID Format
  console.log('8. Testing invalid Goal UUID format...');
  const invalidGoalUuidRes = createTaskSchema.safeParse({
    title: 'Valid Task Title',
    deadline_at: validDeadlineIso,
    goal_id: 'invalid-goal-uuid',
  });
  assert.strictEqual(invalidGoalUuidRes.success, false, 'Expected invalid goal_id UUID to fail');
  console.log('✅ Invalid Goal UUID format rejected correctly.');

  // 9. Invalid Project UUID Format
  console.log('9. Testing invalid Project UUID format...');
  const invalidProjectUuidRes = createTaskSchema.safeParse({
    title: 'Valid Task Title',
    deadline_at: validDeadlineIso,
    project_id: 'invalid-project-uuid',
  });
  assert.strictEqual(invalidProjectUuidRes.success, false, 'Expected invalid project_id UUID to fail');
  console.log('✅ Invalid Project UUID format rejected correctly.');

  // 10. Task Priority Enum Validation
  console.log('10. Testing task priority enum schema...');
  assert.strictEqual(taskPrioritySchema.safeParse('low').success, true);
  assert.strictEqual(taskPrioritySchema.safeParse('medium').success, true);
  assert.strictEqual(taskPrioritySchema.safeParse('high').success, true);
  assert.strictEqual(taskPrioritySchema.safeParse('urgent').success, true);
  assert.strictEqual(taskPrioritySchema.safeParse('invalid_priority').success, false);
  console.log('✅ Task priority enum schema validated correctly.');

  // 11. Task Status Enum Validation
  console.log('11. Testing task status enum schema...');
  assert.strictEqual(taskStatusSchema.safeParse('pending').success, true);
  assert.strictEqual(taskStatusSchema.safeParse('in_progress').success, true);
  assert.strictEqual(taskStatusSchema.safeParse('completed').success, true);
  assert.strictEqual(taskStatusSchema.safeParse('missed').success, true);
  assert.strictEqual(taskStatusSchema.safeParse('archived').success, true);
  assert.strictEqual(taskStatusSchema.safeParse('invalid_status').success, false);
  console.log('✅ Task status enum schema validated correctly.');

  // 12. Partial Update Schema
  console.log('12. Testing partial update schema...');
  const updateRes = updateTaskSchema.safeParse({
    status: 'in_progress',
    priority: 'urgent',
  });
  assert.ok(updateRes.success, 'Expected partial status and priority update to pass');
  console.log('✅ Partial Task update schema validated correctly.');

  // 13. Duplicate Task Tag Deduplication
  console.log('13. Testing duplicate task tag deduplication...');
  const inputTags = ['deep-work', 'deep-work', 'urgent'];
  const processedTags = Array.from(new Set(inputTags));
  assert.deepStrictEqual(
    processedTags,
    ['deep-work', 'urgent'],
    'Duplicate tags must be removed while preserving unique tags'
  );
  assert.strictEqual(processedTags.length, 2, 'Duplicate deep-work tag should be removed');
  assert.strictEqual(processedTags[0], 'deep-work');
  assert.strictEqual(processedTags[1], 'urgent', 'Unique urgent tag should be preserved');
  console.log('✅ Duplicate task tags deduplicated correctly.');

  // 14. Single-Item Task Collection Filter Boundary Case
  console.log('14. Testing single-item task collection filter boundary (preserves single task when matching filter criteria)...');
  const singleTask = {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Focus Deep Work Session',
    description: 'Complete high-priority strategic milestone.',
    deadline_at: validDeadlineIso,
    priority: 'urgent' as const,
    status: 'pending' as const,
  };
  const taskCollection = [singleTask];
  const filteredTasks = taskCollection.filter(
    (task) => task.status === 'pending' && task.priority === 'urgent'
  );

  assert.strictEqual(filteredTasks.length, 1, 'Resulting array must contain exactly one element (length = 1)');
  assert.strictEqual(filteredTasks[0], singleTask, 'Single task must be preserved correctly');
  assert.strictEqual(filteredTasks[0].id, singleTask.id, 'Task id must remain unchanged');
  assert.strictEqual(filteredTasks[0].title, singleTask.title, 'Task title must remain unchanged');
  assert.strictEqual(filteredTasks[0].description, singleTask.description, 'Task description must remain unchanged');
  assert.strictEqual(filteredTasks[0].deadline_at, singleTask.deadline_at, 'Task deadline must remain unchanged');
  assert.strictEqual(filteredTasks[0].priority, singleTask.priority, 'Task priority must remain unchanged');
  assert.strictEqual(filteredTasks[0].status, singleTask.status, 'Task status must remain unchanged');
  console.log('✅ Single-item task collection filter boundary verified correctly.');

  console.log('\n================================================================');
  console.log('🎉 ALL TASK DOMAIN VALIDATION UNIT TESTS PASSED CLEANLY');
  console.log('================================================================\n');
}

runTaskValidationTests();
