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
  console.log("=== Submitting PR to MunGell/awesome-for-beginners (First Timers Only) ===");
  
  console.log("Step 1: Forking MunGell/awesome-for-beginners to TheVicky1/awesome-for-beginners...");
  await apiRequest('POST', '/repos/MunGell/awesome-for-beginners/forks');
  
  console.log("Waiting 4 seconds for fork propagation...");
  await new Promise(r => setTimeout(r, 4000));

  console.log("Step 2: Fetching default branch (main) SHA from upstream...");
  const upstreamRef = await apiRequest('GET', '/repos/MunGell/awesome-for-beginners/git/refs/heads/main');
  const mainSha = upstreamRef.object ? upstreamRef.object.sha : null;
  console.log("Main SHA:", mainSha);

  if (!mainSha) {
    console.error("Could not fetch main SHA.");
    process.exit(1);
  }

  const branchName = 'add-pact-os-' + Date.now();
  console.log(`Step 3: Creating branch ${branchName} in fork TheVicky1/awesome-for-beginners...`);
  await apiRequest('POST', '/repos/TheVicky1/awesome-for-beginners/git/refs', {
    ref: `refs/heads/${branchName}`,
    sha: mainSha
  });

  console.log("Step 4: Fetching existing data.json...");
  const rawDataJson = await apiRequest('GET', '/repos/MunGell/awesome-for-beginners/contents/data.json', null, {
    'Accept': 'application/vnd.github.v3.raw'
  });
  
  let parsedData = JSON.parse(rawDataJson);
  const newEntry = {
    "name": "PACT OS",
    "link": "https://github.com/TheVicky1/Pact_OS",
    "label": "good-first-issue",
    "technologies": [
      "TypeScript",
      "React",
      "Next.js"
    ],
    "description": "An open-source, local-first accountability operating system featuring a financial discipline engine, focus timer, habit streak tracking, and zero-telemetry privacy."
  };

  const exists = parsedData.repositories.some(r => r.link && r.link.includes('TheVicky1/Pact_OS'));
  if (!exists) {
    parsedData.repositories.push(newEntry);
    // Sort repositories alphabetically by name
    parsedData.repositories.sort((a, b) => a.name.localeCompare(b.name));
  }

  console.log("Step 5: Fetching fork file SHA...");
  const getForkFile = await apiRequest('GET', `/repos/TheVicky1/awesome-for-beginners/contents/data.json?ref=${branchName}`);
  const forkFileSha = getForkFile.sha;

  console.log("Step 6: Updating data.json in fork...");
  const updatedJsonString = JSON.stringify(parsedData, null, 2) + "\n";
  await apiRequest('PUT', `/repos/TheVicky1/awesome-for-beginners/contents/data.json`, {
    message: "Add PACT OS to awesome-for-beginners / first-timers list",
    content: Buffer.from(updatedJsonString).toString('base64'),
    sha: forkFileSha,
    branch: branchName
  });

  console.log("Step 7: Creating Pull Request against MunGell/awesome-for-beginners...");
  const prRes = await apiRequest('POST', '/repos/MunGell/awesome-for-beginners/pulls', {
    title: "Add PACT OS to TypeScript / React projects",
    head: `TheVicky1:${branchName}`,
    base: "main",
    body: `### Add PACT OS to Awesome First Pull Request Opportunities

- **Project Name**: PACT OS
- **Repository**: https://github.com/TheVicky1/Pact_OS
- **Technologies**: TypeScript, React, Next.js, Supabase
- **Good First Issues**: https://github.com/TheVicky1/Pact_OS/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22
- **Description**: An open-source, local-first accountability operating system with financial discipline engine, focus timer, habit streak tracking, and zero-telemetry privacy.
`
  });

  if (prRes.html_url) {
    console.log("🎉 First Timers Only (Awesome-For-Beginners) PR Created Successfully!");
    console.log("PR URL:", prRes.html_url);
  } else {
    console.log("PR Creation Result:", prRes);
  }
}

run().catch(console.error);
