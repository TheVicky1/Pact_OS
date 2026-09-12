import fs from 'node:fs';
import path from 'node:path';

const filesToScan = [
  'src/components/ui/app-header.tsx',
  'src/features/dashboard/components/daily-timeline-widget.tsx',
  'src/features/dashboard/components/overview-view.tsx',
  'src/lib/time.ts',
  'src/types/domain.ts',
  'src/lib/validations/calendar.ts',
  'supabase/migrations/20260909000000_create_calendar_events.sql',
  'tests/calendar-domain-validation.test.ts',
  'src/features/calendar/actions.ts',
  'src/features/calendar/data-access.ts',
  'src/features/calendar/index.ts',
  'src/features/calendar/layout.ts',
  'src/features/calendar/components/daily-calendar-widget.tsx',
  'src/features/calendar/components/event-modal.tsx',
  'src/app/(dashboard)/app/calendar/page.tsx',
  'src/app/(dashboard)/app/calendar/loading.tsx',
  'src/app/(dashboard)/app/calendar/error.tsx',
  'src/types/notifications.ts',
  'src/features/notifications/data-access.ts',
  'src/features/notifications/actions.ts',
  'src/lib/notifications/delivery.ts',
  'src/components/ui/notification-popover.tsx',
  'supabase/migrations/20260911010000_create_notifications_table.sql',
  'tests/notifications.test.ts',
  'src/lib/integrations/google-calendar/client.ts',
  'src/lib/integrations/google-calendar/sync.ts',
  'src/features/calendar/google-actions.ts',
  'src/features/settings/components/integrations-settings-card.tsx',
  'supabase/migrations/20260911020000_google_calendar_sync.sql',
  'tests/google-calendar-sync.test.ts',
];

const secretPatterns = [
  /(?:service_role|service-role|serviceRole)/i,
  /(?:secret|private)[_-]?key/i,
  /eyJhbGciOi[a-zA-Z0-9_-]+/i,
  /sb_secret_[a-zA-Z0-9_-]+/i,
  /ghp_[a-zA-Z0-9]{36}/i,
  /AIza[0-9A-Za-z-_]{35}/i,
  /sk-[a-zA-Z0-9]{20,}/i,
  /BEGIN (?:RSA|OPENSSH|EC|PGP) PRIVATE KEY/i,
];

let violations = 0;

for (const relPath of filesToScan) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of secretPatterns) {
      if (pattern.test(line)) {
        console.error(`[VIOLATION] ${relPath}:${i + 1} matches prohibited secret pattern: ${pattern.toString()}`);
        violations++;
      }
    }
  }
}

if (violations === 0) {
  console.log(`✔ Secret Scan PASSED: 0 secrets or sensitive credentials detected across ${filesToScan.length} scanned files.`);
  process.exit(0);
} else {
  console.error(`✖ Secret Scan FAILED: ${violations} potential secret(s) detected.`);
  process.exit(1);
}
