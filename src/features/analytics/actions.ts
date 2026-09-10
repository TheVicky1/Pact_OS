'use server';

import {
  AnalyticsTimeRange,
  AnalyticsOverviewData,
  getAnalyticsOverview,
} from './data-access';

/**
 * Server Action callable by client components to fetch analytics data dynamically when time range or period changes.
 */
export async function getAnalyticsOverviewAction(
  timeRange: AnalyticsTimeRange,
  anchorDateStr: string,
  timeZone: string
): Promise<AnalyticsOverviewData | null> {
  const res = await getAnalyticsOverview(timeRange, anchorDateStr, timeZone);
  return res.data;
}
