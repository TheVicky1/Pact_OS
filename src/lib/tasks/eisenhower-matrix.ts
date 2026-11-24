import {
  classifyTaskQuadrant,
  type ClassifiedEisenhowerTask,
} from '../analytics/eisenhower-matrix';

export type EisenhowerQuadrant = 1 | 2 | 3 | 4;

export interface QuadrantClassification {
  quadrant: EisenhowerQuadrant;
  name: 'DO_FIRST' | 'SCHEDULE' | 'DELEGATE' | 'ELIMINATE';
  label: string;
  action: string;
  colorToken: string;
}

const CLASSIFICATIONS: Record<
  ClassifiedEisenhowerTask['quadrant'],
  QuadrantClassification
> = {
  Q1_DO_FIRST: {
    quadrant: 1,
    name: 'DO_FIRST',
    label: 'Urgent & Important',
    action: 'Do immediately',
    colorToken: 'amber',
  },
  Q2_SCHEDULE: {
    quadrant: 2,
    name: 'SCHEDULE',
    label: 'Important, Not Urgent',
    action: 'Schedule time-block',
    colorToken: 'emerald',
  },
  Q3_DELEGATE: {
    quadrant: 3,
    name: 'DELEGATE',
    label: 'Urgent, Not Important',
    action: 'Automate or minimize',
    colorToken: 'sky',
  },
  Q4_ELIMINATE: {
    quadrant: 4,
    name: 'ELIMINATE',
    label: 'Neither Urgent nor Important',
    action: 'Consider dropping',
    colorToken: 'zinc',
  },
};

export function classifyEisenhowerQuadrant(task: {
  isUrgent: boolean;
  isImportant: boolean;
}): QuadrantClassification {
  const { quadrant } = classifyTaskQuadrant({
    id: '',
    title: '',
    isUrgent: task.isUrgent,
    isImportant: task.isImportant,
  });

  return CLASSIFICATIONS[quadrant];
}
