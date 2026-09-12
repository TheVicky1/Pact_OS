import https from 'node:https';

const REPO_OWNER = 'TheVicky1';
const REPO_NAME = 'Pact_OS';

function getGithub(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      port: 443,
      path,
      method: 'GET',
      headers: {
        'User-Agent': 'PACT-Readonly-Inspector',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...headers
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, error: e.message });
        }
      });
    });

    req.on('error', (err) => resolve({ status: 0, error: err.message }));
    req.end();
  });
}

async function inspectRemote() {
  console.log('================================================================');
  console.log('🔍 PACT — Remote GitHub Repository State Read-Only Inspection');
  console.log('================================================================\n');

  const authHeader = process.env.GITHUB_TOKEN ? { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` } : {};

  console.log(`Connecting to public GitHub API for ${REPO_OWNER}/${REPO_NAME}...`);
  const repoRes = await getGithub(`/repos/${REPO_OWNER}/${REPO_NAME}`, authHeader);

  if (repoRes.status === 200) {
    const r = repoRes.data;
    console.log('✅ Remote Repository Fetched Successfully:\n');
    console.log(`- Full Name:        ${r.full_name}`);
    console.log(`- Visibility:       ${r.visibility || (r.private ? 'private' : 'public')}`);
    console.log(`- Description:      ${r.description || '(none set)'}`);
    console.log(`- Homepage URL:     ${r.homepage || '(none set)'}`);
    console.log(`- Topics:           ${Array.isArray(r.topics) && r.topics.length > 0 ? r.topics.join(', ') : '(no topics currently applied)'}`);
    console.log(`- Open Issues:      ${r.open_issues_count}`);
    console.log(`- Default Branch:   ${r.default_branch}`);
    console.log(`- License:          ${r.license?.spdx_id || r.license?.name || '(none detected)'}`);
    console.log(`- Has Wiki:         ${r.has_wiki}`);
    console.log(`- Has Discussions:  ${r.has_discussions}`);
    console.log(`- Has Projects:     ${r.has_projects}`);
  } else {
    console.log(`⚠️ Unable to fetch remote repository details (Status ${repoRes.status}):`);
    console.log(repoRes.error || repoRes.data?.message || 'Rate limit or network access limitation.');
    if (repoRes.headers?.['x-ratelimit-remaining']) {
      console.log(`Rate limit remaining: ${repoRes.headers['x-ratelimit-remaining']}`);
    }
  }

  console.log('\n================================================================');
}

inspectRemote();
