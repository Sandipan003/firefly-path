import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import type { Stars } from '@/game/round';
import { strings } from '@/i18n/strings';
import { colors, MIN_TOUCH } from '@/render/theme';

type ResultCardProps =
  | { kind: 'won'; stars: Stars; onNext: () => void; onRetry: () => void }
  | { kind: 'lost'; got: number; total: number; onRetry: () => void; onContinue: () => void };

/** Win / fail card over the board. The banner ad joins these in phase 5. */
export function ResultCard(props: ResultCardProps) {
  return (
    <Animated.View entering={FadeIn.delay(props.kind === 'won' ? 550 : 350).duration(220)} style={styles.scrim}>
      <View style={styles.card}>
        {props.kind === 'won' ? (
          <>
            <View style={styles.stars}>
              {[1, 2, 3].map((n) => (
                <Animated.Text
                  key={n}
                  entering={ZoomIn.delay(750 + n * 220).springify()}
                  style={[styles.star, n > props.stars && styles.starOff]}>
                  ⭐
                </Animated.Text>
              ))}
            </View>
            <Button label={`${strings.next} ▶`} onPress={props.onNext} primary />
            <Button label="↺" onPress={props.onRetry} />
          </>
        ) : (
          <>
            <Text style={styles.title}>{strings.soClose}</Text>
            <Text style={styles.subtitle}>{strings.youGot(props.got, props.total)}</Text>
            <Button label={`🎬 ${strings.continue} ❤️`} onPress={props.onContinue} primary />
            <Button label={`↺ ${strings.retry}`} onPress={props.onRetry} />
          </>
        )}
      </View>
    </Animated.View>
  );
}

function Button({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, primary ? styles.primary : styles.secondary, pressed && styles.pressed]}>
      <Text style={[styles.buttonLabel, !primary && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 14, 28, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 24,
    gap: 14,
    alignItems: 'stretch',
  },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  star: { fontSize: 56 },
  starOff: { opacity: 0.18 },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  subtitle: { fontSize: 20, fontWeight: '600', color: colors.inkSoft, textAlign: 'center', marginBottom: 8 },
  button: {
    minHeight: MIN_TOUCH,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: colors.correct },
  secondary: { backgroundColor: '#EEF1F7' },
  buttonLabel: { fontSize: 22, fontWeight: '800', color: colors.ink },
  secondaryLabel: { color: colors.inkSoft },
  pressed: { transform: [{ scale: 0.96 }] },
});
