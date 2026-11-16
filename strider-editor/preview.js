// Prévia em quadros parados (antes de qualquer render): desenha cada motion sobre o frame real do vídeo.
// Uso: node preview.js <saida.png> <tempo_original> [tempo_original ...]
// Os tempos são do vídeo ORIGINAL (os mesmos do config). Não precisa de base.mkv.
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
const { createCanvas, loadImage } = require('canvas');
const { buildKeeps, makeMapper } = require('./utils/timeline');

const cfgPath = process.argv.find(a => a.endsWith('.json')) || path.join(__dirname, 'config.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const R = p => path.isAbsolute(p) ? p : path.join(__dirname, p);
const TONEMAP = 'zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p';
const renderers = {};
for (const f of fs.readdirSync(path.join(__dirname, 'renderers'))) renderers[f.replace('.js', '')] = require('./renderers/' + f);

const [a, b] = cfg.range;
const sd = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-ss', String(a), '-t', String(b - a), '-i', R(cfg.input), '-vn',
  '-af', `highpass=f=80,silencedetect=noise=${cfg.silence.noise_db}dB:d=${cfg.silence.min_dur}`, '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
const st = [...sd.matchAll(/silence_start: ([\d.]+)/g)].map(m => +m[1] + a), en = [...sd.matchAll(/silence_end: ([\d.]+)/g)].map(m => +m[1] + a);
const mapper = makeMapper(buildKeeps(cfg, st.map((s, i) => [s, en[i] ?? Infinity])));
const m = t => mapper.map(t);
const W = cfg.width, H = cfg.height, dur = mapper.total + (cfg.tail_hold || 0);
const segs = cfg.segments.map(s => {
  const r = { ...s, outStart: m(s.start), outEnd: s.end >= cfg.range[1] ? dur : m(s.end) };
  for (const [k, v] of Object.entries(s)) {
    if (k.endsWith('_at') && typeof v === 'number') r[k.slice(0, -3).replace(/_(\w)/g, (_, c) => c.toUpperCase()) + 'AtOut'] = m(v);
    if (Array.isArray(v) && v.length && typeof v[0] === 'object' && v[0].at != null) r[k] = v.map(o => ({ ...o, atOut: m(o.at) }));
  }
  return r;
});

(async () => {
  const args = process.argv.slice(2).filter(x => !x.endsWith('.json'));
  const [out, ...times] = args;
  const tiles = [];
  for (const to of times.map(Number)) {
    const t = m(to);
    const seg = segs.find(s => t >= s.outStart && t < s.outEnd);
    const png = path.join(path.dirname(path.resolve(out)), `pv_${to}.png`);
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(to), '-i', R(cfg.input), '-frames:v', '1',
      '-vf', `${TONEMAP},scale=${W}:${H}${seg && seg.bw ? ',hue=s=0' : ''}`, png]);
    const c = createCanvas(W, H), ctx = c.getContext('2d');
    ctx.drawImage(await loadImage(png), 0, 0, W, H);
    if (seg && renderers[seg.type]) { ctx.save(); renderers[seg.type](ctx, seg, t, W, H); ctx.restore(); }
    tiles.push(c);
    fs.unlinkSync(png);
  }
  const tw = 360, th = 640, cols = Math.min(5, tiles.length), rows = Math.ceil(tiles.length / cols);
  const sheet = createCanvas(tw * cols, th * rows), sc = sheet.getContext('2d');
  tiles.forEach((c, i) => sc.drawImage(c, (i % cols) * tw, Math.floor(i / cols) * th, tw, th));
  fs.writeFileSync(out, sheet.toBuffer('image/png'));
  console.log(`✅ Prévia salva em ${out}`);
})();
