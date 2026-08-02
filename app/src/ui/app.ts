// Контроллер приложения: экраны, руки, базар, оркестровка ходов.
// Горячее место за одной машиной (hot-seat): игроки ходят по очереди.

import {
  applyMove,
  finishRound,
  fullSet,
  handSum,
  isDouble,
  legalMoves,
  matchProtocol,
  nextRound,
  parseTile,
  pipSum,
  replayRound,
  seedFromCrypto,
  startMatch,
  validateProtocol,
  type GameState,
  type LogEntry,
  type MatchProtocol,
  type MatchState,
  type Move,
  type RoundProtocol,
  type TileId,
  type Variant,
} from '../engine';
import { createBoard } from './board';
import { tileBack, tileDefs, tileFace, tileSvgElement } from './tile-svg';

const LS_KEY = 'bonesai-match-v1';
const LS_UI_KEY = 'bonesai-ui-v1';

/** Версия правил, которую реализует прототип, и постоянная ссылка на них. */
const RULES_VERSION = '1.0';
const RULES_URL = 'https://doi.org/10.5281/zenodo.21745035';

interface PileSprite {
  x: number;
  y: number;
  rot: number;
  alive: boolean;
}

// ---------------------------------------------------------------------------

export function initApp(): void {
  // Общие SVG-определения (градиенты, тени) — один раз на документ:
  // на них ссылаются и стол, и кости в руках, и базар.
  const defsHost = document.createElement('div');
  defsHost.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  defsHost.innerHTML = `<svg width="0" height="0"><defs>${tileDefs()}</defs></svg>`;
  document.body.prepend(defsHost);

  // Бейдж версии в правом нижнем углу: версия приложения, версия правил
  // (ссылка на опубликованную запись) и коммит сборки — для разбора багов.
  const appVersion = __APP_VERSION__.split('.').slice(0, 2).join('.');
  const badge = document.createElement('div');
  badge.id = 'version-badge';
  badge.innerHTML =
    `версия ${appVersion} (<a href="${RULES_URL}" target="_blank" rel="noopener">` +
    `правила ${RULES_VERSION}</a>, hashCommit=${__GIT_HASH__})`;
  document.body.appendChild(badge);

  // --- DOM ------------------------------------------------------------------
  const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => {
    const el = document.querySelector<T>(sel);
    if (!el) throw new Error(`Нет элемента ${sel}`);
    return el;
  };
  const elRoundChip = $('#round-chip');
  const elStatusEvent = $('#status-event');
  const elStatusPrompt = $('#status-prompt');
  const elScoreChips = $('#score-chips');
  const elHandTop = $('#hand-top');
  const elHandBottom = $('#hand-bottom');
  const elBoneyard = $('#boneyard');
  const elToast = $('#toast');
  const elOverlay = $('#overlay');
  const elHistoryBar = $('#history-bar');
  const elBtnHist = $('#btn-hist');
  const elBtnMark = $('#btn-mark');
  const elBtnFit = $('#btn-fit');
  const elBtnNew = $('#btn-new');
  const svgBoard = document.querySelector<SVGSVGElement>('#board')!;

  // --- Состояние ---------------------------------------------------------------
  let match: MatchState | null = null;
  let selected: TileId | null = null;
  let pileSprites: PileSprite[] = [];
  let pileRoundKey = -1;
  let animateSeq: number | null = null;
  let showRoundOver = false;
  let roundOverTimer = 0;
  let autoPassTimer = 0;
  let autoPassForLog = -1;
  let toastTimer = 0;

  // Режим истории: просмотр партии по протоколу (текущий матч или файл).
  interface ReplayData {
    readonly names: readonly [string, string];
    readonly variant: Variant;
    readonly rounds: readonly RoundProtocol[];
    readonly external: boolean;
  }
  let replay: { data: ReplayData; roundIdx: number; step: number } | null = null;
  let replayLastKey = '';

  // Настройки вида (переживают перезагрузку).
  let markOwners = false;
  try {
    markOwners = !!(JSON.parse(localStorage.getItem(LS_UI_KEY) ?? '{}') as {
      markOwners?: boolean;
    }).markOwners;
  } catch {
    /* ignore */
  }

  function persistUi(): void {
    try {
      localStorage.setItem(LS_UI_KEY, JSON.stringify({ markOwners }));
    } catch {
      /* ignore */
    }
  }

  const board = createBoard(svgBoard, {
    onMove(move) {
      if (replay) return;
      if (performance.now() - lastDispatchAt < 300) return;
      dispatch(move);
    },
    onManualView() {
      elBtnFit.classList.remove('active');
    },
  });

  // --- Утилиты -----------------------------------------------------------------

  const nameOf = (p: 0 | 1): string => match?.names[p] ?? `Игрок ${p + 1}`;
  const tileLabel = (t: TileId): string => t.replace('-', ':');
  const esc = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function persist(): void {
    try {
      if (match) localStorage.setItem(LS_KEY, JSON.stringify({ v: 2, match }));
    } catch {
      /* приватный режим — не страшно */
    }
  }

  function loadSaved(): MatchState | null {
    const drop = (): null => {
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        /* ignore */
      }
      return null;
    };
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const TILE_RE = /^[0-6]-[0-6]$/;
      const tiles = (x: unknown): boolean =>
        Array.isArray(x) && x.every((t) => typeof t === 'string' && TILE_RE.test(t));
      const data = JSON.parse(raw) as { v?: number; match?: MatchState };
      const m = data?.match;
      const r = m?.round;
      const ok =
        data?.v === 2 &&
        Array.isArray(m?.names) &&
        m.names.length === 2 &&
        m.names.every((n) => typeof n === 'string') &&
        Array.isArray(m.totals) &&
        m.totals.length === 2 &&
        m.totals.every((n) => typeof n === 'number') &&
        !!r &&
        (r.phase === 'root' || r.phase === 'main' || r.phase === 'over') &&
        Array.isArray(r.hands) &&
        r.hands.length === 2 &&
        tiles(r.hands[0]) &&
        tiles(r.hands[1]) &&
        tiles(r.boneyard) &&
        Array.isArray(r.placed) &&
        Array.isArray(r.ends) &&
        typeof r.seed === 'number' &&
        Array.isArray(r.history) &&
        Array.isArray(m.rounds);
      return ok ? m : drop();
    } catch {
      return drop();
    }
  }

  function toast(text: string, warn = false): void {
    clearTimeout(toastTimer);
    elToast.textContent = text;
    elToast.classList.toggle('warn', warn);
    elToast.hidden = false;
    toastTimer = window.setTimeout(() => {
      elToast.hidden = true;
    }, 2600);
  }

  /** Детерминированный мини-рандом для раскладки кучи базара. */
  function scatterRand(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function ensurePileSprites(): void {
    if (!match) return;
    const key = match.rounds.length;
    if (key === pileRoundKey) return;
    pileRoundKey = key;
    const rand = scatterRand((match.round.rng ^ (key * 0x9e3779b9)) >>> 0);
    pileSprites = [];
    for (let i = 0; i < 14; i++) {
      // Кучка: кладём со сдвигом и поворотом, немного внахлёст — как на столе.
      const x = 12 + rand() * 180;
      const y = 8 + rand() * 140;
      const rot = -50 + rand() * 100;
      pileSprites.push({ x, y, rot, alive: true });
    }
    // Если партия продолжена из сохранения — часть кучи уже разобрана.
    const dead = 14 - match.round.boneyard.length;
    for (let i = 0; i < dead; i++) pileSprites[i]!.alive = false;
  }

  // --- Основной дисп��тчер --------------------------------------------------------

  // Метка последнего применённого хода: гасит второй клик двойного клика,
  // прилетающий уже в перерисованный DOM (куча базара, призраки).
  let lastDispatchAt = 0;

  function dispatch(move: Move): void {
    if (replay || !match || match.round.phase === 'over') return;
    clearTimeout(autoPassTimer);
    let round: GameState;
    try {
      round = applyMove(match.round, move);
    } catch (err) {
      console.error(err);
      return;
    }
    match = { ...match, round };
    selected = null;
    lastDispatchAt = performance.now();
    animateSeq =
      move.type === 'place' || move.type === 'placeRoot' ? round.placed.length - 1 : null;

    if (round.phase === 'over') {
      match = finishRound(match);
      showRoundOver = false;
      clearTimeout(roundOverTimer);
      roundOverTimer = window.setTimeout(() => {
        showRoundOver = true;
        renderAll();
      }, 1100);
    }
    persist();
    renderAll();
  }

  // --- Рендер ----------------------------------------------------------------

  function renderAll(): void {
    if (replay) {
      renderReplayView();
      return;
    }
    elHistoryBar.hidden = true;
    elBtnHist.classList.remove('active');
    if (!match) {
      renderStartScreen();
      return;
    }
    const round = match.round;
    const legal = round.phase === 'over' ? [] : legalMoves(round);

    deriveSelection(round, legal);
    ensurePileSprites();
    renderTopbar(round);
    renderHand(0, round, legal);
    renderHand(1, round, legal);
    renderBoneyard(round, legal);
    renderBoard(round, legal);
    renderOverlay(round);
    scheduleAutoPass(round, legal);
    animateSeq = null;
  }

  function deriveSelection(round: GameState, legal: readonly Move[]): void {
    if (round.phase === 'over') {
      selected = null;
      return;
    }
    if (round.mustPlay) {
      selected = round.mustPlay;
      return;
    }
    const placeable = new Set(
      legal
        .filter((m): m is Extract<Move, { tile: TileId }> => 'tile' in m)
        .map((m) => m.tile),
    );
    if (selected && !placeable.has(selected)) selected = null;
    if (!selected && placeable.size === 1) selected = [...placeable][0]!;
  }

  function renderTopbar(round: GameState): void {
    if (!match) return;
    elRoundChip.textContent = `партия ${match.rounds.length + (round.phase === 'over' ? 0 : 1)}`;
    const chips = ([0, 1] as const)
      .map((p) => {
        const turn = round.phase !== 'over' && round.current === p;
        return `<span class="score-chip p${p} ${turn ? 'turn' : ''}">${esc(nameOf(p))} <b>${
          match!.totals[p]
        }</b></span>`;
      })
      .join('<span class="vs">·</span>');
    elScoreChips.innerHTML = chips;
    const { event, prompt } = statusTexts(round);
    elStatusEvent.textContent = event;
    elStatusPrompt.innerHTML = prompt;
    elBtnFit.classList.toggle('active', board.isAutoFit());
  }

  // Формулировки без глаголов прошедшего времени: имена игроков любого рода.
  function describeLog(e: LogEntry, names: readonly [string, string]): string {
    switch (e.kind) {
      case 'root':
        return `${names[e.player]}: корень ${tileLabel(e.tile)}`;
      case 'place': {
        const mode =
          e.mode === 'straight' ? 'прямо' : e.mode === 'turn' ? 'на поворот' : 'поперёк — ветка закрыта';
        return `${names[e.player]}: ${tileLabel(e.tile)} ${mode}`;
      }
      case 'draw':
        return e.played
          ? `${names[e.player]}: кость из базара — подходит!`
          : `${names[e.player]}: кость из базара — в руку, ход дальше`;
      case 'pass':
        return `${names[e.player]}: пас`;
      case 'end':
        return e.cause === 'fish' ? 'Рыба!' : 'Выход!';
    }
  }

  function statusTexts(round: GameState): { event: string; prompt: string } {
    const last = round.log[round.log.length - 1];
    const event = last ? describeLog(last, match!.names) : 'Новая партия';
    if (round.phase === 'over') {
      return { event, prompt: 'Партия окончена' };
    }
    const name = `<b>${esc(nameOf(round.current))}</b>`;
    if (round.phase === 'root') {
      if (round.mustPlay) {
        return {
          event,
          prompt: `${name}: вытянут дубль ${tileLabel(round.mustPlay)} — он становится корнем`,
        };
      }
      const hasDouble = round.hands[round.current].some(isDouble);
      return hasDouble
        ? { event, prompt: `${name}: выставьте дубль — он станет корнем партии` }
        : { event, prompt: `${name}: дубля нет — возьмите кость из базара` };
    }
    if (round.mustPlay) {
      return {
        event,
        prompt: `${name}: кость ${tileLabel(round.mustPlay)} подходит — обязаны сходить ею`,
      };
    }
    const anyPlacement = legalMoves(round).some((m) => m.type === 'place');
    if (anyPlacement) {
      return { event, prompt: `${name}: ваш ход — выберите кость и место` };
    }
    return round.boneyard.length > 0
      ? { event, prompt: `${name}: сходить нечем — возьмите кость из базара` }
      : { event, prompt: `${name}: сходить нечем, базар пуст — пас` };
  }

  /** Режим просмотра руки в истории: активен «ходивший», всё открыто, без кликов. */
  interface HandView {
    readonly mover: 0 | 1 | null;
    readonly names: readonly [string, string];
  }

  function renderHand(
    player: 0 | 1,
    round: GameState,
    legal: readonly Move[],
    view: HandView | null = null,
  ): void {
    const el = player === 0 ? elHandBottom : elHandTop;
    const hand = round.hands[player];
    // «Активный» игрок: в живой игре — чей ход, в истории — кто сделал
    // показанный ход. Отмечается рамкой руки и рукой-указателем у имени.
    const isActive = view
      ? view.mover === player
      : round.phase !== 'over' && round.current === player;
    const secondPlayer = (1 - round.first) as 0 | 1;
    const hidden = !view && player === secondPlayer && !round.secondRevealed;
    const name = view ? view.names[player] : nameOf(player);
    el.classList.toggle('active', isActive);

    const playable = new Set(
      !view && isActive
        ? legal
            .filter((m): m is Extract<Move, { tile: TileId }> => 'tile' in m)
            .map((m) => m.tile)
        : [],
    );

    // Последняя добранная и оставшаяся в руке кость подсвечивается, пока не
    // случится следующее действие: иначе легко не заметить, что пришло из базара.
    const lastLog = round.log[round.log.length - 1];
    const freshlyDrawn =
      lastLog?.kind === 'draw' && !lastLog.played && lastLog.player === player
        ? lastLog.tile
        : null;

    const meta = `
      <div class="hand-meta">
        <div class="hand-name">${
          isActive ? '<span class="turn-mark" title="Ходит">☞</span>' : ''
        }${
          round.first === player ? '<span class="first-chip">первый</span>' : ''
        }${esc(name)}</div>
        <div class="hand-sum">${
          hidden
            ? `${hand.length} кост${plural(hand.length)} · рука закрыта до первого хода`
            : `${hand.length} кост${plural(hand.length)} · ${handSum(hand)} очк.`
        }</div>
      </div>`;

    const tiles = hand
      .map((t) => {
        const p = parseTile(t);
        const cls = [
          'hand-tile',
          playable.has(t) ? 'playable' : '',
          !view && isActive && !playable.has(t) && !hidden ? 'dimmed' : '',
          !view && selected === t && isActive ? 'selected' : '',
          !view && round.mustPlay === t && isActive ? 'must' : '',
          freshlyDrawn === t && !hidden ? 'drawn-new' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const inner = hidden ? tileBack({ shadow: 'flat' }) : tileFace(p.hi, p.lo, { shadow: 'flat' });
        // Скрытой руке идентификаторы костей в DOM не выдаём (§3.2): клики по
        // ней всё равно невозможны, а инспектор браузера не должен подсматривать.
        const attrs = hidden || view ? '' : ` data-player="${player}" data-tile="${t}"`;
        return `<div class="${cls}"${attrs}>
          ${tileSvgElement(inner, 88)}
        </div>`;
      })
      .join('');

    el.innerHTML = `${meta}<div class="hand-tiles">${tiles}</div>`;
  }

  function plural(n: number): string {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'ь';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'и';
    return 'ей';
  }

  function renderBoneyard(round: GameState, legal: readonly Move[]): void {
    const canDraw = legal.some((m) => m.type === 'draw');
    elBoneyard.classList.toggle('can-draw', canDraw);
    const alive = pileSprites.filter((s) => s.alive).length;
    // Куча уже отрисована и совпадает по составу — не трогаем DOM зря.
    const key = `${pileRoundKey}|${alive}|${round.boneyard.length}`;
    if (elBoneyard.dataset.key === key) return;
    elBoneyard.dataset.key = key;
    const tiles = pileSprites
      .map((s, i) => {
        if (!s.alive) return '';
        return `<div class="pile-tile" data-pile="${i}"
          style="left:${s.x}px; top:${s.y}px; --rot:${s.rot}deg; transform:rotate(${s.rot}deg)">
          ${tileSvgElement(tileBack({ shadow: 'flat' }), 78)}
        </div>`;
      })
      .join('');
    const count = round.boneyard.length;
    elBoneyard.innerHTML = `${tiles}<div class="pile-count">базар: ${count}</div>`;
  }

  function renderBoard(round: GameState, legal: readonly Move[]): void {
    const ghostMoves =
      selected === null
        ? []
        : legal.filter(
            (m) => (m.type === 'place' || m.type === 'placeRoot') && m.tile === selected,
          );
    board.render(round, {
      ghostMoves,
      selected,
      animateSeq,
      interactive: round.phase !== 'over',
      markOwners,
    });
  }

  function scheduleAutoPass(round: GameState, legal: readonly Move[]): void {
    clearTimeout(autoPassTimer);
    if (round.phase === 'over') return;
    if (legal.length === 1 && legal[0]!.type === 'pass') {
      // Тост показываем один раз, но таймер перезаводим при каждом рендере:
      // любой промежуточный рендер сбрасывает clearTimeout выше.
      if (autoPassForLog !== round.log.length) {
        autoPassForLog = round.log.length;
        toast(`У ${nameOf(round.current)} нет хода — пас`);
      }
      autoPassTimer = window.setTimeout(() => dispatch({ type: 'pass' }), 1300);
    }
  }

  // --- История ходов (просмотр по протоколу) ---------------------------------------

  function openHistory(): void {
    if (!match) return;
    const rounds: RoundProtocol[] = match.rounds.map((r) => ({
      seed: r.seed,
      first: r.first,
      moves: r.moves,
      result: { cause: r.cause, sums: r.sums, added: r.added, winner: r.winner },
    }));
    const cur = match.round;
    if (cur.phase !== 'over') {
      rounds.push({ seed: cur.seed, first: cur.first, moves: cur.history });
    }
    if (rounds.length === 0) return;
    const roundIdx = rounds.length - 1;
    replay = {
      data: { names: match.names, variant: match.variant, rounds, external: false },
      roundIdx,
      step: rounds[roundIdx]!.moves.length,
    };
    clearTimeout(autoPassTimer);
    clearTimeout(roundOverTimer);
    renderAll();
  }

  function exitReplay(): void {
    const wasExternal = replay?.data.external ?? false;
    replay = null;
    replayLastKey = '';
    // Если живая партия уже завершена — вернуть экран итогов.
    if (!wasExternal && match && match.round.phase === 'over') showRoundOver = true;
    renderAll();
  }

  function renderReplayView(): void {
    const rp = replay!;
    const round = rp.data.rounds[rp.roundIdx]!;
    const total = round.moves.length;
    rp.step = Math.max(0, Math.min(rp.step, total));
    let state: GameState;
    try {
      state = replayRound(round, rp.data.variant, rp.step);
    } catch (err) {
      toast(`Протокол не воспроизводится: ${(err as Error).message}`, true);
      exitReplay();
      return;
    }
    const prev = replayLastKey.split(':');
    const forward = prev[0] === String(rp.roundIdx) && Number(prev[1]) < rp.step;
    replayLastKey = `${rp.roundIdx}:${rp.step}`;

    const lastLog = state.log[state.log.length - 1];
    const mover: 0 | 1 | null =
      lastLog && 'player' in lastLog ? lastLog.player : null;

    elBtnHist.classList.add('active');
    elRoundChip.textContent = `просмотр · партия ${rp.roundIdx + 1} из ${rp.data.rounds.length}`;
    elScoreChips.innerHTML = ([0, 1] as const)
      .map(
        (p) =>
          `<span class="score-chip p${p} ${mover === p ? 'turn' : ''}">${esc(
            rp.data.names[p],
          )}</span>`,
      )
      .join('<span class="vs">·</span>');
    elStatusEvent.textContent = rp.data.external
      ? 'Просмотр загруженного протокола'
      : 'История ходов матча';
    elStatusPrompt.innerHTML =
      rp.step === 0
        ? `Раздача — первым ходит <b>${esc(rp.data.names[round.first])}</b>`
        : lastLog
          ? esc(describeLog(lastLog, rp.data.names))
          : '';

    const handView: HandView = { mover, names: rp.data.names };
    renderHand(0, state, [], handView);
    renderHand(1, state, [], handView);
    renderBoneyardStatic(state, round.seed);

    const lastMove = rp.step > 0 ? round.moves[rp.step - 1] : undefined;
    const animate =
      forward && lastMove && (lastMove.type === 'place' || lastMove.type === 'placeRoot');
    board.render(state, {
      ghostMoves: [],
      selected: null,
      animateSeq: animate ? state.placed.length - 1 : null,
      interactive: false,
      markOwners,
    });
    elOverlay.hidden = true;
    renderHistoryBar(rp, total);
  }

  /** Куча базара в режиме истории: раскладка по seed партии, без кликов. */
  function renderBoneyardStatic(state: GameState, seed: number): void {
    elBoneyard.classList.remove('can-draw');
    const count = state.boneyard.length;
    const key = `replay|${seed}|${count}`;
    if (elBoneyard.dataset.key === key) return;
    elBoneyard.dataset.key = key;
    const rand = scatterRand(seed >>> 0);
    const tiles: string[] = [];
    for (let i = 0; i < 14; i++) {
      const x = 12 + rand() * 180;
      const y = 8 + rand() * 140;
      const rot = -50 + rand() * 100;
      if (i < count) {
        tiles.push(`<div class="pile-tile"
          style="left:${x}px; top:${y}px; --rot:${rot}deg; transform:rotate(${rot}deg)">
          ${tileSvgElement(tileBack({ shadow: 'flat' }), 78)}
        </div>`);
      }
    }
    elBoneyard.innerHTML = `${tiles.join('')}<div class="pile-count">базар: ${count}</div>`;
  }

  function renderHistoryBar(
    rp: NonNullable<typeof replay>,
    total: number,
  ): void {
    elHistoryBar.hidden = false;
    const barKey = `${rp.data.external}|${rp.data.rounds.length}|${rp.roundIdx}|${total}`;
    if (elHistoryBar.dataset.key !== barKey) {
      elHistoryBar.dataset.key = barKey;
      const options = rp.data.rounds
        .map((r, i) => {
          const res = r.result;
          const label = res
            ? `Партия ${i + 1} — ${res.cause === 'fish' ? 'рыба' : 'выход'}, ${res.sums[0]}:${res.sums[1]}`
            : `Партия ${i + 1} — идёт`;
          return `<option value="${i}" ${i === rp.roundIdx ? 'selected' : ''}>${label}</option>`;
        })
        .join('');
      elHistoryBar.innerHTML = `
        <button class="icon-btn" data-action="replay-exit" data-tip="Вернуться к игре">✕</button>
        <select id="replay-round" data-tip="Выбор партии матча">${options}</select>
        <button class="icon-btn" data-action="replay-first" data-tip="К раздаче">⏮</button>
        <button class="icon-btn" data-action="replay-prev" data-tip="Ход назад">◀</button>
        <input type="range" id="replay-slider" min="0" max="${total}" step="1" value="${rp.step}">
        <button class="icon-btn" data-action="replay-next" data-tip="Ход вперёд">▶</button>
        <button class="icon-btn" data-action="replay-last" data-tip="К концу партии">⏭</button>
        <span id="replay-pos" class="replay-pos"></span>
        <button class="icon-btn" data-action="download-protocol" data-tip="Скачать протокол партий (JSON)">⭳</button>`;
    }
    const slider = document.querySelector<HTMLInputElement>('#replay-slider');
    if (slider && slider.value !== String(rp.step)) slider.value = String(rp.step);
    const pos = document.querySelector<HTMLElement>('#replay-pos');
    if (pos) pos.textContent = `ход ${rp.step}/${total}`;
  }

  /** Скачать протокол матча (или открытый внешний протокол) файлом JSON. */
  function downloadProtocol(): void {
    let proto: MatchProtocol | null = null;
    if (replay?.data.external) {
      proto = {
        format: 'bonesai-protocol',
        v: 1,
        names: replay.data.names,
        variant: replay.data.variant,
        rounds: replay.data.rounds,
      };
    } else if (match) {
      proto = matchProtocol(match);
    }
    if (!proto) return;
    const blob = new Blob([JSON.stringify(proto, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    a.href = url;
    a.download = `bonesai-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Протокол сохранён файлом JSON');
  }

  /** Загрузить протокол из файла: проверить воспроизведением и открыть просмотр. */
  async function importProtocol(file: File): Promise<void> {
    try {
      const data = JSON.parse(await file.text()) as MatchProtocol;
      if (
        data?.format !== 'bonesai-protocol' ||
        data.v !== 1 ||
        !Array.isArray(data.rounds) ||
        data.rounds.length === 0
      ) {
        throw new Error('это не протокол Bonesai');
      }
      const variant: Variant = { doubleOnlyCloses: !!data.variant?.doubleOnlyCloses };
      const check = validateProtocol({ ...data, variant });
      if (!check.ok) {
        throw new Error(`партия ${check.round + 1} не воспроизводится (${check.error})`);
      }
      replay = {
        data: {
          names: [
            String(data.names?.[0] ?? 'Игрок 1'),
            String(data.names?.[1] ?? 'Игрок 2'),
          ],
          variant,
          rounds: data.rounds,
          external: true,
        },
        roundIdx: 0,
        step: 0,
      };
      renderAll();
      toast('Протокол проверен движком: все ходы легальны');
    } catch (err) {
      toast(`Не удалось загрузить протокол: ${(err as Error).message}`, true);
    }
  }

  // --- Экраны (оверлей) -----------------------------------------------------------

  function renderOverlay(round: GameState): void {
    if (!match) return;
    if (round.phase === 'over' && showRoundOver) {
      renderRoundOver();
      return;
    }
    elOverlay.hidden = true;
  }

  function renderStartScreen(): void {
    const saved = loadSaved();
    const savedInfo =
      saved && !saved.outcome
        ? `<button class="btn ghost-btn" data-action="continue">Продолжить матч ${esc(
            saved.names[0],
          )} ${saved.totals[0]}:${saved.totals[1]} ${esc(saved.names[1])}</button>`
        : '';
    elOverlay.innerHTML = `
      <div class="card">
        <h1><span class="gold">B</span>onesai</h1>
        <p class="sub">Домино, в котором дерево растят и подрезают. Руки открыты, как в шахматах;
        единственная случайность — закрытый базар. Ходят по очереди за одним экраном.</p>
        <div class="field"><label for="inp-n0">Нижний игрок</label>
          <input id="inp-n0" type="text" value="Алексей" maxlength="16"></div>
        <div class="field"><label for="inp-n1">Верхний игрок</label>
          <input id="inp-n1" type="text" value="Олечка" maxlength="16"></div>
        <label class="check"><input id="inp-variant" type="checkbox">
          Вариант §11.1 «дубль только закрывает»: дубль нельзя ставить прямо — жёстче, с ловушками.
        </label>
        <hr class="sep">
        <div class="lot-result" id="lot-result">Жребий решает, кто ходит первым (§2.5)</div>
        <div class="lot-row" id="lot-row"></div>
        <div class="btn-row">
          <button class="btn" data-action="lot">Бросить жребий</button>
          <button class="btn" data-action="start" disabled id="btn-start">Начать матч</button>
          ${savedInfo}
        </div>
        <div class="btn-row">
          <button class="btn ghost-btn" data-action="load-protocol">Загрузить протокол для разбора…</button>
          <input id="inp-protocol" type="file" accept=".json,application/json" hidden>
        </div>
      </div>`;
    elOverlay.hidden = false;
  }

  let lotFirst: 0 | 1 | null = null;

  function rollLot(): void {
    // Жребий как в §2.5: тянем по кости, у кого сумма меньше — тот первый.
    // Чистая визуализация: на партию влияет только то, кто оказался первым.
    const set = fullSet();
    const a = set[Math.floor(Math.random() * set.length)]!;
    let b = a;
    while (pipSum(b) === pipSum(a)) {
      b = set[Math.floor(Math.random() * set.length)]!;
    }
    lotFirst = pipSum(a) < pipSum(b) ? 0 : 1;
    const n0 = ($('#inp-n0') as HTMLInputElement).value.trim() || 'Игрок 1';
    const n1 = ($('#inp-n1') as HTMLInputElement).value.trim() || 'Игрок 2';
    const ta = parseTile(a);
    const tb = parseTile(b);
    $('#lot-row').innerHTML = `
      <div class="lot-side ${lotFirst === 0 ? 'win' : ''}">
        ${tileSvgElement(tileFace(ta.hi, ta.lo, { shadow: 'flat' }), 92, { extraClass: 'lot-tile' })}
        <span>${esc(n0)} — ${pipSum(a)}</span>
      </div>
      <div class="lot-side ${lotFirst === 1 ? 'win' : ''}">
        ${tileSvgElement(tileFace(tb.hi, tb.lo, { shadow: 'flat' }), 92, { extraClass: 'lot-tile' })}
        <span>${esc(n1)} — ${pipSum(b)}</span>
      </div>`;
    $('#lot-result').innerHTML = `Меньшая сумма — первым ходит <b>${esc(
      lotFirst === 0 ? n0 : n1,
    )}</b>`;
    ($('#btn-start') as HTMLButtonElement).disabled = false;
  }

  function startNewMatch(): void {
    if (lotFirst === null) return;
    const n0 = ($('#inp-n0') as HTMLInputElement).value.trim() || 'Игрок 1';
    const n1 = ($('#inp-n1') as HTMLInputElement).value.trim() || 'Игрок 2';
    const variant = { doubleOnlyCloses: ($('#inp-variant') as HTMLInputElement).checked };
    match = startMatch({ names: [n0, n1], first: lotFirst, variant });
    selected = null;
    pileRoundKey = -1;
    showRoundOver = false;
    board.fit(false);
    persist();
    renderAll();
    toast(`Первым ходит ${nameOf(lotFirst)} — руки первого открыты с раздачи (§2.4)`);
  }

  function renderRoundOver(): void {
    if (!match) return;
    const round = match.round;
    const result = round.result!;
    const lastRound = match.rounds[match.rounds.length - 1]!;
    const causeTitle =
      result.cause === 'out' ? `Выход: ${esc(nameOf(result.winner as 0 | 1))}!` : 'Рыба!';
    const causeSub =
      result.cause === 'out'
        ? 'Последняя кость выставлена — рука пуста (§9.2).'
        : 'Кость не может поставить никто (§9.1). Считаем очки.';

    const rows = ([0, 1] as const)
      .map((p) => {
        const hand = round.hands[p];
        const tiles = hand
          .map((t) => {
            const pt = parseTile(t);
            return tileSvgElement(tileFace(pt.hi, pt.lo, { shadow: 'flat' }), 52);
          })
          .join('');
        const zeroZero = hand.length === 1 && hand[0] === '0-0';
        const added = result.added[p];
        return `
          <div class="result-name">${esc(nameOf(p))}</div>
          <div class="result-pts"><b>${result.sums[p]}</b> очк. ·
            ${added > 0 ? `<span class="plus">+${added}</span>` : '<span class="zero">+0</span>'}
          </div>
          <div class="result-tiles">${tiles || '<span class="result-note">рука пуста</span>'}</div>
          ${
            zeroZero
              ? '<p class="result-note" style="grid-column:1/-1">0:0 последней костью на руке — 25 очков (§10.2).</p>'
              : ''
          }`;
      })
      .join('');

    const outcome = match.outcome;
    let footer: string;
    const reviewRow = `
        <div class="btn-row">
          <button class="btn ghost-btn" data-action="history">История ходов</button>
          <button class="btn ghost-btn" data-action="download-protocol">Скачать протокол</button>
        </div>`;
    if (outcome) {
      const title =
        outcome.kind === 'draw'
          ? 'Ничья в матче — счёты равны (§10.5)'
          : `Победа в матче: ${esc(nameOf((1 - outcome.loser) as 0 | 1))}!`;
      footer = `
        <hr class="sep">
        <h2>${title}</h2>
        <div class="btn-row">
          <button class="btn" data-action="new-match">Новый матч</button>
        </div>${reviewRow}`;
    } else {
      const nextFirst = lastRound.winner ?? ((1 - lastRound.first) as 0 | 1);
      const why = lastRound.winner !== null ? 'победитель партии' : 'после ничьей роли меняются';
      footer = `
        <div class="btn-row">
          <button class="btn" data-action="next-round">Следующая партия</button>
          <span class="result-note">Первым ходит ${esc(nameOf(nextFirst))} — ${why} (§2.5).</span>
        </div>${reviewRow}`;
    }

    elOverlay.innerHTML = `
      <div class="card">
        <h2>${causeTitle}</h2>
        <p class="sub">${causeSub}${
          result.winner === null ? ' Суммы равны — очки получают оба (§10.3).' : ''
        }</p>
        <div class="result-grid">${rows}</div>
        <div class="match-score">${esc(nameOf(0))} ${match.totals[0]} : ${match.totals[1]} ${esc(
          nameOf(1),
        )}</div>
        ${footer}
      </div>`;
    elOverlay.hidden = false;
  }

  // --- Добор из базара с полётом кости ------------------------------------------

  function onPileClick(spriteIdx: number, spriteEl: HTMLElement): void {
    if (!match || match.round.phase === 'over') return;
    if (performance.now() - lastDispatchAt < 300) return;
    const round = match.round;
    const legal = legalMoves(round);
    if (!legal.some((m) => m.type === 'draw')) {
      elBoneyard.classList.remove('shake');
      void elBoneyard.offsetWidth;
      elBoneyard.classList.add('shake');
      const anyPlacement = legal.some((m) => m.type === 'place' || m.type === 'placeRoot');
      toast(
        anyPlacement
          ? 'Есть ход — брать из базара нельзя (§4.2)'
          : 'Сейчас тянуть нельзя',
        true,
      );
      return;
    }

    const drawer = round.current;
    const fromRect = spriteEl.getBoundingClientRect();
    // Спрайт гаснет до рендера: кликнутая кость исчезает из кучи, клон летит.
    const sprite = pileSprites[spriteIdx];
    if (sprite) sprite.alive = false;
    dispatch({ type: 'draw' });
    // Что вытянулось — из лога.
    const entry = match.round.log[match.round.log.length - 1];
    if (!entry || entry.kind !== 'draw') return;
    // Полёт: рубашка → лицо, из кучи в руку игрока.
    const toEl = drawer === 0 ? elHandBottom : elHandTop;
    const toRect = toEl.getBoundingClientRect();
    const pt = parseTile(entry.tile);
    const fly = document.createElement('div');
    fly.className = 'flying-tile';
    fly.innerHTML = tileSvgElement(tileFace(pt.hi, pt.lo, { shadow: 'flat' }), 88);
    fly.style.left = `${fromRect.left}px`;
    fly.style.top = `${fromRect.top}px`;
    document.body.appendChild(fly);
    const dx = toRect.left + toRect.width / 2 - fromRect.left - 44;
    const dy = toRect.top + toRect.height / 2 - fromRect.top - 22;
    requestAnimationFrame(() => {
      fly.style.transform = `translate(${dx}px, ${dy}px) rotate(360deg) scale(0.9)`;
      fly.style.opacity = '0.15';
    });
    // Скрыть новую кость в руке, пока летит клон.
    const handTile = toEl.querySelector<HTMLElement>(`[data-tile="${entry.tile}"]`);
    handTile?.classList.add('incoming');
    window.setTimeout(() => {
      fly.remove();
      handTile?.classList.remove('incoming');
    }, 430);
  }

  // --- События -------------------------------------------------------------------

  document.addEventListener('click', (ev) => {
    const target = ev.target as HTMLElement;

    const pile = target.closest<HTMLElement>('[data-pile]');
    if (pile) {
      if (!replay) onPileClick(Number(pile.dataset.pile), pile);
      return;
    }

    const handTile = target.closest<HTMLElement>('[data-tile]');
    if (handTile && !replay && match && match.round.phase !== 'over') {
      const tile = handTile.dataset.tile as TileId;
      const player = Number(handTile.dataset.player) as 0 | 1;
      const round = match.round;
      if (player !== round.current) return;
      if (round.mustPlay && tile !== round.mustPlay) {
        toast(
          round.phase === 'root'
            ? `Вытянутый дубль ${tileLabel(round.mustPlay)} обязан стать корнем (§5.3)`
            : `Обязаны сходить вытянутой костью ${tileLabel(round.mustPlay)} (§8.2)`,
          true,
        );
        return;
      }
      const legal = legalMoves(round);
      const mine = legal.filter(
        (m): m is Extract<Move, { tile: TileId }> => 'tile' in m && m.tile === tile,
      );
      if (mine.length === 0) {
        handTile.classList.remove('wiggle');
        void handTile.offsetWidth;
        handTile.classList.add('wiggle');
        return;
      }
      selected = selected === tile && !round.mustPlay ? null : tile;
      renderAll();
      return;
    }

    const actionEl = target.closest<HTMLElement>('[data-action]');
    if (actionEl) {
      const action = actionEl.dataset.action!;
      if (action === 'lot') rollLot();
      else if (action === 'start') startNewMatch();
      else if (action === 'continue') {
        const saved = loadSaved();
        if (saved) {
          match = saved;
          selected = null;
          pileRoundKey = -1;
          showRoundOver = match.round.phase === 'over';
          elOverlay.hidden = true;
          board.fit(false);
          renderAll();
        }
      } else if (action === 'next-round') {
        if (!match) return;
        match = nextRound(match, seedFromCrypto());
        selected = null;
        pileRoundKey = -1;
        showRoundOver = false;
        board.fit(false);
        persist();
        renderAll();
        toast(`Партия ${match.rounds.length + 1}: первым ходит ${nameOf(match.first)}`);
      } else if (action === 'new-match') {
        match = null;
        lotFirst = null;
        replay = null;
        localStorage.removeItem(LS_KEY);
        renderAll();
      } else if (action === 'history') {
        showRoundOver = false;
        openHistory();
      } else if (action === 'download-protocol') {
        downloadProtocol();
      } else if (action === 'load-protocol') {
        document.querySelector<HTMLInputElement>('#inp-protocol')?.click();
      } else if (action === 'replay-exit') {
        exitReplay();
      } else if (replay && action === 'replay-first') {
        replay.step = 0;
        renderAll();
      } else if (replay && action === 'replay-prev') {
        replay.step = Math.max(0, replay.step - 1);
        renderAll();
      } else if (replay && action === 'replay-next') {
        replay.step += 1; // клампится в renderReplayView
        renderAll();
      } else if (replay && action === 'replay-last') {
        replay.step = Number.MAX_SAFE_INTEGER; // клампится в renderReplayView
        renderAll();
      }
    }
  });

  // Ползунок и селект партии в панели истории; выбор файла протокола.
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement;
    if (t.id === 'replay-slider' && replay) {
      replay.step = Number(t.value);
      renderAll();
    }
  });

  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLInputElement;
    if (t.id === 'replay-round' && replay) {
      replay.roundIdx = Number(t.value);
      replay.step = 0;
      renderAll();
    } else if (t.id === 'inp-protocol' && t.files?.[0]) {
      void importProtocol(t.files[0]);
      t.value = '';
    }
  });

  elBtnHist.addEventListener('click', () => {
    if (replay) exitReplay();
    else openHistory();
  });

  elBtnMark.classList.toggle('active', markOwners);
  elBtnMark.addEventListener('click', () => {
    markOwners = !markOwners;
    elBtnMark.classList.toggle('active', markOwners);
    persistUi();
    renderAll();
    if (markOwners) {
      toast('Разметка ходов: кости первого игрока светлее, второго — темнее');
    }
  });

  elBtnFit.addEventListener('click', () => {
    board.fit();
    elBtnFit.classList.add('active');
  });

  elBtnNew.addEventListener('click', () => {
    if (match && !match.outcome) {
      if (!window.confirm('Бросить текущий матч и начать новый?')) return;
    }
    match = null;
    lotFirst = null;
    replay = null;
    localStorage.removeItem(LS_KEY);
    renderAll();
  });

  // --- Старт -----------------------------------------------------------------------

  try {
    renderAll();
  } catch (err) {
    // Последний рубеж: повреждённое сохранение или иная ошибка первого рендера
    // не должны оставлять пустой экран.
    console.error(err);
    match = null;
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
    renderAll();
  }
}
