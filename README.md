# Firefly Path

"Watch the fireflies light a path. Then draw the same path with your finger."

The full spec is in [Firefly_Path_Game_Build_Prompt.md](Firefly_Path_Game_Build_Prompt.md). §5.1 lists the rules that keep the game playable on low-end phones, and §5.2 describes the visual direction ("a storybook that glows").

## Run it

```bash
npm install
npx expo start          # then press w (web) or a (Android)
npm test                # game rules, all 300 level paths, touch handling, chapters and scenes
npm run typecheck
npx expo lint
```

Try the budget-phone graphics on any device:

```bash
EXPO_PUBLIC_QUALITY=low npx expo start
```

Build an APK you can install on a phone (needs Android Studio installed; the APK lands in `builds/`):

```bash
./scripts/build-apk.sh mybuild
```

Progress is saved with MMKV, which Expo Go doesn't include. Without it the game still runs, it just doesn't remember anything. Use a development or release build (`npx expo run:android`) to test saving.

## Ads (AdMob)

The game uses three AdMob units: "Rewarded - bonuses", "Interstitial - unlocks" and "Banner". The rules are in §6 of the build prompt. Everything lives in `src/ads`:

| File | What it does |
|---|---|
| `adConfig.ts` | Ad unit IDs: Google's test units in development, or whenever a real ID is missing |
| `AdManager.native.ts` | Consent form (UMP), iOS tracking question, SDK start, preloading, `showRewarded`, `maybeShowUnlockInterstitial` |
| `frequency.ts` | When an interstitial may show (tested in `tests/adFrequency.test.ts`) |
| `GameBanner.native.tsx` | Banner for Home and the Win/Fail card, with its space reserved |
| `*.ts` / `*.tsx` without `.native` | Web preview stand-ins (no AdMob on the web) |

**Adding your real IDs:** copy `.env.example` to `.env.local`, fill in your AdMob app IDs and the three unit IDs, then rebuild. `app.config.ts` reads them at build time. Until then, every build uses Google's sample app ID and test ads.

**Never tap real ads on your own phone.** That can get an AdMob account suspended. To test a build that has real IDs, set `ADMOB_USE_TEST_ADS=1`, or add your phone's test device ID (AdMob prints it in the logcat). Emulators always get test ads.

**For your website:** `docs/app-ads.txt` is a template. Put your publisher ID in it and upload it to the root of the website in your Play Store listing.

## Layout

| Folder | What's in it |
|---|---|
| `src/app` | Routes (Expo Router): home, `story`, `game/[level]`, `settings` |
| `src/game` | Plain TypeScript: seeded path generator, level table, round rules, touch-to-tile maths, chapters, level cards |
| `src/art` | Illustrations as code: Pip, chapter landscapes, icons, ambient fireflies |
| `src/render` | Board, tiles, firefly (Reanimated views), design tokens and type styles |
| `src/screens` | Story, home, game, chapter/picture cards, win/fail card |
| `src/ui` | Buttons, split-text reveal, count-up |
| `src/perf` | Device quality tier for low-end phones |
| `src/ads` | AdMob: consent, the three ad units, interstitial rules, banner |
| `src/analytics` | Analytics events (printed in development; Firebase in phase 6) |
| `src/store` | Progress and "story seen", saved on the phone |
| `tests` | Jest tests |

## Build phases

- [x] 1. Playable core: grid, firefly show, finger drawing, correct/wrong, 3 hearts, win/fail
- [x] 2. Levels: a difficulty curve where every level is harder than the last, Boss levels, rocks, path crossing, two fireflies, picture cards
- [ ] 3. Feel: done so far: Pip's faces and the visual redesign (§5.2). Still to do: notes, vibration, the win flower bloom, the tutorial hand drag
- [ ] 4. Progress: done so far: saving level and stars. Still to do: coins, brain meter, daily path, share image
- [x] 5. AdMob: consent and privacy options, the 3 units, interstitial rules, test IDs in development. Phase 6 connects the Remote Config rules, Firebase events and Remove Ads; phase 4 adds the 2× coins and streak-saver placements
- [ ] 6. Extras
- [ ] 7. Release

## Licence

Copyright © 2026 Sandipan Sarkar. All rights reserved. The code is public to read, but it may not be copied, reused or redistributed without written permission. See [LICENSE](LICENSE).
