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

const issues = [
  {
    title: "[A11y] Add aria-label and type=\"button\" to Habit Card Reset Triggers",
    body: `- **Labels:** \`good first issue\`, \`accessibility\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`src/components/habits/habit-card.tsx\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
Accessibility is essential for all PACT OS users. Action buttons without explicit ARIA labels can prevent screen readers from accurately announcing button functionality, and missing \`type="button"\` attributes can cause accidental form submissions.

#### Current Behavior
Reset triggers inside \`src/components/habits/habit-card.tsx\` perform streak reset actions but lack explicit \`aria-label\` attributes and explicit \`type="button"\` declarations.

#### Requested Change
Update the habit card reset trigger elements in \`src/components/habits/habit-card.tsx\` to include:
1. \`aria-label="Reset streak progress for habit"\`
2. \`type="button"\`

#### Acceptance Criteria
- [ ] Explicit \`aria-label\` added to reset button element.
- [ ] \`type="button"\` attribute declared.
- [ ] Verification test suite passes cleanly with \`npm run test:file -- tests/habits-routines.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/habits-routines.test.ts
\`\`\`

#### Contributor Notes
Self-contained accessibility enhancement.` + footerMarkdown
  },
  {
    title: "[JSDoc] Add Return Type Annotations and Usage Examples in src/lib/utils/analytics.ts",
    body: `- **Labels:** \`good first issue\`, \`documentation\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`src/lib/utils/analytics.ts\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
Comprehensive JSDoc documentation ensures developers and community contributors understand helper contracts and return values directly in IDE code autocomplete tooltips.

#### Current Behavior
Utility functions in \`src/lib/utils/analytics.ts\` lack formal JSDoc annotations detailing parameter expectations and example return objects.

#### Requested Change
Add standard JSDoc comments to export functions in \`src/lib/utils/analytics.ts\` detailing:
- \`@param\` specifications
- \`@returns\` object contract
- \`@example\` usage snippets

#### Acceptance Criteria
- [ ] JSDoc block added for all exported analytics helpers.
- [ ] Code passes type-checking cleanly without errors.
- [ ] Verification command succeeds with \`npm run test:file -- tests/analytics-domain-validation.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/analytics-domain-validation.test.ts
\`\`\`

#### Contributor Notes
Documentation-only improvement.` + footerMarkdown
  },
  {
    title: "[Test] Add Zero-Value Expense Test Case to Finance Discipline Test Suite",
    body: `- **Labels:** \`good first issue\`, \`testing\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`tests/finance-discipline.test.ts\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
Financial arithmetic in PACT OS requires strict boundary handling. Verifying that zero-value cents format correctly ensures financial ledgers render cleanly without negative sign zero (\`-$0.00\`) bugs.

#### Current Behavior
\`tests/finance-discipline.test.ts\` tests positive and negative cent allocations, but does not explicitly assert zero-cents formatting.

#### Requested Change
Add a test case in \`tests/finance-discipline.test.ts\` asserting that \`formatCentsToCurrency(0)\` returns \`"$0.00"\` and handles zero allocations without error.

#### Acceptance Criteria
- [ ] Zero-value assertion added to \`tests/finance-discipline.test.ts\`.
- [ ] Test suite executes cleanly offline with \`npm run test:file -- tests/finance-discipline.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/finance-discipline.test.ts
\`\`\`

#### Contributor Notes
Single-file test addition.` + footerMarkdown
  },
  {
    title: "[A11y] Add aria-live Polite Region to Focus Timer Display",
    body: `- **Labels:** \`good first issue\`, \`accessibility\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`src/components/focus/focus-timer-card.tsx\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
Live countdown timers must notify assistive technology users of active session changes politely without interrupting ongoing screen reader speech.

#### Current Behavior
The timer display container in \`src/components/focus/focus-timer-card.tsx\` updates dynamically but lacks \`aria-live="polite"\` region attributes.

#### Requested Change
Add \`aria-live="polite"\` and \`aria-atomic="true"\` attributes to the timer display section in \`src/components/focus/focus-timer-card.tsx\`.

#### Acceptance Criteria
- [ ] \`aria-live="polite"\` attribute added to active timer container.
- [ ] \`aria-atomic="true"\` attribute added.
- [ ] Verification command succeeds: \`npm run test:file -- tests/focus-engine.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/focus-engine.test.ts
\`\`\`

#### Contributor Notes
Self-contained accessibility fix.` + footerMarkdown
  },
  {
    title: "[Test] Add Empty Queue Assertion to Offline Sync Queue Test Suite",
    body: `- **Labels:** \`good first issue\`, \`testing\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`tests/offline-queue-sync.test.ts\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
Offline synchronization must handle empty state queues gracefully when network connectivity is restored without issuing unnecessary network requests or throwing unhandled exceptions.

#### Current Behavior
\`tests/offline-queue-sync.test.ts\` tests queued item processing, but does not explicitly test calling sync on an empty queue array.

#### Requested Change
Add a unit test case in \`tests/offline-queue-sync.test.ts\` asserting that flushing an empty offline queue resolves to an empty result array cleanly.

#### Acceptance Criteria
- [ ] Empty queue test case added to \`tests/offline-queue-sync.test.ts\`.
- [ ] Test suite passes cleanly with \`npm run test:file -- tests/offline-queue-sync.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/offline-queue-sync.test.ts
\`\`\`

#### Contributor Notes
Single test case addition.` + footerMarkdown
  },
  {
    title: "[A11y] Add Keyboard Navigation Support (Enter/Space) to Notification Preference Toggles",
    body: `- **Labels:** \`good first issue\`, \`accessibility\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`src/components/settings/notification-settings-card.tsx\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
Keyboard-only users must be able to toggle notification preferences using standard keyboard controls (\`Enter\` and \`Space\`).

#### Current Behavior
Interactive toggle containers in \`src/components/settings/notification-settings-card.tsx\` rely primarily on click events.

#### Requested Change
Add an \`onKeyDown\` event handler supporting \`event.key === 'Enter' || event.key === ' '\` for keyboard toggle activation.

#### Acceptance Criteria
- [ ] \`onKeyDown\` handler implemented for toggle controls.
- [ ] \`tabIndex={0}\` present on interactive element containers.
- [ ] Verification command passes: \`npm run test:file -- tests/notifications.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/notifications.test.ts
\`\`\`

#### Contributor Notes
Accessibility and UX refinement.` + footerMarkdown
  },
  {
    title: "[JSDoc] Document Currency Conversion Boundaries in src/lib/utils/money.ts",
    body: `- **Labels:** \`good first issue\`, \`documentation\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`src/lib/utils/money.ts\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
Clear documentation of financial utility contracts ensures that future contributors do not introduce floating-point rounding errors when converting between dollars and integer cents.

#### Current Behavior
Helper functions in \`src/lib/utils/money.ts\` lack formal JSDoc contract descriptions for integer arithmetic handling.

#### Requested Change
Add detailed JSDoc comments to \`src/lib/utils/money.ts\` helper functions, specifying parameter types, return contracts, and example usage.

#### Acceptance Criteria
- [ ] JSDoc documentation added to money helper functions.
- [ ] Test suite executes cleanly: \`npm run test:file -- tests/finance-domain-validation.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/finance-domain-validation.test.ts
\`\`\`

#### Contributor Notes
Documentation addition.` + footerMarkdown
  },
  {
    title: "[Test] Add Single-Item Boundary Test Case to Task Prioritization Test Suite",
    body: `- **Labels:** \`good first issue\`, \`testing\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`tests/tasks-validation.test.ts\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
Sorting and ordering algorithms must gracefully handle single-element arrays without mutation errors or indexing issues.

#### Current Behavior
\`tests/tasks-validation.test.ts\` covers multi-item sorting, but lacks a dedicated single-element array boundary test.

#### Requested Change
Add a test case in \`tests/tasks-validation.test.ts\` verifying that prioritizing an array with 1 task returns that single task without errors.

#### Acceptance Criteria
- [ ] Single-item sorting test case added to \`tests/tasks-validation.test.ts\`.
- [ ] Test suite executes cleanly: \`npm run test:file -- tests/tasks-validation.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/tasks-validation.test.ts
\`\`\`

#### Contributor Notes
Single test case addition.` + footerMarkdown
  },
  {
    title: "[A11y] Add aria-expanded and aria-controls to Navigation Menu Triggers",
    body: `- **Labels:** \`good first issue\`, \`accessibility\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`src/components/settings/settings-nav.tsx\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 1 (Beginner)

#### Why This Matters
Collapsible navigation components require clear state indicators so screen reader users understand whether navigation panels are expanded or collapsed.

#### Current Behavior
Navigation triggers in \`src/components/settings/settings-nav.tsx\` toggle sub-menus but do not declare \`aria-expanded\` or \`aria-controls\` attributes.

#### Requested Change
Add \`aria-expanded={isExpanded}\` and \`aria-controls="nav-section-id"\` to collapsible navigation buttons in \`src/components/settings/settings-nav.tsx\`.

#### Acceptance Criteria
- [ ] \`aria-expanded\` dynamic state attribute added.
- [ ] \`aria-controls\` target ID attribute added.
- [ ] Verification command succeeds: \`npm run test:file -- tests/settings-domain-validation.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/settings-domain-validation.test.ts
\`\`\`

#### Contributor Notes
Accessibility improvement.` + footerMarkdown
  },
  {
    title: "[Test] Add Step Completion Boundary Test Case to Weekly Review Test Suite",
    body: `- **Labels:** \`good first issue\`, \`testing\`, \`difficulty:beginner\`, \`area:core\`
- **Target File:** \`tests/weekly-review.test.ts\`
- **Estimated Time:** 10–15 minutes
- **Difficulty:** Level 2 (Beginner)

#### Why This Matters
Weekly review rituals govern accountability progress. Adding explicit boundary test coverage ensures ritual step transitions work reliably.

#### Current Behavior
\`tests/weekly-review.test.ts\` tests review step navigation, but does not explicitly test the transition from step 5 to completion state.

#### Requested Change
Add a unit test in \`tests/weekly-review.test.ts\` asserting that completing the final step marks the review ritual state as \`completed\`.

#### Acceptance Criteria
- [ ] Final step completion test case added to \`tests/weekly-review.test.ts\`.
- [ ] Verification command passes cleanly: \`npm run test:file -- tests/weekly-review.test.ts\`.

#### Verification
\`\`\`bash
npm run test:file -- tests/weekly-review.test.ts
\`\`\`

#### Contributor Notes
Single-file test addition.` + footerMarkdown
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
  console.log(`Starting creation of ${issues.length} beginner-friendly issues...`);
  for (let i = 0; i < issues.length; i++) {
    console.log(`Creating issue ${i + 1}/${issues.length}...`);
    try {
      await createIssue(issues[i]);
      // Small delay between API calls to prevent rate limits
      await new Promise(r => setTimeout(r, 1200));
    } catch (e) {
      console.error(`Error on issue ${i + 1}:`, e.message);
    }
  }
  console.log("All issues processed!");
}

run();
