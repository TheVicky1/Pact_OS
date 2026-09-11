import { redirect } from 'next/navigation';

interface IntegrationActivityPageProps {
  params: Promise<{ provider: string }>;
}

export default async function IntegrationActivityRedirectPage({
  params,
}: IntegrationActivityPageProps) {
  const { provider } = await params;
  const cleanProvider = provider?.toLowerCase();
  const validProvider =
    cleanProvider === 'github' || cleanProvider === 'leetcode' || cleanProvider === 'codeforces'
      ? cleanProvider
      : 'github';

  redirect(`/app/analytics?platform=${validProvider}#proof-of-work`);
}
