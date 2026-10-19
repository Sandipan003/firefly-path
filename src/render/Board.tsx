import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { colOf, rowOf } from '@/game/grid';
import type { Link, TileLook } from '@/game/session';
import { cellAt, cellsAlongSegment, HIT_RADIUS_RATIO, type BoardGeometry } from '@/game/touch';
import { quality } from '@/perf/quality';
import { colors } from './theme';
import { Tile } from './Tile';

interface BoardProps {
  size: number;
  /** Width and height of the board in points. */
  extent: number;
  looks: TileLook[];
  /** Tiles the path passes twice (Expert levels: it crosses itself). */
  crossed: boolean[];
  /** Decoration cells. Touches on them reach `onEnterCells` like any tile. */
  rocks: readonly number[];
  links: Link[];
  wrongCell: number | null;
  wrongKey: number;
  /** Tile the firefly sits on during the show; null hides it. */
  fireflyCell: number | null;
  /** Which firefly is flying: 0 = yellow, 1 = blue. */
  firefly: number;
  fireflyMs: number;
  /** Last correct tile: carries the lantern and starts the finger line. */
  anchorCell: number | null;
  /** Tile the "your turn" hand points at; null hides it. */
  handCell: number | null;
  inputEnabled: boolean;
  onEnterCells: (cells: number[]) => void;
  onLift: () => void;
}

const TILE_RATIO = 0.84;
const LINK_RATIO = 0.22;
const FIREFLY_COLORS = [colors.firefly, colors.fireflyBlue];
const LINK_COLORS: Record<Link['kind'], string> = {
  lit: colors.firefly,
  litBlue: colors.fireflyBlue,
  correct: colors.correct,
};

export function Board({
  size,
  extent,
  looks,
  crossed,
  rocks,
  links,
  wrongCell,
  wrongKey,
  fireflyCell,
  firefly,
  fireflyMs,
  anchorCell,
  handCell,
  inputEnabled,
  onEnterCells,
  onLift,
}: BoardProps) {
  const pitch = extent / size;
  const diameter = pitch * TILE_RATIO;
  const center = (cell: number) => ({
    x: (colOf(cell, size) + 0.5) * pitch,
    y: (rowOf(cell, size) + 0.5) * pitch,
  });

  // --- Touch: hit-testing runs on the UI thread; JS only hears about new tiles.
  const geometry = useSharedValue<BoardGeometry>({ size, pitch, hitRadius: pitch * HIT_RADIUS_RATIO });
  const enabled = useSharedValue(inputEnabled);
  const last = useSharedValue({ x: 0, y: 0, cell: -1 });
  const touching = useSharedValue(false);
  const fingerX = useSharedValue(0);
  const fingerY = useSharedValue(0);

  useEffect(() => {
    geometry.set({ size, pitch, hitRadius: pitch * HIT_RADIUS_RATIO });
  }, [geometry, size, pitch]);

  useEffect(() => {
    enabled.set(inputEnabled);
  }, [enabled, inputEnabled]);

  const pan = usePanGesture({
    minDistance: 0,
    maxPointers: 1,
    onBegin: (e) => {
      'worklet';
      if (!enabled.get()) return;
      const cell = cellAt(e.x, e.y, geometry.get());
      last.set({ x: e.x, y: e.y, cell });
      fingerX.set(e.x);
      fingerY.set(e.y);
      touching.set(true);
      if (cell !== -1) scheduleOnRN(onEnterCells, [cell]);
    },
    onUpdate: (e) => {
      'worklet';
      if (!enabled.get()) return;
      const prev = last.get();
      const cells = cellsAlongSegment(prev.x, prev.y, e.x, e.y, geometry.get(), prev.cell);
      last.set({ x: e.x, y: e.y, cell: cells.length > 0 ? cells[cells.length - 1] : prev.cell });
      fingerX.set(e.x);
      fingerY.set(e.y);
      if (cells.length > 0) scheduleOnRN(onEnterCells, cells);
    },
    onFinalize: () => {
      'worklet';
      touching.set(false);
      last.set({ x: 0, y: 0, cell: -1 });
      scheduleOnRN(onLift);
    },
  });

  // --- Finger line from the last correct tile to the finger.
  const anchorX = useSharedValue(0);
  const anchorY = useSharedValue(0);
  useEffect(() => {
    if (anchorCell === null) return;
    anchorX.set((colOf(anchorCell, size) + 0.5) * pitch);
    anchorY.set((rowOf(anchorCell, size) + 0.5) * pitch);
  }, [anchorCell, anchorX, anchorY, size, pitch]);

  const lineThickness = Math.max(4, diameter * 0.16);
  const fingerLine = useAnimatedStyle(() => {
    const dx = fingerX.get() - anchorX.get();
    const dy = fingerY.get() - anchorY.get();
    return {
      opacity: touching.get() && enabled.get() ? 0.55 : 0,
      // A 1pt bar, stretched with scaleX: no layout work per frame.
      transform: [
        { translateX: anchorX.get() },
        { translateY: anchorY.get() - lineThickness / 2 },
        { rotate: `${Math.atan2(dy, dx)}rad` },
        { scaleX: Math.max(1, Math.sqrt(dx * dx + dy * dy)) },
      ],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <View testID="board" style={{ width: extent, height: extent }}>
        {links.map((link) => (
          <LinkBar key={`${link.from}-${link.to}`} link={link} size={size} pitch={pitch} thickness={diameter * LINK_RATIO} />
        ))}

        {looks.map((look, cell) => {
          const c = center(cell);
          return (
            <Tile
              key={cell}
              x={c.x}
              y={c.y}
              diameter={diameter}
              look={look}
              shakeKey={cell === wrongCell ? wrongKey : 0}
              lantern={cell === anchorCell}
              twice={crossed[cell]}
              rock={rocks.includes(cell)}
            />
          );
        })}

        <Animated.View
          pointerEvents="none"
          style={[styles.fingerLine, { height: lineThickness }, fingerLine]}
        />

        {/* A new key for the blue firefly, so it appears at its own start instead of flying over from yellow's end. */}
        <Firefly
          key={firefly}
          color={FIREFLY_COLORS[firefly] ?? colors.firefly}
          cell={fireflyCell}
          size={size}
          pitch={pitch}
          diameter={diameter}
          moveMs={fireflyMs}
        />

        {handCell !== null ? <Hand x={center(handCell).x} y={center(handCell).y} diameter={diameter} /> : null}
      </View>
    </GestureDetector>
  );
}

function LinkBar({ link, size, pitch, thickness }: { link: Link; size: number; pitch: number; thickness: number }) {
  const r0 = rowOf(link.from, size);
  const c0 = colOf(link.from, size);
  const r1 = rowOf(link.to, size);
  const c1 = colOf(link.to, size);
  const horizontal = r0 === r1;
  const left = (Math.min(c0, c1) + 0.5) * pitch;
  const top = (Math.min(r0, r1) + 0.5) * pitch;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: horizontal ? left : left - thickness / 2,
        top: horizontal ? top - thickness / 2 : top,
        width: horizontal ? pitch * Math.abs(c1 - c0) : thickness,
        height: horizontal ? thickness : pitch * Math.abs(r1 - r0),
        backgroundColor: LINK_COLORS[link.kind],
        opacity: 0.85,
      }}
    />
  );
}

function Firefly({
  color,
  cell,
  size,
  pitch,
  diameter,
  moveMs,
}: {
  color: string;
  cell: number | null;
  size: number;
  pitch: number;
  diameter: number;
  moveMs: number;
}) {
  const dot = diameter * 0.34;
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (cell === null) {
      opacity.set(withTiming(0, { duration: 200 }));
      return;
    }
    // Sit a little above the tile's centre, like it's hovering over it.
    const tx = (colOf(cell, size) + 0.5) * pitch - dot / 2;
    const ty = (rowOf(cell, size) + 0.5) * pitch - dot / 2 - diameter * 0.32;
    if (opacity.get() < 0.5) {
      x.set(tx);
      y.set(ty);
    } else {
      const ease = { duration: moveMs, easing: Easing.inOut(Easing.quad) };
      x.set(withTiming(tx, ease));
      y.set(withTiming(ty, ease));
    }
    opacity.set(withTiming(1, { duration: 150 }));
  }, [cell, size, pitch, dot, diameter, moveMs, x, y, opacity]);

  useEffect(() => {
    if (!quality.loops) return;
    pulse.set(withRepeat(withSequence(withTiming(1.25, { duration: 300 }), withTiming(1, { duration: 300 })), -1));
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: pulse.get() }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.firefly, { width: dot, height: dot }, style]}>
      {quality.halos ? (
        <View
          style={[
            styles.fireflyGlow,
            {
              left: -dot * 0.6,
              top: -dot * 0.6,
              right: -dot * 0.6,
              bottom: -dot * 0.6,
              borderRadius: dot * 1.1,
              backgroundColor: color,
            },
          ]}
        />
      ) : null}
      <View style={[styles.fireflyCore, { borderRadius: dot / 2, borderColor: color }]} />
    </Animated.View>
  );
}

function Hand({ x, y, diameter }: { x: number; y: number; diameter: number }) {
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.set(withRepeat(withSequence(withTiming(-diameter * 0.14, { duration: 420 }), withTiming(0, { duration: 420 })), -1));
    return () => cancelAnimation(bob);
  }, [bob, diameter]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bob.get() }] }));
  const fontSize = diameter * 0.6;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x - fontSize * 0.1, top: y + diameter * 0.12 }, style]}>
      <Text style={{ fontSize }}>👆</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fingerLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 1,
    backgroundColor: colors.textOnNight,
    transformOrigin: 'left center',
  },
  firefly: { position: 'absolute', left: 0, top: 0 },
  fireflyGlow: { position: 'absolute', opacity: 0.3 },
  fireflyCore: { flex: 1, backgroundColor: '#FFFBEE', borderWidth: 2 },
});
