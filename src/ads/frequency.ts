/**
 * When the "Interstitial - unlocks" ad may show (build prompt §6.2), as pure
 * functions so the rules are easy to test and to tune.
 *
 * It only ever shows at an unlock moment, right after its celebration card:
 *   - grid_up        a new grid size (the chapter's title card)
 *   - boss_complete  a Boss level (every 10th) was beaten
 *   - skin_unlock    a new firefly colour or lantern skin (phase 4)
 *   - fallback       4 levels in a row with no unlock moment, on the next level change
 * And never: before level 8, within 90 s of the last one, within 60 s of a
 * rewarded ad, or for players who bought Remove Ads. Callers never ask during
 * play, on the fail card, or at app launch.
 */
export type UnlockReason = 'grid_up' | 'boss_complete' | 'skin_unlock' | 'fallback';

export interface AdRules {
  minLevel: number;
  interstitialGapMs: number;
  afterRewardedMs: number;
  fallbackLevels: number;
}

/** Defaults; phase 6 lets Firebase Remote Config override them. */
export const DEFAULT_RULES: AdRules = {
  minLevel: 8,
  interstitialGapMs: 90_000,
  afterRewardedMs: 60_000,
  fallbackLevels: 4,
};

export interface AdHistory {
  lastInterstitialAt: number | null;
  lastRewardedAt: number | null;
  /** Levels finished since the last unlock moment. */
  levelsWithoutUnlock: number;
}

export const NO_HISTORY: AdHistory = { lastInterstitialAt: null, lastRewardedAt: null, levelsWithoutUnlock: 0 };

export type Verdict =
  | { show: true }
  | { show: false; why: 'remove_ads' | 'too_early' | 'too_soon' | 'after_rewarded' | 'no_fallback_yet' };

export function interstitialVerdict(
  reason: UnlockReason,
  level: number,
  now: number,
  history: AdHistory,
  rules: AdRules = DEFAULT_RULES,
  removeAds = false
): Verdict {
  if (removeAds) return { show: false, why: 'remove_ads' };
  if (level < rules.minLevel) return { show: false, why: 'too_early' };
  if (history.lastInterstitialAt !== null && now - history.lastInterstitialAt < rules.interstitialGapMs) {
    return { show: false, why: 'too_soon' };
  }
  if (history.lastRewardedAt !== null && now - history.lastRewardedAt < rules.afterRewardedMs) {
    return { show: false, why: 'after_rewarded' };
  }
  if (reason === 'fallback' && history.levelsWithoutUnlock < rules.fallbackLevels) {
    return { show: false, why: 'no_fallback_yet' };
  }
  return { show: true };
}

export function recordLevelComplete(h: AdHistory): AdHistory {
  return { ...h, levelsWithoutUnlock: h.levelsWithoutUnlock + 1 };
}

/** An unlock moment happened (whether or not an ad could show), so the fallback count restarts. */
export function recordUnlockMoment(h: AdHistory): AdHistory {
  return { ...h, levelsWithoutUnlock: 0 };
}

export function recordInterstitial(h: AdHistory, now: number): AdHistory {
  return { ...h, lastInterstitialAt: now, levelsWithoutUnlock: 0 };
}

export function recordRewarded(h: AdHistory, now: number): AdHistory {
  return { ...h, lastRewardedAt: now };
}

/**
 * Which unlock moment, if any, leaving a finished level is. A new chapter's
 * grid_up moment comes later, after that level's title card.
 */
export function reasonForNext(finishedBoss: boolean, history: AdHistory, rules: AdRules = DEFAULT_RULES): UnlockReason | null {
  if (finishedBoss) return 'boss_complete';
  if (history.levelsWithoutUnlock >= rules.fallbackLevels) return 'fallback';
  return null;
}
