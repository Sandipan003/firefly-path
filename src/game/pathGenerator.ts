import { colOf, neighbors, rowOf } from './grid';
import { createRng, randInt, shuffle, type Rng } from './rng';

export interface PathOptions {
  size: number;
  length: number;
  seed: number;
  /**
   * How many times the path crosses itself (Expert levels and up). A crossing
   * reuses one tile: the path goes straight through it once, and later goes
   * straight through it again at a right angle, so the board shows a clean
   * "+" there. Each crossing counts as one more tile of `length`.
   */
  crossings?: number;
  /** Cells the path must not use, such as the first firefly's path. */
  avoid?: ReadonlySet<number>;
}

const NOTHING: ReadonlySet<number> = new Set();

/**
 * A random path that steps only to up/down/left/right neighbours. It never
 * visits a tile twice except at a crossing, and never uses the same step
 * between two tiles twice. Uses depth-first search with backtracking, so a
 * path of the requested length is always found when one exists.
 * Decorations such as rock tiles go on cells the path doesn't use.
 */
export function generatePath({ size, length, seed, crossings = 0, avoid = NOTHING }: PathOptions): number[] {
  const total = size * size;
  if (length < 2 || length - crossings > total - avoid.size) {
    throw new Error(`Path length ${length} does not fit a ${size}x${size} grid`);
  }

  const rng = createRng(seed);
  // A few random starts are plenty for the grid sizes this game uses.
  for (let attempt = 0; attempt < 24; attempt++) {
    const start = randInt(rng, 0, total - 1);
    if (avoid.has(start)) continue;
    const search: Search = {
      size,
      length,
      crossings,
      avoid,
      rng,
      path: [start],
      visits: new Map([[start, 1]]),
      steps: new Set(),
      crossed: 0,
      budget: 5000,
    };
    if (extend(search)) return search.path;
  }
  // Very unlikely; a plain path is still a fair level.
  if (crossings > 0) return generatePath({ size, length, seed, avoid });
  if (avoid.size === 0) return serpentine(size, length);
  throw new Error(`No ${length}-tile path fits around ${avoid.size} used cells`);
}

interface Search {
  size: number;
  length: number;
  crossings: number;
  avoid: ReadonlySet<number>;
  rng: Rng;
  path: number[];
  visits: Map<number, number>;
  /** Steps already taken, as "smaller cell:larger cell". */
  steps: Set<string>;
  crossed: number;
  budget: number;
}

function extend(s: Search): boolean {
  const { path, size } = s;
  if (path.length === s.length) return s.crossed === s.crossings;
  if (--s.budget <= 0) return false;
  const last = path[path.length - 1];
  const prev = path[path.length - 2];
  // Leaving a crossing tile: keep going straight, so both passes are straight lines.
  const atCrossing = (s.visits.get(last) ?? 0) > 1;
  const options = atCrossing ? straightOn(prev, last, size) : shuffle(s.rng, neighbors(last, size));

  for (const next of options) {
    if (s.avoid.has(next) || s.steps.has(stepKey(last, next))) continue;
    const seen = s.visits.get(next) ?? 0;
    if (seen > 0 && (atCrossing || !canCross(s, last, next))) continue;

    path.push(next);
    s.visits.set(next, seen + 1);
    s.steps.add(stepKey(last, next));
    if (seen > 0) s.crossed++;
    if (extend(s)) return true;
    if (seen > 0) s.crossed--;
    s.steps.delete(stepKey(last, next));
    s.visits.set(next, seen);
    path.pop();
  }
  return false;
}

/**
 * Can the path go from `last` back onto `tile`, which it already used? Only
 * as a clean crossing: the first pass went straight through `tile` (so it's
 * not the start tile), and there is room to go straight through it again.
 * The second pass is at a right angle automatically, because the first one
 * already used both steps along its own line.
 */
function canCross(s: Search, last: number, tile: number): boolean {
  if (s.crossed >= s.crossings || s.path.length + 2 > s.length) return false;
  const i = s.path.indexOf(tile);
  if (i < 1 || s.visits.get(tile) !== 1) return false;
  const before = s.path[i - 1];
  const after = s.path[i + 1];
  if (after - tile !== tile - before) return false;
  return straightOn(last, tile, s.size).length === 1;
}

/** The tile straight on from `from` through `via`, if it's on the board. */
function straightOn(from: number, via: number, size: number): number[] {
  const r = rowOf(via, size) + (rowOf(via, size) - rowOf(from, size));
  const c = colOf(via, size) + (colOf(via, size) - colOf(from, size));
  return r >= 0 && r < size && c >= 0 && c < size ? [r * size + c] : [];
}

function stepKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/** Snake through the grid. Only used if the random search gives up. */
function serpentine(size: number, length: number): number[] {
  const out: number[] = [];
  for (let r = 0; r < size && out.length < length; r++) {
    for (let i = 0; i < size && out.length < length; i++) {
      out.push(r * size + (r % 2 === 0 ? i : size - 1 - i));
    }
  }
  return out;
}

/**
 * How many times one firefly's path changes direction. Turns are what make a
 * path hard to remember: a straight line of 5 is easy, a zig-zag of 5 is not.
 */
export function countTurns(path: readonly number[], _size: number): number {
  let turns = 0;
  for (let i = 1; i < path.length - 1; i++) {
    if (path[i] - path[i - 1] !== path[i + 1] - path[i]) turns++;
  }
  return turns;
}
