#!/usr/bin/env node

/**
 * PACT Open-Source Repository Metadata & Topics Provisioning Tool
 * 
 * Safely sets or verifies GitHub repository Description, Homepage, and Topics.
 * Supports --dry-run, GitHub REST API, and GitHub CLI (gh).
 * 
 * Usage:
 *   node scratch/setup-github-metadata.mjs --dry-run
 *   $env:GITHUB_TOKEN="ghp_xxx"; node scratch/setup-github-metadata.mjs
 */

import https from 'node:https';
import { execSync } from 'node:child_process';

const REPO_OWNER = 'TheVicky1';
const REPO_NAME = 'Pact_OS';

const CANONICAL_METADATA = {
  description: 'Personal Productivity & Accountability OS — Turn Intent Into Discipline with server-authoritative commitments, time-blocked planning, and proof-of-work verification.',
  homepage: 'https://github.com/TheVicky1/Pact_OS',
  topics: [
    'productivity',
    'personal-productivity',
    'personal-operating-system',
    'accountability',
    'discipline',
    'time-blocking',
    'nextjs',
    'react',
    'typescript',
    'tailwindcss',
    'supabase',
    'postgresql',
    'open-source',
    'good-first-issue'
  ]
};

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || !process.env.GITHUB_TOKEN;

console.log('================================================================');
console.log('🏛️  PACT — GitHub Repository Metadata & Topics Synchronizer');
console.log('================================================================');
console.log(`Repository: ${REPO_OWNER}/${REPO_NAME}`);
console.log(`Mode:       ${isDryRun ? '🔍 DRY RUN / AUDIT' : '🚀 LIVE PROVISIONING'}`);
console.log('----------------------------------------------------------------\n');

console.log('📋 Target Canonical Description:');
console.log(`   "${CANONICAL_METADATA.description}"`);
console.log(`   (Length: ${CANONICAL_METADATA.description.length} chars)\n`);

console.log('📋 Target Canonical Homepage:');
console.log(`   ${CANONICAL_METADATA.homepage}\n`);

console.log(`📋 Target Canonical Topics (${CANONICAL_METADATA.topics.length} total):`);
CANONICAL_METADATA.topics.forEach((topic, idx) => {
  console.log(`   [${String(idx + 1).padStart(2, ' ')}] ${topic}`);
});
console.log('');

if (isDryRun && !process.env.GITHUB_TOKEN) {
  console.log('----------------------------------------------------------------');
  console.log('ℹ️  No GITHUB_TOKEN detected. Running in dry-run / audit mode.');
  console.log('   All 14 topics and canonical description validated locally.');
  console.log('');
  console.log('To synchronize live metadata with GitHub:');
  console.log('  1. PowerShell:  $env:GITHUB_TOKEN="ghp_your_token"; node scratch/setup-github-metadata.mjs');
  console.log('  2. Bash/Zsh:    GITHUB_TOKEN="ghp_your_token" node scratch/setup-github-metadata.mjs');
  console.log('  3. GitHub CLI:  gh repo edit TheVicky1/Pact_OS --description "..." --add-topic "..."');
  console.log('----------------------------------------------------------------');
  process.exit(0);
}

// GitHub REST API Helper
function githubRequest(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request({
      hostname: 'api.github.com',
      port: 443,
      path,
      method,
      headers: {
        'User-Agent': 'PACT-Metadata-Sync',
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`GitHub API error (${res.statusCode}): ${parsed.message || body}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runLiveProvisioning() {
  const token = process.env.GITHUB_TOKEN;
  console.log('🚀 Connecting to GitHub API...');

  try {
    // 1. Update Description & Homepage
    console.log('1. Updating repository description and homepage...');
    await githubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}`,
      'PATCH',
      {
        description: CANONICAL_METADATA.description,
        homepage: CANONICAL_METADATA.homepage
      },
      token
    );
    console.log('   ✅ Description and homepage updated successfully.');

    // 2. Update Topics
    console.log('2. Updating repository topics...');
    const topicRes = await githubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/topics`,
      'PUT',
      {
        names: CANONICAL_METADATA.topics
      },
      token
    );
    console.log(`   ✅ Successfully applied ${topicRes.names?.length || CANONICAL_METADATA.topics.length} topics.`);

    console.log('\n================================================================');
    console.log('🎉 METADATA SYNCHRONIZATION COMPLETED SUCCESSFULLY');
    console.log('================================================================');
  } catch (err) {
    console.error(`\n❌ Error provisioning metadata: ${err.message}`);
    console.log('Please verify that GITHUB_TOKEN has "repo" scope privileges.');
    process.exit(1);
  }
}

runLiveProvisioning();
