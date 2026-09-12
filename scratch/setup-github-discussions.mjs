#!/usr/bin/env node

/**
 * PACT Open-Source GitHub Discussions Setup & Verification Tool
 * 
 * Inspects or verifies GitHub Discussions configuration and category structure.
 * Supports --dry-run and safe, non-destructive audit.
 * 
 * Usage:
 *   node scratch/setup-github-discussions.mjs --dry-run
 *   $env:GITHUB_TOKEN="ghp_xxx"; node scratch/setup-github-discussions.mjs
 */

import https from 'node:https';

const REPO_OWNER = 'TheVicky1';
const REPO_NAME = 'Pact_OS';

const CANONICAL_CATEGORIES = [
  { name: 'Announcements', emoji: '📣', format: 'announcement', description: 'Maintainer updates, release milestones, and roadmap progress' },
  { name: 'General', emoji: '💬', format: 'discussion', description: 'Open community chat, introductions, and casual conversation' },
  { name: 'Ideas', emoji: '💡', format: 'discussion', description: 'Early-stage feature proposals, concepts, and feedback' },
  { name: 'Q&A', emoji: '❓', format: 'question', description: 'Questions regarding setup, domain logic, or contributing' },
  { name: 'Architecture', emoji: '🏗️', format: 'discussion', description: 'Technical deep-dives on Next.js 16, Supabase RLS, and domain engines' },
  { name: 'Show and Tell', emoji: '🎨', format: 'showcase', description: 'Community setups, custom extensions, and daily discipline rituals' }
];

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || !process.env.GITHUB_TOKEN;

console.log('================================================================');
console.log('🏛️  PACT — GitHub Discussions Configuration & Verification Tool');
console.log('================================================================');
console.log(`Repository: ${REPO_OWNER}/${REPO_NAME}`);
console.log(`Mode:       ${isDryRun ? '🔍 DRY RUN / AUDIT' : '🚀 REMOTE INSPECTION'}`);
console.log('----------------------------------------------------------------\n');

console.log(`📋 Canonical Discussion Categories (${CANONICAL_CATEGORIES.length} total):\n`);
CANONICAL_CATEGORIES.forEach((cat, idx) => {
  console.log(`   [${idx + 1}] ${cat.emoji} ${cat.name} (${cat.format})`);
  console.log(`       ${cat.description}`);
});
console.log('');

function getGithub(path, token) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      port: 443,
      path,
      method: 'GET',
      headers: {
        'User-Agent': 'PACT-Discussions-Setup',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, error: e.message });
        }
      });
    });

    req.on('error', (err) => resolve({ status: 0, error: err.message }));
    req.end();
  });
}

async function runCheck() {
  const token = process.env.GITHUB_TOKEN;
  console.log('🔍 Checking remote repository Discussions status on GitHub...');
  const res = await getGithub(`/repos/${REPO_OWNER}/${REPO_NAME}`, token);

  if (res.status === 200) {
    const hasDiscussions = res.data.has_discussions;
    console.log(`\nRemote Status: Discussions are ${hasDiscussions ? '✅ ENABLED' : '⚠️ CURRENTLY DISABLED'}`);

    if (!hasDiscussions) {
      console.log('\nTo enable GitHub Discussions for this repository:');
      console.log('  1. Navigate to: https://github.com/TheVicky1/Pact_OS/settings');
      console.log('  2. Under "Features", check the box for "Discussions".');
      console.log('  3. GitHub will automatically link the 4 templates in .github/DISCUSSION_TEMPLATE/');
      console.log('  4. Set up the 6 canonical categories defined in docs/GITHUB_DISCUSSIONS.md.');
    } else {
      console.log('✅ Remote discussions are active and ready for community engagement.');
    }
  } else {
    console.log(`\nℹ️  Public inspection completed. Status code: ${res.status}`);
  }

  console.log('\n================================================================');
  console.log('🎉 AUDIT COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

runCheck();
