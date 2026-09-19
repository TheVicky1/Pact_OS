import https from 'node:https';
import { execSync } from 'node:child_process';

function getToken() {
  try {
    const creds = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf-8'
    });
    const match = creds.match(/password=(.+)/);
    return match ? match[1].trim() : null;
  } catch (e) {
    return null;
  }
}

const token = getToken();

function searchRepos(query) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/search/repositories?q=${encodeURIComponent(query)}&per_page=5`,
      headers: {
        'User-Agent': 'PactOS-Script',
        'Authorization': `token ${token}`
      }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`=== Query: ${query} ===`);
          if (parsed.items) {
            parsed.items.forEach(item => {
              console.log(`- ${item.full_name} (${item.html_url}) [Default branch: ${item.default_branch}]`);
              console.log(`  Description: ${item.description}`);
            });
          } else {
            console.log(parsed);
          }
        } catch (e) {
          console.error(e.message);
        }
        resolve();
      });
    }).on('error', resolve);
  });
}

async function run() {
  await searchRepos('good first issue site');
  await searchRepos('first timers only site');
  await searchRepos('up for grabs');
  await searchRepos('codetriage');
}

run();
