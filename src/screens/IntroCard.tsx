import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import type { Intro } from '@/game/levels';
import { strings } from '@/i18n/strings';
import { Rock } from '@/render/Rock';
import { colors, MIN_TOUCH } from '@/render/theme';

/** The card closes by itself after this long, or on any tap. */
const SHOW_MS = 2800;

/**
 * A picture card for something new: a bigger grid, rocks, or the second
 * firefly. Pictures only, no rules text, so it reads in any language.
 */
export function IntroCard({ intro, onDone }: { intro: Intro; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, SHOW_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.scrim}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDone} accessibilityRole="button" accessibilityLabel="Play" />
      <Animated.View entering={ZoomIn.delay(80).springify()} style={styles.card} pointerEvents="box-none">
        {intro.kind === 'gridUp' ? <GridUp from={intro.from} to={intro.to} /> : null}
        {intro.kind === 'rocks' ? <Rocks /> : null}
        {intro.kind === 'twoFireflies' ? <TwoFireflies /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play"
          onPress={onDone}
          style={({ pressed }) => [styles.play, pressed && styles.pressed]}>
          <Text style={styles.playLabel}>▶</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function GridUp({ from, to }: { from: number; to: number }) {
  return (
    <>
      <Text style={styles.title}>{strings.gridUp}</Text>
      <View style={styles.row}>
        <Captioned caption={`${from}×${from}`}>
          <MiniGrid size={from} />
        </Captioned>
        <Text style={styles.arrow}>▶</Text>
        <Captioned caption={`${to}×${to}`}>
          <MiniGrid size={to} />
        </Captioned>
      </View>
    </>
  );
}

/** A short path walking around a rock. */
function Rocks() {
  const lit = { 6: colors.firefly, 3: colors.firefly, 0: colors.firefly, 1: colors.firefly, 2: colors.firefly, 5: colors.firefly };
  return (
    <View style={styles.row}>
      <MiniGrid size={3} extent={120} lit={lit} rock={4} />
    </View>
  );
}

/** Yellow path, then blue path. */
function TwoFireflies() {
  const yellow = { 6: colors.firefly, 3: colors.firefly, 0: colors.firefly, 1: colors.firefly };
  const blue = { 2: colors.fireflyBlue, 5: colors.fireflyBlue, 8: colors.fireflyBlue, 7: colors.fireflyBlue };
  return (
    <View style={styles.row}>
      <MiniGrid size={3} lit={yellow} />
      <Text style={styles.arrow}>▶</Text>
      <MiniGrid size={3} lit={blue} />
    </View>
  );
}

function Captioned({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <View style={styles.captioned}>
      {children}
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

function MiniGrid({
  size,
  extent = 96,
  lit = {},
  rock,
}: {
  size: number;
  extent?: number;
  lit?: Record<number, string>;
  rock?: number;
}) {
  const pitch = (extent - 12) / size;
  const dot = pitch * 0.78;
  return (
    <View style={[styles.mini, { width: extent, height: extent }]}>
      {Array.from({ length: size * size }, (_, cell) => (
        <View
          key={cell}
          style={[
            styles.miniCell,
            { left: 6 + (cell % size) * pitch, top: 6 + Math.floor(cell / size) * pitch, width: pitch, height: pitch },
          ]}>
          {cell === rock ? (
            <Rock width={dot} />
          ) : (
            <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: lit[cell] ?? colors.tile }} />
          )}
        </View>
      ))}
    </View>
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
    gap: 18,
    alignItems: 'center',
  },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  arrow: { fontSize: 28, color: colors.correct, fontWeight: '900' },
  captioned: { alignItems: 'center', gap: 6 },
  caption: { fontSize: 20, fontWeight: '800', color: colors.inkSoft },
  mini: { borderRadius: 16, backgroundColor: colors.nightDeep },
  miniCell: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  play: {
    width: MIN_TOUCH + 16,
    height: MIN_TOUCH + 16,
    borderRadius: (MIN_TOUCH + 16) / 2,
    backgroundColor: colors.correct,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playLabel: { fontSize: 30, color: colors.ink, fontWeight: '900', marginLeft: 4 },
  pressed: { transform: [{ scale: 0.94 }] },
});
