// Отрисовка костей в SVG. Все размеры — в «мировых» единицах стола:
// клетка сетки = половинка кости = CELL.

export const CELL = 56;
export const TILE_L = CELL * 2 - 8; // длина кости
export const TILE_W = CELL - 8; // ширина кости
export const TILE_R = 7; // скругление углов

// Классическая раскладка пипсов на половинке, координаты в единичном квадрате.
const T = 0.24;
const C = 0.5;
const B = 0.76;
const PIPS: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [],
  [[C, C]],
  [
    [T, T],
    [B, B],
  ],
  [
    [T, T],
    [C, C],
    [B, B],
  ],
  [
    [T, T],
    [T, B],
    [B, T],
    [B, B],
  ],
  [
    [T, T],
    [T, B],
    [C, C],
    [B, T],
    [B, B],
  ],
  [
    [T, T],
    [T, C],
    [T, B],
    [B, T],
    [B, C],
    [B, B],
  ],
];

/** Общие определения: градиенты, тени. Вставить в <defs> один раз на svg. */
export function tileDefs(): string {
  return `
  <linearGradient id="g-ivory" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#faf5e9"/>
    <stop offset="0.55" stop-color="#efe6d0"/>
    <stop offset="1" stop-color="#e2d6ba"/>
  </linearGradient>
  <linearGradient id="g-back" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#2c4237"/>
    <stop offset="1" stop-color="#182a21"/>
  </linearGradient>
  <filter id="f-tile" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="2.2" stdDeviation="2.6" flood-color="#000" flood-opacity="0.5"/>
  </filter>
  <filter id="f-raised" x="-60%" y="-60%" width="220%" height="220%">
    <feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#000" flood-opacity="0.6"/>
  </filter>
  <!-- Разметка принадлежности ходов (кнопка ◐). Именно SVG-фильтры, а не CSS
       filter: на SVG-элементах в мобильном Safari CSS-фильтры не работают.
       Область расширена под вылет тени f-raised у приподнятых костей. -->
  <filter id="f-own-first" x="-60%" y="-60%" width="220%" height="220%">
    <feComponentTransfer>
      <feFuncR type="linear" slope="1.09"/>
      <feFuncG type="linear" slope="1.09"/>
      <feFuncB type="linear" slope="1.09"/>
    </feComponentTransfer>
  </filter>
  <filter id="f-own-second" x="-60%" y="-60%" width="220%" height="220%">
    <feColorMatrix type="saturate" values="0.85"/>
    <feComponentTransfer>
      <feFuncR type="linear" slope="0.76"/>
      <feFuncG type="linear" slope="0.76"/>
      <feFuncB type="linear" slope="0.76"/>
    </feComponentTransfer>
  </filter>
  `;
}

function pipsSvg(value: number, cx: number, size: number): string {
  const r = size * 0.085;
  const area = size * 0.86;
  const off = (size - area) / 2 - size / 2;
  return PIPS[value]!
    .map(([px, py]) => {
      const x = cx + off + px * area;
      const y = off + py * area;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" class="pip"/>`;
    })
    .join('');
}

export interface TileFaceOptions {
  /** Дополнительные классы на группе. */
  className?: string;
  /** Золотая окантовка (корень). */
  accent?: boolean;
  /** Фильтр тени: 'flat' — без тени (руки), 'tile' — обычная, 'raised' — приподнятая. */
  shadow?: 'flat' | 'tile' | 'raised';
}

/**
 * Лицо кости, лежащей горизонтально: значение a слева, b справа.
 * Группа центрирована в (0,0): поворот вокруг центра безопасен.
 */
export function tileFace(a: number, b: number, opts: TileFaceOptions = {}): string {
  const L = TILE_L;
  const W = TILE_W;
  const half = CELL;
  const shadow =
    opts.shadow === 'flat' ? '' : `filter="url(#${opts.shadow === 'raised' ? 'f-raised' : 'f-tile'})"`;
  return `
  <g class="tile-face ${opts.className ?? ''}" ${shadow}>
    <rect x="${-L / 2}" y="${-W / 2}" width="${L}" height="${W}" rx="${TILE_R}"
      fill="url(#g-ivory)" stroke="#4a4033" stroke-width="1.1"/>
    <rect x="${-L / 2 + 1.6}" y="${-W / 2 + 1.6}" width="${L - 3.2}" height="${W - 3.2}"
      rx="${TILE_R - 1.5}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1"/>
    <line x1="0" y1="${-W / 2 + 6}" x2="0" y2="${W / 2 - 6}"
      stroke="#8a7a5f" stroke-width="1.2"/>
    <circle cx="0" cy="0" r="2.6" fill="#b39a6d" stroke="#6d5c41" stroke-width="0.8"/>
    ${pipsSvg(a, -half / 2, W)}
    ${pipsSvg(b, half / 2, W)}
    ${
      opts.accent
        ? `<rect x="${-L / 2 - 2.4}" y="${-W / 2 - 2.4}" width="${L + 4.8}" height="${W + 4.8}"
             rx="${TILE_R + 2}" fill="none" stroke="#c9a86a" stroke-width="1.8" opacity="0.9"/>`
        : ''
    }
  </g>`;
}

/** Рубашка кости (горизонтальная, центр в (0,0)) — тёмный лак с эмблемой. */
export function tileBack(opts: TileFaceOptions = {}): string {
  const L = TILE_L;
  const W = TILE_W;
  const shadow =
    opts.shadow === 'flat' ? '' : `filter="url(#${opts.shadow === 'raised' ? 'f-raised' : 'f-tile'})"`;
  return `
  <g class="tile-back ${opts.className ?? ''}" ${shadow}>
    <rect x="${-L / 2}" y="${-W / 2}" width="${L}" height="${W}" rx="${TILE_R}"
      fill="url(#g-back)" stroke="#0d1712" stroke-width="1.2"/>
    <rect x="${-L / 2 + 3}" y="${-W / 2 + 3}" width="${L - 6}" height="${W - 6}"
      rx="${TILE_R - 2}" fill="none" stroke="rgba(201,168,106,0.45)" stroke-width="1"/>
    ${bonsaiEmblem(0, 0, W * 0.34)}
  </g>`;
}

/** Мини-эмблема бонсая: чаша, ствол, три кроны. */
export function bonsaiEmblem(cx: number, cy: number, s: number): string {
  return `
  <g class="emblem" transform="translate(${cx} ${cy}) scale(${s / 20})" opacity="0.6">
    <path d="M -7 8 q 7 4 14 0 l -1.6 3 q -5.4 2.4 -10.8 0 z" fill="#c9a86a"/>
    <path d="M 0 8 C -1 4 -4 3 -3 -2 M 0 8 C 1 3 4 2 3 -3 M 0 8 C 0 5 -1 1 1 -5"
      fill="none" stroke="#c9a86a" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="-5" cy="-3" r="3.4" fill="#c9a86a"/>
    <circle cx="4.5" cy="-4.5" r="3" fill="#c9a86a"/>
    <circle cx="0.5" cy="-8" r="3.8" fill="#c9a86a"/>
  </g>`;
}

/**
 * Обёртка: кость (лицо или рубашка) как самостоятельный маленький <svg>
 * для рук и базара. w — размер по длинной стороне в px; vertical ставит
 * кость стоймя (длинная сторона вертикальна).
 * Градиенты и фильтры берутся из общего скрытого <svg> с tileDefs():
 * id в SVG глобальны на документ, дублировать defs не нужно.
 */
export function tileSvgElement(
  inner: string,
  w: number,
  opts: { extraClass?: string; vertical?: boolean } = {},
): string {
  const h = (w * TILE_W) / TILE_L;
  const pad = 8;
  if (opts.vertical) {
    const vb = `${-TILE_W / 2 - pad} ${-TILE_L / 2 - pad} ${TILE_W + pad * 2} ${TILE_L + pad * 2}`;
    return `<svg class="tile-svg ${opts.extraClass ?? ''}" width="${h}" height="${w}" viewBox="${vb}">
      <g transform="rotate(90)">${inner}</g>
    </svg>`;
  }
  const vb = `${-TILE_L / 2 - pad} ${-TILE_W / 2 - pad} ${TILE_L + pad * 2} ${TILE_W + pad * 2}`;
  return `<svg class="tile-svg ${opts.extraClass ?? ''}" width="${w}" height="${h}" viewBox="${vb}">
    ${inner}
  </svg>`;
}
