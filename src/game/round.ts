/**
 * The rules of one round, as pure functions (no React, no timers).
 *
 * The player re-traces `path`. The first tile is given (it keeps glowing),
 * so `progress` starts at 1. Every tile the finger enters, by sliding onto it
 * or by tapping it, is judged:
 *   - the next tile of the path  -> correct, progress + 1
 *   - a tile already done        -> nothing (sliding back is free)
 *   - anything else              -> wrong, lose a heart
 * The next tile is checked before "already done", so a path that crosses
 * itself (Expert levels) just works: the crossing tile is done, and it is
 * also the next tile when the path comes back to it.
 * After a wrong tile the player keeps their progress. Further wrong tiles
 * cost nothing until the finger lifts or returns to a done tile, so one
 * sloppy swipe can never take more than one heart.
 *
 * Two fireflies (level 120+) are the same idea twice: `path` is the yellow
 * path followed by the blue one, and `starts` says where each begins. Like
 * the very first tile, the blue path's first tile is given: when yellow is
 * finished, progress steps over it, and the finger may travel there across
 * any tiles for free until it arrives or lifts.
 */
export const START_HEARTS = 3;

export type RoundStatus = 'playing' | 'won' | 'lost';

export interface RoundState {
  path: readonly number[];
  /** Index in `path` where each firefly's path starts. These tiles are given. */
  starts: readonly number[];
  progress: number;
  hearts: number;
  mistakes: number;
  helpersUsed: number;
  blocked: boolean;
  /** One firefly's path is done; the finger is on its way to the next one's start. */
  travel: boolean;
  status: RoundStatus;
}

export type RoundEvent =
  | { kind: 'correct'; cell: number; index: number }
  | { kind: 'wrong'; cell: number }
  | { kind: 'won'; cell: number }
  | { kind: 'lost'; cell: number }
  | { kind: 'none' };

export function startRound(
  path: readonly number[],
  starts: readonly number[] = [0],
  hearts = START_HEARTS
): RoundState {
  return {
    path,
    starts,
    progress: 1,
    hearts,
    mistakes: 0,
    helpersUsed: 0,
    blocked: false,
    travel: false,
    status: 'playing',
  };
}

/** Which firefly's path the tile at `index` belongs to: 0 = yellow, 1 = blue. */
export function fireflyAt(starts: readonly number[], index: number): number {
  let piece = 0;
  while (piece + 1 < starts.length && starts[piece + 1] <= index) piece++;
  return piece;
}

export function enterCell(state: RoundState, cell: number): { state: RoundState; event: RoundEvent } {
  if (state.status !== 'playing') return { state, event: { kind: 'none' } };

  if (cell === state.path[state.progress]) {
    let progress = state.progress + 1;
    const travel = state.starts.includes(progress);
    if (travel) progress += 1;
    const won = progress === state.path.length;
    return {
      state: { ...state, progress, blocked: false, travel, status: won ? 'won' : 'playing' },
      event: won ? { kind: 'won', cell } : { kind: 'correct', cell, index: state.progress },
    };
  }

  if (state.travel) {
    const arrived = cell === state.path[state.progress - 1];
    return { state: arrived ? { ...state, travel: false } : state, event: { kind: 'none' } };
  }

  if (state.path.slice(0, state.progress).includes(cell)) {
    return { state: state.blocked ? { ...state, blocked: false } : state, event: { kind: 'none' } };
  }

  if (state.blocked) return { state, event: { kind: 'none' } };

  const hearts = state.hearts - 1;
  const lost = hearts <= 0;
  return {
    state: { ...state, hearts, mistakes: state.mistakes + 1, blocked: true, status: lost ? 'lost' : 'playing' },
    event: lost ? { kind: 'lost', cell } : { kind: 'wrong', cell },
  };
}

export function liftFinger(state: RoundState): RoundState {
  return state.blocked || state.travel ? { ...state, blocked: false, travel: false } : state;
}

/** "Continue" after failing: one more heart, progress kept. */
export function continueWithHeart(state: RoundState): RoundState {
  if (state.status !== 'lost') return state;
  return { ...state, hearts: 1, blocked: false, status: 'playing' };
}

export function markHelperUsed(state: RoundState): RoundState {
  return { ...state, helpersUsed: state.helpersUsed + 1 };
}

/** The tile a hint should light up, or null when the round is over. */
export function nextCell(state: RoundState): number | null {
  return state.status === 'playing' ? state.path[state.progress] : null;
}

/** How many tiles the player got right, for "You got 7 of 9". */
export function tilesCorrect(state: RoundState): number {
  return state.progress;
}

export type Stars = 1 | 2 | 3;

/** Time allowed for 3 stars: a relaxed pace per tile plus a moment to start. */
export function fastTimeMs(pathLength: number): number {
  return 2000 + pathLength * 700;
}

/**
 * 1 star: finished. 2 stars: no hearts lost. 3 stars: no hearts lost,
 * no helpers, and finished within `fastTimeMs`.
 */
export function scoreStars(state: RoundState, elapsedMs: number): Stars {
  if (state.mistakes > 0) return 1;
  if (state.helpersUsed > 0 || elapsedMs > fastTimeMs(state.path.length)) return 2;
  return 3;
}
