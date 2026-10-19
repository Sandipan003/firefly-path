import { create } from 'zustand';

import { MAX_LEVEL } from '@/game/levels';
import type { Stars } from '@/game/round';

interface ProgressState {
  /** Highest level the player can play. */
  level: number;
  /** Best stars per finished level. */
  stars: Record<number, Stars>;
  completeLevel: (level: number, stars: Stars) => void;
}

// In memory for now; phase 4 persists this with MMKV.
export const useProgress = create<ProgressState>()((set) => ({
  level: 1,
  stars: {},
  completeLevel: (level, stars) =>
    set((s) => ({
      level: Math.min(MAX_LEVEL, Math.max(s.level, level + 1)),
      stars: { ...s.stars, [level]: Math.max(s.stars[level] ?? 0, stars) as Stars },
    })),
}));
