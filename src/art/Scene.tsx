import { memo, useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { ChapterId } from '@/game/chapters';
import { quality } from '@/perf/quality';
import { colors } from '@/render/theme';
import { SCENE_H, SCENE_W, sceneArt } from './sceneShapes';

interface SceneProps {
  chapter: ChapterId;
  /** 0-1: darken the whole scene so a board on top stays easy to read. */
  dim?: number;
  /** Show only this band of the 400 x 800 canvas (for small thumbnails). */
  crop?: { y: number; h: number };
  style?: StyleProp<ViewStyle>;
}

/**
 * A chapter's night landscape, filling its parent. It is static, so on
 * Android it is drawn once into a texture and reused every frame
 * (renderToHardwareTextureAndroid): the screen then only has to copy one
 * picture, instead of re-drawing a few hundred path points while the board
 * animates on top. That matters most on phones with weak graphics chips.
 */
export const Scene = memo(function Scene({ chapter, dim = 0, crop, style }: SceneProps) {
  const rich = quality.tier !== 'low';
  const art = sceneArt(chapter, rich);
  // Gradient ids must be unique per drawing (they are global on web).
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { x, y, r } = art.moon;

  return (
    <View pointerEvents="none" renderToHardwareTextureAndroid shouldRasterizeIOS style={[StyleSheet.absoluteFill, style]}>
      <Svg
        width="100%"
        height="100%"
        viewBox={crop ? `0 ${crop.y} ${SCENE_W} ${crop.h}` : `0 0 ${SCENE_W} ${SCENE_H}`}
        preserveAspectRatio={crop ? 'xMidYMid slice' : 'xMidYMax slice'}>
        <Defs>
          <LinearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={art.sky[0]} />
            <Stop offset="0.5" stopColor={art.sky[1]} />
            <Stop offset="0.8" stopColor={art.sky[2]} />
          </LinearGradient>
          {rich ? (
            <RadialGradient id={`glow${id}`} cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={colors.moon} stopOpacity="0.32" />
              <Stop offset="1" stopColor={colors.moon} stopOpacity="0" />
            </RadialGradient>
          ) : null}
        </Defs>
        <Rect width={SCENE_W} height={SCENE_H} fill={`url(#sky${id})`} />
        {art.stars.map((s, i) => (
          <Path key={i} d={s.d} fill="#FFFFFF" opacity={s.opacity} />
        ))}
        {rich ? <Circle cx={x} cy={y} r={r * 3.2} fill={`url(#glow${id})`} /> : null}
        <Circle cx={x} cy={y} r={r} fill={colors.moon} />
        <Circle cx={x - r * 0.3} cy={y - r * 0.15} r={r * 0.2} fill="#EFDCAA" opacity={0.7} />
        <Circle cx={x + r * 0.32} cy={y + r * 0.28} r={r * 0.13} fill="#EFDCAA" opacity={0.7} />
        <Circle cx={x + r * 0.12} cy={y - r * 0.42} r={r * 0.09} fill="#EFDCAA" opacity={0.6} />
        {art.layers.map((l, i) => (
          <Path key={i} d={l.d} fill={l.fill} opacity={l.opacity} />
        ))}
        {rich
          ? art.details.map((l, i) => (
              <Path
                key={i}
                d={l.d}
                fill={l.fill}
                opacity={l.opacity}
                stroke={l.stroke}
                strokeWidth={l.stroke ? 1.5 : 0}
                strokeLinecap="round"
              />
            ))
          : null}
        {dim > 0 ? <Rect width={SCENE_W} height={SCENE_H} fill={colors.nightDeep} opacity={dim} /> : null}
      </Svg>
    </View>
  );
});
