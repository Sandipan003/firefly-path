#!/usr/bin/env bash
# Builds an installable release APK into builds/.
#
#   ./scripts/build-apk.sh            # APK named after today's date
#   ./scripts/build-apk.sh storybook  # builds/FireflyPath-storybook.apk
#
# Android's native build tools can break on paths with spaces ("Game V2"), so
# the project is copied to a folder without spaces first. The copy keeps its
# Gradle output between runs, so later builds are much faster.
# Needs Android Studio (for Java and the Android SDK). AdMob IDs come from
# .env.local if present (see .env.example); otherwise Google's test ads.
set -euo pipefail

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${FIREFLY_BUILD_DIR:-$HOME/.cache/firefly-path-build}"
NAME="${1:-$(date +%Y%m%d-%H%M)}"

export JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export CI=1

echo "› Copying the project to $WORK"
mkdir -p "$WORK"
# android/ is generated in the copy and kept for faster rebuilds; builds/ and .git aren't needed.
rsync -a --delete \
  --exclude '/android' --exclude '/ios' --exclude '/builds' --exclude '/.git' --exclude '/.expo' \
  --exclude '/node_modules' \
  "$PROJECT/" "$WORK/"
# node_modules: a copy-on-write clone on macOS (instant), a normal sync elsewhere.
if [ "$(uname)" = "Darwin" ]; then
  rm -rf "$WORK/node_modules"
  cp -cR "$PROJECT/node_modules" "$WORK/node_modules"
else
  rsync -a --delete "$PROJECT/node_modules/" "$WORK/node_modules/"
fi

cd "$WORK"
# Which AdMob IDs this build will use (from .env.local, or Google's test ones).
npx expo config --type public --json 2>/dev/null | node -e '
  let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
    const c = JSON.parse(s);
    const ads = (c.plugins || []).find((p) => Array.isArray(p) && p[0] === "react-native-google-mobile-ads");
    const appId = ads ? ads[1].androidAppId : "?";
    const units = (c.extra && c.extra.adUnits) || {};
    const sample = appId.startsWith("ca-app-pub-3940256099942544");
    const real = Object.values(units).filter(Boolean).length;
    console.log(sample
      ? "› AdMob: Google test ads (no real IDs in .env.local)"
      : `› AdMob: your app ID ${appId}, ${real} of 3 real ad units${real < 3 ? " (the rest use test ads)" : ""}` +
        (c.extra && c.extra.useTestAds ? " — but ADMOB_USE_TEST_ADS=1 forces test ads" : ""));
  });'
echo "› Generating the Android project"
npx expo prebuild --platform android --no-install

echo "› Building (ARM phones: 32 and 64 bit)"
cd android
NODE_ENV=production ./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a

mkdir -p "$PROJECT/builds"
OUT="$PROJECT/builds/FireflyPath-$NAME.apk"
cp app/build/outputs/apk/release/app-release.apk "$OUT"
echo "✔ $OUT ($(du -h "$OUT" | cut -f1))"
echo "  Signed with the debug key: fine to install on your phone, not for the Play Store."
