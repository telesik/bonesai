// Кости домино: стандартный набор дубль-шесть, 28 штук (§2.1).

/** Идентификатор кости — каноническая строка "hi-lo", hi >= lo. Например "6-4", "0-0". */
export type TileId = string;

export interface Tile {
  readonly id: TileId;
  /** Большая половинка. */
  readonly hi: number;
  /** Меньшая половинка. */
  readonly lo: number;
}

export function tileId(a: number, b: number): TileId {
  return a >= b ? `${a}-${b}` : `${b}-${a}`;
}

export function parseTile(id: TileId): Tile {
  const [hi, lo] = id.split('-').map(Number) as [number, number];
  return { id, hi, lo };
}

export function isDouble(id: TileId): boolean {
  const t = parseTile(id);
  return t.hi === t.lo;
}

/** Сумма очков на кости (§10.1). */
export function pipSum(id: TileId): number {
  const t = parseTile(id);
  return t.hi + t.lo;
}

/** Есть ли на кости половинка с числом v. */
export function hasValue(id: TileId, v: number): boolean {
  const t = parseTile(id);
  return t.hi === v || t.lo === v;
}

/** Вторая половинка кости при совпадении одной с v. Для дубля вернёт то же v. */
export function otherValue(id: TileId, v: number): number {
  const t = parseTile(id);
  return t.hi === v ? t.lo : t.hi;
}

/** Полный набор 28 костей в каноническом порядке. */
export function fullSet(): TileId[] {
  const set: TileId[] = [];
  for (let hi = 0; hi <= 6; hi++) {
    for (let lo = 0; lo <= hi; lo++) {
      set.push(tileId(hi, lo));
    }
  }
  return set;
}
