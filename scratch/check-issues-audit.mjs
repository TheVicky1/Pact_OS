import fs from 'node:fs';

const issues = [
  { id: 1, file: 'docs/DEVELOPMENT.md', search: 'Currency' },
  { id: 2, file: 'docs/TROUBLESHOOTING.md', search: 'Database' },
  { id: 3, file: 'docs/INTEGRATIONS.md', search: 'LeetCode' },
  { id: 4, file: 'docs/CONTRIBUTING-BEGINNERS.md', search: 'npm test' },
  { id: 5, file: 'docs/GIT_WORKFLOW.md', search: 'Commit' },
  { id: 6, file: 'src/features/goals/components/goals-view.tsx', search: 'No goals' },
  { id: 7, file: 'src/features/dashboard/components/daily-cadence-widget.tsx', search: 'task' },
  { id: 8, file: 'src/features/finance/components/transaction-list.tsx', search: 'Category' },
  { id: 9, file: 'src/features/habits/components/streak-summary-card.tsx', search: 'streak' },
  { id: 10, file: 'src/features/tasks/components/task-form-modal.tsx', search: 'ModalFooter' },
  { id: 11, file: 'src/features/analytics/components/analytics-skeleton.tsx', search: 'border' },
  { id: 12, file: 'src/components/ui/keyboard-shortcuts-modal.tsx', search: 'Close' },
  { id: 13, file: 'src/components/ui/notification-popover.tsx', search: 'Mark' },
  { id: 14, file: 'src/components/ui/user-profile-dropdown.tsx', search: 'isOpen' },
  { id: 15, file: 'src/features/dashboard/components/active-focus-card.tsx', search: 'focus' },
  { id: 16, file: 'src/lib/money.ts', search: 'formatCentsToCurrency' },
  { id: 17, file: 'src/lib/time.ts', search: 'localToUtc' },
  { id: 18, file: 'tests/habits-routines.test.ts', search: 'streak' },
  { id: 19, file: 'tests/weekly-review.test.ts', search: 'step' },
  { id: 20, file: 'tests/notifications.test.ts', search: 'notification' }
];

let validCount = 0;

for (const iss of issues) {
  if (!fs.existsSync(iss.file)) {
    console.log(`❌ Issue #${iss.id} (${iss.file}): FILE MISSING`);
    continue;
  }
  const content = fs.readFileSync(iss.file, 'utf8');
  const found = content.toLowerCase().includes(iss.search.toLowerCase());
  if (found) {
    validCount++;
    console.log(`✅ Issue #${iss.id} (${iss.file}): Target content found ("${iss.search}")`);
  } else {
    console.log(`⚠️ Issue #${iss.id} (${iss.file}): Target content NOT found ("${iss.search}")`);
  }
}

console.log(`\nAudit Summary: ${validCount}/${issues.length} issue targets verified in current codebase.`);
