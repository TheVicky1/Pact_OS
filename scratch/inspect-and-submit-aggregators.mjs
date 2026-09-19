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
    console.error('Error fetching token:', e.message);
    return null;
  }
}

const token = getToken();
if (!token) {
  console.error("No token found.");
  process.exit(1);
}

function apiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const bodyString = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'User-Agent': 'PactOS-Aggregator-Script',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    if (bodyString) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = https.request(options, (res) => {
      let resData = '';
      res.on('data', chunk => { resData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resData || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: parsed });
          } else {
            resolve({ error: true, statusCode: res.statusCode, data: parsed });
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    if (bodyString) req.write(bodyString);
    req.end();
  });
}

async function inspectRepo(owner, repo) {
  console.log(`Inspecting ${owner}/${repo}...`);
  const res = await apiRequest('GET', `/repos/${owner}/${repo}`);
  if (res.error) {
    console.log(`Error inspecting ${owner}/${repo}:`, res.data.message);
    return null;
  }
  console.log(`  Default branch: ${res.data.default_branch}`);
  return res.data;
}

async function run() {
  await inspectRepo('deepsourcelabs', 'good-first-issue');
  await inspectRepo('firsttimersonly', 'firsttimersonly.github.io');
  await inspectRepo('firsttimersonly', 'first-timers-only');
}

run().catch(console.error);
