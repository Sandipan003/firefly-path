# Firefly Path

"Watch the fireflies light a path. Then draw the same path with your finger."

The full spec is in [Firefly_Path_Game_Build_Prompt.md](Firefly_Path_Game_Build_Prompt.md). §5.1 lists the rules that keep the game playable on low-end phones.

## Run it

```bash
npm install
npx expo start          # then press w (web), i (iOS) or a (Android)
npm test                # game rules, all 300 level paths, touch handling, quality tiers
npm run typecheck
npx expo lint
```

Try the budget-phone graphics on any device:

```bash
EXPO_PUBLIC_QUALITY=low npx expo start
```

Phase 1 runs in Expo Go. From phase 4 (MMKV) and phase 5 (AdMob) on it needs a development build: `npx expo run:android` / `npx expo run:ios`, or `eas build --profile development`.

## Layout

| Folder | What's in it |
|---|---|
| `src/app` | Screens (Expo Router): home, `game/[level]` |
| `src/game` | Plain TypeScript: seeded path generator, level table, round rules, touch-to-tile maths |
| `src/render` | Board, tiles, firefly (Reanimated views, no Skia) |
| `src/screens` | Game screen and win/fail card |
| `src/perf` | Device quality tier for low-end phones |
| `src/ads` | AdManager (a stand-in that grants rewards at once until phase 5) |
| `src/store` | Progress (in memory until phase 4) |
| `tests` | Jest tests |

## Build phases

- [x] 1. Playable core: grid, firefly show, finger drawing, correct/wrong, 3 hearts, win/fail
- [ ] 2. Levels: relax/boss levels, rocks, path crossing, two fireflies (the 300-level difficulty table is already in)
- [ ] 3. Feel
- [ ] 4. Progress
- [ ] 5. AdMob
- [ ] 6. Extras
- [ ] 7. Release
