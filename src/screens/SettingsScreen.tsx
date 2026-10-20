import Constants from 'expo-constants';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { openPrivacyOptions, usingTestAds } from '@/ads/AdManager';
import { useAds } from '@/ads/adsState';
import { Scene } from '@/art/Scene';
import { BackIcon, BookIcon } from '@/art/icons';
import { strings } from '@/i18n/strings';
import { colors, fonts, type } from '@/render/theme';
import { IconButton } from '@/ui/Buttons';

/**
 * Settings. For now: the ads privacy choices and the story. Sound, music,
 * vibration and colour-blind mode come with phase 3, Restore purchase with
 * phase 6.
 */
export function SettingsScreen() {
  const privacyRequired = useAds((a) => a.privacyOptionsRequired);
  const version = Constants.expoConfig?.version ?? '';

  return (
    <View style={styles.screen}>
      <Scene chapter="meadow" dim={0.6} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <IconButton tone="night" size={44} accessibilityLabel="Back" onPress={() => router.back()}>
            <BackIcon size={22} />
          </IconButton>
          <Text style={styles.title}>{strings.settings}</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.list}>
          {/* Google requires this whenever the player's region needs a consent form. */}
          {privacyRequired ? (
            <Row
              title={strings.privacyOptions}
              note={strings.privacyOptionsNote}
              icon={<ShieldIcon />}
              onPress={() => openPrivacyOptions().catch(() => undefined)}
            />
          ) : null}
          <Row title={strings.watchStory} icon={<BookIcon size={24} color={colors.ink} />} onPress={() => router.push('/story')} />
        </View>

        {/* Lets you check a build: real AdMob IDs in, or still Google's test ads. */}
        <Text style={[type.label, styles.footer]}>
          {`${strings.title.toUpperCase()} ${version}`}
          {usingTestAds ? `  ·  ${strings.testAds.toUpperCase()}` : ''}
        </Text>
      </SafeAreaView>
    </View>
  );
}

function Row({ title, note, icon, onPress }: { title: string; note?: string; icon: ReactNode; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={[type.button, styles.rowTitle]}>{title}</Text>
        {note ? <Text style={[type.body, styles.rowNote]}>{note}</Text> : null}
      </View>
    </Pressable>
  );
}

function ShieldIcon() {
  // Drawn with views: a rounded shield with a tick, in the ink colour.
  return (
    <View style={styles.shield}>
      <Text style={styles.shieldMark}>✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  safe: { flex: 1 },
  topBar: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.textOnNight },
  list: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  row: {
    minHeight: 72,
    borderRadius: 22,
    backgroundColor: colors.paper,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 16,
  },
  rowIcon: { width: 32, alignItems: 'center' },
  rowText: { flex: 1 },
  rowTitle: { color: colors.ink },
  rowNote: { color: colors.inkSoft, fontSize: 15, lineHeight: 20 },
  pressed: { transform: [{ scale: 0.98 }] },
  shield: {
    width: 26,
    height: 28,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldMark: { color: colors.paper, fontSize: 15, fontFamily: fonts.uiBold, marginTop: -1 },
  footer: { color: colors.textDim, textAlign: 'center', marginTop: 'auto', paddingBottom: 16 },
});
