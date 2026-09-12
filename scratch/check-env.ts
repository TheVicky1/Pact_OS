import fs from 'node:fs';
import path from 'node:path';

console.log('Checking environment variables...');
console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL ? 'PRESENT' : 'MISSING');
console.log('process.env.POSTGRES_URL:', process.env.POSTGRES_URL ? 'PRESENT' : 'MISSING');
console.log('process.env.SUPABASE_DB_URL:', process.env.SUPABASE_DB_URL ? 'PRESENT' : 'MISSING');

const rootFiles = fs.readdirSync(process.cwd());
console.log('Env files in root:', rootFiles.filter(f => f.startsWith('.env')));
