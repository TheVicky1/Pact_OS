import { execSync } from 'node:child_process';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

async function runAdversarialAuditScript() {
  console.log('================================================================');
  console.log('  PACT Phase 3 — Real Database Adversarial Security Audit');
  console.log('================================================================\n');

  try {
    let rows: Array<{ step: string; status: string }> = [];

    // Prioritize direct pg client using DATABASE_URL from .env.local
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const envContent = fs.readFileSync(envLocalPath, 'utf8');
      const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
      if (dbUrlMatch) {
        const dbUrl = dbUrlMatch[1].trim().replace(/^["']|["']$/g, '');
        const sqlContent = fs.readFileSync(path.join(process.cwd(), 'tests/adversarial-rls-audit.sql'), 'utf8');

        const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
        await client.connect();
        const res = await client.query(sqlContent);
        await client.end();

        const targetRes = Array.isArray(res) ? res.find(r => r.fields && r.fields.some((f: { name: string }) => f.name === 'step')) : res;
        rows = (targetRes?.rows || []) as Array<{ step: string; status: string }>;
      }
    }

    if (rows.length === 0) {
      const rawOutput = execSync('npx supabase db query --linked --file tests/adversarial-rls-audit.sql', {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 60000,
      });

      const jsonMatch = rawOutput.match(/\{[\s\S]*"rows":[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        rows = parsed.rows as Array<{ step: string; status: string }>;
      }
    }


    if (rows.length === 0) {
      throw new Error('No audit steps executed or results returned.');
    }

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

