// Типы состояния партии. Состояние полностью сериализуемо (JSON):
// это пригодится и боту (поиск по копиям состояния), и онлайну (синхронизация).
//
// Геометрия стола хранится прямо в состоянии, но на легальность ходов не влияет:
// правила топологические (§6.3 — как класть кость на стол, правилам безразлично).
// Клетка сетки = половинка кости. Кость занимает две клетки.

import type { TileId } from './tiles';
import type { RngState } from './rng';

export interface Vec {
  readonly x: number;
  readonly y: number;
}

export type PlaceKind = 'root' | 'straight' | 'turn' | 'cross';

export interface PlacedTile {
  readonly tile: TileId;
  readonly kind: PlaceKind;
  /**
   * Клетки половинок: [соединяющая (ближняя к предыдущей кости), свободная].
   * Для root и cross половинки лежат поперёк оси ветки со сдвигом ±0.5 —
   * координаты дробные, рендер использует их как есть.
   */
  readonly cells: readonly [Vec, Vec];
  /** Числа половинок в том же порядке, что и cells. */
  readonly values: readonly [number, number];
  /** Порядковый номер выкладывания, начиная с 0 (корень). */
  readonly seq: number;
  /** Игрок, выложивший кость. */
  readonly by: 0 | 1;
  /**
   * Кость легла на уже занятые клетки. Правилам это не мешает (они
   * топологические), рендер приподнимает такую кость с тенью. Случай редкий:
   * две ветки выросли навстречу друг другу.
   */
  readonly overlap?: boolean;
}

export interface End {
  readonly id: number;
  /** Открытое число конца (§1). */
  readonly value: number;
  /** Клетка, куда ляжет соединяющая половинка следующей кости. */
  readonly attach: Vec;
  /** Направление роста ветки. */
  readonly dir: Vec;
  /**
   * Свежий конец развилки (§6.4): первую кость можно ставить только прямо.
   * Конец корня хранится с fresh=false — поворот от корня разрешён (§6.6),
   * а закрытие корня первой костью невозможно физически: второго такого дубля нет.
   */
  readonly fresh: boolean;
  /** seq кости, из которой конец растёт (для подсветки в UI). */
  readonly fromSeq: number;
}

export type Phase = 'root' | 'main' | 'over';

export type RoundEndCause = 'fish' | 'out';

export interface RoundResult {
  readonly cause: RoundEndCause;
  /** Суммы очков на руках, с учётом особой цены 0:0 (§10.1–10.2). */
  readonly sums: readonly [number, number];
  /** Сколько прибавлено к общему счёту каждого (§10.3). */
  readonly added: readonly [number, number];
  /** Победитель партии (§10.4); null — ничья. */
  readonly winner: 0 | 1 | null;
}

export type LogEntry =
  | { readonly kind: 'root'; readonly player: 0 | 1; readonly tile: TileId }
  | {
      readonly kind: 'place';
      readonly player: 0 | 1;
      readonly tile: TileId;
      readonly mode: 'straight' | 'turn' | 'cross';
      readonly endValue: number;
    }
  | { readonly kind: 'draw'; readonly player: 0 | 1; readonly tile: TileId; readonly played: boolean }
  | { readonly kind: 'pass'; readonly player: 0 | 1 }
  | { readonly kind: 'end'; readonly cause: RoundEndCause };

export interface Variant {
  /** §11.1 «Дубль только закрывает»: дубль нельзя ставить прямо. */
  readonly doubleOnlyCloses: boolean;
}

export interface GameState {
  readonly phase: Phase;
  /** Руки игроков; индексы 0/1 — постоянные на весь матч. */
  readonly hands: readonly [readonly TileId[], readonly TileId[]];
  /** Базар. Порядок значения не имеет: добор — равномерный случайный выбор. */
  readonly boneyard: readonly TileId[];
  readonly placed: readonly PlacedTile[];
  /** Открытые концы. Закрытые (§7.1 поперёк) концов не оставляют. */
  readonly ends: readonly End[];
  /** Занятые клетки сетки, ключи "x,y" — только для раскладки, не для правил. */
  readonly occupied: readonly string[];
  readonly current: 0 | 1;
  /** Первый игрок этой партии (§2.2). */
  readonly first: 0 | 1;
  /** Открыл ли второй игрок руку (§3.3). */
  readonly secondRevealed: boolean;
  /** Вытянутая кость, которой игрок обязан сходить (§5.3, §8.2). */
  readonly mustPlay: TileId | null;
  readonly rng: RngState;
  readonly variant: Variant;
  readonly nextEndId: number;
  /** Счётчик подряд идущих пасов — страховка от зависания (см. rules.ts). */
  readonly passStreak: number;
  readonly result: RoundResult | null;
  readonly log: readonly LogEntry[];
}

export type Move =
  | { readonly type: 'placeRoot'; readonly tile: TileId }
  | {
      readonly type: 'place';
      readonly tile: TileId;
      readonly endId: number;
      readonly mode: 'straight' | 'turn' | 'cross';
    }
  | { readonly type: 'draw' }
  | { readonly type: 'pass' };

export function cellKey(v: Vec): string {
  return `${v.x},${v.y}`;
}

export const DIR = {
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
  N: { x: 0, y: -1 },
} as const;

export function add(a: Vec, b: Vec, k = 1): Vec {
  return { x: a.x + b.x * k, y: a.y + b.y * k };
}

/** Два перпендикуляра к направлению. */
export function perps(d: Vec): [Vec, Vec] {
  return [
    { x: d.y, y: -d.x },
    { x: -d.y, y: d.x },
  ];
}
