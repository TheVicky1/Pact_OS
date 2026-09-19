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

function checkRepo(path) {
  return new Promise(resolve => {
    const options = {
      hostname: 'api.github.com',
      path,
      headers: {
        'User-Agent': 'PactOS-Script',
        'Authorization': `token ${token}`
      }
    };
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        console.log(`Path: ${path} Status: ${res.statusCode}`);
        if (res.headers.location) {
          console.log(`  Redirect to: ${res.headers.location}`);
        }
        try {
          const parsed = JSON.parse(data);
          console.log(`  Full Name: ${parsed.full_name}, Default branch: ${parsed.default_branch}`);
        } catch (e) {}
        resolve();
      });
    }).on('error', resolve);
  });
}

async function run() {
  await checkRepo('/repos/deepsource/good-first-issue');
  await checkRepo('/repos/deepsourcelabs/good-first-issue');
  await checkRepo('/repos/FirstTimersOnly/first-timers-only');
  await checkRepo('/repos/MunGell/awesome-for-beginners');
}

run();
