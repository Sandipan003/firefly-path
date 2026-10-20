/**
 * Web build (the browser preview): there's no AdMob on the web, so rewards
 * are granted straight away and interstitials never show. Android and iOS
 * use AdManager.native.ts.
 */
import { useAds, type RewardedPlacement } from './adsState';
import type { AdRules, UnlockReason } from './frequency';

export type { RewardedPlacement, UnlockReason };

export const usingTestAds = true;

// The preview behaves like a phone with a video ready, from the first screen on.
useAds.setState({ sdkReady: true, rewardedReady: true });

export async function startAds(): Promise<void> {}

export async function openPrivacyOptions(): Promise<void> {}

export function setAdRules(_next: Partial<AdRules>): void {}

export function showRewarded(_placement: RewardedPlacement, onReward: () => void): boolean {
  onReward();
  return true;
}

export function noteLevelComplete(): void {}

export function unlockReasonForNext(_finishedBoss: boolean): UnlockReason | null {
  return null;
}

export function maybeShowUnlockInterstitial(_reason: UnlockReason, _level: number): Promise<boolean> {
  return Promise.resolve(false);
}
