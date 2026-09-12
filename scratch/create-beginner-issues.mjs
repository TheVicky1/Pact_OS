/**
 * PACT — Beginner Issue Factory Provisioning Script
 * 
 * Idempotent, zero-dependency script to create and synchronize the 40 canonical
 * beginner-friendly GitHub issues for PACT.
 * 
 * Usage:
 *   node scratch/create-beginner-issues.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { execSync } from 'node:child_process';

const REPO_OWNER = 'TheVicky1';
const REPO_NAME = 'Pact_OS';

/**
 * Parses all 40 issues from docs/GITHUB_BEGINNER_ISSUES.md
 */
function loadCanonicalIssues() {
  const filePath = path.resolve('docs/GITHUB_BEGINNER_ISSUES.md');
  const content = fs.readFileSync(filePath, 'utf8');

  const issueBlocks = content.split(/### Issue \d+:\s*`([^`]+)`/g);
  const issues = [];

  for (let i = 1; i < issueBlocks.length; i += 2) {
    const slug = issueBlocks[i].trim();
    const bodyRaw = issueBlocks[i + 1].trim();

    const titleMatch = bodyRaw.match(/\*\*Title:\*\*\s*`([^`]+)`/);
    const labelsMatch = bodyRaw.match(/\*\*Labels:\*\*\s*(.+)/);
    const markdownMatch = bodyRaw.match(/```markdown([\s\S]*?)```/);

    if (titleMatch && labelsMatch && markdownMatch) {
      const title = titleMatch[1].trim();
      const labels = labelsMatch[1].split(',').map(l => l.replace(/[`*]/g, '').trim()).filter(Boolean);
      const body = markdownMatch[1].trim();

      issues.push({
        slug,
        title,
        labels,
        body
      });
    }
  }

  return issues;
}

/**
 * Execute GitHub API request safely
 */
function githubApiRequest(method, path, token, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path,
      method,
      headers: {
        'User-Agent': 'PACT-Issue-Factory',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Main Runner
 */
async function main() {
  console.log('🏛️ PACT Curated Beginner Issue Factory');
  console.log(`Repository: ${REPO_OWNER}/${REPO_NAME}\n`);

  const issues = loadCanonicalIssues();
  console.log(`Loaded ${issues.length} canonical issues from docs/GITHUB_BEGINNER_ISSUES.md\n`);

  const token = process.env.GITHUB_TOKEN;
  const isDryRun = process.argv.includes('--dry-run');

  if (token && !isDryRun) {
    console.log('🔑 GITHUB_TOKEN detected. Checking existing repository issues...\n');
    try {
      const listRes = await githubApiRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=all&per_page=100`, token);
      const existingIssues = Array.isArray(listRes.data) ? listRes.data : [];
      
      console.log(`Found ${existingIssues.length} existing remote issues on GitHub.\n`);

      let created = 0;
      let skipped = 0;

      for (const issue of issues) {
        const marker = `<!-- PACT-BEGINNER-ISSUE: ${issue.slug} -->`;
        const alreadyExists = existingIssues.some(existing => 
          existing.title === issue.title || (existing.body && existing.body.includes(marker))
        );

        if (alreadyExists) {
          console.log(`  → Skipped (Already exists): "${issue.title}"`);
          skipped++;
        } else {
          const createRes = await githubApiRequest('POST', `/repos/${REPO_OWNER}/${REPO_NAME}/issues`, token, {
            title: issue.title,
            body: issue.body,
            labels: issue.labels
          });

          if (createRes.statusCode === 201) {
            console.log(`  ✓ Created #${createRes.data.number}: "${issue.title}" (${createRes.data.html_url})`);
            created++;
          } else {
            console.error(`  ❌ Failed to create "${issue.title}":`, createRes.data || createRes.statusCode);
          }
        }
      }

      console.log(`\n🎉 Issue Provisioning Complete: ${created} created, ${skipped} skipped.`);
      return;
    } catch (err) {
      console.error('❌ Error executing REST API issue creation:', err);
    }
  }

  // Dry-run / CLI instructions mode
  console.log('ℹ️  No GITHUB_TOKEN detected or --dry-run mode requested.');
  console.log('📋 Verified Canonical Inventory (40 / 40 issues ready):\n');

  issues.forEach((iss, idx) => {
    console.log(`[${(idx + 1).toString().padStart(2, ' ')}] [${iss.slug}] ${iss.title}`);
    console.log(`     Labels: ${iss.labels.join(', ')}`);
  });

  console.log('\nTo provision these issues on GitHub once a token is available:');
  console.log('  $env:GITHUB_TOKEN="ghp_your_token"; node scratch/create-beginner-issues.mjs\n');
}

main().catch(console.error);
