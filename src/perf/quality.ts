import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Graphics quality, picked once at startup from the phone's hardware.
 *
 * "low" is aimed at budget Android phones (1-3 GB RAM, Android Go,
 * Android 8 and older): the game plays exactly the same, it just skips the
 * purely decorative extras (glow halos, pulsing, most particles) so the
 * board stays smooth. Gameplay feedback (colours, shake, the firefly)
 * is never removed.
 */
export type QualityTier = 'low' | 'normal';

export interface Quality {
  tier: QualityTier;
  /** Soft glow circle behind lit tiles. */
  halos: boolean;
  /** Looping "breathing" animations (firefly pulse, hint pulse). */
  loops: boolean;
  /** Particle budget for the win burst (phase 3). */
  particles: number;
}

const GB = 1024 * 1024 * 1024;

export function detectTier(info: {
  os: string;
  totalMemory: number | null;
  apiLevel: number | null;
  yearClass: number | null;
}): QualityTier {
  const ramGB = info.totalMemory == null ? null : info.totalMemory / GB;
  if (info.os === 'android') {
    // A "4 GB" phone reports about 3.6-3.8 GB, a "3 GB" one about 2.7-2.9 GB.
    if (ramGB != null && ramGB < 3.3) return 'low';
    if (info.apiLevel != null && info.apiLevel < 28) return 'low';
    if (info.yearClass != null && info.yearClass < 2017) return 'low';
  }
  if (info.os === 'ios' && ramGB != null && ramGB < 2.5) return 'low';
  return 'normal';
}

export function qualityFor(tier: QualityTier): Quality {
  return tier === 'low'
    ? { tier, halos: false, loops: false, particles: 8 }
    : { tier, halos: true, loops: true, particles: 28 };
}

// Set EXPO_PUBLIC_QUALITY=low to try the budget-phone mode on any device.
const forced = process.env.EXPO_PUBLIC_QUALITY;

export const quality: Quality = qualityFor(
  forced === 'low' || forced === 'normal'
    ? forced
    : detectTier({
        os: Platform.OS,
        totalMemory: Device.totalMemory,
        apiLevel: Device.platformApiLevel,
        yearClass: Device.deviceYearClass,
      })
);
