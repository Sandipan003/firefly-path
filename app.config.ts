import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Adds the AdMob settings to app.json. They come from environment variables
 * (see .env.example), read when the app is built:
 *   ADMOB_APP_ID_ANDROID, ADMOB_APP_ID_IOS
 *   AD_UNIT_REWARDED_BONUSES, AD_UNIT_INTERSTITIAL_UNLOCKS, AD_UNIT_BANNER
 * Without them the build uses Google's sample app IDs and test ad units, so
 * nothing real is ever requested by accident.
 */
const SAMPLE_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
};

// The shapes of AdMob IDs. Anything else (a placeholder, a typo, a pasted
// space) falls back to Google's test IDs: a malformed app ID would crash the
// app at launch.
const APP_ID = /^ca-app-pub-\d{16}~\d{10}$/;
const UNIT_ID = /^ca-app-pub-\d{16}\/\d{10}$/;

function admobId(name: string, shape: RegExp): string {
  const value = (process.env[name] ?? '').trim();
  if (!value || value.includes('XXXX')) return '';
  if (!shape.test(value)) {
    console.warn(`[ads] ${name} doesn't look like an AdMob ID ("${value}"). Using Google's test ID instead.`);
    return '';
  }
  return value;
}

const TRACKING_TEXT =
  'Your choice keeps Firefly Path free. It lets us show ads that are more relevant to you.';

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = process.env;
  const androidAppId = admobId('ADMOB_APP_ID_ANDROID', APP_ID);
  const iosAppId = admobId('ADMOB_APP_ID_IOS', APP_ID);
  // Real ad units only serve under their own app ID, never under Google's sample one.
  const unit = (name: string) => (androidAppId ? admobId(name, UNIT_ID) : '');

  const plugins = (config.plugins ?? []).map((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    if (name === 'react-native-google-mobile-ads') {
      return [
        name,
        {
          androidAppId: androidAppId || SAMPLE_APP_IDS.android,
          iosAppId: iosAppId || SAMPLE_APP_IDS.ios,
          // Don't start Google measurement before the player has answered the consent form.
          delayAppMeasurementInit: true,
          userTrackingUsageDescription: TRACKING_TEXT,
        },
      ];
    }
    if (name === 'expo-tracking-transparency') {
      return [name, { userTrackingPermission: TRACKING_TEXT }];
    }
    return plugin;
  }) as ExpoConfig['plugins'];

  return {
    ...config,
    name: config.name ?? 'Firefly Path',
    slug: config.slug ?? 'firefly-path',
    plugins,
    extra: {
      ...config.extra,
      // Read by src/ads/adConfig.ts. Empty means "use Google's test unit".
      adUnits: {
        rewardedBonuses: unit('AD_UNIT_REWARDED_BONUSES'),
        interstitialUnlocks: unit('AD_UNIT_INTERSTITIAL_UNLOCKS'),
        banner: unit('AD_UNIT_BANNER'),
      },
      useTestAds: env.ADMOB_USE_TEST_ADS === '1',
    },
  };
};
