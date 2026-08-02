// Правила игры: перечисление легальных ходов и применение хода.
// Ссылки на параграфы — RULES.md.

import { fullSet, hasValue, isDouble, otherValue, type TileId } from './tiles';
import { nextInt, shuffle, type RngState } from './rng';
import {
  add,
  cellKey,
  DIR,
  perps,
  type End,
  type GameState,
  type LogEntry,
  type Move,
  type PlacedTile,
  type Variant,
  type Vec,
} from './state';
import { scoreRound } from './score';

// ---------------------------------------------------------------------------
// Начало партии

export interface NewRoundOptions {
  readonly seed: RngState;
  /** Первый игрок партии (§2.5). */
  readonly first: 0 | 1;
  readonly variant: Variant;
}

/** Раздача: перемешать 28 костей, по 7 в руки, 14 в базар (§2.3). */
export function newRound(opts: NewRoundOptions): GameState {
  const [deck, rng] = shuffle(fullSet(), opts.seed);
  const first = opts.first;
  const hands: [TileId[], TileId[]] = [[], []];
  hands[first] = deck.slice(0, 7);
  hands[(1 - first) as 0 | 1] = deck.slice(7, 14);
  return {
    phase: 'root',
    hands: [hands[0], hands[1]],
    boneyard: deck.slice(14),
    placed: [],
    ends: [],
    occupied: [],
    current: first,
    first,
    secondRevealed: false,
    mustPlay: null,
    rng,
    variant: opts.variant,
    nextEndId: 0,
    passStreak: 0,
    result: null,
    log: [],
  };
}

// ---------------------------------------------------------------------------
// Легальные ходы

/** Все легальные ходы текущего игрока. Пустой список только при phase='over'. */
export function legalMoves(state: GameState): Move[] {
  if (state.phase === 'over') return [];
  const hand = state.hands[state.current];

  if (state.phase === 'root') {
    // Обязан выставить корень, если дубль на руках (§5.2); если вытянул дубль —
    // обязан выставить именно его (§5.3).
    if (state.mustPlay !== null) {
      return [{ type: 'placeRoot', tile: state.mustPlay }];
    }
    const doubles = hand.filter(isDouble);
    if (doubles.length > 0) {
      return doubles.map((tile) => ({ type: 'placeRoot' as const, tile }));
    }
    return state.boneyard.length > 0 ? [{ type: 'draw' }] : [{ type: 'pass' }];
  }

  // Основная фаза. Вытянутая подходящая кость обязана быть сыграна (§8.2).
  const candidates = state.mustPlay !== null ? [state.mustPlay] : hand;
  const placements: Move[] = [];
  for (const tile of candidates) {
    placements.push(...placementsForTile(state, tile));
  }
  if (placements.length > 0) return placements;

  // Сходить нечем: тянуть, если базар не пуст (§8.2), иначе пас (§8.3).
  return state.boneyard.length > 0 ? [{ type: 'draw' }] : [{ type: 'pass' }];
}

/** Легальные выставления конкретной кости (§6–§7). */
export function placementsForTile(state: GameState, tile: TileId): Move[] {
  const moves: Move[] = [];
  const dbl = isDouble(tile);
  for (const end of state.ends) {
    if (!hasValue(tile, end.value)) continue;
    // Прямо: доступно всегда, в том числе на свежем конце (§6.4, §7.4).
    // В варианте §11.1 дубль прямо ставить нельзя.
    if (!(dbl && state.variant.doubleOnlyCloses)) {
      moves.push({ type: 'place', tile, endId: end.id, mode: 'straight' });
    }
    if (dbl) {
      // Поперёк: только соответствующий дубль (§7.3) и не на свежий конец (§7.4).
      if (!end.fresh) {
        moves.push({ type: 'place', tile, endId: end.id, mode: 'cross' });
      }
    } else if (!end.fresh) {
      // На поворот: не дубль (§7.2) и не на свежий конец (§6.4).
      moves.push({ type: 'place', tile, endId: end.id, mode: 'turn' });
    }
  }
  return moves;
}

// ---------------------------------------------------------------------------
// Применение хода

export function applyMove(state: GameState, move: Move): GameState {
  assertLegal(state, move);
  switch (move.type) {
    case 'placeRoot':
      return applyPlaceRoot(state, move.tile);
    case 'place':
      return applyPlace(state, move.tile, move.endId, move.mode);
    case 'draw':
      return applyDraw(state);
    case 'pass':
      return applyPass(state);
  }
}

/** Структурное равенство ходов: порядок ключей объекта не имеет значения. */
export function moveEquals(a: Move, b: Move): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case 'placeRoot':
      return a.tile === (b as Extract<Move, { type: 'placeRoot' }>).tile;
    case 'place': {
      const bb = b as Extract<Move, { type: 'place' }>;
      return a.tile === bb.tile && a.endId === bb.endId && a.mode === bb.mode;
    }
    default:
      return true;
  }
}

function assertLegal(state: GameState, move: Move): void {
  const legal = legalMoves(state);
  if (!legal.some((m) => moveEquals(m, move))) {
    throw new Error(`Нелегальный ход: ${JSON.stringify(move)} (фаза ${state.phase})`);
  }
}

/** Завершение хода: открыть руку второго (§3.3) и передать ход. */
function endTurn(state: GameState): GameState {
  // §3.3: рука второго открывается, как только завершён ход первого игрока —
  // любым способом. Самый ранний такой момент — конец первого хода партии.
  const secondRevealed = state.secondRevealed || state.current === state.first;
  return {
    ...state,
    secondRevealed,
    current: (1 - state.current) as 0 | 1,
    mustPlay: null,
  };
}

function removeFromHand(hand: readonly TileId[], tile: TileId): TileId[] {
  const i = hand.indexOf(tile);
  if (i < 0) throw new Error(`Кости ${tile} нет в руке`);
  return [...hand.slice(0, i), ...hand.slice(i + 1)];
}

function withHand(
  hands: readonly [readonly TileId[], readonly TileId[]],
  player: 0 | 1,
  hand: readonly TileId[],
): [readonly TileId[], readonly TileId[]] {
  return player === 0 ? [hand, hands[1]] : [hands[0], hand];
}

// --- Корень (§5, §6.2) ------------------------------------------------------

function applyPlaceRoot(state: GameState, tile: TileId): GameState {
  const v = Number(tile.split('-')[0]);
  // Корень рисуем поперёк оси роста (классическая стойка дубля), центр в (0,0).
  // Открытый конец один, растёт на восток (§6.2); западная сторона — тупик.
  const placedTile: PlacedTile = {
    tile,
    kind: 'root',
    cells: [
      { x: 0, y: -0.5 },
      { x: 0, y: 0.5 },
    ],
    values: [v, v],
    seq: 0,
    by: state.current,
  };
  const rootEnd: End = {
    id: 0,
    value: v,
    attach: { x: 1, y: 0 },
    dir: DIR.E,
    // fresh=false: поворот от корня разрешён (§6.6), а закрыть корень первой
    // костью нельзя физически — второй дубль этого числа не существует.
    fresh: false,
    fromSeq: 0,
  };
  const hand = removeFromHand(state.hands[state.current], tile);
  const next: GameState = {
    ...state,
    phase: 'main',
    hands: withHand(state.hands, state.current, hand),
    placed: [placedTile],
    ends: [rootEnd],
    occupied: [
      cellKey({ x: 0, y: -1 }),
      cellKey({ x: 0, y: 0 }),
      cellKey({ x: 0, y: 1 }),
    ],
    nextEndId: 1,
    passStreak: 0,
    log: [...state.log, { kind: 'root', player: state.current, tile }],
  };
  // Выход прямо на корне невозможен (рука перед этим не меньше 7 костей),
  // но проверка ничего не стоит и делает код единообразным.
  return finishPlacement(next);
}

// --- Выставление кости (§6–§7) ----------------------------------------------

export interface PlacementGeometry {
  readonly kind: 'straight' | 'turn' | 'cross';
  readonly cells: readonly [Vec, Vec];
  readonly values: readonly [number, number];
  readonly newEnds: readonly Omit<End, 'id'>[];
  /** Клетки, которые займёт кость (для cross — с консервативными боковыми). */
  readonly claimed: readonly Vec[];
}

/**
 * Геометрия выставления кости: где лягут половинки и какие концы возникнут.
 * Детерминирована по состоянию — UI использует её для «призраков» ходов,
 * applyMove кладёт кость ровно так же.
 */
export function placementGeometry(
  state: GameState,
  tile: TileId,
  endId: number,
  mode: 'straight' | 'turn' | 'cross',
): PlacementGeometry {
  const end = state.ends.find((e) => e.id === endId);
  if (!end) throw new Error(`Конец ${endId} не найден`);
  const occ = new Set(state.occupied);
  const A = end.attach;
  const d = end.dir;
  const seq = state.placed.length;

  if (mode === 'straight') {
    // Прямо (§6.3): соединяющая половинка закрывает старый конец,
    // свободная становится новым концом. Дубль прямо сохраняет число (§7.1).
    const w = otherValue(tile, end.value);
    const B = add(A, d);
    return {
      kind: 'straight',
      cells: [A, B],
      values: [end.value, w],
      newEnds: [
        { value: w, attach: add(A, d, 2), dir: d, fresh: false, fromSeq: seq },
      ],
      claimed: [A, B],
    };
  }
  if (mode === 'turn') {
    // На поворот (§6.3): развилка. Соединяющая половинка — в клетке A по ходу
    // ветки, свободная уходит вбок. Прямой конец сохраняет старое число и
    // направление, поворотный растёт под 90°. Оба конца развилки свежие (§6.4).
    const w = otherValue(tile, end.value);
    const s = chooseTurnSide(occ, A, d);
    const B = add(A, s);
    return {
      kind: 'turn',
      cells: [A, B],
      values: [end.value, w],
      newEnds: [
        { value: end.value, attach: add(A, d), dir: d, fresh: true, fromSeq: seq },
        { value: w, attach: add(A, s, 2), dir: s, fresh: true, fromSeq: seq },
      ],
      claimed: [A, B],
    };
  }
  // Поперёк (§7.1): дубль ложится поперёк ветки и закрывает её. Конец не
  // порождается. Боковые клетки блокируем консервативно: кость физически
  // перекрывает их наполовину.
  const [p] = perps(d);
  return {
    kind: 'cross',
    cells: [add(A, p, -0.5), add(A, p, 0.5)],
    values: [end.value, end.value],
    newEnds: [],
    claimed: [A, add(A, p), add(A, p, -1)],
  };
}

function applyPlace(
  state: GameState,
  tile: TileId,
  endId: number,
  mode: 'straight' | 'turn' | 'cross',
): GameState {
  const end = state.ends.find((e) => e.id === endId)!;
  const geo = placementGeometry(state, tile, endId, mode);
  const occ = new Set(state.occupied);
  const seq = state.placed.length;
  let nextEndId = state.nextEndId;

  let placedTile: PlacedTile = {
    tile,
    kind: geo.kind,
    cells: geo.cells,
    values: geo.values,
    seq,
    by: state.current,
  };
  const newEnds: End[] = geo.newEnds.map((e) => ({ ...e, id: nextEndId++ }));

  if (geo.claimed.some((c) => occ.has(cellKey(c)))) {
    placedTile = { ...placedTile, overlap: true };
  }
  for (const c of geo.claimed) occ.add(cellKey(c));

  const hand = removeFromHand(state.hands[state.current], tile);
  const next: GameState = {
    ...state,
    hands: withHand(state.hands, state.current, hand),
    placed: [...state.placed, placedTile],
    ends: [...state.ends.filter((e) => e.id !== endId), ...newEnds],
    occupied: [...occ],
    nextEndId,
    passStreak: 0,
    log: [
      ...state.log,
      { kind: 'place', player: state.current, tile, mode, endValue: end.value },
    ],
  };
  return finishPlacement(next);
}

/**
 * Выбор стороны для поворота. На правила не влияет (§6.3): выбираем сторону,
 * где больше свободного места, при равенстве — уводящую от центра фигуры.
 */
function chooseTurnSide(occ: ReadonlySet<string>, A: Vec, d: Vec): Vec {
  const [p1, p2] = perps(d);
  const run = (s: Vec): number => {
    let k = 0;
    for (let i = 1; i <= 6; i++) {
      if (occ.has(cellKey(add(A, s, i)))) break;
      k++;
    }
    return k;
  };
  const r1 = run(p1);
  const r2 = run(p2);
  if (r1 !== r2) return r1 > r2 ? p1 : p2;
  // Центроид занятых клеток: растём наружу.
  let cx = 0;
  let cy = 0;
  let n = 0;
  for (const key of occ) {
    const [x, y] = key.split(',').map(Number) as [number, number];
    cx += x;
    cy += y;
    n++;
  }
  if (n > 0) {
    cx /= n;
    cy /= n;
    const away1 = (A.x + p1.x - cx) * p1.x + (A.y + p1.y - cy) * p1.y;
    const away2 = (A.x + p2.x - cx) * p2.x + (A.y + p2.y - cy) * p2.y;
    if (away1 !== away2) return away1 > away2 ? p1 : p2;
  }
  return p1;
}

/** После любого выставления: выход (§9.2), затем рыба (§9.1), иначе ход дальше. */
function finishPlacement(state: GameState): GameState {
  if (state.hands[state.current].length === 0) {
    return endRound(state, 'out');
  }
  if (isFish(state)) {
    return endRound(state, 'fish');
  }
  return endTurn(state);
}

// --- Базар (§5.3, §8) --------------------------------------------------------

function applyDraw(state: GameState): GameState {
  const [idx, rng] = nextInt(state.rng, state.boneyard.length);
  const tile = state.boneyard[idx]!;
  const boneyard = state.boneyard.filter((_, i) => i !== idx);
  const hand = [...state.hands[state.current], tile];
  const base: GameState = {
    ...state,
    rng,
    boneyard,
    hands: withHand(state.hands, state.current, hand),
  };

  const playable =
    state.phase === 'root'
      ? isDouble(tile)
      : placementsForTile(base, tile).length > 0;

  const log: LogEntry = { kind: 'draw', player: state.current, tile, played: playable };
  if (playable) {
    // Вытянутая кость даёт ход — обязан сходить (§5.3, §8.2).
    return { ...base, mustPlay: tile, passStreak: 0, log: [...base.log, log] };
  }
  // Не помогла — остаётся в руке, ход переходит (§5.3, §8.2).
  return endTurn({ ...base, passStreak: 0, log: [...base.log, log] });
}

function applyPass(state: GameState): GameState {
  const passStreak = state.passStreak + 1;
  const log: LogEntry = { kind: 'pass', player: state.current };
  const next = endTurn({ ...state, passStreak, log: [...state.log, log] });
  // Страховка: два паса подряд при пустом базаре означают, что ни один игрок
  // не может сходить. По правилам это состояние — уже рыба, и оно должно было
  // быть поймано после последнего выставления; если сюда попали — фиксируем
  // рыбу, а симуляционные тесты считают такой исход ошибкой движка.
  if (next.phase === 'main' && passStreak >= 2 && next.boneyard.length === 0) {
    return endRound(next, 'fish');
  }
  return next;
}

// --- Завершение партии (§9, §10) ----------------------------------------------

/**
 * Рыба (§9.1): кость не может поставить никто — ни с рук, ни из базара.
 * Каждый открытый конец либо закрыт (закрытые концов не оставляют), либо мёртв.
 * Проверка честная, через легальность: учитывает свежие концы и вариант §11.1.
 */
export function isFish(state: GameState): boolean {
  if (state.phase === 'root') return false;
  const offTable = [...state.hands[0], ...state.hands[1], ...state.boneyard];
  for (const end of state.ends) {
    for (const tile of offTable) {
      if (!hasValue(tile, end.value)) continue;
      if (canPlaceOnEnd(state.variant, tile, end)) return false;
    }
  }
  return true;
}

function canPlaceOnEnd(variant: Variant, tile: TileId, end: End): boolean {
  if (isDouble(tile)) {
    if (!variant.doubleOnlyCloses) return true; // прямо можно всегда (§7.4)
    return !end.fresh; // §11.1: только поперёк, а поперёк на свежий нельзя
  }
  return true; // не дубль: прямо доступно всегда (§6.4 не запрещает прямо)
}

function endRound(state: GameState, cause: 'fish' | 'out'): GameState {
  const result = scoreRound(state.hands, cause);
  return {
    ...state,
    phase: 'over',
    // Рука второго к концу партии всегда открыта, но на случай мгновенной
    // рыбы на первом ходу — открываем явно.
    secondRevealed: true,
    result,
    log: [...state.log, { kind: 'end', cause }],
  };
}
