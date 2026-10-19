import { describe, expect, it } from '@jest/globals';
import { isAdjacent } from '@/game/grid';
import {
  bandFor,
  CROSSING_FROM,
  firstRockLevel,
  getLevel,
  MAX_LEVEL,
  ROCKS_FROM,
  TWO_FIREFLIES_FROM,
  type LevelConfig,
} from '@/game/levels';
import { generatePath } from '@/game/pathGenerator';

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
    const crossing = config.level >= CROSSING_FROM && !config.relax && config.starts.length === 1;
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

describe('pacing', () => {
  it('every 10th level is a Boss, every other 5th level is a relax level', () => {
    for (const c of allLevels) {
      expect(c.boss).toBe(c.level % 10 === 0);
      expect(c.relax).toBe(c.level % 5 === 0 && c.level % 10 !== 0);
    }
    expect(getLevel(5).relax).toBe(true);
    expect(getLevel(10)).toMatchObject({ boss: true, relax: false });
  });

  it('relax levels have the shortest path of their band and a slower firefly', () => {
    for (const c of allLevels) {
      const band = bandFor(c.level);
      if (c.relax) {
        expect(c.path).toHaveLength(band.minLength);
        expect(c.stepMs).toBeGreaterThan(band.stepMs);
      } else {
        expect(c.stepMs).toBe(band.stepMs);
      }
    }
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
  it('come rarely, and only from level 21', () => {
    const rocky = allLevels.filter((c) => c.rocks.length > 0);
    expect(rocky.every((c) => c.level >= ROCKS_FROM)).toBe(true);
    expect(rocky.length).toBeGreaterThan(20);
    expect(rocky.length / (MAX_LEVEL - ROCKS_FROM + 1)).toBeLessThan(0.3);
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
