/**
 * Cells are numbered row by row: index = row * size + col.
 * Paths only move up/down/left/right, never diagonally.
 */
export function rowOf(cell: number, size: number): number {
  return Math.floor(cell / size);
}

export function colOf(cell: number, size: number): number {
  return cell % size;
}

export function neighbors(cell: number, size: number): number[] {
  const r = rowOf(cell, size);
  const c = colOf(cell, size);
  const out: number[] = [];
  if (r > 0) out.push(cell - size);
  if (r < size - 1) out.push(cell + size);
  if (c > 0) out.push(cell - 1);
  if (c < size - 1) out.push(cell + 1);
  return out;
}

export function isAdjacent(a: number, b: number, size: number): boolean {
  const dr = Math.abs(rowOf(a, size) - rowOf(b, size));
  const dc = Math.abs(colOf(a, size) - colOf(b, size));
  return dr + dc === 1;
}
