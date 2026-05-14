'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RevenueDashboard } from './RevenueDashboard';
import { PerformanceDashboard } from './PerformanceDashboard';
import { PipelineDashboard } from './PipelineDashboard';
import { PredictionAccuracyDashboard } from './PredictionAccuracyDashboard';
import { ReportsList } from '@/components/reports/ReportsList';

const TABS = ['Revenue', 'Performance', 'Pipeline', 'IA Accuracy', 'Reports'] as const;
type Tab = (typeof TABS)[number];

export function DashboardTabs() {
  const [active, setActive] = useState<Tab>('Revenue');
  return (
    <>
      <div className="mb-4 flex items-center gap-0 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={cn(
              'mb-[-1px] flex-none cursor-pointer border-b-2 border-transparent bg-transparent px-3 py-[10px] text-[13px] font-medium text-ink-3 transition hover:text-ink',
              active === t && 'border-accent text-ink',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div>
        {active === 'Revenue' && <RevenueDashboard />}
        {active === 'Performance' && <PerformanceDashboard />}
        {active === 'Pipeline' && <PipelineDashboard />}
        {active === 'IA Accuracy' && <PredictionAccuracyDashboard />}
        {active === 'Reports' && <ReportsList />}
      </div>
    </>
  );
}
