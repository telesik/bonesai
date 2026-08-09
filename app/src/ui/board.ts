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
  /** Ход, ожидающий подтверждения: его призрак подсвечивается. */
  pending?: Move | null;
  /** Кость с этим seq скрыта: к месту летит её HTML-клон (анимация хода). */
  hideSeq?: number | null;
}

/** Совпадение хода с ожидающим подтверждения (включая сторону поворота). */
export function samePlacement(a: Move, b: Move): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'placeRoot') return a.tile === (b as typeof a).tile;
  if (a.type === 'place' && b.type === 'place') {
    return (
      a.tile === b.tile && a.endId === b.endId && a.mode === b.mode && a.side === b.side
    );
  }
  return false;
}

const MIN_W = CELL * 5;
const MAX_W = CELL * 44;
/**
 * Минимальная ширина кадра автоподгонки: в начале партии стол видно
 * «издалека». На узких (мобильных) экранах кадр ближе, иначе кости
 * становятся нечитаемо мелкими.
 */
function fitMinW(viewportWidth: number): number {
  return viewportWidth < 700 ? CELL * 11 : CELL * 18;
}

export function createBoard(svg: SVGSVGElement, hooks: BoardHooks) {
  let vb: ViewBox = { x: -CELL * 9, y: -CELL * 5, w: CELL * 18, h: CELL * 10 };
  let autoFit = true;
  let lastGame: GameState | null = null;
  let lastGhostCells: Vec[] = [];
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

  /** Прямоугольник, охватывающий фигуру, открытые концы и призраки ходов. */
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
    for (const c of lastGhostCells) grow(c);
    // Сырые границы фигуры — для проверки пересечения с кучей базара.
    const rawMinX = minX;
    const rawMaxX = maxX;
    const rawMinY = minY;
    const rawMaxY = maxY;
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
    const scale = Math.max(1, fitMinW(rect.width || 1280) / w);
    if (scale > 1) {
      // Раздвигаем кадр вокруг центра, сохраняя аспект.
      minX -= (w * (scale - 1)) / 2 / CELL;
      minY -= (h * (scale - 1)) / 2 / CELL;
      w *= scale;
      h *= scale;
    }
    return avoidPile(
      { x: minX * CELL, y: minY * CELL, w, h },
      { x0: rawMinX * CELL, y0: rawMinY * CELL, x1: rawMaxX * CELL, y1: rawMaxY * CELL },
    );
  }

  /**
   * Куча базара лежит поверх стола в правом нижнем углу. Автомасштаб не
   * должен прятать дерево под ней: пока фигура пересекает кучу на экране,
   * кадр расширяется вправо-вниз — дерево уезжает к левому верхнему углу.
   */
  function avoidPile(vb: ViewBox, raw: { x0: number; y0: number; x1: number; y1: number }): ViewBox {
    const pile = document.querySelector('#boneyard');
    if (!pile) return vb;
    const pr = pile.getBoundingClientRect();
    const sr = svg.getBoundingClientRect();
    if (pr.width === 0 || sr.width === 0) return vb;
    const px0 = pr.left - sr.left;
    const py0 = pr.top - sr.top;
    let out = vb;
    for (let i = 0; i < 10; i++) {
      const sx1 = ((raw.x1 - out.x) / out.w) * sr.width;
      const sy1 = ((raw.y1 - out.y) / out.h) * sr.height;
      const sx0 = ((raw.x0 - out.x) / out.w) * sr.width;
      const sy0 = ((raw.y0 - out.y) / out.h) * sr.height;
      const hit =
        sx1 > px0 && sx0 < pr.right - sr.left && sy1 > py0 && sy0 < pr.bottom - sr.top;
      if (!hit) break;
      out = { x: out.x, y: out.y, w: out.w * 1.09, h: out.h * 1.09 };
    }
    return out;
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

  // Порог «это драг, а не клик»: пальцу нужен запас больше, чем мыши, —
  // тап по призраку легко уезжает на 5–8 px.
  const DRAG_PX = matchMedia('(pointer: coarse)').matches ? 10 : 4;

  // Мультитач: активные указатели и состояние щипка (дистанция и центр
  // прошлого замера в экранных px; шаги применяются инкрементально).
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch: { d: number; cx: number; cy: number } | null = null;

  function pinchFrom(pts: { x: number; y: number }[]): { d: number; cx: number; cy: number } {
    const [a, b] = [pts[0]!, pts[1]!];
    return {
      d: Math.hypot(b.x - a.x, b.y - a.y),
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2,
    };
  }

  svg.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return; // панорама и клики — только основной кнопкой
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pointers.size === 2) {
      // Второй палец превращает драг в щипок; кликом это уже не станет.
      dragging = false;
      moved = true;
      pinch = pinchFrom([...pointers.values()]);
      svg.setPointerCapture(ev.pointerId);
      return;
    }
    if (pointers.size > 2 || pinch) return;
    moved = false;
    // Захват указателя — только когда начинается панорама: захват на svg
    // ретаргетит события, и клик по призраку перестал бы находить цель.
    if ((ev.target as Element).closest('[data-move]')) return;
    dragging = true;
    dragStart = { x: ev.clientX, y: ev.clientY };
    vbStart = { ...vb };
    svg.setPointerCapture(ev.pointerId);
  });
  svg.addEventListener('pointermove', (ev) => {
    if (pointers.has(ev.pointerId)) {
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    }
    if (pinch && pointers.size >= 2) {
      const cur = pinchFrom([...pointers.values()]);
      if (cur.d < 1 || pinch.d < 1) return;
      const rect = svg.getBoundingClientRect();
      cancelAnimationFrame(tweenHandle);
      const w = Math.min(MAX_W, Math.max(MIN_W, vb.w * (pinch.d / cur.d)));
      const kk = w / vb.w;
      // Зум вокруг мировой точки под центром щипка…
      const px = vb.x + ((pinch.cx - rect.left) / rect.width) * vb.w;
      const py = vb.y + ((pinch.cy - rect.top) / rect.height) * vb.h;
      let nx = px - (px - vb.x) * kk;
      let ny = py - (py - vb.y) * kk;
      // …плюс панорама на смещение самого центра.
      const scale = w / rect.width;
      nx -= (cur.cx - pinch.cx) * scale;
      ny -= (cur.cy - pinch.cy) * scale;
      vb = { x: nx, y: ny, w, h: vb.h * kk };
      applyViewBox();
      pinch = cur;
      if (autoFit) {
        autoFit = false;
        hooks.onViewChange(false);
      }
      return;
    }
    if (!dragging) return;
    const rect = svg.getBoundingClientRect();
    const scale = vb.w / rect.width;
    const dx = (ev.clientX - dragStart.x) * scale;
    const dy = (ev.clientY - dragStart.y) * scale;
    if (Math.abs(ev.clientX - dragStart.x) + Math.abs(ev.clientY - dragStart.y) > DRAG_PX) {
      moved = true;
    }
    if (moved) {
      cancelAnimationFrame(tweenHandle);
      vb = { ...vb, x: vbStart.x - dx, y: vbStart.y - dy };
      applyViewBox();
    }
  });
  const endDrag = (ev: PointerEvent): void => {
    pointers.delete(ev.pointerId);
    if (pinch) {
      // Щипок закончился (или потерял палец): остаток не превращаем в драг,
      // чтобы стол не прыгал; следующий pointerdown начнёт жест заново.
      // Если пальцев всё ещё два и больше — пересеваем замер по оставшимся.
      pinch = pointers.size >= 2 ? pinchFrom([...pointers.values()]) : null;
      return;
    }
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

  svg.addEventListener('dblclick', (ev) => {
    // Двойной клик по призраку — это работа с ходом, а не с камерой.
    if ((ev.target as Element).closest('[data-move]')) return;
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
      // Разметка — SVG-фильтром через атрибут: CSS filter на SVG-элементах
      // не работает в мобильном Safari.
      const ownFilter = opts.markOwners
        ? ` filter="url(#${p.by === game.first ? 'f-own-first' : 'f-own-second'})"`
        : '';
      // Последняя выставленная кость помечается кольцом — иначе мгновенный
      // ход (особенно бота) легко пропустить. Скрытая — ждёт свой летящий клон.
      const isLast = p.seq === game.placed.length - 1 && game.placed.length > 1;
      const flags = `${isLast ? ' last-placed' : ''}${opts.hideSeq === p.seq ? ' incoming' : ''}`;
      parts.push(
        `<g transform="${tileTransform(p.cells[0], p.cells[1])}" data-seq="${p.seq}" class="placed kind-${p.kind} ${role}${flags}"${ownFilter}>
          <title>${t.hi}:${t.lo}${p.kind === 'root' ? L().tileRootSuffix : ''}${
            p.kind === 'cross' ? L().tileClosedSuffix : ''
          }${owner}</title>${face}${
            isLast
              ? `<rect class="last-ring" x="${-TILE_L / 2 - 3}" y="${-TILE_W / 2 - 3}"
                   width="${TILE_L + 6}" height="${TILE_W + 6}" rx="${TILE_R + 2.5}"/>`
              : ''
          }</g>`,
      );
    }

    // Тупик корня (§6.2): с этой стороны кости не ставятся никогда.
    const root = game.placed[0];
    if (root && root.kind === 'root') {
      const dx = root.cells[0]!.x - root.cells[1]!.x;
      const dy = root.cells[0]!.y - root.cells[1]!.y;
      const tx = (root.cells[0]!.x + dx * 0.5) * CELL + dx * 14;
      const ty = (root.cells[0]!.y + dy * 0.5) * CELL + dy * 14;
      parts.push(
        `<g class="end-marker dead root-dead" transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)})">
          <title>${L().rootDeadTitle}</title>
          <circle r="10" class="end-ring"/>
          <path d="M -4 -4 L 4 4 M 4 -4 L -4 4" class="end-x"/>
        </g>`,
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
    lastGhostCells = [];
    if (opts.selected !== null) {
      for (const m of opts.ghostMoves) {
        if (m.type === 'placeRoot') {
          // Как ляжет корень (§6.2): горизонтально, тупик слева.
          lastGhostCells.push({ x: -1, y: 0 }, { x: 0, y: 0 });
          parts.push(ghostSvg(game, m, [{ x: -1, y: 0 }, { x: 0, y: 0 }], 'root', opts));
        } else if (m.type === 'place') {
          const geo = placementGeometry(game, m.tile, m.endId, m.mode, m.side);
          lastGhostCells.push(geo.cells[0], geo.cells[1]);
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
            const geo = placementGeometry(game, move.tile, move.endId, move.mode, move.side);
            return [geo.values[0], geo.values[1]];
          })()
        : (() => {
            const t = parseTile(move.tile);
            return [t.hi, t.lo];
          })();
    const dataMove = opts.interactive
      ? `data-move='${JSON.stringify(move).replace(/'/g, '&#39;')}'`
      : '';
    const pending = opts.pending && samePlacement(move, opts.pending) ? ' pending' : '';
    // Пипсы призрака — реальные значения кости после выставления.
    return `
    <g transform="${tileTransform(cells[0], cells[1])}" class="ghost ghost-${mode}${pending}" ${dataMove}>
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

  /** Экранные координаты центра выложенной кости (для летящего клона). */
  function placedScreenPoint(seq: number): { x: number; y: number; angle: number; scale: number } | null {
    const p = lastGame?.placed[seq];
    if (!p) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return null;
    const cx = ((p.cells[0].x + p.cells[1].x) / 2) * CELL;
    const cy = ((p.cells[0].y + p.cells[1].y) / 2) * CELL;
    const angle =
      (Math.atan2(p.cells[1].y - p.cells[0].y, p.cells[1].x - p.cells[0].x) * 180) / Math.PI;
    return {
      x: rect.left + ((cx - vb.x) / vb.w) * rect.width,
      y: rect.top + ((cy - vb.y) / vb.h) * rect.height,
      angle,
      scale: (TILE_L / vb.w) * rect.width,
    };
  }

  return {
    render,
    fit(animate = true): void {
      autoFit = true;
      fit(animate);
    },
    placedScreenPoint,
    /** Довести кость в кадр минимальным сдвигом (автомасштаб выключен). */
    ensureVisible(seq: number, margin = 40): void {
      const pt = placedScreenPoint(seq);
      if (!pt) return;
      const rect = svg.getBoundingClientRect();
      const x = pt.x - rect.left;
      const y = pt.y - rect.top;
      let dx = 0;
      let dy = 0;
      if (x < margin) dx = x - margin;
      else if (x > rect.width - margin) dx = x - (rect.width - margin);
      if (y < margin) dy = y - margin;
      else if (y > rect.height - margin) dy = y - (rect.height - margin);
      if (dx === 0 && dy === 0) return;
      const k = vb.w / rect.width;
      setViewBox({ ...vb, x: vb.x + dx * k, y: vb.y + dy * k }, true);
    },
    /** Явно включить/выключить автомасштаб (галочка в шапке). */
    setAutoFit(on: boolean, animate = true): void {
      autoFit = on;
      if (on) fit(animate);
    },
    isAutoFit: () => autoFit,
  };
}
