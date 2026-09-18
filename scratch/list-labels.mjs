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
console.log("Token retrieved successfully:", !!token);

const options = {
  hostname: 'api.github.com',
  path: '/repos/TheVicky1/Pact_OS/labels?per_page=100',
  headers: {
    'User-Agent': 'PactOS-Script',
    'Authorization': `token ${token}`
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const labels = JSON.parse(data);
      if (Array.isArray(labels)) {
        console.log(`Repository has ${labels.length} labels:`);
        console.log(labels.map(l => l.name).join('\n'));
      } else {
        console.log("Response:", labels);
      }
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (e) => {
  console.error(e.message);
});
