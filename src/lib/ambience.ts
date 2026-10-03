// The ambience mixer: real field recordings (looped seamlessly, see scripts/make-ambience.mjs)
// layered with two synthesized noise colours. Every layer fades in and out; nothing ever clicks.

import { audioContext } from './sound';
import { readSound } from './platform';
import { AMBIENCE_CREDITS } from './ambience-credits';
import type { AmbientKind, AmbientMix } from './types';

export interface AmbienceDef {
  id: AmbientKind;
  icon: string;
  group: 'nature' | 'places' | 'noise';
}

export const AMBIENCES: AmbienceDef[] = [
  { id: 'rain', icon: 'drop', group: 'nature' },
  { id: 'storm', icon: 'cloud', group: 'nature' },
  { id: 'waves', icon: 'wave', group: 'nature' },
  { id: 'wind', icon: 'wind', group: 'nature' },
  { id: 'forest', icon: 'leaf', group: 'nature' },
  { id: 'stream', icon: 'stream', group: 'nature' },
  { id: 'night', icon: 'moon', group: 'nature' },
  { id: 'cafe', icon: 'coffee', group: 'places' },
  { id: 'library', icon: 'book', group: 'places' },
  { id: 'fire', icon: 'flame', group: 'places' },
  { id: 'train', icon: 'train', group: 'places' },
  { id: 'brown', icon: 'volume', group: 'noise' },
  { id: 'pink', icon: 'spark', group: 'noise' },
];

export const AMBIENT_KINDS = AMBIENCES.map((a) => a.id);

/** Ready-made blends. */
export const PRESETS: { id: string; mix: AmbientMix }[] = [
  { id: 'rainyCafe', mix: { cafe: 0.7, rain: 0.55 } },
  { id: 'campNight', mix: { fire: 0.75, night: 0.5 } },
  { id: 'seaside', mix: { waves: 0.8, wind: 0.3 } },
  { id: 'forestBrook', mix: { forest: 0.6, stream: 0.6 } },
  { id: 'cozyStorm', mix: { storm: 0.7, fire: 0.45 } },
  { id: 'nightTrain', mix: { train: 0.7, rain: 0.35 } },
  { id: 'deepWork', mix: { brown: 0.6, library: 0.4 } },
];

const LOOP_SECONDS = Object.fromEntries(AMBIENCE_CREDITS.map((c) => [c.id, c.samples / 48000]));

interface Layer {
  kind: AmbientKind;
  gain: GainNode;
  source: AudioScheduledSourceNode | null;
  nodes: AudioNode[];
  level: number;
  alive: boolean;
}

const layers = new Map<AmbientKind, Layer>();
const buffers = new Map<AmbientKind, Promise<AudioBuffer | null>>();
const releaseTimers = new Map<AmbientKind, number>();
let bus: GainNode | null = null;
let masterLevel = 0.5;

function getBus(c: AudioContext): GainNode {
  if (!bus) {
    bus = c.createGain();
    bus.gain.value = masterLevel * 0.9;
    // A soft shelf takes the edge off the top end, so even a long session stays easy on the ears.
    const soft = c.createBiquadFilter();
    soft.type = 'highshelf';
    soft.frequency.value = 6500;
    soft.gain.value = -3;
    bus.connect(soft).connect(c.destination);
  }
  return bus;
}

function noiseBuffer(c: AudioContext, kind: 'brown' | 'pink', seconds = 8): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds);
  const fade = Math.floor(c.sampleRate * 0.6);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const raw = new Float32Array(len + fade);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < raw.length; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.06;
        b6 = w * 0.115926;
      } else {
        last = (last + 0.02 * w) / 1.02;
        raw[i] = last * 2.6;
      }
    }
    // Crossfade the tail into the head so the loop point is seamless.
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      if (i < fade) {
        const k = i / fade;
        data[i] = raw[i] * Math.sin((k * Math.PI) / 2) + raw[len + i] * Math.cos((k * Math.PI) / 2);
      } else data[i] = raw[i];
    }
  }
  return buf;
}

function loadBuffer(c: AudioContext, kind: AmbientKind): Promise<AudioBuffer | null> {
  const cached = buffers.get(kind);
  if (cached) return cached;
  const p = (async () => {
    if (kind === 'brown' || kind === 'pink') return noiseBuffer(c, kind);
    const bytes = await readSound(kind);
    if (!bytes) return null;
    try {
      return await c.decodeAudioData(bytes);
    } catch {
      return null;
    }
  })();
  buffers.set(kind, p);
  p.then((b) => {
    if (!b) buffers.delete(kind);
  });
  return p;
}

const target = (level: number) => Math.pow(Math.max(0, Math.min(1, level)), 1.6);

async function startLayer(c: AudioContext, layer: Layer) {
  const buf = await loadBuffer(c, layer.kind);
  if (!buf || !layer.alive) return;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const loopEnd = LOOP_SECONDS[layer.kind];
  if (loopEnd && loopEnd <= buf.duration) {
    src.loopStart = 0;
    src.loopEnd = loopEnd;
  }
  const nodes: AudioNode[] = [];
  let head: AudioNode = src;
  if (layer.kind === 'brown' || layer.kind === 'pink') {
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = layer.kind === 'brown' ? 700 : 5200;
    head.connect(lp);
    head = lp;
    nodes.push(lp);
  }
  head.connect(layer.gain);
  // Start somewhere random so a familiar mix never begins the same way twice.
  src.start(c.currentTime + 0.02, Math.random() * (loopEnd || buf.duration) * 0.9);
  layer.source = src;
  layer.nodes = nodes;
  layer.gain.gain.cancelScheduledValues(c.currentTime);
  layer.gain.gain.setValueAtTime(layer.gain.gain.value, c.currentTime);
  layer.gain.gain.setTargetAtTime(target(layer.level), c.currentTime, 0.9);
}

function stopLayer(c: AudioContext, layer: Layer) {
  layer.alive = false;
  layer.gain.gain.cancelScheduledValues(c.currentTime);
  layer.gain.gain.setValueAtTime(layer.gain.gain.value, c.currentTime);
  layer.gain.gain.setTargetAtTime(0.0001, c.currentTime, 0.45);
  const { source, nodes, gain, kind } = layer;
  window.setTimeout(() => {
    try {
      source?.stop();
    } catch {
      /* already stopped */
    }
    source?.disconnect();
    for (const n of nodes) n.disconnect();
    gain.disconnect();
  }, 2600);
  // Decoded loops are a few MB each: let go of the ones that stay unused for a while.
  const old = releaseTimers.get(kind);
  if (old) clearTimeout(old);
  releaseTimers.set(
    kind,
    window.setTimeout(() => {
      if (!layers.has(kind)) buffers.delete(kind);
      releaseTimers.delete(kind);
    }, 90_000),
  );
}

/** Brings the playing layers in line with `mix`, fading whatever changes. */
export function setMix(mix: AmbientMix) {
  const c = audioContext();
  if (!c) return;
  const out = getBus(c);
  for (const [kind, layer] of layers) {
    if (!(mix[kind]! > 0)) {
      stopLayer(c, layer);
      layers.delete(kind);
    }
  }
  for (const kind of AMBIENT_KINDS) {
    const level = mix[kind] ?? 0;
    if (level <= 0) continue;
    const existing = layers.get(kind);
    if (existing) {
      if (existing.level !== level) {
        existing.level = level;
        if (existing.source) existing.gain.gain.setTargetAtTime(target(level), c.currentTime, 0.12);
      }
      continue;
    }
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(out);
    const layer: Layer = { kind, gain, source: null, nodes: [], level, alive: true };
    layers.set(kind, layer);
    void startLayer(c, layer);
  }
}

export function stopAll() {
  setMix({});
}

export function setMasterLevel(v: number) {
  masterLevel = Math.max(0, Math.min(1, v));
  const c = audioContext();
  if (bus && c) bus.gain.setTargetAtTime(masterLevel * 0.9, c.currentTime, 0.1);
}

export function isPlaying(): boolean {
  return layers.size > 0;
}

export function mixSize(mix: AmbientMix): number {
  return Object.values(mix).filter((v) => (v ?? 0) > 0).length;
}
