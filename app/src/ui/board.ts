// Стол: SVG-сцена с выложенным деревом, маркерами концов и «призраками»
// доступных ходов. Панорама перетаскиванием, зум колесом, автоподгонка.

import {
  hasValue,
  parseTile,
  placementGeometry,
  type GameState,
  type Move,
  type TileId,
  type Vec,
} from '../engine';
import { CELL, tileFace, TILE_L, TILE_W, TILE_R } from './tile-svg';
import { L } from './i18n';

export interface BoardHooks {
  onMove(move: Move): void;
  /** Автомасштаб переключился: false — пользователь подвигал/зумил стол сам. */
  onViewChange(auto: boolean): void;
}

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BoardRenderOptions {
  /** Ходы выставления выбранной кости (уже отфильтрованные). */
  ghostMoves: readonly Move[];
  /** Выбранная кость (для призраков корня). */
  selected: TileId | null;
  /** Анимировать кость с этим seq (только что выложенную). */
  animateSeq: number | null;
  /** Принимать ли клики по призракам. */
  interactive: boolean;
  /** Разметка принадлежности: кости первого игрока светлее, второго — темнее. */
  markOwners: boolean;
}

const MIN_W = CELL * 5;
const MAX_W = CELL * 44;
/** Минимальная ширина кадра автоподгонки: в начале партии стол видно «издалека». */
const FIT_MIN_W = CELL * 18;

export function createBoard(svg: SVGSVGElement, hooks: BoardHooks) {
  let vb: ViewBox = { x: -CELL * 9, y: -CELL * 5, w: CELL * 18, h: CELL * 10 };
  let autoFit = true;
  let lastGame: GameState | null = null;
  let tweenHandle = 0;

  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  applyViewBox();

  function applyViewBox(): void {
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  }

  function setViewBox(next: ViewBox, animate: boolean): void {
    cancelAnimationFrame(tweenHandle);
    if (!animate) {
      vb = next;
      applyViewBox();
      return;
    }
    const from = { ...vb };
    const t0 = performance.now();
    const dur = 260;
    const step = (t: number): void => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      vb = {
        x: from.x + (next.x - from.x) * e,
        y: from.y + (next.y - from.y) * e,
        w: from.w + (next.w - from.w) * e,
        h: from.h + (next.h - from.h) * e,
      };
      applyViewBox();
      if (k < 1) tweenHandle = requestAnimationFrame(step);
    };
    tweenHandle = requestAnimationFrame(step);
  }

  /** Прямоугольник, охватывающий фигуру и открытые концы. */
  function contentBox(game: GameState): ViewBox {
    let minX = -1.5;
    let maxX = 1.5;
    let minY = -1.5;
    let maxY = 1.5;
    const grow = (c: Vec): void => {
      minX = Math.min(minX, c.x - 1.4);
      maxX = Math.max(maxX, c.x + 1.4);
      minY = Math.min(minY, c.y - 1.4);
      maxY = Math.max(maxY, c.y + 1.4);
    };
    for (const p of game.placed) {
      grow(p.cells[0]);
      grow(p.cells[1]);
    }
    for (const e of game.ends) grow(e.attach);
    const rect = svg.getBoundingClientRect();
    const aspect = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 16 / 9;
    let w = (maxX - minX) * CELL;
    let h = (maxY - minY) * CELL;
    // Подгоняем под аспект вьюпорта, чтобы фигура занимала кадр целиком.
    if (w / h < aspect) {
      const w2 = h * aspect;
      minX -= (w2 - w) / 2 / CELL;
      w = w2;
    } else {
      const h2 = w / aspect;
      minY -= (h2 - h) / 2 / CELL;
      h = h2;
    }
    const scale = Math.max(1, FIT_MIN_W / w);
    if (scale > 1) {
      // Раздвигаем кадр вокруг центра, сохраняя аспект.
      minX -= (w * (scale - 1)) / 2 / CELL;
      minY -= (h * (scale - 1)) / 2 / CELL;
      w *= scale;
      h *= scale;
    }
    return { x: minX * CELL, y: minY * CELL, w, h };
  }

  function fit(animate = true): void {
    if (!lastGame) return;
    setViewBox(contentBox(lastGame), animate);
  }

  // --- Панорама и зум --------------------------------------------------------

  let dragging = false;
  let dragStart = { x: 0, y: 0 };
  let vbStart = vb;
  let moved = false;

  svg.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return; // панорама и клики — только основной кнопкой
    moved = false;
    if ((ev.target as Element).closest('[data-move]')) return;
    dragging = true;
    dragStart = { x: ev.clientX, y: ev.clientY };
    vbStart = { ...vb };
    svg.setPointerCapture(ev.pointerId);
  });
  svg.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const rect = svg.getBoundingClientRect();
    const scale = vb.w / rect.width;
    const dx = (ev.clientX - dragStart.x) * scale;
    const dy = (ev.clientY - dragStart.y) * scale;
    if (Math.abs(ev.clientX - dragStart.x) + Math.abs(ev.clientY - dragStart.y) > 4) {
      moved = true;
    }
    if (moved) {
      cancelAnimationFrame(tweenHandle);
      vb = { ...vb, x: vbStart.x - dx, y: vbStart.y - dy };
      applyViewBox();
    }
  });
  const endDrag = (): void => {
    if (dragging && moved) {
      autoFit = false;
      hooks.onViewChange(false);
    }
    dragging = false;
  };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  svg.addEventListener(
    'wheel',
    (ev) => {
      ev.preventDefault();
      const rect = svg.getBoundingClientRect();
      const k = ev.deltaY > 0 ? 1.15 : 1 / 1.15;
      const w = Math.min(MAX_W, Math.max(MIN_W, vb.w * k));
      const kk = w / vb.w;
      const px = vb.x + ((ev.clientX - rect.left) / rect.width) * vb.w;
      const py = vb.y + ((ev.clientY - rect.top) / rect.height) * vb.h;
      cancelAnimationFrame(tweenHandle);
      vb = {
        x: px - (px - vb.x) * kk,
        y: py - (py - vb.y) * kk,
        w,
        h: vb.h * kk,
      };
      applyViewBox();
      autoFit = false;
      hooks.onViewChange(false);
    },
    { passive: false },
  );

  svg.addEventListener('dblclick', () => {
    autoFit = true;
    fit();
    hooks.onViewChange(true);
  });

  svg.addEventListener('click', (ev) => {
    const el = (ev.target as Element).closest<SVGElement>('[data-move]');
    if (!el || moved) return;
    const move = JSON.parse(el.dataset.move!) as Move;
    hooks.onMove(move);
  });

  // --- Отрисовка --------------------------------------------------------------

  function tileTransform(c0: Vec, c1: Vec): string {
    const cx = ((c0.x + c1.x) / 2) * CELL;
    const cy = ((c0.y + c1.y) / 2) * CELL;
    const angle = (Math.atan2(c1.y - c0.y, c1.x - c0.x) * 180) / Math.PI;
    return `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${angle.toFixed(1)})`;
  }

  /** Числа, для которых на столе уже все 7 костей: мёртвые концы (§9.1). */
  function deadValues(game: GameState): Set<number> {
    const dead = new Set<number>();
    for (let v = 0; v <= 6; v++) {
      let n = 0;
      for (const p of game.placed) {
        if (hasValue(p.tile, v)) n++;
      }
      if (n === 7) dead.add(v);
    }
    return dead;
  }

  function render(game: GameState, opts: BoardRenderOptions): void {
    lastGame = game;
    // Разметка принадлежности включается классом на svg — сами кости всегда
    // несут класс роли, CSS активирует отличие только при включённой галочке.
    svg.classList.toggle('mark-owners', opts.markOwners);
    // Градиенты и фильтры — в общем скрытом <svg> документа (см. initApp).
    const parts: string[] = [];

    // Выложенные кости.
    for (const p of game.placed) {
      const t = parseTile(p.tile);
      const role = p.by === game.first ? 'by-first' : 'by-second';
      const face = tileFace(p.values[0], p.values[1], {
        accent: p.kind === 'root',
        shadow: p.overlap ? 'raised' : 'tile',
        className: p.seq === opts.animateSeq ? 'just-placed' : '',
      });
      const owner = opts.markOwners
        ? ` (${p.by === game.first ? L().ownerFirst : L().ownerSecond})`
        : '';
      parts.push(
        `<g transform="${tileTransform(p.cells[0], p.cells[1])}" class="placed kind-${p.kind} ${role}">
          <title>${t.hi}:${t.lo}${p.kind === 'root' ? L().tileRootSuffix : ''}${
            p.kind === 'cross' ? L().tileClosedSuffix : ''
          }${owner}</title>${face}</g>`,
      );
    }

    // Маркеры открытых концов.
    const dead = deadValues(game);
    for (const e of game.ends) {
      const x = e.attach.x * CELL;
      const y = e.attach.y * CELL;
      const isDead = dead.has(e.value);
      const cls = `end-marker${e.fresh ? ' fresh' : ''}${isDead ? ' dead' : ''}`;
      const hint = isDead
        ? L().endDead(e.value)
        : e.fresh
          ? L().endFresh(e.value)
          : L().endOpen(e.value);
      parts.push(
        `<g class="${cls}" transform="translate(${x} ${y})">
          <title>${hint}</title>
          <circle r="13" class="end-ring"/>
          ${
            isDead
              ? `<path d="M -5 -5 L 5 5 M 5 -5 L -5 5" class="end-x"/>`
              : `<text class="end-num" dy="0.36em">${e.value}</text>`
          }
        </g>`,
      );
    }

    // Призраки ходов выбранной кости.
    if (opts.selected !== null) {
      for (const m of opts.ghostMoves) {
        if (m.type === 'placeRoot') {
          // Как ляжет корень (§6.2): горизонтально, тупик слева.
          parts.push(ghostSvg(game, m, [{ x: -1, y: 0 }, { x: 0, y: 0 }], 'root', opts));
        } else if (m.type === 'place') {
          const geo = placementGeometry(game, m.tile, m.endId, m.mode);
          parts.push(ghostSvg(game, m, [geo.cells[0], geo.cells[1]], m.mode, opts));
        }
      }
    }

    svg.innerHTML = parts.join('\n');

    if (autoFit) fit(game.placed.length > 1);
  }

  function modeLabel(mode: string): string {
    switch (mode) {
      case 'root':
        return L().ghostRoot;
      case 'straight':
        return L().ghostStraight;
      case 'turn':
        return L().ghostTurn;
      case 'cross':
        return L().ghostCross;
      default:
        return mode;
    }
  }

  function ghostSvg(
    game: GameState,
    move: Extract<Move, { type: 'place' } | { type: 'placeRoot' }>,
    cells: readonly [Vec, Vec],
    mode: string,
    opts: BoardRenderOptions,
  ): string {
    const values: [number, number] =
      move.type === 'place'
        ? (() => {
            const geo = placementGeometry(game, move.tile, move.endId, move.mode);
            return [geo.values[0], geo.values[1]];
          })()
        : (() => {
            const t = parseTile(move.tile);
            return [t.hi, t.lo];
          })();
    const dataMove = opts.interactive
      ? `data-move='${JSON.stringify(move).replace(/'/g, '&#39;')}'`
      : '';
    // Пипсы призрака — реальные значения кости после выставления.
    return `
    <g transform="${tileTransform(cells[0], cells[1])}" class="ghost ghost-${mode}" ${dataMove}>
      <title>${modeLabel(mode)}</title>
      <rect x="${-TILE_L / 2}" y="${-TILE_W / 2}" width="${TILE_L}" height="${TILE_W}"
        rx="${TILE_R}" class="ghost-body"/>
      <line x1="0" y1="${-TILE_W / 2 + 7}" x2="0" y2="${TILE_W / 2 - 7}" class="ghost-divider"/>
      ${ghostPips(values[0], -CELL / 2)}
      ${ghostPips(values[1], CELL / 2)}
    </g>`;
  }

  function ghostPips(value: number, cx: number): string {
    // Уменьшенные пипсы-намёки.
    const size = TILE_W;
    const r = size * 0.07;
    const area = size * 0.8;
    const T2 = 0.24;
    const C2 = 0.5;
    const B2 = 0.76;
    const layouts: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
      [],
      [[C2, C2]],
      [[T2, T2], [B2, B2]],
      [[T2, T2], [C2, C2], [B2, B2]],
      [[T2, T2], [T2, B2], [B2, T2], [B2, B2]],
      [[T2, T2], [T2, B2], [C2, C2], [B2, T2], [B2, B2]],
      [[T2, T2], [T2, C2], [T2, B2], [B2, T2], [B2, C2], [B2, B2]],
    ];
    const off = (size - area) / 2 - size / 2;
    return layouts[value]!
      .map(
        ([px, py]) =>
          `<circle cx="${(cx + off + px * area).toFixed(1)}" cy="${(off + py * area).toFixed(1)}"
             r="${r.toFixed(1)}" class="ghost-pip"/>`,
      )
      .join('');
  }

  return {
    render,
    fit(animate = true): void {
      autoFit = true;
      fit(animate);
    },
    /** Явно включить/выключить автомасштаб (галочка в шапке). */
    setAutoFit(on: boolean, animate = true): void {
      autoFit = on;
      if (on) fit(animate);
    },
    isAutoFit: () => autoFit,
  };
}
