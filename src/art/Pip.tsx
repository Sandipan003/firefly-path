import { memo, useEffect, useState } from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import type { Mood } from '@/game/session';

/** Pip's look: the game moods, plus an idle face for menus and the story. */
export type PipMood = Mood | 'idle';

interface PipProps {
  size: number;
  mood?: PipMood;
  /** Pip holds a little paper lantern. */
  lantern?: boolean;
  /** Blink now and then (menus). */
  blink?: boolean;
}

const C = {
  body: '#8B5E3C',
  tuft: '#74492E',
  wing: '#6A432B',
  belly: '#EFD5B0',
  bellyMark: '#D3AE82',
  face: '#F7E4C6',
  eye: '#2B1B12',
  beak: '#F4A340',
  beakDark: '#D4822A',
  blush: '#F59AB0',
  brow: '#5A3A26',
  tear: '#9AD3FF',
};

const LOOK: Record<PipMood, [number, number]> = {
  idle: [0, 0],
  waiting: [0, 1],
  thinking: [3, -3.5],
  happy: [0, 0],
  oops: [0, 0],
  won: [0, 0],
  lost: [0, 3],
};

/**
 * Pip the owl, drawn in about 25 SVG shapes on a 120 x 140 canvas.
 * The expression is just which eyes, brows and wings are drawn.
 */
export const Pip = memo(function Pip({ size, mood = 'idle', lantern = false, blink = false }: PipProps) {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!blink) return;
    let open: ReturnType<typeof setTimeout>;
    const every = setInterval(() => {
      setClosed(true);
      open = setTimeout(() => setClosed(false), 150);
    }, 3600);
    return () => {
      clearInterval(every);
      clearTimeout(open);
    };
  }, [blink]);

  const cheerful = mood === 'happy' || mood === 'won';
  const [lx, ly] = LOOK[mood];

  return (
    <Svg width={size} height={(size * 140) / 120} viewBox="0 0 120 140">
      {/* Wings: raised for joy, otherwise folded. */}
      {mood === 'won' ? (
        <G fill={C.wing}>
          <Path d="M28 80 C8 74 0 52 3 30 C12 48 22 60 38 68 Z" />
          <Path d="M92 80 C112 74 120 52 117 30 C108 48 98 60 82 68 Z" />
        </G>
      ) : (
        <G fill={C.wing}>
          <Path d="M16 70 C4 88 8 110 26 120 C21 102 21 86 27 70 Z" />
          <Path d="M104 70 C116 88 112 110 94 120 C99 102 99 86 93 70 Z" />
        </G>
      )}
      <G fill={C.tuft}>
        <Path d="M27 34 L19 8 L46 22 Z" />
        <Path d="M93 34 L101 8 L74 22 Z" />
      </G>
      <Path d="M60 14 C93 14 108 40 108 72 C108 108 88 128 60 128 C32 128 12 108 12 72 C12 40 27 14 60 14 Z" fill={C.body} />
      <Ellipse cx={60} cy={96} rx={31} ry={29} fill={C.belly} />
      <G stroke={C.bellyMark} strokeWidth={2.4} strokeLinecap="round" fill="none">
        <Path d="M46 88 q4 4 8 0" />
        <Path d="M60 84 q4 4 8 0" />
        <Path d="M52 100 q4 4 8 0" />
        <Path d="M66 98 q4 4 8 0" />
        <Path d="M45 110 q4 4 8 0" />
        <Path d="M59 112 q4 4 8 0" />
      </G>
      <Circle cx={42} cy={56} r={21} fill={C.face} />
      <Circle cx={78} cy={56} r={21} fill={C.face} />

      <Eyes mood={mood} closed={closed} lx={lx} ly={ly} />
      <Brows mood={mood} />

      <Path d="M60 64 L53 72 L60 81 L67 72 Z" fill={C.beak} />
      <Path d="M53 72 L60 81 L67 72 Z" fill={C.beakDark} />
      {mood === 'oops' ? <Ellipse cx={60} cy={83} rx={3.2} ry={2.4} fill={C.eye} /> : null}

      {cheerful ? (
        <G fill={C.blush} opacity={0.6}>
          <Circle cx={27} cy={72} r={6} />
          <Circle cx={93} cy={72} r={6} />
        </G>
      ) : null}
      {mood === 'oops' ? <Path d="M102 34 q5 9 0 12 q-5 -3 0 -12 Z" fill={C.tear} /> : null}

      <G fill={C.beak}>
        <Circle cx={47} cy={129} r={4} />
        <Circle cx={53} cy={131} r={4} />
        <Circle cx={67} cy={131} r={4} />
        <Circle cx={73} cy={129} r={4} />
      </G>

      {lantern ? <PipLantern /> : null}
    </Svg>
  );
});

function Eyes({ mood, closed, lx, ly }: { mood: PipMood; closed: boolean; lx: number; ly: number }) {
  const stroke = { stroke: C.eye, strokeWidth: 3.6, strokeLinecap: 'round' as const, fill: 'none' };
  if (mood === 'happy' || mood === 'won') {
    // Smiling eyes: upward arcs.
    return (
      <G {...stroke}>
        <Path d="M32 59 Q42 47 52 59" />
        <Path d="M68 59 Q78 47 88 59" />
      </G>
    );
  }
  if (closed) {
    return (
      <G {...stroke}>
        <Path d="M32 57 Q42 63 52 57" />
        <Path d="M68 57 Q78 63 88 57" />
      </G>
    );
  }
  const pupil = mood === 'oops' ? 5 : 7.6;
  return (
    <G>
      <Circle cx={42} cy={56} r={13} fill="#FFFFFF" />
      <Circle cx={78} cy={56} r={13} fill="#FFFFFF" />
      <Circle cx={42 + lx} cy={57 + ly} r={pupil} fill={C.eye} />
      <Circle cx={78 + lx} cy={57 + ly} r={pupil} fill={C.eye} />
      <Circle cx={39.5 + lx} cy={54 + ly} r={2.6} fill="#FFFFFF" />
      <Circle cx={75.5 + lx} cy={54 + ly} r={2.6} fill="#FFFFFF" />
      {mood === 'lost' ? (
        // Heavy lids for a sad face.
        <G fill={C.face}>
          <Path d="M28 56 A14 14 0 0 1 56 56 Z" />
          <Path d="M64 56 A14 14 0 0 1 92 56 Z" />
        </G>
      ) : null}
    </G>
  );
}

function Brows({ mood }: { mood: PipMood }) {
  const props = { stroke: C.brow, strokeWidth: 3.4, strokeLinecap: 'round' as const, fill: 'none' };
  switch (mood) {
    case 'thinking':
      return (
        <G {...props}>
          <Path d="M32 37 Q42 34 52 37" />
          <Path d="M68 33 Q78 27 88 32" />
        </G>
      );
    case 'oops':
    case 'lost':
      // Worried: the inner ends go up.
      return (
        <G {...props}>
          <Path d="M32 40 Q42 37 52 33" />
          <Path d="M68 33 Q78 37 88 40" />
        </G>
      );
    default:
      return null;
  }
}

/** A small paper lantern hanging from Pip's right wing. */
function PipLantern() {
  return (
    <G>
      <Path d="M100 90 L106 98" stroke={C.brow} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={107} cy={111} r={13} fill="#FFD166" opacity={0.2} />
      <Path d="M101 98 h12 v3 h-12 Z" fill={C.brow} />
      <Ellipse cx={107} cy={111} rx={10} ry={11} fill="#F0714B" />
      <Ellipse cx={107} cy={111} rx={5.5} ry={7.5} fill="#FFD166" opacity={0.9} />
      <Path d="M102 121 h10 v3 h-10 Z" fill={C.brow} />
    </G>
  );
}
