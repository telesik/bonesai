import { describe, expect, it } from 'vitest';
import {
  isFish,
  scoreRound,
  type GameState,
  type Move,
} from '../src/engine';
import { BASE, ONLY_CLOSES, playout } from './helpers';

/** Инварианты, которые обязаны держаться в любой момент партии. */
function checkInvariants(state: GameState): void {
  // Сохранение костей: 28 уникальных, каждая ровно в одном месте.
  const all = [
    ...state.hands[0],
    ...state.hands[1],
    ...state.boneyard,
    ...state.placed.map((p) => p.tile),
  ];
  expect(all).toHaveLength(28);
  expect(new Set(all).size).toBe(28);

  if (state.phase !== 'root') {
    // Арифметика концов (§13.1): прямо — 0, поворот — +1, поперёк — −1.
    const turns = state.placed.filter((p) => p.kind === 'turn').length;
    const crosses = state.placed.filter((p) => p.kind === 'cross').length;
    expect(state.ends.length).toBe(1 + turns - crosses);
  } else {
    expect(state.placed).toHaveLength(0);
    expect(state.ends).toHaveLength(0);
  }
}

function runMany(variant: typeof BASE, seeds: number[], label: string): void {
  const stats = {
    rounds: 0,
    fish: 0,
    out: 0,
    draws: 0,
    overlaps: 0,
    maxPlaced: 0,
    totalPlaced: 0,
    safetyFish: 0,
  };
  for (const seed of seeds) {
    let prevMove: Move | null = null;
    let prevPlayer: 0 | 1 | null = null;
    const final = playout(seed, (seed % 2) as 0 | 1, variant, (state, move) => {
      checkInvariants(state);
      // §8.1: не более одной кости из базара за ход. Добор либо завершает ход,
      // либо обязывает сходить — два добора подряд одним игроком невозможны.
      if (
        move.type === 'draw' &&
        prevMove?.type === 'draw' &&
        prevPlayer === state.current
      ) {
        throw new Error(`два добора подряд одним игроком (seed ${seed})`);
      }
      prevMove = move;
      prevPlayer = state.current;
    });
    checkInvariants(final);
    expect(final.phase).toBe('over');
    const result = final.result!;
    expect(result).not.toBeNull();

    // Итог согласован с руками.
    expect(result).toEqual(scoreRound(final.hands, result.cause));
    if (result.cause === 'out') {
      expect(final.hands[0].length === 0 || final.hands[1].length === 0).toBe(true);
      stats.out++;
    } else {
      expect(final.hands[0].length).toBeGreaterThan(0);
      expect(final.hands[1].length).toBeGreaterThan(0);
      expect(isFish(final)).toBe(true);
      stats.fish++;
      // Страховка в applyPass не должна срабатывать: рыба ловится после
      // выставления, а не после паса.
      const logKinds = final.log.map((l) => l.kind);
      const endIdx = logKinds.lastIndexOf('end');
      if (logKinds[endIdx - 1] === 'pass') stats.safetyFish++;
    }
    if (result.winner === null) stats.draws++;
    stats.overlaps += final.placed.filter((p) => p.overlap).length;
    stats.maxPlaced = Math.max(stats.maxPlaced, final.placed.length);
    stats.totalPlaced += final.placed.length;
    stats.rounds++;
  }
  expect(stats.safetyFish).toBe(0);
  // Перекладка веток (layout.ts) обязана разводить наложения: на этих сидах
  // решение существует всегда. Если ассерт упал после правок раскладки —
  // сначала проверить, не сломан ли перебор сторон.
  expect(stats.overlaps).toBe(0);
  // eslint-disable-next-line no-console
  console.log(
    `[${label}] партий=${stats.rounds} рыба=${stats.fish} выход=${stats.out} ` +
      `ничьих=${stats.draws} костей-в-среднем=${(stats.totalPlaced / stats.rounds).toFixed(1)} ` +
      `макс=${stats.maxPlaced} перекрытий-раскладки=${stats.overlaps}`,
  );
}

const SEEDS = Array.from({ length: 500 }, (_, i) => i * 7919 + 13);

describe('симуляция случайных партий', () => {
  it('базовые правила: 500 партий без нарушений инвариантов', () => {
    runMany(BASE, SEEDS, 'база');
  });

  it('вариант §11.1: 500 партий без нарушений инвариантов', () => {
    runMany(ONLY_CLOSES, SEEDS, '§11.1');
  });
});
