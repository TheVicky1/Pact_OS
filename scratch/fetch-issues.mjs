import https from 'node:https';

const options = {
  hostname: 'api.github.com',
  path: '/repos/TheVicky1/Pact_OS/issues?state=all&per_page=15',
  headers: {
    'User-Agent': 'PactOS-Script'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const issues = JSON.parse(data);
      console.log(`Found ${issues.length} issues/PRs:`);
      issues.forEach(i => {
        const labels = (i.labels || []).map(l => l.name).join(', ');
        const isPR = i.pull_request ? '[PR]' : '[ISSUE]';
        console.log(`${isPR} #${i.number}: ${i.title}`);
        console.log(`   Labels: ${labels}`);
        console.log(`   URL: ${i.html_url}`);
        console.log('');
      });
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (e) => {
  console.error(e.message);
});
