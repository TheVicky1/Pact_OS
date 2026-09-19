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

function inspectJson() {
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
          if (Array.isArray(parsed)) {
            console.log("data.json is array of length:", parsed.length);
            const tsObj = parsed.find(item => item.language === 'TypeScript' || item.language === 'typescript' || item.name === 'TypeScript');
            console.log("TypeScript entry:", JSON.stringify(tsObj || parsed[0], null, 2));
          } else {
            console.log("Keys:", Object.keys(parsed));
          }
        } catch (e) {
          console.error(e.message);
        }
        resolve();
      });
    }).on('error', resolve);
  });
}

inspectJson();
