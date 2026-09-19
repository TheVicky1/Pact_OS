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
        const lines = data.split('\n');
        const tsIdx = lines.findIndex(l => l.includes('### TypeScript') || l.includes('### JavaScript'));
        if (tsIdx !== -1) {
          console.log(lines.slice(tsIdx, tsIdx + 20).join('\n'));
        } else {
          console.log(data.slice(0, 1000));
        }
        resolve();
      });
    }).on('error', resolve);
  });
}

getFileContent('MunGell', 'awesome-for-beginners', 'README.md');
