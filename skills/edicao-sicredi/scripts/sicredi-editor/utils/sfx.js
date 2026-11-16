// Sons de transição sintetizados (whoosh, boom, tick, chime) e mixados numa trilha WAV.
const fs = require('fs');

const SR = 48000;

function noiseGen(seed = 1) {
  let x = seed;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 2147483648 - 1; };
}

function whoosh(dur = 0.5, peak = 0.32) {
  const n = Math.floor(dur * SR), out = new Float32Array(n), rnd = noiseGen(7);
  let lp = 0, lp2 = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    const env = Math.pow(Math.sin(Math.PI * Math.pow(p, 0.7)), 2);
    const cutoff = 300 + 5200 * Math.sin(Math.PI * p);       // varredura sobe/desce
    const a = 1 - Math.exp(-2 * Math.PI * cutoff / SR);
    lp += a * (rnd() - lp);
    lp2 += a * (lp - lp2);
    out[i] = lp2 * env * 2.6 * peak;
  }
  return out;
}

function boom(dur = 0.9, peak = 0.6) {
  const n = Math.floor(dur * SR), out = new Float32Array(n), rnd = noiseGen(3);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const body = Math.sin(2 * Math.PI * (62 * t - 18 * t * t)) * Math.exp(-4.2 * t);
    lp += 0.25 * (rnd() - lp);
    const click = lp * Math.exp(-60 * t) * 0.9;
    out[i] = Math.tanh((body + click) * 1.6) * peak;
  }
  return out;
}

function tick(peak = 0.32) {
  const n = Math.floor(0.09 * SR), out = new Float32Array(n), rnd = noiseGen(11);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * 1900 * t) * Math.exp(-65 * t) + rnd() * Math.exp(-180 * t) * 0.35) * peak;
  }
  return out;
}

function chime(peak = 0.26) {
  const n = Math.floor(1.5 * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const att = Math.min(1, t / 0.004);
    const s = Math.sin(2 * Math.PI * 1318.5 * t) + 0.6 * Math.sin(2 * Math.PI * 1975.5 * t) * Math.exp(-1.5 * t) + 0.35 * Math.sin(2 * Math.PI * 2637 * t) * Math.exp(-3 * t);
    out[i] = s * Math.exp(-3.2 * t) * att * peak / 1.6;
  }
  return out;
}

const BANK = { whoosh: whoosh(), boom: boom(), tick: tick(), chime: chime() };

function renderTrack(events, duration, file) {
  const n = Math.ceil((duration + 2) * SR);
  const mix = new Float32Array(n);
  for (const ev of events) {
    const snd = BANK[ev.type];
    if (!snd) continue;
    const off = Math.max(0, Math.round(ev.t * SR));
    const g = ev.gain != null ? ev.gain : 1;
    for (let i = 0; i < snd.length && off + i < n; i++) mix[off + i] += snd[i] * g;
  }
  // WAV 16-bit estéreo
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, mix[i])) * 32767 | 0;
    buf.writeInt16LE(v, 44 + i * 4); buf.writeInt16LE(v, 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}

module.exports = { renderTrack };
