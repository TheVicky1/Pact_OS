import fs from 'node:fs';
import path from 'node:path';

function checkLinksInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const missing = [];
  let totalLinks = 0;

  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const rawTarget = match[2].trim();
    totalLinks++;

    // Skip web URLs, mailto, and in-page anchors
    if (rawTarget.startsWith('http://') || rawTarget.startsWith('https://') || rawTarget.startsWith('mailto:') || rawTarget.startsWith('#')) {
      continue;
    }

    // Strip anchor #section from path
    const fileTarget = rawTarget.split('#')[0];
    if (!fileTarget) continue;

    const resolved = path.resolve(dir, fileTarget);
    if (!fs.existsSync(resolved)) {
      missing.push({ file: filePath, text: match[1], target: rawTarget, resolved });
    }
  }

  return { totalLinks, missing };
}

const docsFiles = fs.readdirSync('docs')
  .filter(f => f.endsWith('.md'))
  .map(f => path.join('docs', f));

const allFiles = ['README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'SUPPORT.md', ...docsFiles];

let total = 0;
let errors = [];

for (const file of allFiles) {
  const res = checkLinksInFile(file);
  total += res.totalLinks;
  errors.push(...res.missing);
}

console.log(`Checked ${allFiles.length} Markdown files with ${total} total links.`);
if (errors.length === 0) {
  console.log('✅ 100% of relative links are valid and exist.');
} else {
  console.error(`❌ Found ${errors.length} broken links:`);
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
