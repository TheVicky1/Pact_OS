import https from 'node:https';

https.get('https://api.github.com/repos/TheVicky1/Pact_OS/issues?state=open&per_page=100', {
  headers: { 'User-Agent': 'PACT-Auditor' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const issues = JSON.parse(data);
      console.log('Total open issues fetched:', issues.length);
      issues.forEach(i => {
        if (i.pull_request) return; // skip PRs
        const labels = i.labels.map(l => l.name).join(', ');
        const assignee = i.assignee ? i.assignee.login : 'unassigned';
        console.log(`#${i.number} [${assignee}] ${i.title}`);
        console.log(`   Labels: [${labels}]`);
      });
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
}).on('error', (e) => console.error(e));
