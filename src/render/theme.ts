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
  ink: '#14213D',
  inkSoft: '#5B6785',
  textOnNight: '#F4F1E8',
  textDim: '#9AA6C4',
  /** Boss level board frame. */
  gold: '#F4B942',
  rock: '#7D8597',
  rockLight: '#A6ADBD',
} as const;

/** Minimum size for anything a finger presses (build prompt: 56pt). */
export const MIN_TOUCH = 56;
