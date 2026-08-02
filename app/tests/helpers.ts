// Помощники для тестов: ручная сборка состояний и разыгрывание партий.

import {
  applyMove,
  cellKey,
  DIR,
  legalMoves,
  newRound,
  type End,
  type GameState,
  type Move,
  type TileId,
  type Variant,
} from '../src/engine';

export const BASE: Variant = { doubleOnlyCloses: false };
export const ONLY_CLOSES: Variant = { doubleOnlyCloses: true };

/** Собрать состояние основной фазы вручную. Раскладка минимальная, но валидная. */
export function makeState(opts: {
  hands: [TileId[], TileId[]];
  boneyard?: TileId[];
  ends?: Partial<End>[];
  current?: 0 | 1;
  first?: 0 | 1;
  variant?: Variant;
  placedCount?: number;
}): GameState {
  const ends: End[] = (opts.ends ?? []).map((e, i) => ({
    id: e.id ?? i,
    value: e.value ?? 0,
    attach: e.attach ?? { x: 3 + 4 * i, y: 0 },
    dir: e.dir ?? DIR.E,
    fresh: e.fresh ?? false,
    fromSeq: e.fromSeq ?? 0,
  }));
  // Фиктивные выложенные кости не нужны тестам правил; important — руки/базар/концы.
  return {
    phase: 'main',
    hands: opts.hands,
    boneyard: opts.boneyard ?? [],
    placed: [],
    ends,
    occupied: [cellKey({ x: 0, y: 0 })],
    current: opts.current ?? 0,
    first: opts.first ?? 0,
    seed: 12345,
    history: [],
    secondRevealed: true,
    mustPlay: null,
    rng: 12345,
    variant: opts.variant ?? BASE,
    nextEndId: ends.length,
    passStreak: 0,
    result: null,
    log: [],
  };
}

/** Разыграть партию случайной политикой до конца. Детерминировано по seed. */
export function playout(
  seed: number,
  first: 0 | 1,
  variant: Variant,
  onStep?: (state: GameState, move: Move) => void,
): GameState {
  let state = newRound({ seed, first, variant });
  let rng = (seed ^ 0x9e3779b9) >>> 0;
  const rand = () => {
    // Отдельный маленький PRNG для выбора политики, чтобы не трогать rng движка.
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng / 4294967296;
  };
  let guard = 0;
  while (state.phase !== 'over') {
    if (++guard > 1000) {
      throw new Error('Партия не завершилась за 1000 ходов');
    }
    const moves = legalMoves(state);
    if (moves.length === 0) {
      throw new Error(`Нет легальных ходов в фазе ${state.phase}`);
    }
    const move = moves[Math.floor(rand() * moves.length)]!;
    onStep?.(state, move);
    state = applyMove(state, move);
  }
  return state;
}
