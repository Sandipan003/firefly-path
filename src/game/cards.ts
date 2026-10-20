import { chapterFor, startsChapter, type Chapter } from './chapters';
import type { Intro } from './levels';

/**
 * What comes before a level's show: a chapter's title card on its first
 * level (with "Grid Up!" when the board grows), or a picture card for a new
 * twist (rocks, the second firefly).
 */
export type Card =
  | { kind: 'chapter'; chapter: Chapter; gridUp: { from: number; to: number } | null }
  | Exclude<Intro, { kind: 'gridUp' }>;

export function cardFor(level: number, intro: Intro | null): Card | null {
  if (startsChapter(level)) {
    return { kind: 'chapter', chapter: chapterFor(level), gridUp: intro?.kind === 'gridUp' ? intro : null };
  }
  return intro?.kind === 'gridUp' ? null : intro;
}
