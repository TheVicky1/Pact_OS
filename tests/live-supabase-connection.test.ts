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
  console.log('Running Real Supabase Project Connectivity & Database Inspection...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  assert.ok(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL is missing in environment!');
  assert.ok(supabaseKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY / PUBLISHABLE_KEY is missing in environment!');

  console.log(`Connecting to Supabase Project URL: ${supabaseUrl}`);
  console.log(`Using API Key: ${supabaseKey.substring(0, 16)}...`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Verify Auth API connectivity
  const { data: authData, error: authError } = await supabase.auth.getSession();
  if (authError) {
    console.error('❌ Supabase Auth API Connection Error:', authError.message);
  } else {
    console.log('✅ Supabase Auth API reached successfully (Session state:', authData.session ? 'Active' : 'None', ')');
  }

  // 2. Inspect profiles table existence and RLS
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, timezone, created_at, updated_at')
    .limit(1);

  if (profileError) {
    console.log('ℹ️ Profiles table query response:', profileError.code, profileError.message);
    if (profileError.code === '42P01') {
      console.log('⚠️ Profiles table does not exist in the remote database yet. Phase 1 migration needs to be applied.');
    } else if (profileError.code === 'PGRST301' || profileError.message.includes('JWT') || profileError.message.includes('RLS')) {
      console.log('✅ Profiles table exists and RLS properly blocks unauthenticated access!');
    }
  } else {
    console.log('✅ Profiles table query succeeded. Rows returned:', profileData?.length ?? 0);
  }

  console.log('\n✅ Real Supabase Project Connectivity Verification Complete!');
}

runLiveSupabaseCheck().catch((err) => {
  console.error('❌ Live Supabase Verification Failed:', err);
  process.exit(1);
});
