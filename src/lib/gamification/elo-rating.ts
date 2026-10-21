/** Match score: 1 for a win, 0.5 for a draw, and 0 for a loss. */
export type MatchOutcome = 1 | 0.5 | 0;

/** Rating bands used by accountability circle leaderboards. */
export type MemberRankTier = 'novice' | 'apprentice' | 'adept' | 'master' | 'grandmaster';

/** Member statistics before a match; new members start at rating 1200. */
export interface EloMemberProfile {
  rating: number;
  matchesPlayed: number;
  winStreak: number;
}

/** Updated ratings and actual deltas after applying the rating floor. */
export interface EloMatchResult {
  playerNewRating: number;
  opponentNewRating: number;
  playerRatingDelta: number;
  opponentRatingDelta: number;
  playerExpectedScore: number;
  opponentExpectedScore: number;
  playerNewTier: MemberRankTier;
}

/** Optional tuning for accountability circle matches. */
export interface EloOptions {
  /** Defaults to 32. */
  baseKFactor?: number;
  /** Defaults to 10; provisional members use 1.5 times the base K. */
  placementMatchesCount?: number;
  /** Defaults to true; a winner with a pre-match streak >= 3 gets +2. */
  enableStreakBonus?: boolean;
}

/** Calculate the standard Elo expected score, rounded to four decimals. */
export function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  return Math.round((1 / (1 + 10 ** ((opponentRating - playerRating) / 400))) * 10000) / 10000;
}

/** Placement volatility takes precedence over elite (rating >= 2000) stability. */
export function determineKFactor(profile: EloMemberProfile, baseK = 32, placementCount = 10): number {
  if (profile.matchesPlayed < placementCount) return baseK * 1.5;
  if (profile.rating >= 2000) return baseK * 0.5;
  return baseK;
}

/** Classify a rating using inclusive lower boundaries for each rank. */
export function getMemberTier(rating: number): MemberRankTier {
  if (rating < 1000) return 'novice';
  if (rating < 1400) return 'apprentice';
  if (rating < 1800) return 'adept';
  if (rating < 2200) return 'master';
  return 'grandmaster';
}

/**
 * Resolve a match without mutating either pre-match profile.
 * Each member uses their own K-factor. Only the winner can earn the additive
 * streak bonus, so adjustments need not sum to zero. Ratings cannot drop below 100.
 */
export function calculateEloMatch(
  player: EloMemberProfile,
  opponent: EloMemberProfile,
  outcome: MatchOutcome,
  options: EloOptions = {},
): EloMatchResult {
  const { baseKFactor = 32, placementMatchesCount = 10, enableStreakBonus = true } = options;
  const playerExpectedScore = calculateExpectedScore(player.rating, opponent.rating);
  const opponentExpectedScore = calculateExpectedScore(opponent.rating, player.rating);
  const playerK = determineKFactor(player, baseKFactor, placementMatchesCount);
  const opponentK = determineKFactor(opponent, baseKFactor, placementMatchesCount);
  const playerBonus = enableStreakBonus && outcome === 1 && player.winStreak >= 3 ? 2 : 0;
  const opponentBonus = enableStreakBonus && outcome === 0 && opponent.winStreak >= 3 ? 2 : 0;
  const playerNewRating = Math.max(
    100,
    player.rating + Math.round(playerK * (outcome - playerExpectedScore)) + playerBonus,
  );
  const opponentNewRating = Math.max(
    100,
    opponent.rating + Math.round(opponentK * (1 - outcome - opponentExpectedScore)) + opponentBonus,
  );

  return {
    playerNewRating,
    opponentNewRating,
    playerRatingDelta: playerNewRating - player.rating,
    opponentRatingDelta: opponentNewRating - opponent.rating,
    playerExpectedScore,
    opponentExpectedScore,
    playerNewTier: getMemberTier(playerNewRating),
  };
}
