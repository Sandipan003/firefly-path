import { describe, expect, it } from '@jest/globals';
import {
  anchorCell,
  crossedTiles,
  newSession,
  pathLinks,
  sessionReducer,
  tileLooks,
  type Session,
  type SessionAction,
} from '@/game/session';

const PATH = [0, 1, 4, 7];

function run(s: Session, ...actions: SessionAction[]) {
  return actions.reduce(sessionReducer, s);
}

function playing() {
  return run(newSession(PATH), { type: 'showDone', now: 1000 });
}

describe('session flow', () => {
  it('lights tiles one by one during the show and ignores touches', () => {
    let s = run(newSession(PATH), { type: 'showStep', shown: 2 });
    expect(tileLooks(s, 3).filter((l) => l === 'lit')).toHaveLength(2);
    expect(pathLinks(s)).toEqual([{ from: 0, to: 1, kind: 'lit' }]);
    s = run(s, { type: 'enter', cells: [0, 1], now: 0 });
    expect(s.round.progress).toBe(1);
  });

  it('after the show, only the start tile glows', () => {
    const looks = tileLooks(playing(), 3);
    expect(looks[0]).toBe('start');
    expect(looks.filter((l) => l !== 'idle')).toHaveLength(1);
  });

  it('a full trace wins with stars', () => {
    const s = run(playing(), { type: 'enter', cells: [0, 1, 4, 7], now: 2000 });
    expect(s.phase).toBe('won');
    expect(s.stars).toBe(3);
    expect(tileLooks(s, 3).filter((l) => l === 'correct')).toHaveLength(4);
  });

  it('wrong tile flashes, then clears; the lantern stays on the last correct tile', () => {
    let s = run(playing(), { type: 'enter', cells: [1, 2], now: 0 });
    expect(s.wrongCell).toBe(2);
    expect(tileLooks(s, 3)[2]).toBe('wrong');
    expect(anchorCell(s)).toBe(1);
    s = run(s, { type: 'clearWrong' });
    expect(tileLooks(s, 3)[2]).toBe('idle');
  });

  it('three mistakes lose; Continue goes back to input with one heart', () => {
    let s = playing();
    for (const cell of [3, 6, 8]) s = run(s, { type: 'enter', cells: [cell], now: 0 }, { type: 'lift' });
    expect(s.phase).toBe('lost');
    s = run(s, { type: 'continue' });
    expect(s.phase).toBe('input');
    expect(s.round.hearts).toBe(1);
  });

  it('Show again replays the path without losing progress', () => {
    let s = run(playing(), { type: 'enter', cells: [1], now: 0 }, { type: 'replay' });
    expect(s.phase).toBe('showing');
    expect(s.round.progress).toBe(2);
    s = run(s, { type: 'showDone', now: 0 });
    expect(s.phase).toBe('input');
    expect(s.round.helpersUsed).toBe(1);
  });

  it('Hint marks the next tile until it is entered', () => {
    let s = run(playing(), { type: 'hint' });
    expect(tileLooks(s, 3)[1]).toBe('hint');
    s = run(s, { type: 'enter', cells: [1], now: 0 });
    expect(s.hintCell).toBeNull();
  });

  it('Restart gives a fresh round and a new show', () => {
    const before = run(playing(), { type: 'enter', cells: [3], now: 0 });
    const s = run(before, { type: 'restart' });
    expect(s.phase).toBe('showing');
    expect(s.round.hearts).toBe(3);
    expect(s.showRun).toBe(before.showRun + 1);
  });
});

describe('a path that crosses itself', () => {
  const CROSS = [3, 4, 5, 2, 1, 4, 7];

  it('marks the crossing tile once the firefly passes it again', () => {
    let s = run(newSession(CROSS), { type: 'showStep', shown: 5 });
    expect(crossedTiles(s, 3)[4]).toBe(false);
    s = run(s, { type: 'showStep', shown: 6 });
    expect(crossedTiles(s, 3)[4]).toBe(true);
    expect(crossedTiles(s, 3).filter(Boolean)).toHaveLength(1);
    // Two bars across 4 and two down through it: a "+".
    expect(pathLinks(run(s, { type: 'showStep', shown: 7 })).filter((l) => l.from === 4 || l.to === 4)).toHaveLength(4);
  });

  it('marks it again while the player draws, and the hint can point at it', () => {
    let s = run(newSession(CROSS), { type: 'showDone', now: 0 }, { type: 'enter', cells: [4, 5, 2, 1], now: 0 });
    expect(crossedTiles(s, 3)[4]).toBe(false);
    s = run(s, { type: 'hint' });
    expect(tileLooks(s, 3)[4]).toBe('hint');
    s = run(s, { type: 'enter', cells: [4], now: 0 });
    expect(crossedTiles(s, 3)[4]).toBe(true);
    expect(tileLooks(s, 3)[4]).toBe('correct');
  });
});

describe('two fireflies', () => {
  const TWO = [0, 1, 2, 6, 7, 8];
  const STARTS = [0, 3];

  it('the show lights yellow, then blue, with no bar between the two paths', () => {
    const s = run(newSession(TWO, STARTS), { type: 'showStep', shown: 5 });
    const looks = tileLooks(s, 3);
    expect([looks[0], looks[1], looks[2]]).toEqual(['lit', 'lit', 'lit']);
    expect([looks[6], looks[7], looks[8]]).toEqual(['litBlue', 'litBlue', 'idle']);
    expect(pathLinks(s)).toEqual([
      { from: 0, to: 1, kind: 'lit' },
      { from: 1, to: 2, kind: 'lit' },
      { from: 6, to: 7, kind: 'litBlue' },
    ]);
  });

  it('once yellow is drawn, the blue start glows and carries the lantern', () => {
    let s = run(newSession(TWO, STARTS), { type: 'showDone', now: 0 });
    expect(tileLooks(s, 3)[0]).toBe('start');
    s = run(s, { type: 'enter', cells: [1, 2], now: 0 });
    expect(tileLooks(s, 3)[6]).toBe('startBlue');
    expect(anchorCell(s)).toBe(6);
    expect(s.round.travel).toBe(true);
    s = run(s, { type: 'enter', cells: [7], now: 0 });
    expect(tileLooks(s, 3)[6]).toBe('correct');
  });

  it('Restart keeps both fireflies', () => {
    const s = run(newSession(TWO, STARTS), { type: 'showDone', now: 0 }, { type: 'restart' });
    expect(s.round.starts).toEqual(STARTS);
  });
});
