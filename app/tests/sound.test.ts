// AudioContext переживает 'closed' (баг 0010): на iOS показ системного
// браузера поверх WKWebView может закрыть аудиоконтекст без возможности
// resume(). Мок AudioContext воспроизводит только то, что реально вызывает
// код синтеза (knock/noise) и out() — без загрузки сэмплов (fetch не мокаем,
// loadSamples() сама глотает ошибку сети).
import { beforeEach, describe, expect, it, vi } from 'vitest';

class FakeNode {
  context: unknown;
  gain = {
    setValueAtTime: () => {},
    cancelScheduledValues: () => {},
    linearRampToValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
  };
  frequency = {
    value: 0,
    setValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
  };
  Q = { value: 0 };
  type = '';
  buffer: unknown = null;
  playbackRate = { value: 1 };
  constructor(ctx: unknown) {
    this.context = ctx;
  }
  connect(dest: unknown): unknown {
    return dest;
  }
  start(): void {}
  stop(): void {}
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: 'running' | 'suspended' | 'interrupted' | 'closed' = 'running';
  currentTime = 0;
  sampleRate = 44100;
  destination = {};
  constructor() {
    FakeAudioContext.instances.push(this);
  }
  createGain(): FakeNode {
    return new FakeNode(this);
  }
  createBufferSource(): FakeNode {
    return new FakeNode(this);
  }
  createBiquadFilter(): FakeNode {
    return new FakeNode(this);
  }
  createOscillator(): FakeNode {
    return new FakeNode(this);
  }
  createBuffer(
    _channels: number,
    len: number,
    sampleRate: number,
  ): { sampleRate: number; getChannelData: () => Float32Array } {
    const data = new Float32Array(len);
    return { sampleRate, getChannelData: () => data };
  }
  resume(): Promise<void> {
    if (this.state !== 'closed') this.state = 'running';
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }
}

describe('sound.ts — переживает закрытие AudioContext (баг 0010)', () => {
  beforeEach(() => {
    vi.resetModules();
    FakeAudioContext.instances.length = 0;
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('fetch', () => Promise.reject(new Error('нет сети в тесте')));
  });

  it('после close() следующий звук пересоздаёт контекст, а не молчит', async () => {
    const { setSoundEnabled, playDraw } = await import('../src/ui/sound');

    setSoundEnabled(true);
    expect(FakeAudioContext.instances).toHaveLength(1);
    const first = FakeAudioContext.instances[0]!;

    expect(() => playDraw()).not.toThrow();
    expect(FakeAudioContext.instances).toHaveLength(1); // тот же контекст переиспользован

    await first.close();
    expect(first.state).toBe('closed');

    // До фикса: ensureCtx() видел ctx!==null и звал только resume(), который
    // из 'closed' не выводит — контекст оставался мёртвым, звук пропадал молча.
    expect(() => playDraw()).not.toThrow();
    expect(FakeAudioContext.instances).toHaveLength(2);
    expect(FakeAudioContext.instances[1]!.state).not.toBe('closed');
  });
});
