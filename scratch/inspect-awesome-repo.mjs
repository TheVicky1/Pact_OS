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

function inspectRepos() {
  return new Promise(resolve => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/MunGell/awesome-for-beginners/contents/data.json',
      headers: {
        'User-Agent': 'PactOS-Script',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3.raw'
      }
    };
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log("Total repositories in awesome-for-beginners:", parsed.repositories ? parsed.repositories.length : 0);
          console.log("Sample repository object:", JSON.stringify(parsed.repositories[0], null, 2));
        } catch (e) {
          console.error(e.message);
        }
        resolve();
      });
    }).on('error', resolve);
  });
}

inspectRepos();
