import { generatePath } from './pathGenerator';
import { createRng, hashSeed, randInt, shuffle, type Rng } from './rng';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'genius';

/** A picture card shown before a level that brings something new. */
export type Intro =
  | { kind: 'gridUp'; from: number; to: number }
  | { kind: 'rocks' }
  | { kind: 'twoFireflies' };

export interface LevelConfig {
  level: number;
  size: number;
  /**
   * Every tile the player traces, in order. On a crossing level one tile
   * appears twice. With two fireflies this is the yellow path followed by
   * the blue one.
   */
  path: number[];
  /**
   * Index in `path` where each firefly's path starts: [0] for one firefly,
   * [0, k] for two. The player gets these tiles for free.
   */
  starts: number[];
  /** Time the firefly spends on each tile while showing the path. */
  stepMs: number;
  difficulty: Difficulty;
  /** Every 5th level (unless it's a Boss): the band's shortest path and a slower firefly. */
  relax: boolean;
  /** Every 10th level: gold board frame, and extra coins in phase 4. */
  boss: boolean;
  /** Decoration only, never on the path. Touching one counts as a wrong tile. */
  rocks: number[];
  intro: Intro | null;
}

interface Band {
  from: number;
  to: number;
  size: number;
  minLength: number;
  maxLength: number;
  stepMs: number;
  difficulty: Difficulty;
}

// The difficulty table from the build prompt, section 2.
const BANDS: Band[] = [
  { from: 1, to: 10, size: 3, minLength: 3, maxLength: 5, stepMs: 700, difficulty: 'easy' },
  { from: 11, to: 30, size: 4, minLength: 5, maxLength: 8, stepMs: 640, difficulty: 'medium' },
  { from: 31, to: 60, size: 5, minLength: 7, maxLength: 11, stepMs: 560, difficulty: 'hard' },
  { from: 61, to: 100, size: 6, minLength: 10, maxLength: 14, stepMs: 520, difficulty: 'expert' },
  { from: 101, to: 300, size: 7, minLength: 12, maxLength: 18, stepMs: 460, difficulty: 'genius' },
];

export const MAX_LEVEL = 300;

/** From here on the path crosses itself once (except on relax levels and two-firefly levels). */
export const CROSSING_FROM = 61;
/** From here on every level has two fireflies: yellow first, then blue. */
export const TWO_FIREFLIES_FROM = 120;
/** Rocks appear on about 1 level in 5 from here on. */
export const ROCKS_FROM = 21;
const ROCK_CHANCE = 0.2;
const RELAX_SLOWER = 1.25;

export function bandFor(level: number): Band {
  return BANDS.find((b) => level >= b.from && level <= b.to) ?? BANDS[BANDS.length - 1];
}

export function isBoss(level: number): boolean {
  return level % 10 === 0;
}

export function isRelax(level: number): boolean {
  return level % 5 === 0 && !isBoss(level);
}

export function getLevel(level: number): LevelConfig {
  const n = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  const band = bandFor(n);
  const relax = isRelax(n);
  const seed = hashSeed('level', n);

  // Path length grows smoothly from the band's minimum to its maximum.
  const t = band.to === band.from ? 1 : (n - band.from) / (band.to - band.from);
  const length = relax ? band.minLength : Math.round(band.minLength + t * (band.maxLength - band.minLength));

  let path: number[];
  let starts: number[];
  if (n >= TWO_FIREFLIES_FROM) {
    // Two separate paths that never share a tile, about half the length each.
    const yellow = generatePath({ size: band.size, length: Math.ceil(length / 2), seed });
    const blue = generatePath({
      size: band.size,
      length: length - yellow.length,
      seed: hashSeed('blue', seed),
      avoid: new Set(yellow),
    });
    path = [...yellow, ...blue];
    starts = [0, yellow.length];
  } else {
    const crossings = n >= CROSSING_FROM && !relax ? 1 : 0;
    path = generatePath({ size: band.size, length, seed, crossings });
    starts = [0];
  }

  const intro = newThingAt(n);
  const rocks = intro === null ? placeRocks(n, seed, band.size, path) : [];
  return {
    level: n,
    size: band.size,
    path,
    starts,
    stepMs: relax ? Math.round(band.stepMs * RELAX_SLOWER) : band.stepMs,
    difficulty: band.difficulty,
    relax,
    boss: isBoss(n),
    rocks,
    intro: intro ?? (n === firstRockLevel() ? { kind: 'rocks' } : null),
  };
}

/** A bigger grid or the second firefly. Rocks never land on these levels: one new thing at a time. */
function newThingAt(n: number): Intro | null {
  const size = bandFor(n).size;
  const before = n > 1 ? bandFor(n - 1).size : size;
  if (size > before) return { kind: 'gridUp', from: before, to: size };
  if (n === TWO_FIREFLIES_FROM) return { kind: 'twoFireflies' };
  return null;
}

/** Same seed, same rocks: the roll and the cells both come from the level's own seed. */
function rockRng(seed: number): Rng {
  return createRng(hashSeed('rocks', seed));
}

function rollsRocks(n: number, rng: Rng): boolean {
  return n >= ROCKS_FROM && newThingAt(n) === null && rng() < ROCK_CHANCE;
}

function placeRocks(n: number, seed: number, size: number, path: number[]): number[] {
  const rng = rockRng(seed);
  if (!rollsRocks(n, rng)) return [];
  const used = new Set(path);
  const free = Array.from({ length: size * size }, (_, cell) => cell).filter((cell) => !used.has(cell));
  // 1-2 rocks on 4x4, up to 4 on 7x7.
  const count = randInt(rng, 1, size - 3);
  return shuffle(rng, free).slice(0, count).sort((a, b) => a - b);
}

let firstRocks: number | undefined;

/** The first level with rocks; it gets the rock picture card. */
export function firstRockLevel(): number {
  if (firstRocks === undefined) {
    firstRocks = MAX_LEVEL + 1;
    for (let n = ROCKS_FROM; n <= MAX_LEVEL; n++) {
      if (rollsRocks(n, rockRng(hashSeed('level', n)))) {
        firstRocks = n;
        break;
      }
    }
  }
  return firstRocks;
}
