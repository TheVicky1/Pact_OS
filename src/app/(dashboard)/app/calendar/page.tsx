import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserProfileInfo } from '@/lib/auth/profile';
import { getGoals } from '@/features/goals/data-access';
import { getProjects } from '@/features/projects/data-access';
import { getTasks } from '@/features/tasks/data-access';
import { getCalendarEventsForDay } from '@/features/calendar/data-access';
import { getLocalDateString } from '@/lib/time';
import { DailyCalendarWidget } from '@/features/calendar';
import { PageContainer } from '@/components/ui';

export const metadata = {
  title: 'Daily Calendar | PACT OS',
  description: 'Visual day planner and time-grid calendar for your commitments and events.',
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ timezone }, { data: goals }, { data: projects }, { data: tasks }] =
    await Promise.all([
      getUserProfileInfo(supabase, user.id, user.user_metadata),
      getGoals(),
      getProjects(),
      getTasks(),
    ]);

  const todayStr = getLocalDateString(new Date(), timezone);
  const { data: initialEvents } = await getCalendarEventsForDay(todayStr, timezone);

  return (
    <PageContainer as="main">
      <div className="space-y-6">
        <DailyCalendarWidget
          initialEvents={initialEvents || []}
          timezone={timezone}
          projects={projects || []}
          goals={goals || []}
          tasks={tasks || []}
        />
      </div>
    </PageContainer>
  );
}
