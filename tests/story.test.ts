import { describe, expect, it } from '@jest/globals';

import { sceneArt } from '@/art/sceneShapes';
import { cardFor } from '@/game/cards';
import { CHAPTERS, chapterFor, startsChapter } from '@/game/chapters';
import { bandFor, firstRockLevel, getLevel, MAX_LEVEL, TWO_FIREFLIES_FROM } from '@/game/levels';

const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

describe('chapters', () => {
  it('match the difficulty bands one to one', () => {
    for (const c of CHAPTERS) {
      expect(bandFor(c.from).from).toBe(c.from);
      expect(bandFor(c.from).to).toBe(c.to);
    }
    expect(CHAPTERS[CHAPTERS.length - 1].to).toBe(MAX_LEVEL);
  });

  it('cover every level, in order', () => {
    let last = 0;
    for (const n of levels) {
      const c = chapterFor(n);
      expect(n).toBeGreaterThanOrEqual(c.from);
      expect(n).toBeLessThanOrEqual(c.to);
      expect(c.number).toBeGreaterThanOrEqual(last);
      last = c.number;
    }
  });

  it('start at levels 1, 11, 31, 61 and 101', () => {
    expect(levels.filter(startsChapter)).toEqual([1, 11, 31, 61, 101]);
  });
});

describe('cards before a level', () => {
  const cards = levels.map((n) => [n, cardFor(n, getLevel(n).intro)] as const).filter(([, c]) => c !== null);

  it('open each chapter with its title, with Grid Up when the board grows', () => {
    const chapterCards = cards.filter(([, c]) => c?.kind === 'chapter');
    expect(chapterCards.map(([n]) => n)).toEqual([1, 11, 31, 61, 101]);
    for (const [n, c] of chapterCards) {
      if (c?.kind !== 'chapter') continue;
      expect(c.chapter).toBe(chapterFor(n));
      expect(c.gridUp === null).toBe(n === 1);
    }
  });

  it('still introduce rocks and the second firefly', () => {
    expect(cardFor(firstRockLevel(), getLevel(firstRockLevel()).intro)).toEqual({ kind: 'rocks' });
    expect(cardFor(TWO_FIREFLIES_FROM, getLevel(TWO_FIREFLIES_FROM).intro)).toEqual({ kind: 'twoFireflies' });
    expect(cards).toHaveLength(7);
  });
});

describe('chapter landscapes', () => {
  it('are the same every time', () => {
    for (const c of CHAPTERS) expect(sceneArt(c.id, true)).toEqual(sceneArt(c.id, true));
  });

  it('look the same on both quality tiers apart from the number of stars', () => {
    for (const c of CHAPTERS) {
      const rich = sceneArt(c.id, true);
      const low = sceneArt(c.id, false);
      expect(low.layers).toEqual(rich.layers);
      expect(low.moon).toEqual(rich.moon);
      expect(low.stars.map((s) => s.d.length).reduce((a, b) => a + b)).toBeLessThan(
        rich.stars.map((s) => s.d.length).reduce((a, b) => a + b)
      );
    }
  });

  it('are valid path data with no NaN, and stay small', () => {
    for (const c of CHAPTERS) {
      const art = sceneArt(c.id, true);
      const paths = [...art.layers, ...art.details, ...art.stars].map((l) => l.d);
      for (const d of paths) {
        expect(d.length).toBeGreaterThan(0);
        expect(d).not.toMatch(/NaN|undefined|Infinity/);
        expect(d).toMatch(/^M/);
      }
      // A whole scene is a handful of elements: cheap to draw on any phone.
      expect(paths.length).toBeLessThanOrEqual(14);
    }
  });
});
