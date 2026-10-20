import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MAX_LEVEL } from '@/game/levels';
import type { Stars } from '@/game/round';
import { storage } from './storage';

interface ProgressState {
  /** Highest level the player can play. */
  level: number;
  /** Best stars per finished level. */
  stars: Record<number, Stars>;
  /** The opening story has been watched (or skipped). */
  seenStory: boolean;
  /** Bought "Remove Ads" (phase 6): no banner and no interstitial; rewarded ads stay optional. */
  removeAds: boolean;
  completeLevel: (level: number, stars: Stars) => void;
  markStorySeen: () => void;
}

// Saved on the phone. Coins, the daily path and the brain meter join this in phase 4.
export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      level: 1,
      stars: {},
      seenStory: false,
      removeAds: false,
      completeLevel: (level, stars) =>
        set((s) => ({
          level: Math.min(MAX_LEVEL, Math.max(s.level, level + 1)),
          stars: { ...s.stars, [level]: Math.max(s.stars[level] ?? 0, stars) as Stars },
        })),
      markStorySeen: () => set({ seenStory: true }),
    }),
    {
      name: 'progress',
      version: 1,
      storage: createJSONStorage(() => storage),
      partialize: ({ level, stars, seenStory, removeAds }) => ({ level, stars, seenStory, removeAds }),
    }
  )
);

export function totalStars(stars: Record<number, Stars>): number {
  return Object.values(stars).reduce<number>((sum, n) => sum + n, 0);
}
