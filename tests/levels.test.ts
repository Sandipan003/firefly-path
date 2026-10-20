import { describe, expect, it } from '@jest/globals';
import { isAdjacent } from '@/game/grid';
import {
  bandFor,
  CROSSING_FROM,
  firstRockLevel,
  getLevel,
  lengthFor,
  MAX_LEVEL,
  rockChance,
  ROCKS_FROM,
  TWO_FIREFLIES_FROM,
  type LevelConfig,
} from '@/game/levels';
import { countTurns, generatePath } from '@/game/pathGenerator';

const allLevels = Array.from({ length: MAX_LEVEL }, (_, i) => getLevel(i + 1));

/** Each firefly's own path. */
function pieces(c: LevelConfig): number[][] {
  return c.starts.map((start, i) => c.path.slice(start, c.starts[i + 1] ?? c.path.length));
}

/** For each tile the path uses more than once, the indices where it does. */
function revisits(path: readonly number[]): [number, number[]][] {
  const at = new Map<number, number[]>();
  path.forEach((cell, i) => at.set(cell, [...(at.get(cell) ?? []), i]));
  return [...at].filter(([, indices]) => indices.length > 1);
}

describe('level paths', () => {
  it.each(allLevels)('level $level is a valid connected path', (config) => {
    const { path, size } = config;
    const band = bandFor(config.level);
    expect(path.length).toBeGreaterThanOrEqual(band.minLength);
    expect(path.length).toBeLessThanOrEqual(band.maxLength);
    for (const cell of path) {
      expect(cell).toBeGreaterThanOrEqual(0);
      expect(cell).toBeLessThan(size * size);
    }
    expect(config.starts[0]).toBe(0);
    const steps = new Set<string>();
    for (const piece of pieces(config)) {
      expect(piece.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < piece.length; i++) {
        expect(isAdjacent(piece[i - 1], piece[i], size)).toBe(true);
        // Never the same step twice (so never straight back either).
        const step = [piece[i - 1], piece[i]].sort((a, b) => a - b).join(':');
        expect(steps.has(step)).toBe(false);
        steps.add(step);
      }
    }
  });

  it.each(allLevels)('level $level crosses itself only on Expert+ levels, and cleanly', (config) => {
    const { path } = config;
    const crossing = config.level >= CROSSING_FROM && config.starts.length === 1;
    const twice = revisits(path);
    expect(twice).toHaveLength(crossing ? 1 : 0);
    for (const [cell, indices] of twice) {
      expect(indices).toHaveLength(2);
      for (const i of indices) {
        // Straight through, never at the start or the end.
        expect(i).toBeGreaterThan(0);
        expect(i).toBeLessThan(path.length - 1);
        expect(path[i + 1] - cell).toBe(cell - path[i - 1]);
      }
      // One pass across, one pass down: a clean "+".
      const across = (i: number) => Math.abs(path[i + 1] - cell) === 1;
      expect(across(indices[0])).not.toBe(across(indices[1]));
    }
  });

  it.each(allLevels)('level $level keeps rocks off the path', (config) => {
    const { rocks, path, size } = config;
    expect(new Set(rocks).size).toBe(rocks.length);
    for (const rock of rocks) {
      expect(rock).toBeGreaterThanOrEqual(0);
      expect(rock).toBeLessThan(size * size);
      expect(path).not.toContain(rock);
    }
  });

  it('is the same for every player (seeded)', () => {
    expect(getLevel(37)).toEqual(getLevel(37));
    expect(getLevel(1).path).toEqual(allLevels[0].path);
    const rocky = allLevels.find((c) => c.rocks.length > 0)!;
    expect(getLevel(rocky.level).rocks).toEqual(rocky.rocks);
  });

  it('starts with a 3-tile tutorial path on 3x3', () => {
    expect(getLevel(1).size).toBe(3);
    expect(getLevel(1).path).toHaveLength(3);
  });

  it('follows the difficulty table grid sizes', () => {
    expect(getLevel(10).size).toBe(3);
    expect(getLevel(11).size).toBe(4);
    expect(getLevel(31).size).toBe(5);
    expect(getLevel(61).size).toBe(6);
    expect(getLevel(101).size).toBe(7);
  });
});

describe('every level is harder than the one before', () => {
  const pairs = allLevels.slice(1).map((next, i) => [allLevels[i], next] as const);
  const features = (c: LevelConfig) => (c.starts.length === 2 ? 2 : revisits(c.path).length > 0 ? 1 : 0);
  const turns = (c: LevelConfig) => pieces(c).reduce((sum, p) => sum + countTurns(p, c.size), 0);

  it('the firefly is always a little faster, and the full path shows a little shorter', () => {
    for (const [a, b] of pairs) {
      expect(b.stepMs).toBeLessThan(a.stepMs);
      expect(b.holdMs).toBeLessThan(a.holdMs);
    }
    expect(getLevel(1).stepMs).toBe(720);
    expect(getLevel(MAX_LEVEL).stepMs).toBeGreaterThan(420);
  });

  it('the grid never shrinks and the path never gets shorter, even when the grid grows', () => {
    for (const [a, b] of pairs) {
      expect(b.size).toBeGreaterThanOrEqual(a.size);
      expect(lengthFor(b.level)).toBeGreaterThanOrEqual(lengthFor(a.level));
    }
  });

  it('crossings and the second firefly stay once they have arrived', () => {
    for (const [a, b] of pairs) expect(features(b)).toBeGreaterThanOrEqual(features(a));
  });

  it('at the same length and kind of path, the path has at least as many turns', () => {
    for (const [a, b] of pairs) {
      if (lengthFor(a.level) === lengthFor(b.level) && features(a) === features(b)) {
        expect(turns(b)).toBeGreaterThanOrEqual(turns(a));
      }
    }
  });

  it('a bigger grid never brings a simpler path', () => {
    for (const [a, b] of pairs) {
      if (b.size > a.size && features(a) === features(b)) expect(turns(b)).toBeGreaterThanOrEqual(turns(a));
    }
  });

  it('level 1 is a gentle 3-tile straight line', () => {
    expect(getLevel(1).path).toHaveLength(3);
    expect(countTurns(getLevel(1).path, 3)).toBe(0);
  });

  it('every 10th level is a Boss', () => {
    for (const c of allLevels) expect(c.boss).toBe(c.level % 10 === 0);
  });
});

describe('two fireflies', () => {
  it('come at level 120 and stay', () => {
    for (const c of allLevels) expect(c.starts).toHaveLength(c.level >= TWO_FIREFLIES_FROM ? 2 : 1);
  });

  it('draw two separate paths of about the same length', () => {
    for (const c of allLevels.filter((l) => l.starts.length === 2)) {
      const [yellow, blue] = pieces(c);
      expect(new Set(c.path).size).toBe(c.path.length);
      expect(Math.abs(yellow.length - blue.length)).toBeLessThanOrEqual(1);
    }
  });
});

describe('picture cards', () => {
  it('show Grid Up exactly when the grid grows', () => {
    const cards = allLevels.filter((c) => c.intro?.kind === 'gridUp').map((c) => [c.level, c.intro]);
    expect(cards).toEqual([
      [11, { kind: 'gridUp', from: 3, to: 4 }],
      [31, { kind: 'gridUp', from: 4, to: 5 }],
      [61, { kind: 'gridUp', from: 5, to: 6 }],
      [101, { kind: 'gridUp', from: 6, to: 7 }],
    ]);
  });

  it('introduce the second firefly and rocks once each', () => {
    expect(getLevel(TWO_FIREFLIES_FROM).intro).toEqual({ kind: 'twoFireflies' });
    const firstRocky = allLevels.find((c) => c.rocks.length > 0)!;
    expect(firstRocky.level).toBe(firstRockLevel());
    expect(firstRocky.intro).toEqual({ kind: 'rocks' });
    expect(allLevels.filter((c) => c.intro !== null)).toHaveLength(6);
  });

  it('bring one new thing at a time: no rocks on a Grid Up or two-firefly level', () => {
    for (const c of allLevels) {
      if (c.intro !== null && c.intro.kind !== 'rocks') expect(c.rocks).toEqual([]);
    }
  });
});

describe('rocks', () => {
  it('only from level 21, rarely at first and more often later', () => {
    const rocky = allLevels.filter((c) => c.rocks.length > 0);
    expect(rocky.every((c) => c.level >= ROCKS_FROM)).toBe(true);
    const share = (from: number, to: number) => rocky.filter((c) => c.level >= from && c.level <= to).length / (to - from + 1);
    expect(share(21, 120)).toBeLessThan(share(201, 300));
    expect(rockChance(ROCKS_FROM)).toBeCloseTo(0.15);
    expect(rockChance(MAX_LEVEL)).toBeCloseTo(0.45);
  });
});

describe('path generator', () => {
  it('can fill a whole grid', () => {
    const path = generatePath({ size: 4, length: 16, seed: 99 });
    expect(new Set(path).size).toBe(16);
  });

  it('rejects impossible lengths', () => {
    expect(() => generatePath({ size: 3, length: 10, seed: 1 })).toThrow();
  });

  it('crosses itself when asked', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(revisits(generatePath({ size: 5, length: 10, seed, crossings: 1 }))).toHaveLength(1);
    }
  });

  it('keeps off cells it is told to avoid', () => {
    const avoid = new Set([0, 1, 2, 3, 4, 5, 6]);
    for (let seed = 1; seed <= 20; seed++) {
      const path = generatePath({ size: 7, length: 9, seed, avoid });
      expect(path.some((cell) => avoid.has(cell))).toBe(false);
    }
  });
});
