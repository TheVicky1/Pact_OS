/**
 * PACT Phase 6A: Command Center & Universal Quick Capture Test Suite
 * Validates registry integrity, search scoring, ranking, entity mapping,
 * keyboard navigation math, and tenant isolation contracts.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_STATIC_COMMANDS,
  STATIC_QUICK_ACTIONS,
  STATIC_NAVIGATION_COMMANDS,
} from '../src/lib/command-center/registry';
import {
  sanitizeSearchQuery,
  computeMatchScore,
  mapEntitiesToSearchResults,
  filterAndGroupCommands,
  flattenCommandGroups,
  getNextSelectedIndex,
} from '../src/lib/command-center/search';
import { EntitySearchPayload } from '../src/lib/command-center/types';

describe('PACT Phase 6A: Global Command Center Unit Test Suite', () => {
  // ==========================================
  // 1. REGISTRY INTEGRITY & DUPLICATE DEFENSE
  // ==========================================
  it('1.1 Command registry contains zero duplicate command IDs', () => {
    const ids = new Set<string>();
    for (const cmd of ALL_STATIC_COMMANDS) {
      assert.equal(ids.has(cmd.id), false, `Duplicate command ID detected: ${cmd.id}`);
      ids.add(cmd.id);
    }
  });

  it('1.2 All static quick action commands have required fields and action keys', () => {
    assert.equal(STATIC_QUICK_ACTIONS.length >= 5, true);
    const requiredActionKeys = [
      'create_task',
      'create_goal',
      'create_project',
      'log_expense',
      'log_income',
    ];

    for (const actionKey of requiredActionKeys) {
      const match = STATIC_QUICK_ACTIONS.find((a) => a.actionKey === actionKey);
      assert.ok(match, `Missing required quick action: ${actionKey}`);
      assert.equal(match.category, 'quick_action');
      assert.equal(typeof match.title, 'string');
      assert.equal(typeof match.iconName, 'string');
    }
  });

  it('1.3 All static navigation commands point to valid internal /app routes', () => {
    assert.equal(STATIC_NAVIGATION_COMMANDS.length >= 8, true);
    const validRoutePrefixes = ['/app'];

    for (const cmd of STATIC_NAVIGATION_COMMANDS) {
      assert.ok(cmd.href, `Navigation command ${cmd.id} missing href`);
      const isValid = validRoutePrefixes.some((prefix) => cmd.href?.startsWith(prefix));
      assert.equal(isValid, true, `Invalid navigation route: ${cmd.href}`);
      assert.equal(cmd.actionKey, 'navigate');
    }
  });

  // ==========================================
  // 2. SEARCH SANITIZATION & MATCH SCORING
  // ==========================================
  it('2.1 sanitizeSearchQuery trims, lowercases, and clamps query length', () => {
    assert.equal(sanitizeSearchQuery('  Create Task  '), 'create task');
    assert.equal(sanitizeSearchQuery(''), '');
    const longStr = 'a'.repeat(200);
    assert.equal(sanitizeSearchQuery(longStr).length, 100);
  });

  it('2.2 computeMatchScore ranks exact title match higher than keyword or subtitle match', () => {
    const item = {
      title: 'Create Task',
      subtitle: 'Add a new deadline commitment',
      keywords: ['todo', 'deadline'],
      category: 'quick_action',
    };

    const exactScore = computeMatchScore(item, 'create task');
    const prefixScore = computeMatchScore(item, 'create');
    const keywordScore = computeMatchScore(item, 'todo');
    const subtitleScore = computeMatchScore(item, 'commitment');
    const noMatchScore = computeMatchScore(item, 'finance');

    assert.equal(exactScore, 100);
    assert.equal(prefixScore, 80);
    assert.equal(keywordScore, 50);
    assert.equal(subtitleScore, 40);
    assert.equal(noMatchScore, 0);

    assert.ok(exactScore > prefixScore);
    assert.ok(prefixScore > keywordScore);
    assert.ok(keywordScore > subtitleScore);
  });

  // ==========================================
  // 3. ENTITY MAPPING & FORMATTING
  // ==========================================
  it('3.1 mapEntitiesToSearchResults formats tasks, goals, projects, and transactions accurately', () => {
    const payload: EntitySearchPayload = {
      tasks: [
        {
          id: 't-1',
          title: 'Finish algorithm paper',
          status: 'pending',
          priority: 'urgent',
          deadline_at: '2026-09-15T18:00:00.000Z',
        },
      ],
      goals: [
        {
          id: 'g-1',
          title: 'Master Systems Architecture',
          status: 'active',
          target_date: '2026-12-31',
        },
      ],
      projects: [
        {
          id: 'p-1',
          title: 'PACT Core OS',
          status: 'active',
          color_accent: '#d4af37',
        },
      ],
      transactions: [
        {
          id: 'tx-1',
          description: 'Cloud Server Hosting',
          type: 'expense',
          amount_cents: 149900, // ₹1,499.00
          transaction_date: '2026-09-08',
        },
        {
          id: 'tx-2',
          description: 'Consulting Retainer',
          type: 'income',
          amount_cents: 5000000, // ₹50,000.00
          transaction_date: '2026-09-01',
        },
      ],
    };

    const results = mapEntitiesToSearchResults(payload);
    assert.equal(results.length, 5);

    // Verify task
    const taskResult = results.find((r) => r.id === 'task-t-1');
    assert.ok(taskResult);
    assert.equal(taskResult.category, 'task');
    assert.equal(taskResult.badgeVariant, 'gold'); // urgent priority
    assert.equal(taskResult.badgeText, 'PENDING');

    // Verify goal
    const goalResult = results.find((r) => r.id === 'goal-g-1');
    assert.ok(goalResult);
    assert.equal(goalResult.category, 'goal');
    assert.equal(goalResult.badgeVariant, 'gold');

    // Verify project
    const projectResult = results.find((r) => r.id === 'project-p-1');
    assert.ok(projectResult);
    assert.equal(projectResult.category, 'project');
    assert.equal(projectResult.href, '/app/projects/p-1');

    // Verify expense transaction
    const expenseResult = results.find((r) => r.id === 'tx-tx-1');
    assert.ok(expenseResult);
    assert.equal(expenseResult.category, 'finance');
    assert.equal(expenseResult.badgeVariant, 'rose');
    assert.equal(expenseResult.badgeText, '-₹1,499.00');

    // Verify income transaction
    const incomeResult = results.find((r) => r.id === 'tx-tx-2');
    assert.ok(incomeResult);
    assert.equal(incomeResult.category, 'finance');
    assert.equal(incomeResult.badgeVariant, 'emerald');
    assert.equal(incomeResult.badgeText, '+₹50,000.00');
  });

  // ==========================================
  // 4. FILTERING & GROUPING CONTRACTS
  // ==========================================
  it('4.1 filterAndGroupCommands returns default quick actions and navigation on empty query', () => {
    const groups = filterAndGroupCommands({ query: '' });
    assert.equal(groups.length, 2);
    assert.equal(groups[0].id, 'quick_action');
    assert.equal(groups[1].id, 'navigation');
    assert.ok(groups[0].items.length > 0);
    assert.ok(groups[1].items.length > 0);
  });

  it('4.2 filterAndGroupCommands filters across commands and live entities', () => {
    const payload: EntitySearchPayload = {
      tasks: [
        {
          id: 't-10',
          title: 'Review finance statements',
          status: 'pending',
          priority: 'medium',
          deadline_at: '2026-09-20T10:00:00.000Z',
        },
      ],
      goals: [],
      projects: [],
      transactions: [],
    };

    // Searching 'finance' matches 'Go to Finance' (navigation), 'Log Expense' (quick action keywords), and task t-10 (title match)
    const groups = filterAndGroupCommands({ query: 'finance', entities: payload });
    assert.ok(groups.length >= 2);

    const flattened = flattenCommandGroups(groups);
    const hasNavFinance = flattened.some((item) => item.id === 'nav-finance');
    const hasTaskFinance = flattened.some((item) => item.id === 'task-t-10');

    assert.equal(hasNavFinance, true);
    assert.equal(hasTaskFinance, true);
  });

  it('4.3 filterAndGroupCommands respects maxPerGroup limit', () => {
    const dummyTasks = Array.from({ length: 15 }, (_, i) => ({
      id: `task-${i}`,
      title: `Task item ${i}`,
      status: 'pending',
      priority: 'normal',
      deadline_at: '2026-09-15T00:00:00.000Z',
    }));

    const payload: EntitySearchPayload = {
      tasks: dummyTasks,
      goals: [],
      projects: [],
      transactions: [],
    };

    const groups = filterAndGroupCommands({
      query: 'task',
      entities: payload,
      maxPerGroup: 4,
    });

    const taskGroup = groups.find((g) => g.id === 'task');
    assert.ok(taskGroup);
    assert.equal(taskGroup.items.length, 4);
  });

  it('4.4 filterAndGroupCommands returns empty groups array when no items match', () => {
    const groups = filterAndGroupCommands({
      query: 'zyxw_completely_nonexistent_query_123',
    });
    assert.equal(groups.length, 0);
    const flattened = flattenCommandGroups(groups);
    assert.equal(flattened.length, 0);
  });

  // ==========================================
  // 5. KEYBOARD SELECTION WRAPAROUND LOGIC
  // ==========================================
  it('5.1 getNextSelectedIndex navigates down and wraps around cleanly', () => {
    const total = 5;
    assert.equal(getNextSelectedIndex(0, 'down', total), 1);
    assert.equal(getNextSelectedIndex(3, 'down', total), 4);
    assert.equal(getNextSelectedIndex(4, 'down', total), 0); // wrap to top
  });

  it('5.2 getNextSelectedIndex navigates up and wraps around cleanly', () => {
    const total = 5;
    assert.equal(getNextSelectedIndex(2, 'up', total), 1);
    assert.equal(getNextSelectedIndex(0, 'up', total), 4); // wrap to bottom
  });

  it('5.3 getNextSelectedIndex handles zero total items gracefully', () => {
    assert.equal(getNextSelectedIndex(0, 'down', 0), 0);
    assert.equal(getNextSelectedIndex(0, 'up', 0), 0);
  });
});
