// Бот: легальность ходов, детерминизм, сила против случайной политики.

import { describe, expect, it } from 'vitest';
import {
  applyMove,
  chooseBotMove,
  legalMoves,
  moveEquals,
  newRound,
  scoreRound,
  type BotLevel,
  type GameState,
  type Move,
} from '../src/engine';
import { BASE } from './helpers';

/** Партия бот против случайной политики. Детерминирована по seed. */
function botVsRandom(seed: number, botIdx: 0 | 1, level: BotLevel): GameState {
  let state = newRound({ seed, first: (seed % 2) as 0 | 1, variant: BASE });
  let rng = (seed ^ 0x5bd1e995) >>> 0;
  const rand = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng / 4294967296;
  };
  let guard = 0;
  while (state.phase !== 'over') {
    if (++guard > 500) throw new Error('Партия не завершилась');
    const moves = legalMoves(state);
    const move =
      state.current === botIdx
        ? chooseBotMove(state, { level })
        : moves[Math.floor(rand() * moves.length)]!;
    state = applyMove(state, move); // applyMove проверяет легальность
  }
  return state;
}

describe('бот', () => {
  it('ходы легальны всю партию (бот против бота, разные уровни)', () => {
    for (const seed of [3, 77, 421]) {
      let state = newRound({ seed, first: 0, variant: BASE });
      let guard = 0;
      while (state.phase !== 'over') {
        if (++guard > 500) throw new Error('Партия не завершилась');
        const level: BotLevel = state.current === 0 ? 'normal' : 'easy';
        const move = chooseBotMove(state, { level });
        expect(legalMoves(state).some((m) => moveEquals(m, move))).toBe(true);
        state = applyMove(state, move);
      }
      expect(state.result).not.toBeNull();
    }
  });

  it('детерминизм: одно состояние — один и тот же ход', () => {
    const state = newRound({ seed: 20260802, first: 0, variant: BASE });
    // Прогоняем несколько позиций по ходу партии.
    let s = state;
    for (let i = 0; i < 10 && s.phase !== 'over'; i++) {
      const a = chooseBotMove(s, { level: 'normal' });
      const b = chooseBotMove(s, { level: 'normal' });
      expect(a).toEqual(b);
      s = applyMove(s, a);
    }
  });

  it('перебор не трогает RNG и историю состояния', () => {
    const state = newRound({ seed: 555, first: 0, variant: BASE });
    const rngBefore = state.rng;
    const histBefore = state.history.length;
    chooseBotMove(state, { level: 'strong' });
    expect(state.rng).toBe(rngBefore);
    expect(state.history.length).toBe(histBefore);
  });

  it('normal заметно сильнее случайной политики', () => {
    // 24 партии с фиксированными сидами, бот попеременно за обе стороны.
    let botPts = 0;
    let rndPts = 0;
    let botWins = 0;
    let games = 0;
    for (let i = 0; i < 24; i++) {
      const seed = i * 7919 + 101;
      const botIdx = (i % 2) as 0 | 1;
      const final = botVsRandom(seed, botIdx, 'normal');
      const result = final.result!;
      expect(result).toEqual(scoreRound(final.hands, result.cause));
      botPts += result.added[botIdx]!;
      rndPts += result.added[(1 - botIdx) as 0 | 1]!;
      if (result.winner === botIdx) botWins++;
      games++;
    }
    // Очки — штраф (§10.3): бот должен набирать существенно меньше случайного.
    // Пороги с запасом: при деградации силы тест обязан упасть.
    expect(botWins / games).toBeGreaterThan(0.6);
    expect(botPts).toBeLessThan(rndPts * 0.6);
  });
});
