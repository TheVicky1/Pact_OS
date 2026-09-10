'use client';

import React, { useState, useTransition } from 'react';
import {
  AnalyticsOverviewData,
  AnalyticsTimeRange,
} from '@/lib/analytics';
import { getAnalyticsOverviewAction } from '../actions';
import { AnalyticsHeader } from './analytics-header';
import { AnalyticsSummaryCards } from './analytics-summary-cards';
import { CommitmentActivityChart } from './commitment-activity-chart';
import { GoalProgressCard } from './goal-progress-card';
import { ProjectProgressCard } from './project-progress-card';
import { AccountabilityOutcomesCard } from './accountability-outcomes-card';
import { FactualInsightsCard } from './factual-insights-card';

interface AnalyticsWorkspaceProps {
  initialData: AnalyticsOverviewData;
  userTimeZone: string;
}

export function AnalyticsWorkspace({
  initialData,
  userTimeZone,
}: AnalyticsWorkspaceProps) {
  const [data, setData] = useState<AnalyticsOverviewData>(initialData);
  const [isPending, startTransition] = useTransition();

  const loadData = (timeRange: AnalyticsTimeRange, anchorDateStr: string) => {
    startTransition(async () => {
      const res = await getAnalyticsOverviewAction(timeRange, anchorDateStr, userTimeZone);
      if (res) {
        setData(res);
      }
    });
  };

  const handleTimeRangeChange = (newRange: AnalyticsTimeRange) => {
    loadData(newRange, data.anchorDateStr);
  };

  const handlePrevPeriod = () => {
    const [y, m, d] = data.anchorDateStr.split('-').map(Number);
    const curDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    if (data.timeRange === 'week') {
      curDate.setUTCDate(curDate.getUTCDate() - 7);
    } else if (data.timeRange === 'month') {
      curDate.setUTCMonth(curDate.getUTCMonth() - 1);
    } else {
      // quarter
      curDate.setUTCMonth(curDate.getUTCMonth() - 3);
    }

    const nextAnchor = `${curDate.getUTCFullYear()}-${String(curDate.getUTCMonth() + 1).padStart(2, '0')}-${String(curDate.getUTCDate()).padStart(2, '0')}`;
    loadData(data.timeRange, nextAnchor);
  };

  const handleNextPeriod = () => {
    const [y, m, d] = data.anchorDateStr.split('-').map(Number);
    const curDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    if (data.timeRange === 'week') {
      curDate.setUTCDate(curDate.getUTCDate() + 7);
    } else if (data.timeRange === 'month') {
      curDate.setUTCMonth(curDate.getUTCMonth() + 1);
    } else {
      // quarter
      curDate.setUTCMonth(curDate.getUTCMonth() + 3);
    }

    const nextAnchor = `${curDate.getUTCFullYear()}-${String(curDate.getUTCMonth() + 1).padStart(2, '0')}-${String(curDate.getUTCDate()).padStart(2, '0')}`;
    loadData(data.timeRange, nextAnchor);
  };

  const handleCurrentPeriod = () => {
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    loadData(data.timeRange, todayStr);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Range Filter and Navigation */}
      <AnalyticsHeader
        timeRange={data.timeRange}
        periodLabel={data.periodLabel}
        onTimeRangeChange={handleTimeRangeChange}
        onPrevPeriod={handlePrevPeriod}
        onNextPeriod={handleNextPeriod}
        onCurrentPeriod={handleCurrentPeriod}
        isLoading={isPending}
      />

      {/* 2. Primary 4 Metric Summary Cards */}
      <AnalyticsSummaryCards
        completion={data.completionMetrics}
        sessions={data.sessionMetrics}
      />

      {/* 3. Primary Execution Chart: Commitment Activity */}
      <CommitmentActivityChart
        activityTrends={data.activityTrends}
        periodLabel={data.periodLabel}
      />

      {/* 4. Mid Grid: Goals & Projects Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalProgressCard goals={data.goalsProgress} />
        <ProjectProgressCard projects={data.projectsProgress} />
      </div>

      {/* 5. Bottom Section: Accountability Resolutions & Factual Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountabilityOutcomesCard aggregates={data.accountabilityAggregates} />
        <FactualInsightsCard observations={data.factualObservations} />
      </div>
    </div>
  );
}
