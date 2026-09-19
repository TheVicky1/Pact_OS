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
  console.error("No GitHub token available. Aborting.");
  process.exit(1);
}

const yamlContent = `name: PACT OS
description: An open-source, local-first accountability operating system featuring a financial discipline engine, focus timer, habit streak tracking, and zero-telemetry privacy.
projectlink: https://github.com/TheVicky1/Pact_OS
site: https://github.com/TheVicky1/Pact_OS
tags:
  - typescript
  - react
  - nextjs
  - tailwindcss
  - supabase
  - local-first
  - accountability
  - productivity
  - good-first-issue
  - beginner-friendly
  - hacktoberfest
stats:
  issue-label: "good first issue"
`;

function apiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const bodyString = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'User-Agent': 'PactOS-Submit-Script',
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
            resolve(parsed);
          } else {
            console.error(`API Error [${method} ${path}] Status ${res.statusCode}:`, parsed.message || resData);
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

async function run() {
  console.log("Step 1: Forking up-for-grabs/up-for-grabs.net to TheVicky1/up-for-grabs.net...");
  const forkRes = await apiRequest('POST', '/repos/up-for-grabs/up-for-grabs.net/forks');
  if (forkRes.error && forkRes.statusCode !== 202) {
    console.error("Fork failed:", forkRes);
  }
  
  // Wait 4 seconds for fork to propagate
  console.log("Waiting 4 seconds for fork propagation...");
  await new Promise(r => setTimeout(r, 4000));

  console.log("Step 2: Fetching default branch ref from upstream up-for-grabs/up-for-grabs.net...");
  const upstreamRef = await apiRequest('GET', '/repos/up-for-grabs/up-for-grabs.net/git/refs/heads/gh-pages');
  const parentSha = upstreamRef.object ? upstreamRef.object.sha : null;
  console.log("Upstream gh-pages SHA:", parentSha);

  if (!parentSha) {
    console.error("Could not fetch upstream SHA.");
    process.exit(1);
  }

  const branchName = 'add-pact-os-' + Date.now();
  console.log(`Step 3: Creating branch ${branchName} in TheVicky1/up-for-grabs.net...`);
  const createRefRes = await apiRequest('POST', '/repos/TheVicky1/up-for-grabs.net/git/refs', {
    ref: `refs/heads/${branchName}`,
    sha: parentSha
  });
  console.log("Branch creation status:", createRefRes.ref ? "Success" : createRefRes);

  console.log("Step 4: Creating _data/projects/pact-os.yml in fork...");
  const fileContentBase64 = Buffer.from(yamlContent).toString('base64');
  const createFileRes = await apiRequest('PUT', `/repos/TheVicky1/up-for-grabs.net/contents/_data/projects/pact-os.yml`, {
    message: "Add PACT OS to projects index",
    content: fileContentBase64,
    branch: branchName
  });
  console.log("File creation status:", createFileRes.content ? "Success" : createFileRes);

  console.log("Step 5: Submitting Pull Request to up-for-grabs/up-for-grabs.net...");
  const prRes = await apiRequest('POST', '/repos/up-for-grabs/up-for-grabs.net/pulls', {
    title: "Add PACT OS to projects index",
    head: `TheVicky1:${branchName}`,
    base: "gh-pages",
    body: `### Add PACT OS to Up For Grabs

- **Project Name:** PACT OS
- **Project Link:** https://github.com/TheVicky1/Pact_OS
- **Description:** An open-source, local-first accountability operating system featuring a financial discipline engine, focus timer, habit streak tracking, and zero-telemetry privacy.
- **Good First Issues:** https://github.com/TheVicky1/Pact_OS/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22
`
  });

  if (prRes.html_url) {
    console.log("🎉 Pull Request Created Successfully!");
    console.log("PR URL:", prRes.html_url);
  } else {
    console.log("PR Creation Result:", prRes);
  }
}

run().catch(console.error);
