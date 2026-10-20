import { describe, expect, it } from '@jest/globals';

import {
  DEFAULT_RULES,
  interstitialVerdict,
  NO_HISTORY,
  reasonForNext,
  recordInterstitial,
  recordLevelComplete,
  recordRewarded,
  recordUnlockMoment,
  type AdHistory,
} from '@/ads/frequency';

const T = 1_000_000;
const sec = 1000;

describe('interstitial rules', () => {
  it('never before level 8', () => {
    expect(interstitialVerdict('grid_up', 7, T, NO_HISTORY)).toEqual({ show: false, why: 'too_early' });
    expect(interstitialVerdict('grid_up', 8, T, NO_HISTORY)).toEqual({ show: true });
  });

  it('at least 90 seconds between interstitials', () => {
    const h = recordInterstitial(NO_HISTORY, T);
    expect(interstitialVerdict('boss_complete', 20, T + 89 * sec, h)).toEqual({ show: false, why: 'too_soon' });
    expect(interstitialVerdict('boss_complete', 20, T + 90 * sec, h)).toEqual({ show: true });
  });

  it('never within 60 seconds after a rewarded ad', () => {
    const h = recordRewarded(NO_HISTORY, T);
    expect(interstitialVerdict('grid_up', 31, T + 59 * sec, h)).toEqual({ show: false, why: 'after_rewarded' });
    expect(interstitialVerdict('grid_up', 31, T + 60 * sec, h)).toEqual({ show: true });
  });

  it('never for players who bought Remove Ads', () => {
    expect(interstitialVerdict('boss_complete', 50, T, NO_HISTORY, DEFAULT_RULES, true)).toEqual({
      show: false,
      why: 'remove_ads',
    });
  });

  it('the fallback needs 4 levels in a row with no unlock moment', () => {
    let h: AdHistory = NO_HISTORY;
    for (let i = 0; i < 3; i++) h = recordLevelComplete(h);
    expect(interstitialVerdict('fallback', 12, T, h)).toEqual({ show: false, why: 'no_fallback_yet' });
    h = recordLevelComplete(h);
    expect(interstitialVerdict('fallback', 12, T, h)).toEqual({ show: true });
  });

  it('an unlock moment or a shown interstitial restarts the fallback count', () => {
    let h: AdHistory = NO_HISTORY;
    for (let i = 0; i < 5; i++) h = recordLevelComplete(h);
    expect(recordUnlockMoment(h).levelsWithoutUnlock).toBe(0);
    expect(recordInterstitial(h, T).levelsWithoutUnlock).toBe(0);
  });

  it('the rules can be tuned (Remote Config in phase 6)', () => {
    const rules = { ...DEFAULT_RULES, minLevel: 15, interstitialGapMs: 30 * sec };
    expect(interstitialVerdict('grid_up', 11, T, NO_HISTORY, rules).show).toBe(false);
    const h = recordInterstitial(NO_HISTORY, T);
    expect(interstitialVerdict('grid_up', 31, T + 31 * sec, h, rules).show).toBe(true);
  });
});

describe('leaving a finished level', () => {
  it('a Boss level is an unlock moment', () => {
    expect(reasonForNext(true, NO_HISTORY)).toBe('boss_complete');
  });

  it('otherwise the fallback, once 4 levels passed without one', () => {
    let h: AdHistory = NO_HISTORY;
    expect(reasonForNext(false, h)).toBeNull();
    for (let i = 0; i < 4; i++) h = recordLevelComplete(h);
    expect(reasonForNext(false, h)).toBe('fallback');
  });
});
