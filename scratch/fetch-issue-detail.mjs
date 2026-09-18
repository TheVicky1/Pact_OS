import https from 'node:https';

const issueNum = process.argv[2] || '71';

const options = {
  hostname: 'api.github.com',
  path: `/repos/TheVicky1/Pact_OS/issues/${issueNum}`,
  headers: {
    'User-Agent': 'PactOS-Script'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const issue = JSON.parse(data);
      console.log(`=== Issue #${issue.number}: ${issue.title} ===`);
      console.log(`Labels: ${(issue.labels || []).map(l => l.name).join(', ')}`);
      console.log(`Body:\n${issue.body}`);
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (e) => {
  console.error(e.message);
});
