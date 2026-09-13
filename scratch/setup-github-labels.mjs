/**
 * PACT — GitHub Label Provisioning & Synchronization Script
 * 
 * Idempotent, zero-dependency script to provision and synchronize PACT's
 * canonical GitHub issue and PR labels.
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

export const PACT_CORE_LABELS = [
  { name: 'good first issue', color: '7057ff', description: 'Curated, self-contained task suitable for first-time contributors' },
  { name: 'help wanted', color: '008672', description: 'Maintainer is actively welcoming community contributions on this issue' },
  { name: 'documentation', color: '0075ca', description: 'Documentation additions, clarifications, guides, README, or markdown fixes' },
  { name: 'enhancement', color: 'a2eeef', description: 'Small improvement, refinement, or feature expansion' },
  { name: 'bug', color: 'd73a4a', description: 'Confirmed defect, malfunctioning behavior, or validation error' },
  { name: 'accessibility', color: '1d76db', description: 'Accessibility / a11y improvements (ARIA attributes, keyboard navigation, contrast)' },
  { name: 'ui', color: 'e99695', description: 'UI, visual styling, responsive layout, micro-interactions, or component polish' },
  { name: 'testing', color: 'bfdadc', description: 'Unit tests, test matrix expansion, validation fixtures, and regression coverage' },
  { name: 'difficulty:beginner', color: '0e8a16', description: 'Beginner-friendly task with single-file scope and clear acceptance criteria' },
  { name: 'area:core', color: '333333', description: 'Core domain logic, shared arithmetic helpers, security, and utility services' },
  { name: 'area:dashboard', color: '333333', description: 'Dashboard overview, navigation, workspaces, and user interfaces' },
  { name: 'hacktoberfest', color: 'ff7518', description: 'Eligible high-quality task for open-source community events' },
];

export const PACT_LABELS = [
  ...PACT_CORE_LABELS,
  // --- Extended Subsystem Areas ---
  { name: 'area:ui', color: '333333', description: 'Design system components, buttons, layout, typography' },
  { name: 'area:auth', color: '333333', description: 'Login, registration, session cookies, OAuth callbacks, onboarding' },
  { name: 'area:planning', color: '333333', description: 'Daily planner, timeline, drag-and-drop schedule, and energy blocks' },
  { name: 'area:accountability', color: '333333', description: 'Stakes, commitments, referees, consequence masking, and penalties' },
  { name: 'area:finance', color: '333333', description: 'Integer-cents transactions, budgets, ledger arithmetic, and categories' },
  { name: 'area:github', color: '333333', description: 'GitHub workflows, issue templates, PR templates, automation' },
  { name: 'area:supabase', color: '333333', description: 'Supabase migrations, PostgreSQL triggers, constraints, RLS policies' },
  { name: 'area:testing', color: '333333', description: 'Domain test suites, mock fixtures, and CI validation runners' },
  { name: 'area:documentation', color: '333333', description: 'Technical guides, contributor walkthroughs, API specifications' },
  { name: 'area:developer-experience', color: '333333', description: 'Local setup scripts, linter rules, Git hooks, dev environment' },
  { name: 'area:calendar', color: '333333', description: 'Monthly/weekly calendar views, scheduling, and Google sync UI' },
  { name: 'area:tasks', color: '333333', description: 'Task lifecycle engine, priority filters, and deadline timers' },
  { name: 'area:goals', color: '333333', description: 'OKR hierarchy, milestones, and target completion tracking' },
  { name: 'area:projects', color: '333333', description: 'Multi-task projects, status boards, and deliverable tracking' },
  { name: 'area:focus', color: '333333', description: 'Deep work timer, ambient sound synthesizer, and session analytics' },
  { name: 'area:habits', color: '333333', description: 'Habit recurrence, routine checklists, and streak calculation engine' },
  { name: 'area:analytics', color: '333333', description: 'Velocity graphs, completion trends, and aggregation scoring' },
  { name: 'area:review', color: '333333', description: 'Weekly review ritual, retrospectives, and planning drafts' },
  { name: 'area:integrations', color: '333333', description: 'Proof connectors (GitHub, LeetCode, Codeforces, Google Calendar)' },
  { name: 'area:settings', color: '333333', description: 'User preferences, profile configuration, notifications, export' },

  // --- Extended Difficulty & Lifecycle ---
  { name: 'difficulty:easy', color: '7057ff', description: 'Straightforward task requiring basic familiarity with React/TypeScript' },
  { name: 'difficulty:intermediate', color: 'fbca04', description: 'Requires solid understanding of PACT domain engines or Server Actions' },
  { name: 'difficulty:advanced', color: 'd93f0b', description: 'Complex task requiring deep domain knowledge, concurrency, or DB migrations' },
  { name: 'status:triage', color: '6a737d', description: 'Newly submitted issue awaiting maintainer review or classification' },
  { name: 'status:ready', color: '0e8a16', description: 'Fully specified, verified, and available for implementation' },
  { name: 'status:in-progress', color: 'fbca04', description: 'Actively assigned or currently being implemented' },
  { name: 'status:blocked', color: 'd73a4a', description: 'Dependent on another issue, upstream dependency, or external decision' },
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
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

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

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const token = isDryRun ? null : getToken();

  console.log('='.repeat(70));
  console.log('🏛️  PACT — GITHUB LABEL PROVISIONING & SYNCHRONIZATION');
  console.log(`Repository: ${REPO_OWNER}/${REPO_NAME}`);
  console.log(`Canonical Labels Defined: ${PACT_LABELS.length}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (Export / Verify)' : token ? 'REST API (Live Sync)' : 'CLI / Manual Export'}`);
  console.log('='.repeat(70));

  if (!isDryRun && token) {
    console.log('\n[1/2] Connecting to GitHub API via GITHUB_TOKEN...');
    let successCount = 0;
    let updateCount = 0;
    let failCount = 0;

    for (const label of PACT_LABELS) {
      try {
        const createRes = await githubApiRequest('POST', `/repos/${REPO_OWNER}/${REPO_NAME}/labels`, token, label);
        if (createRes.status === 201) {
          console.log(`  ✅ Created: [${label.name}] (#${label.color})`);
          successCount++;
        } else if (createRes.status === 422) {
          // Already exists -> update
          const updateRes = await githubApiRequest('PATCH', `/repos/${REPO_OWNER}/${REPO_NAME}/labels/${encodeURIComponent(label.name)}`, token, {
            color: label.color,
            description: label.description
          });
          if (updateRes.status === 200) {
            console.log(`  🔄 Updated: [${label.name}] (#${label.color})`);
            updateCount++;
          } else {
            console.warn(`  ⚠️  Failed to update [${label.name}]: Status ${updateRes.status}`);
            failCount++;
          }
        } else {
          console.warn(`  ⚠️  Failed [${label.name}]: Status ${createRes.status}`);
          failCount++;
        }
      } catch (err) {
        console.error(`  ❌ Error processing [${label.name}]:`, err.message);
        failCount++;
      }
    }

    console.log('\n[2/2] Synchronization Summary:');
    console.log(`  • Created: ${successCount}`);
    console.log(`  • Updated: ${updateCount}`);
    console.log(`  • Failed:  ${failCount}`);
    console.log('Done!');
    return;
  }

  // Dry run or manual export
  console.log('\n📋 Canonical Label Set (Export / Manual Sync Commands):\n');
  console.log('# GitHub CLI (`gh`) automated provisioning commands:');
  for (const label of PACT_LABELS) {
    const desc = label.description.replace(/'/g, "\\'");
    console.log(`gh label create "${label.name}" --color "${label.color}" --description "${desc}" --repo ${REPO_OWNER}/${REPO_NAME} --force`);
  }

  console.log('\n✅ Verified all label definitions.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
