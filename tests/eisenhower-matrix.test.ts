import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyTaskQuadrant,
  buildEisenhowerDistribution,
  type PrioritizedTask,
} from '../src/lib/analytics/eisenhower-matrix';

describe('Eisenhower Matrix Quadrant Classifier', () => {
  describe('classifyTaskQuadrant', () => {
    it('classifies urgent and important task into Q1_DO_FIRST', () => {
      const task: PrioritizedTask = {
        id: 'task-1',
        title: 'Fix critical production outage',
        isUrgent: true,
        isImportant: true,
        estimatedMinutes: 60,
      };

      const classified = classifyTaskQuadrant(task);

      assert.equal(classified.id, 'task-1');
      assert.equal(classified.title, 'Fix critical production outage');
      assert.equal(classified.estimatedMinutes, 60);
      assert.equal(classified.quadrant, 'Q1_DO_FIRST');
      assert.equal(
        classified.actionGuidance,
        'Do immediately. Address high-impact urgent crisis or deadline.'
      );
    });

    it('classifies non-urgent but important task into Q2_SCHEDULE', () => {
      const task: PrioritizedTask = {
        id: 'task-2',
        title: 'Architect system scalability roadmap',
        isUrgent: false,
        isImportant: true,
      };

      const classified = classifyTaskQuadrant(task);

      assert.equal(classified.id, 'task-2');
      assert.equal(classified.quadrant, 'Q2_SCHEDULE');
      assert.equal(
        classified.actionGuidance,
        'Schedule protected deep work. Strategic growth and proactive focus.'
      );
    });

    it('classifies urgent but non-important task into Q3_DELEGATE', () => {
      const task: PrioritizedTask = {
        id: 'task-3',
        title: 'Respond to recurring vendor email inquiry',
        isUrgent: true,
        isImportant: false,
      };

      const classified = classifyTaskQuadrant(task);

      assert.equal(classified.id, 'task-3');
      assert.equal(classified.quadrant, 'Q3_DELEGATE');
      assert.equal(
        classified.actionGuidance,
        'Delegate, automate, or minimize interruptions.'
      );
    });

    it('classifies non-urgent and non-important task into Q4_ELIMINATE', () => {
      const task: PrioritizedTask = {
        id: 'task-4',
        title: 'Browse social media updates',
        isUrgent: false,
        isImportant: false,
      };

      const classified = classifyTaskQuadrant(task);

      assert.equal(classified.id, 'task-4');
      assert.equal(classified.quadrant, 'Q4_ELIMINATE');
      assert.equal(
        classified.actionGuidance,
        'Eliminate or drop. Low-value distraction.'
      );
    });

    it('handles falsy or coerced boolean properties gracefully', () => {
      const taskWithAny = {
        id: 'task-edge',
        title: 'Edge test',
        isUrgent: 1 as unknown as boolean,
        isImportant: 0 as unknown as boolean,
      };

      const classified = classifyTaskQuadrant(taskWithAny);
      assert.equal(classified.quadrant, 'Q3_DELEGATE');
    });
  });

  describe('buildEisenhowerDistribution', () => {
    it('returns zeroes and empty lists when tasks list is empty', () => {
      const distribution = buildEisenhowerDistribution([]);

      assert.deepEqual(distribution.q1Tasks, []);
      assert.deepEqual(distribution.q2Tasks, []);
      assert.deepEqual(distribution.q3Tasks, []);
      assert.deepEqual(distribution.q4Tasks, []);
      assert.equal(distribution.totalTasks, 0);
      assert.equal(distribution.q2StrategicRatio, 0.0);
    });

    it('handles non-array inputs cleanly', () => {
      const distribution = buildEisenhowerDistribution(null as unknown as PrioritizedTask[]);

      assert.deepEqual(distribution.q1Tasks, []);
      assert.deepEqual(distribution.q2Tasks, []);
      assert.deepEqual(distribution.q3Tasks, []);
      assert.deepEqual(distribution.q4Tasks, []);
      assert.equal(distribution.totalTasks, 0);
      assert.equal(distribution.q2StrategicRatio, 0.0);
    });

    it('partitions tasks correctly across all quadrants and calculates q2StrategicRatio', () => {
      const tasks: PrioritizedTask[] = [
        { id: '1', title: 'Q1 Task 1', isUrgent: true, isImportant: true },
        { id: '2', title: 'Q2 Task 1', isUrgent: false, isImportant: true },
        { id: '3', title: 'Q2 Task 2', isUrgent: false, isImportant: true },
        { id: '4', title: 'Q3 Task 1', isUrgent: true, isImportant: false },
        { id: '5', title: 'Q4 Task 1', isUrgent: false, isImportant: false },
      ];

      const distribution = buildEisenhowerDistribution(tasks);

      assert.equal(distribution.totalTasks, 5);
      assert.equal(distribution.q1Tasks.length, 1);
      assert.equal(distribution.q2Tasks.length, 2);
      assert.equal(distribution.q3Tasks.length, 1);
      assert.equal(distribution.q4Tasks.length, 1);

      assert.equal(distribution.q1Tasks[0].id, '1');
      assert.equal(distribution.q2Tasks[0].id, '2');
      assert.equal(distribution.q2Tasks[1].id, '3');
      assert.equal(distribution.q3Tasks[0].id, '4');
      assert.equal(distribution.q4Tasks[0].id, '5');

      // 2 / 5 = 0.4
      assert.equal(distribution.q2StrategicRatio, 0.4);
    });

    it('accurately rounds strategic ratio to 4 decimal places', () => {
      const tasks: PrioritizedTask[] = [
        { id: '1', title: 'Strategic work', isUrgent: false, isImportant: true },
        { id: '2', title: 'Urgent crisis', isUrgent: true, isImportant: true },
        { id: '3', title: 'Other work', isUrgent: false, isImportant: false },
      ];

      // 1 / 3 = 0.333333... -> 0.3333
      const distribution = buildEisenhowerDistribution(tasks);

      assert.equal(distribution.totalTasks, 3);
      assert.equal(distribution.q2Tasks.length, 1);
      assert.equal(distribution.q2StrategicRatio, 0.3333);
    });

    it('returns ratio of 1.0 when all tasks are in Q2', () => {
      const tasks: PrioritizedTask[] = [
        { id: '1', title: 'Plan Q1', isUrgent: false, isImportant: true },
        { id: '2', title: 'Plan Q2', isUrgent: false, isImportant: true },
      ];

      const distribution = buildEisenhowerDistribution(tasks);

      assert.equal(distribution.totalTasks, 2);
      assert.equal(distribution.q2Tasks.length, 2);
      assert.equal(distribution.q2StrategicRatio, 1.0);
    });

    it('filters out nullish items inside tasks array', () => {
      const tasks: PrioritizedTask[] = [
        { id: '1', title: 'Valid task', isUrgent: false, isImportant: true },
        null as unknown as PrioritizedTask,
        undefined as unknown as PrioritizedTask,
      ];

      const distribution = buildEisenhowerDistribution(tasks);

      assert.equal(distribution.totalTasks, 1);
      assert.equal(distribution.q2Tasks.length, 1);
      assert.equal(distribution.q2StrategicRatio, 1.0);
    });
  });
});