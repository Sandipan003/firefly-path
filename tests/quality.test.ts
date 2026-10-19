import { describe, expect, it } from '@jest/globals';
import { detectTier, qualityFor } from '@/perf/quality';

const GB = 1024 * 1024 * 1024;

describe('device quality tier', () => {
  it('budget Android phones get the low tier', () => {
    expect(detectTier({ os: 'android', totalMemory: 1.8 * GB, apiLevel: 30, yearClass: 2020 })).toBe('low');
    expect(detectTier({ os: 'android', totalMemory: 2.8 * GB, apiLevel: 31, yearClass: 2021 })).toBe('low');
    expect(detectTier({ os: 'android', totalMemory: 6 * GB, apiLevel: 26, yearClass: 2019 })).toBe('low');
  });

  it('4 GB+ modern phones get the normal tier', () => {
    expect(detectTier({ os: 'android', totalMemory: 3.7 * GB, apiLevel: 33, yearClass: 2021 })).toBe('normal');
    expect(detectTier({ os: 'ios', totalMemory: 4 * GB, apiLevel: null, yearClass: 2020 })).toBe('normal');
  });

  it('unknown hardware falls back to normal', () => {
    expect(detectTier({ os: 'web', totalMemory: null, apiLevel: null, yearClass: null })).toBe('normal');
  });

  it('low tier drops decoration only', () => {
    expect(qualityFor('low')).toMatchObject({ halos: false, loops: false });
    expect(qualityFor('normal')).toMatchObject({ halos: true, loops: true });
  });
});
