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
        try {
          const parsed = JSON.parse(data);
          console.log(`=== ${owner}/${repo}/${path} ===`);
          const tsSection = parsed.projects ? parsed.projects.find(p => p.name === 'TypeScript' || p.name === 'React') : null;
          console.log("TypeScript / React section sample:", JSON.stringify(tsSection || parsed.projects?.slice(0, 2), null, 2));
        } catch (e) {
          console.error(e.message);
        }
        resolve();
      });
    }).on('error', resolve);
  });
}

getFileContent('MunGell', 'awesome-for-beginners', 'data.json');
