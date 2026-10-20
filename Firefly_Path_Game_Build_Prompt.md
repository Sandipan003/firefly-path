# BUILD PROMPT — "Firefly Path": a Super-Simple Memory Puzzle Game (Android/iOS, AdMob)

> Copy everything below this line into your AI coding tool (Claude Code, Cursor, Bolt, etc.). Build in the phases at the end — one phase at a time.

---

## 0. Role & goal

You are a senior mobile game developer. Build a casual memory puzzle game called **Firefly Path** for Android (Google Play first) and iOS, monetized with **Google AdMob**.

**The #1 rule of this project: the game must be understood in 3 seconds by anyone — a child, a grandparent, someone who doesn't read English.** No text rules, no numbers to calculate, no complex mechanics. If a feature needs explaining, cut it.

**Tech stack:**
- React Native + Expo (development build, not Expo Go), TypeScript
- `react-native-google-mobile-ads` (AdMob + Google UMP consent)
- `react-native-reanimated` + `react-native-gesture-handler` for smooth touch
- Board, glow and particles drawn with plain React Native views animated by Reanimated (transform/opacity only). **No Skia**: it adds several MB per CPU type and its blur/shader effects are slow on weak GPUs, and this board is at most 49 circles. See §5.1.
- `zustand` + `react-native-mmkv` for saving progress
- `expo-haptics`, `expo-audio` for sound/vibration
- Firebase Analytics (free). Works fully offline.

---

## 1. The whole game in one sentence

> **"Watch the fireflies light a path. Then draw the same path with your finger."**

That's it. This is the only rule, forever.

### How one level plays
1. A grid of dark round tiles appears (starts 3×3).
2. A firefly flies tile to tile, lighting up a path. Each tile plays a musical note as it lights up.
3. The lights go out. A small "Your turn ✋" hand icon appears.
4. The player drags a finger from the start tile (it stays glowing with a 🏮 lantern) along the path they remember.
   - Correct tile → it glows green, plays the same note, light vibration.
   - Wrong tile → it shakes red, the player loses 1 of 3 hearts ❤️❤️❤️, and continues from the last correct tile.
5. Path finished → fireflies burst, flowers bloom, happy sound. Stars shown. Next level.
6. All hearts lost → "So close! You got 7 of 9 🔥" → **Retry** or **Continue (watch ad, +1 heart)**.

### Why this works (lessons from the 4 trending games I studied)
- Like **Vita Mahjong**: understood with zero text, a hand pointer shows what to do.
- Like **Connect Tracks** and **Arrows Escape**: 3 hearts, short levels, "So close!" fail screen that makes people retry.
- Like **Meowdoku**: cute mascot reacting, "Only 1% can pass level 50" challenge feeling.
- Like all of them: clean bright board, big satisfying win moment.

---

## 2. Making it harder — SIMPLY

Difficulty only grows in ways the player can *see* instantly. No new rules, ever.

| Levels | What changes | Shown to player as |
|---|---|---|
| 1–10 | 3×3 grid, path of 3–5 tiles, slow firefly | "Easy" |
| 11–30 | 4×4 grid, path 5–8 tiles | "Medium" + "Grid Up! 3×3 ▶ 4×4" card |
| 31–60 | 5×5, path 8–11 tiles, firefly a bit faster | "Hard" |
| 61–100 | 6×6, path 11–14 tiles, path can cross itself | "Expert" |
| 100+ | 7×7, path 14–20 tiles, faster firefly, two fireflies from 120 | "Genius" |

Small visual twists added rarely (one at a time, each shown with a single picture card, no text needed):
- **Rock tiles** 🪨 — just decoration-blockers the path never uses (makes the board look different, no rule to learn).
- **Two fireflies** (level 120+) — a yellow path and a blue path; draw yellow first, then blue. Colour-coded so it's obvious.

**Every level is a little harder than the one before, never easier:** the firefly flies a little faster (720 ms per tile at level 1, easing towards 420 ms) and the full path shows a little shorter; the path never gets shorter and grows a tile every few levels (each grid starts where the last one ended); at the same length, paths turn more often (turns are what make a path hard to remember); crossings and the second firefly stay once introduced; rocks become more common. Every 10th level is a "Boss" with a gold frame and extra coins. (This replaces the original "relax level every 5th level".)

**Fairness rule:** paths are random but always smooth (no jumping across the board), always connected tile-to-tile (up/down/left/right only), and never longer than the difficulty table allows. Use a seeded random generator so levels are the same for every player and can be tested.

---

## 3. Stars, rewards and reasons to come back

- ⭐ Finished · ⭐⭐ No hearts lost · ⭐⭐⭐ No hearts lost + finished fast
- **Coins** for every level (more for stars). Spend on hints and cute firefly colours / lantern skins only.
- **Brain meter** on the home screen: 🦉 Sleepy Owl → 🦊 Smart Fox → 🐦 Clever Raven → 🦌 Wise Deer → 🌟 Genius. Fills up as they earn stars. A **Share** button makes an image: "I reached Clever Raven 🐦 — Level 47! Can you beat me?"
- **Daily Path:** one special puzzle per day, a flame 🔥 streak counter. Missed a day? Save your streak by watching an ad.
- **No energy timer.** Players can always play. (Timers make people quit.)
- One friendly notification per day max, only if they allow it: "Your Daily Path is ready 🌙".

---

## 4. Helpers (also the ad hooks)

Only 3 buttons under the board, with big icons:
- 👁 **Show again** — replays the firefly path once. Watch a rewarded ad (or spend coins). *This is the main ad button — players genuinely want it.*
- 💡 **Hint** — lights the next correct tile. Coins or rewarded ad.
- ↺ **Restart** — free.

---

## 5. Screens (keep it minimal)

1. **Home:** big PLAY button ("Level 12"), Daily Path card with 🔥 streak, brain meter, coins, settings ⚙️. Owl mascot "Pip" blinks and waves.
2. **Game:** top = back, ❤️❤️❤️, level number, Pip's face (thinking 🤔 during firefly, happy 😄 on correct, 😬 on wrong). Middle = big board. Bottom = 👁 💡 ↺. **No ads on this screen.**
3. **Win:** stars pop in one by one, coins count up, "Next ▶". Optional "2× coins 🎬" button.
4. **Fail:** "So close!" + how many tiles were right, "Retry" and "Continue 🎬".
5. **Settings:** sound, music, vibration, colour-blind mode, privacy options, restore purchase.

**Tutorial:** Level 1 is a 3-tile path; after the firefly, an animated hand drags along it, then the player copies. No words needed. Levels 1–7 are very easy wins with no ads.

**Look:** dark navy night board (#14213D), glowing yellow fireflies (#FFD166), mint green correct (#06D6A0), soft red wrong (#EF476F), white rounded cards, chunky friendly font (Fredoka or Baloo 2). Big tiles, minimum 56pt touch size. Colour-blind mode adds shapes on tiles.

**Feel:** every tile has its own musical note (pentatonic scale, so any path sounds nice — the melody also helps memory). Haptic tick on each correct tile. Particles + flower bloom on win. Calm night background music. 60fps on mid-range Android.

### 5.1 Low-end phones — the game must stay playable on them

Target: budget Android phones (1–3 GB RAM, Android Go, Android 7.0 / API 24 and up, 720p screens, slow quad-core CPUs, weak GPUs) and older iPhones. Every phase must keep these rules:

- **Rendering:** plain views + Reanimated. Animate only `transform` and `opacity`. No blur, no shadows/elevation, no big gradients or full-screen images. At most 49 tiles + 1 firefly + a few dozen particles on screen.
- **Quality tiers** (`/src/perf/quality.ts`): the phone is put in the **low** tier automatically when it has under 3.3 GB RAM, runs Android 8 or older, or is from before 2017. Low tier drops only decoration (glow halos, looping pulses, most particles), never gameplay feedback (colours, shake, firefly, sounds). `EXPO_PUBLIC_QUALITY=low` forces it for testing. Phase 4 adds a "Simple graphics" switch in Settings.
- **Touch:** finger hit-testing runs on the UI thread and tells JS only when the finger enters a new tile. Positions between touch events are filled in, so a fast swipe on a slow phone never skips a tile. The hit area is a bit bigger than the drawn tile, with a gap between tiles so cutting a corner never lands on a diagonal tile.
- **Timing:** the game runs on timers and state, never on frame counts, so a dropped frame can't change what happens.
- **App size (target under 30 MB download):** Hermes, R8 minify + shrink resources in release builds, Play App Bundle (each phone downloads only its own CPU type), keep `armeabi-v7a` because many cheap phones are 32-bit. Don't add native modules the game doesn't use. One font family, two weights. Notes as tiny mono clips (about 20 KB each), music as one short compressed loop (under 1 MB). No video assets.
- **Memory:** no large images or textures. Keep only one rewarded and one interstitial ad loaded at a time. Load the first interstitial only once the player reaches level 8, so ads don't use memory in the first sessions.
- **Small screens:** the board uses almost the full width. On a 360pt-wide phone a 7×7 tile is about 40pt, under the 56pt rule, so the touch area stays larger than the drawn tile there. All buttons stay at least 56pt.
- **Respect "Reduce motion"** in system settings.
- **Test every phase** on a real 2 GB Android phone, or an Android emulator with 2 GB RAM on API 24, with "Profile GPU rendering" on. Aim for 60 fps and never drop below 30 fps on the low tier.

### 5.2 Visual direction — "a storybook that glows"

Typography-led, illustration-heavy, and both maximal and minimal: the board stays calm and clean, while the story, chapter cards and wins get the big type, illustrations and particles. Ideas are borrowed from web motion libraries (react-bits split-text and count-up, aceternity glows, GSAP-style staggers, Vanta-style ambient scenes), rebuilt natively with Reanimated and SVG. Web libraries themselves can't run in the app.

- **Type:** Fraunces (a soft storybook serif) for big moments: the giant level number, chapter titles, story captions, card headlines. Baloo 2 for UI text; it also covers Hindi. Small letter-spaced capitals ("CHAPTER II", "LEVEL") sit above big type. Import single font weights by path, never the package root.
- **Story on first launch** (`/story`, skippable, replayable from the home screen): night falls, fireflies light Pip's way home, the wind scatters them, "Watch where they glow… then lead Pip home." Captions rise in letter by letter.
- **Story through the game:** each difficulty band is a chapter with its own landscape: I The Meadow, II The Whispering Wood, III The Silver River, IV The Moon Mountains, V The Starry Sky (where Pip's house sits on a cloud). Each chapter opens with a title card, which also carries Grid Up.
- **Illustrations are code** (`/src/art`): Pip has six expressions and blinks; the landscapes are generated from a seed, about a dozen SVG paths each; all icons are SVG. No emoji in the UI, because they look different, or are missing, on older Android phones.
- **Colours:** the night palette above, plus warm storybook paper (#FFF7E8) for cards and light buttons.
- **Low tier:** same layout and type; fewer stars, no scene details or glows, no drifting fireflies, word-by-word captions instead of letter-by-letter.

---

## 6. AdMob monetization

The game uses **exactly 3 AdMob ad units** — no App Open, no native, no other formats. Their names in my AdMob account are:

| AdMob ad unit name | Format | Env variable |
|---|---|---|
| **Rewarded - bonuses** | Rewarded | `AD_UNIT_REWARDED_BONUSES` |
| **Interstitial - unlocks** | Interstitial | `AD_UNIT_INTERSTITIAL_UNLOCKS` |
| **Banner** | Banner (adaptive anchored) | `AD_UNIT_BANNER` |

All IDs live in one config file (`/src/ads/adConfig.ts`) read from environment variables. **In development builds (`__DEV__`) always use Google's test IDs (`TestIds.REWARDED`, `TestIds.INTERSTITIAL`, `TestIds.ADAPTIVE_BANNER`)**; use my real IDs only in production builds. I will fill these in:

```
ADMOB_APP_ID_ANDROID=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
ADMOB_APP_ID_IOS=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
AD_UNIT_REWARDED_BONUSES=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
AD_UNIT_INTERSTITIAL_UNLOCKS=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
AD_UNIT_BANNER=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
```

### 6.1 "Rewarded - bonuses" — every bonus the player chooses to get
Used for ALL optional rewards (one ad unit, many placements — log the placement name in analytics):
- 👁 **Show again** — replay the firefly path (`placement: show_again`)
- 💡 **Hint** — light the next correct tile (`placement: hint`)
- ❤️ **Continue** after failing — +1 heart (`placement: continue`)
- 🪙 **2× coins** on the win screen (`placement: double_coins`)
- 🔥 **Streak saver** for the daily puzzle (`placement: streak_saver`)

Rules: always optional, button shows a 🎬 icon + the reward ("🎬 Show again"). Grant the reward **only** in the `EARNED_REWARD` callback — if the player closes early, no reward. Preload the next rewarded ad immediately after one closes. If no ad is loaded, grey out the button with "No video right now" — never block the game.

### 6.2 "Interstitial - unlocks" — shown when something new unlocks
Show this full-screen ad only at **unlock moments**, right after the celebration card and before the new content starts:
- A new grid size unlocks ("Grid Up! 4×4") 
- A Boss level (every 10th) is completed and the next set of levels unlocks
- A new firefly colour / lantern skin is unlocked
- Fallback: if the player has finished 4 levels in a row with no unlock moment, show one on the next level transition

Rules: never before level 8; minimum 90 seconds between interstitials; never within 60 seconds after a rewarded ad; never during gameplay or on the fail screen; never on app launch. Preload after each show. Frequency values (min level, cooldown, fallback count) come from Firebase Remote Config so I can change them without an app update.

### 6.3 "Banner" — small, never in the way
- Banner at the **bottom of the Home screen** and the **Win/Fail screens** only. It's the fixed 320×50 size: from SDK 17 every "anchored adaptive" banner is Google's large size (about 115–130 pt), which covers too much of a small phone and can't have its space reserved before it loads.
- **Never on the game board screen** (protects the experience and avoids accidental taps).
- At least 16dp gap between the banner and any button; the layout must reserve the banner height so nothing jumps when it loads.
- Hidden for players who bought "Remove Ads".

### 6.4 AdManager
Build one `AdManager` module that: initialises the SDK after UMP consent, loads/preloads all 3 units, enforces the frequency rules above, exposes `showRewarded(placement, onReward)`, `maybeShowUnlockInterstitial(reason)`, and a `<GameBanner />` component, and logs `ad_impression {unit, placement}` / `rewarded_earned {placement}` to Firebase. Unit-test the frequency rules.

**Must do for approval:** Google UMP consent screen before loading ads + "Privacy options" in settings; iOS tracking permission (ATT) after consent; AdMob App ID in app config; `AD_ID` permission on Android; set audience as general/13+ (not "for children"); prepare `app-ads.txt` for my website; keep ads away from game buttons so nobody taps them by accident.

**Optional purchase:** "Remove Ads" one-time (~₹199) removes the Banner and "Interstitial - unlocks" ads; rewarded ads stay as an option.

**Analytics events:** `level_start`, `level_complete {level, stars, hearts_left}`, `level_fail {level, tiles_correct}`, `show_again_used`, `hint_used {coins|ad}`, `ad_impression {type, place}`, `daily_complete {streak}`.

---

## 7. Project structure

```
/src/app      screens: home, game/[level], daily, settings (Expo Router)
/src/game     path generator (seeded), level config table, input checking, scoring — plain TS
/src/render   board views, firefly glow, particles (Reanimated)
/src/perf     device quality tier (low-end phones)
/src/ads      AdManager (consent, preload, frequency limits)
/src/store    progress, coins, streak, settings (MMKV)
/src/audio    notes + music · /src/analytics · /src/i18n (English + Hindi)
/tests        generator always makes valid connected paths; ad frequency rules
```

---

## 8. Build phases (one at a time, test each)

1. **Playable core:** grid, firefly path animation, finger drawing, correct/wrong checking, 3 hearts, win/fail. Plain visuals.
2. **Levels:** seeded path generator + the difficulty table; 300 levels.
3. **Feel:** glow, notes, vibration, particles, mascot faces, tutorial hand.
4. **Progress:** home screen, stars, coins, brain meter, daily path + streak, share image.
5. **AdMob:** consent + the 3 ad units ("Rewarded - bonuses", "Interstitial - unlocks", "Banner") with all the rules above, test IDs in dev.
6. **Extras:** Remove Ads purchase, analytics, Remote Config, notifications.
7. **Release:** icon, store screenshots, privacy policy text, Play data-safety answers, `app-ads.txt`, production build.

**Done when:** a first-time player understands the game in 3 seconds with no text, levels feel fair, it runs smoothly on a cheap Android phone (2 GB RAM: at least 30 fps, no missed tiles, download under 30 MB), no ads appear before level 8, and every rewarded ad gives its reward correctly.
