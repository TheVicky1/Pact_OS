import fs from 'node:fs';
import path from 'node:path';

const content = fs.readFileSync('docs/GITHUB_BEGINNER_ISSUES.md', 'utf8');
const lines = content.split('\n');

const missing = [];
const found = [];

for (const line of lines) {
  const match = line.match(/^-\s+`([^`]+)`/);
  if (match) {
    const raw = match[1].trim();
    // Check if it looks like a path
    if (raw.includes('/') || raw.endsWith('.ts') || raw.endsWith('.tsx') || raw.endsWith('.md') || raw.endsWith('.json')) {
      const cleanPath = raw.split(' ')[0].replace(/#.*$/, '');
      if (fs.existsSync(cleanPath)) {
        found.push(cleanPath);
      } else {
        missing.push({ line: line.trim(), path: cleanPath });
      }
    }
  }
}

console.log(`Found ${found.length} valid existing file paths.`);
console.log(`Missing count: ${missing.length}`);
if (missing.length > 0) {
  console.log('Missing items:', JSON.stringify(missing, null, 2));
}
