export type RewardedPlacement = 'show_again' | 'hint' | 'continue' | 'double_coins' | 'streak_saver';

/**
 * Phase 1 stand-in: grants the reward straight away so the helpers can be
 * played with. Phase 5 replaces the body with the real "Rewarded - bonuses"
 * ad, calling onReward only from the EARNED_REWARD callback.
 */
export function showRewarded(_placement: RewardedPlacement, onReward: () => void): void {
  onReward();
}
