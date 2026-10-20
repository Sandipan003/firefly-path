import Constants from 'expo-constants';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * The game's three AdMob ad units (build prompt §6). Real IDs come from the
 * build environment through app.config.ts. Development builds always use
 * Google's test units, and so does any build without real IDs: a test ad is
 * always safer than an empty one.
 */
export type AdUnit = 'rewardedBonuses' | 'interstitialUnlocks' | 'banner';

/** The unit names as they appear in the AdMob account, for logs and analytics. */
export const AD_UNIT_NAMES: Record<AdUnit, string> = {
  rewardedBonuses: 'Rewarded - bonuses',
  interstitialUnlocks: 'Interstitial - unlocks',
  banner: 'Banner',
};

const TEST_UNITS: Record<AdUnit, string> = {
  rewardedBonuses: TestIds.REWARDED,
  interstitialUnlocks: TestIds.INTERSTITIAL,
  banner: TestIds.ADAPTIVE_BANNER,
};

const extra = (Constants.expoConfig?.extra ?? {}) as {
  adUnits?: Partial<Record<AdUnit, string>>;
  useTestAds?: boolean;
};

export function adUnitId(unit: AdUnit): string {
  const real = extra.adUnits?.[unit];
  if (__DEV__ || extra.useTestAds || !real) return TEST_UNITS[unit];
  return real;
}

export const usingTestAds = (Object.keys(TEST_UNITS) as AdUnit[]).some((u) => adUnitId(u) === TEST_UNITS[u]);
