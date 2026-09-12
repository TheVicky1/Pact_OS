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
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path,
      method,
      headers: {
        'User-Agent': 'PACT-Issue-Factory',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
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
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

export const FIRST_BATCH_SLUGS = [
  'docs-money-cents-examples',
  'docs-developer-commands-cheatsheet',
  'ui-finance-summary-responsive-padding',
  'ui-habits-routine-toggle-transition',
  'a11y-notification-popover-close-button',
  'a11y-task-priority-sr-only',
  'test-money-cents-formatting-edge-cases',
  'test-task-priority-sorting-comparator',
  'fix-daily-cadence-zero-tasks-pluralization',
  'refactor-unused-icon-imports-integrations'
];

export const SECOND_BATCH_SLUGS = [
  'docs-timezone-mocking-runbook',
  'docs-focus-audio-architecture',
  'ui-active-focus-card-hover',
  'ui-goals-empty-state-polish',
  'a11y-command-palette-escape-listener',
  'a11y-user-profile-dropdown-aria',
  'test-focus-duration-boundaries',
  'dev-package-typecheck-script-alias',
  'fix-goals-form-empty-title-validation',
  'feat-codeforces-rating-tier-badge'
];

function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    const out = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const line = out.split('\n').find(l => l.startsWith('password='));
    return line ? line.slice(9).trim() : null;
  } catch {
    return null;
  }
}

/**
 * Main Runner
 */
async function main() {
  console.log('🏛️ PACT Curated Beginner Issue Factory');
  console.log(`Repository: ${REPO_OWNER}/${REPO_NAME}\n`);

  const allIssues = loadCanonicalIssues();
  const args = process.argv.slice(2);
  const publishAll = args.includes('--all');
  const isBatch1 = args.includes('--batch=1') || args.includes('--batch-1');
  const isBatch2 = args.includes('--batch=2') || args.includes('--batch-2');
  const isDryRun = args.includes('--dry-run');

  const hasExplicitBatch = isBatch1 || isBatch2 || publishAll;
  if (!hasExplicitBatch && !isDryRun) {
    console.error('⚠️  SAFETY GUARD: Explicit batch selection required for live execution.');
    console.error('Usage: node scratch/create-beginner-issues.mjs [--batch=1 | --batch=2 | --all] [--dry-run]');
    process.exit(1);
  }

  let targetSlugs = FIRST_BATCH_SLUGS;
  let batchName = 'FIRST BATCH OF 10 (DRY RUN DEFAULT)';

  if (isBatch2) {
    targetSlugs = SECOND_BATCH_SLUGS;
    batchName = 'SECOND BATCH OF 10';
  } else if (isBatch1) {
    targetSlugs = FIRST_BATCH_SLUGS;
    batchName = 'FIRST BATCH OF 10';
  }

  // Filter to Selected Batch unless --all is explicitly provided
  const issues = publishAll
    ? allIssues
    : allIssues.filter(iss => targetSlugs.includes(iss.slug));

  console.log(`Loaded ${allIssues.length} canonical issues from docs/GITHUB_BEGINNER_ISSUES.md`);
  console.log(`Targeting ${issues.length} issues for this execution (${publishAll ? 'ALL ISSUES' : batchName}).\n`);

  const token = isDryRun ? null : getToken();

  if (token && !isDryRun) {
    console.log('🔑 Authentication detected. Checking existing repository issues...\n');
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
  console.log('ℹ️  Running in dry-run mode (--dry-run or no token).');
  console.log(`📋 Verified Target Inventory (${issues.length} issues ready):\n`);

  issues.forEach((iss, idx) => {
    console.log(`[${(idx + 1).toString().padStart(2, ' ')}] [${iss.slug}] ${iss.title}`);
    console.log(`     Labels: ${iss.labels.join(', ')}`);
  });

  console.log('\nTo provision these issues live on GitHub:');
  console.log('  node scratch/create-beginner-issues.mjs\n');
}

main().catch(console.error);
