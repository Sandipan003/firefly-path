import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameBanner } from '@/ads/GameBanner';
import { HeartIcon, PlayIcon, RestartIcon, StarIcon } from '@/art/icons';
import { Pip } from '@/art/Pip';
import type { Stars } from '@/game/round';
import { strings } from '@/i18n/strings';
import { quality } from '@/perf/quality';
import { colors, fonts, type } from '@/render/theme';
import { PillButton } from '@/ui/Buttons';
import { useCountUp } from '@/ui/useCountUp';

type WonProps = { stars: Stars; busy: boolean; onNext: () => void; onRetry: () => void };
type LostProps = { got: number; total: number; canContinue: boolean; onRetry: () => void; onContinue: () => void };
type ResultCardProps = ({ kind: 'won' } & WonProps) | ({ kind: 'lost' } & LostProps);

/**
 * Win / fail card over the board, with the banner below it: the board is
 * finished by now, and the banner keeps a 16 pt gap from the buttons.
 */
export function ResultCard(props: ResultCardProps) {
  const won = props.kind === 'won';
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={FadeIn.delay(won ? 550 : 350).duration(220)}
      style={[styles.scrim, { paddingBottom: insets.bottom }]}>
      <View style={styles.center}>
        {won ? <Burst /> : null}
        <Animated.View entering={FadeInDown.delay(won ? 600 : 400).springify().damping(16)} style={styles.card}>
          <View style={styles.pip}>
            <Pip size={116} mood={won ? 'won' : 'lost'} />
          </View>
          {props.kind === 'won' ? <Won {...props} /> : <Lost {...props} />}
        </Animated.View>
      </View>
      <View style={styles.banner}>
        <GameBanner place={won ? 'win' : 'fail'} />
      </View>
    </Animated.View>
  );
}

function Won({ stars, busy, onNext, onRetry }: WonProps) {
  return (
    <>
      <Text style={[type.title, styles.headline]}>{strings.won[stars]}</Text>
      <View style={styles.stars}>
        {[1, 2, 3].map((n) => (
          <PopStar key={n} delay={900 + n * 220} big={n === 2} full={n <= stars} />
        ))}
      </View>
      <PillButton label={strings.next} icon={<PlayIcon size={22} />} disabled={busy} onPress={onNext} />
      <PillButton label={strings.retry} variant="soft" icon={<RestartIcon size={20} color={colors.inkSoft} />} onPress={onRetry} />
    </>
  );
}

function Lost({ got, total, canContinue, onRetry, onContinue }: LostProps) {
  const shown = useCountUp(got, 600, 650);
  return (
    <>
      <Text style={[type.title, styles.headline]}>{strings.soClose}</Text>
      <View style={styles.score} accessibilityLabel={strings.youGot(got, total)}>
        <Text style={styles.scoreBig}>{shown}</Text>
        <Text style={styles.scoreOf}>/{total}</Text>
      </View>
      <Text style={[type.label, styles.scoreLabel]}>{strings.tilesLabel}</Text>
      <PillButton
        label={canContinue ? strings.continue : strings.noVideo}
        ad={canContinue}
        disabled={!canContinue}
        icon={<HeartIcon size={22} />}
        onPress={onContinue}
      />
      <PillButton label={strings.retry} variant="soft" icon={<RestartIcon size={20} color={colors.inkSoft} />} onPress={onRetry} />
    </>
  );
}

/**
 * One star popping in. Its own spring rather than an "entering" layout
 * animation: those can be cut short when something else on screen (like the
 * banner) loads at the same moment, leaving the star invisible.
 */
function PopStar({ delay, big, full }: { delay: number; big: boolean; full: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withSpring(1, { damping: 9, stiffness: 170 })));
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, t.get() * 2), transform: [{ scale: t.get() }] }));
  return (
    <Animated.View style={[big ? styles.starMiddle : styles.starSide, style]}>
      <StarIcon size={big ? 68 : 54} full={full} />
    </Animated.View>
  );
}

/** Fireflies bursting out behind the card. */
function Burst() {
  const n = Math.round(quality.particles / 2);
  return (
    <View pointerEvents="none" style={styles.burst}>
      {Array.from({ length: n }, (_, i) => (
        <Spark key={i} angle={(i / n) * Math.PI * 2} reach={140 + (i % 3) * 50} />
      ))}
    </View>
  );
}

function Spark({ angle, reach }: { angle: number; reach: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(650, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })));
  }, [t]);
  const style = useAnimatedStyle(() => ({
    opacity: t.get() === 0 ? 0 : 1 - t.get(),
    transform: [{ translateX: Math.cos(angle) * reach * t.get() }, { translateY: Math.sin(angle) * reach * t.get() }],
  }));
  return <Animated.View style={[styles.spark, style]} />;
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8, 14, 28, 0.74)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  banner: { paddingTop: 16, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.paper,
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 24,
    gap: 12,
    marginTop: 60,
  },
  pip: { position: 'absolute', top: -74, alignSelf: 'center' },
  headline: { color: colors.ink, textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 6, marginVertical: 8 },
  starSide: { marginBottom: -4 },
  starMiddle: { marginBottom: 10 },
  score: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline' },
  scoreBig: { fontFamily: fonts.display, fontSize: 76, lineHeight: 84, color: colors.ink, letterSpacing: -2 },
  scoreOf: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, color: colors.inkSoft },
  scoreLabel: { color: colors.inkSoft, textAlign: 'center', marginTop: -6, marginBottom: 8 },
  burst: { position: 'absolute', left: '50%', top: '42%' },
  spark: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.firefly },
});
