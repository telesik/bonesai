// Геометрия сцены стола. Правил не касается (§6.3: раскладка правилам
// безразлична) — здесь проверяется только то, что картинка строится верно.
import { describe, expect, it } from 'vitest';
import { sceneCell, tileTransform } from '../src/ui/board';
import { CELL } from '../src/ui/tile-svg';
import type { Vec } from '../src/engine';

/** Угол из строки transform, приведённый к [0, 360). */
function angleOf(tr: string): number {
  const m = /rotate\((-?[\d.]+)\)/.exec(tr);
  expect(m).not.toBeNull();
  return ((Number(m![1]) % 360) + 360) % 360;
}

function centerOf(tr: string): { x: number; y: number } {
  const m = /translate\((-?[\d.]+) (-?[\d.]+)\)/.exec(tr);
  expect(m).not.toBeNull();
  return { x: Number(m![1]), y: Number(m![2]) };
}

describe('зеркальный стол (§6.3 — только вид)', () => {
  it('sceneCell отражает x, не трогает y и обратим', () => {
    const c: Vec = { x: 3, y: -2 };
    expect(sceneCell(c, false)).toEqual(c);
    expect(sceneCell(c, true)).toEqual({ x: -3, y: -2 });
    expect(sceneCell(sceneCell(c, true), true)).toEqual(c);
  });

  it('корень ложится тупиком влево, в зеркале — тупиком вправо', () => {
    // ROOT_CELLS = [{-1,0},{0,0}]: рост на восток, тупик на западе.
    const a: Vec = { x: -1, y: 0 };
    const b: Vec = { x: 0, y: 0 };
    expect(tileTransform(a, b, false)).toBe(`translate(${(-CELL / 2).toFixed(1)} 0.0) rotate(0.0)`);
    expect(tileTransform(a, b, true)).toBe(`translate(${(CELL / 2).toFixed(1)} 0.0) rotate(180.0)`);
  });

  it('зеркало = отражение центра и поворот на 180° − угол, для всех направлений', () => {
    // Кость занимает две соседние клетки: четыре направления в четырёх местах
    // стола, включая отрицательные координаты и ось x = 0.
    const anchors: Vec[] = [
      { x: 0, y: 0 },
      { x: 3, y: 2 },
      { x: -4, y: 1 },
      { x: 2, y: -5 },
    ];
    const steps: Vec[] = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];
    for (const a of anchors) {
      for (const s of steps) {
        const b: Vec = { x: a.x + s.x, y: a.y + s.y };
        const plain = tileTransform(a, b, false);
        const mirrored = tileTransform(a, b, true);
        const p = centerOf(plain);
        const m = centerOf(mirrored);
        expect(m.x).toBeCloseTo(-p.x, 6);
        expect(m.y).toBeCloseTo(p.y, 6);
        // Ровно этот инвариант и легко потерять: отразить центр, а угол забыть.
        expect(angleOf(mirrored)).toBeCloseTo((360 + 180 - angleOf(plain)) % 360, 6);
      }
    }
  });

  it('дубль поперёк (§7.1) отражается вместе с полуклетками', () => {
    // Поперёк ветки, растущей вниз: кость занимает половинки слева и справа
    // от клетки роста — координаты дробные, и отражение обязано их пережить.
    const a: Vec = { x: 1.5, y: 3 };
    const b: Vec = { x: 2.5, y: 3 };
    const m = centerOf(tileTransform(a, b, true));
    expect(m.x).toBeCloseTo(-2 * CELL, 6);
    expect(m.y).toBeCloseTo(3 * CELL, 6);
    // Дубль симметричен: обе половинки равны, поворот на 180° не виден.
    expect(angleOf(tileTransform(a, b, true))).toBeCloseTo(180, 6);
  });

  it('вертикальная кость в зеркале остаётся вертикальной', () => {
    // Ветка, растущая вниз: отражение по x не должно её «класть».
    const tr = tileTransform({ x: 2, y: 0 }, { x: 2, y: 1 }, true);
    expect(angleOf(tr)).toBeCloseTo(90, 6);
    expect(centerOf(tr).x).toBeCloseTo(-2 * CELL, 6);
  });
});
