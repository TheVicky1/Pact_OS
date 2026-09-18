import https from 'node:https';

function fetchJSON(path) {
  return new Promise((resolve) => {
    https.get({
      hostname: 'api.github.com',
      path,
      headers: {
        'User-Agent': 'PACT-Inspector',
        'Accept': 'application/vnd.github+json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  console.log('Fetching contributors from GitHub API...');
  const contributors = await fetchJSON('/repos/TheVicky1/Pact_OS/contributors');
  console.log('\n=== REPOSITORY CONTRIBUTORS ===');
  if (Array.isArray(contributors)) {
    contributors.forEach(c => {
      console.log(`- @${c.login} (${c.contributions} contributions) - ${c.html_url}`);
    });
  } else {
    console.log('Failed or rate limited:', contributors);
  }

  console.log('\nFetching merged PRs from GitHub API...');
  const pulls = await fetchJSON('/repos/TheVicky1/Pact_OS/pulls?state=closed&per_page=50');
  console.log('\n=== MERGED PULL REQUESTS & AUTHORS ===');
  if (Array.isArray(pulls)) {
    pulls.filter(p => p.merged_at).forEach(p => {
      console.log(`PR #${p.number}: "${p.title}" by @${p.user.login} (${p.merged_at})`);
    });
  } else {
    console.log('Failed or rate limited:', pulls);
  }
}

main();
