// Every sound in Emberwise is synthesized on the fly — no audio files, fully offline.

let ctx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let enabled = true;
let volume = 0.7;

export function audioContext(): AudioContext | null {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor({ latencyHint: 'interactive' });
    sfxBus = ctx.createGain();
    sfxBus.gain.value = volume;
    // A gentle compressor keeps stacked sounds from clipping.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    sfxBus.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function configureSfx(on: boolean, vol: number) {
  enabled = on;
  volume = Math.max(0, Math.min(1, vol));
  if (sfxBus && ctx) sfxBus.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
}

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  decay?: number;
  detune?: number;
  slideTo?: number;
}

function tone(freq: number, at: number, opts: ToneOpts = {}) {
  const c = audioContext();
  if (!c || !sfxBus) return;
  const { type = 'sine', gain = 0.18, attack = 0.006, decay = 0.35, detune = 0, slideTo } = opts;
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + decay * 0.8);
  osc.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  osc.connect(g).connect(sfxBus);
  osc.start(t0);
  osc.stop(t0 + attack + decay + 0.05);
}

/** A soft bell: a few inharmonic partials with long, natural decay. */
function bell(freq: number, at: number, gain = 0.16, length = 1.6) {
  const partials: [number, number][] = [
    [1, 1],
    [2.01, 0.42],
    [2.76, 0.26],
    [5.4, 0.08],
  ];
  for (const [ratio, amp] of partials) {
    tone(freq * ratio, at, { gain: gain * amp, attack: 0.004, decay: length / (ratio * 0.7) });
  }
}

const N = {
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880,
  B5: 987.77,
  C6: 1046.5,
  E6: 1318.5,
  G4: 392,
  A4: 440,
  E4: 329.63,
};

function play(fn: () => void) {
  if (!enabled) return;
  try {
    fn();
  } catch {
    /* audio is a nicety, never a failure */
  }
}

export const sfx = {
  complete: () =>
    play(() => {
      tone(N.E5, 0, { type: 'triangle', gain: 0.14, decay: 0.18 });
      tone(N.A5, 0.075, { type: 'triangle', gain: 0.15, decay: 0.32 });
      tone(N.A5 * 2, 0.075, { gain: 0.03, decay: 0.3 });
    }),
  coin: () =>
    play(() => {
      tone(N.B5, 0, { type: 'square', gain: 0.035, decay: 0.07 });
      tone(N.E6, 0.06, { type: 'square', gain: 0.04, decay: 0.22 });
    }),
  pop: () => play(() => tone(620, 0, { gain: 0.07, decay: 0.08, slideTo: 880 })),
  undo: () => play(() => tone(520, 0, { type: 'triangle', gain: 0.08, decay: 0.14, slideTo: 340 })),
  error: () =>
    play(() => {
      tone(220, 0, { type: 'triangle', gain: 0.1, decay: 0.12 });
      tone(196, 0.09, { type: 'triangle', gain: 0.1, decay: 0.16 });
    }),
  levelUp: () =>
    play(() => {
      const seq = [N.C5, N.E5, N.G5, N.C6];
      seq.forEach((f, i) => tone(f, i * 0.09, { type: 'triangle', gain: 0.13, decay: 0.32 }));
      bell(N.C6, 0.38, 0.12, 2);
      tone(N.G4, 0.38, { gain: 0.06, attack: 0.08, decay: 1.2 });
      tone(N.E5, 0.38, { gain: 0.05, attack: 0.08, decay: 1.2 });
    }),
  achievement: () =>
    play(() => {
      [N.G5, N.B5, N.E6].forEach((f, i) => tone(f, i * 0.07, { gain: 0.08, decay: 0.5 }));
      bell(N.E6 / 2, 0.22, 0.08, 1.4);
    }),
  chime: () =>
    play(() => {
      bell(N.E5, 0, 0.16, 2.4);
      bell(N.G5, 0.42, 0.13, 2.4);
      bell(N.C6, 0.84, 0.12, 3);
    }),
  reminder: () =>
    play(() => {
      bell(N.A5, 0, 0.13, 1.4);
      bell(N.E5, 0.28, 0.12, 1.8);
    }),
  start: () =>
    play(() => {
      tone(N.G4, 0, { type: 'sine', gain: 0.1, decay: 0.25, slideTo: N.C5 });
      tone(N.C5 * 2, 0.06, { gain: 0.03, decay: 0.3 });
    }),
};
