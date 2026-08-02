// Локализация интерфейса. Русский — первичный текст (как и правила);
// остальные словари обязаны совпадать по ключам (проверяется типом Dict).
// Ссылки на параграфы (§) едины во всех языках — нумерация RULES.md
// и RULES.en.md совпадает один в один.

export type Locale = 'ru' | 'en' | 'es' | 'de' | 'pt' | 'uk' | 'zh';

export const LOCALES: ReadonlyArray<{ code: Locale; label: string }> = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português (BR)' },
  { code: 'uk', label: 'Українська' },
  { code: 'zh', label: '中文' },
];

/** Русское склонение: 1 кость, 2 кости, 5 костей. */
function ruTiles(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} кость`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} кости`;
  return `${n} костей`;
}

const ru = {
  // Стартовый экран
  tagline:
    'Домино, в котором дерево растят и подрезают. Руки открыты, как в шахматах; ' +
    'единственная случайность — закрытый базар. Ходят по очереди за одним экраном.',
  fieldBottom: 'Нижний игрок',
  fieldTop: 'Верхний игрок',
  fieldLang: 'Язык',
  defaultP1: 'Игрок 1',
  defaultP2: 'Игрок 2',
  variantText:
    'Вариант §11.1 «дубль только закрывает»: дубль нельзя ставить прямо — жёстче, с ловушками.',
  lotDecides: 'Жребий решает, кто ходит первым (§2.5)',
  lotWinner: (name: string) => `Меньшая сумма — первым ходит ${name}`,
  btnLot: 'Бросить жребий',
  btnStart: 'Начать матч',
  btnContinue: (label: string) => `Продолжить матч ${label}`,
  btnLoadProto: 'Загрузить протокол для разбора…',

  // Шапка
  roundChip: (n: number) => `партия ${n}`,
  viewChip: (i: number, n: number) => `просмотр · партия ${i} из ${n}`,
  tipHistory: 'История ходов: перемотка сыгранных партий',
  tipMark: 'Разметить принадлежность ходов: кости первого игрока светлее, второго — темнее',
  tipFit: 'Автомасштаб: держать всю фигуру в кадре (двойной клик по столу — включить)',
  tipOrient: 'Кости в руке: вертикально или горизонтально',
  tipTotal: 'Общий счёт матча (§10.5)',
  tipSound: 'Звук выставления костей',
  tipNew: 'Начать новый матч',
  tipLang: 'Язык интерфейса',
  confirmNewMatch: 'Бросить текущий матч и начать новый?',

  // Статусы
  statusNewRound: 'Новая партия',
  statusRoundOver: 'Партия окончена',
  promptRootHasDouble: (name: string) => `${name}: выставьте дубль — он станет корнем партии`,
  promptRootNoDouble: (name: string) => `${name}: дубля нет — возьмите кость из базара`,
  promptRootDrawn: (name: string, tile: string) =>
    `${name}: вытянут дубль ${tile} — он становится корнем`,
  promptMustPlay: (name: string, tile: string) =>
    `${name}: кость ${tile} подходит — обязаны сходить ею`,
  promptYourMove: (name: string) => `${name}: ваш ход — выберите кость и место`,
  promptDraw: (name: string) => `${name}: сходить нечем — возьмите кость из базара`,
  promptPass: (name: string) => `${name}: сходить нечем, базар пуст — пас`,

  // Журнал ходов (без глаголов прошедшего времени — имена любого рода)
  logRoot: (name: string, tile: string) => `${name}: корень ${tile}`,
  logPlace: (name: string, tile: string, mode: string) => `${name}: ${tile} ${mode}`,
  modeStraight: 'прямо',
  modeTurn: 'на поворот',
  modeCross: 'поперёк — ветка закрыта',
  logDrawPlayed: (name: string) => `${name}: кость из базара — подходит!`,
  logDrawKept: (name: string) => `${name}: кость из базара — в руку, ход дальше`,
  logPass: (name: string) => `${name}: пас`,
  logFish: 'Рыба!',
  logOut: 'Выход!',

  // Тосты
  toastNoDrawHaveMove: 'Есть ход — брать из базара нельзя (§4.2)',
  toastNoDrawNow: 'Сейчас тянуть нельзя',
  toastMustRoot: (tile: string) => `Вытянутый дубль ${tile} обязан стать корнем (§5.3)`,
  toastMustPlay: (tile: string) => `Обязаны сходить вытянутой костью ${tile} (§8.2)`,
  toastPassAuto: (name: string) => `У ${name} нет хода — пас`,
  toastFirstOpen: (name: string) =>
    `Первым ходит ${name} — руки первого открыты с раздачи (§2.4)`,
  toastRoundStart: (n: number, name: string) => `Партия ${n}: первым ходит ${name}`,
  toastMarkOwners: 'Разметка ходов: кости первого игрока светлее, второго — темнее',
  toastProtoSaved: 'Протокол сохранён файлом JSON',
  toastProtoChecked: 'Протокол проверен движком: все ходы легальны',
  toastProtoLoadFail: (err: string) => `Не удалось загрузить протокол: ${err}`,
  toastProtoBroken: (err: string) => `Протокол не воспроизводится: ${err}`,
  errNotProto: 'это не протокол Bonesai',
  errRoundBad: (n: number, err: string) => `партия ${n} не воспроизводится (${err})`,

  // Руки
  firstChip: 'первый',
  turnMarkTitle: 'Ходит',
  handMeta: (n: number, pts: number) => `${ruTiles(n)} · ${pts} очк.`,
  handMetaHidden: (n: number) => `${ruTiles(n)} · рука закрыта до первого хода`,

  // Базар
  pileCount: (n: number) => `базар: ${n}`,

  // Итоги партии
  resultFish: 'Рыба!',
  resultOut: (name: string) => `Выход: ${name}!`,
  resultFishSub: 'Кость не может поставить никто (§9.1). Считаем очки.',
  resultOutSub: 'Последняя кость выставлена — рука пуста (§9.2).',
  resultTieNote: ' Суммы равны — очки получают оба (§10.3).',
  resultEmptyHand: 'рука пуста',
  resultZeroZero: '0:0 последней костью на руке — 25 очков (§10.2).',
  ptsShort: 'очк.',
  matchWin: (name: string) => `Победа в матче: ${name}!`,
  matchDraw: 'Ничья в матче — счёты равны (§10.5)',
  btnNextRound: 'Следующая партия',
  btnNewMatch: 'Новый матч',
  btnHistory: 'История ходов',
  btnDownloadProto: 'Скачать протокол',
  nextFirstNote: (name: string, why: string) => `Первым ходит ${name} — ${why} (§2.5).`,
  whyWinner: 'победитель партии',
  whySwap: 'после ничьей роли меняются',

  // История
  historyLive: 'История ходов матча',
  historyExternal: 'Просмотр загруженного протокола',
  historyDeal: (name: string) => `Раздача — первым ходит ${name}`,
  historyPos: (k: number, m: number) => `ход ${k}/${m}`,
  roundOptDone: (n: number, cause: string, s0: number, s1: number) =>
    `Партия ${n} — ${cause}, ${s0}:${s1}`,
  roundOptLive: (n: number) => `Партия ${n} — идёт`,
  causeFishShort: 'рыба',
  causeOutShort: 'выход',
  tipExitReplay: 'Вернуться к игре',
  tipRoundSelect: 'Выбор партии матча',
  tipToDeal: 'К раздаче',
  tipStepBack: 'Ход назад',
  tipStepFwd: 'Ход вперёд',
  tipToEnd: 'К концу партии',
  tipDownloadProto: 'Скачать протокол партий (JSON)',

  // Стол
  ghostRoot: 'Корень',
  ghostStraight: 'Прямо',
  ghostTurn: 'На поворот',
  ghostCross: 'Закрыть ветку',
  endOpen: (v: number) => `Открытый конец «${v}»`,
  endFresh: (v: number) => `Свежий конец «${v}»: первую кость — только прямо (§6.4)`,
  endDead: (v: number) => `Мёртвый конец «${v}»: все семь костей с этим числом уже на столе`,
  tileRootSuffix: ' — корень',
  tileClosedSuffix: ' — ветка закрыта',
  ownerFirst: 'первый игрок',
  ownerSecond: 'второй игрок',

  // Подтверждение хода и режим обучения
  tipConfirm: 'Подтверждение хода: клик по тени только выбирает ход, кость ставится после подтверждения',
  tipTutor: 'Режим обучения: подсказки, какие ходы возможны и как их сделать',
  confirmAsk: (tile: string, mode: string) => `Поставить ${tile} ${mode}?`,
  confirmRootAsk: (tile: string) => `Выставить корень ${tile}?`,
  confirmYes: 'Поставить',
  confirmNo: 'Отмена',
  tutorRootHasDouble:
    'Кликните дубль в руке, затем пунктирный след в центре стола. Дубль обязан стать корнем — от него растёт дерево (§5.2, §6.2).',
  tutorRootNoDouble:
    'Дубля на руке нет — кликните кучу базара и возьмите кость (§5.3). Попадётся дубль — он сразу станет корнем.',
  tutorRootMustPlay:
    'Вытянутый дубль обязан стать корнем (§5.3) — кликните след в центре стола.',
  tutorPick:
    'Кликните светлую кость в руке — на столе появятся тени её ходов. Прямо продолжает ветку (§6.3); на поворот создаёт развилку, оба конца которой свежие — на свежий первую кость можно только прямо (§6.4); поперёк дубль закрывает ветку навсегда (§7.1). Цифры в кружках — открытые концы, перечёркнутые — мёртвые (§9.1).',
  tutorTurnSides:
    'У поворота две тени: в какую сторону изогнуть ветку. На правила выбор не влияет (§6.3), но помогает дереву не разрастаться.',
  tutorMustPlay:
    'Кость из базара подошла — обязаны сходить именно ею (§8.2): кликните одну из теней.',
  tutorDraw:
    'Сходить нечем — кликните кучу базара (§8.2). Кость подойдёт — обязаны сходить ею; нет — останется в руке, ход перейдёт.',
  tutorPass: 'Сходить нечем, базар пуст — ход пропускается сам (§8.3).',
  tutorOver:
    'Партия окончена: очки получает тот, у кого сумма на руках больше (§10.3). Матч проигрывает набравший 100 (§10.5).',
  tutorPending:
    'Проверьте выбранный ход: поставить — кнопкой или повторным кликом по тени; передумали — отмена или другая тень.',

  // Бейдж версии
  versionWord: 'версия',
  rulesWord: (v: string) => `правила ${v}`,
};

export type Dict = typeof ru;

const en: Dict = {
  tagline:
    'Dominoes where you grow and prune a tree. Hands are open like in chess; ' +
    'the only randomness is the face-down boneyard. Two players take turns at one screen.',
  fieldBottom: 'Bottom player',
  fieldTop: 'Top player',
  fieldLang: 'Language',
  defaultP1: 'Player 1',
  defaultP2: 'Player 2',
  variantText:
    'Variant §11.1 “a double only closes”: a double cannot be played straight — harsher, with traps.',
  lotDecides: 'A draw of lots decides who moves first (§2.5)',
  lotWinner: (name) => `Lower total — ${name} moves first`,
  btnLot: 'Draw lots',
  btnStart: 'Start match',
  btnContinue: (label) => `Resume match ${label}`,
  btnLoadProto: 'Load a protocol for review…',

  roundChip: (n) => `game ${n}`,
  viewChip: (i, n) => `review · game ${i} of ${n}`,
  tipHistory: 'Move history: replay the games',
  tipMark: 'Mark move ownership: first player’s tiles lighter, second’s darker',
  tipFit: 'Auto-zoom: keep the whole tree in view (double-click the table to enable)',
  tipOrient: 'Hand tiles: vertical or horizontal',
  tipTotal: 'Match total (§10.5)',
  tipSound: 'Tile placement sound',
  tipNew: 'Start a new match',
  tipLang: 'Interface language',
  confirmNewMatch: 'Abandon the current match and start a new one?',

  statusNewRound: 'New game',
  statusRoundOver: 'Game over',
  promptRootHasDouble: (name) => `${name}: play a double — it becomes the root`,
  promptRootNoDouble: (name) => `${name}: no double — draw a tile from the boneyard`,
  promptRootDrawn: (name, tile) => `${name}: drew double ${tile} — it becomes the root`,
  promptMustPlay: (name, tile) => `${name}: tile ${tile} fits — you must play it`,
  promptYourMove: (name) => `${name}: your move — pick a tile and a spot`,
  promptDraw: (name) => `${name}: no move — draw a tile from the boneyard`,
  promptPass: (name) => `${name}: no move, boneyard is empty — pass`,

  logRoot: (name, tile) => `${name}: root ${tile}`,
  logPlace: (name, tile, mode) => `${name}: ${tile} ${mode}`,
  modeStraight: 'straight',
  modeTurn: 'as a turn',
  modeCross: 'crosswise — branch closed',
  logDrawPlayed: (name) => `${name}: drew from the boneyard — it fits!`,
  logDrawKept: (name) => `${name}: drew from the boneyard — kept, turn passes`,
  logPass: (name) => `${name}: pass`,
  logFish: 'Blocked!',
  logOut: 'Out!',

  toastNoDrawHaveMove: 'You have a move — drawing is not allowed (§4.2)',
  toastNoDrawNow: 'You cannot draw now',
  toastMustRoot: (tile) => `The drawn double ${tile} must become the root (§5.3)`,
  toastMustPlay: (tile) => `You must play the drawn tile ${tile} (§8.2)`,
  toastPassAuto: (name) => `${name} has no move — pass`,
  toastFirstOpen: (name) => `${name} moves first — the first hand is open from the deal (§2.4)`,
  toastRoundStart: (n, name) => `Game ${n}: ${name} moves first`,
  toastMarkOwners: 'Move marking: first player’s tiles lighter, second’s darker',
  toastProtoSaved: 'Protocol saved as JSON',
  toastProtoChecked: 'Protocol verified by the engine: all moves are legal',
  toastProtoLoadFail: (err) => `Failed to load the protocol: ${err}`,
  toastProtoBroken: (err) => `The protocol does not replay: ${err}`,
  errNotProto: 'this is not a Bonesai protocol',
  errRoundBad: (n, err) => `game ${n} does not replay (${err})`,

  firstChip: 'first',
  turnMarkTitle: 'To move',
  handMeta: (n, pts) => `${n} tile${n === 1 ? '' : 's'} · ${pts} pts`,
  handMetaHidden: (n) => `${n} tile${n === 1 ? '' : 's'} · hidden until the first move`,

  pileCount: (n) => `boneyard: ${n}`,

  resultFish: 'Blocked!',
  resultOut: (name) => `Out: ${name}!`,
  resultFishSub: 'Nobody can place a tile (§9.1). Counting points.',
  resultOutSub: 'The last tile is placed — the hand is empty (§9.2).',
  resultTieNote: ' Equal totals — both score (§10.3).',
  resultEmptyHand: 'hand is empty',
  resultZeroZero: '0:0 as the last tile in hand counts 25 (§10.2).',
  ptsShort: 'pts',
  matchWin: (name) => `Match victory: ${name}!`,
  matchDraw: 'Match drawn — equal totals (§10.5)',
  btnNextRound: 'Next game',
  btnNewMatch: 'New match',
  btnHistory: 'Move history',
  btnDownloadProto: 'Download protocol',
  nextFirstNote: (name, why) => `${name} moves first — ${why} (§2.5).`,
  whyWinner: 'winner of the game',
  whySwap: 'roles swap after a tie',

  historyLive: 'Match move history',
  historyExternal: 'Reviewing a loaded protocol',
  historyDeal: (name) => `Deal — ${name} moves first`,
  historyPos: (k, m) => `move ${k}/${m}`,
  roundOptDone: (n, cause, s0, s1) => `Game ${n} — ${cause}, ${s0}:${s1}`,
  roundOptLive: (n) => `Game ${n} — in progress`,
  causeFishShort: 'blocked',
  causeOutShort: 'out',
  tipExitReplay: 'Back to the game',
  tipRoundSelect: 'Choose a game of the match',
  tipToDeal: 'To the deal',
  tipStepBack: 'One move back',
  tipStepFwd: 'One move forward',
  tipToEnd: 'To the end of the game',
  tipDownloadProto: 'Download the protocol (JSON)',

  ghostRoot: 'Root',
  ghostStraight: 'Straight',
  ghostTurn: 'As a turn',
  ghostCross: 'Close the branch',
  endOpen: (v) => `Open end “${v}”`,
  endFresh: (v) => `Fresh end “${v}”: the first tile — straight only (§6.4)`,
  endDead: (v) => `Dead end “${v}”: all seven tiles with this number are on the table`,
  tileRootSuffix: ' — root',
  tileClosedSuffix: ' — branch closed',
  ownerFirst: 'first player',
  ownerSecond: 'second player',

  tipConfirm: 'Move confirmation: a ghost click only selects the move; the tile is placed after you confirm',
  tipTutor: 'Learning mode: hints on what moves are available and how to make them',
  confirmAsk: (tile, mode) => `Play ${tile} ${mode}?`,
  confirmRootAsk: (tile) => `Place the root ${tile}?`,
  confirmYes: 'Place',
  confirmNo: 'Cancel',
  tutorRootHasDouble:
    'Click a double in your hand, then the dashed outline at the centre of the table. A double must become the root — the tree grows from it (§5.2, §6.2).',
  tutorRootNoDouble:
    'No double in hand — click the boneyard pile and draw a tile (§5.3). Once a double comes up, it becomes the root right away.',
  tutorRootMustPlay:
    'The drawn double must become the root (§5.3) — click the outline at the centre of the table.',
  tutorPick:
    'Click a lit tile in your hand — ghosts of its moves appear on the table. Straight continues the branch (§6.3); a turn creates a fork with two fresh ends — a fresh end takes its first tile straight only (§6.4); a double played crosswise closes the branch for good (§7.1). Numbers in circles are open ends; crossed-out ones are dead (§9.1).',
  tutorTurnSides:
    'A turn shows two ghosts: which way the branch bends. The choice does not affect the rules (§6.3), but it helps keep the tree from sprawling.',
  tutorMustPlay:
    'The tile drawn from the boneyard fits — you must play it (§8.2): click one of the ghosts.',
  tutorDraw:
    'No move — click the boneyard pile (§8.2). If the drawn tile fits, you must play it; otherwise it stays in your hand and the turn passes.',
  tutorPass: 'No move and the boneyard is empty — the turn is passed automatically (§8.3).',
  tutorOver:
    'The game is over: points go to whoever holds more (§10.3). Whoever reaches 100 loses the match (§10.5).',
  tutorPending:
    'Check the selected move: place it with the button or by clicking the ghost again; changed your mind — cancel or pick another ghost.',

  versionWord: 'version',
  rulesWord: (v) => `rules ${v}`,
};

const es: Dict = {
  tagline:
    'Dominó donde se cultiva y se poda un árbol. Las manos están abiertas como en ajedrez; ' +
    'el único azar es el pozo boca abajo. Dos jugadores se turnan en una pantalla.',
  fieldBottom: 'Jugador inferior',
  fieldTop: 'Jugador superior',
  fieldLang: 'Idioma',
  defaultP1: 'Jugador 1',
  defaultP2: 'Jugador 2',
  variantText:
    'Variante §11.1 «el doble solo cierra»: el doble no puede jugarse recto — más dura, con trampas.',
  lotDecides: 'Un sorteo decide quién sale primero (§2.5)',
  lotWinner: (name) => `Suma menor — sale primero ${name}`,
  btnLot: 'Echar a suertes',
  btnStart: 'Empezar partida',
  btnContinue: (label) => `Continuar el encuentro ${label}`,
  btnLoadProto: 'Cargar un protocolo para análisis…',

  roundChip: (n) => `juego ${n}`,
  viewChip: (i, n) => `revisión · juego ${i} de ${n}`,
  tipHistory: 'Historial de jugadas: repetición de los juegos',
  tipMark: 'Marcar la autoría: fichas del primero más claras, del segundo más oscuras',
  tipFit: 'Autozoom: mantener todo el árbol a la vista (doble clic en la mesa para activar)',
  tipOrient: 'Fichas en mano: vertical u horizontal',
  tipTotal: 'Total del encuentro (§10.5)',
  tipSound: 'Sonido al colocar fichas',
  tipNew: 'Empezar un encuentro nuevo',
  tipLang: 'Idioma de la interfaz',
  confirmNewMatch: '¿Abandonar el encuentro actual y empezar uno nuevo?',

  statusNewRound: 'Juego nuevo',
  statusRoundOver: 'Juego terminado',
  promptRootHasDouble: (name) => `${name}: juegue un doble — será la raíz`,
  promptRootNoDouble: (name) => `${name}: sin doble — robe una ficha del pozo`,
  promptRootDrawn: (name, tile) => `${name}: robó el doble ${tile} — será la raíz`,
  promptMustPlay: (name, tile) => `${name}: la ficha ${tile} encaja — debe jugarla`,
  promptYourMove: (name) => `${name}: su turno — elija ficha y lugar`,
  promptDraw: (name) => `${name}: sin jugada — robe una ficha del pozo`,
  promptPass: (name) => `${name}: sin jugada y pozo vacío — pasa`,

  logRoot: (name, tile) => `${name}: raíz ${tile}`,
  logPlace: (name, tile, mode) => `${name}: ${tile} ${mode}`,
  modeStraight: 'recto',
  modeTurn: 'en giro',
  modeCross: 'atravesado — rama cerrada',
  logDrawPlayed: (name) => `${name}: ficha del pozo — ¡encaja!`,
  logDrawKept: (name) => `${name}: ficha del pozo — a la mano, turno al rival`,
  logPass: (name) => `${name}: pasa`,
  logFish: '¡Tranca!',
  logOut: '¡Dominó!',

  toastNoDrawHaveMove: 'Hay jugada — no se puede robar (§4.2)',
  toastNoDrawNow: 'Ahora no se puede robar',
  toastMustRoot: (tile) => `El doble robado ${tile} debe ser la raíz (§5.3)`,
  toastMustPlay: (tile) => `Debe jugar la ficha robada ${tile} (§8.2)`,
  toastPassAuto: (name) => `${name} no tiene jugada — pasa`,
  toastFirstOpen: (name) => `Sale primero ${name} — su mano está abierta desde el reparto (§2.4)`,
  toastRoundStart: (n, name) => `Juego ${n}: sale primero ${name}`,
  toastMarkOwners: 'Marcado: fichas del primero más claras, del segundo más oscuras',
  toastProtoSaved: 'Protocolo guardado como JSON',
  toastProtoChecked: 'Protocolo verificado por el motor: todas las jugadas son legales',
  toastProtoLoadFail: (err) => `No se pudo cargar el protocolo: ${err}`,
  toastProtoBroken: (err) => `El protocolo no se reproduce: ${err}`,
  errNotProto: 'esto no es un protocolo de Bonesai',
  errRoundBad: (n, err) => `el juego ${n} no se reproduce (${err})`,

  firstChip: 'primero',
  turnMarkTitle: 'Le toca',
  handMeta: (n, pts) => `${n} ficha${n === 1 ? '' : 's'} · ${pts} pts`,
  handMetaHidden: (n) => `${n} ficha${n === 1 ? '' : 's'} · oculta hasta la primera jugada`,

  pileCount: (n) => `pozo: ${n}`,

  resultFish: '¡Tranca!',
  resultOut: (name) => `¡Dominó de ${name}!`,
  resultFishSub: 'Nadie puede colocar ficha (§9.1). Se cuentan los puntos.',
  resultOutSub: 'Última ficha colocada — mano vacía (§9.2).',
  resultTieNote: ' Sumas iguales — anotan ambos (§10.3).',
  resultEmptyHand: 'mano vacía',
  resultZeroZero: 'El 0:0 como última ficha vale 25 (§10.2).',
  ptsShort: 'pts',
  matchWin: (name) => `¡Victoria del encuentro: ${name}!`,
  matchDraw: 'Encuentro empatado — sumas iguales (§10.5)',
  btnNextRound: 'Siguiente juego',
  btnNewMatch: 'Nuevo encuentro',
  btnHistory: 'Historial de jugadas',
  btnDownloadProto: 'Descargar protocolo',
  nextFirstNote: (name, why) => `Sale primero ${name} — ${why} (§2.5).`,
  whyWinner: 'ganador del juego',
  whySwap: 'tras el empate se intercambian los roles',

  historyLive: 'Historial del encuentro',
  historyExternal: 'Revisión de un protocolo cargado',
  historyDeal: (name) => `Reparto — sale primero ${name}`,
  historyPos: (k, m) => `jugada ${k}/${m}`,
  roundOptDone: (n, cause, s0, s1) => `Juego ${n} — ${cause}, ${s0}:${s1}`,
  roundOptLive: (n) => `Juego ${n} — en curso`,
  causeFishShort: 'tranca',
  causeOutShort: 'dominó',
  tipExitReplay: 'Volver al juego',
  tipRoundSelect: 'Elegir juego del encuentro',
  tipToDeal: 'Al reparto',
  tipStepBack: 'Jugada atrás',
  tipStepFwd: 'Jugada adelante',
  tipToEnd: 'Al final del juego',
  tipDownloadProto: 'Descargar el protocolo (JSON)',

  ghostRoot: 'Raíz',
  ghostStraight: 'Recto',
  ghostTurn: 'En giro',
  ghostCross: 'Cerrar la rama',
  endOpen: (v) => `Extremo abierto «${v}»`,
  endFresh: (v) => `Extremo fresco «${v}»: la primera ficha — solo recto (§6.4)`,
  endDead: (v) => `Extremo muerto «${v}»: las siete fichas con ese número ya están en la mesa`,
  tileRootSuffix: ' — raíz',
  tileClosedSuffix: ' — rama cerrada',
  ownerFirst: 'primer jugador',
  ownerSecond: 'segundo jugador',

  tipConfirm: 'Confirmación de jugada: el clic en la sombra solo elige la jugada; la ficha se coloca tras confirmar',
  tipTutor: 'Modo aprendizaje: pistas sobre qué jugadas hay y cómo hacerlas',
  confirmAsk: (tile, mode) => `¿Colocar ${tile} ${mode}?`,
  confirmRootAsk: (tile) => `¿Colocar la raíz ${tile}?`,
  confirmYes: 'Colocar',
  confirmNo: 'Cancelar',
  tutorRootHasDouble:
    'Haga clic en un doble de su mano y luego en la silueta punteada del centro de la mesa. El doble debe ser la raíz: de ella crece el árbol (§5.2, §6.2).',
  tutorRootNoDouble:
    'Sin doble en la mano — haga clic en el pozo y robe una ficha (§5.3). Cuando salga un doble, será la raíz de inmediato.',
  tutorRootMustPlay:
    'El doble robado debe ser la raíz (§5.3): haga clic en la silueta del centro de la mesa.',
  tutorPick:
    'Haga clic en una ficha iluminada de su mano: aparecerán las sombras de sus jugadas. Recto continúa la rama (§6.3); en giro crea una bifurcación con dos extremos frescos — en un extremo fresco la primera ficha va solo recta (§6.4); el doble atravesado cierra la rama para siempre (§7.1). Los números en círculos son extremos abiertos; los tachados, muertos (§9.1).',
  tutorTurnSides:
    'El giro muestra dos sombras: hacia qué lado doblar la rama. La elección no afecta a las reglas (§6.3), pero evita que el árbol se desparrame.',
  tutorMustPlay:
    'La ficha robada del pozo sirve — está obligado a jugarla (§8.2): haga clic en una de las sombras.',
  tutorDraw:
    'Sin jugada — haga clic en el pozo (§8.2). Si la ficha sirve, debe jugarla; si no, se queda en la mano y el turno pasa.',
  tutorPass: 'Sin jugada y pozo vacío: el turno se pasa solo (§8.3).',
  tutorOver:
    'Juego terminado: puntúa quien retiene más en la mano (§10.3). Pierde el encuentro quien llega a 100 (§10.5).',
  tutorPending:
    'Revise la jugada elegida: colóquela con el botón o con otro clic en la sombra; si cambia de idea — cancele o elija otra sombra.',

  versionWord: 'versión',
  rulesWord: (v) => `reglas ${v}`,
};

const de: Dict = {
  tagline:
    'Domino, bei dem ein Baum wächst und beschnitten wird. Die Hände liegen offen wie beim Schach; ' +
    'der einzige Zufall ist der verdeckte Talon. Zwei Spieler wechseln sich an einem Bildschirm ab.',
  fieldBottom: 'Unterer Spieler',
  fieldTop: 'Oberer Spieler',
  fieldLang: 'Sprache',
  defaultP1: 'Spieler 1',
  defaultP2: 'Spieler 2',
  variantText:
    'Variante §11.1 „der Pasch schließt nur“: ein Pasch darf nicht gerade gelegt werden — härter, mit Fallen.',
  lotDecides: 'Das Los entscheidet, wer zuerst zieht (§2.5)',
  lotWinner: (name) => `Kleinere Summe — ${name} zieht zuerst`,
  btnLot: 'Los werfen',
  btnStart: 'Match starten',
  btnContinue: (label) => `Match fortsetzen ${label}`,
  btnLoadProto: 'Protokoll zur Analyse laden…',

  roundChip: (n) => `Partie ${n}`,
  viewChip: (i, n) => `Ansicht · Partie ${i} von ${n}`,
  tipHistory: 'Zugverlauf: Partien zurückspulen',
  tipMark: 'Zugehörigkeit markieren: Steine des Ersten heller, des Zweiten dunkler',
  tipFit: 'Autozoom: den ganzen Baum im Bild halten (Doppelklick auf den Tisch aktiviert)',
  tipOrient: 'Handsteine: senkrecht oder waagerecht',
  tipTotal: 'Gesamtstand des Matches (§10.5)',
  tipSound: 'Geräusch beim Anlegen',
  tipNew: 'Neues Match beginnen',
  tipLang: 'Sprache der Oberfläche',
  confirmNewMatch: 'Aktuelles Match abbrechen und ein neues beginnen?',

  statusNewRound: 'Neue Partie',
  statusRoundOver: 'Partie beendet',
  promptRootHasDouble: (name) => `${name}: legen Sie einen Pasch — er wird die Wurzel`,
  promptRootNoDouble: (name) => `${name}: kein Pasch — ziehen Sie einen Stein vom Talon`,
  promptRootDrawn: (name, tile) => `${name}: Pasch ${tile} gezogen — er wird die Wurzel`,
  promptMustPlay: (name, tile) => `${name}: Stein ${tile} passt — er muss gelegt werden`,
  promptYourMove: (name) => `${name}: Ihr Zug — Stein und Platz wählen`,
  promptDraw: (name) => `${name}: kein Zug — ziehen Sie vom Talon`,
  promptPass: (name) => `${name}: kein Zug, Talon leer — passen`,

  logRoot: (name, tile) => `${name}: Wurzel ${tile}`,
  logPlace: (name, tile, mode) => `${name}: ${tile} ${mode}`,
  modeStraight: 'gerade',
  modeTurn: 'als Abzweig',
  modeCross: 'quer — Zweig geschlossen',
  logDrawPlayed: (name) => `${name}: Stein vom Talon — passt!`,
  logDrawKept: (name) => `${name}: Stein vom Talon — auf die Hand, Zugwechsel`,
  logPass: (name) => `${name}: passt`,
  logFish: 'Blockiert!',
  logOut: 'Domino!',

  toastNoDrawHaveMove: 'Es gibt einen Zug — Ziehen ist verboten (§4.2)',
  toastNoDrawNow: 'Jetzt darf nicht gezogen werden',
  toastMustRoot: (tile) => `Der gezogene Pasch ${tile} muss die Wurzel werden (§5.3)`,
  toastMustPlay: (tile) => `Der gezogene Stein ${tile} muss gelegt werden (§8.2)`,
  toastPassAuto: (name) => `${name} hat keinen Zug — passt`,
  toastFirstOpen: (name) => `${name} zieht zuerst — die erste Hand liegt ab Beginn offen (§2.4)`,
  toastRoundStart: (n, name) => `Partie ${n}: ${name} zieht zuerst`,
  toastMarkOwners: 'Markierung: Steine des Ersten heller, des Zweiten dunkler',
  toastProtoSaved: 'Protokoll als JSON gespeichert',
  toastProtoChecked: 'Protokoll von der Engine geprüft: alle Züge sind legal',
  toastProtoLoadFail: (err) => `Protokoll konnte nicht geladen werden: ${err}`,
  toastProtoBroken: (err) => `Das Protokoll lässt sich nicht abspielen: ${err}`,
  errNotProto: 'das ist kein Bonesai-Protokoll',
  errRoundBad: (n, err) => `Partie ${n} lässt sich nicht abspielen (${err})`,

  firstChip: 'erster',
  turnMarkTitle: 'Am Zug',
  handMeta: (n, pts) => `${n} Stein${n === 1 ? '' : 'e'} · ${pts} Pkt.`,
  handMetaHidden: (n) => `${n} Stein${n === 1 ? '' : 'e'} · verdeckt bis zum ersten Zug`,

  pileCount: (n) => `Talon: ${n}`,

  resultFish: 'Blockiert!',
  resultOut: (name) => `Domino: ${name}!`,
  resultFishSub: 'Niemand kann anlegen (§9.1). Punkte werden gezählt.',
  resultOutSub: 'Der letzte Stein ist gelegt — die Hand ist leer (§9.2).',
  resultTieNote: ' Gleiche Summen — beide schreiben an (§10.3).',
  resultEmptyHand: 'Hand ist leer',
  resultZeroZero: 'Der 0:0 als letzter Stein zählt 25 (§10.2).',
  ptsShort: 'Pkt.',
  matchWin: (name) => `Matchsieg: ${name}!`,
  matchDraw: 'Match unentschieden — gleiche Summen (§10.5)',
  btnNextRound: 'Nächste Partie',
  btnNewMatch: 'Neues Match',
  btnHistory: 'Zugverlauf',
  btnDownloadProto: 'Protokoll herunterladen',
  nextFirstNote: (name, why) => `${name} zieht zuerst — ${why} (§2.5).`,
  whyWinner: 'Sieger der Partie',
  whySwap: 'nach dem Remis wechseln die Rollen',

  historyLive: 'Zugverlauf des Matches',
  historyExternal: 'Ansicht eines geladenen Protokolls',
  historyDeal: (name) => `Verteilung — ${name} zieht zuerst`,
  historyPos: (k, m) => `Zug ${k}/${m}`,
  roundOptDone: (n, cause, s0, s1) => `Partie ${n} — ${cause}, ${s0}:${s1}`,
  roundOptLive: (n) => `Partie ${n} — läuft`,
  causeFishShort: 'blockiert',
  causeOutShort: 'Domino',
  tipExitReplay: 'Zurück zum Spiel',
  tipRoundSelect: 'Partie des Matches wählen',
  tipToDeal: 'Zur Verteilung',
  tipStepBack: 'Ein Zug zurück',
  tipStepFwd: 'Ein Zug vor',
  tipToEnd: 'Zum Ende der Partie',
  tipDownloadProto: 'Protokoll herunterladen (JSON)',

  ghostRoot: 'Wurzel',
  ghostStraight: 'Gerade',
  ghostTurn: 'Als Abzweig',
  ghostCross: 'Zweig schließen',
  endOpen: (v) => `Offenes Ende „${v}“`,
  endFresh: (v) => `Frisches Ende „${v}“: der erste Stein — nur gerade (§6.4)`,
  endDead: (v) => `Totes Ende „${v}“: alle sieben Steine mit dieser Zahl liegen auf dem Tisch`,
  tileRootSuffix: ' — Wurzel',
  tileClosedSuffix: ' — Zweig geschlossen',
  ownerFirst: 'erster Spieler',
  ownerSecond: 'zweiter Spieler',

  tipConfirm: 'Zugbestätigung: der Klick auf den Schatten wählt den Zug nur aus; gelegt wird nach Bestätigung',
  tipTutor: 'Lernmodus: Hinweise, welche Züge möglich sind und wie man sie macht',
  confirmAsk: (tile, mode) => `${tile} legen: ${mode}?`,
  confirmRootAsk: (tile) => `Wurzel ${tile} legen?`,
  confirmYes: 'Legen',
  confirmNo: 'Abbrechen',
  tutorRootHasDouble:
    'Klicken Sie einen Pasch in Ihrer Hand an, dann die gestrichelte Silhouette in der Tischmitte. Der Pasch muss die Wurzel werden — aus ihr wächst der Baum (§5.2, §6.2).',
  tutorRootNoDouble:
    'Kein Pasch auf der Hand — klicken Sie den Talon an und ziehen Sie einen Stein (§5.3). Kommt ein Pasch, wird er sofort zur Wurzel.',
  tutorRootMustPlay:
    'Der gezogene Pasch muss die Wurzel werden (§5.3) — klicken Sie die Silhouette in der Tischmitte an.',
  tutorPick:
    'Klicken Sie einen hellen Stein in Ihrer Hand an — auf dem Tisch erscheinen die Schatten seiner Züge. Gerade setzt den Zweig fort (§6.3); als Abzweig entsteht eine Gabelung mit zwei frischen Enden — auf ein frisches Ende kommt der erste Stein nur gerade (§6.4); ein Pasch quer schließt den Zweig für immer (§7.1). Zahlen in Kreisen sind offene Enden, durchgestrichene sind tot (§9.1).',
  tutorTurnSides:
    'Der Abzweig zeigt zwei Schatten: in welche Richtung sich der Zweig biegt. Die Wahl berührt die Regeln nicht (§6.3), hält den Baum aber kompakt.',
  tutorMustPlay:
    'Der vom Talon gezogene Stein passt — Sie müssen ihn legen (§8.2): klicken Sie einen der Schatten an.',
  tutorDraw:
    'Kein Zug — klicken Sie den Talon an (§8.2). Passt der Stein, müssen Sie ihn legen; sonst bleibt er in der Hand und der Gegner ist am Zug.',
  tutorPass: 'Kein Zug und der Talon ist leer — der Zug wird automatisch übersprungen (§8.3).',
  tutorOver:
    'Die Partie ist zu Ende: Punkte bekommt, wer mehr auf der Hand behält (§10.3). Das Match verliert, wer 100 erreicht (§10.5).',
  tutorPending:
    'Prüfen Sie den gewählten Zug: legen — per Knopf oder erneutem Klick auf den Schatten; umentschieden — abbrechen oder einen anderen Schatten wählen.',

  versionWord: 'Version',
  rulesWord: (v) => `Regeln ${v}`,
};

const pt: Dict = {
  tagline:
    'Dominó em que se cultiva e poda uma árvore. As mãos ficam abertas como no xadrez; ' +
    'o único acaso é o dorme virado para baixo. Dois jogadores se revezam numa tela.',
  fieldBottom: 'Jogador de baixo',
  fieldTop: 'Jogador de cima',
  fieldLang: 'Idioma',
  defaultP1: 'Jogador 1',
  defaultP2: 'Jogador 2',
  variantText:
    'Variante §11.1 “a dupla só fecha”: a dupla não pode ser jogada reta — mais dura, com armadilhas.',
  lotDecides: 'Um sorteio decide quem joga primeiro (§2.5)',
  lotWinner: (name) => `Soma menor — ${name} joga primeiro`,
  btnLot: 'Sortear',
  btnStart: 'Começar a partida',
  btnContinue: (label) => `Continuar a partida ${label}`,
  btnLoadProto: 'Carregar um protocolo para análise…',

  roundChip: (n) => `jogo ${n}`,
  viewChip: (i, n) => `revisão · jogo ${i} de ${n}`,
  tipHistory: 'Histórico de jogadas: repetição dos jogos',
  tipMark: 'Marcar a autoria: peças do primeiro mais claras, do segundo mais escuras',
  tipFit: 'Autozoom: manter a árvore inteira à vista (clique duplo na mesa ativa)',
  tipOrient: 'Peças na mão: vertical ou horizontal',
  tipTotal: 'Total da partida (§10.5)',
  tipSound: 'Som ao colocar peças',
  tipNew: 'Começar uma nova partida',
  tipLang: 'Idioma da interface',
  confirmNewMatch: 'Abandonar a partida atual e começar outra?',

  statusNewRound: 'Novo jogo',
  statusRoundOver: 'Jogo encerrado',
  promptRootHasDouble: (name) => `${name}: jogue uma dupla — ela será a raiz`,
  promptRootNoDouble: (name) => `${name}: sem dupla — compre uma peça do dorme`,
  promptRootDrawn: (name, tile) => `${name}: comprou a dupla ${tile} — ela será a raiz`,
  promptMustPlay: (name, tile) => `${name}: a peça ${tile} encaixa — é obrigatório jogá-la`,
  promptYourMove: (name) => `${name}: sua vez — escolha a peça e o lugar`,
  promptDraw: (name) => `${name}: sem jogada — compre uma peça do dorme`,
  promptPass: (name) => `${name}: sem jogada e dorme vazio — passa`,

  logRoot: (name, tile) => `${name}: raiz ${tile}`,
  logPlace: (name, tile, mode) => `${name}: ${tile} ${mode}`,
  modeStraight: 'reto',
  modeTurn: 'em curva',
  modeCross: 'atravessado — ramo fechado',
  logDrawPlayed: (name) => `${name}: peça do dorme — encaixa!`,
  logDrawKept: (name) => `${name}: peça do dorme — para a mão, passa a vez`,
  logPass: (name) => `${name}: passa`,
  logFish: 'Trancado!',
  logOut: 'Bateu!',

  toastNoDrawHaveMove: 'Há jogada — não pode comprar (§4.2)',
  toastNoDrawNow: 'Agora não dá para comprar',
  toastMustRoot: (tile) => `A dupla comprada ${tile} deve ser a raiz (§5.3)`,
  toastMustPlay: (tile) => `É obrigatório jogar a peça comprada ${tile} (§8.2)`,
  toastPassAuto: (name) => `${name} não tem jogada — passa`,
  toastFirstOpen: (name) => `${name} joga primeiro — sua mão fica aberta desde a distribuição (§2.4)`,
  toastRoundStart: (n, name) => `Jogo ${n}: ${name} joga primeiro`,
  toastMarkOwners: 'Marcação: peças do primeiro mais claras, do segundo mais escuras',
  toastProtoSaved: 'Protocolo salvo como JSON',
  toastProtoChecked: 'Protocolo verificado pelo motor: todas as jogadas são legais',
  toastProtoLoadFail: (err) => `Não foi possível carregar o protocolo: ${err}`,
  toastProtoBroken: (err) => `O protocolo não se reproduz: ${err}`,
  errNotProto: 'isto não é um protocolo do Bonesai',
  errRoundBad: (n, err) => `o jogo ${n} não se reproduz (${err})`,

  firstChip: 'primeiro',
  turnMarkTitle: 'É a vez de',
  handMeta: (n, pts) => `${n} peça${n === 1 ? '' : 's'} · ${pts} pts`,
  handMetaHidden: (n) => `${n} peça${n === 1 ? '' : 's'} · oculta até a primeira jogada`,

  pileCount: (n) => `dorme: ${n}`,

  resultFish: 'Trancado!',
  resultOut: (name) => `Bateu: ${name}!`,
  resultFishSub: 'Ninguém pode colocar peça (§9.1). Contam-se os pontos.',
  resultOutSub: 'Última peça colocada — a mão está vazia (§9.2).',
  resultTieNote: ' Somas iguais — ambos marcam (§10.3).',
  resultEmptyHand: 'mão vazia',
  resultZeroZero: 'O 0:0 como última peça vale 25 (§10.2).',
  ptsShort: 'pts',
  matchWin: (name) => `Vitória da partida: ${name}!`,
  matchDraw: 'Partida empatada — somas iguais (§10.5)',
  btnNextRound: 'Próximo jogo',
  btnNewMatch: 'Nova partida',
  btnHistory: 'Histórico de jogadas',
  btnDownloadProto: 'Baixar protocolo',
  nextFirstNote: (name, why) => `${name} joga primeiro — ${why} (§2.5).`,
  whyWinner: 'vencedor do jogo',
  whySwap: 'após o empate os papéis se invertem',

  historyLive: 'Histórico da partida',
  historyExternal: 'Revisão de um protocolo carregado',
  historyDeal: (name) => `Distribuição — ${name} joga primeiro`,
  historyPos: (k, m) => `jogada ${k}/${m}`,
  roundOptDone: (n, cause, s0, s1) => `Jogo ${n} — ${cause}, ${s0}:${s1}`,
  roundOptLive: (n) => `Jogo ${n} — em andamento`,
  causeFishShort: 'trancado',
  causeOutShort: 'bateu',
  tipExitReplay: 'Voltar ao jogo',
  tipRoundSelect: 'Escolher o jogo da partida',
  tipToDeal: 'À distribuição',
  tipStepBack: 'Jogada atrás',
  tipStepFwd: 'Jogada adiante',
  tipToEnd: 'Ao fim do jogo',
  tipDownloadProto: 'Baixar o protocolo (JSON)',

  ghostRoot: 'Raiz',
  ghostStraight: 'Reto',
  ghostTurn: 'Em curva',
  ghostCross: 'Fechar o ramo',
  endOpen: (v) => `Ponta aberta “${v}”`,
  endFresh: (v) => `Ponta fresca “${v}”: a primeira peça — só reta (§6.4)`,
  endDead: (v) => `Ponta morta “${v}”: as sete peças com esse número já estão na mesa`,
  tileRootSuffix: ' — raiz',
  tileClosedSuffix: ' — ramo fechado',
  ownerFirst: 'primeiro jogador',
  ownerSecond: 'segundo jogador',

  tipConfirm: 'Confirmação de jogada: o clique na sombra só escolhe a jogada; a peça é colocada após confirmar',
  tipTutor: 'Modo aprendizado: dicas sobre quais jogadas existem e como fazê-las',
  confirmAsk: (tile, mode) => `Colocar ${tile} ${mode}?`,
  confirmRootAsk: (tile) => `Colocar a raiz ${tile}?`,
  confirmYes: 'Colocar',
  confirmNo: 'Cancelar',
  tutorRootHasDouble:
    'Clique numa dupla da sua mão e depois na silhueta pontilhada no centro da mesa. A dupla deve ser a raiz — dela cresce a árvore (§5.2, §6.2).',
  tutorRootNoDouble:
    'Sem dupla na mão — clique no dorme e compre uma peça (§5.3). Quando vier uma dupla, ela vira a raiz na hora.',
  tutorRootMustPlay:
    'A dupla comprada deve ser a raiz (§5.3): clique na silhueta no centro da mesa.',
  tutorPick:
    'Clique numa peça acesa da sua mão — as sombras das jogadas aparecem na mesa. Reto continua o ramo (§6.3); em curva cria uma bifurcação com duas pontas frescas — numa ponta fresca a primeira peça vai só reta (§6.4); a dupla atravessada fecha o ramo para sempre (§7.1). Números em círculos são pontas abertas; riscados, mortas (§9.1).',
  tutorTurnSides:
    'A curva mostra duas sombras: para que lado o ramo dobra. A escolha não afeta as regras (§6.3), mas evita que a árvore se espalhe.',
  tutorMustPlay:
    'A peça comprada do dorme serve — você é obrigado a jogá-la (§8.2): clique numa das sombras.',
  tutorDraw:
    'Sem jogada — clique no dorme (§8.2). Se a peça servir, você deve jogá-la; senão ela fica na mão e a vez passa.',
  tutorPass: 'Sem jogada e dorme vazio — a vez passa sozinha (§8.3).',
  tutorOver:
    'Jogo encerrado: pontua quem retém mais na mão (§10.3). Perde a partida quem chega a 100 (§10.5).',
  tutorPending:
    'Revise a jogada escolhida: coloque com o botão ou com outro clique na sombra; mudou de ideia — cancele ou escolha outra sombra.',

  versionWord: 'versão',
  rulesWord: (v) => `regras ${v}`,
};

const zh: Dict = {
  tagline:
    '一种“种树与修剪”的多米诺：双方手牌像下棋一样公开，唯一的运气来自扣着的牌堆。两名玩家在同一屏幕轮流行棋。',
  fieldBottom: '下方玩家',
  fieldTop: '上方玩家',
  fieldLang: '语言',
  defaultP1: '玩家 1',
  defaultP2: '玩家 2',
  variantText: '变体 §11.1「对子只能封枝」：对子不能直放——更严苛，带陷阱。',
  lotDecides: '抽签决定谁先行（§2.5）',
  lotWinner: (name) => `点数更小——${name} 先行`,
  btnLot: '抽签',
  btnStart: '开始比赛',
  btnContinue: (label) => `继续比赛 ${label}`,
  btnLoadProto: '加载对局记录进行复盘…',

  roundChip: (n) => `第 ${n} 局`,
  viewChip: (i, n) => `复盘 · 第 ${i}/${n} 局`,
  tipHistory: '走子历史：回放已下的各局',
  tipMark: '标记出牌归属：先手的牌更亮，后手的更暗',
  tipFit: '自动缩放：让整棵树保持在视野内（双击桌面开启）',
  tipOrient: '手牌方向：竖放或横放',
  tipTotal: '比赛总分（§10.5）',
  tipSound: '放牌音效',
  tipNew: '开始新比赛',
  tipLang: '界面语言',
  confirmNewMatch: '放弃当前比赛并开始新的一场？',

  statusNewRound: '新的一局',
  statusRoundOver: '本局结束',
  promptRootHasDouble: (name) => `${name}：请打出对子——它将成为根牌`,
  promptRootNoDouble: (name) => `${name}：没有对子——请从牌堆摸一张`,
  promptRootDrawn: (name, tile) => `${name}：摸到对子 ${tile}——它将成为根牌`,
  promptMustPlay: (name, tile) => `${name}：牌 ${tile} 可以出——必须打出它`,
  promptYourMove: (name) => `${name}：轮到您——选择牌和位置`,
  promptDraw: (name) => `${name}：无牌可出——请从牌堆摸一张`,
  promptPass: (name) => `${name}：无牌可出且牌堆已空——过`,

  logRoot: (name, tile) => `${name}：根牌 ${tile}`,
  logPlace: (name, tile, mode) => `${name}：${tile} ${mode}`,
  modeStraight: '直放',
  modeTurn: '转向',
  modeCross: '横放——封枝',
  logDrawPlayed: (name) => `${name}：从牌堆摸牌——正合适！`,
  logDrawKept: (name) => `${name}：从牌堆摸牌——收入手中，轮到对方`,
  logPass: (name) => `${name}：过`,
  logFish: '僵局！',
  logOut: '出完！',

  toastNoDrawHaveMove: '还有牌可出——不能摸牌（§4.2）',
  toastNoDrawNow: '现在不能摸牌',
  toastMustRoot: (tile) => `摸到的对子 ${tile} 必须作为根牌（§5.3）`,
  toastMustPlay: (tile) => `必须打出刚摸到的牌 ${tile}（§8.2）`,
  toastPassAuto: (name) => `${name} 无牌可出——过`,
  toastFirstOpen: (name) => `${name} 先行——先手的手牌自发牌起公开（§2.4）`,
  toastRoundStart: (n, name) => `第 ${n} 局：${name} 先行`,
  toastMarkOwners: '归属标记：先手的牌更亮，后手的更暗',
  toastProtoSaved: '对局记录已保存为 JSON',
  toastProtoChecked: '记录已由引擎校验：所有着法均合法',
  toastProtoLoadFail: (err) => `无法加载记录：${err}`,
  toastProtoBroken: (err) => `记录无法回放：${err}`,
  errNotProto: '这不是 Bonesai 的对局记录',
  errRoundBad: (n, err) => `第 ${n} 局无法回放（${err}）`,

  firstChip: '先手',
  turnMarkTitle: '行棋方',
  handMeta: (n, pts) => `${n} 张 · ${pts} 分`,
  handMetaHidden: (n) => `${n} 张 · 首着前不公开`,

  pileCount: (n) => `牌堆：${n}`,

  resultFish: '僵局！',
  resultOut: (name) => `出完：${name}！`,
  resultFishSub: '无人能出牌（§9.1）。开始计分。',
  resultOutSub: '最后一张牌已打出——手牌为空（§9.2）。',
  resultTieNote: ' 点数相同——双方都记分（§10.3）。',
  resultEmptyHand: '手牌为空',
  resultZeroZero: '0:0 作为手中最后一张计 25 分（§10.2）。',
  ptsShort: '分',
  matchWin: (name) => `比赛获胜：${name}！`,
  matchDraw: '比赛平局——总分相同（§10.5）',
  btnNextRound: '下一局',
  btnNewMatch: '新比赛',
  btnHistory: '走子历史',
  btnDownloadProto: '下载对局记录',
  nextFirstNote: (name, why) => `${name} 先行——${why}（§2.5）。`,
  whyWinner: '本局胜者',
  whySwap: '平局后交换先后手',

  historyLive: '本场比赛的走子历史',
  historyExternal: '复盘已加载的记录',
  historyDeal: (name) => `发牌——${name} 先行`,
  historyPos: (k, m) => `第 ${k}/${m} 着`,
  roundOptDone: (n, cause, s0, s1) => `第 ${n} 局——${cause}，${s0}:${s1}`,
  roundOptLive: (n) => `第 ${n} 局——进行中`,
  causeFishShort: '僵局',
  causeOutShort: '出完',
  tipExitReplay: '返回对局',
  tipRoundSelect: '选择比赛中的一局',
  tipToDeal: '回到发牌',
  tipStepBack: '后退一着',
  tipStepFwd: '前进一着',
  tipToEnd: '到本局结尾',
  tipDownloadProto: '下载对局记录（JSON）',

  ghostRoot: '根牌',
  ghostStraight: '直放',
  ghostTurn: '转向',
  ghostCross: '封枝',
  endOpen: (v) => `开放端「${v}」`,
  endFresh: (v) => `新端「${v}」：第一张牌只能直放（§6.4）`,
  endDead: (v) => `死端「${v}」：带这个点数的七张牌已全部在桌上`,
  tileRootSuffix: '——根牌',
  tileClosedSuffix: '——已封枝',
  ownerFirst: '先手玩家',
  ownerSecond: '后手玩家',

  tipConfirm: '落子确认：点击虚影只是选择走法，确认后才放牌',
  tipTutor: '教学模式：提示有哪些走法以及如何操作',
  confirmAsk: (tile, mode) => `确认放置 ${tile}（${mode}）？`,
  confirmRootAsk: (tile) => `打出根牌 ${tile}？`,
  confirmYes: '放置',
  confirmNo: '取消',
  tutorRootHasDouble:
    '点击手中的对子，再点击桌面中央的虚线轮廓。对子必须成为根牌——整棵树由它长出（§5.2、§6.2）。',
  tutorRootNoDouble:
    '手中没有对子——点击牌堆摸一张牌（§5.3）。摸到对子后，它立刻成为根牌。',
  tutorRootMustPlay: '摸到的对子必须成为根牌（§5.3）——点击桌面中央的轮廓。',
  tutorPick:
    '点击手中亮起的牌，桌上会出现它的走法虚影。直放延续枝条（§6.3）；转向形成分叉，分叉的两端都是新端——新端上第一张牌只能直放（§6.4）；对子横放则永久封枝（§7.1）。圆圈中的数字是开放端，划掉的是死端（§9.1）。',
  tutorTurnSides:
    '转向有两个虚影：枝条往哪边弯。选择不影响规则（§6.3），但能让树形更紧凑。',
  tutorMustPlay: '从牌堆摸到的牌可用——必须打出它（§8.2）：点击其中一个虚影。',
  tutorDraw:
    '无牌可出——点击牌堆（§8.2）。摸到的牌可用就必须打出；不可用则留在手中，轮到对方。',
  tutorPass: '无牌可出且牌堆已空——自动跳过本轮（§8.3）。',
  tutorOver: '本局结束：手中剩余点数多者得分（§10.3）。先到 100 分者输掉整场比赛（§10.5）。',
  tutorPending: '请核对所选走法：按按钮或再次点击虚影放牌；想换——取消或点击其他虚影。',

  versionWord: '版本',
  rulesWord: (v) => `规则 ${v}`,
};


/** Українська відміна: 1 кістка, 2 кістки, 5 кісток. */
function ukTiles(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} кістка`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} кістки`;
  return `${n} кісток`;
}

const uk: Dict = {
  tagline:
    'Доміно, в якому дерево вирощують і підрізають. Руки відкриті, як у шахах; ' +
    'єдина випадковість — закритий базар. Ходять по черзі за одним екраном.',
  fieldBottom: 'Нижній гравець',
  fieldTop: 'Верхній гравець',
  fieldLang: 'Мова',
  defaultP1: 'Гравець 1',
  defaultP2: 'Гравець 2',
  variantText:
    'Варіант §11.1 «дубль лише закриває»: дубль не можна ставити прямо — жорсткіше, з пастками.',
  lotDecides: 'Жереб вирішує, хто ходить першим (§2.5)',
  lotWinner: (name) => `Менша сума — першим ходить ${name}`,
  btnLot: 'Кинути жереб',
  btnStart: 'Почати матч',
  btnContinue: (label) => `Продовжити матч ${label}`,
  btnLoadProto: 'Завантажити протокол для розбору…',

  roundChip: (n) => `партія ${n}`,
  viewChip: (i, n) => `перегляд · партія ${i} з ${n}`,
  tipHistory: 'Історія ходів: перемотування зіграних партій',
  tipMark: 'Позначити належність ходів: кістки першого гравця світліші, другого — темніші',
  tipFit: 'Автомасштаб: тримати все дерево в кадрі (подвійний клік по столу — увімкнути)',
  tipOrient: 'Кістки в руці: вертикально чи горизонтально',
  tipTotal: 'Загальний рахунок матчу (§10.5)',
  tipSound: 'Звук виставляння кісток',
  tipNew: 'Почати новий матч',
  tipLang: 'Мова інтерфейсу',
  confirmNewMatch: 'Покинути поточний матч і почати новий?',

  statusNewRound: 'Нова партія',
  statusRoundOver: 'Партію завершено',
  promptRootHasDouble: (name) => `${name}: виставте дубль — він стане коренем партії`,
  promptRootNoDouble: (name) => `${name}: дубля немає — візьміть кістку з базару`,
  promptRootDrawn: (name, tile) => `${name}: витягнуто дубль ${tile} — він стає коренем`,
  promptMustPlay: (name, tile) => `${name}: кістка ${tile} підходить — зобов'язані сходити нею`,
  promptYourMove: (name) => `${name}: ваш хід — виберіть кістку та місце`,
  promptDraw: (name) => `${name}: ходити нічим — візьміть кістку з базару`,
  promptPass: (name) => `${name}: ходити нічим, базар порожній — пас`,

  logRoot: (name, tile) => `${name}: корінь ${tile}`,
  logPlace: (name, tile, mode) => `${name}: ${tile} ${mode}`,
  modeStraight: 'прямо',
  modeTurn: 'на поворот',
  modeCross: 'упоперек — гілку закрито',
  logDrawPlayed: (name) => `${name}: кістка з базару — підходить!`,
  logDrawKept: (name) => `${name}: кістка з базару — в руку, хід далі`,
  logPass: (name) => `${name}: пас`,
  logFish: 'Риба!',
  logOut: 'Вихід!',

  toastNoDrawHaveMove: 'Є хід — брати з базару не можна (§4.2)',
  toastNoDrawNow: 'Зараз тягнути не можна',
  toastMustRoot: (tile) => `Витягнутий дубль ${tile} зобов'язаний стати коренем (§5.3)`,
  toastMustPlay: (tile) => `Зобов'язані сходити витягнутою кісткою ${tile} (§8.2)`,
  toastPassAuto: (name) => `У ${name} немає ходу — пас`,
  toastFirstOpen: (name) => `Першим ходить ${name} — руки першого відкриті з роздачі (§2.4)`,
  toastRoundStart: (n, name) => `Партія ${n}: першим ходить ${name}`,
  toastMarkOwners: 'Позначення ходів: кістки першого гравця світліші, другого — темніші',
  toastProtoSaved: 'Протокол збережено файлом JSON',
  toastProtoChecked: 'Протокол перевірено рушієм: усі ходи легальні',
  toastProtoLoadFail: (err) => `Не вдалося завантажити протокол: ${err}`,
  toastProtoBroken: (err) => `Протокол не відтворюється: ${err}`,
  errNotProto: 'це не протокол Bonesai',
  errRoundBad: (n, err) => `партія ${n} не відтворюється (${err})`,

  firstChip: 'перший',
  turnMarkTitle: 'Ходить',
  handMeta: (n, pts) => `${ukTiles(n)} · ${pts} очк.`,
  handMetaHidden: (n) => `${ukTiles(n)} · рука закрита до першого ходу`,

  pileCount: (n) => `базар: ${n}`,

  resultFish: 'Риба!',
  resultOut: (name) => `Вихід: ${name}!`,
  resultFishSub: 'Кістку не може поставити ніхто (§9.1). Рахуємо очки.',
  resultOutSub: 'Останню кістку виставлено — рука порожня (§9.2).',
  resultTieNote: " Суми рівні — очки отримують обидва (§10.3).",
  resultEmptyHand: 'рука порожня',
  resultZeroZero: '0:0 останньою кісткою на руці — 25 очок (§10.2).',
  ptsShort: 'очк.',
  matchWin: (name) => `Перемога в матчі: ${name}!`,
  matchDraw: 'Нічия в матчі — рахунки рівні (§10.5)',
  btnNextRound: 'Наступна партія',
  btnNewMatch: 'Новий матч',
  btnHistory: 'Історія ходів',
  btnDownloadProto: 'Зберегти протокол',
  nextFirstNote: (name, why) => `Першим ходить ${name} — ${why} (§2.5).`,
  whyWinner: 'переможець партії',
  whySwap: 'після нічиєї ролі міняються',

  historyLive: 'Історія ходів матчу',
  historyExternal: 'Перегляд завантаженого протоколу',
  historyDeal: (name) => `Роздача — першим ходить ${name}`,
  historyPos: (k, m) => `хід ${k}/${m}`,
  roundOptDone: (n, cause, s0, s1) => `Партія ${n} — ${cause}, ${s0}:${s1}`,
  roundOptLive: (n) => `Партія ${n} — триває`,
  causeFishShort: 'риба',
  causeOutShort: 'вихід',
  tipExitReplay: 'Повернутися до гри',
  tipRoundSelect: 'Вибір партії матчу',
  tipToDeal: 'До роздачі',
  tipStepBack: 'Хід назад',
  tipStepFwd: 'Хід уперед',
  tipToEnd: 'До кінця партії',
  tipDownloadProto: 'Зберегти протокол партій (JSON)',

  ghostRoot: 'Корінь',
  ghostStraight: 'Прямо',
  ghostTurn: 'На поворот',
  ghostCross: 'Закрити гілку',
  endOpen: (v) => `Відкритий кінець «${v}»`,
  endFresh: (v) => `Свіжий кінець «${v}»: першу кістку — лише прямо (§6.4)`,
  endDead: (v) => `Мертвий кінець «${v}»: усі сім кісток із цим числом уже на столі`,
  tileRootSuffix: ' — корінь',
  tileClosedSuffix: ' — гілку закрито',
  ownerFirst: 'перший гравець',
  ownerSecond: 'другий гравець',

  tipConfirm: 'Підтвердження ходу: клік по тіні лише обирає хід, кістка ставиться після підтвердження',
  tipTutor: 'Режим навчання: підказки, які ходи можливі та як їх зробити',
  confirmAsk: (tile, mode) => `Поставити ${tile} ${mode}?`,
  confirmRootAsk: (tile) => `Виставити корінь ${tile}?`,
  confirmYes: 'Поставити',
  confirmNo: 'Скасувати',
  tutorRootHasDouble:
    'Клікніть дубль у руці, потім пунктирний слід у центрі столу. Дубль мусить стати коренем — з нього росте дерево (§5.2, §6.2).',
  tutorRootNoDouble:
    'Дубля в руці немає — клікніть купу базару і візьміть кістку (§5.3). Трапиться дубль — він одразу стане коренем.',
  tutorRootMustPlay:
    'Витягнутий дубль мусить стати коренем (§5.3) — клікніть слід у центрі столу.',
  tutorPick:
    'Клікніть світлу кістку в руці — на столі з’являться тіні її ходів. Прямо продовжує гілку (§6.3); на поворот створює розвилку, обидва кінці якої свіжі — на свіжий першу кістку можна лише прямо (§6.4); упоперек дубль закриває гілку назавжди (§7.1). Цифри в кружках — відкриті кінці, перекреслені — мертві (§9.1).',
  tutorTurnSides:
    'У повороту дві тіні: в який бік зігнути гілку. На правила вибір не впливає (§6.3), але допомагає дереву не розростатися.',
  tutorMustPlay:
    'Кістка з базару підійшла — зобов’язані сходити саме нею (§8.2): клікніть одну з тіней.',
  tutorDraw:
    'Ходити нічим — клікніть купу базару (§8.2). Кістка підійде — зобов’язані сходити нею; ні — залишиться в руці, хід перейде.',
  tutorPass: 'Ходити нічим, базар порожній — хід пропускається сам (§8.3).',
  tutorOver:
    'Партію закінчено: очки отримує той, у кого сума на руках більша (§10.3). Матч програє той, хто набере 100 (§10.5).',
  tutorPending:
    'Перевірте обраний хід: поставити — кнопкою або повторним кліком по тіні; передумали — скасуйте чи оберіть іншу тінь.',

  versionWord: 'версія',
  rulesWord: (v) => `правила ${v}`,
};

const DICTS: Record<Locale, Dict> = { ru, en, es, de, pt, uk, zh };

let current: Locale = 'ru';

/** Текущий словарь. */
export function L(): Dict {
  return DICTS[current];
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  current = locale;
}

/** Подобрать стартовый язык по настройке браузера; для прочих языков — английский. */
export function detectLocale(preferred?: string | null): Locale {
  if (preferred && preferred in DICTS) return preferred as Locale;
  const nav = (navigator.language || 'en').toLowerCase();
  for (const { code } of LOCALES) {
    if (nav.startsWith(code)) return code;
  }
  return 'en';
}
