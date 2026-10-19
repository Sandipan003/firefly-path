import { describe, expect, it } from '@jest/globals';
import { cellAt, cellsAlongSegment, HIT_RADIUS_RATIO, type BoardGeometry } from '@/game/touch';

const pitch = 100;
const g: BoardGeometry = { size: 3, pitch, hitRadius: pitch * HIT_RADIUS_RATIO };
const centre = (cell: number) => ({ x: ((cell % 3) + 0.5) * pitch, y: (Math.floor(cell / 3) + 0.5) * pitch });

describe('cellAt', () => {
  it('finds the tile under the finger', () => {
    expect(cellAt(50, 50, g)).toBe(0);
    expect(cellAt(250, 150, g)).toBe(5);
  });

  it('treats the gap between tiles and the outside as no tile', () => {
    expect(cellAt(100, 50, g)).toBe(-1);
    expect(cellAt(5, 5, g)).toBe(-1);
    expect(cellAt(-10, 50, g)).toBe(-1);
    expect(cellAt(350, 50, g)).toBe(-1);
  });
});

describe('cellsAlongSegment', () => {
  it('catches tiles a fast swipe jumped over between two touch events', () => {
    const a = centre(0);
    const b = centre(2);
    expect(cellsAlongSegment(a.x, a.y, b.x, b.y, g, 0)).toEqual([1, 2]);
  });

  it('does not repeat the tile the finger is already on', () => {
    expect(cellsAlongSegment(50, 50, 60, 55, g, 0)).toEqual([]);
  });

  it('cutting a corner does not land on the diagonal tile', () => {
    // From tile 0 curving to tile 4 via the corner they share.
    const a = centre(0);
    const corner = { x: 100, y: 100 };
    const cells = cellsAlongSegment(a.x, a.y, corner.x, corner.y, g, 0);
    expect(cells).toEqual([]);
  });

  it('a slow wiggle at a tile edge reports the tile once', () => {
    let last = -1;
    const seen: number[] = [];
    const points = [
      [50, 50],
      [96, 50],
      [104, 50],
      [96, 50],
      [104, 50],
    ];
    for (let i = 1; i < points.length; i++) {
      const cells = cellsAlongSegment(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], g, last);
      seen.push(...cells);
      if (cells.length) last = cells[cells.length - 1];
    }
    expect(seen).toEqual([0]);
  });
});
