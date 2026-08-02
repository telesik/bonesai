// Звуки игры. ВАЖНО (CLAUDE.md): никаких сторонних аудиофайлов — всё
// синтезируется WebAudio на лету, права целиком наши. Если авторы запишут
// собственные звуки, их можно будет подложить сюда вместо синтеза.

let ctx: AudioContext | null = null;
let enabled = false;
let noiseBuf: AudioBuffer | null = null;

function ensureCtx(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Короткий буфер белого шума — «щелчок» контакта кости со столом. */
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
 * Один «стук»: фильтрованный щелчок + глухой корпусный удар.
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
  click.connect(bp).connect(clickGain).connect(ac.destination);
  click.start(t);

  const body = ac.createOscillator();
  body.type = 'sine';
  body.frequency.setValueAtTime(freq, t);
  body.frequency.exponentialRampToValueAtTime(freq * 0.72, t + 0.09);
  const bodyGain = ac.createGain();
  bodyGain.gain.setValueAtTime(vol * 0.8, t);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
  body.connect(bodyGain).connect(ac.destination);
  body.start(t);
  body.stop(t + 0.13);
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  if (on) ensureCtx();
}

export function isSoundEnabled(): boolean {
  return enabled;
}

/** Выставление кости: прямо/поворот — обычный стук, поперёк — жёстче и ниже. */
export function playPlace(kind: 'root' | 'straight' | 'turn' | 'cross'): void {
  if (!enabled) return;
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
}

/** Добор из базара: лёгкий скользящий щелчок потише. */
export function playDraw(): void {
  if (!enabled) return;
  knock(240, 2600, 0.07);
  knock(210, 2300, 0.05, 0.045);
}
