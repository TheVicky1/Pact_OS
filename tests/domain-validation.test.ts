import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  createGoalSchema,
  updateGoalSchema,
  createProjectSchema,
  updateProjectSchema,
  createTaskSchema,
  updateTaskSchema,
  goalStatusSchema,
  projectStatusSchema,
  taskPrioritySchema,
  taskStatusSchema,
  ianaTimezoneSchema,
} from '../src/lib/validations/domain';

async function runDomainValidationTests() {
  console.log('Running Phase 2A Domain Validation & Schema Structural Tests...\n');

  // Test 0: IANA Timezone schema validation
  assert.strictEqual(ianaTimezoneSchema.safeParse('Asia/Kolkata').success, true);
  assert.strictEqual(ianaTimezoneSchema.safeParse('America/New_York').success, true);
  assert.strictEqual(ianaTimezoneSchema.safeParse('Europe/London').success, true);
  assert.strictEqual(ianaTimezoneSchema.safeParse('UTC').success, true);
  assert.strictEqual(ianaTimezoneSchema.safeParse('IST').success, false, 'Abbreviation IST must fail');
  assert.strictEqual(ianaTimezoneSchema.safeParse('PST').success, false, 'Abbreviation PST must fail');
  assert.strictEqual(ianaTimezoneSchema.safeParse('Invalid/Zone').success, false);

  // Test 1: Goal Zod validation
  const validGoalInput = {
    title: '  Master System Security Architecture  ',
    description: 'Establish foundational database RLS boundaries.',
    target_date: '2026-12-31T23:59:59.000Z',
  };
  const goalRes = createGoalSchema.safeParse(validGoalInput);
  assert.strictEqual(goalRes.success, true, 'createGoalSchema failed valid goal input');
  if (goalRes.success) {
    assert.strictEqual(goalRes.data.title, 'Master System Security Architecture', 'Title trimming failed');
  }

  const invalidGoalInput = {
    title: '',
    target_date: 'not-a-date',
  };
  const invalidGoalRes = createGoalSchema.safeParse(invalidGoalInput);
  assert.strictEqual(invalidGoalRes.success, false, 'createGoalSchema allowed invalid goal input');

  // Test 2: Project Zod validation
  const validProjectInput = {
    title: 'Phase 2A Core Domain Migration',
    goal_id: '123e4567-e89b-12d3-a456-426614174000',
    color_accent: '#D4AF37',
  };
  const projectRes = createProjectSchema.safeParse(validProjectInput);
  assert.strictEqual(projectRes.success, true, 'createProjectSchema failed valid project input');

  const invalidProjectColor = {
    title: 'Invalid Color Project',
    color_accent: 'blue-invalid',
  };
  const invalidProjectRes = createProjectSchema.safeParse(invalidProjectColor);
  assert.strictEqual(invalidProjectRes.success, false, 'createProjectSchema allowed invalid hex color');

  // Test 3: Task Zod validation
  const validTaskInput = {
    title: 'Harden PostgreSQL trigger functions',
    deadline_at: '2026-09-10T18:00:00.000Z',
    priority: 'high',
  };
  const taskRes = createTaskSchema.safeParse(validTaskInput);
  assert.strictEqual(taskRes.success, true, 'createTaskSchema failed valid task input');

  const invalidTaskDeadline = {
    title: 'Task with missing deadline',
  };
  const invalidTaskRes = createTaskSchema.safeParse(invalidTaskDeadline);
  assert.strictEqual(invalidTaskRes.success, false, 'createTaskSchema allowed task missing deadline_at');

  // Test 4: Update Schema validation
  const updateGoalRes = updateGoalSchema.safeParse({ status: 'completed' });
  assert.strictEqual(updateGoalRes.success, true);

  const updateProjectRes = updateProjectSchema.safeParse({ status: 'paused' });
  assert.strictEqual(updateProjectRes.success, true);

  const updateTaskRes = updateTaskSchema.safeParse({ status: 'completed' });
  assert.strictEqual(updateTaskRes.success, true);

  // Test 5: Enum values
  assert.strictEqual(goalStatusSchema.safeParse('active').success, true);
  assert.strictEqual(goalStatusSchema.safeParse('invalid_status').success, false);

  assert.strictEqual(projectStatusSchema.safeParse('paused').success, true);
  assert.strictEqual(projectStatusSchema.safeParse('invalid_status').success, false);

  assert.strictEqual(taskPrioritySchema.safeParse('urgent').success, true);
  assert.strictEqual(taskPrioritySchema.safeParse('extreme').success, false);

  assert.strictEqual(taskStatusSchema.safeParse('missed').success, true);
  assert.strictEqual(taskStatusSchema.safeParse('unknown').success, false);

  // Test 5: Migration file structural verification
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260907000000_create_core_domain_tables.sql');
  assert.strictEqual(fs.existsSync(migrationPath), true, 'Phase 2A migration file missing!');

  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  // Verify tables
  assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.goals'), 'Migration missing goals table');
  assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.projects'), 'Migration missing projects table');
  assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.tasks'), 'Migration missing tasks table');

  // Verify RLS enablement
  assert.ok(migrationSql.includes('ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;'), 'Migration missing goals RLS');
  assert.ok(migrationSql.includes('ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;'), 'Migration missing projects RLS');
  assert.ok(migrationSql.includes('ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;'), 'Migration missing tasks RLS');

  // Verify cross-user parent checks in RLS policies
  assert.ok(migrationSql.includes('EXISTS (\n        SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()\n      )') || migrationSql.includes('SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()'), 'Migration missing cross-user parent goal RLS check');
  assert.ok(migrationSql.includes('SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()'), 'Migration missing cross-user parent project RLS check');

  // Verify trusted fields protection trigger and search_path hardening
  assert.ok(migrationSql.includes('CREATE OR REPLACE FUNCTION public.enforce_task_trusted_fields()'), 'Migration missing trusted fields function');
  assert.ok(migrationSql.includes('SET search_path = public'), 'Migration missing SET search_path = public in trigger functions');

  console.log('✅ All Phase 2A Domain Validation & Schema Structural Tests Passed Successfully!');
}

runDomainValidationTests().catch((err) => {
  console.error('❌ Phase 2A Test Suite Failed:', err);
  process.exit(1);
});
