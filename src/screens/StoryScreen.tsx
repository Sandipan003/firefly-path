import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Fireflies } from '@/art/Fireflies';
import { PlayIcon, SkipIcon } from '@/art/icons';
import { Pip } from '@/art/Pip';
import { Scene } from '@/art/Scene';
import { strings } from '@/i18n/strings';
import { quality } from '@/perf/quality';
import { colors, fonts, type } from '@/render/theme';
import { PillButton } from '@/ui/Buttons';
import { SplitText } from '@/ui/SplitText';

/** Each page moves on by itself after this long, or on a tap. The last page waits. */
const PAGE_MS = 4400;

/**
 * The opening story, shown on first launch: why the fireflies matter, and
 * what the player does about it. Five short pages, no rules text.
 */
export function StoryScreen({ onFinish }: { onFinish: (begin: boolean) => void }) {
  const [page, setPage] = useState(0);
  const last = strings.story.length - 1;
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (page >= last) return;
    const t = setTimeout(() => setPage((p) => Math.min(last, p + 1)), PAGE_MS);
    return () => clearTimeout(t);
  }, [page, last]);

  // A slow push-in on the landscape across the whole story.
  const zoom = useSharedValue(1);
  useEffect(() => {
    if (!quality.loops) return;
    zoom.set(withTiming(1.1, { duration: PAGE_MS * (last + 1), easing: Easing.out(Easing.quad) }));
    return () => cancelAnimation(zoom);
  }, [zoom, last]);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.get() }] }));

  const advance = () => (page < last ? setPage(page + 1) : onFinish(true));
  const caption = width < 380 ? { fontSize: 33, lineHeight: 39 } : null;

  return (
    <View style={styles.screen}>
      <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
        <Scene chapter="meadow" />
      </Animated.View>
      {page !== 2 ? <Fireflies count={14} seed={`story${page < 2 ? 0 : 1}`} top={0.08} bottom={0.55} /> : null}
      <BottomShade />

      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          <Text style={styles.wordmark}>{strings.title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.skip}
            hitSlop={12}
            onPress={() => onFinish(false)}
            style={({ pressed }) => [styles.skip, pressed && { opacity: 0.6 }]}>
            <Text style={[type.label, styles.skipLabel]}>{strings.skip.toUpperCase()}</Text>
            <SkipIcon size={18} color={colors.textDim} />
          </Pressable>
        </View>

        <Pressable style={styles.stage} onPress={advance} accessibilityRole="button" accessibilityLabel={strings.story[page]}>
          <View style={styles.art}>
            <PageArt page={page} />
          </View>
          <View style={styles.caption}>
            <SplitText key={page} text={strings.story[page]} style={[type.title, styles.captionText, caption]} delay={250} />
          </View>
        </Pressable>

        <View style={styles.bottom}>
          <Dots count={last + 1} active={page} />
          {page === last ? (
            <Animated.View entering={FadeIn.delay(900).duration(400)} style={styles.begin}>
              <PillButton label={strings.begin} icon={<PlayIcon size={22} />} onPress={() => onFinish(true)} />
            </Animated.View>
          ) : (
            <View style={styles.beginSpace} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function PageArt({ page }: { page: number }) {
  switch (page) {
    case 0:
      return null;
    case 1:
      return (
        <Animated.View key="p1" entering={ZoomIn.delay(150).springify()} style={styles.pipRow}>
          <GlowPath />
          <Pip size={150} mood="idle" lantern blink />
        </Animated.View>
      );
    case 2:
      return (
        <View key="p2" style={styles.pipRow}>
          <Wind />
          <Scatter />
          <Animated.View entering={FadeIn.duration(300)}>
            <Pip size={150} mood="oops" />
          </Animated.View>
        </View>
      );
    case 3:
      return (
        <Animated.View key="p3" entering={ZoomIn.springify()}>
          <MiniBoard mode="show" />
        </Animated.View>
      );
    default:
      return (
        <Animated.View key="p4" entering={ZoomIn.springify()} style={styles.pipRow}>
          <MiniBoard mode="done" />
          <View style={styles.pipCorner}>
            <Pip size={110} mood="won" />
          </View>
        </Animated.View>
      );
  }
}

/** A dotted line of fireflies leading to Pip. */
function GlowPath() {
  return (
    <View style={styles.glowPath}>
      {Array.from({ length: 7 }, (_, i) => (
        <Animated.View
          key={i}
          entering={FadeIn.delay(400 + i * 140).duration(300)}
          style={[styles.glowDot, { marginTop: Math.sin(i * 0.9) * 14 }]}
        />
      ))}
    </View>
  );
}

/** Gusts of wind across the page. */
function Wind() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {[0.18, 0.42, 0.66].map((y, i) => (
        <Gust key={i} y={y} delay={i * 260} />
      ))}
    </View>
  );
}

function Gust({ y, delay }: { y: number; delay: number }) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(-width * 0.6);
  useEffect(() => {
    x.set(withDelay(delay, withRepeat(withTiming(width * 1.1, { duration: 1400, easing: Easing.in(Easing.quad) }), quality.loops ? -1 : 1)));
    return () => cancelAnimation(x);
  }, [x, delay, width]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  return <Animated.View style={[styles.gust, { top: `${y * 100}%` }, style]} />;
}

/** Fireflies blown out in every direction. */
function Scatter() {
  return (
    <View pointerEvents="none" style={styles.scatter}>
      {Array.from({ length: 10 }, (_, i) => (
        <Spark key={i} angle={(i / 10) * Math.PI * 2 + 0.3} />
      ))}
    </View>
  );
}

function Spark({ angle }: { angle: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) }));
  }, [t]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.get(),
    transform: [
      { translateX: Math.cos(angle) * 170 * t.get() + 60 * t.get() },
      { translateY: Math.sin(angle) * 130 * t.get() },
    ],
  }));
  return <Animated.View style={[styles.spark, style]} />;
}

const DEMO_PATH = [6, 3, 4, 1, 2];

/** A tiny board: the firefly lights the path ("show"), or the path is traced ("done"). */
function MiniBoard({ mode }: { mode: 'show' | 'done' }) {
  const [lit, setLit] = useState(mode === 'done' ? DEMO_PATH.length : 0);
  useEffect(() => {
    if (mode === 'done') return;
    const t = setInterval(() => setLit((n) => (n >= DEMO_PATH.length + 2 ? 0 : n + 1)), 520);
    return () => clearInterval(t);
  }, [mode]);
  const cell = 58;
  const gap = 12;
  return (
    <View style={[styles.mini, { width: cell * 3 + gap * 4, height: cell * 3 + gap * 4 }]}>
      {Array.from({ length: 9 }, (_, i) => {
        const step = DEMO_PATH.indexOf(i);
        const on = step !== -1 && step < lit;
        const fill = on ? (mode === 'done' ? colors.correct : colors.firefly) : colors.tile;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: gap + (i % 3) * (cell + gap),
              top: gap + Math.floor(i / 3) * (cell + gap),
              width: cell,
              height: cell,
              borderRadius: cell / 2,
              backgroundColor: fill,
              borderWidth: on ? 0 : 2,
              borderColor: colors.tileEdge,
            }}
          />
        );
      })}
    </View>
  );
}

function Dots({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, i === active && styles.dotActive, i < active && styles.dotDone]} />
      ))}
    </View>
  );
}

/** Darkens the bottom of the page so the caption always reads clearly. */
function BottomShade() {
  return (
    <View pointerEvents="none" style={styles.shade}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
        <Defs>
          <LinearGradient id="storyShade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.nightDeep} stopOpacity="0" />
            <Stop offset="1" stopColor={colors.nightDeep} stopOpacity="0.85" />
          </LinearGradient>
        </Defs>
        <Rect width="10" height="10" fill="url(#storyShade)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night, overflow: 'hidden' },
  safe: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    height: 52,
  },
  wordmark: { fontFamily: fonts.displayItalic, fontSize: 22, color: colors.firefly },
  skip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  skipLabel: { color: colors.textDim },
  stage: { flex: 1, justifyContent: 'flex-end' },
  art: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  caption: { paddingHorizontal: 28, minHeight: 150, justifyContent: 'flex-start' },
  captionText: { color: colors.textOnNight, textAlign: 'center' },
  bottom: { paddingHorizontal: 24, paddingBottom: 16, gap: 18 },
  begin: { alignSelf: 'stretch' },
  beginSpace: { height: 62 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(244, 241, 232, 0.22)' },
  dotActive: { width: 26, backgroundColor: colors.firefly },
  dotDone: { backgroundColor: 'rgba(255, 209, 102, 0.55)' },
  pipRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  pipCorner: { position: 'absolute', right: -54, bottom: -36 },
  glowPath: { flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 4, marginBottom: 70 },
  glowDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.firefly },
  gust: {
    position: 'absolute',
    left: 0,
    width: 140,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(244, 241, 232, 0.35)',
  },
  scatter: { position: 'absolute', left: '50%', top: '40%' },
  spark: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.firefly },
  mini: { borderRadius: 26, backgroundColor: 'rgba(12, 21, 41, 0.86)', borderWidth: 1, borderColor: 'rgba(244, 241, 232, 0.08)' },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '46%' },
});
