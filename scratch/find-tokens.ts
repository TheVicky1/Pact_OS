import fs from 'node:fs';
import path from 'node:path';

const userProfile = process.env.USERPROFILE || 'C:\\Users\\Vicky Patel';
const supDir = path.join(userProfile, '.supabase');

try {
  const tokenFile = path.join(supDir, 'access-token');
  if (fs.existsSync(tokenFile)) {
    console.log('Access token file exists! Size:', fs.statSync(tokenFile).size);
  }
} catch (e) {
  console.log('Error checking access-token file:', e);
}
