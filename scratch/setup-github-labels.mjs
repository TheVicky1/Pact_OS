/**
 * PACT — GitHub Label Provisioning & Synchronization Script
 * 
 * Idempotent, zero-dependency script to provision and synchronize PACT's
 * 45 canonical GitHub issue labels.
 * 
 * Usage:
 *   node scratch/setup-github-labels.mjs [--dry-run]
 * 
 * Modes:
 *   1. REST API Mode: If GITHUB_TOKEN environment variable is set.
 *   2. GitHub CLI Mode: If `gh` CLI is installed and authenticated.
 *   3. Dry-Run / Export Mode: Prints exact commands for manual maintainer execution.
 */

import https from 'node:https';
import { execSync } from 'node:child_process';

const REPO_OWNER = 'TheVicky1';
const REPO_NAME = 'Pact_OS';

export const PACT_LABELS = [
  // --- Category A: Contribution Type (type:*) ---
  { name: 'type:bug', color: 'd73a4a', description: 'Something is broken, malfunctioning, or producing errors' },
  { name: 'type:feature', color: 'a2eeef', description: 'New product capability, domain engine expansion, or enhancement' },
  { name: 'type:docs', color: '0075ca', description: 'Documentation additions, corrections, architecture guides' },
  { name: 'type:ui', color: 'e99695', description: 'Visual styling, layout ergonomics, card geometry, micro-interactions' },
  { name: 'type:a11y', color: '1d76db', description: 'Accessibility improvements, keyboard navigation, ARIA semantics, contrast' },
  { name: 'type:test', color: 'bfdadc', description: 'Unit tests, validation suites, test harnesses, coverage improvements' },
  { name: 'type:performance', color: 'd93f0b', description: 'Latency reduction, bundle optimization, query efficiency' },
  { name: 'type:refactor', color: 'e4e669', description: 'Internal code restructuring without functional or behavioral changes' },
  { name: 'type:security', color: 'b60205', description: 'Security hardening, RLS policy audit, input sanitization' },
  { name: 'type:integration', color: '5319e7', description: 'External connectors and APIs (Google, GitHub, LeetCode, Codeforces)' },

  // --- Category B: Difficulty (difficulty:*) ---
  { name: 'difficulty:beginner', color: '0e8a16', description: 'Suitable for first-time contributors; narrow scope and clear criteria' },
  { name: 'difficulty:easy', color: '7057ff', description: 'Straightforward task requiring basic familiarity with React/TypeScript' },
  { name: 'difficulty:intermediate', color: 'fbca04', description: 'Requires solid understanding of PACT domain engines or Server Actions' },
  { name: 'difficulty:advanced', color: 'd93f0b', description: 'Complex task requiring deep domain knowledge, concurrency, or DB migrations' },

  // --- Category C: Estimated Time (time:*) ---
  { name: 'time:<15m', color: 'c5def5', description: 'Quick fix, typo correction, or minor tweak (< 15 minutes)' },
  { name: 'time:15-30m', color: 'bfd4f2', description: 'Focused task executable in 15 to 30 minutes' },
  { name: 'time:30-60m', color: 'd4c5f9', description: 'Moderate task achievable in 30 to 60 minutes' },
  { name: 'time:1-2h', color: 'fef2c0', description: 'Substantial task requiring 1 to 2 hours of focused effort' },
  { name: 'time:2-4h', color: 'f9d0c4', description: 'In-depth implementation requiring 2 to 4 hours' },
  { name: 'time:4h+', color: 'f8b4b4', description: 'Large feature or subsystem refactor requiring 4+ hours' },

  // --- Category D: Project Area (area:*) ---
  { name: 'area:dashboard', color: '333333', description: 'Main OS overview, velocity cards, and quick actions' },
  { name: 'area:planner', color: '333333', description: 'Daily planner, timeline, drag-and-drop schedule, and energy blocks' },
  { name: 'area:calendar', color: '333333', description: 'Monthly/weekly calendar views, scheduling, and Google sync UI' },
  { name: 'area:tasks', color: '333333', description: 'Task lifecycle engine, priority filters, and deadline timers' },
  { name: 'area:goals', color: '333333', description: 'OKR hierarchy, milestones, and target completion tracking' },
  { name: 'area:projects', color: '333333', description: 'Multi-task projects, status boards, and deliverable tracking' },
  { name: 'area:accountability', color: '333333', description: 'Stakes, commitments, referees, consequence masking, and penalties' },
  { name: 'area:focus', color: '333333', description: 'Deep work timer, ambient sound synthesizer, and session analytics' },
  { name: 'area:habits', color: '333333', description: 'Habit recurrence, routine checklists, and streak calculation engine' },
  { name: 'area:finance', color: '333333', description: 'Integer-cents transactions, budgets, ledger arithmetic, and categories' },
  { name: 'area:analytics', color: '333333', description: 'Velocity graphs, completion trends, and aggregation scoring' },
  { name: 'area:review', color: '333333', description: 'Weekly review ritual, retrospectives, and planning drafts' },
  { name: 'area:auth', color: '333333', description: 'Login, registration, session cookies, OAuth callbacks, onboarding' },
  { name: 'area:integrations', color: '333333', description: 'Proof connectors (GitHub, LeetCode, Codeforces, Google Calendar)' },
  { name: 'area:settings', color: '333333', description: 'User preferences, profile configuration, notifications, export' },
  { name: 'area:database', color: '333333', description: 'Supabase migrations, PostgreSQL triggers, constraints, RLS policies' },
  { name: 'area:testing', color: '333333', description: 'Domain test suites, mock fixtures, and CI validation runners' },
  { name: 'area:documentation', color: '333333', description: 'Technical guides, contributor walkthroughs, API specifications' },
  { name: 'area:developer-experience', color: '333333', description: 'Local setup scripts, linter rules, Git hooks, dev environment' },

  // --- Special Community Labels ---
  { name: 'good first issue', color: '7057ff', description: 'Curated for first-time contributors; paired with difficulty:beginner' },
  { name: 'help wanted', color: '008672', description: 'Extra maintainer assistance or community contribution actively requested' },
  { name: 'community', color: 'e11d48', description: 'Community-driven enhancement, UX feedback, or resource sharing' },

  // --- Workflow Status Labels (status:*) ---
  { name: 'status:blocked', color: '6a737d', description: 'Dependent on another issue, upstream dependency, or external decision' },
  { name: 'status:needs-discussion', color: '6a737d', description: 'Requires technical consensus or maintainer alignment before coding' },
  { name: 'status:needs-review', color: '6a737d', description: 'Pull request has been submitted and is awaiting maintainer code review' }
];

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
        'User-Agent': 'PACT-Label-Provisioner',
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
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: parsed });
          } else {
            resolve({ statusCode: res.statusCode, error: parsed });
          }
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
  console.log('🏛️ PACT GitHub Issue Label Provisioner');
  console.log(`Repository: ${REPO_OWNER}/${REPO_NAME}`);
  console.log(`Total Canonical Labels: ${PACT_LABELS.length}\n`);

  const token = process.env.GITHUB_TOKEN;
  const isDryRun = process.argv.includes('--dry-run');

  if (token && !isDryRun) {
    console.log('🔑 GITHUB_TOKEN detected. Synchronizing labels via GitHub REST API...\n');
    try {
      // 1. Fetch existing labels
      const listRes = await githubApiRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/labels?per_page=100`, token);
      if (listRes.error) {
        console.error('❌ Failed to fetch existing labels:', listRes.error);
        return;
      }

      const existingLabels = new Map((listRes.data || []).map(l => [l.name.toLowerCase(), l]));
      console.log(`Found ${existingLabels.size} existing remote labels.\n`);

      let created = 0;
      let updated = 0;
      let unchanged = 0;

      for (const label of PACT_LABELS) {
        const existing = existingLabels.get(label.name.toLowerCase());
        if (!existing) {
          const createRes = await githubApiRequest('POST', `/repos/${REPO_OWNER}/${REPO_NAME}/labels`, token, label);
          if (createRes.statusCode === 201) {
            console.log(`  ✓ Created: "${label.name}" (#${label.color})`);
            created++;
          } else {
            console.error(`  ❌ Failed to create "${label.name}":`, createRes.error);
          }
        } else {
          const needsUpdate = existing.color.toLowerCase() !== label.color.toLowerCase() ||
                              existing.description !== label.description;
          if (needsUpdate) {
            const updateRes = await githubApiRequest('PATCH', `/repos/${REPO_OWNER}/${REPO_NAME}/labels/${encodeURIComponent(existing.name)}`, token, {
              new_name: label.name,
              color: label.color,
              description: label.description
            });
            if (updateRes.statusCode === 200) {
              console.log(`  ↻ Updated: "${label.name}"`);
              updated++;
            } else {
              console.error(`  ❌ Failed to update "${label.name}":`, updateRes.error);
            }
          } else {
            console.log(`  → Unchanged: "${label.name}"`);
            unchanged++;
          }
        }
      }

      console.log(`\n🎉 Label sync complete: ${created} created, ${updated} updated, ${unchanged} unchanged.`);
      return;
    } catch (err) {
      console.error('❌ Error executing REST API sync:', err);
    }
  }

  // Fallback: Check if gh CLI is available
  let ghAvailable = false;
  try {
    execSync('gh --version', { stdio: 'ignore' });
    ghAvailable = true;
  } catch {}

  if (ghAvailable && !isDryRun) {
    console.log('💻 GitHub CLI (`gh`) detected. Attempting synchronization...\n');
    let created = 0;
    for (const label of PACT_LABELS) {
      try {
        execSync(`gh label create "${label.name}" --color "${label.color}" --description "${label.description}" --force --repo ${REPO_OWNER}/${REPO_NAME}`, { stdio: 'pipe' });
        console.log(`  ✓ Synced: "${label.name}"`);
        created++;
      } catch (e) {
        console.log(`  → Could not sync "${label.name}" via CLI`);
      }
    }
    console.log(`\n🎉 CLI sync completed for ${created} labels.`);
    return;
  }

  // Dry Run / Command Export Mode
  console.log('ℹ️  No GITHUB_TOKEN or authenticated `gh` CLI detected.');
  console.log('📋 Generated GitHub CLI commands for manual provisioning:\n');
  console.log('```bash');
  for (const label of PACT_LABELS) {
    console.log(`gh label create "${label.name}" --color "${label.color}" --description "${label.description}" --force --repo ${REPO_OWNER}/${REPO_NAME}`);
  }
  console.log('```\n');
  console.log('Maintainers can also run this script directly with:');
  console.log('  $env:GITHUB_TOKEN="ghp_xxx"; node scratch/setup-github-labels.mjs');
}

main().catch(console.error);
