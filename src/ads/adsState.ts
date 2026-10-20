import { create } from 'zustand';

/** The ad placements that use the "Rewarded - bonuses" unit (build prompt §6.1). */
export type RewardedPlacement = 'show_again' | 'hint' | 'continue' | 'double_coins' | 'streak_saver';

interface AdsState {
  /** Consent answered and the SDK started: ads may be requested. */
  sdkReady: boolean;
  /** A rewarded video is loaded and can be shown right now. */
  rewardedReady: boolean;
  /** The player is in a region where the consent form must stay reachable (Settings). */
  privacyOptionsRequired: boolean;
  /** A full-screen ad is on screen. */
  showing: boolean;
}

/** What the UI needs to know about ads. Kept by AdManager. */
export const useAds = create<AdsState>()(() => ({
  sdkReady: false,
  rewardedReady: false,
  privacyOptionsRequired: false,
  showing: false,
}));
