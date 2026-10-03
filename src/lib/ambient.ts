// Procedural ambience: rain, fire, waves, wind and a deep brown hum.
// Built from looping noise buffers and filters — light on CPU, no files needed.

import { audioContext } from './sound';
import type { AmbientKind } from './types';

type Stopper = () => void;

let current: { kind: AmbientKind; out: GainNode; stop: Stopper } | null = null;
let level = 0.5;
const buffers = new Map<string, AudioBuffer>();

function noiseBuffer(c: AudioContext, kind: 'white' | 'pink' | 'brown', seconds = 6): AudioBuffer {
  const key = `${kind}-${seconds}-${c.sampleRate}`;
  const cached = buffers.get(key);
  if (cached) return cached;

  const len = Math.floor(c.sampleRate * seconds);
  const fade = Math.floor(c.sampleRate * 0.5);
  const raw = new Float32Array(len + fade);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < raw.length; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'white') raw[i] = w * 0.5;
    else if (kind === 'pink') {
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    } else {
      last = (last + 0.02 * w) / 1.02;
      raw[i] = last * 3.2;
    }
  }
  // Crossfade the tail into the head so the loop point is seamless.
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    if (i < fade) {
      const k = i / fade;
      data[i] = raw[i] * k + raw[len + i] * (1 - k);
    } else data[i] = raw[i];
  }
  buffers.set(key, buf);
  return buf;
}

function loop(c: AudioContext, buf: AudioBuffer): AudioBufferSourceNode {
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  // Random start so the same pattern doesn't line up every time.
  src.start(0, Math.random() * buf.duration);
  return src;
}

function lfo(c: AudioContext, freq: number, depth: number, target: AudioParam): OscillatorNode {
  const o = c.createOscillator();
  o.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = depth;
  o.connect(g).connect(target);
  o.start();
  return o;
}

function biquad(c: AudioContext, type: BiquadFilterType, freq: number, q = 0.7): BiquadFilterNode {
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function build(c: AudioContext, kind: AmbientKind, out: GainNode): Stopper {
  const nodes: AudioNode[] = [];
  const sources: (AudioScheduledSourceNode)[] = [];
  const timers: number[] = [];

  const add = <T extends AudioNode>(n: T) => (nodes.push(n), n);

  if (kind === 'rain') {
    const src = loop(c, noiseBuffer(c, 'pink'));
    sources.push(src);
    const hp = add(biquad(c, 'highpass', 500));
    const lp = add(biquad(c, 'lowpass', 6500));
    const g = add(c.createGain());
    g.gain.value = 0.9;
    src.connect(hp).connect(lp).connect(g).connect(out);

    const rumble = loop(c, noiseBuffer(c, 'brown'));
    sources.push(rumble);
    const rl = add(biquad(c, 'lowpass', 300));
    const rg = add(c.createGain());
    rg.gain.value = 0.35;
    rumble.connect(rl).connect(rg).connect(out);

    // Individual drops: tiny filtered ticks at random moments.
    const drop = noiseBuffer(c, 'white', 1);
    const spawn = () => {
      const n = Math.random() < 0.6 ? 1 : 2;
      for (let i = 0; i < n; i++) {
        const s = c.createBufferSource();
        s.buffer = drop;
        const bp = biquad(c, 'bandpass', 2200 + Math.random() * 3200, 3);
        const dg = c.createGain();
        const t0 = c.currentTime + Math.random() * 0.12;
        dg.gain.setValueAtTime(0.0001, t0);
        dg.gain.exponentialRampToValueAtTime(0.08 + Math.random() * 0.12, t0 + 0.004);
        dg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
        s.connect(bp).connect(dg).connect(out);
        s.start(t0, Math.random() * 0.8, 0.07);
      }
    };
    timers.push(window.setInterval(spawn, 120));
  } else if (kind === 'fire') {
    const src = loop(c, noiseBuffer(c, 'brown'));
    sources.push(src);
    const lp = add(biquad(c, 'lowpass', 420));
    const g = add(c.createGain());
    g.gain.value = 0.9;
    src.connect(lp).connect(g).connect(out);
    sources.push(lfo(c, 0.23, 0.18, g.gain));

    const hiss = loop(c, noiseBuffer(c, 'pink'));
    sources.push(hiss);
    const hb = add(biquad(c, 'bandpass', 3000, 0.6));
    const hg = add(c.createGain());
    hg.gain.value = 0.05;
    hiss.connect(hb).connect(hg).connect(out);

    const crack = noiseBuffer(c, 'white', 1);
    const spawn = () => {
      if (Math.random() > 0.55) return;
      const burst = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < burst; i++) {
        const s = c.createBufferSource();
        s.buffer = crack;
        const hp = biquad(c, 'highpass', 1200 + Math.random() * 2500, 1);
        const cg = c.createGain();
        const t0 = c.currentTime + i * (0.02 + Math.random() * 0.05);
        const peak = 0.12 + Math.random() * 0.35;
        cg.gain.setValueAtTime(0.0001, t0);
        cg.gain.exponentialRampToValueAtTime(peak, t0 + 0.002);
        cg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.02 + Math.random() * 0.03);
        s.connect(hp).connect(cg).connect(out);
        s.start(t0, Math.random() * 0.9, 0.06);
      }
    };
    timers.push(window.setInterval(spawn, 140));
  } else if (kind === 'waves') {
    const src = loop(c, noiseBuffer(c, 'pink', 8));
    sources.push(src);
    const lp = add(biquad(c, 'lowpass', 900));
    const g = add(c.createGain());
    g.gain.value = 0.55;
    src.connect(lp).connect(g).connect(out);
    sources.push(lfo(c, 0.085, 0.45, g.gain));
    sources.push(lfo(c, 0.085, 650, lp.frequency));
  } else if (kind === 'wind') {
    const src = loop(c, noiseBuffer(c, 'white', 8));
    sources.push(src);
    const bp = add(biquad(c, 'bandpass', 600, 1.4));
    const g = add(c.createGain());
    g.gain.value = 0.5;
    src.connect(bp).connect(g).connect(out);
    sources.push(lfo(c, 0.06, 320, bp.frequency));
    sources.push(lfo(c, 0.11, 0.3, g.gain));
  } else if (kind === 'brown') {
    const src = loop(c, noiseBuffer(c, 'brown', 8));
    sources.push(src);
    const lp = add(biquad(c, 'lowpass', 750));
    src.connect(lp).connect(out);
  }

  return () => {
    for (const id of timers) clearInterval(id);
    for (const s of sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
      s.disconnect();
    }
    for (const n of nodes) n.disconnect();
  };
}

export function setAmbientLevel(v: number) {
  level = Math.max(0, Math.min(1, v));
  const c = audioContext();
  if (current && c) current.out.gain.setTargetAtTime(level * 0.6, c.currentTime, 0.15);
}

export function playAmbient(kind: AmbientKind) {
  if (current?.kind === kind) return;
  stopAmbient();
  if (kind === 'off') return;
  const c = audioContext();
  if (!c) return;
  const out = c.createGain();
  out.gain.value = 0.0001;
  out.connect(c.destination);
  const stop = build(c, kind, out);
  out.gain.setTargetAtTime(level * 0.6, c.currentTime, 0.6);
  current = { kind, out, stop };
}

export function stopAmbient() {
  if (!current) return;
  const c = audioContext();
  const { out, stop } = current;
  current = null;
  if (!c) {
    stop();
    return;
  }
  out.gain.setTargetAtTime(0.0001, c.currentTime, 0.25);
  window.setTimeout(() => {
    stop();
    out.disconnect();
  }, 1400);
}

export function ambientKind(): AmbientKind {
  return current?.kind ?? 'off';
}
