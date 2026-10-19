import {
  continueWithHeart,
  enterCell,
  fireflyAt,
  liftFinger,
  markHelperUsed,
  nextCell,
  scoreStars,
  startRound,
  type RoundEvent,
  type RoundState,
  type Stars,
} from './round';

/**
 * One level on screen: the firefly show, then the player's turn, then the
 * result. A plain reducer so the screen only renders what it's told, and the
 * whole flow can be tested without a phone.
 */
export type Phase = 'showing' | 'input' | 'won' | 'lost';

/** 'lit' and 'start' are the yellow firefly's colour, 'litBlue' and 'startBlue' the blue one's. */
export type TileLook = 'idle' | 'lit' | 'litBlue' | 'start' | 'startBlue' | 'correct' | 'wrong' | 'hint';

export type Mood = 'thinking' | 'waiting' | 'happy' | 'oops' | 'won' | 'lost';

export interface Session {
  round: RoundState;
  phase: Phase;
  /** Tiles the firefly has lit so far in the current show. */
  shown: number;
  /** Bumped on every (re)start of the show so the timer effect re-runs. */
  showRun: number;
  /** The player has touched the board this round (hides the hand pointer). */
  touched: boolean;
  wrongCell: number | null;
  /** Bumped on every wrong tile so the same tile can shake again. */
  wrongKey: number;
  hintCell: number | null;
  mood: Mood;
  inputStartedAt: number | null;
  stars: Stars | null;
}

export type SessionAction =
  | { type: 'showStep'; shown: number }
  | { type: 'showDone'; now: number }
  | { type: 'enter'; cells: number[]; now: number }
  | { type: 'lift' }
  | { type: 'clearWrong' }
  | { type: 'hint' }
  | { type: 'replay' }
  | { type: 'continue' }
  | { type: 'restart' };

export function newSession(path: readonly number[], starts: readonly number[] = [0], showRun = 0): Session {
  return {
    round: startRound(path, starts),
    phase: 'showing',
    shown: 0,
    showRun,
    touched: false,
    wrongCell: null,
    wrongKey: 0,
    hintCell: null,
    mood: 'thinking',
    inputStartedAt: null,
    stars: null,
  };
}

export function sessionReducer(s: Session, a: SessionAction): Session {
  switch (a.type) {
    case 'showStep':
      return s.phase === 'showing' ? { ...s, shown: a.shown } : s;

    case 'showDone':
      if (s.phase !== 'showing') return s;
      return { ...s, phase: 'input', shown: 0, mood: 'waiting', inputStartedAt: s.inputStartedAt ?? a.now };

    case 'enter':
      return s.phase === 'input' ? applyCells(s, a.cells, a.now) : s;

    case 'lift':
      return { ...s, round: liftFinger(s.round) };

    case 'clearWrong':
      return s.wrongCell === null ? s : { ...s, wrongCell: null };

    case 'hint': {
      const cell = nextCell(s.round);
      if (s.phase !== 'input' || cell === null) return s;
      return { ...s, round: markHelperUsed(s.round), hintCell: cell };
    }

    case 'replay':
      if (s.phase !== 'input') return s;
      return {
        ...s,
        round: markHelperUsed(liftFinger(s.round)),
        phase: 'showing',
        shown: 0,
        showRun: s.showRun + 1,
        wrongCell: null,
        hintCell: null,
        mood: 'thinking',
      };

    case 'continue':
      if (s.phase !== 'lost') return s;
      return { ...s, round: continueWithHeart(s.round), phase: 'input', wrongCell: null, mood: 'waiting' };

    case 'restart':
      return newSession(s.round.path, s.round.starts, s.showRun + 1);
  }
}

function applyCells(s: Session, cells: number[], now: number): Session {
  let round = s.round;
  let next: Session = { ...s, touched: true };
  for (const cell of cells) {
    const result = enterCell(round, cell);
    round = result.state;
    next = withEvent(next, result.event);
    if (round.status !== 'playing') break;
  }
  next.round = round;
  if (round.status === 'won') {
    next.phase = 'won';
    next.hintCell = null;
    next.stars = scoreStars(round, now - (s.inputStartedAt ?? now));
  } else if (round.status === 'lost') {
    next.phase = 'lost';
  }
  return next;
}

function withEvent(s: Session, e: RoundEvent): Session {
  switch (e.kind) {
    case 'correct':
      return { ...s, mood: 'happy', hintCell: s.hintCell === e.cell ? null : s.hintCell };
    case 'won':
      return { ...s, mood: 'won' };
    case 'wrong':
      return { ...s, mood: 'oops', wrongCell: e.cell, wrongKey: s.wrongKey + 1 };
    case 'lost':
      return { ...s, mood: 'lost', wrongCell: e.cell, wrongKey: s.wrongKey + 1 };
    case 'none':
      return s;
  }
}

/** The last tile the player got right: where they continue from. */
export function anchorCell(s: Session): number {
  return s.round.path[s.round.progress - 1];
}

/** How many path tiles are lit (during the show) or done (during play). */
function litCount(s: Session): number {
  if (s.phase === 'showing') return s.shown;
  return s.phase === 'won' ? s.round.path.length : s.round.progress;
}

export function tileLooks(s: Session, size: number): TileLook[] {
  const looks: TileLook[] = new Array(size * size).fill('idle');
  const { path, starts } = s.round;
  const count = litCount(s);

  if (s.phase === 'showing') {
    for (let i = 0; i < count; i++) looks[path[i]] = fireflyAt(starts, i) === 0 ? 'lit' : 'litBlue';
    return looks;
  }

  for (let i = 0; i < count; i++) looks[path[i]] = 'correct';
  // The first tile of the path being drawn glows in its firefly's colour until the player moves on.
  const piece = fireflyAt(starts, count - 1);
  if (count === starts[piece] + 1) looks[path[starts[piece]]] = piece === 0 ? 'start' : 'startBlue';
  // The next tile can be a done one where the path crosses itself, so the hint wins over 'correct'.
  if (s.hintCell !== null) looks[s.hintCell] = 'hint';
  if (s.wrongCell !== null && looks[s.wrongCell] === 'idle') looks[s.wrongCell] = 'wrong';
  return looks;
}

/** Tiles the lit or done part of the path has passed twice: where it crosses itself. */
export function crossedTiles(s: Session, size: number): boolean[] {
  const passes: number[] = new Array(size * size).fill(0);
  const crossed: boolean[] = new Array(size * size).fill(false);
  const count = litCount(s);
  for (let i = 0; i < count; i++) {
    const cell = s.round.path[i];
    if (++passes[cell] > 1) crossed[cell] = true;
  }
  return crossed;
}

export type Link = { from: number; to: number; kind: 'lit' | 'litBlue' | 'correct' };

/** Bars joining consecutive path tiles, so the path reads as one line. */
export function pathLinks(s: Session): Link[] {
  const { path, starts } = s.round;
  const count = litCount(s);
  const links: Link[] = [];
  for (let i = 1; i < count; i++) {
    // No bar from the end of the yellow path to the start of the blue one.
    if (starts.includes(i)) continue;
    const kind = s.phase !== 'showing' ? 'correct' : fireflyAt(starts, i) === 0 ? 'lit' : 'litBlue';
    links.push({ from: path[i - 1], to: path[i], kind });
  }
  return links;
}
