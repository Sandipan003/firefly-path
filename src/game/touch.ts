/**
 * Turning finger positions into tiles. These run as worklets on the UI
 * thread (see Board.tsx), so the JS thread only hears about it when the
 * finger enters a new tile, not on every touch-move event.
 */
export interface BoardGeometry {
  size: number;
  /** Distance between tile centres, in points. */
  pitch: number;
  /** How close to a tile's centre the finger must be to count as "on" it. */
  hitRadius: number;
}

/**
 * Hit radius as a fraction of pitch. Tiles are drawn at 0.84 of the pitch,
 * so 0.45 makes them slightly easier to hit than they look while leaving a
 * gap between tiles. Cutting a corner passes through that gap instead of
 * landing on a diagonal tile by accident.
 */
export const HIT_RADIUS_RATIO = 0.45;

export function cellAt(x: number, y: number, g: BoardGeometry): number {
  'worklet';
  const col = Math.floor(x / g.pitch);
  const row = Math.floor(y / g.pitch);
  if (col < 0 || row < 0 || col >= g.size || row >= g.size) return -1;
  const dx = x - (col + 0.5) * g.pitch;
  const dy = y - (row + 0.5) * g.pitch;
  return dx * dx + dy * dy <= g.hitRadius * g.hitRadius ? row * g.size + col : -1;
}

/**
 * Tiles entered while moving from (x0, y0) to (x1, y1), in order.
 * Cheap phones may deliver touch events far apart when a frame is slow, so
 * a fast swipe can jump over a whole tile between two events. Walking the
 * segment in small steps catches those tiles anyway.
 * `lastCell` is the tile the finger was last reported on; it is not repeated.
 */
export function cellsAlongSegment(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  g: BoardGeometry,
  lastCell: number
): number[] {
  'worklet';
  const out: number[] = [];
  const dist = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
  const steps = Math.max(1, Math.ceil(dist / (g.pitch / 5)));
  let prev = lastCell;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const cell = cellAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, g);
    if (cell !== -1 && cell !== prev) {
      out.push(cell);
      prev = cell;
    }
  }
  return out;
}
