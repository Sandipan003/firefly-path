import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { startAds } from '@/ads/AdManager';
import { fontSources } from '@/render/fontSources';
import { colors } from '@/render/theme';
import { useProgress } from '@/store/progress';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fontSources);
  const seenStory = useProgress((s) => s.seenStory);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // Ads (and their consent form) start once the opening story is over, so the
  // very first thing a new player sees is the story, not a dialog.
  useEffect(() => {
    if (seenStory) startAds();
  }, [seenStory]);

  // Keep the splash up until the fonts are in (instant on Android), so the first frame is already styled.
  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.night }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.night },
        }}
      />
    </GestureHandlerRootView>
  );
}
