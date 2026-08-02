// Матч — серия партий до 100 очков (§10.5).

import { seedFromCrypto, type RngState } from './rng';
import { newRound } from './rules';
import type { GameState, Move, RoundResult, Variant } from './state';

export interface FinishedRound extends RoundResult {
  /** Кто был первым игроком в этой партии. */
  readonly first: 0 | 1;
  /** Начальный seed партии — для воспроизведения по протоколу. */
  readonly seed: RngState;
  /** Протокол партии: все ходы по порядку. */
  readonly moves: readonly Move[];
}

export type MatchOutcome =
  | { readonly kind: 'loss'; readonly loser: 0 | 1 }
  | { readonly kind: 'draw' };

export interface MatchState {
  readonly names: readonly [string, string];
  readonly totals: readonly [number, number];
  readonly rounds: readonly FinishedRound[];
  readonly variant: Variant;
  /** Первый игрок текущей партии. */
  readonly first: 0 | 1;
  readonly round: GameState;
  readonly outcome: MatchOutcome | null;
}

export interface StartMatchOptions {
  readonly names: readonly [string, string];
  /** Кому выпал жребий первого хода (§2.5). */
  readonly first: 0 | 1;
  readonly variant: Variant;
  readonly seed?: RngState;
}

export function startMatch(opts: StartMatchOptions): MatchState {
  const seed = opts.seed ?? seedFromCrypto();
  return {
    names: opts.names,
    totals: [0, 0],
    rounds: [],
    variant: opts.variant,
    first: opts.first,
    round: newRound({ seed, first: opts.first, variant: opts.variant }),
    outcome: null,
  };
}

/**
 * Принять результат завершённой партии: прибавить очки (§10.3),
 * проверить конец матча (§10.5).
 */
export function finishRound(match: MatchState): MatchState {
  const result = match.round.result;
  if (!result) throw new Error('Партия ещё не завершена');
  const totals: [number, number] = [
    match.totals[0] + result.added[0],
    match.totals[1] + result.added[1],
  ];
  const rounds = [
    ...match.rounds,
    { ...result, first: match.first, seed: match.round.seed, moves: match.round.history },
  ];
  let outcome: MatchOutcome | null = null;
  if (totals[0] >= 100 || totals[1] >= 100) {
    outcome =
      totals[0] === totals[1]
        ? { kind: 'draw' }
        : { kind: 'loss', loser: totals[0] > totals[1] ? 0 : 1 };
  }
  return { ...match, totals, rounds, outcome };
}

/**
 * Начать следующую партию: первым ходит победитель предыдущей,
 * при ничьей игроки меняются ролями (§2.5).
 */
export function nextRound(match: MatchState, seed?: RngState): MatchState {
  const last = match.rounds[match.rounds.length - 1];
  if (!last) throw new Error('Нет завершённых партий');
  if (match.outcome) throw new Error('Матч окончен');
  const first = last.winner !== null ? last.winner : ((1 - last.first) as 0 | 1);
  return {
    ...match,
    first,
    round: newRound({
      seed: seed ?? seedFromCrypto(),
      first,
      variant: match.variant,
    }),
  };
}
