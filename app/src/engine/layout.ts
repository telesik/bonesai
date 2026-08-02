// Раскладка стола: где ложатся кости и как перекладывать ветки при наложениях.
// Всё в этом модуле — про геометрию, не про правила: легальность ходов от
// раскладки не зависит (§6.3). Геометрия детерминирована по состоянию, поэтому
// протокол воспроизводит стол один в один, включая перекладки.

import { otherValue, type TileId } from './tiles';
import {
  add,
  cellKey,
  DIR,
  perps,
  type End,
  type GameState,
  type Move,
  type Vec,
} from './state';

// --- Корень (§6.2) -----------------------------------------------------------

/** Клетки корня: горизонтально, тупик слева, рост на восток. */
export const ROOT_CELLS: readonly [Vec, Vec] = [
  { x: -1, y: 0 },
  { x: 0, y: 0 },
];

/** Единственный конец корня. fresh=false: поворот от корня разрешён (§6.6). */
export function rootEnd(value: number): End {
  return { id: 0, value, attach: { x: 1, y: 0 }, dir: DIR.E, fresh: false, fromSeq: 0 };
}

// --- Геометрия одного выставления (§6–§7) ------------------------------------

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
 * applyMove кладёт кость ровно так же. side — выбранная игроком сторона
 * поворота; без неё сторона выбирается автоматически по свободному месту.
 */
export function placementGeometry(
  state: Pick<GameState, 'ends' | 'occupied' | 'placed'>,
  tile: TileId,
  endId: number,
  mode: 'straight' | 'turn' | 'cross',
  side?: 0 | 1,
): PlacementGeometry {
  const end = state.ends.find((e) => e.id === endId);
  if (!end) throw new Error(`Конец ${endId} не найден`);
  return geometryCore(end, new Set(state.occupied), tile, mode, state.placed.length, side);
}

function geometryCore(
  end: End,
  occ: ReadonlySet<string>,
  tile: TileId,
  mode: 'straight' | 'turn' | 'cross',
  seq: number,
  side?: 0 | 1,
): PlacementGeometry {
  const A = end.attach;
  const d = end.dir;

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
    const s = side !== undefined ? perps(d)[side] : perps(d)[turnSideIndex(occ, A, d)];
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

/**
 * Автовыбор стороны поворота: где больше свободного места, при равенстве —
 * сторона, уводящая от центра фигуры. Возвращает индекс в perps(dir).
 */
export function turnSideIndex(occ: ReadonlySet<string>, A: Vec, d: Vec): 0 | 1 {
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
  if (r1 !== r2) return r1 > r2 ? 0 : 1;
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
    if (away1 !== away2) return away1 > away2 ? 0 : 1;
  }
  return 0;
}

// --- Перекладка веток при наложении ------------------------------------------

type PlaceMove = Extract<Move, { type: 'place' } | { type: 'placeRoot' }>;

interface SimState {
  ends: Map<number, End>;
  occ: Set<string>;
  nextEndId: number;
  cells: Array<readonly [Vec, Vec]>;
}

export interface LayoutResult {
  readonly cells: ReadonlyArray<readonly [Vec, Vec]>;
  readonly ends: readonly End[];
  readonly occupied: readonly string[];
}

export interface SimulateOptions {
  /**
   * Сторона последнего поворота (если записана в ходе) — жёсткое условие:
   * игрок только что выбрал её кликом, флипуются старые повороты, а не она.
   */
  readonly hardLastSide?: boolean;
  /** Для тестов: все записанные стороны жёсткие, перебор запрещён. */
  readonly respectAllSides?: boolean;
  /**
   * Требовать свободные клетки роста у всех открытых концов: ветка,
   * упёршаяся хвостом в другую, — повод для перекладки, как и наложение.
   */
  readonly requireFreeEnds?: boolean;
  /**
   * Соль ручной перекладки: меняет порядок перебора сторон, давая другие
   * валидные раскладки. 0 — обычный порядок (записанная/автосторона первой).
   */
  readonly salt?: number;
}

/**
 * Разложить последовательность выставлений без наложений, перебирая стороны
 * поворотов (записанная в ходе или автовыбранная сторона пробуется первой).
 * Возвращает null, если раскладки без наложений нет или перебор превысил бюджет.
 */
export function simulateLayout(
  moves: readonly PlaceMove[],
  opts: SimulateOptions = {},
): LayoutResult | null {
  if (moves.length === 0 || moves[0]!.type !== 'placeRoot') return null;
  const lastIdx = moves.length - 1;
  let budget = 20000;

  const clone = (s: SimState): SimState => ({
    ends: new Map(s.ends),
    occ: new Set(s.occ),
    nextEndId: s.nextEndId,
    cells: [...s.cells],
  });

  /** Применить шаг к копии sim; null — наложение или несовместимая история. */
  const step = (sim: SimState, i: number, side: 0 | 1 | undefined): SimState | null => {
    const m = moves[i]!;
    if (m.type === 'placeRoot') {
      if (ROOT_CELLS.some((c) => sim.occ.has(cellKey(c)))) return null;
      sim.cells.push(ROOT_CELLS);
      for (const c of ROOT_CELLS) sim.occ.add(cellKey(c));
      sim.ends.set(0, rootEnd(Number(m.tile.split('-')[0])));
      sim.nextEndId = 1;
      return sim;
    }
    const end = sim.ends.get(m.endId);
    if (!end) return null;
    const geo = geometryCore(end, sim.occ, m.tile, m.mode, i, side);
    if (geo.claimed.some((c) => sim.occ.has(cellKey(c)))) return null;
    sim.cells.push(geo.cells);
    for (const c of geo.claimed) sim.occ.add(cellKey(c));
    sim.ends.delete(m.endId);
    for (const e of geo.newEnds) sim.ends.set(sim.nextEndId++, { ...e, id: sim.nextEndId - 1 });
    return sim;
  };

  /** Финальная проверка раскладки: у каждого конца свободна клетка роста. */
  const endsFree = (sim: SimState): boolean => {
    for (const e of sim.ends.values()) {
      if (sim.occ.has(cellKey(e.attach))) return false;
    }
    return true;
  };

  const dfs = (i: number, sim: SimState): SimState | null => {
    if (i > lastIdx) return opts.requireFreeEnds && !endsFree(sim) ? null : sim;
    if (--budget < 0) throw budgetExceeded;
    const m = moves[i]!;
    let options: ReadonlyArray<0 | 1 | undefined>;
    if (m.type === 'placeRoot' || m.mode !== 'turn') {
      options = [undefined];
    } else {
      const end = sim.ends.get(m.endId);
      if (!end) return null;
      let pref = m.side ?? turnSideIndex(sim.occ, end.attach, end.dir);
      // Соль ручной перекладки: у части поворотов предпочтение флипается —
      // разные соли дают разные, но детерминированные раскладки.
      if (opts.salt) {
        let h = Math.imul((opts.salt << 5) ^ (i + 1), 0x9e3779b9) >>> 0;
        h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
        if (h & 1) pref = (1 - pref) as 0 | 1;
      }
      const fixed =
        opts.respectAllSides === true ||
        (opts.hardLastSide === true && i === lastIdx && m.side !== undefined);
      options = fixed ? [pref] : [pref, (1 - pref) as 0 | 1];
    }
    for (const side of options) {
      const next = step(clone(sim), i, side);
      if (!next) continue;
      const done = dfs(i + 1, next);
      if (done) return done;
    }
    return null;
  };

  try {
    const res = dfs(0, { ends: new Map(), occ: new Set(), nextEndId: 0, cells: [] });
    if (!res) return null;
    return { cells: res.cells, ends: [...res.ends.values()], occupied: [...res.occ] };
  } catch (e) {
    if (e === budgetExceeded) return null;
    throw e;
  }
}

const budgetExceeded = Symbol('layout-budget');

/** Есть ли конец, упёршийся клеткой роста в занятую клетку. */
export function hasBlockedEnd(state: GameState): boolean {
  const occ = new Set(state.occupied);
  return state.ends.some((e) => occ.has(cellKey(e.attach)));
}

/** Ходы выставлений из истории, согласованные с выложенными костями. */
function extractPlaceMoves(state: GameState): PlaceMove[] | null {
  const placeMoves = state.history.filter(
    (m): m is PlaceMove => m.type === 'place' || m.type === 'placeRoot',
  );
  if (placeMoves.length !== state.placed.length) return null;
  if (placeMoves.some((m, i) => m.tile !== state.placed[i]!.tile)) return null;
  return placeMoves;
}

/** Применить найденную раскладку с защитной проверкой топологии концов. */
function applyLayout(state: GameState, res: LayoutResult): GameState | null {
  const byId = new Map(res.ends.map((e) => [e.id, e]));
  const consistent =
    res.ends.length === state.ends.length &&
    state.ends.every((e) => {
      const n = byId.get(e.id);
      return !!n && n.value === e.value && n.fresh === e.fresh && n.fromSeq === e.fromSeq;
    });
  if (!consistent) return null;
  return {
    ...state,
    placed: state.placed.map((p, i) => {
      const { overlap: _drop, ...rest } = p;
      return { ...rest, cells: res.cells[i]! };
    }),
    ends: state.ends.map((e) => {
      const n = byId.get(e.id)!;
      return { ...e, attach: n.attach, dir: n.dir };
    }),
    occupied: res.occupied,
  };
}

/**
 * Перекладка стола: топология и правила не меняются (§6.3), меняются только
 * стороны поворотов. Повод — наложение костей или ветка, упёршаяся хвостом
 * в другую. Сначала ищем раскладку без наложений и со свободными концами;
 * при наложении согласны и на раскладку без наложений с упёршимися концами.
 * Если ничего не нашлось (или история не согласована) — состояние как есть:
 * кость остаётся «приподнятой», игра не ломается.
 */
export function resolveOverlaps(state: GameState): GameState {
  const overlapping = state.placed.some((p) => p.overlap);
  if (!overlapping && !hasBlockedEnd(state)) return state;
  const placeMoves = extractPlaceMoves(state);
  if (!placeMoves) return state;

  const res =
    simulateLayout(placeMoves, { hardLastSide: true, requireFreeEnds: true }) ??
    (overlapping ? simulateLayout(placeMoves, { hardLastSide: true }) : null) ??
    (overlapping ? simulateLayout(placeMoves) : null);
  if (!res) return state;
  return applyLayout(state, res) ?? state;
}

/**
 * Ручная перекладка (кнопка в UI): найти другую валидную раскладку того же
 * дерева. salt задаёт вариант; возвращает null, если другой раскладки нет.
 * Меняет только геометрию — реплей по протоколу строит каноническую
 * раскладку, это осознанно (§6.3: раскладка правилам безразлична).
 */
export function shuffleLayout(state: GameState, salt: number): GameState | null {
  const placeMoves = extractPlaceMoves(state);
  if (!placeMoves) return null;
  const currentKey = JSON.stringify(state.placed.map((p) => p.cells));
  for (let k = 0; k < 8; k++) {
    const s = ((salt + k) % 1024) + 1;
    const res =
      simulateLayout(placeMoves, { requireFreeEnds: true, salt: s }) ??
      simulateLayout(placeMoves, { salt: s });
    if (!res) continue;
    if (JSON.stringify(res.cells) === currentKey) continue;
    const next = applyLayout(state, res);
    if (next) return next;
  }
  return null;
}
