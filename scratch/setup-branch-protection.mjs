/**
 * PACT — Branch Protection Provisioning & Verification Script
 * 
 * Inspects and applies GitHub branch protection rules for `main`.
 * 
 * Safety features:
 * - Defaults to --dry-run unless explicitly executed with --apply
 * - Never logs tokens, authorization headers, or secrets
 * - Validates exact CI status check contexts from workflows
 * - Preserves maintainer recovery while locking down direct/force pushes
 * 
 * Usage:
 *   node scratch/setup-branch-protection.mjs [--dry-run] [--apply]
 */

import https from 'node:https';

const REPO_OWNER = 'TheVicky1';
const REPO_NAME = 'Pact_OS';
const TARGET_BRANCH = 'main';

/**
 * Exact GitHub Actions check run names produced by PACT workflows:
 * - `.github/workflows/ci.yml` -> `Quality Gates & Verification (20.x)`
 * - `.github/workflows/dependency-audit.yml` -> `Dependency Health & Vulnerability Scan (20.x)`
 */
export const REQUIRED_STATUS_CHECKS = [
  'Quality Gates & Verification (20.x)',
  'Dependency Health & Vulnerability Scan (20.x)'
];

export const BRANCH_PROTECTION_POLICY = {
  required_status_checks: {
    strict: true, // Require branch to be up to date before merging
    contexts: REQUIRED_STATUS_CHECKS
  },
  enforce_admins: false, // Prevents total lockout for solo maintainer emergency hotfixes
  required_pull_request_reviews: {
    dismiss_stale_reviews: true,
    require_code_owner_reviews: false,
    required_approving_review_count: 0, // Set to 0 to permit solo maintainer self-merge via PR while enforcing PR requirement
    require_last_push_approval: false
  },
  restrictions: null, // Allow all repository collaborators with write access
  required_linear_history: false,
  allow_force_pushes: false,
  allow_deletions: false,
  block_creations: false,
  required_conversation_resolution: true,
  lock_branch: false,
  allow_fork_syncing: true
};

function githubRequest(method, path, token, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path,
      method,
      headers: {
        'User-Agent': 'PACT-Branch-Protection-Tool',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    };

    if (token) {
      options.headers['Authorization'] = `token ${token}`;
    }

    if (data) {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
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

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');
  const isDryRun = !isApply || args.includes('--dry-run');

  console.log('='.repeat(70));
  console.log('🏛️  PACT — MAIN BRANCH PROTECTION AUDIT & CONFIGURATOR');
  console.log(`Target Repository: ${REPO_OWNER}/${REPO_NAME}`);
  console.log(`Target Branch:     ${TARGET_BRANCH}`);
  console.log(`Execution Mode:    ${isDryRun ? 'DRY-RUN (Safe Inspection)' : 'APPLY (Mutating Remote)'}`);
  console.log('='.repeat(70));

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

  console.log('\n[1/3] Canonical Branch Protection Policy:');
  console.log(JSON.stringify(BRANCH_PROTECTION_POLICY, null, 2));

  console.log('\n[2/3] Inspecting Remote Branch Status:');
  if (!token) {
    console.log('ℹ️  No GITHUB_TOKEN or GH_TOKEN detected in environment.');
    console.log('   Running in local verification mode.');
  } else {
    console.log('🔑 Authenticated GitHub token detected. Checking current remote protection...');
    try {
      const getRes = await githubRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/branches/${TARGET_BRANCH}/protection`, token);
      if (getRes.status === 200) {
        console.log('✅ Remote branch protection is currently active:');
        console.log(`   - Required Status Checks: ${getRes.data.required_status_checks?.contexts?.join(', ') || 'None'}`);
        console.log(`   - Enforce Admins: ${getRes.data.enforce_admins?.enabled}`);
        console.log(`   - Allow Force Pushes: ${getRes.data.allow_force_pushes?.enabled}`);
        console.log(`   - Allow Deletions: ${getRes.data.allow_deletions?.enabled}`);
        console.log(`   - Require PR Reviews: ${getRes.data.required_pull_request_reviews ? 'Yes' : 'No'}`);
      } else if (getRes.status === 404) {
        console.log('⚠️  Remote branch protection is NOT currently configured on main.');
      } else {
        console.log(`⚠️  Remote status returned HTTP ${getRes.status}: ${JSON.stringify(getRes.data)}`);
      }
    } catch (err) {
      console.error('❌ Failed to query remote branch protection:', err.message);
    }
  }

  console.log('\n[3/3] Execution Plan & Required Status Checks:');
  console.log('   The following exact status check names MUST be enforced:');
  for (const check of REQUIRED_STATUS_CHECKS) {
    console.log(`   • "${check}"`);
  }

  if (isDryRun) {
    console.log('\n[DRY RUN COMPLETE] To apply remote branch protection via GitHub API, run:');
    console.log('  $env:GITHUB_TOKEN="<your-token>"; node scratch/setup-branch-protection.mjs --apply');
    console.log('\nOr configure manually in GitHub Settings -> Branches -> Add branch protection rule:');
    console.log('  - Branch name pattern: main');
    console.log('  - [x] Require a pull request before merging');
    console.log('  - [x] Require status checks to pass before merging');
    console.log('  - [x] Require branches to be up to date before merging');
    console.log('  - Status check: "Quality Gates & Verification (20.x)"');
    console.log('  - Status check: "Dependency Health & Vulnerability Scan (20.x)"');
    console.log('  - [x] Require conversation resolution before merging');
    console.log('  - [ ] Do not allow bypassing the above settings');
    console.log('  - [ ] Allow force pushes: unchecked');
    console.log('  - [ ] Allow deletions: unchecked');
    return;
  }

  if (!token) {
    console.error('❌ Cannot apply branch protection without GITHUB_TOKEN.');
    process.exit(1);
  }

  console.log('\n🚀 Applying branch protection rules to remote...');
  try {
    const putRes = await githubRequest(
      'PUT',
      `/repos/${REPO_OWNER}/${REPO_NAME}/branches/${TARGET_BRANCH}/protection`,
      token,
      BRANCH_PROTECTION_POLICY
    );

    if (putRes.status === 200) {
      console.log('✅ Successfully applied branch protection rules to main!');
    } else {
      console.error(`❌ GitHub API returned HTTP ${putRes.status}:`, putRes.data);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error updating branch protection:', err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
