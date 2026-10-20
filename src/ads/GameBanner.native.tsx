import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { logEvent } from '@/analytics';
import { useProgress } from '@/store/progress';
import { adUnitId, AD_UNIT_NAMES } from './adConfig';
import { useAds } from './adsState';

/** The classic 320 x 50 banner is always exactly this tall. */
export const BANNER_HEIGHT = 50;

/**
 * The "Banner" unit (build prompt §6.3): bottom of the Home screen and the
 * Win/Fail card only, never on the board. Hidden for players who bought
 * Remove Ads. Callers keep 16 pt between it and any button.
 *
 * Fixed 320 x 50 rather than adaptive: from SDK 17 every "anchored adaptive"
 * banner is Google's large size (about 115-130 pt tall). That would take a
 * fifth of a small budget phone's screen, and because its height isn't known
 * until it loads, it could push the screen around or cover the Play button.
 * A fixed size has a fixed space: nothing ever moves or gets covered.
 */
export function GameBanner({ place }: { place: 'home' | 'win' | 'fail' }) {
  const removeAds = useProgress((s) => s.removeAds);
  const sdkReady = useAds((s) => s.sdkReady);

  if (removeAds) return null;

  return (
    <View style={{ height: BANNER_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
      {sdkReady ? (
        <BannerAd
          unitId={adUnitId('banner')}
          size={BannerAdSize.BANNER}
          onAdImpression={() => logEvent('ad_impression', { unit: AD_UNIT_NAMES.banner, type: 'banner', place })}
          onAdFailedToLoad={() => undefined}
        />
      ) : null}
    </View>
  );
}
