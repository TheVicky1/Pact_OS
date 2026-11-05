export interface PrioritizedTask {
  id: string;
  title: string;
  isUrgent: boolean;
  isImportant: boolean;
  estimatedMinutes?: number;
}

export type EisenhowerQuadrant = 'Q1_DO_FIRST' | 'Q2_SCHEDULE' | 'Q3_DELEGATE' | 'Q4_ELIMINATE';

export interface ClassifiedEisenhowerTask extends PrioritizedTask {
  quadrant: EisenhowerQuadrant;
  actionGuidance: string;
}

export interface EisenhowerDistribution {
  q1Tasks: ClassifiedEisenhowerTask[];
  q2Tasks: ClassifiedEisenhowerTask[];
  q3Tasks: ClassifiedEisenhowerTask[];
  q4Tasks: ClassifiedEisenhowerTask[];
  totalTasks: number;
  q2StrategicRatio: number;
}

export function classifyTaskQuadrant(task: PrioritizedTask): ClassifiedEisenhowerTask {
  const isUrgent = Boolean(task?.isUrgent);
  const isImportant = Boolean(task?.isImportant);

  if (isUrgent && isImportant) {
    return { ...task, quadrant: 'Q1_DO_FIRST', actionGuidance: 'Do immediately. Address high-impact urgent crisis or deadline.' };
  }
  if (!isUrgent && isImportant) {
    return { ...task, quadrant: 'Q2_SCHEDULE', actionGuidance: 'Schedule protected deep work. Strategic growth and proactive focus.' };
  }
  if (isUrgent && !isImportant) {
    return { ...task, quadrant: 'Q3_DELEGATE', actionGuidance: 'Delegate, automate, or minimize interruptions.' };
  }
  return { ...task, quadrant: 'Q4_ELIMINATE', actionGuidance: 'Eliminate or drop. Low-value distraction.' };
}

export function buildEisenhowerDistribution(tasks: PrioritizedTask[]): EisenhowerDistribution {
  const validTasks = Array.isArray(tasks) ? tasks.filter(Boolean) : [];
  const q1Tasks: ClassifiedEisenhowerTask[] = [];
  const q2Tasks: ClassifiedEisenhowerTask[] = [];
  const q3Tasks: ClassifiedEisenhowerTask[] = [];
  const q4Tasks: ClassifiedEisenhowerTask[] = [];

  for (const task of validTasks) {
    const classified = classifyTaskQuadrant(task);
    switch (classified.quadrant) {
      case 'Q1_DO_FIRST': q1Tasks.push(classified); break;
      case 'Q2_SCHEDULE': q2Tasks.push(classified); break;
      case 'Q3_DELEGATE': q3Tasks.push(classified); break;
      case 'Q4_ELIMINATE': q4Tasks.push(classified); break;
    }
  }

  const totalTasks = validTasks.length;
  const rawRatio = totalTasks === 0 ? 0.0 : Math.round((q2Tasks.length / totalTasks) * 10000) / 10000;
  const q2StrategicRatio = Math.min(Math.max(rawRatio, 0.0), 1.0);

  return { q1Tasks, q2Tasks, q3Tasks, q4Tasks, totalTasks, q2StrategicRatio };
}