import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const CANONICAL_MD_PATH = path.join(REPO_ROOT, 'docs', 'GITHUB_BEGINNER_ISSUES.md');

function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    const gitCreds = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n',
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const match = gitCreds.match(/password=(.+)/);
    if (match && match[1]) return match[1].trim();
  } catch (e) {}
  return null;
}

function githubApi(endpoint, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method: 'GET',
      headers: {
        'User-Agent': 'PACT-OS-Reconciliation-Auditor',
        'Accept': 'application/vnd.github.v3+json',
        ...(token ? { 'Authorization': `token ${token}` } : {})
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (err) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function parseCanonicalCatalog() {
  const content = fs.readFileSync(CANONICAL_MD_PATH, 'utf8');
  
  const catalog = [];
  const regex = /### Issue (\d+):\s*`([^`]+)`\s*\n\*\*Title:\*\*\s*`([^`]+)`\s*\n\*\*Labels:\*\*\s*([^\n]+)\s*\n\*\*Target File:\*\*\s*([^\n]+)\s*\n\n```markdown\s*\n([\s\S]*?)\n```/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const [_, numStr, slug, title, labelsStr, targetFile, body] = match;
    const labels = labelsStr.split(',').map(s => s.trim().replace(/^`|`$/g, ''));
    catalog.push({
      catalogNumber: parseInt(numStr, 10),
      slug,
      title: title.trim(),
      labels,
      targetFile: targetFile.trim(),
      body: body.trim()
    });
  }
  return catalog;
}

async function main() {
  const token = getToken();
  if (!token) {
    console.error('ERROR: Could not resolve GitHub credentials.');
    process.exit(1);
  }

  const catalog = parseCanonicalCatalog();
  console.log(`Parsed ${catalog.length} canonical issues from docs/GITHUB_BEGINNER_ISSUES.md\n`);

  // 1. Fetch Repo info
  const repoRes = await githubApi('/repos/TheVicky1/Pact_OS', token);
  console.log('=== REPO INFO ===');
  console.log(`Name: ${repoRes.data.full_name}`);
  console.log(`Visibility: ${repoRes.data.visibility || (repoRes.data.private ? 'private' : 'public')}`);
  console.log(`Default Branch: ${repoRes.data.default_branch}`);
  console.log(`Open Issues Count: ${repoRes.data.open_issues_count}`);
  console.log(`Topics: ${(repoRes.data.topics || []).join(', ')}`);
  console.log(`Description: ${repoRes.data.description}\n`);

  // 2. Fetch all items (issues + PRs)
  const issuesRes = await githubApi('/repos/TheVicky1/Pact_OS/issues?state=all&per_page=100', token);
  const allItems = issuesRes.data;

  const pullRequests = allItems.filter(item => item.pull_request);
  const issues = allItems.filter(item => !item.pull_request);

  console.log(`Total items fetched: ${allItems.length}`);
  console.log(`- Issues: ${issues.length} (${issues.filter(i => i.state === 'open').length} open, ${issues.filter(i => i.state === 'closed').length} closed)`);
  console.log(`- PRs: ${pullRequests.length} (${pullRequests.filter(p => p.state === 'open').length} open, ${pullRequests.filter(p => p.state === 'closed').length} closed)\n`);

  // 3. Inspect every issue in detail
  console.log('=== DETAILED ISSUE RECONCILIATION ===');
  const reconciliationReport = [];

  const BATCH_1_SLUGS = [
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

  const BATCH_2_SLUGS = [
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

  const BATCH_3_SLUGS = [
    'docs-troubleshooting-rls-recursion',
    'ui-finance-category-badge-opacity',
    'ui-streak-summary-pulse-glow',
    'ui-task-form-modal-mobile-padding',
    'ui-analytics-skeleton-shimmer',
    'test-habit-streak-leap-year',
    'test-weekly-review-step-boundaries',
    'test-notification-channel-filter',
    'refactor-modal-transition-variants',
    'fix-finance-negative-budget-remaining'
  ];

  for (const iss of issues) {
    const slugMarkerMatch = iss.body ? iss.body.match(/<!--\s*PACT-BEGINNER-ISSUE:\s*([a-zA-Z0-9_-]+)\s*-->/) : null;
    const slug = slugMarkerMatch ? slugMarkerMatch[1] : null;

    const canonical = catalog.find(c => c.slug === slug || c.title === iss.title);
    const liveLabels = iss.labels.map(l => l.name);

    // Check comments
    let commentCount = iss.comments;
    let comments = [];
    if (commentCount > 0) {
      const commRes = await githubApi(`/repos/TheVicky1/Pact_OS/issues/${iss.number}/comments`, token);
      comments = commRes.data;
    }

    const titleMatch = canonical ? (canonical.title === iss.title) : false;
    
    // Check labels match
    let labelsMatch = false;
    if (canonical) {
      const canonLabelsSorted = [...canonical.labels].sort();
      const liveLabelsSorted = [...liveLabels].sort();
      labelsMatch = JSON.stringify(canonLabelsSorted) === JSON.stringify(liveLabelsSorted);
    }

    // Check body match with normalized line endings
    let bodyMatch = false;
    if (canonical) {
      const normLive = (iss.body || '').replace(/\r\n/g, '\n').trim();
      const normCanon = (canonical.body || '').replace(/\r\n/g, '\n').trim();
      bodyMatch = (normLive === normCanon);
    }

    let batch = 'UNKNOWN';
    if (BATCH_1_SLUGS.includes(slug)) batch = 'Batch 1';
    else if (BATCH_2_SLUGS.includes(slug)) batch = 'Batch 2';
    else if (BATCH_3_SLUGS.includes(slug)) batch = 'Batch 3';

    reconciliationReport.push({
      number: iss.number,
      title: iss.title,
      state: iss.state,
      slug: slug,
      batch,
      canonicalFound: !!canonical,
      canonicalCatalogNumber: canonical ? canonical.catalogNumber : null,
      canonicalSlug: canonical ? canonical.slug : null,
      canonicalTitle: canonical ? canonical.title : null,
      titleMatch,
      liveLabels,
      canonicalLabels: canonical ? canonical.labels : null,
      labelsMatch,
      bodyMatch,
      assignees: iss.assignees.map(a => a.login),
      commentCount,
      comments: comments.map(c => ({ user: c.user.login, body: c.body, created_at: c.created_at })),
      createdAt: iss.created_at,
      updatedAt: iss.updated_at
    });
  }

  // Sort by issue number ascending
  reconciliationReport.sort((a, b) => a.number - b.number);

  console.log('| GitHub # | Live Title | Canonical Slug | Batch | Canonical Match | Label Match | Body Match | Activity | Verdict |');
  console.log('|---|---|---|---|---|---|---|---|---|');

  for (const item of reconciliationReport) {
    const canonMatch = item.canonicalFound && item.titleMatch ? 'EXACT' : (item.canonicalFound ? 'PARTIAL' : 'ORPHAN');
    const labelMatch = item.labelsMatch ? 'EXACT' : 'MISMATCH';
    const bodyMatch = item.bodyMatch ? 'EXACT' : 'MISMATCH';
    const activity = item.commentCount > 0 ? `${item.commentCount} comments` : (item.assignees.length > 0 ? `Assigned: ${item.assignees.join(',')}` : 'None');
    const verdict = (item.titleMatch && item.labelsMatch && item.bodyMatch && item.state === 'open') ? 'VERIFIED_CANONICAL' : 'NEEDS_ATTENTION';

    console.log(`| #${item.number} | ${item.title} | \`${item.slug}\` | ${item.batch} | ${canonMatch} | ${labelMatch} | ${bodyMatch} | ${activity} | ${verdict} |`);
  }

  // Identify published vs unpublished
  const publishedSlugs = reconciliationReport.map(r => r.slug).filter(Boolean);
  const unpublishedIssues = catalog.filter(c => !publishedSlugs.includes(c.slug));

  console.log(`\n=== INVENTORY SUMMARY ===`);
  console.log(`Total Canonical Catalog: ${catalog.length}`);
  console.log(`Total Live Issues: ${reconciliationReport.length}`);
  console.log(`Total Live Batch 1: ${reconciliationReport.filter(r => r.batch === 'Batch 1').length}`);
  console.log(`Total Live Batch 2: ${reconciliationReport.filter(r => r.batch === 'Batch 2').length}`);
  console.log(`Total Remaining Unpublished: ${unpublishedIssues.length}\n`);

  console.log('=== UNPUBLISHED CANONICAL ISSUES (20) ===');
  unpublishedIssues.forEach((u, idx) => {
    console.log(`${idx + 1}. [Catalog #${u.catalogNumber}] \`${u.slug}\` - "${u.title}" (${u.labels.join(', ')})`);
  });

  // 4. Save JSON summary
  fs.writeFileSync(
    path.join(REPO_ROOT, 'scratch', 'reconciliation-report.json'),
    JSON.stringify({ repo: repoRes.data, report: reconciliationReport, catalog, unpublishedIssues }, null, 2),
    'utf8'
  );
  console.log('\nSaved full reconciliation data to scratch/reconciliation-report.json');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
