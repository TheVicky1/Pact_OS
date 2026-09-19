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

const commonLabels = [
  "accessibility",
  "area:core",
  "beginner friendly",
  "bug",
  "community",
  "contributions-welcome",
  "difficulty:beginner",
  "difficulty:easy",
  "enhancement",
  "good first issue",
  "hacktoberfest",
  "help wanted",
  "testing",
  "time:<15m",
  "up-for-grabs"
];

const footerMarkdown = `

---

## 🚀 How to Claim and Implement an Issue

1. **Choose an Issue**: Browse our open issues and pick one matching your interest and available time.
2. **Comment on GitHub**: Leave a comment on the corresponding GitHub issue: *"I would like to work on this issue. Please assign it to me."*
3. **Follow the Guide**: Review our [**Beginner's Contribution Guide**](CONTRIBUTING-BEGINNERS.md) for step-by-step Git instructions.
4. **Verify Locally**: Run the specific verification command listed on the issue before opening your PR.
5. **Submit PR**: Open a pull request against \`main\` referencing this issue number!`;

const newIssues = [
  {
    title: "[A11y] Add aria-label and type=\"button\" to Calendar Navigation Arrow Controls",
    body: `- **Labels:** \`good first issue\`, \`accessibility\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`src/features/calendar/components/daily-calendar-widget.tsx\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
Accessibility is essential across all PACT OS views. Icon-only navigation buttons (such as Previous Day / Next Day arrows) in calendar widgets must declare explicit \`aria-label\` attributes so screen reader users understand button intent, and \`type="button"\` prevents accidental form submission behavior.

#### Current Behavior
Previous and Next day navigation triggers inside \`src/features/calendar/components/daily-calendar-widget.tsx\` render icon elements but lack explicit \`aria-label\` attributes and explicit \`type="button"\` declarations.

#### Requested Change
Update the navigation arrow button elements in \`src/features/calendar/components/daily-calendar-widget.tsx\` to include:
1. \`aria-label="Navigate to previous day"\` (for previous arrow)
2. \`aria-label="Navigate to next day"\` (for next arrow)
3. Explicit \`type="button"\` on both button elements.

#### Acceptance Criteria
- [ ] \`aria-label\` attributes added to previous and next day calendar triggers.
- [ ] \`type="button"\` attribute declared on both navigation buttons.
- [ ] Verification test suite passes cleanly: \`npm run test:file -- tests/calendar-domain-validation.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/calendar-domain-validation.test.ts
\`\`\`

#### Contributor Notes
Self-contained accessibility polish.` + footerMarkdown
  },
  {
    title: "[JSDoc] Document Parameter Constraints and Return Types in src/lib/utils/time.ts",
    body: `- **Labels:** \`good first issue\`, \`documentation\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`src/lib/utils/time.ts\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
Clear and unambiguous JSDoc documentation ensures developers and new open-source contributors understand timezone conversion contracts and return formats directly inside IDE autocomplete popups.

#### Current Behavior
Time utility functions in \`src/lib/utils/time.ts\` lack comprehensive JSDoc annotations detailing parameter expectations, UTC/local timezone conventions, and return value object shapes.

#### Requested Change
Add standard JSDoc comments to exported helper functions in \`src/lib/utils/time.ts\` detailing:
- \`@param\` parameter constraints and types
- \`@returns\` string / object return specification
- \`@example\` usage snippets for common date computations

#### Acceptance Criteria
- [ ] Complete JSDoc blocks added to export functions in \`src/lib/utils/time.ts\`.
- [ ] Code passes type checking cleanly without lint or compilation warnings.
- [ ] Verification command succeeds: \`npm run test:file -- tests/temporal-engine.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/temporal-engine.test.ts
\`\`\`

#### Contributor Notes
Documentation-only enhancement.` + footerMarkdown
  },
  {
    title: "[Test] Add Boundary Test Case for Max Budget Percentage in Budget Remaining Test Suite",
    body: `- **Labels:** \`good first issue\`, \`testing\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`tests/budget-remaining.test.ts\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
Financial budget tracking in PACT OS must handle exact 100% budget consumption boundary conditions without rounding errors, negative zero artifacts, or unexpected status calculation exceptions.

#### Current Behavior
\`tests/budget-remaining.test.ts\` verifies basic budget allocations, but does not explicitly test the exact 100% spent boundary condition.

#### Requested Change
Add a unit test case in \`tests/budget-remaining.test.ts\` asserting that when total expense equals total budget, \`remainingCents\` equals \`0\` and \`percentageUsed\` equals \`100\` cleanly.

#### Acceptance Criteria
- [ ] 100% budget utilization boundary test case added to \`tests/budget-remaining.test.ts\`.
- [ ] Test suite executes cleanly offline: \`npm run test:file -- tests/budget-remaining.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/budget-remaining.test.ts
\`\`\`

#### Contributor Notes
Single test case addition.` + footerMarkdown
  },
  {
    title: "[A11y] Add aria-describedby Instruction Link to Goal Target Input Field",
    body: `- **Labels:** \`good first issue\`, \`accessibility\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`src/components/goals/goal-form-modal.tsx\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
Screen reader users navigating form controls rely on \`aria-describedby\` links to connect form input fields directly to their corresponding hint text and input format instructions.

#### Current Behavior
The goal target input in \`src/components/goals/goal-form-modal.tsx\` presents instructional text below the field, but does not connect the input and text via \`aria-describedby\`.

#### Requested Change
1. Assign a unique \`id\` to the helper text span in \`src/components/goals/goal-form-modal.tsx\`.
2. Add \`aria-describedby={helperId}\` to the goal target input element.

#### Acceptance Criteria
- [ ] Unique ID assigned to target input helper text element.
- [ ] \`aria-describedby\` attribute added to input element referencing the helper ID.
- [ ] Verification command succeeds: \`npm run test:file -- tests/goals-validation.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/goals-validation.test.ts
\`\`\`

#### Contributor Notes
Accessibility improvement.` + footerMarkdown
  },
  {
    title: "[Test] Add Multiple Tag Deduplication Test Case to Tasks Validation Test Suite",
    body: `- **Labels:** \`good first issue\`, \`testing\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`tests/tasks-validation.test.ts\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
Task tagging and filter utilities must ensure duplicate tag arrays (e.g., \`['deep-work', 'deep-work', 'urgent']\`) are deduplicated cleanly so UI task cards do not render duplicate tag badges.

#### Current Behavior
\`tests/tasks-validation.test.ts\` tests general task validation rules, but does not explicitly test array deduplication logic for duplicate tag inputs.

#### Requested Change
Add a unit test case in \`tests/tasks-validation.test.ts\` asserting that task tag array processing returns deduplicated array elements (\`['deep-work', 'urgent']\`).

#### Acceptance Criteria
- [ ] Tag array deduplication test case added to \`tests/tasks-validation.test.ts\`.
- [ ] Test suite executes cleanly: \`npm run test:file -- tests/tasks-validation.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/tasks-validation.test.ts
\`\`\`

#### Contributor Notes
Single test case addition.` + footerMarkdown
  }
];

async function createIssue(issueData) {
  return new Promise((resolve, reject) => {
    const bodyData = JSON.stringify({
      title: issueData.title,
      body: issueData.body,
      labels: commonLabels
    });

    const options = {
      hostname: 'api.github.com',
      path: '/repos/TheVicky1/Pact_OS/issues',
      method: 'POST',
      headers: {
        'User-Agent': 'PactOS-Script',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const resObj = JSON.parse(data);
          if (res.statusCode === 201) {
            console.log(`✅ Issue #${resObj.number} created successfully: ${resObj.title}`);
            console.log(`   URL: ${resObj.html_url}`);
            resolve(resObj);
          } else {
            console.error(`❌ Failed to create issue. Status ${res.statusCode}:`, resObj.message || data);
            reject(new Error(resObj.message));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(bodyData);
    req.end();
  });
}

async function run() {
  console.log(`Starting creation of ${newIssues.length} beginner-friendly issues...`);
  for (let i = 0; i < newIssues.length; i++) {
    console.log(`Creating issue ${i + 1}/${newIssues.length}...`);
    try {
      await createIssue(newIssues[i]);
      await new Promise(r => setTimeout(r, 1200));
    } catch (e) {
      console.error(`Error on issue ${i + 1}:`, e.message);
    }
  }
  console.log("All issues created successfully!");
}

run();
