import { exec } from 'node:child_process';
import path from 'node:path';

async function main() {
  console.log('Running supabase db query...');
  const sqlFile = path.join(process.cwd(), 'tests', 'adversarial-rls-audit.sql');
  const child = exec(`npx supabase db query --linked --file "${sqlFile}"`, { cwd: process.cwd() });

  child.stdout?.on('data', (d) => console.log('STDOUT:', d.toString()));
  child.stderr?.on('data', (d) => console.log('STDERR:', d.toString()));

  child.on('exit', (code) => {
    console.log('Exited with code:', code);
  });
}

main().catch(console.error);
