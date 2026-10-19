import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@/i18n/strings';
import { colors, MIN_TOUCH } from '@/render/theme';
import { useProgress } from '@/store/progress';

// Phase 4 adds the Daily Path card, brain meter, coins and settings.
export default function Home() {
  const level = useProgress((s) => s.level);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.middle}>
        <Text style={styles.pip}>🦉</Text>
        <Text style={styles.title}>{strings.title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Play ${strings.level(level)}`}
          onPress={() => router.push({ pathname: '/game/[level]', params: { level: String(level) } })}
          style={({ pressed }) => [styles.play, pressed && styles.pressed]}>
          <Text style={styles.playIcon}>▶</Text>
          <Text style={styles.playLevel}>{strings.level(level)}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 24 },
  pip: { fontSize: 96 },
  title: { fontSize: 36, fontWeight: '800', color: colors.firefly, letterSpacing: 0.5 },
  play: {
    marginTop: 24,
    minWidth: 220,
    minHeight: MIN_TOUCH + 24,
    borderRadius: 40,
    backgroundColor: colors.correct,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  pressed: { transform: [{ scale: 0.96 }] },
  playIcon: { fontSize: 34, color: colors.ink, fontWeight: '900' },
  playLevel: { fontSize: 18, color: colors.ink, fontWeight: '700' },
});
