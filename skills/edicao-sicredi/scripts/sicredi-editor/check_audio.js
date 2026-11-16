// Mede, em cada evento de SFX, quanto o efeito (já com volume + ducking) fica abaixo da voz.
// Uso: node check_audio.js <pasta_output> [margem_db=15]   → sai com código 1 se algum evento passar do limite.
const fs = require('fs'), path = require('path');
const dir = process.argv[2] || 'output', margin = +(process.argv[3] || 15);
function wav(file) {                                   // lê WAV PCM16 mono → Float32Array
  const b = fs.readFileSync(file); let o = 12, sr = 48000;
  while (o < b.length - 8) {
    const id = b.toString('ascii', o, o + 4), sz = b.readUInt32LE(o + 4);
    if (id === 'fmt ') sr = b.readUInt32LE(o + 12);
    if (id === 'data') { const n = Math.floor(Math.min(sz, b.length - o - 8) / 2), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = b.readInt16LE(o + 8 + i * 2) / 32768; return { a, sr }; }
    o += 8 + sz + (sz & 1);
  }
  throw new Error('WAV sem chunk data: ' + file);
}
const voz = wav(path.join(dir, 'stem_voz.wav')), sfx = wav(path.join(dir, 'stem_sfx.wav'));
const events = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8')).sfx;
const db = x => 20 * Math.log10(Math.max(x, 1e-9));
const rms = (w, t0, t1) => { const a = Math.max(0, Math.round(t0 * w.sr)), b = Math.min(w.a.length, Math.round(t1 * w.sr)); let s = 0; for (let i = a; i < b; i++) s += w.a[i] ** 2; return Math.sqrt(s / Math.max(1, b - a)); };
let bad = 0, rows = [];
for (const e of events) {
  if (e.t < 0) continue;
  const rs = db(rms(sfx, e.t, e.t + 0.4)), rv = db(rms(voz, e.t, e.t + 0.4));
  const speaking = rv > -45;                           // sem fala na janela → efeito não compete com a voz
  const gap = rv - rs, ok = !speaking || gap >= margin;
  if (!ok) bad++;
  rows.push(`${e.t.toFixed(2).padStart(6)}s ${e.type.padEnd(6)} sfx ${rs.toFixed(1).padStart(6)} dB  voz ${speaking ? rv.toFixed(1).padStart(6) + ' dB' : '  (sem fala)'}  ${speaking ? 'folga ' + gap.toFixed(1) + ' dB ' : ''}${ok ? '✓' : '✗ ACIMA DO LIMITE'}`);
}
console.log('\nSFX × voz (janela de 0,4s; exigido ≥ ' + margin + ' dB abaixo da voz quando há fala)\n' + rows.join('\n'));
console.log(bad ? `\n✗ ${bad} evento(s) acima do limite` : '\n✓ todos os efeitos abaixo da voz');
process.exit(bad ? 1 : 0);
