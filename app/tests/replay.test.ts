import { describe, expect, it } from 'vitest';
import { replayRound, validateProtocol, type MatchProtocol } from '../src/engine';
import { BASE, ONLY_CLOSES, playout } from './helpers';

describe('протокол ходов и воспроизведение', () => {
  it('партия детерминированно воспроизводится по (seed, first, moves)', () => {
    for (const [seed, variant] of [
      [17, BASE],
      [1234, BASE],
      [99991, ONLY_CLOSES],
    ] as const) {
      const final = playout(seed, (seed % 2) as 0 | 1, variant);
      const replayed = replayRound(
        { seed: final.seed, first: final.first, moves: final.history },
        variant,
      );
      // Полное совпадение: руки, стол, лог, итог.
      expect(replayed.hands).toEqual(final.hands);
      expect(replayed.boneyard).toEqual(final.boneyard);
      expect(replayed.placed).toEqual(final.placed);
      expect(replayed.log).toEqual(final.log);
      expect(replayed.result).toEqual(final.result);
    }
  });

  it('частичное воспроизведение даёт промежуточные состояния', () => {
    const final = playout(42, 0, BASE);
    const mid = replayRound(
      { seed: final.seed, first: final.first, moves: final.history },
      BASE,
      Math.floor(final.history.length / 2),
    );
    expect(mid.phase).not.toBe('over');
    expect(mid.history.length).toBe(Math.floor(final.history.length / 2));
  });

  it('испорченный протокол отбраковывается проверкой', () => {
    const final = playout(7, 1, BASE);
    const badMoves = [...final.history];
    // Портим первый ход выставления: несуществующий конец.
    const idx = badMoves.findIndex((m) => m.type === 'place');
    badMoves[idx] = { type: 'place', tile: '6-6', endId: 999, mode: 'straight' };
    const proto: MatchProtocol = {
      format: 'bonesai-protocol',
      v: 1,
      names: ['А', 'Б'],
      variant: BASE,
      rounds: [{ seed: final.seed, first: final.first, moves: badMoves }],
    };
    const check = validateProtocol(proto);
    expect(check.ok).toBe(false);
    if (!check.ok) {
      expect(check.round).toBe(0);
      expect(check.error).toContain(`ход ${idx + 1}`);
    }
  });
});
