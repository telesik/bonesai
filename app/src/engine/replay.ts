// Протокол ходов и воспроизведение партий.
//
// Партия полностью определяется тройкой (seed, first, variant) и списком
// ходов: раздача и каждый добор из базара воспроизводятся детерминированно,
// потому что RNG-цепочка стартует с того же seed. Это основа для разбора
// багов, режима истории в UI, а в перспективе — бота и онлайна.

import type { RngState } from './rng';
import { applyMove, newRound } from './rules';
import type { GameState, Move, RoundResult, Variant } from './state';
import type { MatchState } from './match';

export interface RoundProtocol {
  readonly seed: RngState;
  readonly first: 0 | 1;
  readonly moves: readonly Move[];
  /** Итог партии, если она завершена — только для отображения. */
  readonly result?: RoundResult;
}

export interface MatchProtocol {
  readonly format: 'bonesai-protocol';
  readonly v: 1;
  readonly names: readonly [string, string];
  readonly variant: Variant;
  readonly rounds: readonly RoundProtocol[];
  readonly totals?: readonly [number, number];
}

/** Собрать протокол матча: завершённые партии плюс текущая (если она идёт). */
export function matchProtocol(match: MatchState): MatchProtocol {
  const rounds: RoundProtocol[] = match.rounds.map((r) => ({
    seed: r.seed,
    first: r.first,
    moves: r.moves,
    result: { cause: r.cause, sums: r.sums, added: r.added, winner: r.winner },
  }));
  const cur = match.round;
  if (cur.phase !== 'over') {
    rounds.push({ seed: cur.seed, first: cur.first, moves: cur.history });
  }
  return {
    format: 'bonesai-protocol',
    v: 1,
    names: match.names,
    variant: match.variant,
    rounds,
    totals: match.totals,
  };
}

/**
 * Воспроизвести партию по протоколу: первые upTo ходов (по умолчанию все).
 * Бросает исключение, если какой-то ход нелегален — так протокол проверяется
 * самим движком.
 */
export function replayRound(
  p: RoundProtocol,
  variant: Variant,
  upTo?: number,
): GameState {
  let state = newRound({ seed: p.seed, first: p.first, variant });
  const n = upTo === undefined ? p.moves.length : Math.min(upTo, p.moves.length);
  for (let i = 0; i < n; i++) {
    try {
      state = applyMove(state, p.moves[i]!);
    } catch (err) {
      throw new Error(`ход ${i + 1}: ${(err as Error).message}`);
    }
  }
  return state;
}

export type ProtocolCheck =
  | { readonly ok: true }
  | { readonly ok: false; readonly round: number; readonly error: string };

/** Проверить весь протокол воспроизведением через движок. */
export function validateProtocol(p: MatchProtocol): ProtocolCheck {
  for (let i = 0; i < p.rounds.length; i++) {
    try {
      replayRound(p.rounds[i]!, p.variant);
    } catch (err) {
      return { ok: false, round: i, error: (err as Error).message };
    }
  }
  return { ok: true };
}
