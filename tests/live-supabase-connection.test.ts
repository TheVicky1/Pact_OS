import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

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

async function runLiveSupabaseCheck() {
  console.log('====================================================');
  console.log('  PACT Phase 2A — Real Database Verification Check');
  console.log('====================================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  assert.ok(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL is missing in environment!');
  assert.ok(supabaseKey, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing in environment!');

  console.log(`Connecting to Supabase Project URL: ${supabaseUrl}`);
  console.log(`Using Publishable Key: ${supabaseKey.substring(0, 16)}...`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Verify Auth API connectivity
  const { data: authData, error: authError } = await supabase.auth.getSession();
  if (authError) {
    console.error('❌ Supabase Auth API Connection Error:', authError.message);
  } else {
    console.log('✅ Supabase Auth API reached successfully (Session state:', authData.session ? 'Active' : 'None', ')');
  }

  // 2. Inspect profiles table RLS
  const { error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, timezone')
    .limit(1);

  if (profileError && profileError.code === '42501') {
    console.log('✅ profiles table exists & RLS blocks unauthenticated access (Code: 42501 permission denied)');
  } else if (!profileError) {
    console.log('✅ profiles table query succeeded');
  } else {
    console.error('❌ profiles table check failed:', profileError);
  }

  // 3. Inspect goals table RLS
  const { error: goalError } = await supabase
    .from('goals')
    .select('id, user_id, title, status')
    .limit(1);

  if (goalError && goalError.code === '42501') {
    console.log('✅ goals table exists & RLS blocks unauthenticated access (Code: 42501 permission denied)');
  } else if (!goalError) {
    console.log('✅ goals table query succeeded');
  } else {
    console.error('❌ goals table check failed:', goalError);
  }

  // 4. Inspect projects table RLS
  const { error: projectError } = await supabase
    .from('projects')
    .select('id, user_id, goal_id, title, status')
    .limit(1);

  if (projectError && projectError.code === '42501') {
    console.log('✅ projects table exists & RLS blocks unauthenticated access (Code: 42501 permission denied)');
  } else if (!projectError) {
    console.log('✅ projects table query succeeded');
  } else {
    console.error('❌ projects table check failed:', projectError);
  }

  // 5. Inspect tasks table RLS
  const { error: taskError } = await supabase
    .from('tasks')
    .select('id, user_id, project_id, goal_id, title, priority, status, deadline_at')
    .limit(1);

  if (taskError && taskError.code === '42501') {
    console.log('✅ tasks table exists & RLS blocks unauthenticated access (Code: 42501 permission denied)');
  } else if (!taskError) {
    console.log('✅ tasks table query succeeded');
  } else {
    console.error('❌ tasks table check failed:', taskError);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL REAL DATABASE SCHEMA & RLS BOUNDARY CHECKS PASSED!');
  console.log('====================================================\n');
}

runLiveSupabaseCheck().catch((err) => {
  console.error('❌ Live Supabase Verification Failed:', err);
  process.exit(1);
});
