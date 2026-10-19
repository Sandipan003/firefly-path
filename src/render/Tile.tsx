import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { TileLook } from '@/game/session';
import { quality } from '@/perf/quality';
import { Rock } from './Rock';
import { colors } from './theme';

interface TileProps {
  x: number;
  y: number;
  diameter: number;
  look: TileLook;
  /** Changes whenever this tile should shake (a wrong move). 0 = never. */
  shakeKey: number;
  lantern: boolean;
  /** The path passes this tile twice (it crosses itself here). */
  twice: boolean;
  /** Drawn as a rock instead of a tile. Only ever 'idle' or 'wrong'. */
  rock: boolean;
}

const FILL: Record<TileLook, string> = {
  idle: colors.tile,
  lit: colors.firefly,
  litBlue: colors.fireflyBlue,
  start: colors.firefly,
  startBlue: colors.fireflyBlue,
  correct: colors.correct,
  wrong: colors.wrong,
  hint: colors.tile,
};

const HALO: Partial<Record<TileLook, string>> = {
  lit: colors.firefly,
  litBlue: colors.fireflyBlue,
  start: colors.firefly,
  startBlue: colors.fireflyBlue,
  correct: colors.correct,
  wrong: colors.wrong,
};

/**
 * One round tile. Only transform (scale, shake) is animated, which phones
 * can do cheaply on the GPU; colour changes are instant.
 * memo() keeps the other tiles from re-rendering when one changes.
 */
export const Tile = memo(function Tile({ x, y, diameter, look, shakeKey, lantern, twice, rock }: TileProps) {
  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(scale);
    if (look === 'hint' && quality.loops) {
      scale.set(withRepeat(withSequence(withTiming(1.1, { duration: 380 }), withTiming(1, { duration: 380 })), -1));
    } else if (look !== 'idle') {
      scale.set(withSequence(withTiming(1.14, { duration: 90 }), withTiming(1, { duration: 160 })));
    } else {
      scale.set(1);
    }
    // `twice` is listed so the tile pops again when the path crosses it.
  }, [look, twice, scale]);

  useEffect(() => {
    if (shakeKey === 0) return;
    const d = diameter * 0.12;
    shakeX.set(
      withSequence(
        withTiming(-d, { duration: 50 }),
        withTiming(d, { duration: 70 }),
        withTiming(-d * 0.7, { duration: 70 }),
        withTiming(d * 0.5, { duration: 60 }),
        withTiming(0, { duration: 50 })
      )
    );
  }, [shakeKey, diameter, shakeX]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.get() }, { scale: scale.get() }],
  }));

  const halo = quality.halos && !rock ? HALO[look] : undefined;
  const r = diameter / 2;
  const spread = diameter * 0.14;

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x - r, top: y - r, width: diameter, height: diameter }, animated]}>
      {halo ? (
        <View
          style={[
            styles.halo,
            { left: -spread, top: -spread, right: -spread, bottom: -spread, borderRadius: r + spread, backgroundColor: halo },
          ]}
        />
      ) : null}
      {rock ? (
        <View style={styles.face}>
          <Rock width={diameter * 0.8} color={look === 'wrong' ? colors.wrong : colors.rock} />
        </View>
      ) : (
        <View
          style={[
            styles.face,
            {
              borderRadius: r,
              backgroundColor: FILL[look],
              borderColor: look === 'hint' ? colors.firefly : look === 'idle' ? colors.tileEdge : 'transparent',
              borderWidth: look === 'hint' ? Math.max(3, diameter * 0.07) : 2,
            },
          ]}>
          {twice ? (
            <View
              style={[
                styles.ring,
                { width: diameter * 0.62, height: diameter * 0.62, borderRadius: diameter * 0.31, borderWidth: Math.max(3, diameter * 0.08) },
              ]}
            />
          ) : null}
          {lantern ? <Text style={{ fontSize: diameter * 0.42 }}>🏮</Text> : null}
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  halo: { position: 'absolute', opacity: 0.28 },
  face: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // A second ring inside the tile marks where the path crosses itself.
  ring: { position: 'absolute', borderColor: colors.night, opacity: 0.6 },
});
