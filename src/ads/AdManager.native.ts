import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
  type AdsConsentInfo,
} from 'react-native-google-mobile-ads';

import { logEvent } from '@/analytics';
import { useProgress } from '@/store/progress';
import { adUnitId, AD_UNIT_NAMES, usingTestAds } from './adConfig';
import { useAds, type RewardedPlacement } from './adsState';
import {
  DEFAULT_RULES,
  interstitialVerdict,
  NO_HISTORY,
  reasonForNext,
  recordInterstitial,
  recordLevelComplete,
  recordRewarded,
  recordUnlockMoment,
  type AdRules,
  type UnlockReason,
} from './frequency';

/**
 * The one place that talks to AdMob (build prompt §6.4).
 *
 * Order at start: consent form (Google UMP) -> iOS tracking question ->
 * request settings -> SDK start -> preload. Nothing is requested before the
 * player has answered the consent form, if their region needs one.
 * Only one rewarded and one interstitial are kept loaded, to spare memory on
 * budget phones, and the interstitial isn't loaded at all before level 7.
 */
export type { RewardedPlacement, UnlockReason };
/** True when any unit is a Google test unit (development, or no real ID set). */
export { usingTestAds };

let started = false;
let rules: AdRules = DEFAULT_RULES;
let history = NO_HISTORY;

let rewarded: RewardedAd | null = null;
let interstitial: InterstitialAd | null = null;
let interstitialReady = false;
let retryRewarded: ReturnType<typeof setTimeout> | undefined;
let retryInterstitial: ReturnType<typeof setTimeout> | undefined;

/** Wait longer after each failed load (30 s, 60 s, ... up to 5 min). */
let rewardedFailures = 0;
let interstitialFailures = 0;
const backoff = (failures: number) => Math.min(300_000, 30_000 * 2 ** Math.max(0, failures - 1));

export async function startAds(): Promise<void> {
  if (started) return;
  started = true;
  if (usingTestAds) console.log('[ads] Using Google test ads');

  let info: AdsConsentInfo;
  try {
    info = await AdsConsent.gatherConsent();
  } catch {
    // Offline or the form failed: Google keeps the answer from the last session.
    info = await AdsConsent.getConsentInfo().catch(() => ({ canRequestAds: false }) as AdsConsentInfo);
  }
  noteConsent(info);
  if (!info.canRequestAds) return;

  if (Platform.OS === 'ios') await requestTrackingPermissionsAsync().catch(() => undefined);

  await mobileAds().setRequestConfiguration({
    // A family-friendly game for a general (13+) audience, not one directed at children.
    maxAdContentRating: MaxAdContentRating.PG,
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
  });
  await mobileAds().initialize();
  useAds.setState({ sdkReady: true });
  loadRewarded();
  preloadInterstitialIfNeeded();
}

function noteConsent(info: AdsConsentInfo) {
  useAds.setState({
    privacyOptionsRequired: info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
  });
}

/** "Privacy options" in Settings: lets the player change their consent answer. */
export async function openPrivacyOptions(): Promise<void> {
  const info = await AdsConsent.showPrivacyOptionsForm();
  noteConsent(info);
}

/** Phase 6: Firebase Remote Config can tune the interstitial rules. */
export function setAdRules(next: Partial<AdRules>): void {
  rules = { ...rules, ...next };
}

// --- "Rewarded - bonuses" ----------------------------------------------------

function loadRewarded() {
  clearTimeout(retryRewarded);
  rewarded?.removeAllListeners();
  rewarded?.destroy();
  useAds.setState({ rewardedReady: false });

  const ad = RewardedAd.createForAdRequest(adUnitId('rewardedBonuses'));
  ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedFailures = 0;
    useAds.setState({ rewardedReady: true });
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    if (useAds.getState().showing) return; // show errors are handled in showRewarded
    rewardedFailures += 1;
    useAds.setState({ rewardedReady: false });
    retryRewarded = setTimeout(loadRewarded, backoff(rewardedFailures));
  });
  ad.load();
  rewarded = ad;
}

/**
 * Shows the rewarded video for `placement`. Returns false (and does nothing)
 * when no video is loaded, so the caller can say "No video right now".
 * `onReward` runs only if Google reports the reward as earned, never when the
 * player closes the video early. It runs once the video is closed, so the
 * game's reaction (such as the path replay) isn't hidden behind the ad.
 */
export function showRewarded(placement: RewardedPlacement, onReward: () => void): boolean {
  const ad = rewarded;
  if (!ad || !useAds.getState().rewardedReady || useAds.getState().showing) return false;

  let earned = false;
  let closed = false;
  let granted = false;
  const grant = () => {
    if (granted || !earned || !closed) return;
    granted = true;
    onReward();
  };
  const finish = () => {
    offs.forEach((off) => off());
    history = recordRewarded(history, Date.now());
    useAds.setState({ showing: false });
    loadRewarded();
  };
  const offs = [
    ad.addAdEventListener(AdEventType.OPENED, () => {
      logEvent('ad_impression', { unit: AD_UNIT_NAMES.rewardedBonuses, type: 'rewarded', placement });
    }),
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
      logEvent('rewarded_earned', { placement });
      // Some networks report the reward after the close; grant it then.
      grant();
    }),
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      closed = true;
      finish();
      grant();
    }),
  ];

  useAds.setState({ rewardedReady: false, showing: true });
  ad.show().catch(() => {
    finish();
  });
  return true;
}

// --- "Interstitial - unlocks" ------------------------------------------------

function interstitialAllowedSoon(): boolean {
  return !useProgress.getState().removeAds && useProgress.getState().level >= rules.minLevel - 1;
}

function preloadInterstitialIfNeeded() {
  if (!useAds.getState().sdkReady || interstitial || !interstitialAllowedSoon()) return;
  loadInterstitial();
}

function loadInterstitial() {
  clearTimeout(retryInterstitial);
  interstitial?.removeAllListeners();
  interstitial?.destroy();
  interstitialReady = false;

  const ad = InterstitialAd.createForAdRequest(adUnitId('interstitialUnlocks'));
  ad.addAdEventListener(AdEventType.LOADED, () => {
    interstitialFailures = 0;
    interstitialReady = true;
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    if (useAds.getState().showing) return;
    interstitialFailures += 1;
    interstitialReady = false;
    retryInterstitial = setTimeout(loadInterstitial, backoff(interstitialFailures));
  });
  ad.load();
  interstitial = ad;
}

/** A level was beaten: counts toward the fallback, and warms up the interstitial from level 7. */
export function noteLevelComplete(): void {
  history = recordLevelComplete(history);
  preloadInterstitialIfNeeded();
}

/** The unlock moment (if any) for leaving a finished level with "Next". */
export function unlockReasonForNext(finishedBoss: boolean): UnlockReason | null {
  return reasonForNext(finishedBoss, history, rules);
}

/**
 * Call at an unlock moment, right after its celebration card. Resolves once
 * the ad is closed (true), or at once if the rules say no or no ad is ready
 * (false), so the game always carries on.
 */
export function maybeShowUnlockInterstitial(reason: UnlockReason, level: number): Promise<boolean> {
  const now = Date.now();
  const verdict = interstitialVerdict(reason, level, now, history, rules, useProgress.getState().removeAds);
  if (reason !== 'fallback') history = recordUnlockMoment(history);

  const ad = interstitial;
  if (!verdict.show || !ad || !interstitialReady || useAds.getState().showing) {
    preloadInterstitialIfNeeded();
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const done = (shown: boolean) => {
      offs.forEach((off) => off());
      useAds.setState({ showing: false });
      interstitial = null;
      interstitialReady = false;
      loadInterstitial();
      resolve(shown);
    };
    const offs = [
      ad.addAdEventListener(AdEventType.OPENED, () => {
        history = recordInterstitial(history, Date.now());
        logEvent('ad_impression', { unit: AD_UNIT_NAMES.interstitialUnlocks, type: 'interstitial', place: reason });
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => done(true)),
    ];
    useAds.setState({ showing: true });
    ad.show().catch(() => done(false));
  });
}
