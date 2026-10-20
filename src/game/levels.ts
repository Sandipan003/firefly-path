import { countTurns, generatePath } from './pathGenerator';
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
  /** How long the whole path stays lit at the end of the show. */
  holdMs: number;
  difficulty: Difficulty;
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
  difficulty: Difficulty;
}

/*
 * Every level is a little harder than the one before, and never easier:
 *   - the firefly flies a little faster, and the whole path shows a little shorter;
 *   - the path is never shorter, and grows a tile every few levels;
 *   - at the same length, the path has at least as many turns (turns are what
 *     make a path hard to remember; straight lines are easy);
 *   - a bigger grid starts where the last one ended, never with a shorter path;
 *   - crossings (61+) and two fireflies (120+) stay once they've arrived;
 *   - rocks get more common.
 * Grid sizes follow the build prompt's table (§2).
 */
const BANDS: Band[] = [
  { from: 1, to: 10, size: 3, minLength: 3, maxLength: 5, difficulty: 'easy' },
  { from: 11, to: 30, size: 4, minLength: 5, maxLength: 8, difficulty: 'medium' },
  { from: 31, to: 60, size: 5, minLength: 8, maxLength: 11, difficulty: 'hard' },
  { from: 61, to: 100, size: 6, minLength: 11, maxLength: 14, difficulty: 'expert' },
  { from: 101, to: 300, size: 7, minLength: 14, maxLength: 20, difficulty: 'genius' },
];

export const MAX_LEVEL = 300;

/** From here on single-firefly paths cross themselves once. */
export const CROSSING_FROM = 61;
/** From here on every level has two fireflies: yellow first, then blue. */
export const TWO_FIREFLIES_FROM = 120;
/** Rocks start appearing here, rarely at first and more often later. */
export const ROCKS_FROM = 21;

/** Firefly speed: 720 ms per tile at level 1, easing towards 420 ms. */
export function stepMsFor(level: number): number {
  return Math.round((420 + 300 * Math.exp(-(level - 1) / 110)) * 10) / 10;
}

/** The full path stays lit for 700 ms at level 1, easing towards 250 ms. */
export function holdMsFor(level: number): number {
  return Math.round((250 + 450 * Math.exp(-(level - 1) / 90)) * 10) / 10;
}

export function bandFor(level: number): Band {
  return BANDS.find((b) => level >= b.from && level <= b.to) ?? BANDS[BANDS.length - 1];
}

export function isBoss(level: number): boolean {
  return level % 10 === 0;
}

/** How far into its band a level is, from 0 (first level) up to just below 1. */
function bandProgress(level: number, band: Band): number {
  return (level - band.from) / (band.to - band.from + 1);
}

/** Path length: steps up evenly from the band's minimum to its maximum. */
export function lengthFor(level: number): number {
  const band = bandFor(level);
  const steps = band.maxLength - band.minLength + 1;
  return band.minLength + Math.floor(bandProgress(level, band) * steps);
}

/**
 * How many turns the path should have: from 30% of the possible to 80% across
 * the band. A path that crosses itself needs a few turns to loop back, so
 * those start a little higher.
 */
function targetTurns(level: number, pieceLength: number, crossing = false): number {
  const share = (crossing ? 0.4 : 0.3) + (crossing ? 0.45 : 0.5) * bandProgress(level, bandFor(level));
  return Math.round(share * Math.max(0, pieceLength - 2));
}

/**
 * Of several candidate paths (all from the level's own seed, so still the
 * same for every player), keep the one whose number of turns is closest to
 * the target.
 */
function pathWithTurns(make: (seed: number) => number[], seed: number, size: number, target: number): number[] {
  let best: number[] = [];
  let bestGap = Infinity;
  for (let attempt = 0; attempt < 150 && bestGap > 0; attempt++) {
    const path = make(hashSeed(seed, 'try', attempt));
    const gap = Math.abs(countTurns(path, size) - target);
    if (gap < bestGap) {
      best = path;
      bestGap = gap;
    }
  }
  return best;
}

const built = new Map<number, LevelConfig>();

/** A level's full setup. Built once per session; the same for every player. */
export function getLevel(level: number): LevelConfig {
  const n = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  let config = built.get(n);
  if (!config) {
    config = buildLevel(n);
    built.set(n, config);
  }
  return config;
}

function buildLevel(n: number): LevelConfig {
  const band = bandFor(n);
  const { size } = band;
  const seed = hashSeed('level', n);
  const length = lengthFor(n);

  let path: number[];
  let starts: number[];
  if (n >= TWO_FIREFLIES_FROM) {
    // Two separate paths that never share a tile, about half the length each.
    const yellowLength = Math.ceil(length / 2);
    const yellow = pathWithTurns(
      (s) => generatePath({ size, length: yellowLength, seed: s }),
      seed,
      size,
      targetTurns(n, yellowLength)
    );
    const blueLength = length - yellow.length;
    const blue = pathWithTurns(
      (s) => generatePath({ size, length: blueLength, seed: s, avoid: new Set(yellow) }),
      hashSeed('blue', seed),
      size,
      targetTurns(n, blueLength)
    );
    path = [...yellow, ...blue];
    starts = [0, yellow.length];
  } else {
    const crossings = n >= CROSSING_FROM ? 1 : 0;
    // A bigger grid keeps at least the turns the last level of the smaller one had,
    // so moving up a grid never makes the path simpler.
    const last = band.from - 1;
    const carried = last >= 1 ? targetTurns(last, lengthFor(last), last >= CROSSING_FROM) : 0;
    path = pathWithTurns(
      (s) => generatePath({ size, length, seed: s, crossings }),
      seed,
      size,
      Math.max(targetTurns(n, length, crossings > 0), carried)
    );
    starts = [0];
  }

  const intro = newThingAt(n);
  const rocks = intro === null ? placeRocks(n, seed, size, path) : [];
  return {
    level: n,
    size,
    path,
    starts,
    stepMs: stepMsFor(n),
    holdMs: holdMsFor(n),
    difficulty: band.difficulty,
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

/** Rocks show up on 15% of levels at level 21, rising to 45% by level 300. */
export function rockChance(level: number): number {
  return 0.15 + (0.3 * (level - ROCKS_FROM)) / (MAX_LEVEL - ROCKS_FROM);
}

/** Same seed, same rocks: the roll and the cells both come from the level's own seed. */
function rockRng(seed: number): Rng {
  return createRng(hashSeed('rocks', seed));
}

function rollsRocks(n: number, rng: Rng): boolean {
  return n >= ROCKS_FROM && newThingAt(n) === null && rng() < rockChance(n);
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
