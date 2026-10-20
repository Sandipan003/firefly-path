import { Platform, type TextStyle } from 'react-native';

export const colors = {
  night: '#14213D',
  nightDeep: '#0C1529',
  tile: '#22345E',
  tileEdge: '#2F4677',
  firefly: '#FFD166',
  /** The second firefly (level 120+). */
  fireflyBlue: '#6CB4FF',
  correct: '#06D6A0',
  wrong: '#EF476F',
  card: '#FFFFFF',
  /** Storybook paper for cards and light buttons. */
  paper: '#FFF7E8',
  paperShade: '#F2E6CF',
  ink: '#14213D',
  inkSoft: '#5B6785',
  textOnNight: '#F4F1E8',
  textDim: '#9AA6C4',
  moon: '#FFF3CF',
  /** Boss level board frame. */
  gold: '#F4B942',
  rock: '#7D8597',
  rockLight: '#A6ADBD',
} as const;

/** Minimum size for anything a finger presses (build prompt: 56pt). */
export const MIN_TOUCH = 56;

/**
 * Fraunces (a soft storybook serif) carries the big type: level numbers,
 * chapter titles, the story. Baloo 2 is the friendly UI face and also
 * covers Hindi. Only these four files ship in the app (about 1 MB).
 * No fontWeight with custom fonts: Android would fake a bolder weight.
 */
export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  ui: 'Baloo2_600SemiBold',
  uiBold: 'Baloo2_800ExtraBold',
} as const;

// Baloo 2 has tall built-in padding on Android; turning it off centres text in buttons.
const tight: TextStyle = Platform.OS === 'android' ? { includeFontPadding: false } : {};

export const type = {
  /** The giant level number on the home screen. */
  hero: { fontFamily: fonts.display, fontSize: 148, lineHeight: 150, letterSpacing: -6, ...tight },
  /** Card and story headlines. */
  title: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, letterSpacing: -0.8, ...tight },
  /** Chapter names. */
  chapter: { fontFamily: fonts.displayItalic, fontSize: 26, lineHeight: 32, ...tight },
  /** Small capitals above big type: "LEVEL", "CHAPTER II". */
  label: { fontFamily: fonts.uiBold, fontSize: 13, lineHeight: 16, letterSpacing: 2.6, ...tight },
  button: { fontFamily: fonts.uiBold, fontSize: 21, lineHeight: 26, ...tight },
  body: { fontFamily: fonts.ui, fontSize: 18, lineHeight: 24, ...tight },
} satisfies Record<string, TextStyle>;
