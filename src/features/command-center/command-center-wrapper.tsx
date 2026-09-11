'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CommandCenterProvider, useCommandCenter } from './command-center-context';
import { CommandPaletteModal } from './command-palette-modal';
import { TaskFormModal } from '@/features/tasks/components/task-form-modal';
import { GoalFormModal } from '@/features/goals/components/goal-form-modal';
import { ProjectFormModal } from '@/features/projects/components/project-form-modal';
import { TransactionModal } from '@/features/finance/components/transaction-modal';
import { createTransactionAction } from '@/features/finance/actions';
import { getCommandCenterBootstrapAction, CommandCenterBootstrapData } from './actions';
import { Goal } from '@/types/domain';
import { FinanceCategory, FinanceColorTag } from '@/lib/money';

function CommandCenterModals({ timezone }: { timezone?: string }) {
  const router = useRouter();
  const { activeQuickAction, closeQuickAction } = useCommandCenter();

  const [bootstrapData, setBootstrapData] = useState<CommandCenterBootstrapData>({
    goals: [],
    projects: [],
    categories: [],
  });

  // Fetch bootstrap context when a quick action is opened
  useEffect(() => {
    if (activeQuickAction) {
      getCommandCenterBootstrapAction().then((res) => {
        if (res.success && res.data) {
          setBootstrapData(res.data);
        }
      });
    }
  }, [activeQuickAction]);

  const handleSuccess = () => {
    closeQuickAction();
    router.refresh();
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const formattedCategories: FinanceCategory[] = bootstrapData.categories.map((c) => ({
    id: c.id,
    user_id: '',
    name: c.name,
    color_tag: (c.color_tag as FinanceColorTag) || 'gold',
    is_archived: false,
    created_at: '',
    updated_at: '',
  }));

  return (
    <>
      <CommandPaletteModal />

      {/* 1. Quick Create Task Modal */}
      {activeQuickAction === 'create_task' && (
        <TaskFormModal
          isOpen={true}
          onClose={closeQuickAction}
          onSuccess={handleSuccess}
          availableGoals={bootstrapData.goals}
          availableProjects={bootstrapData.projects}
          timezone={timezone}
        />
      )}

      {/* 2. Quick Create Goal Modal */}
      {activeQuickAction === 'create_goal' && (
        <GoalFormModal
          isOpen={true}
          onClose={handleSuccess}
        />
      )}

      {/* 3. Quick Create Project Modal */}
      {activeQuickAction === 'create_project' && (
        <ProjectFormModal
          isOpen={true}
          onClose={handleSuccess}
          availableGoals={bootstrapData.goals as Goal[]}
        />
      )}

      {/* 4. Quick Log Expense / Income Modal */}
      {(activeQuickAction === 'log_expense' || activeQuickAction === 'log_income') && (
        <TransactionModal
          isOpen={true}
          onClose={closeQuickAction}
          categories={formattedCategories}
          initialType={activeQuickAction === 'log_income' ? 'income' : 'expense'}
          currentDateStr={todayStr}
          onSave={async (input) => {
            const res = await createTransactionAction(input);
            if (res.success) {
              handleSuccess();
              return { success: true };
            }
            return { success: false, error: res.error || 'Failed to record transaction' };
          }}
        />
      )}
    </>
  );
}

export function CommandCenterWrapper({
  timezone,
  children,
}: {
  timezone?: string;
  children: React.ReactNode;
}) {
  return (
    <CommandCenterProvider>
      {children}
      <CommandCenterModals timezone={timezone} />
    </CommandCenterProvider>
  );
}
