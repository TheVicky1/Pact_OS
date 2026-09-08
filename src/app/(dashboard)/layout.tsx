import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/ui/app-header';
import { getUserProfileInfo } from '@/lib/auth/profile';

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

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-[#d4af37]/30 selection:text-zinc-100">
      <AppHeader timezone={timezone} userName={fullName} />
      <div className="flex-1 w-full relative">
        {/* Subtle Ambient Backlight Glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#d4af37]/5 via-transparent to-transparent blur-3xl -z-10" />
        {children}
      </div>
    </div>
  );
}
