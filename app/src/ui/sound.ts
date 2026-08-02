// Звуки игры. Основа — собственные записи авторов (sounds/*.m4a, записал
// Алексей 2 августа 2026): стук кости о стол в двух дублях, встряхивание
// коробки с домино и перемешивание базара. Права целиком наши, сторонних
// ресурсов нет (CLAUDE.md). Пока записи не загрузились/не декодировались —
// работает прежний WebAudio-синтез, он остаётся фолбэком.

import boxUrl from './sounds/box.m4a';
import place1Url from './sounds/place-1.m4a';
import place2Url from './sounds/place-2.m4a';
import shuffleUrl from './sounds/shuffle.m4a';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
let noiseBuf: AudioBuffer | null = null;

/** Запись с метаданными: границы активного звука и множитель нормализации. */
interface Sample {
  buf: AudioBuffer;
  start: number; // сек: начало звука (тишина в записи отрезана)
  end: number; // сек: конец звука + короткий хвост
  norm: number; // множитель, приводящий пик записи к 1.0
  bursts?: Array<[number, number]>; // отдельные встряхи (для коробки)
}

let samples: { place: [Sample, Sample]; box: Sample; shuffle: Sample } | null = null;
let samplesLoading = false;

function ensureCtx(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  // iOS после прерывания аудиосессии (звонок, Siri) оставляет контекст
  // в нестандартном состоянии 'interrupted' — поэтому не сравнивать с 'suspended'.
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
}

/** Общий выход: через него идёт всё, чтобы mute глушил и уже играющее. */
function out(ac: AudioContext): GainNode {
  if (!master || master.context !== ac) {
    master = ac.createGain();
    master.connect(ac.destination);
  }
  return master;
}

/** Максимум модуля по каналам в сэмпле i. */
function peakAt(chans: Float32Array[], i: number): number {
  let v = 0;
  for (const d of chans) {
    const a = Math.abs(d[i]!);
    if (a > v) v = a;
  }
  return v;
}

/**
 * Разметка записи: пик, границы звука (порог 5% от пика), нормализация.
 * Записи бытовые — уровни и паузы у дублей разные, поэтому всё адаптивно.
 */
function analyze(buf: AudioBuffer, withBursts = false): Sample {
  const n = buf.length;
  const sr = buf.sampleRate;
  const chans: Float32Array[] = [];
  for (let c = 0; c < buf.numberOfChannels; c++) chans.push(buf.getChannelData(c));

  let peak = 0;
  for (let i = 0; i < n; i++) {
    const v = peakAt(chans, i);
    if (v > peak) peak = v;
  }
  if (peak <= 0) return { buf, start: 0, end: buf.duration, norm: 1 };

  const th = peak * 0.05;
  let first = 0;
  while (first < n && peakAt(chans, first) <= th) first++;
  let last = n - 1;
  while (last > first && peakAt(chans, last) <= th) last--;

  const s: Sample = {
    buf,
    start: Math.max(0, first / sr - 0.003),
    end: Math.min(buf.duration, last / sr + 0.06),
    norm: 1 / peak,
  };
  if (withBursts) s.bursts = findBursts(chans, n, sr, peak);
  return s;
}

/**
 * Поиск отдельных встрясок в записи коробки: окна по 20 мс, активные окна
 * (пик > 7% от общего) сливаются через паузы < 150 мс, коротышки отбрасываются.
 */
function findBursts(
  chans: Float32Array[],
  n: number,
  sr: number,
  peak: number,
): Array<[number, number]> {
  const win = Math.floor(sr * 0.02);
  const th = peak * 0.07;
  const active: boolean[] = [];
  for (let w = 0; w * win < n; w++) {
    let v = 0;
    for (let i = w * win; i < Math.min(n, (w + 1) * win); i++) {
      const p = peakAt(chans, i);
      if (p > v) v = p;
    }
    active.push(v > th);
  }
  const maxGap = 8; // окон: ~160 мс
  const minLen = 3; // окон: ~60 мс
  const bursts: Array<[number, number]> = [];
  let from = -1;
  let gap = 0;
  for (let w = 0; w <= active.length; w++) {
    if (w < active.length && active[w]) {
      if (from < 0) from = w;
      gap = 0;
    } else if (from >= 0 && (++gap > maxGap || w === active.length)) {
      const to = w - gap;
      if (to - from + 1 >= minLen) {
        bursts.push([
          Math.max(0, (from * win) / sr - 0.01),
          Math.min(n / sr, ((to + 1) * win) / sr + 0.08),
        ]);
      }
      from = -1;
    }
  }
  return bursts;
}

/** Однократная фоновая загрузка и разметка записей. */
function loadSamples(): void {
  if (samples || samplesLoading) return;
  const ac = ensureCtx();
  if (!ac) return;
  samplesLoading = true;
  const dec = async (url: string): Promise<AudioBuffer> =>
    ac.decodeAudioData(await (await fetch(url)).arrayBuffer());
  Promise.all([dec(place1Url), dec(place2Url), dec(boxUrl), dec(shuffleUrl)])
    .then(([p1, p2, box, shuffle]) => {
      samples = {
        place: [analyze(p1), analyze(p2)],
        box: analyze(box, true),
        shuffle: analyze(shuffle),
      };
    })
    .catch(() => {
      samplesLoading = false; // не вышло — остаёмся на синтезе
    });
}

/**
 * Проигрывание фрагмента записи. vol — громкость к нормализованному пику,
 * rate — скорость (высота), at — задержка, from/to — границы в секундах записи.
 */
function playSample(
  s: Sample,
  opts: {
    vol: number;
    rate?: number;
    at?: number;
    from?: number;
    to?: number;
    fadeIn?: number; // сек: плавный вход для фрагментов, начатых посреди звука
  },
): void {
  const ac = ensureCtx();
  if (!ac) return;
  const rate = opts.rate ?? 1;
  const t = ac.currentTime + (opts.at ?? 0);
  const from = opts.from ?? s.start;
  const to = Math.max(from + 0.03, opts.to ?? s.end);
  const wallDur = (to - from) / rate;

  const src = ac.createBufferSource();
  src.buffer = s.buf;
  src.playbackRate.value = rate;
  const g = ac.createGain();
  const v = opts.vol * s.norm;
  const fadeIn = Math.min(opts.fadeIn ?? 0, wallDur * 0.3);
  const fade = Math.min(0.2, wallDur * 0.3);
  if (fadeIn > 0) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + fadeIn);
  } else {
    g.gain.setValueAtTime(v, t);
  }
  g.gain.setValueAtTime(v, t + wallDur - fade);
  g.gain.linearRampToValueAtTime(0.0001, t + wallDur);
  src.connect(g).connect(out(ac));
  src.start(t, from, to - from);
}

/** Короткий буфер белого шума — «щелчок» контакта кости со столом (синтез). */
function noise(ac: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === ac.sampleRate) return noiseBuf;
  const len = Math.floor(ac.sampleRate * 0.06);
  noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
  const data = noiseBuf.getChannelData(0);
  let s = 22222;
  for (let i = 0; i < len; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    data[i] = (s / 2147483648 - 1) * (1 - i / len);
  }
  return noiseBuf;
}

/**
 * Синтезированный «стук»: фильтрованный щелчок + глухой корпусный удар.
 * freq — тон корпуса, sharp — яркость щелчка, vol — громкость, at — задержка.
 */
function knock(freq: number, sharp: number, vol: number, at = 0): void {
  const ac = ensureCtx();
  if (!ac) return;
  const t = ac.currentTime + at;

  const click = ac.createBufferSource();
  click.buffer = noise(ac);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = sharp;
  bp.Q.value = 1.1;
  const clickGain = ac.createGain();
  clickGain.gain.setValueAtTime(vol, t);
  clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
  click.connect(bp).connect(clickGain).connect(out(ac));
  click.start(t);

  const body = ac.createOscillator();
  body.type = 'sine';
  body.frequency.setValueAtTime(freq, t);
  body.frequency.exponentialRampToValueAtTime(freq * 0.72, t + 0.09);
  const bodyGain = ac.createGain();
  bodyGain.gain.setValueAtTime(vol * 0.8, t);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
  body.connect(bodyGain).connect(out(ac));
  body.start(t);
  body.stop(t + 0.13);
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  if (on) {
    ensureCtx();
    loadSamples();
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(1, ctx.currentTime);
    }
  } else if (ctx && master) {
    // Глушим сразу и уже запущенные звуки (актуально для перемешивания ~2 с).
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(0, ctx.currentTime);
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

/** Выставление кости: прямо/поворот — обычный стук, поперёк — жёстче и ниже. */
export function playPlace(kind: 'root' | 'straight' | 'turn' | 'cross'): void {
  if (!enabled) return;
  const sm = samples;
  if (!sm) {
    loadSamples(); // после сбоя сети пробуем снова при каждом звуке
    switch (kind) {
      case 'root':
        // Корень ставится торжественно: двойной стук.
        knock(200, 2100, 0.16);
        knock(160, 1700, 0.12, 0.07);
        break;
      case 'cross':
        knock(140, 1500, 0.2);
        break;
      default:
        knock(190 + Math.random() * 30, 2000 + Math.random() * 400, 0.15);
    }
    return;
  }
  const [p1, p2] = sm.place;
  switch (kind) {
    case 'root':
      playSample(p1, { vol: 0.65, rate: 0.97 });
      playSample(p2, { vol: 0.5, rate: 1.04, at: 0.09 });
      break;
    case 'cross':
      playSample(Math.random() < 0.5 ? p1 : p2, { vol: 0.75, rate: 0.86 });
      break;
    default:
      playSample(Math.random() < 0.5 ? p1 : p2, {
        vol: 0.6,
        rate: 0.96 + Math.random() * 0.08,
      });
  }
}

/** Добор из базара: случайная встряска коробки; до загрузки — синтез потише. */
export function playDraw(): void {
  if (!enabled) return;
  const box = samples?.box;
  const bursts = box?.bursts;
  if (!box || !bursts || bursts.length === 0) {
    if (!samples) loadSamples();
    knock(240, 2600, 0.07);
    knock(210, 2300, 0.05, 0.045);
    return;
  }
  const [from, to] = bursts[Math.floor(Math.random() * bursts.length)]!;
  playSample(box, { vol: 0.4, rate: 0.97 + Math.random() * 0.06, from, to });
}

/** Начало раунда: случайный фрагмент перемешивания базара; до загрузки — тихо. */
export function playShuffle(): void {
  if (!enabled) return;
  const sh = samples?.shuffle;
  if (!sh) {
    loadSamples();
    return;
  }
  const dur = 2.0;
  const span = Math.max(0, sh.end - sh.start - dur);
  const from = sh.start + Math.random() * span;
  playSample(sh, {
    vol: 0.45,
    rate: 0.98 + Math.random() * 0.04,
    from,
    to: Math.min(sh.end, from + dur),
    fadeIn: 0.06,
  });
}
