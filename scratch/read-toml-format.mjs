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

function getFileContent(owner, repo, path) {
  return new Promise(resolve => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/contents/${path}`,
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
        console.log(`=== ${owner}/${repo}/${path} ===`);
        console.log(data.slice(-1000));
        resolve();
      });
    }).on('error', resolve);
  });
}

getFileContent('DeepSourceCorp', 'good-first-issue', 'data/repositories.toml');
