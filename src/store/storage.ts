import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * Key/value storage on the phone (MMKV: synchronous and very fast, so saved
 * progress is there before the first screen draws). On web it uses
 * localStorage. If the native module is missing (e.g. Expo Go) the game
 * still runs and simply doesn't remember anything.
 */
interface SyncStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function open(): SyncStorage {
  try {
    const mmkv = createMMKV({ id: 'firefly-path' });
    return {
      getItem: (key) => mmkv.getString(key) ?? null,
      setItem: (key, value) => mmkv.set(key, value),
      removeItem: (key) => {
        mmkv.remove(key);
      },
    };
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value);
      },
      removeItem: (key) => {
        memory.delete(key);
      },
    };
  }
}

/** Synchronous, so small values (like the banner's height) can be read during the first render. */
export const storage: SyncStorage & StateStorage = open();
