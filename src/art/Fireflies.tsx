import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { createRng, hashSeed } from '@/game/rng';
import { quality } from '@/perf/quality';
import { colors } from '@/render/theme';

interface FirefliesProps {
  count?: number;
  /** Changes the layout of the swarm. */
  seed?: string;
  /** Keep the fireflies in this vertical band of the parent (0-1). */
  top?: number;
  bottom?: number;
}

/**
 * Glowing dots drifting over a scene. Each one only animates its transform
 * and opacity. On the low quality tier they sit still and there are fewer.
 */
export const Fireflies = memo(function Fireflies({ count = 12, seed = 'home', top = 0.1, bottom = 0.75 }: FirefliesProps) {
  const rng = createRng(hashSeed('fireflies', seed));
  const n = quality.loops ? count : Math.ceil(count / 3);
  const bugs = Array.from({ length: n }, (_, i) => ({
    key: i,
    left: `${4 + rng() * 92}%` as const,
    top: `${(top + rng() * (bottom - top)) * 100}%` as const,
    size: 4 + rng() * 4,
    drift: 10 + rng() * 22,
    ms: 2400 + rng() * 2600,
    delay: rng() * 2000,
  }));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bugs.map((b) => (
        <Bug {...b} key={b.key} />
      ))}
    </View>
  );
});

function Bug({
  left,
  top,
  size,
  drift,
  ms,
  delay,
}: {
  left: `${number}%`;
  top: `${number}%`;
  size: number;
  drift: number;
  ms: number;
  delay: number;
}) {
  const t = useSharedValue(0);
  const glow = useSharedValue(0.6);

  useEffect(() => {
    if (!quality.loops) return;
    const ease = Easing.inOut(Easing.sin);
    t.set(withDelay(delay, withRepeat(withTiming(1, { duration: ms, easing: ease }), -1, true)));
    glow.set(withDelay(delay, withRepeat(withTiming(1, { duration: ms * 0.45, easing: ease }), -1, true)));
    return () => {
      cancelAnimation(t);
      cancelAnimation(glow);
    };
  }, [t, glow, ms, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.45 + glow.get() * 0.55,
    transform: [{ translateX: (t.get() - 0.5) * drift }, { translateY: Math.sin(t.get() * Math.PI) * -drift * 0.8 }],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left, top }, style]}>
      {quality.halos ? (
        <View
          style={{
            position: 'absolute',
            left: -size * 0.75,
            top: -size * 0.75,
            width: size * 2.5,
            height: size * 2.5,
            borderRadius: size * 1.25,
            backgroundColor: colors.firefly,
            opacity: 0.38,
          }}
        />
      ) : null}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#FFE9A8' }} />
    </Animated.View>
  );
}
