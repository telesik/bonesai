// Подсчёт очков партии (§10).

import { pipSum, type TileId } from './tiles';
import type { RoundEndCause, RoundResult } from './state';

/** Сумма очков на руке. Особая цена 0:0: единственная кость на руке — 25 (§10.2). */
export function handSum(hand: readonly TileId[]): number {
  if (hand.length === 1 && hand[0] === '0-0') return 25;
  return hand.reduce((acc, t) => acc + pipSum(t), 0);
}

/**
 * Итог партии (§10.3–10.4): очки не начисляются только тому, у кого сумма
 * строго меньше; при равных суммах прибавляют оба, победителя нет.
 */
export function scoreRound(
  hands: readonly [readonly TileId[], readonly TileId[]],
  cause: RoundEndCause,
): RoundResult {
  const s0 = handSum(hands[0]);
  const s1 = handSum(hands[1]);
  if (s0 < s1) {
    return { cause, sums: [s0, s1], added: [0, s1], winner: 0 };
  }
  if (s1 < s0) {
    return { cause, sums: [s0, s1], added: [s0, 0], winner: 1 };
  }
  return { cause, sums: [s0, s1], added: [s0, s1], winner: null };
}
