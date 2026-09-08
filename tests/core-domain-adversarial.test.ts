import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createClient, type User } from '@supabase/supabase-js';

// Load .env.local variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
}

async function runAdversarialSecuritySuite() {
  console.log('================================================================');
  console.log('  PACT Phase 2A-SECURITY — Real Supabase Adversarial Audit');
  console.log('================================================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  assert.ok(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL missing');
  assert.ok(supabaseKey, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY missing');

  console.log(`Target Supabase URL: ${supabaseUrl}`);

  const clientA = createClient(supabaseUrl, supabaseKey);
  const clientB = createClient(supabaseUrl, supabaseKey);
  const anonClient = createClient(supabaseUrl, supabaseKey);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const emailA = 'sec_usera_audit_fixed@pact.local';
  const emailB = 'sec_userb_audit_fixed@pact.local';
  const password = 'SecurityTestPassword123!';

  console.log('1. Authenticating User A and User B...');
  let userA: User | null = null;
  let userB: User | null = null;

  // Try sign in User A
  const { data: signInA } = await clientA.auth.signInWithPassword({ email: emailA, password });
  if (signInA?.user) {
    userA = signInA.user;
    console.log(`✅ User A signed in (UUID: ${userA.id})`);
  } else {
    let retries = 3;
    while (retries > 0 && !userA) {
      await delay(2000);
      const { data: signUpA, error: errA } = await clientA.auth.signUp({
        email: emailA,
        password,
        options: { data: { full_name: 'Security User A' } },
      });
      if (signUpA?.user) {
        userA = signUpA.user;
        console.log(`✅ User A registered & authenticated (UUID: ${userA.id})`);
        break;
      }
      if (errA?.message?.includes('rate limit') || errA?.message?.includes('seconds')) {
        console.log(`⏳ Auth rate limit hit for User A registration, waiting 25 seconds...`);
        await delay(25000);
        retries--;
      } else {
        console.error('❌ User A Registration Error:', errA?.message);
        throw errA;
      }
    }
  }

  // Try sign in User B
  const { data: signInB } = await clientB.auth.signInWithPassword({ email: emailB, password });
  if (signInB?.user) {
    userB = signInB.user;
    console.log(`✅ User B signed in (UUID: ${userB.id})`);
  } else {
    let retries = 3;
    while (retries > 0 && !userB) {
      await delay(2000);
      const { data: signUpB, error: errB } = await clientB.auth.signUp({
        email: emailB,
        password,
        options: { data: { full_name: 'Security User B' } },
      });
      if (signUpB?.user) {
        userB = signUpB.user;
        console.log(`✅ User B registered & authenticated (UUID: ${userB.id})\n`);
        break;
      }
      if (errB?.message?.includes('rate limit') || errB?.message?.includes('seconds')) {
        console.log(`⏳ Auth rate limit hit for User B registration, waiting 36 seconds...`);
        await delay(36000);
        retries--;
      } else {
        console.error('❌ User B Registration Error:', errB?.message);
        throw errB;
      }
    }
  }

  if (!userA || !userB) {
    throw new Error('User authentication failed: userA or userB is null');
  }

  // ----------------------------------------------------------------
  // SECTION 2: GOALS SECURITY AUDIT
  // ----------------------------------------------------------------
  console.log('--- SECTION 2: GOALS SECURITY AUDIT ---');

  // 2.1 User A creates Goal A
  console.log('2.1 User A creating Goal A...');
  const { data: goalA, error: goalErrA } = await clientA
    .from('goals')
    .insert({ user_id: userA.id, title: 'User A Goal 1' })
    .select()
    .single();

  assert.strictEqual(goalErrA, null, `Goal A creation failed: ${goalErrA?.message}`);
  assert.ok(goalA, 'Goal A is null');
  console.log(`✅ Goal A created (ID: ${goalA.id})`);

  // 2.2 User B creates Goal B
  console.log('2.2 User B creating Goal B...');
  const { data: goalB, error: goalErrB } = await clientB
    .from('goals')
    .insert({ user_id: userB.id, title: 'User B Goal 1' })
    .select()
    .single();

  assert.strictEqual(goalErrB, null, `Goal B creation failed: ${goalErrB?.message}`);
  assert.ok(goalB, 'Goal B is null');
  console.log(`✅ Goal B created (ID: ${goalB.id})`);

  // 2.3 User A attempts to SELECT User B Goal
  console.log("2.3 ATTACK: User A attempting to read User B's Goal B...");
  const { data: selectGoalB } = await clientA.from('goals').select().eq('id', goalB.id);
  assert.strictEqual(selectGoalB?.length, 0, 'SECURITY VIOLATION: User A read User B Goal!');
  console.log("✅ Cross-User Goal SELECT Blocked!");

  // 2.4 User A attempts to UPDATE User B Goal
  console.log("2.4 ATTACK: User A attempting to modify User B's Goal B...");
  const { data: updateGoalB } = await clientA
    .from('goals')
    .update({ title: 'Hacked Goal Title' })
    .eq('id', goalB.id)
    .select();
  assert.strictEqual(updateGoalB?.length, 0, 'SECURITY VIOLATION: User A updated User B Goal!');
  console.log("✅ Cross-User Goal UPDATE Blocked!");

  // 2.5 User A attempts to DELETE User B Goal
  console.log("2.5 ATTACK: User A attempting to delete User B's Goal B...");
  const { data: deleteGoalB } = await clientA.from('goals').delete().eq('id', goalB.id).select();
  assert.strictEqual(deleteGoalB?.length, 0, 'SECURITY VIOLATION: User A deleted User B Goal!');
  console.log("✅ Cross-User Goal DELETE Blocked!");

  // 2.6 User A attempts to INSERT goal with forged user_id = User B
  console.log("2.6 ATTACK: User A attempting to insert goal with forged user_id = User B...");
  const { data: forgedGoal, error: forgedGoalErr } = await clientA
    .from('goals')
    .insert({ user_id: userB.id, title: 'Forged User B Goal' })
    .select();
  assert.ok(forgedGoalErr || forgedGoal?.length === 0, 'SECURITY VIOLATION: User A inserted goal for User B!');
  console.log("✅ Forged user_id Goal INSERT Blocked!");

  // 2.7 Anonymous access to goals
  console.log("2.7 ATTACK: Anonymous client attempting to query goals...");
  const { data: anonGoalData, error: anonGoalErr } = await anonClient.from('goals').select();
  assert.ok(anonGoalErr || anonGoalData?.length === 0, 'SECURITY VIOLATION: Anonymous client read goals!');
  console.log("✅ Anonymous Goal access Blocked!\n");

  // ----------------------------------------------------------------
  // SECTION 3: PROJECTS PARENT OWNERSHIP & SECURITY AUDIT
  // ----------------------------------------------------------------
  console.log('--- SECTION 3: PROJECTS PARENT OWNERSHIP & SECURITY AUDIT ---');

  // 3.1 User A creates valid Project A linked to Goal A
  console.log('3.1 User A creating Project A linked to Goal A...');
  const { data: projectA, error: projErrA } = await clientA
    .from('projects')
    .insert({ user_id: userA.id, goal_id: goalA.id, title: 'User A Project 1' })
    .select()
    .single();

  assert.strictEqual(projErrA, null, `Project A creation failed: ${projErrA?.message}`);
  console.log(`✅ Project A created (ID: ${projectA.id})`);

  // 3.2 ATTACK: User A attempts to create project linked to User B's Goal B
  console.log("3.2 ATTACK: User A creating project linked to User B's Goal B...");
  const { data: attackProj, error: attackProjErr } = await clientA
    .from('projects')
    .insert({ user_id: userA.id, goal_id: goalB.id, title: 'Project Linked To Other User Goal' })
    .select();

  assert.ok(attackProjErr || attackProj?.length === 0, 'SECURITY VIOLATION: User A linked project to User B Goal!');
  console.log("✅ Cross-User Parent Goal Linkage on Project INSERT Blocked!");

  // 3.3 ATTACK: User A attempts to UPDATE Project A setting goal_id = User B's Goal B
  console.log("3.3 ATTACK: User A updating Project A setting goal_id = User B's Goal B...");
  const { data: updateProjAttack, error: updateProjAttackErr } = await clientA
    .from('projects')
    .update({ goal_id: goalB.id })
    .eq('id', projectA.id)
    .select();

  assert.ok(updateProjAttackErr || updateProjAttack?.length === 0, 'SECURITY VIOLATION: User A updated project goal_id to User B Goal!');
  console.log("✅ Cross-User Parent Goal Linkage on Project UPDATE Blocked!");

  // 3.4 User B attempts to read User A Project A
  console.log("3.4 ATTACK: User B attempting to read User A's Project A...");
  const { data: selectProjA } = await clientB.from('projects').select().eq('id', projectA.id);
  assert.strictEqual(selectProjA?.length, 0, 'SECURITY VIOLATION: User B read User A Project!');
  console.log("✅ Cross-User Project SELECT Blocked!\n");

  // ----------------------------------------------------------------
  // SECTION 4: TASKS PARENT OWNERSHIP & SECURITY AUDIT
  // ----------------------------------------------------------------
  console.log('--- SECTION 4: TASKS PARENT OWNERSHIP & SECURITY AUDIT ---');

  // 4.1 User A creates valid Task A
  console.log('4.1 User A creating Task A linked to Project A & Goal A...');
  const { data: taskA, error: taskErrA } = await clientA
    .from('tasks')
    .insert({
      user_id: userA.id,
      project_id: projectA.id,
      goal_id: goalA.id,
      title: 'User A Task 1',
      deadline_at: new Date(Date.now() + 86400000).toISOString(),
    })
    .select()
    .single();

  assert.strictEqual(taskErrA, null, `Task A creation failed: ${taskErrA?.message}`);
  console.log(`✅ Task A created (ID: ${taskA.id})`);

  // 4.2 User B creates valid Project B
  const { data: projectB } = await clientB
    .from('projects')
    .insert({ user_id: userB.id, title: 'User B Project 1' })
    .select()
    .single();

  // 4.3 ATTACK: User A attempts to create task linked to User B's Project B
  console.log("4.3 ATTACK: User A creating task linked to User B's Project B...");
  const { data: attackTaskProj, error: attackTaskProjErr } = await clientA
    .from('tasks')
    .insert({
      user_id: userA.id,
      project_id: projectB.id,
      title: 'Task Linked to Other User Project',
      deadline_at: new Date(Date.now() + 86400000).toISOString(),
    })
    .select();

  assert.ok(attackTaskProjErr || attackTaskProj?.length === 0, 'SECURITY VIOLATION: User A linked task to User B Project!');
  console.log("✅ Cross-User Parent Project Linkage on Task INSERT Blocked!");

  // 4.4 ATTACK: User A attempts to create task linked to User B's Goal B
  console.log("4.4 ATTACK: User A creating task linked to User B's Goal B...");
  const { data: attackTaskGoal, error: attackTaskGoalErr } = await clientA
    .from('tasks')
    .insert({
      user_id: userA.id,
      goal_id: goalB.id,
      title: 'Task Linked to Other User Goal',
      deadline_at: new Date(Date.now() + 86400000).toISOString(),
    })
    .select();

  assert.ok(attackTaskGoalErr || attackTaskGoal?.length === 0, 'SECURITY VIOLATION: User A linked task to User B Goal!');
  console.log("✅ Cross-User Parent Goal Linkage on Task INSERT Blocked!");

  // 4.5 ATTACK: User A attempts to UPDATE Task A to link to User B's Project B
  console.log("4.5 ATTACK: User A updating Task A setting project_id = User B's Project B...");
  const { data: updateTaskProjAttack, error: updateTaskProjAttackErr } = await clientA
    .from('tasks')
    .update({ project_id: projectB.id })
    .eq('id', taskA.id)
    .select();

  assert.ok(updateTaskProjAttackErr || updateTaskProjAttack?.length === 0, 'SECURITY VIOLATION: User A updated task project_id to User B Project!');
  console.log("✅ Cross-User Parent Project Linkage on Task UPDATE Blocked!");

  // 4.6 User B attempts to read/update/delete User A Task A
  console.log("4.6 ATTACK: User B attempting to read User A's Task A...");
  const { data: selectTaskA } = await clientB.from('tasks').select().eq('id', taskA.id);
  assert.strictEqual(selectTaskA?.length, 0, 'SECURITY VIOLATION: User B read User A Task!');
  console.log("✅ Cross-User Task SELECT Blocked!\n");

  // ----------------------------------------------------------------
  // SECTION 5: TRUSTED LIFECYCLE FIELD FORGERY AUDIT (UPDATE & INSERT)
  // ----------------------------------------------------------------
  console.log('--- SECTION 5: TRUSTED LIFECYCLE FIELD FORGERY AUDIT ---');

  // 5.1 UPDATE FORGERY TEST: User A attempts to UPDATE completed_at directly
  console.log('5.1 UPDATE FORGERY TEST: User A attempting to directly UPDATE completed_at on Task A...');
  const nowIso = new Date().toISOString();
  const { error: updateCompletedErr } = await clientA
    .from('tasks')
    .update({ completed_at: nowIso })
    .eq('id', taskA.id)
    .select();

  assert.ok(updateCompletedErr, 'EXPECTED DENIAL: Direct UPDATE of completed_at succeeded when it MUST be blocked!');
  console.log(`✅ UPDATE completed_at Forgery Blocked! (Trigger Error: "${updateCompletedErr.message}")`);

  // 5.2 UPDATE FORGERY TEST: User A attempts to UPDATE missed_at directly
  console.log('5.2 UPDATE FORGERY TEST: User A attempting to directly UPDATE missed_at on Task A...');
  const { error: updateMissedErr } = await clientA
    .from('tasks')
    .update({ missed_at: nowIso })
    .eq('id', taskA.id)
    .select();

  assert.ok(updateMissedErr, 'EXPECTED DENIAL: Direct UPDATE of missed_at succeeded when it MUST be blocked!');
  console.log(`✅ UPDATE missed_at Forgery Blocked! (Trigger Error: "${updateMissedErr.message}")`);

  // 5.3 INSERT FORGERY TEST: User A attempts to INSERT task with completed_at directly set
  console.log('5.3 INSERT FORGERY TEST: User A attempting to INSERT a new task with completed_at directly set...');
  const { error: insertCompletedErr } = await clientA
    .from('tasks')
    .insert({
      user_id: userA.id,
      title: 'Task Forged Insert Completed',
      deadline_at: new Date(Date.now() + 86400000).toISOString(),
      completed_at: nowIso,
    })
    .select();

  assert.ok(insertCompletedErr, 'EXPECTED DENIAL: Direct INSERT of completed_at succeeded when it MUST be blocked!');
  console.log(`✅ INSERT completed_at Forgery Blocked! (Trigger Error: "${insertCompletedErr.message}")`);

  // 5.4 INSERT FORGERY TEST: User A attempts to INSERT task with missed_at directly set
  console.log('5.4 INSERT FORGERY TEST: User A attempting to INSERT a new task with missed_at directly set...');
  const { error: insertMissedErr } = await clientA
    .from('tasks')
    .insert({
      user_id: userA.id,
      title: 'Task Forged Insert Missed',
      deadline_at: new Date(Date.now() + 86400000).toISOString(),
      missed_at: nowIso,
    })
    .select();

  assert.ok(insertMissedErr, 'EXPECTED DENIAL: Direct INSERT of missed_at succeeded when it MUST be blocked!');
  console.log(`✅ INSERT missed_at Forgery Blocked! (Trigger Error: "${insertMissedErr.message}")`);

  console.log('\n================================================================');
  console.log('🎉 REAL SUPABASE ADVERSARIAL SECURITY SUITE COMPLETED');
  console.log('================================================================\n');
}

runAdversarialSecuritySuite().catch((err) => {
  console.error('❌ Adversarial Security Suite Failed:', err);
  process.exit(1);
});
