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
  console.error("No token found. Aborting.");
  process.exit(1);
}

function apiRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyString = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'User-Agent': 'PactOS-Submit-Script',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        ...headers
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
        if (options.headers['Accept'] === 'application/vnd.github.v3.raw') {
          resolve(resData);
          return;
        }
        try {
          const parsed = JSON.parse(resData || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            console.error(`API Error [${method} ${path}] Status ${res.statusCode}:`, parsed.message || resData);
            resolve({ error: true, statusCode: res.statusCode, data: parsed });
          }
        } catch (e) {
          resolve(resData);
        }
      });
    });
    req.on('error', reject);
    if (bodyString) req.write(bodyString);
    req.end();
  });
}

async function run() {
  console.log("=== Submitting PR to DeepSourceCorp/good-first-issue ===");
  
  console.log("Step 1: Checking upstream master SHA...");
  const upstreamRef = await apiRequest('GET', '/repos/DeepSourceCorp/good-first-issue/git/refs/heads/master');
  const masterSha = upstreamRef.object ? upstreamRef.object.sha : null;
  console.log("Master SHA:", masterSha);

  const branchName = 'add-pact-os-' + Date.now();
  console.log(`Step 2: Creating branch ${branchName} in fork TheVicky1/good-first-issue...`);
  await apiRequest('POST', '/repos/TheVicky1/good-first-issue/git/refs', {
    ref: `refs/heads/${branchName}`,
    sha: masterSha
  });

  console.log("Step 3: Fetching existing data/repositories.toml...");
  const rawToml = await apiRequest('GET', '/repos/DeepSourceCorp/good-first-issue/contents/data/repositories.toml', null, {
    'Accept': 'application/vnd.github.v3.raw'
  });
  
  let currentToml = typeof rawToml === 'string' ? rawToml : '';
  const repoEntry = "  'github.com/TheVicky1/Pact_OS',";
  
  if (!currentToml.includes("github.com/TheVicky1/Pact_OS")) {
    const closingIdx = currentToml.lastIndexOf(']');
    if (closingIdx !== -1) {
      currentToml = currentToml.slice(0, closingIdx) + repoEntry + "\n" + currentToml.slice(closingIdx);
    }
  }

  console.log("Step 4: Fetching fork file SHA...");
  const getForkFile = await apiRequest('GET', `/repos/TheVicky1/good-first-issue/contents/data/repositories.toml?ref=${branchName}`);
  const forkFileSha = getForkFile.sha;

  console.log("Step 5: Updating data/repositories.toml in fork...");
  await apiRequest('PUT', `/repos/TheVicky1/good-first-issue/contents/data/repositories.toml`, {
    message: "feat: add TheVicky1/Pact_OS to repositories",
    content: Buffer.from(currentToml).toString('base64'),
    sha: forkFileSha,
    branch: branchName
  });

  console.log("Step 6: Creating Pull Request against DeepSourceCorp/good-first-issue...");
  const prRes = await apiRequest('POST', '/repos/DeepSourceCorp/good-first-issue/pulls', {
    title: "feat: add TheVicky1/Pact_OS to repositories",
    head: `TheVicky1:${branchName}`,
    base: "master",
    body: `### Add PACT OS to Good First Issue Directory

- **Repository**: https://github.com/TheVicky1/Pact_OS
- **Description**: An open-source, local-first accountability operating system with financial discipline engine, focus timer, habit streak tracking, and zero-telemetry privacy.
- **Language**: TypeScript / Next.js
- **Good First Issues**: https://github.com/TheVicky1/Pact_OS/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22
`
  });

  if (prRes.html_url) {
    console.log("🎉 GoodFirstIssue PR Created Successfully!");
    console.log("PR URL:", prRes.html_url);
  } else {
    console.log("PR Creation Result:", prRes);
  }
}

run().catch(console.error);
