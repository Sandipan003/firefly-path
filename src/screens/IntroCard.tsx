import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Fireflies } from '@/art/Fireflies';
import { PlayIcon } from '@/art/icons';
import { Scene } from '@/art/Scene';
import type { Card } from '@/game/cards';
import type { Chapter } from '@/game/chapters';
import { strings } from '@/i18n/strings';
import { Rock } from '@/render/Rock';
import { colors, fonts, MIN_TOUCH, type } from '@/render/theme';
import { SplitText } from '@/ui/SplitText';

/** The card closes by itself after this long, or on any tap. */
const SHOW_MS = 2800;
const CHAPTER_MS = 3800;

export function IntroCard({ card, onDone }: { card: Card; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, card.kind === 'chapter' ? CHAPTER_MS : SHOW_MS);
    return () => clearTimeout(t);
  }, [onDone, card.kind]);

  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.scrim}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDone} accessibilityRole="button" accessibilityLabel="Play" />
      <Animated.View entering={ZoomIn.delay(80).springify().damping(15)} style={styles.card} pointerEvents="box-none">
        {card.kind === 'chapter' ? <ChapterTitle chapter={card.chapter} gridUp={card.gridUp} /> : null}
        {card.kind === 'rocks' ? <Rocks /> : null}
        {card.kind === 'twoFireflies' ? <TwoFireflies /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play"
          onPress={onDone}
          style={({ pressed }) => [styles.play, pressed && styles.pressed]}>
          <PlayIcon size={30} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function ChapterTitle({ chapter, gridUp }: { chapter: Chapter; gridUp: { from: number; to: number } | null }) {
  return (
    <>
      <View style={styles.thumb}>
        <Scene chapter={chapter.id} crop={{ y: 470, h: 230 }} />
        <Fireflies count={6} seed={`card-${chapter.id}`} top={0.1} bottom={0.6} />
        <Text style={styles.numeral}>{chapter.numeral}</Text>
      </View>
      <Animated.Text entering={FadeInDown.delay(200).duration(400)} style={[type.label, styles.chapterLabel]}>
        {strings.chapterLabel(chapter.numeral)}
      </Animated.Text>
      <SplitText text={chapter.title} style={[type.title, styles.chapterTitle]} delay={300} stagger={24} />
      {gridUp ? (
        <Animated.View entering={FadeIn.delay(900).duration(400)} style={styles.row}>
          <Captioned caption={`${gridUp.from}×${gridUp.from}`}>
            <MiniGrid size={gridUp.from} extent={64} />
          </Captioned>
          <PlayIcon size={22} color={colors.correct} />
          <Captioned caption={`${gridUp.to}×${gridUp.to}`}>
            <MiniGrid size={gridUp.to} extent={64} />
          </Captioned>
        </Animated.View>
      ) : null}
    </>
  );
}

/** A short path walking around a rock. */
function Rocks() {
  const lit = { 6: colors.firefly, 3: colors.firefly, 0: colors.firefly, 1: colors.firefly, 2: colors.firefly, 5: colors.firefly };
  return (
    <View style={styles.row}>
      <MiniGrid size={3} extent={132} lit={lit} rock={4} />
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
      <PlayIcon size={22} color={colors.correct} />
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
  extent = 104,
  lit = {},
  rock,
}: {
  size: number;
  extent?: number;
  lit?: Record<number, string>;
  rock?: number;
}) {
  const pad = extent * 0.07;
  const pitch = (extent - pad * 2) / size;
  const dot = pitch * 0.78;
  return (
    <View style={[styles.mini, { width: extent, height: extent, borderRadius: extent * 0.18 }]}>
      {Array.from({ length: size * size }, (_, cell) => (
        <View
          key={cell}
          style={[
            styles.miniCell,
            { left: pad + (cell % size) * pitch, top: pad + Math.floor(cell / size) * pitch, width: pitch, height: pitch },
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
    backgroundColor: 'rgba(8, 14, 28, 0.74)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.paper,
    borderRadius: 32,
    padding: 20,
    paddingBottom: 24,
    gap: 14,
    alignItems: 'center',
  },
  thumb: { alignSelf: 'stretch', height: 150, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.night },
  numeral: {
    position: 'absolute',
    left: 18,
    bottom: 6,
    fontFamily: fonts.displayItalic,
    fontSize: 56,
    lineHeight: 64,
    color: colors.textOnNight,
    opacity: 0.9,
  },
  chapterLabel: { color: colors.inkSoft, marginTop: 4 },
  chapterTitle: { color: colors.ink, fontSize: 34, lineHeight: 40, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  captioned: { alignItems: 'center', gap: 4 },
  caption: { fontFamily: fonts.uiBold, fontSize: 16, color: colors.inkSoft },
  mini: { backgroundColor: colors.nightDeep },
  miniCell: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  play: {
    width: MIN_TOUCH + 12,
    height: MIN_TOUCH + 12,
    borderRadius: (MIN_TOUCH + 12) / 2,
    backgroundColor: colors.correct,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  pressed: { transform: [{ scale: 0.94 }] },
});
