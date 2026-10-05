import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { getUserProfileInfo } from '@/lib/auth/profile';
import { resolveFontScale } from '@/lib/ui/font-scale';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { fullName, timezone } = await getUserProfileInfo(supabase, user.id, user.user_metadata);
  const fontScale = resolveFontScale(user.user_metadata?.preferences?.fontScale);

  return (
    <AppShell userName={fullName} userEmail={user.email} timezone={timezone} fontScale={fontScale}>
      {children}
    </AppShell>
  );
}
