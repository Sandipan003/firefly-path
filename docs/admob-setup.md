# Putting your AdMob IDs into Firefly Path

Until you do this, every build shows Google's test ads. The IDs are not secret (they end up inside the APK anyway), but keep them in `.env.local`, which git ignores, so test and real setups never get mixed up.

## 1. In AdMob (admob.google.com)

1. **Add the app.** Apps → Add app → Android. When asked whether it's listed on an app store, choose **No** (you'll link the Play listing after publishing). Name it "Firefly Path".
2. **Copy the App ID.** App settings → App ID. It looks like `ca-app-pub-1234567890123456~1234567890` (with a **~**).
3. **Create the three ad units** in that app, with exactly these names (or reuse the ones you already have, if they belong to this app):
   - **Rewarded** → "Rewarded - bonuses". Any reward amount and item name is fine; the game doesn't read them.
   - **Interstitial** → "Interstitial - unlocks"
   - **Banner** → "Banner"

   Copy each unit ID. They look like `ca-app-pub-1234567890123456/1234567890` (with a **/**).
4. **Publish the consent message.** Privacy & messaging → European regulations → create a message for Firefly Path → Publish. Without it, players in the EU and UK never see the consent form, and AdMob serves them few or no ads. The "US state regulations" message is a good idea too.
5. **Register your phone as a test device.** Settings → Test devices → Add test device → Android. On the phone, find the advertising ID under Settings → Google → Ads (on newer phones: Settings → Privacy → Ads). Your phone then always gets test ads, even with real IDs, so you never click a real ad yourself. That can get an AdMob account suspended.

## 2. In the project

6. Create your settings file in the project folder:

   ```bash
   cp .env.example .env.local
   ```

   Open `.env.local` and replace the X's with your IDs:

   ```
   ADMOB_APP_ID_ANDROID=ca-app-pub-…~…
   AD_UNIT_REWARDED_BONUSES=ca-app-pub-…/…
   AD_UNIT_INTERSTITIAL_UNLOCKS=ca-app-pub-…/…
   AD_UNIT_BANNER=ca-app-pub-…/…
   ```

   Leave `ADMOB_APP_ID_IOS` as it is until you make the iOS app.
7. Build:

   ```bash
   ./scripts/build-apk.sh real
   ```

   Near the start, look for `› AdMob: your app ID ca-app-pub-…, 3 of 3 real ad units`. If it says "Google test ads", an ID is missing or mistyped. The build warns about any ID that doesn't look like an AdMob ID and uses a test one instead, so a typo can't crash the app.
8. Install `builds/FireflyPath-real.apk`. In the game's Settings, the line at the bottom no longer says "TEST ADS ARE ON". On your registered phone, ads still carry a "Test Ad" label, which is expected.

## Good to know

- **Brand-new ad units can take an hour or more to start serving.** Until then the video buttons show "No video right now" and the banner space stays empty. The game never waits for an ad.
- **Development builds** (`npx expo start`) always use test ads, whatever `.env.local` says.
- **After publishing on Google Play:** link the AdMob app to the Play listing, upload `docs/app-ads.txt` (with your publisher ID) to your website, and set up payments in AdMob.
