/**
 * Lightweight procedural audio via Web Audio API (no asset files).
 * Unlock on first user gesture (browser autoplay policy).
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private musicKind: 'world' | 'boss' | null = null;
  muted = false;

  ensure(): void {
    if (this.ctx) return;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.12;
    this.musicGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.55;
    this.sfxGain.connect(this.master);
  }

  resume(): void {
    this.ensure();
    void this.ctx?.resume();
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType = 'square',
    gain = 0.2,
    dest?: GainNode | null,
  ): void {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx!;
    const out = dest ?? this.sfxGain!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(out);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  private noise(dur: number, gain = 0.15): void {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx!;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain!);
    src.start();
  }

  playJump(): void {
    this.tone(420, 0.06, 'square', 0.12);
    this.tone(560, 0.05, 'square', 0.08);
  }

  playPlant(): void {
    this.tone(180, 0.08, 'triangle', 0.18);
  }

  playThrow(): void {
    this.tone(300, 0.05, 'sawtooth', 0.1);
    this.tone(220, 0.08, 'sawtooth', 0.08);
  }

  playExplode(): void {
    this.noise(0.22, 0.28);
    this.tone(90, 0.18, 'sawtooth', 0.2);
  }

  playHurt(): void {
    this.tone(160, 0.12, 'sawtooth', 0.2);
    this.tone(110, 0.15, 'square', 0.12);
  }

  playPickup(): void {
    this.tone(520, 0.05, 'square', 0.12);
    this.tone(780, 0.08, 'square', 0.1);
  }

  playEnemyDeath(): void {
    this.tone(240, 0.06, 'triangle', 0.12);
    this.tone(140, 0.1, 'triangle', 0.1);
  }

  playCheckpoint(): void {
    this.tone(400, 0.06, 'square', 0.1);
    this.tone(600, 0.08, 'square', 0.1);
    this.tone(800, 0.1, 'square', 0.08);
  }

  playBossHit(): void {
    this.noise(0.1, 0.2);
    this.tone(100, 0.12, 'sawtooth', 0.22);
  }

  playBossPhase(): void {
    this.tone(200, 0.15, 'square', 0.18);
    this.tone(150, 0.2, 'square', 0.15);
    this.tone(100, 0.25, 'sawtooth', 0.12);
  }

  playBossDefeat(): void {
    this.noise(0.35, 0.3);
    this.tone(400, 0.1, 'square', 0.15);
    this.tone(300, 0.12, 'square', 0.12);
    this.tone(200, 0.2, 'square', 0.1);
  }

  playClear(): void {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.12, 'square', 0.12), i * 80);
    });
  }

  playSlamTelegraph(): void {
    this.tone(80, 0.4, 'sine', 0.15);
  }

  startMusic(kind: 'world' | 'boss'): void {
    this.resume();
    if (this.musicKind === kind && this.musicTimer !== null) return;
    this.stopMusic();
    this.musicKind = kind;
    this.musicStep = 0;

    const worldScale = [262, 294, 330, 392, 330, 294];
    const bossScale = [110, 130, 98, 146, 110, 82];
    const scale = kind === 'boss' ? bossScale : worldScale;
    const interval = kind === 'boss' ? 180 : 220;

    this.musicTimer = window.setInterval(() => {
      if (this.muted || !this.ctx || !this.musicGain) return;
      const f = scale[this.musicStep % scale.length];
      this.tone(f, kind === 'boss' ? 0.12 : 0.1, kind === 'boss' ? 'sawtooth' : 'triangle', 0.08, this.musicGain);
      // Bass every 4
      if (this.musicStep % 4 === 0) {
        this.tone(f / 2, 0.15, 'triangle', 0.06, this.musicGain);
      }
      this.musicStep += 1;
    }, interval);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.musicKind = null;
  }
}

let sharedAudio: AudioSystem | null = null;

export function getAudio(): AudioSystem {
  if (!sharedAudio) sharedAudio = new AudioSystem();
  return sharedAudio;
}
