import fs from 'node:fs';
import path from 'node:path';

const userProfile = process.env.USERPROFILE || 'C:\\Users\\Vicky Patel';
const configDir = path.join(userProfile, '.config', 'supabase');

console.log('Checking Supabase config dir:', configDir);
if (fs.existsSync(configDir)) {
  console.log('Files in .config/supabase:', fs.readdirSync(configDir));
} else {
  console.log('.config/supabase does not exist');
}

const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\Vicky Patel\\AppData\\Local';
const localSupabase = path.join(localAppData, 'supabase');
console.log('Checking LocalAppData supabase:', localSupabase);
if (fs.existsSync(localSupabase)) {
  console.log('Files in LocalAppData/supabase:', fs.readdirSync(localSupabase));
}
