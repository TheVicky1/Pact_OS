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

function checkRepoId(id) {
  return new Promise(resolve => {
    const options = {
      hostname: 'api.github.com',
      path: `/repositories/${id}`,
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
          console.log(`Repo ID ${id}: ${parsed.full_name}, Default branch: ${parsed.default_branch}`);
        } catch (e) {}
        resolve();
      });
    }).on('error', resolve);
  });
}

checkRepoId('237342680');
