// Контроллер приложения: экраны, руки, базар, оркестровка ходов.
// Горячее место за одной машиной (hot-seat): игроки ходят по очереди.

import {
  applyMove,
  finishRound,
  fullSet,
  handSum,
  isDouble,
  chooseBotMove,
  legalMoves,
  matchProtocol,
  moveEquals,
  shuffleLayout,
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
  type BotLevel,
  type Move,
  type RoundProtocol,
  type TileId,
  type Variant,
} from '../engine';
import { createBoard, samePlacement } from './board';
import { detectLocale, getLocale, L, LOCALES, setLocale, type Locale } from './i18n';
import { isSoundEnabled, playDraw, playPlace, playShuffle, setSoundEnabled } from './sound';
import { tileBack, tileDefs, tileFace, tileSvgElement } from './tile-svg';

const LS_KEY = 'bonesai-match-v1';
const LS_UI_KEY = 'bonesai-ui-v1';

/** Версия правил, которую реализует прототип (опубликована на Zenodo,
 *  DOI 10.5281/zenodo.21745035). */
const RULES_VERSION = '1.0';

/** Полный текст правил по языку интерфейса. */
const RULES_DOC_LANG: Record<Locale, string> = {
  ru: 'ru',
  en: 'en',
  es: 'es',
  de: 'de',
  pt: 'pt-BR',
  uk: 'uk',
  zh: 'zh',
};

function rulesDocUrl(): string {
  return `https://github.com/telesik/bonesai/blob/main/docs/RULES.${RULES_DOC_LANG[getLocale()]}.md`;
}

interface PileSprite {
  x: number;
  y: number;
  rot: number;
  alive: boolean;
}

// ---------------------------------------------------------------------------

/** Синхронное хранилище настроек и матча; по умолчанию — localStorage. */
export interface KVStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** Дополнительный пункт селектора соперника (регистрирует платформенная
 *  надстройка). id не должен совпадать с 'human'/'easy'/'normal'/'strong'. */
export interface OpponentOption {
  id: string;
  /** Локализованная подпись пункта: надстройка переводит сама. */
  label: () => string;
  /** Нужен ли жребий (§2.5). false — первого игрока определяет надстройка
   *  (например, общий seed сетевой партии); блок жребия скрывается. */
  needsLots?: boolean;
  /** Нужно ли имя второго игрока. false — поле скрыто (имя придёт извне). */
  needsSecondName?: boolean;
  /** Подпись кнопки старта вместо стандартной («Найти соперника…» и т.п.). */
  startLabel?: () => string;
  /** Подпись поля имени вместо «Нижний игрок» («Игровое имя» и т.п.). */
  nameLabel?: () => string;
}

/**
 * Переключатель настройки, которую умеет только платформа (например,
 * «не гасить экран»). Приложение рисует его на стартовом экране и хранит
 * состояние вместе с остальными настройками вида; что делать при
 * переключении — знает надстройка.
 */
export interface ExtraToggle {
  id: string;
  /** Локализованная подпись: надстройка переводит сама. */
  label: () => string;
  /** Значение при первом запуске, пока игрок ничего не выбрал. */
  initial: boolean;
  onChange(on: boolean): void;
}

/** Параметры старта матча, собранные стартовым экраном. */
export interface StartSetup {
  names: [string, string];
  first: 0 | 1;
  variant: Variant;
}

export interface AppOptions {
  /** Хранилище вместо localStorage (например, нативные Preferences). */
  storage?: KVStore;
  /** Открытие внешних ссылок (например, системным браузером вместо вкладки). */
  openExternal?: (url: string) => void;
  /** Вызывается после КАЖДОГО применённого хода — человека, бота и хода,
   *  пришедшего через handle.dispatch. Транспорт удалённой игры обязан
   *  фильтровать по месту хода, иначе получит эхо собственных ходов. */
  onMove?: (move: Move, round: GameState) => void;
  /** Дополнительные пункты селектора соперника. */
  opponentOptions?: readonly OpponentOption[];
  /** Дополнительные переключатели настроек от платформы. */
  extraToggles?: readonly ExtraToggle[];
  /** Старт матча с дополнительным пунктом селектора: стандартный старт не
   *  выполняется, матч запускает надстройка (например, через своё лобби). */
  onOpponentStart?: (id: string, setup: StartSetup) => void;
  /** Клик «следующая партия». Вернуть true — стандартный переход подавлен,
   *  надстройка выполнит его сама (handle.nextRoundWith с общим seed). */
  onNextRoundRequest?: () => boolean;
  /** Пользователь сбросил матч (новый матч поверх текущего): надстройке
   *  пора закрыть свои ресурсы (например, сетевую сессию). */
  onMatchReset?: () => void;
}

/** Управление приложением снаружи: вход внешних ходов и чтение состояния. */
export interface AppHandle {
  /** Применить ход (например, пришедший от удалённого игрока).
   *  Тихо игнорируется в режиме истории и при завершённой партии —
   *  вызывающий при необходимости сверяется с getMatch(). */
  dispatch(move: Move): void;
  getMatch(): MatchState | null;
  /** Назначить место, управляемое извне: в его ход локальный ввод
   *  заблокирован, ходы приходят через dispatch. null — снять. */
  setRemoteSeat(seat: 0 | 1 | null): void;
  /** Начать матч с внешним игроком: фиксированный общий seed, место
   *  соперника управляется извне. Закрывает стартовый экран. */
  startRemoteMatch(o: {
    names: [string, string];
    first: 0 | 1;
    variant: Variant;
    seed: number;
    remoteSeat: 0 | 1;
  }): void;
  /** Следующая партия с заданным seed (для синхронного перехода сторон). */
  nextRoundWith(seed: number): void;
  render(): void;
}

export function initApp(opts: AppOptions = {}): AppHandle {
  const store: KVStore = opts.storage ?? {
    get: (k) => localStorage.getItem(k),
    set: (k, v) => localStorage.setItem(k, v),
    remove: (k) => localStorage.removeItem(k),
  };

  // Дополнительные пункты соперника имеют смысл только вместе с обработчиком
  // старта: пункт без onOpponentStart делал бы кнопку старта молча мёртвой.
  const extraOpponents = opts.onOpponentStart ? (opts.opponentOptions ?? []) : [];
  const extraToggles = opts.extraToggles ?? [];
  /** Состояния переключателей платформы; ключ — id переключателя. */
  const toggleState = new Map<string, boolean>();
  // Общие SVG-определения (градиенты, тени) — один раз на документ:
  // на них ссылаются и стол, и кости в руках, и базар.
  const defsHost = document.createElement('div');
  defsHost.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  defsHost.innerHTML = `<svg width="0" height="0"><defs>${tileDefs()}</defs></svg>`;
  document.body.prepend(defsHost);

  // Бейдж версии в правом нижнем углу: версия приложения, версия правил
  // (ссылка на опубликованную запись) и коммит сборки — для разбора багов.
  const badge = document.createElement('div');
  badge.id = 'version-badge';
  document.body.appendChild(badge);

  function updateBadge(): void {
    // Версия целиком, включая суффикс фичи: во время разработки надо видеть,
    // какая ветка собрана (1.0.0-platform), а в релизе суффикса просто нет.
    badge.innerHTML =
      `${L().versionWord} ${__APP_VERSION__} (<a href="${rulesDocUrl()}" target="_blank" rel="noopener">` +
      `${L().rulesWord(RULES_VERSION)}</a>, hashCommit=${__GIT_HASH__})`;
  }

  // --- DOM ------------------------------------------------------------------
  const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => {
    const el = document.querySelector<T>(sel);
    if (!el) throw new Error(`Нет элемента ${sel}`);
    return el;
  };
  const elRoundChip = $('#round-chip');
  const elStatusEvent = $('#status-event');
  const elStatusPrompt = $('#status-prompt');
  const elHandTop = $('#hand-top');
  const elHandBottom = $('#hand-bottom');
  const elBoneyard = $('#boneyard');
  const elToast = $('#toast');
  const elOverlay = $('#overlay');
  const elHistoryBar = $('#history-bar');
  const elTutorBar = $('#tutor-bar');
  const elConfirmBar = $('#confirm-bar');
  const elBtnHist = $('#btn-hist');
  const elBtnMark = $('#btn-mark');
  const elBtnRelayout = $('#btn-relayout');
  const elBtnFit = $('#btn-fit');
  const elBtnNew = $('#btn-new');
  const svgBoard = document.querySelector<SVGSVGElement>('#board')!;

  // --- Состояние ---------------------------------------------------------------
  let match: MatchState | null = null;
  let selected: TileId | null = null;
  /** Ход, ожидающий подтверждения (режим подтверждения ходов). */
  let pending: Move | null = null;
  /** Момент выбора черновика: гасит случайный двойной клик как «подтверждение». */
  let pendingAt = 0;
  let pileSprites: PileSprite[] = [];
  let pileRoundKey = -1;
  let animateSeq: number | null = null;
  /** Кость, скрытая на столе, пока к месту летит её клон. */
  let flyingSeq: number | null = null;
  let flightCancel: (() => void) | null = null;
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
  // Ключ последней автопрокрутки руки — прокручиваем один раз на ход.
  let handAutoScrollKey = '';

  // Настройки вида (переживают перезагрузку).
  let markOwners = false;
  let autoFitOn = true;
  let soundOn = true;
  let handsVertical = true;
  let confirmOn = false;
  let tutorOn = false;
  /** Сколько партий доиграно за всё время — по ним предлагаем убрать подсказки. */
  let roundsDone = 0;
  /** Предложение выключить обучение делается один раз и больше не возвращается. */
  let tutorAsked = false;
  /** Сколько партий нужно доиграть, прежде чем предложить убрать подсказки. */
  const TUTOR_ENOUGH = 3;
  // Помимо встроенных значений допускает id пунктов из opts.opponentOptions.
  type OpponentPref = 'human' | BotLevel | (string & {});
  let opponentPref: OpponentPref = 'human';
  // Имена игроков переживают перезапуск (пустая строка = не задано).
  let savedP1 = '';
  let savedP2 = '';
  try {
    const prefs = JSON.parse(store.get(LS_UI_KEY) ?? '{}') as {
      markOwners?: boolean;
      autoFit?: boolean;
      sound?: boolean;
      locale?: string;
      handsVertical?: boolean;
      confirm?: boolean;
      tutor?: boolean;
      opponent?: string;
      p1Name?: string;
      p2Name?: string;
      toggles?: Record<string, boolean>;
      roundsDone?: number;
      tutorAsked?: boolean;
    };
    markOwners = !!prefs.markOwners;
    if (typeof prefs.p1Name === 'string') savedP1 = prefs.p1Name.slice(0, 16);
    if (typeof prefs.p2Name === 'string') savedP2 = prefs.p2Name.slice(0, 16);
    autoFitOn = prefs.autoFit !== false;
    soundOn = prefs.sound !== false;
    handsVertical = prefs.handsVertical !== false;
    confirmOn = !!prefs.confirm;
    tutorOn = !!prefs.tutor;
    roundsDone = Math.max(0, Math.trunc(prefs.roundsDone ?? 0));
    tutorAsked = !!prefs.tutorAsked;
    const validOpp = [
      'human',
      'easy',
      'normal',
      'strong',
      ...extraOpponents.map((o) => o.id),
    ];
    if (validOpp.includes(prefs.opponent ?? '')) {
      opponentPref = prefs.opponent as OpponentPref;
    }
    for (const t of extraToggles) {
      toggleState.set(t.id, prefs.toggles?.[t.id] ?? t.initial);
    }
    setLocale(detectLocale(prefs.locale ?? null));
  } catch {
    setLocale(detectLocale(null));
  }
  setSoundEnabled(soundOn);
  // Сохранённое состояние переключателей применяем сразу: иначе галочка
  // показывала бы одно, а платформа делала другое до первого переключения.
  for (const t of extraToggles) {
    if (!toggleState.has(t.id)) toggleState.set(t.id, t.initial);
    t.onChange(toggleState.get(t.id) === true);
  }

  function persistUi(): void {
    try {
      store.set(
        LS_UI_KEY,
        JSON.stringify({
          markOwners,
          autoFit: autoFitOn,
          sound: soundOn,
          locale: getLocale(),
          handsVertical,
          confirm: confirmOn,
          tutor: tutorOn,
          opponent: opponentPref,
          p1Name: savedP1,
          p2Name: savedP2,
          toggles: Object.fromEntries(toggleState),
          roundsDone,
          tutorAsked,
        }),
      );
    } catch {
      /* ignore */
    }
  }

  const board = createBoard(svgBoard, {
    onMove(move) {
      if (replay || notMyTurn()) return;
      if (performance.now() - lastDispatchAt < 300) return;
      // Режим подтверждения: клик по тени лишь выбирает ход; ставит его
      // повторный клик по той же тени или кнопка подтверждения.
      if (confirmOn && (move.type === 'place' || move.type === 'placeRoot')) {
        if (pending && samePlacement(move, pending)) {
          // Повторный клик подтверждает, но не раньше 350 мс после выбора:
          // иначе случайный двойной клик обходил бы весь смысл режима.
          if (performance.now() - pendingAt < 350) return;
          dispatch(pending);
        } else {
          pending = move;
          pendingAt = performance.now();
          renderAll();
        }
        return;
      }
      dispatch(move);
    },
    onViewChange(auto) {
      autoFitOn = auto;
      persistUi();
      elBtnFit.classList.toggle('active', auto);
    },
  });

  // --- Утилиты -----------------------------------------------------------------

  const nameOf = (p: 0 | 1): string =>
    match?.names[p] ?? (p === 0 ? L().defaultP1 : L().defaultP2);
  const tileLabel = (t: TileId): string => t.replace('-', ':');
  const esc = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function persist(): void {
    try {
      if (match) store.set(LS_KEY, JSON.stringify({ v: 2, match }));
    } catch {
      /* приватный режим — не страшно */
    }
  }

  function loadSaved(): MatchState | null {
    const drop = (): null => {
      try {
        store.remove(LS_KEY);
      } catch {
        /* ignore */
      }
      return null;
    };
    try {
      const raw = store.get(LS_KEY);
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
        Array.isArray(m.rounds) &&
        (m.bot == null ||
          ((m.bot.player === 0 || m.bot.player === 1) &&
            ['easy', 'normal', 'strong'].includes(m.bot.level)));
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

  // --- Бот и внешние места ----------------------------------------------------

  /** Место, управляемое извне (setRemoteSeat): его ходы приходят через
   *  handle.dispatch, локальный ввод в его ход заблокирован. */
  let remoteSeat: 0 | 1 | null = null;

  /**
   * Чья рука внизу экрана. В игре на двоих за одним экраном это всегда
   * первое место: игроки сидят рядом и смотрят на стол одинаково. В игре
   * с внешним соперником у каждого свой экран, и каждый должен видеть
   * СВОЮ руку снизу, а чужую сверху — как за настоящим столом напротив.
   */
  function bottomSeat(): 0 | 1 {
    return remoteSeat === null ? 0 : ((1 - remoteSeat) as 0 | 1);
  }

  /** Контейнер руки игрока с учётом того, кто сидит «снизу». */
  function handEl(player: 0 | 1): HTMLElement {
    return player === bottomSeat() ? elHandBottom : elHandTop;
  }

  /** Сейчас очередь бота (именно бота — его ход генерирует scheduleBotMove). */
  function botsTurnNow(): boolean {
    return (
      !replay &&
      !!match &&
      match.bot != null &&
      match.round.phase !== 'over' &&
      match.round.current === match.bot.player
    );
  }

  /** Сейчас ход не человека за этим экраном (бот или внешнее место):
   *  клики по игровым элементам недоступны. */
  function notMyTurn(): boolean {
    if (botsTurnNow()) return true;
    return (
      !replay &&
      !!match &&
      remoteSeat !== null &&
      match.round.phase !== 'over' &&
      match.round.current === remoteSeat
    );
  }

  let botTimer = 0;

  /** Ход бота с человеческой паузой. Вызывается после каждого рендера. */
  function scheduleBotMove(): void {
    clearTimeout(botTimer);
    if (!botsTurnNow()) return;
    botTimer = window.setTimeout(() => {
      if (!botsTurnNow() || !match) return;
      try {
        const move = chooseBotMove(match.round, {
          level: match.bot!.level,
          totals: match.totals,
        });
        if (move.type === 'draw') playDraw();
        dispatch(move);
      } catch (err) {
        console.error(err);
      }
    }, 750);
  }

  /**
   * Полёт кости из руки к месту установки. Цель пересчитывается каждый кадр:
   * автомасштаб в это же время может панорамировать и зумить стол.
   */
  function flyPlacement(seq: number, tile: TileId, from: DOMRect): void {
    flightCancel?.();
    flyingSeq = seq; // отменённый полёт мог сбросить флаг скрытия
    const pt = parseTile(tile);
    const clone = document.createElement('div');
    clone.className = 'flying-tile fly-place';
    clone.innerHTML = tileSvgElement(tileFace(pt.hi, pt.lo, { shadow: 'flat' }), 88);
    document.body.appendChild(clone);
    const start = { x: from.left + from.width / 2, y: from.top + from.height / 2 };
    const startAngle = handsVertical ? 90 : 0;
    const t0 = performance.now();
    const dur = 340;
    let raf = 0;
    const finish = (): void => {
      cancelAnimationFrame(raf);
      clone.remove();
      flyingSeq = null;
      flightCancel = null;
      document.querySelector(`.placed[data-seq="${seq}"]`)?.classList.remove('incoming');
    };
    flightCancel = finish;
    const frame = (): void => {
      const target = board.placedScreenPoint(seq);
      if (!target) {
        finish();
        return;
      }
      const t = Math.min(1, (performance.now() - t0) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      const x = start.x + (target.x - start.x) * e;
      const y = start.y + (target.y - start.y) * e;
      const angle = startAngle + (target.angle - startAngle) * e;
      const scale = 1 + (target.scale / 88 - 1) * e;
      clone.style.left = `${x - 44}px`;
      clone.style.top = `${y - 22}px`;
      clone.style.transform = `rotate(${angle}deg) scale(${scale.toFixed(3)})`;
      if (t >= 1) {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  // --- Основной диспетчер --------------------------------------------------------

  // Метка последнего применённого хода: гасит второй клик двойного клика,
  // прилетающий уже в перерисованный DOM (куча базара, призраки).
  let lastDispatchAt = 0;

  function dispatch(move: Move): void {
    if (replay || !match || match.round.phase === 'over') return;
    clearTimeout(autoPassTimer);
    // Точка старта полёта: кость в руке ходящего (до применения хода).
    let flyFrom: DOMRect | null = null;
    if (move.type === 'place' || move.type === 'placeRoot') {
      const cur = match.round.current;
      const el =
        document.querySelector(
          `.hand-tile[data-player="${cur}"][data-tile="${move.tile}"]`,
        ) ?? handEl(cur);
      flyFrom = el.getBoundingClientRect();
    }
    let round: GameState;
    try {
      round = applyMove(match.round, move);
    } catch (err) {
      console.error(err);
      return;
    }
    match = { ...match, round };
    selected = null;
    pending = null;
    lastDispatchAt = performance.now();
    animateSeq =
      move.type === 'place' || move.type === 'placeRoot' ? round.placed.length - 1 : null;
    if (animateSeq !== null) {
      playPlace(round.placed[animateSeq]!.kind);
    }

    if (round.phase === 'over') {
      match = finishRound(match);
      roundsDone++;
      persistUi();
      showRoundOver = false;
      clearTimeout(roundOverTimer);
      roundOverTimer = window.setTimeout(() => {
        showRoundOver = true;
        renderAll();
      }, 1100);
    }
    const placedSeq = animateSeq;
    if (placedSeq !== null && flyFrom) flyingSeq = placedSeq;
    persist();
    opts.onMove?.(move, round);
    renderAll();
    if (placedSeq !== null) {
      if (flyFrom) flyPlacement(placedSeq, round.placed[placedSeq]!.tile, flyFrom);
      // Автомасштаб сам держит всё в кадре; без него доводим кость минимальным
      // сдвигом — после перекладки дерева она могла уехать за край.
      if (!board.isAutoFit()) board.ensureVisible(placedSeq);
    }
  }

  // --- Рендер ----------------------------------------------------------------

  function renderAll(): void {
    if (replay) {
      elTutorBar.hidden = true;
      elConfirmBar.hidden = true;
      elBtnRelayout.hidden = true;
      renderReplayView();
      return;
    }
    elHistoryBar.hidden = true;
    elBtnHist.classList.remove('active');
    if (!match) {
      elTutorBar.hidden = true;
      elConfirmBar.hidden = true;
      elBtnRelayout.hidden = true;
      renderStartScreen();
      return;
    }
    const round = match.round;
    const legal = round.phase === 'over' ? [] : legalMoves(round);

    deriveSelection(round, legal);
    ensurePileSprites();
    renderTopbar(round);
    // В ход бота руки и куча не приглашают к действию: без классов
    // playable/can-draw — кликать всё равно нельзя.
    const legalUi = notMyTurn() ? [] : legal;
    renderHand(0, round, legalUi);
    renderHand(1, round, legalUi);
    renderBoneyard(round, legalUi);
    renderBoard(round, legal);
    renderTutorBar(round, legal);
    renderConfirmBar(round, legal);
    renderOverlay(round);
    scheduleAutoPass(round, legal);
    scheduleBotMove();
    animateSeq = null;
  }

  function deriveSelection(round: GameState, legal: readonly Move[]): void {
    if (round.phase === 'over' || notMyTurn()) {
      // В ход бота человеку нечего выбирать: без выделения, без призраков.
      selected = null;
      if (round.phase === 'over') return;
      if (pending) pending = null;
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
    // Черновик хода живёт, только пока выбрана его кость.
    if (pending && pending.type !== 'draw' && pending.type !== 'pass' && pending.tile !== selected) {
      pending = null;
    }
  }

  function renderTopbar(round: GameState): void {
    if (!match) return;
    elRoundChip.textContent = L().roundChip(
      match.rounds.length + (round.phase === 'over' ? 0 : 1),
    );
    const { event, prompt } = statusTexts(round);
    elStatusEvent.textContent = event;
    elStatusPrompt.innerHTML = prompt;
    elBtnFit.classList.toggle('active', board.isAutoFit());
    // Кнопка перекладки веток осмысленна, только когда есть повороты.
    elBtnRelayout.hidden = !round.placed.some((p) => p.kind === 'turn');
  }

  // Формулировки без глаголов прошедшего времени: имена игроков любого рода.
  function describeLog(e: LogEntry, names: readonly [string, string]): string {
    switch (e.kind) {
      case 'root':
        return L().logRoot(names[e.player], tileLabel(e.tile));
      case 'place': {
        const mode =
          e.mode === 'straight'
            ? L().modeStraight
            : e.mode === 'turn'
              ? L().modeTurn
              : L().modeCross;
        return L().logPlace(names[e.player], tileLabel(e.tile), mode);
      }
      case 'draw':
        return e.played ? L().logDrawPlayed(names[e.player]) : L().logDrawKept(names[e.player]);
      case 'pass':
        return L().logPass(names[e.player]);
      case 'end':
        return e.cause === 'fish' ? L().logFish : L().logOut;
    }
  }

  function statusTexts(round: GameState): { event: string; prompt: string } {
    const last = round.log[round.log.length - 1];
    const event = last ? describeLog(last, match!.names) : L().statusNewRound;
    if (round.phase === 'over') {
      return { event, prompt: L().statusRoundOver };
    }
    const name = `<b>${esc(nameOf(round.current))}</b>`;
    if (notMyTurn()) {
      return { event, prompt: L().statusBotThinking(name) };
    }
    if (round.phase === 'root') {
      if (round.mustPlay) {
        return { event, prompt: L().promptRootDrawn(name, tileLabel(round.mustPlay)) };
      }
      const hasDouble = round.hands[round.current].some(isDouble);
      return hasDouble
        ? { event, prompt: L().promptRootHasDouble(name) }
        : { event, prompt: L().promptRootNoDouble(name) };
    }
    if (round.mustPlay) {
      return { event, prompt: L().promptMustPlay(name, tileLabel(round.mustPlay)) };
    }
    const anyPlacement = legalMoves(round).some((m) => m.type === 'place');
    if (anyPlacement) {
      return { event, prompt: L().promptYourMove(name) };
    }
    return round.boneyard.length > 0
      ? { event, prompt: L().promptDraw(name) }
      : { event, prompt: L().promptPass(name) };
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
    const el = handEl(player);
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

    // Общий счёт матча — бейджем у имени (в шапке ему тесно на мобильных).
    const totalChip =
      !view && match
        ? `<span class="total-chip" data-tip="${L().tipTotal}">${match.totals[player]}</span>`
        : '';
    const meta = `
      <div class="hand-meta">
        <div class="hand-name">${
          isActive ? `<span class="turn-mark" title="${L().turnMarkTitle}">☞</span>` : ''
        }${
          round.first === player ? `<span class="first-chip">${L().firstChip}</span>` : ''
        }${esc(name)}${totalChip}</div>
        <div class="hand-sum">${
          hidden ? L().handMetaHidden(hand.length) : L().handMeta(hand.length, handSum(hand))
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
          ${tileSvgElement(inner, 86, { vertical: handsVertical })}
        </div>`;
      })
      .join('');

    const prevScroll = el.querySelector<HTMLElement>('.hand-tiles')?.scrollLeft ?? 0;
    el.innerHTML = `${meta}<div class="hand-tiles">${tiles}</div>`;

    // Перерисовка не должна сбрасывать ручную прокрутку руки…
    const cont = el.querySelector<HTMLElement>('.hand-tiles');
    if (cont) {
      cont.scrollLeft = prevScroll;
      // …а в начале своего хода рука мягко подъезжает к первой играбельной
      // кости, если та за краем (актуально для раздутых рук — добор §8).
      if (!view && isActive && playable.size > 0) {
        const key = `${match ? match.rounds.length : 0}:${round.log.length}:${player}`;
        if (handAutoScrollKey !== key) {
          handAutoScrollKey = key;
          const first = cont.querySelector<HTMLElement>('.hand-tile.playable');
          if (first) {
            const x =
              first.getBoundingClientRect().left -
              cont.getBoundingClientRect().left +
              cont.scrollLeft;
            const fits =
              x >= cont.scrollLeft + 4 &&
              x + first.offsetWidth <= cont.scrollLeft + cont.clientWidth - 4;
            if (!fits) {
              cont.scrollTo({ left: Math.max(0, x - 28), behavior: 'smooth' });
            }
          }
        }
      }
    }
  }

  function renderBoneyard(round: GameState, legal: readonly Move[]): void {
    const canDraw = legal.some((m) => m.type === 'draw');
    elBoneyard.classList.toggle('can-draw', canDraw);
    // Добор бота идёт мимо onPileClick — синхронизируем спрайты с базаром:
    // гасим первые живые, пока их не станет ровно столько, сколько костей.
    const need = 14 - round.boneyard.length;
    let deadNow = pileSprites.filter((s) => !s.alive).length;
    for (let i = 0; i < pileSprites.length && deadNow < need; i++) {
      if (pileSprites[i]!.alive) {
        pileSprites[i]!.alive = false;
        deadNow++;
      }
    }
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
    elBoneyard.innerHTML = `${tiles}<div class="pile-count">${L().pileCount(count)}</div>`;
  }

  function renderBoard(round: GameState, legal: readonly Move[]): void {
    // Поворот показываем двумя тенями — по одной на каждую сторону изгиба
    // (§6.3: на правила сторона не влияет, это выбор раскладки).
    const ghostMoves =
      selected === null
        ? []
        : legal
            .filter(
              (m) => (m.type === 'place' || m.type === 'placeRoot') && m.tile === selected,
            )
            .flatMap((m) =>
              m.type === 'place' && m.mode === 'turn'
                ? [
                    { ...m, side: 0 as const },
                    { ...m, side: 1 as const },
                  ]
                : [m],
            );
    board.render(round, {
      ghostMoves,
      selected,
      animateSeq,
      interactive: round.phase !== 'over',
      markOwners,
      pending,
      hideSeq: flyingSeq,
    });
  }

  // --- Режим обучения и подтверждение хода -----------------------------------------

  /** Подсказка режима обучения: что сейчас можно сделать и как. */
  function tutorText(round: GameState, legal: readonly Move[]): string {
    if (round.phase === 'over') return L().tutorOver;
    if (notMyTurn()) return L().tutorBotTurn;
    if (pending) return L().tutorPending;
    if (round.phase === 'root') {
      if (round.mustPlay) return L().tutorRootMustPlay;
      return round.hands[round.current].some(isDouble)
        ? L().tutorRootHasDouble
        : L().tutorRootNoDouble;
    }
    const placements = legal.filter(
      (m): m is Extract<Move, { type: 'place' }> => m.type === 'place',
    );
    if (placements.length === 0) {
      return round.boneyard.length > 0 ? L().tutorDraw : L().tutorPass;
    }
    const base = round.mustPlay ? L().tutorMustPlay : L().tutorPick;
    const hasTurn = placements.some(
      (m) => m.mode === 'turn' && (selected === null || m.tile === selected),
    );
    return hasTurn ? `${base} ${L().tutorTurnSides}` : base;
  }

  function renderTutorBar(round: GameState, legal: readonly Move[]): void {
    if (!tutorOn) {
      elTutorBar.hidden = true;
      return;
    }
    elTutorBar.textContent = tutorText(round, legal);
    elTutorBar.hidden = false;
  }

  function renderConfirmBar(round: GameState, legal: readonly Move[]): void {
    // Самолечение: черновик обязан оставаться легальным ходом (смена партии,
    // загрузка протокола и т.п. делают его устаревшим).
    if (pending && !legal.some((m) => moveEquals(m, pending!))) pending = null;
    if (!pending || round.phase === 'over') {
      elConfirmBar.hidden = true;
      return;
    }
    const q =
      pending.type === 'placeRoot'
        ? L().confirmRootAsk(tileLabel(pending.tile))
        : pending.type === 'place'
          ? L().confirmAsk(
              tileLabel(pending.tile),
              pending.mode === 'straight'
                ? L().modeStraight
                : pending.mode === 'turn'
                  ? L().modeTurn
                  : L().modeCross,
            )
          : '';
    elConfirmBar.innerHTML =
      `<span class="confirm-q">${esc(q)}</span>` +
      `<button id="confirm-yes" class="confirm-btn yes">${esc(L().confirmYes)}</button>` +
      `<button id="confirm-no" class="confirm-btn no">${esc(L().confirmNo)}</button>`;
    elConfirmBar.hidden = false;
  }

  elConfirmBar.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    if (t.id === 'confirm-yes' && pending) {
      dispatch(pending);
    } else if (t.id === 'confirm-no') {
      pending = null;
      renderAll();
    }
  });

  function scheduleAutoPass(round: GameState, legal: readonly Move[]): void {
    clearTimeout(autoPassTimer);
    if (round.phase === 'over') return;
    // Пас внешнего места не разыгрывается локально — он придёт через dispatch,
    // иначе обе стороны отправили бы его одновременно.
    if (remoteSeat !== null && round.current === remoteSeat) return;
    if (legal.length === 1 && legal[0]!.type === 'pass') {
      // Тост показываем один раз, но таймер перезаводим при каждом рендере:
      // любой промежуточный рендер сбрасывает clearTimeout выше.
      if (autoPassForLog !== round.log.length) {
        autoPassForLog = round.log.length;
        toast(L().toastPassAuto(nameOf(round.current)));
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
      toast(L().toastProtoBroken((err as Error).message), true);
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
    elRoundChip.textContent = L().viewChip(rp.roundIdx + 1, rp.data.rounds.length);
    elStatusEvent.textContent = rp.data.external ? L().historyExternal : L().historyLive;
    elStatusPrompt.innerHTML =
      rp.step === 0
        ? L().historyDeal(`<b>${esc(rp.data.names[round.first])}</b>`)
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
    elBoneyard.innerHTML = `${tiles.join('')}<div class="pile-count">${L().pileCount(count)}</div>`;
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
            ? L().roundOptDone(
                i + 1,
                res.cause === 'fish' ? L().causeFishShort : L().causeOutShort,
                res.sums[0],
                res.sums[1],
              )
            : L().roundOptLive(i + 1);
          return `<option value="${i}" ${i === rp.roundIdx ? 'selected' : ''}>${label}</option>`;
        })
        .join('');
      elHistoryBar.innerHTML = `
        <button class="icon-btn" data-action="replay-exit" data-tip="${L().tipExitReplay}">✕</button>
        <select id="replay-round" data-tip="${L().tipRoundSelect}">${options}</select>
        <button class="icon-btn" data-action="replay-first" data-tip="${L().tipToDeal}">⏮</button>
        <button class="icon-btn" data-action="replay-prev" data-tip="${L().tipStepBack}">◀</button>
        <input type="range" id="replay-slider" min="0" max="${total}" step="1" value="${rp.step}">
        <button class="icon-btn" data-action="replay-next" data-tip="${L().tipStepFwd}">▶</button>
        <button class="icon-btn" data-action="replay-last" data-tip="${L().tipToEnd}">⏭</button>
        <span id="replay-pos" class="replay-pos"></span>
        <button class="icon-btn" data-action="download-protocol" data-tip="${L().tipDownloadProto}">⭳</button>`;
    }
    const slider = document.querySelector<HTMLInputElement>('#replay-slider');
    if (slider && slider.value !== String(rp.step)) slider.value = String(rp.step);
    const pos = document.querySelector<HTMLElement>('#replay-pos');
    if (pos) pos.textContent = L().historyPos(rp.step, total);
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
    toast(L().toastProtoSaved);
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
        throw new Error(L().errNotProto);
      }
      const variant: Variant = { doubleOnlyCloses: !!data.variant?.doubleOnlyCloses };
      const check = validateProtocol({ ...data, variant });
      if (!check.ok) {
        throw new Error(L().errRoundBad(check.round + 1, check.error));
      }
      replay = {
        data: {
          names: [
            String(data.names?.[0] ?? L().defaultP1),
            String(data.names?.[1] ?? L().defaultP2),
          ],
          variant,
          rounds: data.rounds,
          external: true,
        },
        roundIdx: 0,
        step: 0,
      };
      renderAll();
      toast(L().toastProtoChecked);
    } catch (err) {
      toast(L().toastProtoLoadFail((err as Error).message), true);
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
    const curExtra = extraOpponents.find((o) => o.id === opponentPref);
    const wantLots = curExtra?.needsLots !== false;
    const wantSecondName = curExtra?.needsSecondName !== false;
    const saved = loadSaved();
    const savedInfo =
      saved && !saved.outcome
        ? `<button class="btn ghost-btn" data-action="continue">${L().btnContinue(
            `${esc(saved.names[0])} ${saved.totals[0]}:${saved.totals[1]} ${esc(saved.names[1])}`,
          )}</button>`
        : '';
    elOverlay.innerHTML = `
      <div class="card">
        <h1><span class="gold">B</span>onesai</h1>
        <p class="sub">${L().tagline}</p>
        <p class="sub rules-line"><a href="${rulesDocUrl()}" target="_blank" rel="noopener">${L().linkRules}</a></p>
        <div class="field"><label for="inp-n0">${
          esc(curExtra?.nameLabel?.() ?? '') || L().fieldBottom
        }</label>
          <input id="inp-n0" type="text" value="${esc(savedP1) || L().defaultP1}" maxlength="16"></div>
        ${
          wantSecondName
            ? `<div class="field"><label for="inp-n1">${L().fieldTop}</label>
          <input id="inp-n1" type="text" value="${
            opponentPref !== 'human' ? L().botName : esc(savedP2) || L().defaultP2
          }" maxlength="16"></div>`
            : ''
        }
        <div class="field"><label for="inp-opp">${L().fieldOpponent}</label>
          <select id="inp-opp" class="lang-select">
            ${(
              [
                ['human', L().oppHuman],
                ['easy', L().oppBotEasy],
                ['normal', L().oppBotNormal],
                ['strong', L().oppBotStrong],
                ...extraOpponents.map((o) => [o.id, esc(o.label())] as const),
              ] as readonly (readonly [string, string])[]
            )
              .map(
                ([v, label]) =>
                  `<option value="${v}" ${v === opponentPref ? 'selected' : ''}>${label}</option>`,
              )
              .join('')}
          </select></div>
        <label class="check"><input id="inp-variant" type="checkbox">
          ${L().variantText}
        </label>
        ${tutorOn ? `<p class="sub tutor-hint">${L().tutorStart}</p>` : ''}
        <hr class="sep">
        ${
          wantLots
            ? `<div class="lot-result" id="lot-result">${L().lotDecides}</div>
        <div class="lot-row" id="lot-row"></div>`
            : ''
        }
        <div class="btn-row">
          ${wantLots ? `<button class="btn" data-action="lot">${L().btnLot}</button>` : ''}
          <button class="btn" data-action="start" ${wantLots ? 'disabled' : ''} id="btn-start">${
            esc(curExtra?.startLabel?.() ?? '') || L().btnStart
          }</button>
          ${savedInfo}
        </div>
        <div class="btn-row">
          <!-- Стартовая карточка перекрывает шапку целиком, поэтому ⚙ отсюда
               не достать: вход в настройки нужен и здесь. Шестерёнка на самой
               кнопке — чтобы при случайно выбранном чужом языке игрок нашёл
               настройки по значку, не читая подпись. -->
          <button class="btn ghost-btn" data-action="settings-open">
            <svg class="btn-ico" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.07 5.27 L10.37 2.74 A 9.40 9.40 0 0 1 13.63 2.74 L13.93 5.27 A 7.00 7.00 0 0 1 15.39 5.88 L15.39 5.88 L17.39 4.30 A 9.40 9.40 0 0 1 19.70 6.61 L18.12 8.61 A 7.00 7.00 0 0 1 18.73 10.07 L18.73 10.07 L21.26 10.37 A 9.40 9.40 0 0 1 21.26 13.63 L18.73 13.93 A 7.00 7.00 0 0 1 18.12 15.39 L18.12 15.39 L19.70 17.39 A 9.40 9.40 0 0 1 17.39 19.70 L15.39 18.12 A 7.00 7.00 0 0 1 13.93 18.73 L13.93 18.73 L13.63 21.26 A 9.40 9.40 0 0 1 10.37 21.26 L10.07 18.73 A 7.00 7.00 0 0 1 8.61 18.12 L8.61 18.12 L6.61 19.70 A 9.40 9.40 0 0 1 4.30 17.39 L5.88 15.39 A 7.00 7.00 0 0 1 5.27 13.93 L5.27 13.93 L2.74 13.63 A 9.40 9.40 0 0 1 2.74 10.37 L5.27 10.07 A 7.00 7.00 0 0 1 5.88 8.61 L5.88 8.61 L4.30 6.61 A 9.40 9.40 0 0 1 6.61 4.30 L8.61 5.88 A 7.00 7.00 0 0 1 10.07 5.27 Z" />
              <circle cx="12" cy="12" r="3.1" />
            </svg>${L().settingsTitle}</button>
          <button class="btn ghost-btn" data-action="load-protocol">${L().btnLoadProto}</button>
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
    const n0 = ($('#inp-n0') as HTMLInputElement).value.trim() || L().defaultP1;
    const n1 = ($('#inp-n1') as HTMLInputElement).value.trim() || L().defaultP2;
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
    $('#lot-result').innerHTML = L().lotWinner(`<b>${esc(lotFirst === 0 ? n0 : n1)}</b>`);
    ($('#btn-start') as HTMLButtonElement).disabled = false;
  }

  function startNewMatch(): void {
    const curExtra = extraOpponents.find((o) => o.id === opponentPref);
    if (lotFirst === null && curExtra?.needsLots !== false) return;
    const n0 = ($('#inp-n0') as HTMLInputElement).value.trim() || L().defaultP1;
    const n1 =
      document.querySelector<HTMLInputElement>('#inp-n1')?.value.trim() || L().defaultP2;
    const variant = { doubleOnlyCloses: ($('#inp-variant') as HTMLInputElement).checked };
    const opp = opponentPref;
    const botLevel =
      opp === 'easy' || opp === 'normal' || opp === 'strong' ? (opp as BotLevel) : null;
    if (opp !== 'human' && botLevel === null) {
      // Дополнительный пункт селектора: матч запускает надстройка.
      opts.onOpponentStart?.(opp, { names: [n0, n1], first: lotFirst ?? 0, variant });
      return;
    }
    if (lotFirst === null) return;
    const bot = botLevel ? { player: 1 as const, level: botLevel } : null;
    remoteSeat = null;
    opts.onMatchReset?.();
    match = startMatch({ names: [n0, n1], first: lotFirst, variant, bot });
    selected = null;
    pending = null;
    pileRoundKey = -1;
    showRoundOver = false;
    enableAutoFit(false);
    persist();
    renderAll();
    playShuffle();
    toast(L().toastFirstOpen(nameOf(lotFirst)));
  }

  function renderRoundOver(): void {
    if (!match) return;
    const round = match.round;
    const result = round.result!;
    const lastRound = match.rounds[match.rounds.length - 1]!;
    const causeTitle =
      result.cause === 'out' ? L().resultOut(esc(nameOf(result.winner as 0 | 1))) : L().resultFish;
    const causeSub = result.cause === 'out' ? L().resultOutSub : L().resultFishSub;

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
          <div class="result-pts"><b>${result.sums[p]}</b> ${L().ptsShort} ·
            ${added > 0 ? `<span class="plus">+${added}</span>` : '<span class="zero">+0</span>'}
          </div>
          <div class="result-tiles">${
            tiles || `<span class="result-note">${L().resultEmptyHand}</span>`
          }</div>
          ${
            zeroZero
              ? `<p class="result-note" style="grid-column:1/-1">${L().resultZeroZero}</p>`
              : ''
          }`;
      })
      .join('');

    const outcome = match.outcome;
    let footer: string;
    const reviewRow = `
        <div class="btn-row">
          <button class="btn ghost-btn" data-action="history">${L().btnHistory}</button>
          <button class="btn ghost-btn" data-action="download-protocol">${L().btnDownloadProto}</button>
        </div>`;
    if (outcome) {
      const title =
        outcome.kind === 'draw'
          ? L().matchDraw
          : L().matchWin(esc(nameOf((1 - outcome.loser) as 0 | 1)));
      footer = `
        <hr class="sep">
        <h2>${title}</h2>
        <div class="btn-row">
          <button class="btn" data-action="new-match">${L().btnNewMatch}</button>
        </div>${reviewRow}`;
    } else {
      const nextFirst = lastRound.winner ?? ((1 - lastRound.first) as 0 | 1);
      const why = lastRound.winner !== null ? L().whyWinner : L().whySwap;
      footer = `
        <div class="btn-row">
          <button class="btn" data-action="next-round">${L().btnNextRound}</button>
          <span class="result-note">${L().nextFirstNote(esc(nameOf(nextFirst)), why)}</span>
        </div>${reviewRow}`;
    }

    // Подсказки нужны первые партии, дальше только мешают. Предлагаем убрать
    // их один раз и больше не возвращаемся к вопросу, каким бы ни был ответ.
    const tutorOffer =
      tutorOn && !tutorAsked && roundsDone >= TUTOR_ENOUGH
        ? `<hr class="sep">
        <p class="sub">${L().tutorEnough}</p>
        <div class="btn-row">
          <button class="btn" data-action="tutor-off">${L().btnTutorOff}</button>
          <button class="btn ghost-btn" data-action="tutor-keep">${L().btnTutorKeep}</button>
        </div>`
        : '';

    elOverlay.innerHTML = `
      <div class="card">
        <h2>${causeTitle}</h2>
        <p class="sub">${causeSub}${result.winner === null ? L().resultTieNote : ''}</p>
        <div class="result-grid">${rows}</div>
        <div class="match-score">${esc(nameOf(0))} ${match.totals[0]} : ${match.totals[1]} ${esc(
          nameOf(1),
        )}</div>
        ${footer}${tutorOffer}
      </div>`;
    elOverlay.hidden = false;
  }

  // --- Добор из базара с полётом кости ------------------------------------------

  function onPileClick(spriteIdx: number, spriteEl: HTMLElement): void {
    if (!match || match.round.phase === 'over') return;
    if (notMyTurn()) {
      toast(L().toastNoDrawNow, true);
      return;
    }
    if (performance.now() - lastDispatchAt < 300) return;
    const round = match.round;
    const legal = legalMoves(round);
    if (!legal.some((m) => m.type === 'draw')) {
      elBoneyard.classList.remove('shake');
      void elBoneyard.offsetWidth;
      elBoneyard.classList.add('shake');
      const anyPlacement = legal.some((m) => m.type === 'place' || m.type === 'placeRoot');
      toast(anyPlacement ? L().toastNoDrawHaveMove : L().toastNoDrawNow, true);
      return;
    }

    const drawer = round.current;
    const fromRect = spriteEl.getBoundingClientRect();
    // Спрайт гаснет до рендера: кликнутая кость исчезает из кучи, клон летит.
    const sprite = pileSprites[spriteIdx];
    if (sprite) sprite.alive = false;
    dispatch({ type: 'draw' });
    playDraw();
    // Что вытянулось — из лога.
    const entry = match.round.log[match.round.log.length - 1];
    if (!entry || entry.kind !== 'draw') return;
    // Полёт: рубашка → лицо, из кучи в руку игрока.
    const toEl = handEl(drawer);
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

    // Внешние ссылки: надстройка может открывать их по-своему
    // (например, системным браузером вместо вкладки WebView).
    const ext = target.closest<HTMLAnchorElement>('a[target="_blank"]');
    if (ext && opts.openExternal) {
      ev.preventDefault();
      opts.openExternal(ext.href);
      return;
    }

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
      if (player !== round.current || notMyTurn()) return;
      if (round.mustPlay && tile !== round.mustPlay) {
        toast(
          round.phase === 'root'
            ? L().toastMustRoot(tileLabel(round.mustPlay))
            : L().toastMustPlay(tileLabel(round.mustPlay)),
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
      // Выбор дубля под корень возвращает стол к стартовой позиции: тень
      // корня всегда в кадре, даже если стол смещали в прошлой партии.
      if (round.phase === 'root' && selected) enableAutoFit();
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
          pending = null;
          pileRoundKey = -1;
          showRoundOver = match.round.phase === 'over';
          elOverlay.hidden = true;
          board.setAutoFit(autoFitOn, false);
          renderAll();
        }
      } else if (action === 'next-round') {
        if (!match) return;
        // Надстройка может взять переход на себя (общий seed сетевой партии).
        if (opts.onNextRoundRequest?.() === true) return;
        match = nextRound(match, seedFromCrypto());
        selected = null;
        pending = null;
        pileRoundKey = -1;
        showRoundOver = false;
        enableAutoFit(false);
        persist();
        renderAll();
        playShuffle();
        toast(L().toastRoundStart(match.rounds.length + 1, nameOf(match.first)));
      } else if (action === 'new-match') {
        match = null;
        lotFirst = null;
        replay = null;
        pending = null;
        remoteSeat = null;
        store.remove(LS_KEY);
        opts.onMatchReset?.();
        renderAll();
      } else if (action === 'settings-open') {
        openSettings(true);
      } else if (action === 'tutor-off' || action === 'tutor-keep') {
        // Спрашиваем один раз: пометка ставится при любом ответе.
        tutorAsked = true;
        if (action === 'tutor-off') tutorOn = false;
        persistUi();
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
    } else if (t.id === 'inp-n0' || t.id === 'inp-n1') {
      // Имена запоминаются между запусками; автоимена ботов не сохраняем.
      const v = t.value.trim().slice(0, 16);
      if (t.id === 'inp-n0') savedP1 = v;
      else if (v !== L().botName) savedP2 = v;
      persistUi();
    } else if (t.id === 'inp-opp') {
      opponentPref = t.value as OpponentPref;
      persistUi();
      // Форма зависит от пункта (жребий, второе имя) — перестраиваем экран,
      // сохранив введённое имя нижнего игрока и галочку варианта.
      const n0 = document.querySelector<HTMLInputElement>('#inp-n0')?.value;
      const varOn = document.querySelector<HTMLInputElement>('#inp-variant')?.checked;
      renderStartScreen();
      const n0el = document.querySelector<HTMLInputElement>('#inp-n0');
      if (n0el && n0 !== undefined) n0el.value = n0;
      const varEl = document.querySelector<HTMLInputElement>('#inp-variant');
      if (varEl && varOn !== undefined) varEl.checked = varOn;
      // Имя верхнего игрока меняем только если оно осталось автоподставленным.
      const n1 = document.querySelector<HTMLInputElement>('#inp-n1');
      if (n1) {
        const autoNames = [L().botName, L().defaultP2];
        if (autoNames.includes(n1.value.trim()) || n1.value.trim() === '') {
          n1.value = opponentPref !== 'human' ? L().botName : L().defaultP2;
        }
      }
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

  /** Включить автомасштаб программно (новая партия, выбор корня). */
  function enableAutoFit(animate = true): void {
    autoFitOn = true;
    persistUi();
    board.setAutoFit(true, animate);
    elBtnFit.classList.add('active');
  }

  // Ручная перекладка веток: другая валидная раскладка того же дерева (§6.3).
  let relayoutSalt = 0;
  elBtnRelayout.addEventListener('click', () => {
    if (!match || replay || match.round.phase === 'over') return;
    const next = shuffleLayout(match.round, ++relayoutSalt);
    if (!next) return;
    match = { ...match, round: next };
    persist();
    renderAll();
    if (!board.isAutoFit()) board.ensureVisible(match.round.placed.length - 1);
  });

  // Галочка «автомасштаб»: включена — держим всё дерево в кадре.
  elBtnFit.addEventListener('click', () => {
    autoFitOn = !autoFitOn;
    board.setAutoFit(autoFitOn);
    elBtnFit.classList.toggle('active', autoFitOn);
    persistUi();
  });

  // --- Экран настроек ---------------------------------------------------------
  // Настройки, которые ставят один раз, собраны в одном месте с подписями:
  // безымянные значки в шапке не объяснить, а на телефоне и подсказку по
  // наведению не показать.

  const elSettings = document.createElement('div');
  elSettings.id = 'settings';
  elSettings.hidden = true;
  document.body.appendChild(elSettings);

  function renderSettings(): void {
    const row = (id: string, on: boolean, text: string): string =>
      `<label class="check"><input data-set="${id}" type="checkbox" ${
        on ? 'checked' : ''
      }>${text}</label>`;
    elSettings.innerHTML = `
      <div class="card" style="max-width:460px;width:100%">
        <h1 style="font-size:22px">${L().settingsTitle}</h1>
        <div class="field"><label for="set-lang">${L().fieldLang}</label>
          <select id="set-lang" class="lang-select">${LOCALES.map(
            ({ code, label }) =>
              `<option value="${code}" ${code === getLocale() ? 'selected' : ''}>${label}</option>`,
          ).join('')}</select></div>
        <hr class="sep">
        ${row('sound', soundOn, L().tipSound)}
        ${row('tutor', tutorOn, L().tipTutor)}
        ${row('confirm', confirmOn, L().tipConfirm)}
        ${row('hands', handsVertical, L().tipOrient)}
        ${extraToggles
          .map((t) => row(`x:${t.id}`, toggleState.get(t.id) === true, esc(t.label())))
          .join('')}
        <div class="btn-row"><button class="btn" data-action="settings-close">${
          L().btnDone
        }</button></div>
      </div>`;
  }

  function openSettings(on: boolean): void {
    if (on) renderSettings();
    elSettings.hidden = !on;
  }

  elSettings.addEventListener('change', (ev) => {
    const el = ev.target as HTMLInputElement | HTMLSelectElement;
    if (el.id === 'set-lang') {
      setLocale((el as HTMLSelectElement).value as Locale);
      persistUi();
      applyStaticTexts();
      renderSettings();
      renderAll();
      return;
    }
    const id = (el as HTMLInputElement).dataset.set;
    if (!id) return;
    const on = (el as HTMLInputElement).checked;
    if (id.startsWith('x:')) {
      const toggle = extraToggles.find((t) => t.id === id.slice(2));
      if (!toggle) return;
      toggleState.set(toggle.id, on);
      persistUi();
      toggle.onChange(on);
      return;
    }
    if (id === 'sound') {
      soundOn = on;
      setSoundEnabled(on);
      if (on) playPlace('straight');
    } else if (id === 'tutor') {
      tutorOn = on;
    } else if (id === 'confirm') {
      confirmOn = on;
      if (!on) pending = null;
    } else if (id === 'hands') {
      handsVertical = on;
    }
    persistUi();
    renderAll();
  });

  elSettings.addEventListener('click', (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (el?.dataset.action === 'settings-close') openSettings(false);
  });

  $('#btn-settings').addEventListener('click', () => openSettings(elSettings.hidden));

  elBtnNew.addEventListener('click', () => {
    if (match && !match.outcome) {
      if (!window.confirm(L().confirmNewMatch)) return;
    }
    match = null;
    lotFirst = null;
    replay = null;
    pending = null;
    remoteSeat = null;
    store.remove(LS_KEY);
    opts.onMatchReset?.();
    renderAll();
  });

  /** Локализуемые статические элементы: подсказки кнопок, бейдж, селект языка. */
  function applyStaticTexts(): void {
    elBtnHist.dataset.tip = L().tipHistory;
    elBtnMark.dataset.tip = L().tipMark;
    elBtnFit.dataset.tip = L().tipFit;
    elBtnNew.dataset.tip = L().tipNew;
    elBtnRelayout.dataset.tip = L().tipRelayout;
    $('#btn-settings').dataset.tip = L().settingsTitle;
    updateBadge();
  }

  // --- Старт -----------------------------------------------------------------------

  applyStaticTexts();
  elBtnFit.classList.toggle('active', autoFitOn);
  board.setAutoFit(autoFitOn, false);

  try {
    renderAll();
  } catch (err) {
    // Последний рубеж: повреждённое сохранение или иная ошибка первого рендера
    // не должны оставлять пустой экран.
    console.error(err);
    match = null;
    try {
      store.remove(LS_KEY);
    } catch {
      /* ignore */
    }
    renderAll();
  }

  return {
    // Внешний ход важнее просмотра истории: иначе ход, пришедший while
    // открыт режим истории, молча терялся бы (dispatch в replay — no-op).
    dispatch: (m) => {
      if (replay) exitReplay();
      dispatch(m);
    },
    getMatch: () => match,
    setRemoteSeat(seat) {
      remoteSeat = seat;
      renderAll();
    },
    startRemoteMatch(o) {
      match = startMatch({
        names: o.names,
        first: o.first,
        variant: o.variant,
        seed: o.seed,
        bot: null,
      });
      remoteSeat = o.remoteSeat;
      selected = null;
      pending = null;
      pileRoundKey = -1;
      showRoundOver = false;
      lotFirst = null;
      elOverlay.hidden = true;
      enableAutoFit(false);
      persist();
      renderAll();
      playShuffle();
      toast(L().toastFirstOpen(nameOf(o.first)));
    },
    nextRoundWith(seed) {
      if (!match || match.outcome) return;
      match = nextRound(match, seed);
      selected = null;
      pending = null;
      pileRoundKey = -1;
      showRoundOver = false;
      enableAutoFit(false);
      persist();
      renderAll();
      playShuffle();
      toast(L().toastRoundStart(match.rounds.length + 1, nameOf(match.first)));
    },
    render: renderAll,
  };
}
