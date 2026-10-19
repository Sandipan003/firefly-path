import { describe, expect, it } from '@jest/globals';
import {
  continueWithHeart,
  enterCell,
  fastTimeMs,
  fireflyAt,
  liftFinger,
  markHelperUsed,
  nextCell,
  scoreStars,
  startRound,
  type RoundState,
} from '@/game/round';

// 3x3 grid:  0 1 2
//            3 4 5
//            6 7 8
const PATH = [0, 1, 4, 7];

function enterAll(state: RoundState, cells: number[]) {
  const events: string[] = [];
  for (const cell of cells) {
    const r = enterCell(state, cell);
    state = r.state;
    events.push(r.event.kind);
  }
  return { state, events };
}

describe('round rules', () => {
  it('starts on the first tile with 3 hearts', () => {
    const s = startRound(PATH);
    expect(s.progress).toBe(1);
    expect(s.hearts).toBe(3);
  });

  it('wins when every tile is entered in order', () => {
    const { state, events } = enterAll(startRound(PATH), [0, 1, 4, 7]);
    expect(events).toEqual(['none', 'correct', 'correct', 'won']);
    expect(state.status).toBe('won');
  });

  it('a wrong tile costs one heart and keeps progress', () => {
    const { state, events } = enterAll(startRound(PATH), [1, 2]);
    expect(events).toEqual(['correct', 'wrong']);
    expect(state.hearts).toBe(2);
    expect(state.progress).toBe(2);
  });

  it('one sloppy swipe never costs more than one heart', () => {
    const { state } = enterAll(startRound(PATH), [3, 6, 7, 8]);
    expect(state.hearts).toBe(2);
  });

  it('lifting the finger makes the next wrong tile count again', () => {
    let { state } = enterAll(startRound(PATH), [3]);
    state = liftFinger(state);
    ({ state } = enterAll(state, [6]));
    expect(state.hearts).toBe(1);
  });

  it('going back onto a done tile also resets the block', () => {
    const { state } = enterAll(startRound(PATH), [1, 2, 1, 2]);
    expect(state.hearts).toBe(1);
  });

  it('the right tile still counts straight after a wrong one', () => {
    const { state, events } = enterAll(startRound(PATH), [1, 2, 4]);
    expect(events).toEqual(['correct', 'wrong', 'correct']);
    expect(state.progress).toBe(3);
  });

  it('sliding back over done tiles is free', () => {
    const { state } = enterAll(startRound(PATH), [1, 4, 1, 0, 1, 4]);
    expect(state.hearts).toBe(3);
    expect(state.progress).toBe(3);
  });

  it('loses after three separate mistakes, then Continue gives one heart', () => {
    let state = startRound(PATH);
    for (const cell of [3, 6, 8]) {
      state = liftFinger(enterCell(state, cell).state);
    }
    expect(state.status).toBe('lost');
    state = continueWithHeart(state);
    expect(state.status).toBe('playing');
    expect(state.hearts).toBe(1);
    expect(state.progress).toBe(1);
  });

  it('ignores input after the round is over', () => {
    const { state } = enterAll(startRound(PATH), [1, 4, 7]);
    expect(enterCell(state, 3).state).toBe(state);
  });
});

describe('a path that crosses itself', () => {
  // 3 4 5 across, up to 2, back over 1, then 4 again going down to 7.
  const CROSS = [3, 4, 5, 2, 1, 4, 7];

  it('takes the crossing tile again when it is next', () => {
    const { state, events } = enterAll(startRound(CROSS), [4, 5, 2, 1, 4, 7]);
    expect(events).toEqual(['correct', 'correct', 'correct', 'correct', 'correct', 'won']);
    expect(state.hearts).toBe(3);
  });

  it('before then, the crossing tile is just a done tile', () => {
    const { state, events } = enterAll(startRound(CROSS), [4, 5, 4, 5]);
    expect(events).toEqual(['correct', 'correct', 'none', 'none']);
    expect(state.progress).toBe(3);
  });

  it('hints the crossing tile when it is next', () => {
    const { state } = enterAll(startRound(CROSS), [4, 5, 2, 1]);
    expect(nextCell(state)).toBe(4);
  });
});

describe('two fireflies', () => {
  // Yellow 0 1 2 along the top, blue 6 7 8 along the bottom.
  const TWO = [0, 1, 2, 6, 7, 8];
  const STARTS = [0, 3];

  it('knows which firefly each tile belongs to', () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => fireflyAt(STARTS, i))).toEqual([0, 0, 0, 1, 1, 1]);
    expect(fireflyAt([0], 5)).toBe(0);
  });

  it('gives the blue start for free once yellow is done', () => {
    const { state } = enterAll(startRound(TWO, STARTS), [1, 2]);
    expect(state.progress).toBe(4);
    expect(state.travel).toBe(true);
    expect(nextCell(state)).toBe(7);
  });

  it('touching the blue start before yellow is done is a wrong tile', () => {
    const { state, events } = enterAll(startRound(TWO, STARTS), [6]);
    expect(events).toEqual(['wrong']);
    expect(state.hearts).toBe(2);
  });

  it('the finger travels to the blue start for free', () => {
    const { state, events } = enterAll(startRound(TWO, STARTS), [1, 2, 5, 4, 3, 6]);
    expect(events).toEqual(['correct', 'correct', 'none', 'none', 'none', 'none']);
    expect(state.hearts).toBe(3);
    expect(state.travel).toBe(false);
  });

  it('after arriving, wrong tiles count again', () => {
    const { state } = enterAll(startRound(TWO, STARTS), [1, 2, 3, 6, 3]);
    expect(state.hearts).toBe(2);
  });

  it('lifting the finger also ends the trip', () => {
    let { state } = enterAll(startRound(TWO, STARTS), [1, 2]);
    state = liftFinger(state);
    expect(state.travel).toBe(false);
    ({ state } = enterAll(state, [4]));
    expect(state.hearts).toBe(2);
  });

  it('sliding straight onto the next blue tile counts', () => {
    const { state, events } = enterAll(startRound(TWO, STARTS), [1, 2, 5, 8, 7, 8]);
    expect(events).toEqual(['correct', 'correct', 'none', 'none', 'correct', 'won']);
    expect(state.status).toBe('won');
    expect(state.hearts).toBe(3);
  });
});

describe('stars', () => {
  const won = enterAll(startRound(PATH), [1, 4, 7]).state;

  it('3 stars: no mistakes, no helpers, fast', () => {
    expect(scoreStars(won, 1000)).toBe(3);
  });

  it('2 stars: no mistakes but slow or helped', () => {
    expect(scoreStars(won, fastTimeMs(PATH.length) + 1)).toBe(2);
    expect(scoreStars(markHelperUsed(won), 1000)).toBe(2);
  });

  it('1 star: finished after a mistake', () => {
    const { state } = enterAll(startRound(PATH), [3, 1, 4, 7]);
    expect(state.status).toBe('won');
    expect(scoreStars(state, 1000)).toBe(1);
  });
});
