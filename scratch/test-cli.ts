import { execSync } from 'node:child_process';
import path from 'node:path';

try {
  const supabaseBin = path.join(process.cwd(), 'node_modules', '.bin', 'supabase.cmd');
  console.log('Testing supabaseBin path:', supabaseBin);
  const output = execSync(`"${supabaseBin}" db query --help`, { encoding: 'utf8' });
  console.log(output);
} catch (err: unknown) {
  const e = err as { stdout?: string; stderr?: string };
  console.log('STDOUT:', e.stdout);
  console.log('STDERR:', e.stderr);
}
