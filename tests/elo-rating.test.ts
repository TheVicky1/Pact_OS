// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  calculateEloMatch,
  calculateExpectedScore,
  determineKFactor,
  getMemberTier,
  type EloMemberProfile,
} from '../src/lib/gamification/elo-rating';

const member = (rating = 1200, matchesPlayed = 10, winStreak = 0): EloMemberProfile => ({
  rating, matchesPlayed, winStreak,
});

describe('Elo expected scores', () => {
  it('returns exactly 0.5 for equals and rounds unequal scores to four decimals', () => {
    expect(calculateExpectedScore(1200, 1200)).toBe(0.5);
    expect(calculateExpectedScore(1000, 1400)).toBe(0.0909);
    expect(calculateExpectedScore(1400, 1000)).toBe(0.9091);
  });

  it('stays bounded for extreme rating gaps', () => {
    expect(calculateExpectedScore(100, 1000000)).toBe(0);
    expect(calculateExpectedScore(1000000, 100)).toBe(1);
  });
});

describe('dynamic K-factors', () => {
  it('uses placement, regular, and elite factors at their boundaries', () => {
    expect(determineKFactor(member(1200, 9))).toBe(48);
    expect(determineKFactor(member(1999, 10))).toBe(32);
    expect(determineKFactor(member(2000, 10))).toBe(16);
    expect(determineKFactor(member(2200, 9))).toBe(48);
  });

  it('honors custom factors and placement counts, including zero', () => {
    expect(determineKFactor(member(1200, 4), 20, 5)).toBe(30);
    expect(determineKFactor(member(1200, 5), 20, 5)).toBe(20);
    expect(determineKFactor(member(2000, 5), 20, 5)).toBe(10);
    expect(determineKFactor(member(1200, 0), 20, 0)).toBe(20);
  });
});

describe('rank tiers', () => {
  it.each([
    [100, 'novice'], [999, 'novice'], [1000, 'apprentice'],
    [1399, 'apprentice'], [1400, 'adept'], [1799, 'adept'],
    [1800, 'master'], [2199, 'master'], [2200, 'grandmaster'],
  ] as const)('classifies %i as %s', (rating, tier) => {
    expect(getMemberTier(rating)).toBe(tier);
  });
});

describe('Elo match results', () => {
  it('awards 16 points for a win between established equals', () => {
    expect(calculateEloMatch(member(), member(), 1)).toEqual({
      playerNewRating: 1216, opponentNewRating: 1184,
      playerRatingDelta: 16, opponentRatingDelta: -16,
      playerExpectedScore: 0.5, opponentExpectedScore: 0.5,
      playerNewTier: 'apprentice',
    });
  });

  it('awards more for an upset than an expected win', () => {
    expect(calculateEloMatch(member(1000), member(1400), 1).playerRatingDelta).toBe(29);
    expect(calculateEloMatch(member(1400), member(1000), 1).playerRatingDelta).toBe(3);
  });

  it('leaves equal draws unchanged and moves unequal draws toward each other', () => {
    expect(calculateEloMatch(member(), member(), 0.5).playerRatingDelta).toBe(0);
    const draw = calculateEloMatch(member(1000), member(1400), 0.5);
    expect(draw.playerRatingDelta).toBe(13);
    expect(draw.opponentRatingDelta).toBe(-13);
  });

  it('uses independent placement and elite K-factors', () => {
    const result = calculateEloMatch(member(2000, 0), member(2000), 1);
    expect(result.playerRatingDelta).toBe(24);
    expect(result.opponentRatingDelta).toBe(-8);
  });

  it('passes custom options to both members', () => {
    const result = calculateEloMatch(member(1200, 2), member(1200, 3), 1, {
      baseKFactor: 20, placementMatchesCount: 3,
    });
    expect(result.playerRatingDelta).toBe(15);
    expect(result.opponentRatingDelta).toBe(-10);
    expect(calculateEloMatch(member(), member(), 1, { baseKFactor: 0 }).playerRatingDelta).toBe(0);
    expect(calculateEloMatch(member(1200, 0), member(1200, 0), 1, {
      placementMatchesCount: 0,
    }).playerRatingDelta).toBe(16);
  });

  it('gives the streak bonus only to a qualifying winner on either side', () => {
    expect(calculateEloMatch(member(1200, 10, 2), member(), 1).playerRatingDelta).toBe(16);
    const win = calculateEloMatch(member(1200, 10, 3), member(1200, 10, 4), 1);
    expect(win.playerRatingDelta).toBe(18);
    expect(win.opponentRatingDelta).toBe(-16);
    const loss = calculateEloMatch(member(1200, 10, 4), member(1200, 10, 3), 0);
    expect(loss.playerRatingDelta).toBe(-16);
    expect(loss.opponentRatingDelta).toBe(18);
    expect(calculateEloMatch(member(), member(1200, 10, 2), 0).opponentRatingDelta).toBe(16);
  });

  it('does not award bonuses for draws or when disabled', () => {
    const streak = member(1200, 10, 3);
    const draw = calculateEloMatch(streak, streak, 0.5);
    expect(draw.playerRatingDelta).toBe(0);
    expect(draw.opponentRatingDelta).toBe(0);
    expect(calculateEloMatch(streak, streak, 1, { enableStreakBonus: false }).playerRatingDelta).toBe(16);
    expect(calculateEloMatch(streak, streak, 0, { enableStreakBonus: false }).opponentRatingDelta).toBe(16);
  });

  it('clamps both sides to 100 and reports only the actual rating change', () => {
    const loss = calculateEloMatch(member(105), member(105), 0);
    expect(loss.playerNewRating).toBe(100);
    expect(loss.playerRatingDelta).toBe(-5);
    const win = calculateEloMatch(member(105), member(105), 1);
    expect(win.opponentNewRating).toBe(100);
    expect(win.opponentRatingDelta).toBe(-5);
    expect(calculateEloMatch(member(100), member(100), 0).playerRatingDelta).toBe(0);
  });

  it.each([
    [999, 'apprentice'], [1399, 'adept'], [1799, 'master'], [2199, 'grandmaster'],
  ] as const)('promotes a winner across the boundary above %i', (rating, tier) => {
    expect(calculateEloMatch(member(rating), member(rating), 1).playerNewTier).toBe(tier);
  });

  it('updates the tier after a loss and does not mutate input profiles', () => {
    const player = Object.freeze(member(1400));
    const opponent = Object.freeze(member(1400));
    expect(calculateEloMatch(player, opponent, 0).playerNewTier).toBe('apprentice');
    expect(player).toEqual(member(1400));
    expect(opponent).toEqual(member(1400));
  });
});
