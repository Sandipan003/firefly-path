import type { ChapterId } from '@/game/chapters';
import { createRng, hashSeed, type Rng } from '@/game/rng';
import { colors } from '@/render/theme';

/**
 * The chapter landscapes as SVG path data, drawn on a 400 x 800 canvas
 * (portrait; the Scene component scales it to cover any screen).
 * Everything comes from a seeded random generator, so a chapter looks the
 * same on every phone and every launch. Each layer is one path, so a whole
 * scene is only a dozen SVG elements: cheap to draw, even on budget phones.
 */
export const SCENE_W = 400;
export const SCENE_H = 800;

export interface Layer {
  d: string;
  fill: string;
  opacity?: number;
  stroke?: string;
}

export interface SceneArt {
  sky: [string, string, string];
  stars: { d: string; opacity: number }[];
  moon: { x: number; y: number; r: number };
  /** Back to front. */
  layers: Layer[];
  /** Small details (flowers, reflections, a lit window); skipped on the low quality tier. */
  details: Layer[];
}

const FLOWER_PINK = '#F59AB0';
const FLOWER_MINT = '#7FE3C4';

const f = (n: number) => Math.round(n * 10) / 10;

/** A soft rolling ridge from the left edge to the right, filled down to the bottom. */
export function hills(rng: Rng, base: number, amp: number, waves: number): string {
  const phase = rng() * Math.PI * 2;
  const n = 16;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y =
      base -
      amp * (0.65 * Math.sin(t * waves * Math.PI * 2 + phase) + 0.35 * Math.sin(t * waves * 2.3 * Math.PI * 2 + phase * 1.7));
    pts.push([t * SCENE_W, y]);
  }
  // Quadratic curves through the midpoints give a smooth line with no kinks.
  let d = `M0 ${SCENE_H} L${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    d += ` Q${f(x0)} ${f(y0)} ${f((x0 + x1) / 2)} ${f((y0 + y1) / 2)}`;
  }
  const [xl, yl] = pts[pts.length - 1];
  return `${d} L${f(xl)} ${f(yl)} L${SCENE_W} ${SCENE_H} Z`;
}

/** One pine: three stacked triangles and a short trunk, standing on `base`. */
function pine(x: number, base: number, h: number, w: number): string {
  const tiers = [
    [0.38, 1.0, 0.0],
    [0.62, 0.78, 0.3],
    [0.84, 0.56, 0.55],
  ];
  let d = `M${f(x - w * 0.06)} ${f(base)} h${f(w * 0.12)} v${f(-h * 0.14)} h${f(-w * 0.12)} Z`;
  for (const [top, width, bottom] of tiers) {
    const yb = base - h * 0.12 - h * bottom * 0.62;
    const yt = base - h * top - h * 0.16;
    d += ` M${f(x - (w * width) / 2)} ${f(yb)} L${f(x)} ${f(yt)} L${f(x + (w * width) / 2)} ${f(yb)} Z`;
  }
  return d;
}

export function pineRow(rng: Rng, base: number, count: number, minH: number, maxH: number, spread = 0): string {
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = ((i + 0.2 + rng() * 0.6) / count) * (SCENE_W + 40) - 20;
    const h = minH + rng() * (maxH - minH);
    d += pine(x, base + (rng() - 0.5) * spread, h, h * (0.42 + rng() * 0.12)) + ' ';
  }
  return d.trim();
}

/** Thin grass blades along a ground line. */
export function grass(rng: Rng, base: number, count: number, minH: number, maxH: number): string {
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = rng() * SCENE_W;
    const h = minH + rng() * (maxH - minH);
    const lean = (rng() - 0.5) * h * 0.5;
    d += `M${f(x - 1.6)} ${f(base)} L${f(x + lean)} ${f(base - h)} L${f(x + 1.6)} ${f(base)} Z `;
  }
  return d.trim();
}

/** Circles merged into one path (nonzero fill gives their union). */
export function circles(items: [number, number, number][]): string {
  return items
    .map(([cx, cy, r]) => `M${f(cx - r)} ${f(cy)} a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0 Z`)
    .join(' ');
}

/** A jagged mountain range, plus snow caps on its peaks. */
export function peaks(rng: Rng, base: number, top: number, count: number): { range: string; snow: string } {
  const pts: [number, number][] = [[-20, base]];
  const step = (SCENE_W + 40) / count;
  for (let i = 0; i < count; i++) {
    const x = -20 + step * (i + 0.5) + (rng() - 0.5) * step * 0.4;
    pts.push([x, top + rng() * (base - top) * 0.45]);
    pts.push([x + step * 0.5, base - rng() * (base - top) * 0.25]);
  }
  pts.push([SCENE_W + 20, base]);
  const range = `M-20 ${SCENE_H} ` + pts.map(([x, y]) => `L${f(x)} ${f(y)}`).join(' ') + ` L${SCENE_W + 20} ${SCENE_H} Z`;
  let snow = '';
  for (let i = 1; i < pts.length - 1; i += 2) {
    const [x, y] = pts[i];
    const [xl, yl] = pts[i - 1];
    const [xr, yr] = pts[i + 1];
    const k = 0.22;
    const lx = x + (xl - x) * k;
    const ly = y + (yl - y) * k;
    const rx = x + (xr - x) * k;
    const ry = y + (yr - y) * k;
    // A little zig-zag along the snow line.
    snow += `M${f(x)} ${f(y)} L${f(lx)} ${f(ly)} L${f((lx + x) / 2)} ${f(ly - 4)} L${f(x)} ${f(ly + 3)} L${f((rx + x) / 2)} ${f(ry - 4)} L${f(rx)} ${f(ry)} Z `;
  }
  return { range, snow: snow.trim() };
}

/** Stars in three brightness groups, kept to the upper sky. */
function starField(rng: Rng, count: number, maxY: number): SceneArt['stars'] {
  const groups: [number, number][][] = [[], [], []];
  for (let i = 0; i < count; i++) groups[i % 3].push([rng() * SCENE_W, rng() * maxY]);
  return groups.map((g, i) => ({
    d: circles(g.map(([x, y]) => [x, y, 0.7 + i * 0.45 + rng() * 0.3])),
    opacity: [0.35, 0.6, 0.95][i],
  }));
}

const art: Record<ChapterId, (rng: Rng, starRng: Rng, rich: boolean) => SceneArt> = {
  meadow: (rng, starRng, rich) => ({
    sky: ['#0A1330', '#14213D', '#2B4170'],
    stars: starField(starRng, rich ? 54 : 24, 420),
    moon: { x: 296, y: 150, r: 30 },
    layers: [
      { d: hills(rng, 560, 26, 1.4), fill: '#2D5788' },
      { d: hills(rng, 610, 34, 1.1), fill: '#22466F' },
      { d: pineRow(rng, 618, 3, 46, 70, 30), fill: '#22466F' },
      { d: hills(rng, 690, 26, 0.9), fill: '#183456' },
    ],
    details: [
      { d: grass(rng, 708, 90, 8, 24), fill: '#183456' },
      { d: circles(Array.from({ length: 16 }, () => [rng() * SCENE_W, 720 + rng() * 60, 2.2])), fill: FLOWER_PINK, opacity: 0.75 },
      { d: circles(Array.from({ length: 16 }, () => [rng() * SCENE_W, 720 + rng() * 60, 2.2])), fill: FLOWER_MINT, opacity: 0.7 },
    ],
  }),
  wood: (rng, starRng, rich) => ({
    sky: ['#09132B', '#13233F', '#26426C'],
    stars: starField(starRng, rich ? 46 : 20, 380),
    moon: { x: 110, y: 140, r: 26 },
    layers: [
      { d: pineRow(rng, 600, 16, 50, 92, 16), fill: '#27507A' },
      { d: hills(rng, 610, 10, 1.2), fill: '#27507A' },
      { d: pineRow(rng, 672, 11, 90, 150, 20), fill: '#1B3B5E' },
      { d: hills(rng, 676, 8, 1.6), fill: '#1B3B5E' },
      { d: pine(-10, 820, 420, 200) + ' ' + pine(410, 830, 460, 210), fill: '#0F2440' },
      { d: hills(rng, 742, 14, 1.3), fill: '#112846' },
    ],
    details: [{ d: grass(rng, 744, 60, 6, 18), fill: '#112846' }],
  }),
  river: (rng, starRng, rich) => ({
    sky: ['#0A1530', '#172A4E', '#33548A'],
    stars: starField(starRng, rich ? 50 : 22, 400),
    moon: { x: 200, y: 160, r: 32 },
    layers: [
      { d: hills(rng, 572, 22, 1.2), fill: '#2A5285' },
      { d: pineRow(rng, 585, 9, 30, 52, 16), fill: '#2A5285' },
      { d: `M0 640 Q120 618 220 640 T400 632 L400 728 Q260 744 140 724 T0 736 Z`, fill: '#3768A6' },
      { d: hills(rng, 760, 16, 1.4), fill: '#15304F' },
    ],
    details: [
      // The moon's reflection, broken by ripples.
      { d: circles([[200, 652, 3], [196, 666, 4], [204, 680, 3.5], [199, 696, 4.5], [202, 712, 3]]), fill: colors.moon, opacity: 0.35 },
      { d: grass(rng, 762, 70, 10, 30), fill: '#15304F' },
    ],
  }),
  mountains: (rng, starRng, rich) => {
    const far = peaks(rng, 620, 420, 4);
    const mid = peaks(rng, 690, 540, 5);
    return {
      sky: ['#0A1226', '#1A2547', '#3D4475'],
      stars: starField(starRng, rich ? 56 : 24, 400),
      moon: { x: 300, y: 130, r: 28 },
      layers: [
        { d: far.range, fill: '#3A4C83' },
        { d: far.snow, fill: '#D5DEF3', opacity: 0.55 },
        { d: mid.range, fill: '#283A68' },
        { d: mid.snow, fill: '#D5DEF3', opacity: 0.3 },
        { d: pineRow(rng, 760, 14, 40, 74, 20), fill: '#18264A' },
        { d: hills(rng, 768, 12, 1.2), fill: '#18264A' },
      ],
      details: [],
    };
  },
  sky: (rng, starRng, rich) => ({
    sky: ['#0B0E2A', '#1D1F4F', '#3E3170'],
    stars: starField(starRng, rich ? 70 : 30, 560),
    moon: { x: 290, y: 170, r: 36 },
    layers: [
      { d: circles(cloudBank(rng, 640, 9, 40, 70)), fill: '#3B3D80' },
      { d: circles(cloudBank(rng, 700, 8, 46, 80)), fill: '#2F3170' },
      // Pip's home: a little house on the nearest cloud.
      { d: 'M262 700 L262 666 L284 648 L306 666 L306 700 Z M256 668 L284 642 L312 668 L306 671 L284 651 L262 671 Z', fill: '#23245A' },
      { d: circles(cloudBank(rng, 768, 8, 50, 86)), fill: '#23245A' },
    ],
    details: [
      // A warm window in Pip's house, and a constellation shaped like a path.
      { d: 'M276 674 h16 v14 h-16 Z', fill: colors.firefly, opacity: 0.9 },
      { d: 'M60 120 L104 156 L150 140 L178 196 L228 210', fill: 'none', stroke: colors.firefly, opacity: 0.4 },
    ],
  }),
};

function cloudBank(rng: Rng, base: number, count: number, minR: number, maxR: number): [number, number, number][] {
  return Array.from({ length: count }, (_, i) => {
    const r = minR + rng() * (maxR - minR);
    return [((i + rng() * 0.6) / (count - 1)) * (SCENE_W + 60) - 30, base + rng() * 18, r];
  });
}

const cache = new Map<string, SceneArt>();

/** The landscape for a chapter. `rich` adds details for phones that can afford them. */
export function sceneArt(chapter: ChapterId, rich: boolean): SceneArt {
  const key = `${chapter}:${rich}`;
  let scene = cache.get(key);
  if (!scene) {
    // Stars use their own random stream, so the landscape is identical with or without the extra stars.
    scene = art[chapter](createRng(hashSeed('scene', chapter)), createRng(hashSeed('stars', chapter)), rich);
    cache.set(key, scene);
  }
  return scene;
}

