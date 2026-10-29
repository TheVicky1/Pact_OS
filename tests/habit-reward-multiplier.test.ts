import { describe, it, expect } from 'vitest';
import { calculateRewardMultiplier } from '../src/lib/habits/streaks';

describe('Habit Reward Multiplier Helper', () => {
  // Test for 7-Day Streak: 1.5x reward multiplier
  it('should return a 1.5x multiplier for a 7-day streak', () => {
    const streakDays = 7;
    const multiplier = calculateRewardMultiplier(streakDays);
    expect(multiplier).toBe(1.5);
  });

  // Test for 30-Day Streak: 2.0x reward multiplier
  it('should return a 2.0x multiplier for a 30-day streak', () => {
    const streakDays = 30;
    const multiplier = calculateRewardMultiplier(streakDays);
    expect(multiplier).toBe(2.0);
  });

  // Test for Broken Streak: Resets multiplier to 1.0x baseline
  it('should return a 1.0x multiplier for a broken streak (0 days)', () => {
    const streakDays = 0;
    const multiplier = calculateRewardMultiplier(streakDays);
    expect(multiplier).toBe(1.0);
  });

  // Test for Boundary Condition: Negative streak days
  it('should return a 1.0x multiplier for negative streak days', () => {
    const streakDays = -5;
    const multiplier = calculateRewardMultiplier(streakDays);
    expect(multiplier).toBe(1.0);
  });

  // Test for Boundary Condition: Fractional streak days
  it('should return a 1.0x multiplier for fractional streak days', () => {
    const streakDays = 3.5;
    const multiplier = calculateRewardMultiplier(streakDays);
    expect(multiplier).toBe(1.0);
  });

  // Test for Boundary Condition: Milestones beyond 30 days
  it('should return a 2.0x multiplier for streak days beyond 30', () => {
    const streakDays = 45;
    const multiplier = calculateRewardMultiplier(streakDays);
    expect(multiplier).toBe(2.0);
  });

  // Test for Boundary Condition: Edge case of 1 day
  it('should return a 1.0x multiplier for a 1-day streak', () => {
    const streakDays = 1;
    const multiplier = calculateRewardMultiplier(streakDays);
    expect(multiplier).toBe(1.0);
  });

  // Test for Boundary Condition: Edge case of 6 days
  it('should return a 1.0x multiplier for a 6-day streak', () => {
    const streakDays = 6;
    const multiplier = calculateRewardMultiplier(streakDays);
    expect(multiplier).toBe(1.0);
  });

  // Test for Boundary Condition: Edge case of 29 days
  it('should return a 1.5x multiplier for a 29-day streak', () => {
    const streakDays = 29;
    const multiplier = calculateRewardMultiplier(streakDays);
    expect(multiplier).toBe(1.5);
  });

  // Test for Boundary Condition: Edge case of exactly 30 days
  it('should return a 2.0x multiplier for exactly 30 streak days', () => {
    const streakDays = 30;
    const multiplier = calculateRewardMultiplier(streakDays);
    expect(multiplier).toBe(2.0);
  });
});