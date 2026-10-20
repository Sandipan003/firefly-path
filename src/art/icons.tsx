import { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { colors } from '@/render/theme';

/**
 * The game's icons, drawn as SVG so they look the same on every phone
 * (emoji differ between Android versions, and older phones lack some).
 * Line icons use a 24 x 24 grid with round caps.
 */
interface IconProps {
  size?: number;
  color?: string;
}

const line = (color: string, width = 2.4) => ({
  stroke: color,
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
});

export const BackIcon = memo(function BackIcon({ size = 24, color = colors.textOnNight }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5 L8 12 L15 19" {...line(color, 2.8)} />
    </Svg>
  );
});

export const EyeIcon = memo(function EyeIcon({ size = 24, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2 12 C5 6.5 8.5 4.5 12 4.5 C15.5 4.5 19 6.5 22 12 C19 17.5 15.5 19.5 12 19.5 C8.5 19.5 5 17.5 2 12 Z" {...line(color)} />
      <Circle cx={12} cy={12} r={3.6} fill={color} />
    </Svg>
  );
});

export const BulbIcon = memo(function BulbIcon({ size = 24, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 17.5 h6 M10 21 h4 M12 2.8 a6.2 6.2 0 0 1 4 11 c-.8.7-1 1.6-1 2.6 h-6 c0-1-.2-1.9-1-2.6 A6.2 6.2 0 0 1 12 2.8 Z" {...line(color)} />
    </Svg>
  );
});

export const RestartIcon = memo(function RestartIcon({ size = 24, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19.5 13 A7.6 7.6 0 1 1 17 6.6" {...line(color, 2.6)} />
      <Path d="M18.2 2.8 v4.6 h-4.6" {...line(color, 2.6)} />
    </Svg>
  );
});

export const PlayIcon = memo(function PlayIcon({ size = 24, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 5.2 L18.6 12 L8 18.8 Z" fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
});

export const SkipIcon = memo(function SkipIcon({ size = 24, color = colors.textOnNight }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 6 L11 12 L5 18 M12 6 L18 12 L12 18" {...line(color, 2.4)} />
    </Svg>
  );
});

export const BookIcon = memo(function BookIcon({ size = 24, color = colors.textOnNight }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 5.5 C6 4.5 9 4.8 12 6.5 C15 4.8 18 4.5 21 5.5 V19 C18 18 15 18.3 12 20 C9 18.3 6 18 3 19 Z M12 6.5 V20" {...line(color, 2)} />
    </Svg>
  );
});

const HEART = 'M12 20.6 C5.4 15.6 2.4 12.3 2.4 8.7 C2.4 5.8 4.6 3.8 7.2 3.8 C9.1 3.8 10.8 4.8 12 6.6 C13.2 4.8 14.9 3.8 16.8 3.8 C19.4 3.8 21.6 5.8 21.6 8.7 C21.6 12.3 18.6 15.6 12 20.6 Z';

export const HeartIcon = memo(function HeartIcon({ size = 24, full = true }: { size?: number; full?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {full ? (
        <G>
          <Path d={HEART} fill={colors.wrong} />
          <Path d="M6.4 7.4 C7 6.4 8.2 6 9.2 6.4" {...line('#FFFFFF', 1.8)} opacity={0.65} />
        </G>
      ) : (
        <Path d={HEART} {...line('rgba(244, 241, 232, 0.35)', 2)} />
      )}
    </Svg>
  );
});

const STAR = 'M12 2.6 L14.9 8.6 L21.4 9.5 L16.7 14.1 L17.9 20.6 L12 17.4 L6.1 20.6 L7.3 14.1 L2.6 9.5 L9.1 8.6 Z';

export const StarIcon = memo(function StarIcon({ size = 24, full = true }: { size?: number; full?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={STAR}
        fill={full ? colors.firefly : colors.paperShade}
        stroke={full ? '#E9A92E' : colors.paperShade}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      {full ? <Path d="M9.6 9.6 L11.2 6.6" {...line('#FFFFFF', 1.6)} opacity={0.8} /> : null}
    </Svg>
  );
});

/** The "watch a video" mark on rewarded-ad buttons. */
export const AdBadge = memo(function AdBadge({ size = 22, onMint = false }: { size?: number; onMint?: boolean }) {
  // On a mint button the badge turns dark so it still stands out.
  const fill = onMint ? colors.ink : colors.correct;
  const mark = onMint ? colors.firefly : colors.ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill={fill} stroke={colors.paper} strokeWidth={2} />
      <Path d="M10 8.2 L16 12 L10 15.8 Z" fill={mark} stroke={mark} strokeWidth={1.2} strokeLinejoin="round" />
    </Svg>
  );
});

/** Paper lantern on the last correct tile. */
export const LanternIcon = memo(function LanternIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={(size * 52) / 40} viewBox="0 0 40 52">
      <Path d="M20 1.5 V6" {...line('#5A3A26', 2.4)} />
      <Rect x={12.5} y={6} width={15} height={4.5} rx={1.5} fill="#5A3A26" />
      <Ellipse cx={20} cy={26} rx={14.5} ry={16} fill="#F0714B" />
      <Ellipse cx={20} cy={26} rx={8} ry={11} fill="#FFD166" opacity={0.92} />
      <G {...line('#C9502F', 1.6)} opacity={0.8}>
        <Path d="M13 13.5 Q7.5 26 13 38.5" />
        <Path d="M27 13.5 Q32.5 26 27 38.5" />
      </G>
      <Rect x={13.5} y={41} width={13} height={4.5} rx={1.5} fill="#5A3A26" />
      <Path d="M20 45.5 V50.5" {...line('#C9502F', 2.2)} />
    </Svg>
  );
});

/** A branch reaching in from the right edge, for Pip to perch on. */
export const Branch = memo(function Branch({ width = 220 }: { width?: number }) {
  return (
    <Svg width={width} height={(width * 46) / 220} viewBox="0 0 220 46">
      <G fill="#2F6B52">
        <Ellipse cx={150} cy={10} rx={11} ry={5} transform="rotate(-28 150 10)" />
        <Ellipse cx={172} cy={36} rx={10} ry={4.5} transform="rotate(22 172 36)" />
        <Ellipse cx={70} cy={34} rx={9} ry={4} transform="rotate(18 70 34)" />
      </G>
      <Path d="M220 24 C175 18 130 30 80 24 C55 21 30 25 6 22" {...line('#3A2A22', 10)} />
      <Path d="M140 23 C134 14 128 10 118 7" {...line('#3A2A22', 5)} />
      <Path d="M220 24 C175 18 130 30 80 24" {...line('#5A4034', 3)} opacity={0.6} />
    </Svg>
  );
});

export const GearIcon = memo(function GearIcon({ size = 24, color = colors.textOnNight }: IconProps) {
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    return `M${12 + Math.cos(a) * 7.6} ${12 + Math.sin(a) * 7.6} L${12 + Math.cos(a) * 10} ${12 + Math.sin(a) * 10}`;
  }).join(' ');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={teeth} {...line(color, 3)} />
      <Circle cx={12} cy={12} r={6.4} {...line(color, 2.2)} />
      <Circle cx={12} cy={12} r={2.4} fill={color} />
    </Svg>
  );
});
