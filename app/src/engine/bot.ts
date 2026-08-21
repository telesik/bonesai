// Бот: выбор хода перебором. Руки в Bonesai открыты (§3), скрыт только
// порядок добора, а состав базара известен обоим (28 костей минус руки и
// стол). Поэтому перебор честный: max/min по ходам обоих игроков, а добор —
// узел случайности с равновероятными костями базара.
//
// Единственное исключение — самый первый ход партии: рука второго игрока
// скрыта до конца первого хода первого (§3.2–3.3). Если бот первый и выбирает
// корень из нескольких дублей, он обязан не заглядывать в state.hands
// соперника — выбор делается эвристикой только по собственной руке.
//
// ВАЖНО: перебор не трогает RNG состояния и не подсматривает его — реальный
// добор в игре останется честным розыгрышем движка. Перекладка веток в
// переборе выключена (applyMoveTrusted(..., false)): раскладка на правила
// не влияет (§6.3). Оценка терминала знает про матч (§10.5): решающая партия
// перевешивает разницу очков.

import { applyMoveTrusted, legalMoves, placementsForTile } from './rules';
import { hasValue, isDouble, type TileId } from './tiles';
import { handSum, scoreRound } from './score';
import { matchTarget, type GameState, type Move } from './state';

export type BotLevel = 'easy' | 'normal' | 'strong';

export interface BotOptions {
  readonly level?: BotLevel;
  /** Тоталы матча до этой партии — для оценки решающих партий (§10.5). */
  readonly totals?: readonly [number, number];
}

interface LevelCfg {
  readonly depth: number;
  readonly budget: number;
  /** Разброс «почти равных» ходов, из которых лёгкий бот выбирает случайно. */
  readonly slack: number;
}

const LEVELS: Record<BotLevel, LevelCfg> = {
  easy: { depth: 1, budget: 2_000, slack: 4 },
  normal: { depth: 3, budget: 40_000, slack: 0 },
  strong: { depth: 5, budget: 160_000, slack: 0 },
};

const WIN = 1_000; // решающая партия матча
const TERMINAL_SCALE = 10; // очки партии весомее позиционных термов

/** Выбрать ход за текущего игрока состояния. Детерминирован по состоянию. */
export function chooseBotMove(state: GameState, opts: BotOptions = {}): Move {
  const cfg = LEVELS[opts.level ?? 'normal'];
  const moves = legalMoves(state);
  if (moves.length === 0) throw new Error('Нет легальных ходов');
  if (moves.length === 1) return moves[0]!;

  const me = state.current;
  const totals = opts.totals ?? [0, 0];
  const ctx: Ctx = { me, totals, target: matchTarget(state.variant), budget: cfg.budget };

  // Честность §3.2–3.3: рука соперника ещё закрыта — выбор корня из
  // нескольких дублей делаем только по собственной руке, без перебора.
  if (state.phase === 'root' && !state.secondRevealed) {
    return chooseRootBlind(state, moves);
  }

  // Единственные draw/pass покрыты выше: при наличии выставлений движок их
  // не предлагает, так что здесь все ходы — placeRoot/place.
  const scored = moves.map((m, i) => {
    const child = applyMoveTrusted(state, m, false);
    const v = search(child, cfg.depth - 1, -Infinity, Infinity, ctx);
    return { m, v, i };
  });

  let best = scored[0]!;
  for (const s of scored) if (s.v > best.v) best = s;

  if (cfg.slack > 0) {
    // Лёгкий уровень: случайный (но детерминированный по состоянию) выбор
    // среди почти равных ходов — игра выглядит живее и прощает соперника.
    const near = scored.filter((s) => s.v >= best.v - cfg.slack);
    return near[hashInt(state, near.length)]!.m;
  }
  // Детерминированный тай-брейк среди строго равных.
  const top = scored.filter((s) => s.v === best.v);
  return top[hashInt(state, top.length)]!.m;
}

interface Ctx {
  readonly me: 0 | 1;
  readonly totals: readonly [number, number];
  /** Цель матча (§10.5) — константа поиска, как и totals. */
  readonly target: number;
  budget: number;
}

/**
 * Выбор корня вслепую (§3.2–3.3): рука соперника закрыта, смотреть можно
 * только в свою. Сбрасываем тяжёлый дубль, за которым стоит поддержка —
 * другие кости с тем же числом, чтобы было чем продолжать.
 */
function chooseRootBlind(state: GameState, moves: readonly Move[]): Move {
  const hand = state.hands[state.current];
  let best = moves[0]!;
  let bestScore = -Infinity;
  for (const m of moves) {
    if (m.type !== 'placeRoot') continue;
    const v = Number(m.tile.split('-')[0]);
    const support = hand.filter((t) => t !== m.tile && hasValue(t, v)).length;
    const score = support * 3 + v * 2;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

/** Значение состояния для ctx.me: чем больше, тем лучше боту. */
function search(state: GameState, depth: number, alpha: number, beta: number, ctx: Ctx): number {
  if (state.phase === 'over') return terminalValue(state, ctx);
  if (depth <= 0 || --ctx.budget <= 0) return evalStatic(state, ctx.me);

  const moves = legalMoves(state);
  const only = moves.length === 1 ? moves[0]! : null;
  if (only && only.type === 'draw') return chanceDraw(state, depth, ctx);
  if (only && only.type === 'pass') {
    return search(applyMoveTrusted(state, only, false), depth - 1, alpha, beta, ctx);
  }

  // Выставления: обычный max/min с отсечением.
  const maximizing = state.current === ctx.me;
  let children = moves.map((m) => applyMoveTrusted(state, m, false));
  if (children.length > 4 && depth >= 3) {
    // Порядок по мелкой оценке — отсечению легче.
    const keyed = children.map((c) => ({ c, e: evalStatic(c, ctx.me) }));
    keyed.sort((a, b) => (maximizing ? b.e - a.e : a.e - b.e));
    children = keyed.map((k) => k.c);
  }

  let best = maximizing ? -Infinity : Infinity;
  for (const child of children) {
    const v = search(child, depth - 1, alpha, beta, ctx);
    if (maximizing) {
      if (v > best) best = v;
      if (best > alpha) alpha = best;
    } else {
      if (v < best) best = v;
      if (best < beta) beta = best;
    }
    if (alpha >= beta) break;
  }
  return best;
}

/**
 * Узел случайности: добор из базара. Все кости равновероятны; каждая либо
 * обязана быть сыграна (mustPlay), либо остаётся в руке и ход переходит.
 * Глубина падает на 2: случайный слой «съедает» темп и бюджет.
 */
function chanceDraw(state: GameState, depth: number, ctx: Ctx): number {
  if (state.boneyard.length === 0) return evalStatic(state, ctx.me);
  let sum = 0;
  for (const tile of state.boneyard) {
    const child = afterDraw(state, tile);
    sum += depth <= 2 ? evalStatic(child, ctx.me) : search(child, depth - 2, -Infinity, Infinity, ctx);
  }
  return sum / state.boneyard.length;
}

/**
 * Гипотетический добор конкретной кости — зеркало applyDraw без RNG и
 * журнала: перебору нужны только руки, базар, mustPlay и очередь хода.
 */
function afterDraw(state: GameState, tile: TileId): GameState {
  const boneyard = state.boneyard.filter((t) => t !== tile);
  const hand = [...state.hands[state.current], tile];
  const hands: [readonly TileId[], readonly TileId[]] =
    state.current === 0 ? [hand, state.hands[1]] : [state.hands[0], hand];
  const base: GameState = { ...state, boneyard, hands };
  const playable =
    state.phase === 'root' ? isDouble(tile) : placementsForTile(base, tile).length > 0;
  if (playable) return { ...base, mustPlay: tile };
  return {
    ...base,
    mustPlay: null,
    current: (1 - state.current) as 0 | 1,
    secondRevealed: state.secondRevealed || state.current === state.first,
  };
}

/** Терминал: очки партии (§10.3) и решающие партии матча (§10.5). */
function terminalValue(state: GameState, ctx: Ctx): number {
  const result = state.result ?? scoreRound(state.hands, 'fish');
  const me = ctx.me;
  const opp = (1 - me) as 0 | 1;
  let v = (result.added[opp]! - result.added[me]!) * TERMINAL_SCALE;
  const tMe = ctx.totals[me]! + result.added[me]!;
  const tOpp = ctx.totals[opp]! + result.added[opp]!;
  if (tMe >= ctx.target || tOpp >= ctx.target) {
    if (tOpp > tMe) v += WIN;
    else if (tMe > tOpp) v -= WIN;
  }
  return v;
}

/**
 * Позиционная оценка для ctx.me (в «пипсах»): сбрасывать тяжёлое, держать
 * руку короче и подвижнее соперника. handSum знает особую цену 0:0 (§10.2).
 */
function evalStatic(state: GameState, me: 0 | 1): number {
  const opp = (1 - me) as 0 | 1;
  const my = state.hands[me];
  const their = state.hands[opp];
  const sumDiff = handSum(their) - handSum(my);
  const countDiff = (their.length - my.length) * 4;
  const mobility =
    state.phase === 'main'
      ? (playableCount(state, my) - playableCount(state, their)) * 2
      : 0;
  return sumDiff + countDiff + mobility;
}

function playableCount(state: GameState, hand: readonly TileId[]): number {
  let n = 0;
  for (const t of hand) if (placementsForTile(state, t).length > 0) n++;
  return n;
}

/** Детерминированный «случайный» индекс из состояния — для тай-брейков. */
function hashInt(state: GameState, mod: number): number {
  let h = (state.rng ^ Math.imul(state.history.length + 1, 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  return (h >>> 8) % mod;
}
