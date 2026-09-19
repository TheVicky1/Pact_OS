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

function getContents(owner, repo, path = '') {
  return new Promise(resolve => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/contents/${path}`,
      headers: {
        'User-Agent': 'PactOS-Script',
        'Authorization': `token ${token}`
      }
    };
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`=== ${owner}/${repo} contents of '${path}' ===`);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              console.log(`- ${item.name} (${item.type})`);
            });
          } else {
            console.log(parsed.name || parsed);
          }
        } catch (e) {}
        resolve();
      });
    }).on('error', resolve);
  });
}

async function run() {
  await getContents('DeepSourceCorp', 'good-first-issue');
  await getContents('DeepSourceCorp', 'good-first-issue', 'data');
  await getContents('MunGell', 'awesome-for-beginners');
}

run();
