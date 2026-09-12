import fs from 'node:fs';
import path from 'node:path';

const tempDir = path.join(process.cwd(), 'supabase', '.temp');
if (fs.existsSync(tempDir)) {
  console.log('Contents of supabase/.temp:', fs.readdirSync(tempDir));
  for (const f of fs.readdirSync(tempDir)) {
    const p = path.join(tempDir, f);
    if (fs.statSync(p).isFile()) {
      console.log(`File ${f}:`, fs.readFileSync(p, 'utf8').slice(0, 300));
    }
  }
}
