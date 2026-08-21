import { describe, expect, it } from 'vitest';
import {
  applyMove,
  fullSet,
  handSum,
  isDouble,
  legalMoves,
  newRound,
  placementsForTile,
  scoreRound,
  startMatch,
  finishRound,
  matchTarget,
  nextRound,
  type GameState,
  type Move,
} from '../src/engine';
import { BASE, ONLY_CLOSES, makeState } from './helpers';

function movesOfType(state: GameState, type: Move['type']): Move[] {
  return legalMoves(state).filter((m) => m.type === type);
}

describe('набор костей (§2.1)', () => {
  it('28 костей, 7 дублей', () => {
    const set = fullSet();
    expect(set).toHaveLength(28);
    expect(set.filter(isDouble)).toHaveLength(7);
    expect(new Set(set).size).toBe(28);
  });
});

describe('раздача (§2.3)', () => {
  it('по 7 в руки, 14 в базар, все кости уникальны', () => {
    const s = newRound({ seed: 42, first: 0, variant: BASE });
    expect(s.hands[0]).toHaveLength(7);
    expect(s.hands[1]).toHaveLength(7);
    expect(s.boneyard).toHaveLength(14);
    const all = [...s.hands[0], ...s.hands[1], ...s.boneyard];
    expect(new Set(all).size).toBe(28);
    expect(s.current).toBe(s.first);
  });
});

describe('фаза поиска корня (§5)', () => {
  it('дубль на руках → только выставление корня (§5.2)', () => {
    // Подбираем seed, при котором у первого игрока есть дубль.
    for (let seed = 0; seed < 100; seed++) {
      const s = newRound({ seed, first: 0, variant: BASE });
      const doubles = s.hands[0].filter(isDouble);
      if (doubles.length === 0) continue;
      const moves = legalMoves(s);
      expect(moves.every((m) => m.type === 'placeRoot')).toBe(true);
      expect(moves).toHaveLength(doubles.length);
      return;
    }
    throw new Error('не нашли подходящий seed');
  });

  it('дубля нет → только добор (§5.3)', () => {
    for (let seed = 0; seed < 200; seed++) {
      const s = newRound({ seed, first: 0, variant: BASE });
      if (s.hands[0].some(isDouble)) continue;
      expect(legalMoves(s)).toEqual([{ type: 'draw' }]);
      return;
    }
    throw new Error('не нашли подходящий seed');
  });

  it('вытянутый дубль обязан стать корнем, не дубль — переход хода (§5.3)', () => {
    let sawForcedRoot = false;
    let sawPassTurn = false;
    for (let seed = 0; seed < 400 && !(sawForcedRoot && sawPassTurn); seed++) {
      const s = newRound({ seed, first: 0, variant: BASE });
      if (s.hands[0].some(isDouble)) continue;
      const after = applyMove(s, { type: 'draw' });
      const drawn = after.log[after.log.length - 1];
      if (drawn?.kind !== 'draw') throw new Error('нет записи о доборе');
      if (isDouble(drawn.tile)) {
        sawForcedRoot = true;
        expect(after.current).toBe(0);
        expect(after.mustPlay).toBe(drawn.tile);
        expect(legalMoves(after)).toEqual([{ type: 'placeRoot', tile: drawn.tile }]);
      } else {
        sawPassTurn = true;
        expect(after.current).toBe(1);
        expect(after.hands[0]).toHaveLength(8);
        expect(after.mustPlay).toBeNull();
      }
    }
    expect(sawForcedRoot).toBe(true);
    expect(sawPassTurn).toBe(true);
  });

  it('корень даёт ровно один открытый конец (§6.2)', () => {
    const s = makeRooted('5-5');
    expect(s.ends).toHaveLength(1);
    expect(s.ends[0]!.value).toBe(5);
    expect(s.phase).toBe('main');
  });
});

/** Состояние сразу после корня tile, руки заданы явно. */
function makeRooted(root: string, hands?: [string[], string[]]): GameState {
  // В базаре оставляем кости с числом корня, чтобы партия не завершилась
  // мгновенной рыбой (§9.1) прямо на корне.
  const v = root.split('-')[0]!;
  const s = makeState({
    hands: hands ?? [[root, '6-1'], ['2-3', '4-6']],
    boneyard: [`${v}-0`, `${v}-1`].filter((t) => !(hands ?? [[root]]).flat().includes(t)),
  });
  const withRootPhase: GameState = { ...s, phase: 'root', ends: [], placed: [], occupied: [] };
  return applyMove(withRootPhase, { type: 'placeRoot', tile: root });
}

describe('ходы после корня (§6)', () => {
  it('первый ход от корня: прямо и на поворот, дубля-близнеца нет (§6.6)', () => {
    const s = makeRooted('5-5', [['5-5', '5-2'], ['1-2', '3-3']]);
    // Ход перешёл ко второму? Нет: makeRooted кладёт корень игроком 0, ход у игрока 1.
    expect(s.current).toBe(1);
    const s2: GameState = { ...s, current: 0 };
    const moves = placementsForTile(s2, '5-2');
    const modes = moves.map((m) => (m.type === 'place' ? m.mode : '')).sort();
    expect(modes).toEqual(['straight', 'turn']);
  });

  it('прямо: конец сменяет число, счёт концов не меняется (§6.3)', () => {
    const s = makeState({
      hands: [['4-5', '2-2'], ['1-1']],
      ends: [{ value: 5 }],
      boneyard: ['4-6'],
    });
    const after = applyMove(s, { type: 'place', tile: '4-5', endId: 0, mode: 'straight' });
    expect(after.phase).toBe('main');
    expect(after.ends).toHaveLength(1);
    expect(after.ends[0]!.value).toBe(4);
    expect(after.ends[0]!.fresh).toBe(false);
  });

  it('на поворот: развилка, оба конца свежие, счёт концов +1 (§6.3, §6.4)', () => {
    const s = makeState({
      hands: [['4-5', '2-2'], ['1-1']],
      ends: [{ value: 5 }],
      boneyard: ['4-6', '5-6'],
    });
    const after = applyMove(s, { type: 'place', tile: '4-5', endId: 0, mode: 'turn' });
    expect(after.phase).toBe('main');
    expect(after.ends).toHaveLength(2);
    const values = after.ends.map((e) => e.value).sort();
    expect(values).toEqual([4, 5]);
    expect(after.ends.every((e) => e.fresh)).toBe(true);
  });

  it('свежий конец: только прямо (§6.4)', () => {
    const s = makeState({
      hands: [['4-2', '4-4'], ['1-1']],
      ends: [{ value: 4, fresh: true }],
      boneyard: ['6-6'],
    });
    const m1 = placementsForTile(s, '4-2');
    expect(m1).toEqual([{ type: 'place', tile: '4-2', endId: 0, mode: 'straight' }]);
    const m2 = placementsForTile(s, '4-4');
    expect(m2).toEqual([{ type: 'place', tile: '4-4', endId: 0, mode: 'straight' }]);
  });

  it('после первой кости ограничение снимается (§6.4)', () => {
    const s = makeState({
      hands: [['4-2', '2-6'], ['1-1']],
      ends: [{ value: 4, fresh: true }],
      boneyard: ['6-6'],
    });
    const after = applyMove(s, { type: 'place', tile: '4-2', endId: 0, mode: 'straight' });
    const next: GameState = { ...after, current: 0 };
    const modes = placementsForTile(next, '2-6')
      .map((m) => (m.type === 'place' ? m.mode : ''))
      .sort();
    expect(modes).toEqual(['straight', 'turn']);
  });
});

describe('дубль (§7)', () => {
  it('дубль прямо сохраняет число конца (§7.1)', () => {
    const s = makeState({
      hands: [['5-5', '2-3'], ['1-1']],
      ends: [{ value: 5 }],
      boneyard: ['5-3'],
    });
    const after = applyMove(s, { type: 'place', tile: '5-5', endId: 0, mode: 'straight' });
    expect(after.phase).toBe('main');
    expect(after.ends).toHaveLength(1);
    expect(after.ends[0]!.value).toBe(5);
  });

  it('дубль поперёк закрывает ветку (§7.1)', () => {
    const s = makeState({
      hands: [['5-5', '2-3'], ['1-2']],
      ends: [{ value: 5 }, { value: 1, id: 7, attach: { x: -3, y: 0 }, dir: { x: -1, y: 0 } }],
      boneyard: ['6-6', '1-3'],
    });
    const after = applyMove(s, { type: 'place', tile: '5-5', endId: 0, mode: 'cross' });
    expect(after.phase).toBe('main');
    expect(after.ends).toHaveLength(1);
    expect(after.ends[0]!.value).toBe(1);
    expect(after.placed.some((p) => p.kind === 'cross')).toBe(true);
  });

  it('дубль нельзя на поворот (§7.2), чужой дубль не закрывает (§7.3)', () => {
    const s = makeState({
      hands: [['5-5', '4-4'], ['1-1']],
      ends: [{ value: 5 }],
      boneyard: ['6-6'],
    });
    const m55 = placementsForTile(s, '5-5').map((m) => (m.type === 'place' ? m.mode : ''));
    expect(m55.sort()).toEqual(['cross', 'straight']);
    expect(placementsForTile(s, '4-4')).toEqual([]);
  });
});

describe('сериализация ходов', () => {
  it('порядок ключей в объекте хода не влияет на легальность (бот/онлайн)', () => {
    const s = makeState({
      hands: [['4-5', '2-2'], ['1-1']],
      ends: [{ value: 5 }],
      boneyard: ['4-6'],
    });
    // Ход, десериализованный с «неканоническим» порядком ключей.
    const move = JSON.parse(
      '{"tile":"4-5","endId":0,"mode":"straight","type":"place"}',
    ) as Move;
    const after = applyMove(s, move);
    expect(after.ends[0]!.value).toBe(4);
  });
});

describe('обязательный ход и базар (§4, §8)', () => {
  it('есть ход → добор нелегален (§4.2)', () => {
    const s = makeState({
      hands: [['5-2'], ['1-1']],
      ends: [{ value: 5 }],
      boneyard: ['6-6'],
    });
    expect(movesOfType(s, 'draw')).toHaveLength(0);
    expect(movesOfType(s, 'pass')).toHaveLength(0);
  });

  it('хода нет → только добор; вытянутая подходящая обязана быть сыграна (§8.2)', () => {
    const s = makeState({
      hands: [['1-2'], ['1-1']],
      ends: [{ value: 5 }],
      boneyard: ['5-3'],
    });
    expect(legalMoves(s)).toEqual([{ type: 'draw' }]);
    const after = applyMove(s, { type: 'draw' });
    expect(after.mustPlay).toBe('5-3');
    expect(after.current).toBe(0);
    const moves = legalMoves(after);
    expect(moves.every((m) => m.type === 'place' && m.tile === '5-3')).toBe(true);
  });

  it('вытянутая неподходящая остаётся в руке, ход переходит (§8.2)', () => {
    const s = makeState({
      hands: [['1-2'], ['5-6']],
      ends: [{ value: 5 }],
      boneyard: ['1-3'],
    });
    const after = applyMove(s, { type: 'draw' });
    expect(after.current).toBe(1);
    expect([...after.hands[0]].sort()).toEqual(['1-2', '1-3']);
    expect(after.boneyard).toHaveLength(0);
  });

  it('базар пуст и хода нет → пас (§8.3)', () => {
    const s = makeState({
      hands: [['1-2'], ['5-6']],
      ends: [{ value: 5 }],
      boneyard: [],
    });
    expect(legalMoves(s)).toEqual([{ type: 'pass' }]);
    const after = applyMove(s, { type: 'pass' });
    expect(after.current).toBe(1);
    expect(after.phase).toBe('main');
  });
});

describe('завершение партии (§9) и очки (§10)', () => {
  it('выход: последняя кость, сумма 0, очки получает соперник (§9.2, §10)', () => {
    const s = makeState({
      hands: [['5-2'], ['6-6', '1-2']],
      ends: [{ value: 5 }],
      boneyard: ['6-1'],
    });
    const after = applyMove(s, { type: 'place', tile: '5-2', endId: 0, mode: 'straight' });
    expect(after.phase).toBe('over');
    expect(after.result).toEqual({
      cause: 'out',
      sums: [0, 15],
      added: [0, 15],
      winner: 0,
    });
  });

  it('рыба: все концы мертвы — никто не может сходить (§9.1)', () => {
    // Единственный конец «1»; после хода 1-2 прямо возникает конец «2»,
    // а костей с двойкой ни в руках, ни в базаре не остаётся — рыба.
    const s = makeState({
      hands: [['1-2', '6-5'], ['6-6']],
      ends: [{ value: 1 }],
      boneyard: [],
    });
    const after = applyMove(s, { type: 'place', tile: '1-2', endId: 0, mode: 'straight' });
    expect(after.phase).toBe('over');
    expect(after.result?.cause).toBe('fish');
    expect(after.result?.sums).toEqual([11, 12]);
    expect(after.result?.winner).toBe(0);
    expect(after.result?.added).toEqual([0, 12]);
  });

  it('0:0 единственной костью стоит 25, иначе 0 (§10.2)', () => {
    expect(handSum(['0-0'])).toBe(25);
    expect(handSum(['0-0', '0-1'])).toBe(1);
    expect(handSum([])).toBe(0);
  });

  it('равные суммы: платят оба, победителя нет (§10.3, §10.4)', () => {
    const r = scoreRound([['3-4'], ['2-5']], 'fish');
    expect(r.added).toEqual([7, 7]);
    expect(r.winner).toBeNull();
  });
});

describe('матч (§2.5, §10.5)', () => {
  it('очки копятся, матч кончается на 100+, проигрывает больший', () => {
    let m = startMatch({ names: ['А', 'Б'], first: 0, variant: BASE, seed: 7 });
    m = {
      ...m,
      round: {
        ...m.round,
        phase: 'over',
        result: { cause: 'fish', sums: [40, 99], added: [0, 99], winner: 0 },
      },
    };
    m = finishRound(m);
    expect(m.totals).toEqual([0, 99]);
    expect(m.outcome).toBeNull();
    // Следующую партию начинает победитель (§2.5).
    m = nextRound(m, 8);
    expect(m.first).toBe(0);
    m = {
      ...m,
      round: {
        ...m.round,
        phase: 'over',
        result: { cause: 'out', sums: [0, 5], added: [0, 5], winner: 0 },
      },
    };
    m = finishRound(m);
    expect(m.totals).toEqual([0, 104]);
    expect(m.outcome).toEqual({ kind: 'loss', loser: 1 });
  });

  it('после ничьей в партии игроки меняются ролями (§2.5)', () => {
    let m = startMatch({ names: ['А', 'Б'], first: 1, variant: BASE, seed: 7 });
    m = {
      ...m,
      round: {
        ...m.round,
        phase: 'over',
        result: { cause: 'fish', sums: [7, 7], added: [7, 7], winner: null },
      },
    };
    m = finishRound(m);
    m = nextRound(m, 9);
    expect(m.first).toBe(0);
  });

  it('цель матча из variant.target: до 50 короче, до 150 длиннее', () => {
    // Правило «нет поля — 100» живёт в одном месте.
    expect(matchTarget(BASE)).toBe(100);
    expect(matchTarget({ ...BASE, target: 50 })).toBe(50);
    // До 50: 99 очков сразу закрывают матч.
    let short = startMatch({
      names: ['А', 'Б'],
      first: 0,
      variant: { ...BASE, target: 50 },
      seed: 7,
    });
    short = {
      ...short,
      round: {
        ...short.round,
        phase: 'over',
        result: { cause: 'fish', sums: [40, 99], added: [0, 99], winner: 0 },
      },
    };
    short = finishRound(short);
    expect(short.outcome).toEqual({ kind: 'loss', loser: 1 });
    // До 150: те же 99 матч не заканчивают, цель переживает nextRound.
    let long = startMatch({
      names: ['А', 'Б'],
      first: 0,
      variant: { ...BASE, target: 150 },
      seed: 7,
    });
    long = {
      ...long,
      round: {
        ...long.round,
        phase: 'over',
        result: { cause: 'fish', sums: [40, 99], added: [0, 99], winner: 0 },
      },
    };
    long = finishRound(long);
    expect(long.outcome).toBeNull();
    long = nextRound(long, 8);
    expect(long.variant.target).toBe(150);
    expect(long.round.variant.target).toBe(150);
  });

  it('равные счёты 100+ — ничья в матче (§10.5)', () => {
    let m = startMatch({ names: ['А', 'Б'], first: 0, variant: BASE, seed: 7 });
    m = {
      ...m,
      totals: [96, 96],
      round: {
        ...m.round,
        phase: 'over',
        result: { cause: 'fish', sums: [7, 7], added: [7, 7], winner: null },
      },
    };
    m = finishRound(m);
    expect(m.totals).toEqual([103, 103]);
    expect(m.outcome).toEqual({ kind: 'draw' });
  });
});

describe('открытые руки (§3)', () => {
  it('рука второго открывается, когда завершён первый ход первого игрока (§3.3)', () => {
    // Пока ход первого не завершён (например, вытянул дубль и обязан его
    // выставить), рука второго закрыта; как только ход перешёл — открыта.
    for (const seed of [42, 7, 101, 2024]) {
      let s = newRound({ seed, first: 0, variant: BASE });
      expect(s.secondRevealed).toBe(false);
      let guard = 0;
      while (s.current === 0 && s.phase !== 'over') {
        expect(s.secondRevealed).toBe(false);
        s = applyMove(s, legalMoves(s)[0]!);
        if (++guard > 10) throw new Error('первый ход затянулся');
      }
      expect(s.secondRevealed).toBe(true);
    }
  });
});

describe('вариант «дубль только закрывает» (§11.1)', () => {
  it('дубль прямо запрещён, на свежем конце дубль вообще без ходов', () => {
    const s = makeState({
      hands: [['5-5'], ['1-1']],
      ends: [{ value: 5 }],
      boneyard: ['6-6'],
      variant: ONLY_CLOSES,
    });
    const modes = placementsForTile(s, '5-5').map((m) => (m.type === 'place' ? m.mode : ''));
    expect(modes).toEqual(['cross']);

    const fresh = makeState({
      hands: [['5-5'], ['1-1']],
      ends: [{ value: 5, fresh: true }],
      boneyard: ['6-6'],
      variant: ONLY_CLOSES,
    });
    expect(placementsForTile(fresh, '5-5')).toEqual([]);
  });
});
