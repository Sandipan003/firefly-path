import { bandFor } from './levels';

/**
 * The story through the game: each difficulty band is one chapter of
 * Pip's journey home, with its own landscape.
 */
export type ChapterId = 'meadow' | 'wood' | 'river' | 'mountains' | 'sky';

export interface Chapter {
  id: ChapterId;
  /** 1-based, shown as a Roman numeral. */
  number: number;
  numeral: string;
  title: string;
  /** First and last level of the chapter. */
  from: number;
  to: number;
}

export const CHAPTERS: readonly Chapter[] = [
  { id: 'meadow', number: 1, numeral: 'I', title: 'The Meadow', from: 1, to: 10 },
  { id: 'wood', number: 2, numeral: 'II', title: 'The Whispering Wood', from: 11, to: 30 },
  { id: 'river', number: 3, numeral: 'III', title: 'The Silver River', from: 31, to: 60 },
  { id: 'mountains', number: 4, numeral: 'IV', title: 'The Moon Mountains', from: 61, to: 100 },
  { id: 'sky', number: 5, numeral: 'V', title: 'The Starry Sky', from: 101, to: 300 },
];

export function chapterFor(level: number): Chapter {
  const band = bandFor(level);
  return CHAPTERS.find((c) => c.from === band.from) ?? CHAPTERS[CHAPTERS.length - 1];
}

/** True on the first level of a chapter, where its title card is shown. */
export function startsChapter(level: number): boolean {
  return chapterFor(level).from === level;
}
