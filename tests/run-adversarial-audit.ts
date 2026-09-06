import { execSync } from 'node:child_process';
import assert from 'node:assert';

async function runAdversarialAuditScript() {
  console.log('================================================================');
  console.log('  PACT Phase 2F — Real Database Adversarial Security Audit');
  console.log('================================================================\n');

  try {
    const rawOutput = execSync('npx supabase db query --linked --file tests/adversarial-rls-audit.sql', {
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    // Parse JSON result from output
    const jsonMatch = rawOutput.match(/\{[\s\S]*"rows":[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse Supabase CLI output:\n', rawOutput);
      process.exit(1);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const rows = parsed.rows as Array<{ step: string; status: string }>;

    let passCount = 0;
    for (const row of rows) {
      assert.strictEqual(row.status, 'PASS', `Security test failed at step: ${row.step}`);
      console.log(`✅ ${row.step}`);
      passCount++;
    }

    console.log(`\n================================================================`);
    console.log(`🎉 ALL ${passCount} REAL DATABASE ADVERSARIAL SECURITY AUDIT CHECKS PASSED CLEANLY`);
    console.log(`================================================================\n`);
  } catch (err) {
    console.error('❌ Adversarial Database Security Audit Failed:', err);
    process.exit(1);
  }
}

runAdversarialAuditScript();
